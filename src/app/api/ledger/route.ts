// GET /api/ledger – Paginated ledger
// GET /api/ledger/verify – Verify hash chain integrity
import { NextRequest, NextResponse } from 'next/server';
import { mockLedgerEvents } from '@/lib/mock-data';
import { requireAuthenticatedActor } from '@/lib/authorization';
import { getPrisma } from '@/lib/prisma';

function getLedgerSquadId(payloadJson: string): string | null {
  const payload: unknown = JSON.parse(payloadJson);
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'squadId' in payload &&
    typeof payload.squadId === 'string'
  ) {
    return payload.squadId;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const type = searchParams.get('type');

  const memberships = await getPrisma().membership.findMany({
    where: { userId: actor.value.userId },
    select: { squadId: true },
  });
  const squadIds = new Set(memberships.map((membership) => membership.squadId));
  let events = mockLedgerEvents.filter((event) => {
    const squadId = getLedgerSquadId(event.payloadJson);
    return squadId !== null && squadIds.has(squadId);
  });

  if (type) {
    events = events.filter((e) => e.type === type);
  }

  const total = events.length;
  const start = (page - 1) * limit;
  const paginated = events.slice(start, start + limit);

  return NextResponse.json({
    success: true,
    data: {
      events: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}
