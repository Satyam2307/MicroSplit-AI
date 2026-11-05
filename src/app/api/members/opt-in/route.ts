// POST /api/members/opt-in – Member focus session opt-in & timezone settings
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { requireAuthenticatedActor } from '@/lib/authorization';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
    const rateLimit = checkRateLimit(`member_optin_${clientIp}`, {
      intervalMs: 60000,
      maxRequests: 30,
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please slow down.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { optIn, timezone } = body;
    const actor = await requireAuthenticatedActor();
    if (!actor.ok) return actor.response;

    if (optIn === undefined) {
      return NextResponse.json(
        { success: false, error: 'optIn is required' },
        { status: 400 }
      );
    }

    if (timezone) {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: timezone });
      } catch {
        return NextResponse.json({ success: false, error: 'Invalid IANA timezone' }, { status: 400 });
      }
    }

    const updateResult = await getPrisma().membership.updateMany({
      where: { userId: actor.value.userId },
      data: {
        focusSessionsOptIn: Boolean(optIn),
        ...(timezone ? { timezone } : {}),
      },
    });
    if (updateResult.count === 0) {
      return NextResponse.json({ success: false, error: 'Membership not found' }, { status: 404 });
    }

    const membership = await getPrisma().membership.findFirst({
      where: { userId: actor.value.userId },
      select: { focusSessionsOptIn: true, timezone: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        memberId: actor.value.userId,
        focusSessionsOptIn: membership?.focusSessionsOptIn ?? false,
        timezone: membership?.timezone ?? 'UTC',
      },
      message: membership?.focusSessionsOptIn
        ? 'Opt-in enabled. Only timestamp and task ID are recorded. You may delete sessions anytime.'
        : 'Opt-in disabled. No session data will be recorded or stored.',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET() {
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const membership = await getPrisma().membership.findFirst({
    where: { userId: actor.value.userId },
    select: { focusSessionsOptIn: true, timezone: true },
  });

  return NextResponse.json({
    success: true,
    data: {
      memberId: actor.value.userId,
      focusSessionsOptIn: membership?.focusSessionsOptIn ?? false,
      timezone: membership?.timezone ?? 'UTC',
    },
  });
}
