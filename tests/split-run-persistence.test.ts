import assert from "node:assert/strict";
import test from "node:test";
import {
  allocateByLargestRemainder,
  calculateConsistencySplit,
} from "../src/lib/consistency-streak.ts";
import {
  createSplitRunInTransaction,
  getConfirmedContributionWhere,
  getContributionActivityDate,
  isConfirmedContributionEligible,
  parseCreateSplitRunInput,
  toSplitRunDTO,
} from "../src/lib/split-run-persistence.ts";
import type { SplitRunDTO } from "../src/lib/split-run-types.ts";
import type {
  CreateSplitRunInput,
  SplitRunCreateRecord,
  SplitRunFreezeDate,
  SplitRunMembershipRecord,
  SplitRunRevenueRecord,
  SplitRunTransaction,
} from "../src/lib/split-run-persistence.ts";
import { normalizeContributionDate } from "../src/lib/evidence-extraction.ts";

const requestInput: CreateSplitRunInput = {
  squadId: "squad-1",
  revenueEventId: "revenue-1",
  ruleConfig: {
    consistency_percent: 5,
    streak_cap_days: 100,
    freeze_days_per_30: 2,
  },
  memberSplits: [
    { memberId: "user-a", percentage: 60 },
    { memberId: "user-b", percentage: 40 },
  ],
};

const memberships: SplitRunMembershipRecord[] = [
  {
    id: "membership-a",
    userId: "user-a",
    role: "owner",
    timezone: "UTC",
    userName: "Avery",
  },
  {
    id: "membership-b",
    userId: "user-b",
    role: "contributor",
    timezone: "UTC",
    userName: "Blake",
  },
];

const revenueEvent: SplitRunRevenueRecord = {
  id: "revenue-1",
  squadId: "squad-1",
  amountMinor: 101,
  currency: "USD",
};

class MemorySplitRunDatabase {
  state: {
    runs: SplitRunDTO[];
    snapshots: Record<string, string>;
    lineMemberships: Record<string, { memberId: string; membershipId: string }[]>;
  } = { runs: [], snapshots: {}, lineMemberships: {} };
  contributionDates = [
    { memberId: "user-a", createdAt: new Date("2026-03-05T12:00:00.000Z") },
    { memberId: "user-a", createdAt: new Date("2026-03-04T12:00:00.000Z") },
    { memberId: "user-a", createdAt: new Date("2026-03-02T12:00:00.000Z") },
    { memberId: "user-b", createdAt: new Date("2026-03-05T12:00:00.000Z") },
  ];
  freezeDates: SplitRunFreezeDate[] = [
    { memberId: "membership-a", date: new Date("2026-03-03T00:00:00.000Z") },
  ];
  failCreate = false;

  async transaction<T>(
    operation: (transaction: SplitRunTransaction) => Promise<T>
  ): Promise<T> {
    const working = structuredClone(this.state);
    const transaction: SplitRunTransaction = {
      getSquadMemberships: async (squadId) =>
        squadId === "squad-1" ? memberships : [],
      getActiveRevenueEvent: async (squadId, revenueEventId) =>
        squadId === revenueEvent.squadId && revenueEventId === revenueEvent.id
          ? revenueEvent
          : null,
      getContributionDates: async (_squadId, memberIds) =>
        this.contributionDates.filter((item) =>
          memberIds.includes(item.memberId)
        ),
      getFreezeDates: async (membershipIds) =>
        this.freezeDates.filter((item) =>
          membershipIds.includes(item.memberId)
        ),
      getLatestCalculationVersion: async (revenueEventId) =>
        working.runs
          .filter((run) => run.revenueEventId === revenueEventId)
          .reduce<number | null>(
            (latest, run) =>
              latest === null
                ? run.calculationVersion
                : Math.max(latest, run.calculationVersion),
            null
            ),
      createRun: async (record: SplitRunCreateRecord) => {
        const id = `persisted-run-${working.runs.length + 1}`;
        const lines = record.lines.map((line, index) => ({
          id: `${id}-line-${index + 1}`,
          runId: id,
          memberId: line.memberId,
          membershipId: line.membershipId,
          memberName:
            memberships.find((membership) => membership.id === line.membershipId)
              ?.userName ?? "Former member",
          weight: line.weight,
          amountMinor: line.amountMinor,
          workAmountMinor: line.workAmountMinor,
          consistencyAmountMinor: line.consistencyAmountMinor,
          streakDays: line.streakDays,
          freezeDaysUsed: line.freezeDaysUsed,
          rationale: JSON.parse(line.rationaleJson),
          weightBasis: { percentage: line.weight },
        }));
        const run: SplitRunDTO = {
          id,
          revenueEventId: record.revenueEventId,
          squadId: revenueEvent.squadId,
          currency: revenueEvent.currency,
          ruleVersion: record.ruleVersion,
          calculationVersion: record.calculationVersion,
          poolMinor: record.poolMinor,
          checksum: record.checksum,
          status: record.status,
          createdAt: "2026-03-05T12:00:00.000Z",
          lines,
          isConserved:
            lines.reduce((sum, line) => sum + line.amountMinor, 0) ===
            record.poolMinor,
        };
        working.runs.push(run);
        working.snapshots[id] = record.ruleSnapshotJson;
        working.lineMemberships[id] = record.lines.map(
          ({ memberId, membershipId }) => ({ memberId, membershipId })
        );
        if (this.failCreate) throw new Error("Injected line insert failure");
        return run;
      },
    };

    const result = await operation(transaction);
    this.state = working;
    return result;
  }
}

test("input validation rejects malformed identifiers, allocations, and rule values", () => {
  assert.equal(parseCreateSplitRunInput(requestInput).ok, true);
  assert.equal(
    parseCreateSplitRunInput({
      ...requestInput,
      memberSplits: [
        { memberId: "user-a", percentage: 70 },
        { memberId: "user-a", percentage: 30 },
      ],
    }).ok,
    false
  );
  assert.equal(
    parseCreateSplitRunInput({
      ...requestInput,
      ruleConfig: { ...requestInput.ruleConfig, consistency_percent: 11 },
    }).ok,
    false
  );
});

test("largest-remainder allocation uses deterministic ID tie-breaking", () => {
  const lines = allocateByLargestRemainder(5, [
    { id: "c", score: 1 },
    { id: "a", score: 1 },
    { id: "b", score: 1 },
  ]);
  assert.deepEqual(lines, [
    { id: "c", amountMinor: 1 },
    { id: "a", amountMinor: 2 },
    { id: "b", amountMinor: 2 },
  ]);
  assert.equal(lines.reduce((sum, line) => sum + line.amountMinor, 0), 5);
});

test("deterministic engine conserves the total amount for many pools", () => {
  for (let poolMinor = 1; poolMinor <= 2000; poolMinor += 1) {
    const result = calculateConsistencySplit({
      poolMinor,
      consistencyPercent: 7,
      streakCapDays: 100,
      members: [
        { memberId: "user-a", weight: 67, streakDays: 91 },
        { memberId: "user-b", weight: 33, streakDays: 8 },
      ],
    });

    assert.equal(
      result.lines.reduce((sum, line) => sum + line.finalAmountMinor, 0),
      poolMinor
    );
  }
});

test("only confirmed, resolved contributions from the requested squad are split-eligible", () => {
  assert.deepEqual(getConfirmedContributionWhere("squad-1", ["user-a"]), {
    memberId: { in: ["user-a"] },
    status: { in: ["confirmed"] },
    evidence: { is: { squadId: "squad-1" } },
  });
  const base = {
    memberId: "user-a",
    squadId: "squad-1",
    requestedSquadId: "squad-1",
    memberIds: ["user-a"],
  };
  assert.equal(isConfirmedContributionEligible({ ...base, status: "confirmed" }), true);
  assert.equal(isConfirmedContributionEligible({ ...base, status: "pending" }), false);
  assert.equal(isConfirmedContributionEligible({ ...base, status: "rejected" }), false);
  assert.equal(
    isConfirmedContributionEligible({ ...base, memberId: null, status: "confirmed" }),
    false
  );
  assert.equal(
    isConfirmedContributionEligible({
      ...base,
      squadId: "other-squad",
      status: "confirmed",
    }),
    false
  );
});

test("unknown extracted contribution dates do not become streak activity dates", () => {
  const createdAt = new Date("2026-03-05T12:00:00.000Z");
  const contributionDate = new Date("2026-03-02T00:00:00.000Z");
  const unresolvedDate = normalizeContributionDate("10/11/2026").date;
  assert.equal(unresolvedDate, null);
  assert.equal(
    getContributionActivityDate({
      createdAt,
      contributionDate: unresolvedDate ? new Date(`${unresolvedDate}T00:00:00.000Z`) : null,
      extractionLogId: "ai-log-1",
    }),
    null
  );
  assert.equal(
    getContributionActivityDate({
      createdAt,
      contributionDate,
      extractionLogId: "ai-log-1",
    }),
    contributionDate
  );
  assert.equal(
    getContributionActivityDate({
      createdAt,
      contributionDate: null,
      extractionLogId: null,
    }),
    createdAt
  );
});

test("retrieved run DTO uses the stored snapshot and persisted split lines", () => {
  const run = toSplitRunDTO({
    id: "run-1",
    revenueEventId: "revenue-1",
    ruleVersion: 1,
    calculationVersion: 2,
    poolMinor: 101,
    checksum: "sha256",
    status: "pending_approval",
    ruleSnapshotJson: JSON.stringify({
      currency: "USD",
      memberInputs: [
        { memberId: "user-a", memberName: "Historical name" },
      ],
    }),
    createdAt: new Date("2026-03-05T12:00:00.000Z"),
    revenueEvent: { squadId: "squad-1", currency: "EUR" },
    lines: [
      {
        id: "line-1",
        runId: "run-1",
        memberId: "user-a",
        membershipId: "membership-a",
        weight: 100,
        amountMinor: 101,
        workAmountMinor: 96,
        consistencyAmountMinor: 5,
        streakDays: 4,
        freezeDaysUsed: 1,
        rationaleJson: JSON.stringify({
          contribution_summary: "Stored calculation rationale",
        }),
        membership: { user: { name: "Current name" } },
      },
    ],
  });

  assert.equal(run.currency, "USD");
  assert.equal(run.calculationVersion, 2);
  assert.equal(run.lines[0].memberName, "Historical name");
  assert.equal(run.lines[0].membershipId, "membership-a");
  assert.equal(run.lines[0].amountMinor, 101);
  assert.equal(run.isConserved, true);
});

test("split run creation persists versioned lines and the exact calculation snapshot", async () => {
  const database = new MemorySplitRunDatabase();
  const result = await database.transaction((tx) =>
    createSplitRunInTransaction(tx, "user-a", requestInput, "2026-03-05")
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(database.state.runs.length, 1);
  assert.equal(result.data.calculationVersion, 1);
  assert.equal(result.data.poolMinor, 101);
  assert.equal(result.data.isConserved, true);
  assert.deepEqual(
    database.state.lineMemberships[result.data.id],
    [
      { memberId: "user-a", membershipId: "membership-a" },
      { memberId: "user-b", membershipId: "membership-b" },
    ]
  );
  assert.equal(
    result.data.lines.reduce((sum, line) => sum + line.amountMinor, 0),
    101
  );
  assert.equal(result.data.lines[0].freezeDaysUsed, 1);
  assert.equal(result.data.lines[0].membershipId, "membership-a");

  const snapshot = JSON.parse(database.state.snapshots[result.data.id]);
  assert.equal(snapshot.engine, "calculateConsistencySplit");
  assert.equal(snapshot.ruleConfig.consistency_percent, 5);
  assert.equal(snapshot.memberInputs[0].membershipId, "membership-a");
  assert.equal(snapshot.memberInputs[0].freezeDaysUsed, 1);

  const restartedServiceView = database.state.runs.find(
    (run) => run.id === result.data.id
  );
  assert.deepEqual(restartedServiceView, result.data);
});

test("failed line persistence rolls back the split run transaction", async () => {
  const database = new MemorySplitRunDatabase();
  database.failCreate = true;

  await assert.rejects(
    database.transaction((tx) =>
      createSplitRunInTransaction(tx, "user-a", requestInput, "2026-03-05")
    ),
    /Injected line insert failure/
  );
  assert.equal(database.state.runs.length, 0);
  assert.deepEqual(database.state.snapshots, {});
});

test("non-members and unauthorized squad roles cannot create split runs", async () => {
  const database = new MemorySplitRunDatabase();
  const nonMember = await database.transaction((tx) =>
    createSplitRunInTransaction(tx, "outsider", requestInput, "2026-03-05")
  );
  assert.deepEqual(nonMember, {
    ok: false,
    status: 403,
    error: "You do not have permission to create split runs for this squad",
  });

  const contributorDatabase = new MemorySplitRunDatabase();
  const contributorMemberships = memberships.map((membership) =>
    membership.userId === "user-a"
      ? { ...membership, role: "contributor" }
      : membership
  );
  const denied = await contributorDatabase.transaction(async (tx) =>
    createSplitRunInTransaction(
      {
        ...tx,
        getSquadMemberships: async (squadId) =>
          squadId === "squad-1" ? contributorMemberships : [],
      },
      "user-a",
      requestInput,
      "2026-03-05"
    )
  );
  assert.equal(denied.ok, false);
  if (!denied.ok) assert.equal(denied.status, 403);
  assert.equal(contributorDatabase.state.runs.length, 0);
});

test("source changes create a new version and do not alter historical results", async () => {
  const database = new MemorySplitRunDatabase();
  const first = await database.transaction((tx) =>
    createSplitRunInTransaction(tx, "user-a", requestInput, "2026-03-05")
  );
  assert.equal(first.ok, true);
  if (!first.ok) return;

  const firstRunSnapshot = structuredClone(first.data);
  const firstRuleSnapshot = database.state.snapshots[first.data.id];
  database.contributionDates = [
    ...database.contributionDates,
    { memberId: "user-b", createdAt: new Date("2026-03-04T12:00:00.000Z") },
  ];
  const recalculatedInput: CreateSplitRunInput = {
    ...requestInput,
    memberSplits: [
      { memberId: "user-a", percentage: 40 },
      { memberId: "user-b", percentage: 60 },
    ],
  };
  const second = await database.transaction((tx) =>
    createSplitRunInTransaction(
      tx,
      "user-a",
      recalculatedInput,
      "2026-03-05"
    )
  );

  assert.equal(second.ok, true);
  if (!second.ok) return;
  assert.equal(second.data.calculationVersion, 2);
  assert.deepEqual(database.state.runs[0], firstRunSnapshot);
  assert.equal(database.state.snapshots[first.data.id], firstRuleSnapshot);
  assert.notDeepEqual(
    second.data.lines.map(({ amountMinor }) => amountMinor),
    first.data.lines.map(({ amountMinor }) => amountMinor)
  );
});
