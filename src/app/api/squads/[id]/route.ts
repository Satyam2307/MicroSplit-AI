import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { requireSquadRole } from '@/lib/authorization';
import { isValidPayPalEmail, maskPayPalEmail } from '@/lib/payout-safety';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await requireSquadRole(id);
  if (!access.ok) return access.response;

  const squad = await getPrisma().squad.findUnique({
    where: { id },
    include: {
      memberships: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
      owner: { select: { id: true, name: true, email: true, avatar: true } },
      revenueEvents: true,
    },
  });

  if (!squad) {
    return NextResponse.json(
      { success: false, error: 'Squad not found' },
      { status: 404 }
    );
  }

  const members = squad.memberships.map((membership) => {
    const configured = Boolean(
      membership.payoutReceiverConfirmedAt &&
        isValidPayPalEmail(membership.payoutReceiver)
    );
    return {
      ...membership,
      payoutReceiver:
        configured && membership.userId === access.value.userId
          ? membership.payoutReceiver
          : '',
      payoutReceiverType: 'EMAIL',
      payoutReceiverConfigured: configured,
      payoutReceiverMasked: configured
        ? maskPayPalEmail(membership.payoutReceiver)
        : null,
      payoutReceiverConfirmedAt:
        membership.userId === access.value.userId
          ? membership.payoutReceiverConfirmedAt
          : null,
      isCurrentUser: membership.userId === access.value.userId,
    };
  });
  const { memberships: _memberships, revenueEvents, ...squadData } = squad;

  return NextResponse.json({
    success: true,
    data: {
      squad: {
        ...squadData,
        memberCount: members.length,
        totalRevenue: revenueEvents.reduce(
          (total, event) => total + event.amountMinor,
          0
        ),
        currentRole: access.value.membership.role,
      },
      members,
      revenue: revenueEvents,
      users: members.map((membership) => membership.user),
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await requireSquadRole(id, ['owner']);
  if (!access.ok) return access.response;

  const squad = await getPrisma().squad.delete({ where: { id } });
  return NextResponse.json({
    success: true,
    message: `Squad ${squad.name} and associated records successfully deleted`,
    data: squad,
  });
}
