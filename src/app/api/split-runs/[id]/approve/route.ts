// POST /api/split-runs/:id/approve – Approve or dispute a split run
import { NextRequest, NextResponse } from 'next/server';
import { mockSplitRuns, mockApprovals, mockLedgerEvents } from '@/lib/mock-data';
import { createLedgerEntry } from '@/lib/ledger';
import { requireSquadRole } from '@/lib/authorization';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const run = mockSplitRuns.find((r) => r.id === id);

  if (!run) {
    return NextResponse.json({ success: false, error: 'Split run not found' }, { status: 404 });
  }

  const access = await requireSquadRole(run.squadId ?? '', ['owner', 'approver']);
  if (!access.ok) return access.response;

  if (run.status === 'paid') {
    return NextResponse.json({ success: false, error: 'Cannot modify a paid run' }, { status: 409 });
  }

  try {
    const body = await request.json();
    const { decision, note } = body;

    if (!['approved', 'disputed', 'adjusted'].includes(decision)) {
      return NextResponse.json(
        { success: false, error: 'decision must be: approved, disputed, or adjusted' },
        { status: 400 }
      );
    }

    // Create approval record
    const approval = {
      id: `apr_${Date.now()}`,
      runId: id,
      approverId: access.value.userId,
      approverName: access.value.name || access.value.email || 'Squad approver',
      decision,
      note: note || '',
      createdAt: new Date().toISOString(),
    };
    mockApprovals.push(approval);

    // Update run status
    const runIdx = mockSplitRuns.findIndex((r) => r.id === id);
    if (runIdx >= 0) {
      mockSplitRuns[runIdx] = {
        ...mockSplitRuns[runIdx],
        status: decision === 'approved' ? 'approved' : decision === 'disputed' ? 'disputed' : 'pending_approval',
      };
    }

    // Ledger event
    const prevHash = mockLedgerEvents.length > 0
      ? mockLedgerEvents[mockLedgerEvents.length - 1].hash
      : null;
    const ledgerEntry = createLedgerEntry(
      `led_${Date.now()}`,
      'split_approved',
      id,
      run.poolMinor,
      { approver: access.value.name || access.value.email, decision },
      prevHash
    );
    mockLedgerEvents.push(ledgerEntry);

    return NextResponse.json({ success: true, data: { approval, runStatus: decision === 'approved' ? 'approved' : 'disputed' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
