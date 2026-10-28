// GET /api/members/[id]/streak – Calculate deterministic streak for member
import { NextRequest, NextResponse } from 'next/server';
import {
  mockMemberships,
  mockContributions,
  mockFreezeGrants,
  mockUsers,
} from '@/lib/mock-data';
import { computeStreakFromDates } from '@/lib/consistency-streak';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = mockUsers.find((u) => u.id === id);
  const membership = mockMemberships.find((m) => m.userId === id || m.id === id);

  if (!user && !membership) {
    return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
  }

  const memberId = user ? user.id : membership!.userId;
  const timezone = membership?.timezone || 'UTC';
  const periodEndDate = request.nextUrl.searchParams.get('periodEnd') || new Date().toISOString().slice(0, 10);

  // Collect all approved/confirmed contributions for this member
  // Generate dates from existing contributions plus synthetic verified history for demo
  const userContributions = mockContributions
    .filter((c) => c.memberId === memberId && (c.status === 'confirmed' || c.status === 'pending'))
    .map((c) => c.createdAt || '2024-11-05');

  // Add realistic streak dates for demonstration
  // Maya Chen has 88-100 day streak in mock data
  const contributionDates = [...userContributions];
  if (memberId === 'usr_2') {
    // Generate dates for past 100 days
    const base = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      // Skip day 12 to simulate a freeze day
      if (i !== 12) {
        contributionDates.push(d.toISOString().slice(0, 10));
      }
    }
  }

  // Collect approved freeze grants for this member
  const freezeDates = mockFreezeGrants
    .filter((f) => f.memberId === memberId)
    .map((f) => f.date);

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
      memberId,
      memberName: user?.name || 'Member',
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
