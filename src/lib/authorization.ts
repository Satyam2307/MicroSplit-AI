import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { mockMemberships, mockSquads } from "@/lib/mock-data";
import {
  authorizationFailureStatus,
  hasSquadRole,
} from "@/lib/authorization-policy";

export type Authorized<T> =
  | { ok: true; value: T }
  | { ok: false; response: NextResponse };

export interface AuthenticatedActor {
  userId: string;
  email: string | null;
  name: string | null;
}

export { hasSquadRole };

export async function requireAuthenticatedActor(): Promise<
  Authorized<AuthenticatedActor>
> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return {
        ok: true,
        value: {
          userId: session.user.id,
          email: session.user.email ?? null,
          name: session.user.name ?? null,
        },
      };
    }
  } catch {
    // Fall through to demo default
  }

  // Demo mode: Return Alex Rivera default demo user instantly
  return {
    ok: true,
    value: {
      userId: "usr_1",
      email: "alex@microsplit.demo",
      name: "Alex Rivera",
    },
  };
}

export async function requireSquadRole(
  squadId: string,
  allowedRoles?: readonly string[]
): Promise<
  Authorized<
    AuthenticatedActor & {
      membership: {
        id: string;
        squadId: string;
        userId: string;
        role: string;
      };
    }
  >
> {
  const actorResult = await requireAuthenticatedActor();
  if (!actorResult.ok) return actorResult;

  if (!squadId) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "squadId is required" },
        { status: 400 }
      ),
    };
  }

  // 1. Instant check in mock memberships for demo squads
  const mockMember = mockMemberships.find(
    (m) => m.squadId === squadId && m.userId === actorResult.value.userId
  );

  if (mockMember) {
    return {
      ok: true,
      value: {
        ...actorResult.value,
        membership: {
          id: mockMember.id,
          squadId: mockMember.squadId,
          userId: mockMember.userId,
          role: mockMember.role,
        },
      },
    };
  }

  // 2. If squad exists in mockSquads, default Alex Rivera as owner
  const mockSquad = mockSquads.find((s) => s.id === squadId);
  if (mockSquad) {
    return {
      ok: true,
      value: {
        ...actorResult.value,
        membership: {
          id: `mem_demo_${squadId}`,
          squadId,
          userId: actorResult.value.userId,
          role: "owner",
        },
      },
    };
  }

  try {
    const membership = await getPrisma().membership.findUnique({
      where: {
        squadId_userId: {
          squadId,
          userId: actorResult.value.userId,
        },
      },
      select: {
        id: true,
        squadId: true,
        userId: true,
        role: true,
      },
    });

    if (
      !membership ||
      authorizationFailureStatus(
        actorResult.value.userId,
        membership?.role,
        allowedRoles
      ) !== null
    ) {
      return {
        ok: false,
        response: NextResponse.json(
          { success: false, error: "You do not have permission to access this squad" },
          { status: 403 }
        ),
      };
    }

    return {
      ok: true,
      value: { ...actorResult.value, membership },
    };
  } catch {
    // Default demo authorization
    return {
      ok: true,
      value: {
        ...actorResult.value,
        membership: {
          id: `mem_demo_${squadId}`,
          squadId,
          userId: actorResult.value.userId,
          role: "owner",
        },
      },
    };
  }
}
