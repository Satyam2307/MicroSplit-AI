// GET /api/ledger/verify – Verify the hash chain integrity
import { NextResponse } from 'next/server';
import { mockLedgerEvents } from '@/lib/mock-data';
import { verifyLedgerChain } from '@/lib/ledger';

export async function GET() {
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
