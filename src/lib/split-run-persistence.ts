import { createHash } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  calculateConsistencySplit,
  computeStreakFromDates,
} from "./consistency-streak.ts";
import type {
  SplitLineRationale,
  SplitRunDTO,
} from "@/lib/split-run-types";

export interface SplitRunRuleConfig {
  consistency_percent: number;
  streak_cap_days: number;
  freeze_days_per_30: number;
}

export interface SubmittedMemberSplit {
  memberId: string;
  percentage: number;
}

export interface CreateSplitRunInput {
  squadId: string;
  revenueEventId: string;
  ruleConfig: SplitRunRuleConfig;
  memberSplits: SubmittedMemberSplit[];
}

export type SplitRunInputValidation =
  | { ok: true; value: CreateSplitRunInput }
  | { ok: false; error: string };

export function parseCreateSplitRunInput(value: unknown): SplitRunInputValidation {
  if (!isRecord(value)) {
    return { ok: false, error: "Request body must be an object" };
  }

  if (!isNonEmptyId(value.squadId) || !isNonEmptyId(value.revenueEventId)) {
    return {
      ok: false,
      error: "squadId and revenueEventId are required identifiers",
    };
  }

  const rawSplits = value.memberSplits;
  if (
    !Array.isArray(rawSplits) ||
    rawSplits.length === 0 ||
    !rawSplits.every(isSubmittedMemberSplit)
  ) {
    return {
      ok: false,
      error: "memberSplits must contain at least one valid member allocation",
    };
  }

  const memberSplits = rawSplits;
  if (
    new Set(memberSplits.map(({ memberId }) => memberId)).size !==
      memberSplits.length ||
    Math.abs(
      memberSplits.reduce((total, member) => total + member.percentage, 0) - 100
    ) > 0.05
  ) {
    return {
      ok: false,
      error: "Member percentages must be unique and sum to 100%",
    };
  }

  const rawConfig = value.ruleConfig;
  if (rawConfig !== undefined && !isRecord(rawConfig)) {
    return { ok: false, error: "ruleConfig must be an object" };
  }
  const config = rawConfig ?? {};
  const ruleConfig: SplitRunRuleConfig = {
    consistency_percent:
      config.consistency_percent === undefined
        ? 5
        : readNumber(config.consistency_percent),
    streak_cap_days:
      config.streak_cap_days === undefined
        ? 100
        : readNumber(config.streak_cap_days),
    freeze_days_per_30:
      config.freeze_days_per_30 === undefined
        ? 2
        : readNumber(config.freeze_days_per_30),
  };

  if (
    !Number.isFinite(ruleConfig.consistency_percent) ||
    ruleConfig.consistency_percent < 0 ||
    ruleConfig.consistency_percent > 10
  ) {
    return {
      ok: false,
      error: "consistency_percent must be between 0 and 10",
    };
  }
  if (
    !Number.isInteger(ruleConfig.streak_cap_days) ||
    ruleConfig.streak_cap_days < 1 ||
    ruleConfig.streak_cap_days > 3650
  ) {
    return {
      ok: false,
      error: "streak_cap_days must be an integer between 1 and 3650",
    };
  }
  if (
    !Number.isInteger(ruleConfig.freeze_days_per_30) ||
    ruleConfig.freeze_days_per_30 < 0 ||
    ruleConfig.freeze_days_per_30 > 30
  ) {
    return {
      ok: false,
      error: "freeze_days_per_30 must be an integer between 0 and 30",
    };
  }

  return {
    ok: true,
    value: {
      squadId: value.squadId,
      revenueEventId: value.revenueEventId,
      ruleConfig,
      memberSplits,
    },
  };
}

export interface SplitRunMembershipRecord {
  id: string;
  userId: string;
  role: string;
  timezone: string;
  userName: string;
}

export interface SplitRunRevenueRecord {
  id: string;
  squadId: string;
  amountMinor: number;
  currency: string;
}

export interface SplitRunContributionDate {
  memberId: string;
  createdAt: Date;
}

export const SPLIT_ELIGIBLE_CONTRIBUTION_STATUSES = ["confirmed"] as const;

export function isConfirmedContributionEligible(input: {
  status: string;
  memberId: string | null;
  squadId: string;
  requestedSquadId: string;
  memberIds: readonly string[];
}): boolean {
  return (
    (SPLIT_ELIGIBLE_CONTRIBUTION_STATUSES as readonly string[]).includes(
      input.status
    ) &&
    input.memberId !== null &&
    input.squadId === input.requestedSquadId &&
    input.memberIds.includes(input.memberId)
  );
}

export function getContributionActivityDate(input: {
  createdAt: Date;
  contributionDate: Date | null;
  extractionLogId: string | null;
}): Date | null {
  if (input.contributionDate) return input.contributionDate;
  return input.extractionLogId === null ? input.createdAt : null;
}

export function getConfirmedContributionWhere(
  squadId: string,
  memberIds: string[]
): Prisma.ContributionWhereInput {
  return {
    memberId: { in: memberIds },
    status: { in: [...SPLIT_ELIGIBLE_CONTRIBUTION_STATUSES] },
    evidence: { is: { squadId } },
  };
}

export interface SplitRunFreezeDate {
  memberId: string;
  date: Date;
}

export interface SplitRunLineCreateRecord {
  memberId: string;
  membershipId: string;
  weight: number;
  amountMinor: number;
  workAmountMinor: number;
  consistencyAmountMinor: number;
  streakDays: number;
  freezeDaysUsed: number;
  rationaleJson: string;
}

export interface SplitRunCreateRecord {
  revenueEventId: string;
  ruleVersion: number;
  calculationVersion: number;
  poolMinor: number;
  checksum: string;
  status: "pending_approval";
  ruleSnapshotJson: string;
  lines: SplitRunLineCreateRecord[];
}

export interface SplitRunTransaction {
  getSquadMemberships(
    squadId: string
  ): Promise<SplitRunMembershipRecord[]>;
  getActiveRevenueEvent(
    squadId: string,
    revenueEventId: string
  ): Promise<SplitRunRevenueRecord | null>;
  getContributionDates(
    squadId: string,
    memberIds: string[]
  ): Promise<SplitRunContributionDate[]>;
  getFreezeDates(membershipIds: string[]): Promise<SplitRunFreezeDate[]>;
  getLatestCalculationVersion(revenueEventId: string): Promise<number | null>;
  createRun(record: SplitRunCreateRecord): Promise<SplitRunDTO>;
}

export type CreateSplitRunResult =
  | { ok: true; data: SplitRunDTO }
  | { ok: false; status: 400 | 403 | 404; error: string };

export async function createSplitRunInTransaction(
  tx: SplitRunTransaction,
  actorId: string,
  input: CreateSplitRunInput,
  periodEndDate = new Date().toISOString().slice(0, 10)
): Promise<CreateSplitRunResult> {
  const memberships = await tx.getSquadMemberships(input.squadId);
  const actorMembership = memberships.find(
    (membership) => membership.userId === actorId
  );
  if (!actorMembership || !["owner", "approver"].includes(actorMembership.role)) {
    return {
      ok: false,
      status: 403,
      error: "You do not have permission to create split runs for this squad",
    };
  }

  const revenueEvent = await tx.getActiveRevenueEvent(
    input.squadId,
    input.revenueEventId
  );
  if (!revenueEvent) {
    return {
      ok: false,
      status: 404,
      error: "Active revenue event was not found in this squad",
    };
  }
  if (
    !Number.isSafeInteger(revenueEvent.amountMinor) ||
    revenueEvent.amountMinor <= 0 ||
    revenueEvent.amountMinor > 2_147_483_647
  ) {
    return {
      ok: false,
      status: 400,
      error: "Revenue event must have a positive integer amount",
    };
  }

  const activeSplits = input.memberSplits.filter(({ percentage }) => percentage > 0);
  const memberSplits = activeSplits.length > 0 ? activeSplits : input.memberSplits;
  const membershipByUserId = new Map(
    memberships.map((membership) => [membership.userId, membership])
  );
  const selectedMemberships: SplitRunMembershipRecord[] = [];
  for (const { memberId } of memberSplits) {
    const membership = membershipByUserId.get(memberId);
    if (!membership) {
      return {
        ok: false,
        status: 400,
        error: "Every split recipient must be a member of this squad",
      };
    }
    selectedMemberships.push(membership);
  }

  const memberIds = selectedMemberships.map(({ userId }) => userId);
  const membershipIds = selectedMemberships.map(({ id }) => id);
  const [contributionDates, freezeDates, latestVersion] = await Promise.all([
    tx.getContributionDates(input.squadId, memberIds),
    tx.getFreezeDates(membershipIds),
    tx.getLatestCalculationVersion(revenueEvent.id),
  ]);
  const calculationVersion = (latestVersion ?? 0) + 1;

  const inputSnapshots = selectedMemberships.map((membership) => {
      const memberContributions = contributionDates
        .filter((contribution) => contribution.memberId === membership.userId)
        .map((contribution) => contribution.createdAt);
      const memberFreezeDates = freezeDates
        .filter((grant) => grant.memberId === membership.id)
        .map((grant) => grant.date);
      const streak = computeStreakFromDates({
        approvedContributionDates: memberContributions,
        freezeDates: memberFreezeDates,
        periodEndDate,
        timezone: membership.timezone || "UTC",
      });
      const submittedWeight = memberSplits.find(
        ({ memberId }) => memberId === membership.userId
      )?.percentage;
      if (submittedWeight === undefined) {
        throw new Error(`Missing submitted weight for member ${membership.userId}`);
      }
      return {
        memberId: membership.userId,
        membershipId: membership.id,
        memberName: membership.userName,
        timezone: membership.timezone || "UTC",
        weight: submittedWeight,
        streakDays: streak.streakDays,
        freezeDaysUsed: streak.freezeDaysUsed,
        countingDates: streak.countingDates,
        contributionDates: memberContributions.map((date) =>
          date.toISOString()
        ),
        freezeGrantDates: memberFreezeDates.map((date) =>
          date.toISOString().slice(0, 10)
        ),
      };
    })
    .sort((left, right) => left.memberId.localeCompare(right.memberId));
  const result = calculateConsistencySplit({
    poolMinor: revenueEvent.amountMinor,
    consistencyPercent: input.ruleConfig.consistency_percent,
    streakCapDays: input.ruleConfig.streak_cap_days,
    members: inputSnapshots.map(
      ({ memberId, weight, streakDays, freezeDaysUsed }) => ({
        memberId,
        weight,
        streakDays,
        freezeDaysUsed,
      })
    ),
  });

  const ruleSnapshotJson = JSON.stringify({
    engine: "calculateConsistencySplit",
    engineVersion: 1,
    ruleVersion: 1,
    calculationVersion,
    periodEndDate,
    currency: revenueEvent.currency,
    ruleConfig: input.ruleConfig,
    poolMinor: revenueEvent.amountMinor,
    workPoolMinor: result.workPoolMinor,
    consistencyPoolMinor: result.consistencyPoolMinor,
    memberInputs: inputSnapshots,
  });

  const lineRecords: SplitRunLineCreateRecord[] = result.lines.map((line) => {
    const membership = membershipByUserId.get(line.memberId);
    if (!membership) {
      throw new Error(`Missing squad membership for member ${line.memberId}`);
    }
    const rationale: SplitLineRationale = {
      rule_type: "fixed_percentage",
      contribution_summary: line.rationale,
      weight_calculation: `${line.weight}% work weight; consistency share uses the saved streak input`,
      evidence_refs: [],
      evidence_count: 0,
      consistency_days: line.streakDays,
    };
    return {
      memberId: line.memberId,
      membershipId: membership.id,
      weight: line.weight,
      amountMinor: line.finalAmountMinor,
      workAmountMinor: line.workAmountMinor,
      consistencyAmountMinor: line.consistencyAmountMinor,
      streakDays: line.streakDays,
      freezeDaysUsed: line.freezeDaysUsed,
      rationaleJson: JSON.stringify(rationale),
    };
  });
  const checksum = computeSplitRunSnapshotChecksum({
    revenueEventId: revenueEvent.id,
    squadId: revenueEvent.squadId,
    poolMinor: revenueEvent.amountMinor,
    ruleVersion: 1,
    calculationVersion,
    ruleSnapshotJson,
    lines: lineRecords,
  });

  const data = await tx.createRun({
    revenueEventId: revenueEvent.id,
    ruleVersion: 1,
    calculationVersion,
    poolMinor: revenueEvent.amountMinor,
    checksum,
    status: "pending_approval",
    ruleSnapshotJson,
    lines: lineRecords,
  });

  return { ok: true, data };
}

export function computeSplitRunSnapshotChecksum(input: {
  revenueEventId: string;
  squadId: string;
  poolMinor: number;
  ruleVersion: number;
  calculationVersion: number;
  ruleSnapshotJson: string;
  lines: SplitRunLineCreateRecord[];
}): string {
  const lines = [...input.lines]
    .sort((left, right) => left.memberId.localeCompare(right.memberId))
    .map((line) => ({
      memberId: line.memberId,
      membershipId: line.membershipId,
      weight: line.weight,
      amountMinor: line.amountMinor,
      workAmountMinor: line.workAmountMinor,
      consistencyAmountMinor: line.consistencyAmountMinor,
      streakDays: line.streakDays,
      freezeDaysUsed: line.freezeDaysUsed,
      rationaleJson: line.rationaleJson,
    }));
  const payload = JSON.stringify({
    revenueEventId: input.revenueEventId,
    squadId: input.squadId,
    poolMinor: input.poolMinor,
    ruleVersion: input.ruleVersion,
    calculationVersion: input.calculationVersion,
    ruleSnapshotJson: input.ruleSnapshotJson,
    lines,
  });
  return createHash("sha256").update(payload).digest("hex");
}

export const splitRunInclude = {
  revenueEvent: { select: { squadId: true, currency: true } },
  lines: {
    include: {
      membership: {
        select: { user: { select: { name: true } } },
      },
    },
  },
} satisfies Prisma.SplitRunInclude;

interface SplitRunRecord {
  id: string;
  revenueEventId: string;
  ruleVersion: number;
  calculationVersion: number;
  poolMinor: number;
  checksum: string;
  status: string;
  ruleSnapshotJson: string | null;
  createdAt: Date;
  revenueEvent: { squadId: string; currency: string };
  lines: {
    id: string;
    runId: string;
    memberId: string;
    membershipId: string | null;
    weight: number;
    amountMinor: number;
    workAmountMinor: number;
    consistencyAmountMinor: number;
    streakDays: number;
    freezeDaysUsed: number;
    rationaleJson: string;
    membership: { user: { name: string } } | null;
  }[];
}

export function toSplitRunDTO(run: SplitRunRecord): SplitRunDTO {
  const snapshot = readSplitRunSnapshot(run.ruleSnapshotJson);
  const lines = run.lines.map((line) => {
    const parsed: unknown = JSON.parse(line.rationaleJson);
    if (!isSplitLineRationale(parsed)) {
      throw new Error(`Split line ${line.id} contains invalid rationale JSON`);
    }
    return {
      id: line.id,
      runId: line.runId,
      memberId: line.memberId,
      membershipId: line.membershipId,
      memberName:
        snapshot.memberNames.get(line.memberId) ??
        line.membership?.user.name ??
        "Former member",
      weight: line.weight,
      amountMinor: line.amountMinor,
      workAmountMinor: line.workAmountMinor,
      consistencyAmountMinor: line.consistencyAmountMinor,
      streakDays: line.streakDays,
      freezeDaysUsed: line.freezeDaysUsed,
      rationale: parsed,
      weightBasis: { percentage: line.weight },
    };
  });
  const allocatedTotal = lines.reduce((sum, line) => sum + line.amountMinor, 0);
  return {
    id: run.id,
    revenueEventId: run.revenueEventId,
    squadId: run.revenueEvent.squadId,
    currency: snapshot.currency ?? run.revenueEvent.currency,
    ruleVersion: run.ruleVersion,
    calculationVersion: run.calculationVersion,
    poolMinor: run.poolMinor,
    checksum: run.checksum,
    status: run.status,
    createdAt: run.createdAt.toISOString(),
    lines,
    isConserved: allocatedTotal === run.poolMinor,
  };
}

export async function createPersistentSplitRun(
  prisma: PrismaClient,
  actorId: string,
  input: CreateSplitRunInput,
  periodEndDate?: string
): Promise<CreateSplitRunResult> {
  return prisma.$transaction(
    async (tx) => {
      const transaction: SplitRunTransaction = {
        async getSquadMemberships(squadId) {
          const memberships = await tx.membership.findMany({
            where: { squadId },
            select: {
              id: true,
              userId: true,
              role: true,
              timezone: true,
              user: { select: { name: true } },
            },
            orderBy: { userId: "asc" },
          });
          return memberships.map((membership) => ({
            ...membership,
            userName: membership.user.name,
          }));
        },
        async getActiveRevenueEvent(squadId, revenueEventId) {
          return tx.revenueEvent.findFirst({
            where: { id: revenueEventId, squadId, status: "active" },
            select: { id: true, squadId: true, amountMinor: true, currency: true },
          });
        },
        async getContributionDates(squadId, memberIds) {
          const contributions = await tx.contribution.findMany({
            where: getConfirmedContributionWhere(squadId, memberIds),
            select: {
              memberId: true,
              createdAt: true,
              contributionDate: true,
              extractionLogId: true,
            },
          });
          return contributions.flatMap((contribution) => {
            const activityDate = getContributionActivityDate(contribution);
            return contribution.memberId && activityDate
              ? [{
                  memberId: contribution.memberId,
                  createdAt: activityDate,
                }]
              : []
          });
        },
        getFreezeDates(membershipIds) {
          return tx.freezeGrant.findMany({
            where: { memberId: { in: membershipIds } },
            select: { memberId: true, date: true },
          });
        },
        async getLatestCalculationVersion(revenueEventId) {
          const latest = await tx.splitRun.findFirst({
            where: { revenueEventId },
            orderBy: { calculationVersion: "desc" },
            select: { calculationVersion: true },
          });
          return latest?.calculationVersion ?? null;
        },
        async createRun(record) {
          const created = await tx.splitRun.create({
            data: {
              revenueEventId: record.revenueEventId,
              ruleVersion: record.ruleVersion,
              calculationVersion: record.calculationVersion,
              ruleSnapshotJson: record.ruleSnapshotJson,
              poolMinor: record.poolMinor,
              checksum: record.checksum,
              status: record.status,
              lines: {
                create: record.lines.map((line) => ({
                  memberId: line.memberId,
                  membershipId: line.membershipId,
                  weight: line.weight,
                  amountMinor: line.amountMinor,
                  workAmountMinor: line.workAmountMinor,
                  consistencyAmountMinor: line.consistencyAmountMinor,
                  streakDays: line.streakDays,
                  freezeDaysUsed: line.freezeDaysUsed,
                  rationaleJson: line.rationaleJson,
                })),
              },
            },
            include: splitRunInclude,
          });
          return toSplitRunDTO(created);
        },
      };
      return createSplitRunInTransaction(
        transaction,
        actorId,
        input,
        periodEndDate
      );
    },
    { isolationLevel: "Serializable" }
  );
}

function isSubmittedMemberSplit(value: unknown): value is SubmittedMemberSplit {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyId(value.memberId) &&
    typeof value.percentage === "number" &&
    Number.isFinite(value.percentage) &&
    value.percentage >= 0 &&
    value.percentage <= 100
  );
}

function isNonEmptyId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= 128 &&
    value === value.trim()
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNumber(value: unknown): number {
  return typeof value === "number" ? value : Number.NaN;
}

function isSplitLineRationale(value: unknown): value is SplitLineRationale {
  return (
    isRecord(value) &&
    typeof value.contribution_summary === "string" &&
    (value.rule_type === undefined || typeof value.rule_type === "string") &&
    (value.weight_calculation === undefined ||
      typeof value.weight_calculation === "string") &&
    (value.evidence_refs === undefined ||
      (Array.isArray(value.evidence_refs) &&
        value.evidence_refs.every((reference) => typeof reference === "string"))) &&
    (value.evidence_count === undefined ||
      typeof value.evidence_count === "number") &&
    (value.consistency_days === undefined ||
      typeof value.consistency_days === "number")
  );
}

function readSplitRunSnapshot(snapshotJson: string | null): {
  currency: string | null;
  memberNames: Map<string, string>;
} {
  if (snapshotJson === null) {
    return { currency: null, memberNames: new Map() };
  }
  const snapshot: unknown = JSON.parse(snapshotJson);
  if (
    !isRecord(snapshot) ||
    !Array.isArray(snapshot.memberInputs) ||
    (snapshot.currency !== undefined && typeof snapshot.currency !== "string")
  ) {
    throw new Error("Split run contains invalid calculation snapshot JSON");
  }
  const memberNames = new Map<string, string>();
  for (const input of snapshot.memberInputs) {
    if (
      !isRecord(input) ||
      typeof input.memberId !== "string" ||
      typeof input.memberName !== "string"
    ) {
      throw new Error("Split run contains invalid member snapshot data");
    }
    memberNames.set(input.memberId, input.memberName);
  }
  return {
    currency: typeof snapshot.currency === "string" ? snapshot.currency : null,
    memberNames,
  };
}
