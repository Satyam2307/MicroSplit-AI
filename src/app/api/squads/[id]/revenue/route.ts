// POST /api/squads/:id/revenue – Record revenue event
import { NextRequest, NextResponse } from 'next/server';
import { createLedgerEntry } from '@/lib/ledger';
import { mockLedgerEvents, mockRevenueEvents, mockSquads, type MockRevenueEvent } from '@/lib/mock-data';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: squadId } = await params;

  try {
    const body = await request.json();
    const { amountMinor, currency = 'USD', source, description } = body;

    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0 || typeof source !== 'string') {
      return NextResponse.json(
        { success: false, error: 'amountMinor must be a positive integer and source is required' },
        { status: 400 }
      );
    }

    const eventId = `rev_${Date.now()}`;
    const newRevenueEvent: MockRevenueEvent = {
      id: eventId,
      squadId,
      amountMinor,
      currency: typeof currency === 'string' ? currency : 'USD',
      source,
      description: typeof description === 'string' ? description : '',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    mockRevenueEvents.push(newRevenueEvent);

    // Update squad total revenue
    const squad = mockSquads.find((s) => s.id === squadId);
    if (squad) {
      squad.totalRevenue = (squad.totalRevenue || 0) + amountMinor;
    }

    // Write ledger event
    const prevHash = mockLedgerEvents.length > 0
      ? mockLedgerEvents[mockLedgerEvents.length - 1].hash
      : null;
    const ledgerEntry = createLedgerEntry(
      `led_${Date.now()}`,
      'revenue_recorded',
      eventId,
      amountMinor,
      { squad: squadId, source },
      prevHash
    );
    mockLedgerEvents.push(ledgerEntry);

    return NextResponse.json({
      success: true,
      data: newRevenueEvent,
      ledger: ledgerEntry,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to record revenue event' },
      { status: 500 }
    );
  }
}
