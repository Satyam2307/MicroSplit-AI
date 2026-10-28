// GET /api/focus-sessions – List focus sessions
import { NextRequest, NextResponse } from 'next/server';
import { mockFocusSessions } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get('memberId');
  const status = request.nextUrl.searchParams.get('status');

  let sessions = [...mockFocusSessions];
  if (memberId) {
    sessions = sessions.filter((s) => s.memberId === memberId);
  }
  if (status) {
    sessions = sessions.filter((s) => s.status === status);
  }

  return NextResponse.json({ success: true, data: sessions });
}
