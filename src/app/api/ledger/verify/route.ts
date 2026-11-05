// GET /api/ledger/verify – Verify the hash chain integrity
import { NextRequest, NextResponse } from 'next/server';
import { mockLedgerEvents } from '@/lib/mock-data';
import { verifyLedgerChain } from '@/lib/ledger';
import { requireAuthenticatedActor } from '@/lib/authorization';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
  const rateLimit = checkRateLimit(`ledger_verify_${clientIp}`, {
    intervalMs: 60000,
    maxRequests: 30,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please slow down.' },
      { status: 429 }
    );
  }

  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const result = verifyLedgerChain(mockLedgerEvents);
  return NextResponse.json({
    success: true,
    data: {
      valid: result.valid,
      totalEvents: result.totalEvents,
      brokenAt: result.brokenAt,
      checkedAt: new Date().toISOString(),
    },
  });
}
