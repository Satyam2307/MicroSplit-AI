import { NextRequest, NextResponse } from 'next/server';
import { mockSquads, mockMemberships, mockUsers } from '@/lib/mock-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      currency = 'USD',
      ownerName,
      ownerEmail,
      ownerTimezone = 'Asia/Kolkata',
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Squad name is required' },
        { status: 400 }
      );
    }

    const email = (ownerEmail || '').trim() || 'creator@microsplit.demo';
    const creatorName = (ownerName || '').trim() || email.split('@')[0] || 'Squad Creator';

    // Find or create creator user
    let user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = {
        id: `usr_${Date.now()}`,
        name: creatorName,
        email: email,
        avatar: '/avatars/alex.svg',
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      mockUsers.push(user);
    } else if (ownerName && ownerName.trim()) {
      user.name = creatorName;
    }

    const squadId = `sqd_${Date.now()}`;
    const newSquad = {
      id: squadId,
      name: name.trim(),
      ownerId: user.id,
      currency,
      createdAt: new Date().toISOString(),
      memberCount: 1,
      totalRevenue: 0,
    };

    mockSquads.push(newSquad);

    // Sole owner membership - NO other default members
    const ownerMembership = {
      id: `mem_${Date.now()}`,
      squadId,
      userId: user.id,
      memberName: creatorName,
      role: 'owner',
      payoutReceiver: email,
      payoutReceiverType: 'EMAIL',
      timezone: ownerTimezone || 'Asia/Kolkata',
      focusSessionsOptIn: true,
      streakDays: 0,
    };

    mockMemberships.push(ownerMembership);

    return NextResponse.json(
      {
        success: true,
        data: newSquad,
        membership: ownerMembership,
        user,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ success: true, data: mockSquads });
}
