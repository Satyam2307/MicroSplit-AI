import { NextRequest, NextResponse } from 'next/server';
import {
  mockSquads,
  mockMemberships,
  mockUsers,
  mockRevenueEvents,
} from '@/lib/mock-data';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Instant lookup in mock data
  const squad = mockSquads.find((s) => s.id === id);

  if (squad) {
    const rawMembers = mockMemberships.filter((m) => m.squadId === id);
    const members = rawMembers.map((membership) => {
      const user = mockUsers.find((u) => u.id === membership.userId) || {
        id: membership.userId,
        name: membership.memberName || 'Member',
        email: membership.payoutReceiver || `${membership.userId}@microsplit.demo`,
        avatar: '/avatars/alex.svg',
      };
      return {
        ...membership,
        user,
        payoutReceiver: membership.payoutReceiver || `${membership.userId}@paypal.demo`,
        payoutReceiverType: 'EMAIL',
        payoutReceiverConfigured: true,
        payoutReceiverMasked: membership.payoutReceiver || `${membership.userId}@paypal.demo`,
        payoutReceiverConfirmedAt: '2024-10-01T00:00:00Z',
        isCurrentUser: membership.userId === 'usr_1',
      };
    });

    const revenue = mockRevenueEvents.filter((r) => r.squadId === id);
    const totalRevenue = revenue.reduce(
      (sum, r) => sum + (r.amountMinor || 0),
      squad.totalRevenue || 0
    );

    return NextResponse.json({
      success: true,
      data: {
        squad: {
          ...squad,
          memberCount: members.length > 0 ? members.length : squad.memberCount,
          totalRevenue,
          currentRole: 'owner',
        },
        members,
        revenue,
        users: members.map((m) => m.user),
      },
    });
  }

  return NextResponse.json(
    { success: false, error: 'Squad not found' },
    { status: 404 }
  );
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const squadIdx = mockSquads.findIndex((s) => s.id === id);
  if (squadIdx !== -1) {
    const [deleted] = mockSquads.splice(squadIdx, 1);
    return NextResponse.json({
      success: true,
      message: `Squad ${deleted.name} successfully deleted`,
      data: deleted,
    });
  }

  return NextResponse.json(
    { success: false, error: 'Squad not found' },
    { status: 404 }
  );
}
