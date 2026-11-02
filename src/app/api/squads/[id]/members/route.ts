import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { requireSquadRole } from '@/lib/authorization';

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

    const receiver =
      typeof body.payoutReceiver === 'string'
        ? body.payoutReceiver.trim()
        : typeof body.email === 'string'
          ? body.email.trim().toLowerCase()
          : '';
    const user = body.userId
      ? await getPrisma().user.findUnique({ where: { id: body.userId } })
      : receiver
        ? await getPrisma().user.findUnique({ where: { email: receiver } })
        : null;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invitees must first sign in with GitHub' },
        { status: 404 }
      );
    }

    const membership = await getPrisma().membership.create({
      data: {
        squadId,
        userId: user.id,
        role,
        payoutReceiver: receiver || user.email,
        payoutReceiverType: receiverType,
        timezone,
        focusSessionsOptIn: Boolean(body.focusSessionsOptIn),
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    return NextResponse.json({ success: true, data: membership }, { status: 201 });
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
  return NextResponse.json({ success: true, data: members });
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
