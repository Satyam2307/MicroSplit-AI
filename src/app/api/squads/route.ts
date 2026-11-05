import { NextRequest, NextResponse } from "next/server";
import { mockSquads, mockMemberships, mockUsers } from "@/lib/mock-data";
import { sanitizeText } from "@/lib/sanitize";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anonymous";
    const rateLimit = checkRateLimit(`squads_create_${clientIp}`, {
      intervalMs: 60000,
      maxRequests: 30,
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const name = sanitizeText(
      typeof body.name === "string" ? body.name : ""
    );

    const currency = sanitizeText(
      typeof body.currency === "string" ? body.currency : "USD"
    ).toUpperCase();

    const timezone = sanitizeText(
      typeof body.ownerTimezone === "string"
        ? body.ownerTimezone
        : "UTC"
    );

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Squad name must be at least 2 characters",
        },
        { status: 400 }
      );
    }

    if (!/^[A-Z]{3}$/.test(currency)) {
      return NextResponse.json(
        {
          success: false,
          error: "Currency must be a three-letter ISO code",
        },
        { status: 400 }
      );
    }

    // Default demo user: Alex Rivera
    const alexUser = mockUsers.find((u) => u.id === 'usr_1') || {
      id: 'usr_1',
      name: 'Alex Rivera',
      email: 'alex@microsplit.demo',
      avatar: '/avatars/alex.svg',
      role: 'admin',
    };

    const squadId = `sqd_${Date.now()}`;
    const newSquad = {
      id: squadId,
      name,
      ownerId: alexUser.id,
      currency,
      createdAt: new Date().toISOString(),
      memberCount: 1,
      totalRevenue: 0,
      currentRole: "owner",
      owner: {
        id: alexUser.id,
        name: alexUser.name,
        email: alexUser.email,
        avatar: alexUser.avatar,
      },
    };

    // Prepend so newly created squad appears at the top
    mockSquads.unshift({
      id: squadId,
      name,
      ownerId: alexUser.id,
      currency,
      createdAt: newSquad.createdAt,
      memberCount: 1,
      totalRevenue: 0,
    });

    const ownerMembership = {
      id: `mem_${Date.now()}`,
      squadId,
      userId: alexUser.id,
      memberName: alexUser.name,
      role: "owner",
      payoutReceiver: alexUser.email,
      payoutReceiverType: "EMAIL",
      payoutReceiverConfigured: true,
      payoutReceiverMasked: alexUser.email,
      isCurrentUser: true,
      timezone,
      focusSessionsOptIn: true,
      streakDays: 0,
    };

    mockMemberships.push(ownerMembership);

    return NextResponse.json(
      {
        success: true,
        data: newSquad,
        membership: ownerMembership,
        user: alexUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create squad", error);
    return NextResponse.json(
      { success: false, error: "Unable to create squad" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Always return demo squads + any created squads instantly
  const alexUser = mockUsers.find((u) => u.id === 'usr_1') || {
    id: 'usr_1',
    name: 'Alex Rivera',
  };

  const squads = mockSquads.map((squad) => ({
    ...squad,
    currentRole: "owner",
    owner: {
      id: alexUser.id,
      name: alexUser.name,
    },
  }));

  return NextResponse.json({
    success: true,
    data: squads,
  });
}
