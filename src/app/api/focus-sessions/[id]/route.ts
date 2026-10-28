// GET / DELETE /api/focus-sessions/[id] – Manage / delete focus session
import { NextRequest, NextResponse } from 'next/server';
import { mockFocusSessions } from '@/lib/mock-data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = mockFocusSessions.find((s) => s.id === id);

  if (!session) {
    return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: session });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idx = mockFocusSessions.findIndex((s) => s.id === id);

  if (idx === -1) {
    return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
  }

  const [deleted] = mockFocusSessions.splice(idx, 1);
  return NextResponse.json({
    success: true,
    message: 'Focus session permanently deleted under member data privacy rights',
    data: deleted,
  });
}
