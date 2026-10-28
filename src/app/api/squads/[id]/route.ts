// GET /api/squads/:id & DELETE /api/squads/:id
import { NextRequest, NextResponse } from 'next/server';
import {
  mockSquads,
  mockMemberships,
  mockRevenueEvents,
  mockUsers,
} from '@/lib/mock-data';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const squad = mockSquads.find((s) => s.id === id);

  if (!squad) {
    return NextResponse.json(
      { success: false, error: 'Squad not found' },
      { status: 404 }
    );
  }

  const members = mockMemberships.filter((m) => m.squadId === id);
  const revenue = mockRevenueEvents.filter((r) => r.squadId === id);

  return NextResponse.json({
    success: true,
    data: {
      squad,
      members,
      revenue,
      users: mockUsers,
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const squadIndex = mockSquads.findIndex((s) => s.id === id);

  if (squadIndex === -1) {
    return NextResponse.json(
      { success: false, error: 'Squad not found' },
      { status: 404 }
    );
  }

  // Remove squad
  const [deletedSquad] = mockSquads.splice(squadIndex, 1);

  // Remove associated memberships
  for (let i = mockMemberships.length - 1; i >= 0; i--) {
    if (mockMemberships[i].squadId === id) {
      mockMemberships.splice(i, 1);
    }
  }

  // Remove associated revenue events
  for (let i = mockRevenueEvents.length - 1; i >= 0; i--) {
    if (mockRevenueEvents[i].squadId === id) {
      mockRevenueEvents.splice(i, 1);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Squad ${deletedSquad.name} and associated records successfully deleted`,
    data: deletedSquad,
  });
}
