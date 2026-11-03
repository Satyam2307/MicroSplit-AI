// POST /api/squads/:id/revenue – Record revenue event
import { NextRequest, NextResponse } from 'next/server';
import { createLedgerEntry } from '@/lib/ledger';
import { mockLedgerEvents } from '@/lib/mock-data';
import { getPrisma } from '@/lib/prisma';
import { requireSquadRole } from '@/lib/authorization';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: squadId } = await params;
  const access = await requireSquadRole(squadId, ['owner', 'approver']);
  if (!access.ok) return access.response;

  try {
    const body = await request.json();
    const { amountMinor, currency = 'USD', source, description } = body;

    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0 || typeof source !== 'string') {
      return NextResponse.json(
        { success: false, error: 'amountMinor must be a positive integer and source is required' },
        { status: 400 }
      );
    }

    const event = await getPrisma().revenueEvent.create({
      data: {
        squadId,
        amountMinor,
        currency: typeof currency === 'string' ? currency : 'USD',
        source,
        description: typeof description === 'string' ? description : null,
      },
    });

    // Write ledger event
    const prevHash = mockLedgerEvents.length > 0
      ? mockLedgerEvents[mockLedgerEvents.length - 1].hash
      : null;
    const ledgerEntry = createLedgerEntry(
      `led_${Date.now()}`,
      'revenue_recorded',
      event.id,
      event.amountMinor,
      { squad: squadId, source: event.source },
      prevHash
    );
    mockLedgerEvents.push(ledgerEntry);

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
