// POST /api/focus-sessions/start – Start opt-in focus session
import { NextRequest, NextResponse } from 'next/server';
import { mockFocusSessions } from '@/lib/mock-data';
import { getPrisma } from '@/lib/prisma';
import { requireAuthenticatedActor } from '@/lib/authorization';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, taskTitle, source, evidenceId } = body;
    const actor = await requireAuthenticatedActor();
    if (!actor.ok) return actor.response;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'taskId is required' },
        { status: 400 }
      );
    }

    // 1. Non-negotiable Privacy Gate: Member must be OPTED IN
    const membership = await getPrisma().membership.findFirst({
      where: { userId: actor.value.userId, focusSessionsOptIn: true },
    });
    if (!membership) {
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
      (s) => s.memberId === actor.value.userId && s.endedAt === null
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

    const session = {
      id: `foc_${Date.now()}`,
      memberId: actor.value.userId,
      memberName: actor.value.name || actor.value.email || 'Member',
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
