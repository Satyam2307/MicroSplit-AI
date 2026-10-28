// POST /api/members/opt-in – Member focus session opt-in & timezone settings
import { NextRequest, NextResponse } from 'next/server';
import { mockMemberships } from '@/lib/mock-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberId, optIn, timezone } = body;

    if (!memberId || optIn === undefined) {
      return NextResponse.json(
        { success: false, error: 'memberId and optIn are required' },
        { status: 400 }
      );
    }

    const memberships = mockMemberships.filter(
      (m) => m.userId === memberId || m.id === memberId
    );

    if (memberships.length === 0) {
      return NextResponse.json({ success: false, error: 'Membership not found' }, { status: 404 });
    }

    memberships.forEach((m) => {
      m.focusSessionsOptIn = Boolean(optIn);
      if (timezone) {
        m.timezone = timezone;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        memberId,
        focusSessionsOptIn: memberships[0].focusSessionsOptIn,
        timezone: memberships[0].timezone,
      },
      message: memberships[0].focusSessionsOptIn
        ? 'Opt-in enabled. Only timestamp and task ID are recorded. You may delete sessions anytime.'
        : 'Opt-in disabled. No session data will be recorded or stored.',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
