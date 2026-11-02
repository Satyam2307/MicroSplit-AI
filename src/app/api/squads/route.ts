import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAuthenticatedActor } from "@/lib/authorization";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";

export async function POST(request: NextRequest) {
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const rateLimit = checkRateLimit(
    `squad_create_${actor.value.userId}`,
    {
      intervalMs: 60000,
      maxRequests: 10,
    }
  );

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many squad creation attempts. Please wait.",
      },
      { status: 429 }
    );
  }

  try {
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

    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid IANA timezone" },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    const owner = await prisma.user.findUnique({
      where: { id: actor.value.userId },
      select: { id: true, name: true, email: true },
    });

    if (!owner) {
      return NextResponse.json(
        {
          success: false,
          error: "Authenticated user was not found",
        },
        { status: 401 }
      );
    }

    const squad = await prisma.squad.create({
      data: {
        name,
        currency,
        ownerId: owner.id,
        memberships: {
          create: {
            userId: owner.id,
            role: "owner",
            payoutReceiver: owner.email,
            payoutReceiverType: "EMAIL",
            timezone,
          },
        },
      },
      include: {
        memberships: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...squad,
          memberCount: squad.memberships.length,
          totalRevenue: 0,
          currentRole: "owner",
        },
        membership: squad.memberships[0],
        user: owner,
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
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const squads = await getPrisma().squad.findMany({
    where: { memberships: { some: { userId: actor.value.userId } } },
    include: {
      owner: { select: { id: true, name: true, email: true, avatar: true } },
      memberships: {
        where: { userId: actor.value.userId },
        select: { role: true },
      },
      _count: { select: { memberships: true } },
      revenueEvents: { where: { status: 'active' }, select: { amountMinor: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    success: true,
    data: squads.map(({ memberships, _count, revenueEvents, ...squad }) => ({
      ...squad,
      memberCount: _count.memberships,
      currentRole: memberships[0]?.role,
      totalRevenue: revenueEvents.reduce((total, event) => total + event.amountMinor, 0),
    })),
  });
}
