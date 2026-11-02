// GET /api/focus-sessions – List focus sessions
import { NextRequest, NextResponse } from 'next/server';
import { mockFocusSessions } from '@/lib/mock-data';
import { requireAuthenticatedActor } from '@/lib/authorization';

export async function GET(request: NextRequest) {
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const memberId = request.nextUrl.searchParams.get('memberId');
  const status = request.nextUrl.searchParams.get('status');

  if (memberId && memberId !== actor.value.userId) {
    return NextResponse.json({ success: false, error: 'You may only view your own focus sessions' }, { status: 403 });
  }
  let sessions = mockFocusSessions.filter((session) => session.memberId === actor.value.userId);
  if (status) {
    sessions = sessions.filter((s) => s.status === status);
  }

  return NextResponse.json({ success: true, data: sessions });
}
