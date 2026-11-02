// POST /api/freeze-grants – Grant a streak freeze day (approver only)
import { NextRequest, NextResponse } from 'next/server';
import {
  mockLedgerEvents,
} from '@/lib/mock-data';
import { createLedgerEntry } from '@/lib/ledger';
import { getPrisma } from '@/lib/prisma';
import { requireAuthenticatedActor, requireSquadRole } from '@/lib/authorization';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeId, sanitizeText } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
    const rateLimit = checkRateLimit(`freeze_grant_${clientIp}`, {
      intervalMs: 60000,
      maxRequests: 20,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many freeze grant requests. Please wait.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const squadId = sanitizeId(body.squadId);
    const memberId = sanitizeId(body.memberId);
    const date = sanitizeText(body.date);
    const reason = sanitizeText(body.reason);

    if (!squadId || !memberId || !date || !reason) {
      return NextResponse.json(
        { success: false, error: 'squadId, memberId, date, and reason are required' },
        { status: 400 }
      );
    }

    const access = await requireSquadRole(squadId, ['owner', 'approver']);
    if (!access.ok) return access.response;

    const prisma = getPrisma();
    const memberMembership = await prisma.membership.findUnique({
      where: {
        squadId_userId: {
          squadId,
          userId: memberId,
        },
      },
      include: { user: { select: { name: true } } },
    });
    if (!memberMembership) {
      return NextResponse.json(
        { success: false, error: 'Freeze target must be a member of this squad' },
        { status: 400 }
      );
    }

    const approverId = access.value.userId;

    // Check if freeze already exists for this member on this date
    const freezeDate = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(freezeDate.getTime()) || freezeDate.toISOString().slice(0, 10) !== date) {
      return NextResponse.json(
        { success: false, error: 'date must be a valid YYYY-MM-DD date' },
        { status: 400 }
      );
    }

    const exists = await prisma.freezeGrant.findUnique({
      where: {
        memberId_date: { memberId: memberMembership.id, date: freezeDate },
      },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json(
        { success: false, error: `Freeze grant already active for this member on ${date}` },
        { status: 409 }
      );
    }

    const storedGrant = await prisma.freezeGrant.create({
      data: {
        squadId,
        memberId: memberMembership.id,
        approverId,
        date: freezeDate,
        reason,
      },
      include: {
        membership: { include: { user: { select: { name: true } } } },
        approver: { select: { name: true } },
      },
    });

    // Cryptographic SHA-256 Ledger Event: freeze_granted
    const prevHash = mockLedgerEvents.length > 0
      ? mockLedgerEvents[mockLedgerEvents.length - 1].hash
      : null;

    const ledgerEntry = createLedgerEntry(
      `led_${mockLedgerEvents.length + 1}`,
      'freeze_granted',
      storedGrant.id,
      0, // freeze grant has 0 monetary amount
      {
        squadId,
        memberId,
        memberName: storedGrant.membership.user.name,
        approverId,
        approverName: storedGrant.approver.name,
        date,
        reason,
      },
      prevHash
    );

    mockLedgerEvents.push(ledgerEntry);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: storedGrant.id,
          squadId: storedGrant.squadId,
          memberId,
          memberName: storedGrant.membership.user.name,
          approverId: storedGrant.approverId,
          approverName: storedGrant.approver.name,
          date,
          reason: storedGrant.reason,
          createdAt: storedGrant.createdAt.toISOString(),
        },
        ledgerHash: ledgerEntry.hash,
        message: 'Freeze grant approved and recorded on immutable ledger',
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get('memberId');
  const squadId = request.nextUrl.searchParams.get('squadId');
  if (squadId) {
    const access = await requireSquadRole(squadId);
    if (!access.ok) return access.response;
  }
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const memberships = await getPrisma().membership.findMany({
    where: {
      userId: actor.value.userId,
      ...(squadId ? { squadId } : {}),
    },
    select: { id: true, squadId: true, userId: true },
  });
  const squadIds = new Set(memberships.map((membership) => membership.squadId));
  const grants = await getPrisma().freezeGrant.findMany({
    where: {
      squadId: { in: [...squadIds] },
      ...(memberId ? { membership: { userId: memberId } } : {}),
    },
    include: {
      membership: {
        include: { user: { select: { id: true, name: true } } },
      },
      approver: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json({
    success: true,
    data: grants.map(({ membership, approver, date, ...grant }) => ({
      ...grant,
      memberId: membership.user.id,
      memberName: membership.user.name,
      approverName: approver.name,
      date: date.toISOString().slice(0, 10),
    })),
  });
}
