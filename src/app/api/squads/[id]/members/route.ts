// POST /api/squads/:id/members – Add member with payout receiver
import { NextRequest, NextResponse } from 'next/server';
import { mockMemberships, mockUsers, mockSquads } from '@/lib/mock-data';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: squadId } = await params;
  try {
    const body = await request.json();
    const {
      name,
      email,
      role = 'contributor',
      payoutReceiver,
      payoutReceiverType = 'EMAIL',
      timezone = 'UTC',
      focusSessionsOptIn = false,
    } = body;

    let targetUserId = body.userId;

    const receiver = payoutReceiver || email;
    if (!receiver) {
      return NextResponse.json(
        { success: false, error: 'Email or payoutReceiver is required' },
        { status: 400 }
      );
    }

    if (!targetUserId) {
      // Find or create user
      let existingUser = mockUsers.find(
        (u) => u.email.toLowerCase() === receiver.toLowerCase()
      );
      if (!existingUser) {
        const newUser = {
          id: `usr_${Date.now()}`,
          name: name || receiver.split('@')[0],
          email: receiver,
          avatar: '/avatars/alex.svg',
          role: 'contributor',
          createdAt: new Date().toISOString(),
        };
        mockUsers.push(newUser);
        targetUserId = newUser.id;
      } else {
        targetUserId = existingUser.id;
      }
    }

    // Check for duplicate membership in squad
    const existingMembership = mockMemberships.find(
      (m) => m.squadId === squadId && m.userId === targetUserId
    );
    if (existingMembership) {
      return NextResponse.json(
        { success: false, error: 'User is already a member of this squad' },
        { status: 409 }
      );
    }

    const resolvedName = name || receiver.split('@')[0];
    const membership = {
      id: `mem_${Date.now()}`,
      squadId,
      userId: targetUserId,
      memberName: resolvedName,
      role,
      payoutReceiver: receiver,
      payoutReceiverType,
      timezone: timezone || 'Asia/Kolkata',
      focusSessionsOptIn: Boolean(focusSessionsOptIn),
      streakDays: 0,
    };

    mockMemberships.push(membership);

    // Update squad member count
    const squad = mockSquads.find((s) => s.id === squadId);
    if (squad) {
      squad.memberCount = mockMemberships.filter((m) => m.squadId === squadId).length;
    }

    const userObj = mockUsers.find((u) => u.id === targetUserId);

    return NextResponse.json(
      { success: true, data: { membership, user: userObj } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: squadId } = await params;
  const members = mockMemberships.filter((m) => m.squadId === squadId);
  return NextResponse.json({ success: true, data: members });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: squadId } = await params;
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('memberId');

  if (!memberId) {
    return NextResponse.json(
      { success: false, error: 'memberId query parameter is required' },
      { status: 400 }
    );
  }

  const memIndex = mockMemberships.findIndex(
    (m) => m.id === memberId && m.squadId === squadId
  );

  if (memIndex === -1) {
    return NextResponse.json(
      { success: false, error: 'Membership not found' },
      { status: 404 }
    );
  }

  const [removed] = mockMemberships.splice(memIndex, 1);

  // Update squad member count
  const squad = mockSquads.find((s) => s.id === squadId);
  if (squad) {
    squad.memberCount = mockMemberships.filter((m) => m.squadId === squadId).length;
  }

  return NextResponse.json({
    success: true,
    message: 'Member removed from squad',
    data: removed,
  });
}

