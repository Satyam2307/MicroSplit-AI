// POST /api/split-runs/:id/payout – Create PayPal payout batch
import { NextRequest, NextResponse } from 'next/server';
import { mockSplitRuns, mockPayoutBatches, mockMemberships, mockLedgerEvents } from '@/lib/mock-data';
import { createLedgerEntry } from '@/lib/ledger';
import { toPayPalAmount } from '@/lib/money';
import {
  isSandboxConfigured,
  createPayoutBatch,
  getBusinessBalance,
  mockPayoutBatch,
  type PayoutRecipient,
} from '@/lib/paypal';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const run = mockSplitRuns.find((r) => r.id === id);

  if (!run) {
    return NextResponse.json({ success: false, error: 'Split run not found' }, { status: 404 });
  }

  if (run.status !== 'approved') {
    return NextResponse.json(
      { success: false, error: `Run must be approved before payout. Current status: ${run.status}` },
      { status: 409 }
    );
  }

  try {
    // Check batch size limit
    if (run.lines.length > 15000) {
      return NextResponse.json(
        { success: false, error: `Batch has ${run.lines.length} items — exceeds PayPal limit of 15,000. Use Large Batch Payouts API.` },
        { status: 400 }
      );
    }

    // Build batch
    const senderBatchId = `${run.id}_${new Date().toISOString().replace(/[:.]/g, '')}`;
    const recipients: PayoutRecipient[] = run.lines.map((line) => {
      const membership = mockMemberships.find((m) => m.userId === line.memberId);
      return {
        senderItemId: `${run.id}_${line.memberId}`,
        email: membership?.payoutReceiver || `${line.memberId}@paypal.demo`,
        amountValue: toPayPalAmount(line.amountMinor),
        currency: 'USD',
        note: `MicroSplit: ${line.rationale.contribution_summary}`,
      };
    });

    let result;
    if (isSandboxConfigured()) {
      // Balance check
      const balance = await getBusinessBalance();
      const feeBuffer = Math.round(run.poolMinor * 0.03); // 3% estimated fees
      if (balance < run.poolMinor + feeBuffer) {
        return NextResponse.json(
          { success: false, error: `Insufficient balance. Need ${toPayPalAmount(run.poolMinor + feeBuffer)}, have ${toPayPalAmount(balance)}` },
          { status: 400 }
        );
      }
      result = await createPayoutBatch(senderBatchId, 'MicroSplit AI Payout', recipients);
    } else {
      result = mockPayoutBatch(senderBatchId, recipients);
    }

    // Create batch record
    const batch = {
      id: `bat_${Date.now()}`,
      runId: id,
      senderBatchId,
      paypalBatchId: result.batchId,
      status: 'processing',
      totalMinor: run.poolMinor,
      createdAt: new Date().toISOString(),
      items: run.lines.map((line) => {
        const membership = mockMemberships.find((m) => m.userId === line.memberId);
        return {
          id: `pi_${Date.now()}_${line.memberId}`,
          batchId: `bat_${Date.now()}`,
          lineId: line.id,
          senderItemId: `${run.id}_${line.memberId}`,
          paypalItemId: '',
          amountMinor: line.amountMinor,
          recipientName: line.memberName,
          recipientEmail: membership?.payoutReceiver || '',
          status: 'pending',
          failureReason: null,
        };
      }),
    };

    mockPayoutBatches.push(batch);

    // Ledger event
    const prevHash = mockLedgerEvents.length > 0
      ? mockLedgerEvents[mockLedgerEvents.length - 1].hash
      : null;
    const ledgerEntry = createLedgerEntry(
      `led_${Date.now()}`,
      'payout_created',
      batch.id,
      run.poolMinor,
      { batch: senderBatchId, items: run.lines.length, paypalBatch: result.batchId },
      prevHash
    );
    mockLedgerEvents.push(ledgerEntry);

    return NextResponse.json({ success: true, data: batch }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Payout failed' },
      { status: 500 }
    );
  }
}
