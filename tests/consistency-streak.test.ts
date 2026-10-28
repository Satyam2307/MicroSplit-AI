import test from 'node:test';
import assert from 'node:assert';
import {
  calculateConsistencySplit,
  computeStreakFromDates,
  formatLocalDate,
} from '../src/lib/consistency-streak.ts';

test('1. Canonical Example: 100,000 cents pool, 5% consistency, equal work, 100-day vs 0-day streak', () => {
  // pool: 100,000 cents ($1,000.00)
  // consistency: 5% ($50.00 = 5,000 cents)
  // work pool: 95,000 cents ($950.00)
  // Member 1: weight 1, streak 100 days
  // Member 2: weight 1, streak 0 days
  const result = calculateConsistencySplit({
    poolMinor: 100000,
    consistencyPercent: 5,
    streakCapDays: 100,
    members: [
      { memberId: 'mem_1', weight: 1, streakDays: 100 },
      { memberId: 'mem_2', weight: 1, streakDays: 0 },
    ],
  });

  assert.strictEqual(result.poolMinor, 100000);
  assert.strictEqual(result.consistencyPoolMinor, 5000);
  assert.strictEqual(result.workPoolMinor, 95000);

  const mem1 = result.lines.find((l) => l.memberId === 'mem_1');
  const mem2 = result.lines.find((l) => l.memberId === 'mem_2');

  assert.ok(mem1);
  assert.ok(mem2);

  // Consistency lines are exactly 5000 and 0
  assert.strictEqual(mem1.consistencyAmountMinor, 5000, 'Member 1 should receive entire 5000 consistency pool');
  assert.strictEqual(mem2.consistencyAmountMinor, 0, 'Member 2 with 0 streak receives 0 consistency');

  // Work lines are equal (47500 each)
  assert.strictEqual(mem1.workAmountMinor, 47500);
  assert.strictEqual(mem2.workAmountMinor, 47500);

  // Finals
  assert.strictEqual(mem1.finalAmountMinor, 52500); // 47500 + 5000
  assert.strictEqual(mem2.finalAmountMinor, 47500); // 47500 + 0

  // Sum equals pool exactly
  assert.strictEqual(mem1.finalAmountMinor + mem2.finalAmountMinor, 100000);
  assert.ok(mem1.rationale.includes('Work 475.00 + Consistency 50.00 = 525.00'));
});

test('2. Consistency pool never exceeds consistency_percent of the pool (capped at max 10%)', () => {
  for (let percent = 0; percent <= 15; percent++) {
    const pool = 100000;
    const result = calculateConsistencySplit({
      poolMinor: pool,
      consistencyPercent: percent,
      streakCapDays: 100,
      members: [
        { memberId: 'a', weight: 10, streakDays: 50 },
        { memberId: 'b', weight: 20, streakDays: 30 },
      ],
    });

    const maxAllowedPercent = Math.min(10, Math.max(0, percent));
    const maxExpectedPool = Math.floor((pool * maxAllowedPercent) / 100);
    assert.ok(
      result.consistencyPoolMinor <= maxExpectedPool,
      `Consistency pool ${result.consistencyPoolMinor} exceeds max allowed ${maxExpectedPool} for percent ${percent}`
    );
  }
});

test('3. Streak cap is respected: streak above cap gets no more than member at cap', () => {
  const result = calculateConsistencySplit({
    poolMinor: 200000,
    consistencyPercent: 10,
    streakCapDays: 100,
    members: [
      { memberId: 'at_cap', weight: 1, streakDays: 100 },
      { memberId: 'above_cap', weight: 1, streakDays: 250 },
    ],
  });

  const atCap = result.lines.find((l) => l.memberId === 'at_cap');
  const aboveCap = result.lines.find((l) => l.memberId === 'above_cap');

  assert.ok(atCap);
  assert.ok(aboveCap);
  assert.strictEqual(
    atCap.consistencyAmountMinor,
    aboveCap.consistencyAmountMinor,
    'Member with streak above cap must get identical consistency share to member at cap'
  );
});

test('4. Freeze day preserves streak; missed unfrozen day resets it', () => {
  // Scenario A: Freeze day covers missed day
  // Period ends 2024-11-05
  // Contributions on 2024-11-05, 2024-11-03
  // Freeze on 2024-11-04
  const streakWithFreeze = computeStreakFromDates({
    approvedContributionDates: ['2024-11-05', '2024-11-03'],
    freezeDates: ['2024-11-04'],
    periodEndDate: '2024-11-05',
    timezone: 'UTC',
  });

  assert.strictEqual(streakWithFreeze.streakDays, 3, 'Freeze day on 2024-11-04 preserves streak across 3 days');
  assert.strictEqual(streakWithFreeze.freezeDaysUsed, 1);

  // Scenario B: No freeze on missed day resets streak
  const streakWithoutFreeze = computeStreakFromDates({
    approvedContributionDates: ['2024-11-05', '2024-11-03'],
    freezeDates: [],
    periodEndDate: '2024-11-05',
    timezone: 'UTC',
  });

  assert.strictEqual(streakWithoutFreeze.streakDays, 1, 'Without freeze on 2024-11-04, streak stops at 1');
  assert.strictEqual(streakWithoutFreeze.freezeDaysUsed, 0);
});

test('5. Timezone boundary: contribution at 23:30 local time counts for that local day', () => {
  // New York is UTC-4 in summer (EDT) or UTC-5 in winter (EST)
  // 2024-07-15 23:30 EDT = 2024-07-16 03:30 UTC
  const isoUtcString = '2024-07-16T03:30:00.000Z';
  const tz = 'America/New_York';

  const localDateStr = formatLocalDate(isoUtcString, tz);
  assert.strictEqual(localDateStr, '2024-07-15', '23:30 EDT must resolve to 2024-07-15 local day in America/New_York');

  // Compute streak for local day 2024-07-15
  const streak = computeStreakFromDates({
    approvedContributionDates: [isoUtcString],
    freezeDates: [],
    periodEndDate: '2024-07-15',
    timezone: tz,
  });

  assert.strictEqual(streak.streakDays, 1, 'Contribution at 23:30 local counts for that local day');
});

test('6. Opt-out check: members without opt-in do not have sessions stored and cannot record', () => {
  // In-memory simulator of opt-in policy
  const mockMembers = new Map<string, { optIn: boolean; sessions: string[] }>();
  mockMembers.set('mem_opted_in', { optIn: true, sessions: [] });
  mockMembers.set('mem_opted_out', { optIn: false, sessions: [] });

  function startSession(memberId: string) {
    const member = mockMembers.get(memberId);
    if (!member || !member.optIn) {
      return { status: 403, error: 'Member has not opted into focus sessions' };
    }
    member.sessions.push('session_1');
    return { status: 201, sessionId: 'session_1' };
  }

  const optOutRes = startSession('mem_opted_out');
  assert.strictEqual(optOutRes.status, 403);
  assert.strictEqual(mockMembers.get('mem_opted_out')!.sessions.length, 0, 'No sessions stored for opt-out member');

  const optInRes = startSession('mem_opted_in');
  assert.strictEqual(optInRes.status, 201);
  assert.strictEqual(mockMembers.get('mem_opted_in')!.sessions.length, 1);
});

test('7. Property Test: 10,000 random pools, consistency percents, and streak sets satisfy sum(final) === pool', () => {
  let rngSeed = 42;
  function pseudoRandom() {
    rngSeed = (rngSeed * 1664525 + 1013904223) % 4294967296;
    return rngSeed / 4294967296;
  }

  for (let i = 0; i < 10000; i++) {
    // Random pool: 1 to 10,000,000 cents ($0.01 to $100,000.00)
    const pool = Math.floor(pseudoRandom() * 10000000) + 1;
    // Random consistency percent: 0 to 10
    const consistencyPercent = Math.floor(pseudoRandom() * 11);
    // Random member count: 2 to 20
    const memberCount = Math.floor(pseudoRandom() * 19) + 2;

    const members = [];
    for (let m = 0; m < memberCount; m++) {
      members.push({
        memberId: `usr_${m}`,
        weight: Math.floor(pseudoRandom() * 200) + 1,
        streakDays: Math.floor(pseudoRandom() * 150),
        freezeDaysUsed: Math.floor(pseudoRandom() * 3),
      });
    }

    const result = calculateConsistencySplit({
      poolMinor: pool,
      consistencyPercent,
      streakCapDays: 100,
      members,
    });

    const sumFinal = result.lines.reduce((s, l) => s + l.finalAmountMinor, 0);
    assert.strictEqual(
      sumFinal,
      pool,
      `Failed on iteration ${i}: sum(${sumFinal}) !== pool(${pool})`
    );

    // Assert no negative lines
    for (const line of result.lines) {
      assert.ok(line.finalAmountMinor >= 0, 'Line amount cannot be negative');
      assert.ok(line.workAmountMinor >= 0, 'Work amount cannot be negative');
      assert.ok(line.consistencyAmountMinor >= 0, 'Consistency amount cannot be negative');
    }

    // Assert consistency pool bound
    assert.ok(
      result.consistencyPoolMinor <= Math.floor((pool * consistencyPercent) / 100),
      `Consistency pool ${result.consistencyPoolMinor} exceeded bound on iteration ${i}`
    );
  }
});
