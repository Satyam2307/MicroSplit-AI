import { NextResponse } from 'next/server';
import { mockPayoutBatches, mockSplitRuns } from '@/lib/mock-data';
import { getPrisma } from '@/lib/prisma';
import { requireAuthenticatedActor } from '@/lib/authorization';

export async function GET() {
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const memberships = await getPrisma().membership.findMany({
    where: { userId: actor.value.userId },
    select: { squadId: true },
  });
  const squadIds = new Set(memberships.map((membership) => membership.squadId));
  const accessibleRunIds = new Set(
    mockSplitRuns
      .filter((run) => run.squadId && squadIds.has(run.squadId))
      .map((run) => run.id)
  );

  return NextResponse.json({
    success: true,
    data: mockPayoutBatches.filter((batch) => accessibleRunIds.has(batch.runId)),
  });
}
