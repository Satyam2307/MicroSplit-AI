// GET /api/ledger – Paginated ledger
// GET /api/ledger/verify – Verify hash chain integrity
import { NextRequest, NextResponse } from 'next/server';
import { mockLedgerEvents } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const type = searchParams.get('type');

  let events = [...mockLedgerEvents];

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
