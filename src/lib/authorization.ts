import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
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
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  return {
    ok: true,
    value: {
      userId,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
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
}
