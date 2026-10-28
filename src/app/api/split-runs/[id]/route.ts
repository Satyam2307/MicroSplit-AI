// GET /api/split-runs/:id – Fetch split run details
import { NextRequest, NextResponse } from 'next/server';
import { mockSplitRuns, mockApprovals } from '@/lib/mock-data';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const run = mockSplitRuns.find((r) => r.id === id);

  if (!run) {
    return NextResponse.json({ success: false, error: 'Split run not found' }, { status: 404 });
  }

  const approvals = mockApprovals.filter((a) => a.runId === id);

  return NextResponse.json({
    success: true,
    data: {
      ...run,
      approvals,
    },
  });
}
