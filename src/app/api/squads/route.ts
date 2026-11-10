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

    const ownerName = sanitizeText(
      typeof body.ownerName === "string" ? body.ownerName : ""
    ).trim() || "Alex Rivera";

    const ownerEmail = sanitizeText(
      typeof body.ownerEmail === "string" ? body.ownerEmail : ""
    ).trim().toLowerCase() || "alex@microsplit.demo";

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

    // Find or create owner user
    let ownerUser = mockUsers.find(
      (u) => u.email.toLowerCase() === ownerEmail.toLowerCase()
    );
    if (!ownerUser) {
      ownerUser = {
        id: `usr_${Date.now()}`,
        name: ownerName,
        email: ownerEmail,
        avatar: '/avatars/alex.svg',
        role: 'owner',
      };
      mockUsers.push(ownerUser);
    } else {
      ownerUser.name = ownerName;
    }

    const squadId = `sqd_${Date.now()}`;
    const newSquad = {
      id: squadId,
      name,
      ownerId: ownerUser.id,
      currency,
      createdAt: new Date().toISOString(),
      memberCount: 1,
      totalRevenue: 0,
      currentRole: "owner",
      owner: {
        id: ownerUser.id,
        name: ownerUser.name,
        email: ownerUser.email,
        avatar: ownerUser.avatar,
      },
    };

    // Prepend so newly created squad appears at the top
    mockSquads.unshift({
      id: squadId,
      name,
      ownerId: ownerUser.id,
      currency,
      createdAt: newSquad.createdAt,
      memberCount: 1,
      totalRevenue: 0,
    });

    const ownerMembership = {
      id: `mem_${Date.now()}`,
      squadId,
      userId: ownerUser.id,
      memberName: ownerUser.name,
      role: "owner",
      payoutReceiver: ownerUser.email,
      payoutReceiverType: "EMAIL",
      payoutReceiverConfigured: true,
      payoutReceiverMasked: ownerUser.email,
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
        user: ownerUser,
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

export async function GET(request: NextRequest) {
  let squads = mockSquads.map((squad) => {
    const squadOwner = mockUsers.find((u) => u.id === squad.ownerId) || {
      id: squad.ownerId || 'usr_1',
      name: 'Alex Rivera',
      email: 'alex@microsplit.demo',
    };
    return {
      ...squad,
      currentRole: "owner",
      owner: {
        id: squadOwner.id,
        name: squadOwner.name,
        email: squadOwner.email,
      },
    };
  });

  if (request) {
    try {
      const { searchParams } = new URL(request.url);
      const email = searchParams.get('email')?.toLowerCase();
      if (email && email !== 'alex@microsplit.demo') {
        squads = squads.filter((s: any) => s.owner?.email?.toLowerCase() === email);
      }
    } catch {
      // Ignore
    }
  }

  return NextResponse.json({
    success: true,
    data: squads,
  });
}
