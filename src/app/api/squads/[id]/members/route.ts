import { NextRequest, NextResponse } from 'next/server';
import { mockMemberships, mockUsers, mockSquads, type MockMembership } from '@/lib/mock-data';
import { isValidPayPalEmail, maskPayPalEmail } from '@/lib/payout-safety';

const ASSIGNABLE_ROLES = ['approver', 'contributor', 'viewer'] as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: squadId } = await params;

  const rawMembers = mockMemberships.filter((m) => m.squadId === squadId);

  const data = rawMembers.map((member) => {
    const user = mockUsers.find((u) => u.id === member.userId) || {
      id: member.userId,
      name: member.memberName || 'Member',
      email: member.payoutReceiver || `${member.userId}@microsplit.demo`,
      avatar: '/avatars/alex.svg',
    };
    const configured = Boolean(member.payoutReceiver);
    return {
      id: member.id,
      squadId: member.squadId,
      userId: member.userId,
      role: member.role,
      payoutReceiver: member.payoutReceiver,
      payoutReceiverType: member.payoutReceiverType || 'EMAIL',
      payoutReceiverConfigured: configured,
      payoutReceiverMasked: configured ? maskPayPalEmail(member.payoutReceiver) : null,
      payoutReceiverConfirmedAt: '2024-10-01T00:00:00Z',
      timezone: member.timezone,
      focusSessionsOptIn: member.focusSessionsOptIn,
      streakDays: member.streakDays ?? 0,
      isCurrentUser: member.userId === 'usr_1',
      user,
    };
  });

  return NextResponse.json({
    success: true,
    data,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: squadId } = await params;

  try {
    const body = await request.json();
    const role = body.role ?? 'contributor';
    const timezone = body.timezone ?? 'UTC';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : `member_${Date.now()}@microsplit.demo`;
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : email.split('@')[0];

    if (!ASSIGNABLE_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'role must be approver, contributor, or viewer' },
        { status: 400 }
      );
    }

    const newUserId = `usr_${Date.now()}`;
    const newUser = {
      id: newUserId,
      name,
      email,
      avatar: '/avatars/alex.svg',
      role: 'contributor',
    };
    mockUsers.push(newUser);

    const newMembership: MockMembership = {
      id: `mem_${Date.now()}`,
      squadId,
      userId: newUserId,
      memberName: name,
      role,
      payoutReceiver: email,
      payoutReceiverType: 'EMAIL',
      payoutReceiverConfigured: true,
      payoutReceiverMasked: email,
      isCurrentUser: false,
      timezone,
      focusSessionsOptIn: true,
      streakDays: 0,
    };
    mockMemberships.push(newMembership);

    const squad = mockSquads.find((s) => s.id === squadId);
    if (squad) {
      squad.memberCount = (squad.memberCount || 0) + 1;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newMembership,
          user: newUser,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to add member' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: squadId } = await params;

  try {
    const body = await request.json();
    const receiver = typeof body.payoutReceiver === 'string' ? body.payoutReceiver.trim() : '';

    if (receiver !== '' && !isValidPayPalEmail(receiver)) {
      return NextResponse.json(
        { success: false, error: 'Enter a valid PayPal email address' },
        { status: 400 }
      );
    }

    const membership = mockMemberships.find((m) => m.squadId === squadId && m.userId === 'usr_1');
    if (membership) {
      membership.payoutReceiver = receiver;
      membership.payoutReceiverMasked = maskPayPalEmail(receiver);
      membership.payoutReceiverConfigured = Boolean(receiver);
    }

    return NextResponse.json({
      success: true,
      data: {
        payoutReceiver: receiver,
        payoutReceiverConfigured: Boolean(receiver),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to update payout settings' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: squadId } = await params;
  const memberId = request.nextUrl.searchParams.get('memberId');

  if (!memberId) {
    return NextResponse.json(
      { success: false, error: 'memberId query parameter is required' },
      { status: 400 }
    );
  }

  const idx = mockMemberships.findIndex((m) => m.id === memberId && m.squadId === squadId);
  if (idx === -1) {
    return NextResponse.json(
      { success: false, error: 'Membership not found' },
      { status: 404 }
    );
  }

  const removed = mockMemberships.splice(idx, 1)[0];
  const squad = mockSquads.find((s) => s.id === squadId);
  if (squad && squad.memberCount > 1) {
    squad.memberCount -= 1;
  }

  return NextResponse.json({
    success: true,
    message: 'Member removed from squad',
    data: removed,
  });
}
