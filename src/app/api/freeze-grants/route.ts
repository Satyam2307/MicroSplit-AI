// POST /api/freeze-grants – Grant a streak freeze day (approver only)
import { NextRequest, NextResponse } from 'next/server';
import {
  mockFreezeGrants,
  mockMemberships,
  mockUsers,
  mockLedgerEvents,
} from '@/lib/mock-data';
import { createLedgerEntry } from '@/lib/ledger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { squadId, memberId, approverId, date, reason } = body;

    if (!squadId || !memberId || !approverId || !date || !reason) {
      return NextResponse.json(
        { success: false, error: 'squadId, memberId, approverId, date, and reason are required' },
        { status: 400 }
      );
    }

    // Role gate: Only approvers or owners can grant freezes
    const approverMembership = mockMemberships.find(
      (m) => m.squadId === squadId && m.userId === approverId
    );
    if (!approverMembership || !['owner', 'approver'].includes(approverMembership.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Only squad approvers or owners can authorize streak freeze grants',
        },
        { status: 403 }
      );
    }

    // Check if freeze already exists for this member on this date
    const exists = mockFreezeGrants.some(
      (f) => f.memberId === memberId && f.date === date
    );
    if (exists) {
      return NextResponse.json(
        { success: false, error: `Freeze grant already active for this member on ${date}` },
        { status: 409 }
      );
    }

    const memberUser = mockUsers.find((u) => u.id === memberId);
    const approverUser = mockUsers.find((u) => u.id === approverId);

    const grant = {
      id: `frz_${Date.now()}`,
      squadId,
      memberId,
      memberName: memberUser?.name || 'Member',
      approverId,
      approverName: approverUser?.name || 'Approver',
      date, // YYYY-MM-DD
      reason,
      createdAt: new Date().toISOString(),
    };

    mockFreezeGrants.push(grant);

    // Cryptographic SHA-256 Ledger Event: freeze_granted
    const prevHash = mockLedgerEvents.length > 0
      ? mockLedgerEvents[mockLedgerEvents.length - 1].hash
      : null;

    const ledgerEntry = createLedgerEntry(
      `led_${mockLedgerEvents.length + 1}`,
      'freeze_granted',
      grant.id,
      0, // freeze grant has 0 monetary amount
      {
        squadId,
        memberId,
        memberName: grant.memberName,
        approverId,
        approverName: grant.approverName,
        date,
        reason,
      },
      prevHash
    );

    mockLedgerEvents.push(ledgerEntry);

    return NextResponse.json(
      {
        success: true,
        data: grant,
        ledgerHash: ledgerEntry.hash,
        message: 'Freeze grant approved and recorded on immutable ledger',
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get('memberId');
  const squadId = request.nextUrl.searchParams.get('squadId');

  let grants = [...mockFreezeGrants];
  if (memberId) grants = grants.filter((g) => g.memberId === memberId);
  if (squadId) grants = grants.filter((g) => g.squadId === squadId);

  return NextResponse.json({ success: true, data: grants });
}
