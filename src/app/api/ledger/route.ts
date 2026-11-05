// GET /api/ledger – Paginated ledger
// GET /api/ledger/verify – Verify hash chain integrity
import { NextRequest, NextResponse } from 'next/server';
import { mockLedgerEvents, mockMemberships } from '@/lib/mock-data';
import { requireAuthenticatedActor } from '@/lib/authorization';

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

  const squadIds = new Set(mockMemberships.map((membership) => membership.squadId));
  let events = mockLedgerEvents;

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
