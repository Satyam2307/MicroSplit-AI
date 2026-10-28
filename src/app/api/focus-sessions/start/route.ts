// POST /api/focus-sessions/start – Start opt-in focus session
import { NextRequest, NextResponse } from 'next/server';
import { mockMemberships, mockFocusSessions, mockUsers } from '@/lib/mock-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberId, taskId, taskTitle, source, evidenceId } = body;

    if (!memberId || !taskId) {
      return NextResponse.json(
        { success: false, error: 'memberId and taskId are required' },
        { status: 400 }
      );
    }

    // 1. Non-negotiable Privacy Gate: Member must be OPTED IN
    const membership = mockMemberships.find((m) => m.userId === memberId || m.id === memberId);
    if (!membership || !membership.focusSessionsOptIn) {
      return NextResponse.json(
        {
          success: false,
          error: 'Focus sessions are strictly opt-in. This member has not enabled session tracking in Settings.',
        },
        { status: 403 }
      );
    }

    // 2. Prevent overlapping sessions for the same member
    const activeSession = mockFocusSessions.find(
      (s) => s.memberId === memberId && s.endedAt === null
    );
    if (activeSession) {
      return NextResponse.json(
        {
          success: false,
          error: `Active session ${activeSession.id} is already in progress for this member. Stop it before starting a new one.`,
        },
        { status: 409 }
      );
    }

    const user = mockUsers.find((u) => u.id === memberId);
    const session = {
      id: `foc_${Date.now()}`,
      memberId,
      memberName: user?.name || 'Member',
      taskId,
      taskTitle: taskTitle || `Task ${taskId}`,
      startedAt: new Date().toISOString(),
      endedAt: null,
      source: (source === 'linked_evidence' ? 'linked_evidence' : 'manual') as 'manual' | 'linked_evidence',
      evidenceId: evidenceId || undefined,
      status: 'active' as const,
      conflictFlag: undefined,
      createdAt: new Date().toISOString(),
    };

    mockFocusSessions.unshift(session);

    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
