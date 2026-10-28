// Pure consistency streak calculation & split engine
// Integer cents only (minor units). Deterministic, zero floating-point money.
// Invariant: sum(all final payout lines) === pool exactly.

export interface MemberConsistencyInput {
  memberId: string;
  weight: number;
  streakDays: number;
  freezeDaysUsed?: number;
  rationale?: string;
  evidenceRefs?: string[];
}

export interface MemberSplitResult {
  memberId: string;
  weight: number;
  streakDays: number;
  freezeDaysUsed: number;
  workAmountMinor: number;
  consistencyAmountMinor: number;
  finalAmountMinor: number;
  rationale: string;
}

export interface ConsistencySplitResult {
  poolMinor: number;
  consistencyPoolMinor: number;
  workPoolMinor: number;
  consistencyPercent: number;
  streakCapDays: number;
  lines: MemberSplitResult[];
}

/**
 * Format a date or ISO string into YYYY-MM-DD in a specific IANA timezone.
 */
export function formatLocalDate(dateInput: string | Date, timezone: string = 'UTC'): string {
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // Produces 'YYYY-MM-DD'
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Deterministic allocation using the largest-remainder method (Hare-Niemeyer).
 * Stable tie-breaker: sorts alphabetically by item ID.
 * Invariant: sum(amounts) === pool (when sum(scores) > 0)
 */
export function allocateByLargestRemainder(
  totalPool: number,
  items: { id: string; score: number }[]
): { id: string; amountMinor: number }[] {
  if (items.length === 0) return [];
  if (totalPool <= 0) {
    return items.map((item) => ({ id: item.id, amountMinor: 0 }));
  }

  const totalScore = items.reduce((sum, item) => sum + Math.max(0, item.score), 0);

  if (totalScore === 0) {
    // Equal distribution when all scores are 0
    const n = items.length;
    const base = Math.floor(totalPool / n);
    let leftover = totalPool - base * n;
    return items.map((item, idx) => ({
      id: item.id,
      amountMinor: base + (idx < leftover ? 1 : 0),
    }));
  }

  // Step 1: Compute exact fractional shares
  const fractional = items.map((item) => {
    const validScore = Math.max(0, item.score);
    const exactShare = (validScore / totalScore) * totalPool;
    const floored = Math.floor(exactShare);
    const remainder = exactShare - floored;
    return { id: item.id, floored, remainder };
  });

  // Step 2: Sum floored shares and find leftover cents
  const totalFloored = fractional.reduce((s, f) => s + f.floored, 0);
  let leftover = totalPool - totalFloored;

  // Step 3: Sort by largest remainder (descending); break ties by ID alphabetically
  const sorted = [...fractional].sort((a, b) => {
    if (Math.abs(b.remainder - a.remainder) > 1e-9) {
      return b.remainder - a.remainder;
    }
    return a.id.localeCompare(b.id);
  });

  // Step 4: Distribute leftover cents to highest remainder items
  for (let i = 0; i < sorted.length && leftover > 0; i++) {
    sorted[i].floored += 1;
    leftover--;
  }

  // Map back in original order
  return items.map((item) => {
    const matched = fractional.find((f) => f.id === item.id)!;
    return {
      id: item.id,
      amountMinor: matched.floored,
    };
  });
}

/**
 * Compute consecutive streak ending on periodEndDate.
 * A day counts if there is at least 1 approved contribution on that date in member's timezone.
 * A missed day resets the streak, unless covered by an approved freeze day.
 */
export function computeStreakFromDates(params: {
  approvedContributionDates: (string | Date)[];
  freezeDates: (string | Date)[];
  periodEndDate: string | Date;
  timezone?: string;
}): {
  streakDays: number;
  freezeDaysUsed: number;
  countingDates: string[];
} {
  const tz = params.timezone || 'UTC';

  // Format all approved contribution dates into local YYYY-MM-DD set
  const contributionDateSet = new Set<string>();
  for (const d of params.approvedContributionDates) {
    contributionDateSet.add(formatLocalDate(d, tz));
  }

  // Format freeze dates into set
  const freezeDateSet = new Set<string>();
  for (const f of params.freezeDates) {
    freezeDateSet.add(formatLocalDate(f, tz));
  }

  const periodEndStr = formatLocalDate(params.periodEndDate, tz);
  const [endYear, endMonth, endDay] = periodEndStr.split('-').map(Number);
  const cursorDate = new Date(Date.UTC(endYear, endMonth - 1, endDay));

  let streakDays = 0;
  let freezeDaysUsed = 0;
  const countingDates: string[] = [];

  // Walk backwards day-by-day
  for (let i = 0; i < 3650; i++) { // safety boundary up to 10 years
    const year = cursorDate.getUTCFullYear();
    const month = String(cursorDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(cursorDate.getUTCDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    if (contributionDateSet.has(dateStr)) {
      streakDays++;
      countingDates.push(dateStr);
    } else if (freezeDateSet.has(dateStr)) {
      // Freeze day preserves streak
      freezeDaysUsed++;
      streakDays++;
      countingDates.push(`${dateStr} (frozen)`);
    } else {
      // Missed day and no freeze grant: streak broken
      break;
    }

    // Step backwards one day
    cursorDate.setUTCDate(cursorDate.getUTCDate() - 1);
  }

  return {
    streakDays,
    freezeDaysUsed,
    countingDates,
  };
}

/**
 * Pure calculation of split with consistency streak bonus.
 * 
 * Rules:
 * 1. consistency_pool = floor(pool * consistency_percent / 100) (max 10%)
 * 2. work_pool = pool - consistency_pool
 * 3. work_share[i] allocated to work_pool from weighted-points / weights
 * 4. capped_score[i] = min(streak_days[i], streak_cap_days)
 * 5. consistency_share[i] allocated proportionally to capped_score (if any capped_score > 0)
 *    If all capped_scores === 0, consistency_pool is returned to work_pool so sum === pool.
 * 6. final[i] = work_share[i] + consistency_share[i]
 * 
 * Invariants:
 * - sum(final[i]) === poolMinor exactly.
 * - consistency_pool <= floor(poolMinor * consistency_percent / 100).
 * - capped_score respects streak_cap_days.
 */
export function calculateConsistencySplit(params: {
  poolMinor: number;
  consistencyPercent?: number;
  streakCapDays?: number;
  members: MemberConsistencyInput[];
}): ConsistencySplitResult {
  const { poolMinor, members } = params;
  const consistencyPercent = Math.min(10, Math.max(0, params.consistencyPercent ?? 5));
  const streakCapDays = Math.max(1, params.streakCapDays ?? 100);

  if (members.length === 0) {
    return {
      poolMinor,
      consistencyPoolMinor: 0,
      workPoolMinor: poolMinor,
      consistencyPercent,
      streakCapDays,
      lines: [],
    };
  }

  if (poolMinor <= 0) {
    return {
      poolMinor: 0,
      consistencyPoolMinor: 0,
      workPoolMinor: 0,
      consistencyPercent,
      streakCapDays,
      lines: members.map((m) => ({
        memberId: m.memberId,
        weight: m.weight,
        streakDays: m.streakDays,
        freezeDaysUsed: m.freezeDaysUsed ?? 0,
        workAmountMinor: 0,
        consistencyAmountMinor: 0,
        finalAmountMinor: 0,
        rationale: m.rationale || 'Pool is zero',
      })),
    };
  }

  // Compute consistency pool
  const rawConsistencyPool = Math.floor((poolMinor * consistencyPercent) / 100);

  // Compute capped scores
  const cappedScores = members.map((m) => ({
    id: m.memberId,
    score: Math.min(Math.max(0, m.streakDays), streakCapDays),
  }));

  const totalCappedScore = cappedScores.reduce((sum, item) => sum + item.score, 0);

  let consistencyPoolMinor = rawConsistencyPool;
  let workPoolMinor = poolMinor - consistencyPoolMinor;

  // If no member has any streak points, reallocate consistency pool into work pool
  if (totalCappedScore === 0) {
    consistencyPoolMinor = 0;
    workPoolMinor = poolMinor;
  }

  // Step 3: Allocate work share
  const workAllocations = allocateByLargestRemainder(
    workPoolMinor,
    members.map((m) => ({ id: m.memberId, score: m.weight }))
  );

  // Step 5: Allocate consistency share (only if totalCappedScore > 0)
  const consistencyAllocations = totalCappedScore > 0
    ? allocateByLargestRemainder(consistencyPoolMinor, cappedScores)
    : members.map((m) => ({ id: m.memberId, amountMinor: 0 }));

  // Build final results
  const lines: MemberSplitResult[] = members.map((m) => {
    const workAlloc = workAllocations.find((w) => w.id === m.memberId)?.amountMinor ?? 0;
    const consAlloc = consistencyAllocations.find((c) => c.id === m.memberId)?.amountMinor ?? 0;
    const finalAmountMinor = workAlloc + consAlloc;
    const freezeUsed = m.freezeDaysUsed ?? 0;

    const workDollars = (workAlloc / 100).toFixed(2);
    const consDollars = (consAlloc / 100).toFixed(2);
    const finalDollars = (finalAmountMinor / 100).toFixed(2);

    const rationale = `Work ${workDollars} + Consistency ${consDollars} = ${finalDollars} (${m.streakDays}d streak${m.streakDays >= streakCapDays ? ', capped' : ''}${freezeUsed > 0 ? `, ${freezeUsed} freeze days` : ''})`;

    return {
      memberId: m.memberId,
      weight: m.weight,
      streakDays: m.streakDays,
      freezeDaysUsed: freezeUsed,
      workAmountMinor: workAlloc,
      consistencyAmountMinor: consAlloc,
      finalAmountMinor,
      rationale,
    };
  });

  // Verify invariant: sum(lines) === poolMinor
  const finalSum = lines.reduce((sum, l) => sum + l.finalAmountMinor, 0);
  if (finalSum !== poolMinor) {
    throw new Error(`Split invariant failed: sum(${finalSum}) !== pool(${poolMinor})`);
  }

  return {
    poolMinor,
    consistencyPoolMinor,
    workPoolMinor,
    consistencyPercent,
    streakCapDays,
    lines,
  };
}

export const computeConsistencySplit = calculateConsistencySplit;

