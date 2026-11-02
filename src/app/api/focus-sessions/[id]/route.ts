// GET / DELETE /api/focus-sessions/[id] – Manage / delete focus session
import { NextRequest, NextResponse } from 'next/server';
import { mockFocusSessions } from '@/lib/mock-data';
import { requireAuthenticatedActor } from '@/lib/authorization';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;
  const session = mockFocusSessions.find((s) => s.id === id);

  if (!session || session.memberId !== actor.value.userId) {
    return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: session });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;
  const idx = mockFocusSessions.findIndex((s) => s.id === id);

  if (idx === -1 || mockFocusSessions[idx].memberId !== actor.value.userId) {
    return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
  }

  const [deleted] = mockFocusSessions.splice(idx, 1);
  return NextResponse.json({
    success: true,
    message: 'Focus session permanently deleted under member data privacy rights',
    data: deleted,
  });
}
