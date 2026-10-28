// POST /api/focus-sessions/[id]/stop – Stop active focus session with conflict checking
import { NextRequest, NextResponse } from 'next/server';
import { mockFocusSessions } from '@/lib/mock-data';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = mockFocusSessions.find((s) => s.id === id);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Focus session not found' },
        { status: 404 }
      );
    }

    if (session.endedAt !== null) {
      return NextResponse.json(
        { success: false, error: 'Session has already stopped' },
        { status: 400 }
      );
    }

    const endedAt = new Date().toISOString();
    const durationMinutes = Math.round(
      (new Date(endedAt).getTime() - new Date(session.startedAt).getTime()) / (1000 * 60)
    );

    session.endedAt = endedAt;
    session.durationMinutes = durationMinutes;

    // Approver conflict gate: check if duration > 16 hours (960 minutes)
    if (durationMinutes > 960) {
      session.conflictFlag = `implausible_duration: Session duration (${(durationMinutes / 60).toFixed(1)}h) exceeds 16-hour daily threshold`;
      session.status = 'disputed';
    } else {
      session.status = 'completed';
    }

    return NextResponse.json({ success: true, data: session });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
