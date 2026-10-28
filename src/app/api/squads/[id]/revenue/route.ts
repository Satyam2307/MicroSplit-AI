// POST /api/squads/:id/revenue – Record revenue event
import { NextRequest, NextResponse } from 'next/server';
import { mockRevenueEvents } from '@/lib/mock-data';
import { createLedgerEntry, type LedgerEntry } from '@/lib/ledger';
import { mockLedgerEvents } from '@/lib/mock-data';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: squadId } = await params;
  try {
    const body = await request.json();
    const { amountMinor, currency = 'USD', source, description } = body;

    if (!amountMinor || amountMinor <= 0) {
      return NextResponse.json(
        { success: false, error: 'amountMinor must be a positive integer' },
        { status: 400 }
      );
    }

    const event = {
      id: `rev_${Date.now()}`,
      squadId,
      amountMinor: Math.round(amountMinor),
      currency,
      source: source || 'manual',
      description: description || '',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    mockRevenueEvents.push(event);

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
