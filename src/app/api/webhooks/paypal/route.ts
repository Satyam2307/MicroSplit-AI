// POST /api/webhooks/paypal – Process PayPal payout webhooks
import { NextRequest, NextResponse } from 'next/server';
import { mockPayoutBatches, mockLedgerEvents } from '@/lib/mock-data';
import { createLedgerEntry } from '@/lib/ledger';
import { verifyWebhookSignature, isSandboxConfigured } from '@/lib/paypal';

// Track processed event IDs for idempotency
const processedEventIds = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const event = JSON.parse(bodyText);

    // Idempotency check
    if (processedEventIds.has(event.id)) {
      return NextResponse.json({ success: true, message: 'Event already processed' });
    }

    // Verify signature in production
    if (isSandboxConfigured()) {
      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => { headers[key] = value; });
      
      const verified = await verifyWebhookSignature(headers, bodyText);
      if (!verified) {
        return NextResponse.json(
          { success: false, error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    const eventType = event.event_type;
    const resource = event.resource;

    // Process payout events
    if (eventType === 'PAYMENT.PAYOUTSBATCH.SUCCESS' ||
        eventType === 'PAYMENT.PAYOUTSBATCH.DENIED') {
      const paypalBatchId = resource.batch_header?.payout_batch_id;
      const batch = mockPayoutBatches.find((b) => b.paypalBatchId === paypalBatchId);
      if (batch) {
        batch.status = eventType.includes('SUCCESS') ? 'success' : 'denied';
      }
    }

    if (eventType === 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED' ||
        eventType === 'PAYMENT.PAYOUTS-ITEM.FAILED' ||
        eventType === 'PAYMENT.PAYOUTS-ITEM.UNCLAIMED') {
      const paypalItemId = resource.payout_item_id;
      const senderItemId = resource.payout_item?.sender_item_id;

      for (const batch of mockPayoutBatches) {
        const item = batch.items.find(
          (i) => i.senderItemId === senderItemId || i.paypalItemId === paypalItemId
        );
        if (item) {
          const newStatus = eventType.includes('SUCCEEDED') ? 'success' :
                          eventType.includes('FAILED') ? 'failed' : 'unclaimed';
          item.status = newStatus;
          if (resource.errors) {
            item.failureReason = resource.errors.message || resource.errors.name;
          }

          // Ledger event
          const prevHash = mockLedgerEvents.length > 0
            ? mockLedgerEvents[mockLedgerEvents.length - 1].hash
            : null;
          const ledgerEntry = createLedgerEntry(
            `led_${Date.now()}`,
            'payout_item_status',
            item.id,
            item.amountMinor,
            { status: newStatus, recipient: item.recipientEmail, reason: item.failureReason },
            prevHash
          );
          mockLedgerEvents.push(ledgerEntry);
          break;
        }
      }
    }

    processedEventIds.add(event.id);
    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
