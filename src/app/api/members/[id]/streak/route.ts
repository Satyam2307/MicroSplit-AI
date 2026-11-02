// GET /api/members/[id]/streak – Calculate deterministic streak for member
import { NextRequest, NextResponse } from 'next/server';
import { computeStreakFromDates } from '@/lib/consistency-streak';
import { requireAuthenticatedActor } from '@/lib/authorization';
import { getPrisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;
  if (id !== actor.value.userId) {
    return NextResponse.json({ success: false, error: 'You may only view your own streak' }, { status: 403 });
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
  }

  const memberships = await prisma.membership.findMany({
    where: { userId: id },
    select: { id: true, timezone: true },
  });
  const timezone = memberships[0]?.timezone || 'UTC';
  const periodEndDate = request.nextUrl.searchParams.get('periodEnd') || new Date().toISOString().slice(0, 10);

  const [contributions, freezeGrants] = await Promise.all([
    prisma.contribution.findMany({
      where: {
        memberId: id,
        status: { in: ['confirmed', 'pending'] },
      },
      select: { createdAt: true },
    }),
    prisma.freezeGrant.findMany({
      where: { memberId: { in: memberships.map((membership) => membership.id) } },
      select: { date: true },
    }),
  ]);
  const contributionDates = contributions.map((contribution) => contribution.createdAt.toISOString());
  const freezeDates = freezeGrants.map((grant) => grant.date.toISOString().slice(0, 10));

  const streakResult = computeStreakFromDates({
    approvedContributionDates: contributionDates,
    freezeDates,
    periodEndDate,
    timezone,
  });

  const freezeAllowance = 2; // default freeze_days_per_30
  const freezeRemaining = Math.max(0, freezeAllowance - streakResult.freezeDaysUsed);

  return NextResponse.json({
    success: true,
    data: {
      memberId: id,
      memberName: user.name,
      timezone,
      periodEndDate,
      streakDays: streakResult.streakDays,
      freezeDaysUsed: streakResult.freezeDaysUsed,
      freezeDaysRemaining: freezeRemaining,
      freezeDaysPer30: freezeAllowance,
      countingDates: streakResult.countingDates.slice(0, 30), // top 30 for preview
      totalCountingDates: streakResult.countingDates.length,
    },
  });
}
