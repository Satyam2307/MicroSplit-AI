import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { requireSquadRole } from '@/lib/authorization';
import {
  isValidPayPalEmail,
  maskPayPalEmail,
} from '@/lib/payout-safety';

const ASSIGNABLE_ROLES = ['approver', 'contributor', 'viewer'] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: squadId } = await params;
  const access = await requireSquadRole(squadId, ['owner']);
  if (!access.ok) return access.response;

  try {
    const body = await request.json();
    const role = body.role ?? 'contributor';
    const timezone = body.timezone ?? 'UTC';
    const receiverType = body.payoutReceiverType ?? 'EMAIL';
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'role must be approver, contributor, or viewer' },
        { status: 400 }
      );
    }

    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid IANA timezone' },
        { status: 400 }
      );
    }

    if (receiverType !== 'EMAIL') {
      return NextResponse.json(
        { success: false, error: 'Only email payout receivers are supported' },
        { status: 400 }
      );
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const receiver = '';
    let user = body.userId
      ? await getPrisma().user.findUnique({ where: { id: body.userId } })
      : email
        ? await getPrisma().user.findUnique({ where: { email } })
        : null;

    if (!user && email) {
      user = await getPrisma().user.create({
        data: {
          email,
          name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : email.split('@')[0],
          role: 'contributor',
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'A valid email or user ID is required to add a member' },
        { status: 404 }
      );
    }

    const membership = await getPrisma().membership.create({
      data: {
        squadId,
        userId: user.id,
        role,
        payoutReceiver: receiver,
        payoutReceiverType: receiverType,
        payoutReceiverConfirmedAt: null,
        timezone,
        focusSessionsOptIn: Boolean(body.focusSessionsOptIn),
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...membership,
        payoutReceiver: '',
        payoutReceiverConfigured: false,
        isCurrentUser: membership.userId === access.value.userId,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to add member';
    return NextResponse.json({ success: false, error: message }, { status: 409 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: squadId } = await params;
  const access = await requireSquadRole(squadId);
  if (!access.ok) return access.response;

  const members = await getPrisma().membership.findMany({
    where: { squadId },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
    orderBy: { id: 'asc' },
  });
  return NextResponse.json({
    success: true,
    data: members.map((member) => {
      const configured = Boolean(
        member.payoutReceiverConfirmedAt &&
          isValidPayPalEmail(member.payoutReceiver)
      );
      return {
        ...member,
        payoutReceiver:
          configured && member.userId === access.value.userId
            ? member.payoutReceiver
            : "",
        payoutReceiverMasked:
          configured ? maskPayPalEmail(member.payoutReceiver) : null,
        payoutReceiverConfigured: configured,
        payoutReceiverConfirmedAt:
          member.userId === access.value.userId
            ? member.payoutReceiverConfirmedAt
            : null,
        isCurrentUser: member.userId === access.value.userId,
      };
    }),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: squadId } = await params;
  const access = await requireSquadRole(squadId);
  if (!access.ok) return access.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Request body must be valid JSON' },
      { status: 400 }
    );
  }
  if (
    typeof body !== 'object' ||
    body === null ||
    Array.isArray(body) ||
    !('payoutReceiver' in body) ||
    typeof body.payoutReceiver !== 'string'
  ) {
    return NextResponse.json(
      { success: false, error: 'payoutReceiver must be a string' },
      { status: 400 }
    );
  }

  const receiver = body.payoutReceiver.trim();
  if (receiver !== '' && !isValidPayPalEmail(receiver)) {
    return NextResponse.json(
      { success: false, error: 'Enter a valid PayPal email address' },
      { status: 400 }
    );
  }

  const membership = await getPrisma().membership.update({
    where: { id: access.value.membership.id },
    data: {
      payoutReceiver: receiver,
      payoutReceiverType: 'EMAIL',
      payoutReceiverConfirmedAt: receiver ? new Date() : null,
    },
    select: {
      payoutReceiver: true,
      payoutReceiverConfirmedAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      payoutReceiver: membership.payoutReceiver,
      payoutReceiverConfigured: Boolean(membership.payoutReceiverConfirmedAt),
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: squadId } = await params;
  const access = await requireSquadRole(squadId, ['owner']);
  if (!access.ok) return access.response;

  const memberId = request.nextUrl.searchParams.get('memberId');
  if (!memberId) {
    return NextResponse.json(
      { success: false, error: 'memberId query parameter is required' },
      { status: 400 }
    );
  }

  const membership = await getPrisma().membership.findFirst({
    where: { id: memberId, squadId },
  });
  if (!membership || membership.role === 'owner') {
    return NextResponse.json(
      { success: false, error: 'Membership not found or cannot remove the squad owner' },
      { status: 404 }
    );
  }

  await getPrisma().membership.delete({ where: { id: membership.id } });
  return NextResponse.json({
    success: true,
    message: 'Member removed from squad',
    data: membership,
  });
}
