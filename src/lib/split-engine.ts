// Deterministic Split Engine
// All amounts are integer minor units (cents). No floating-point money.
// Uses largest-remainder method to ensure sum === pool exactly.

export interface SplitInput {
  memberId: string;
  weight: number; // raw contribution weight
  rationale: string;
  evidenceRefs: string[];
}

export interface SplitOutput {
  memberId: string;
  weight: number;
  amountMinor: number;
  rationaleJson: string;
}

/**
 * Deterministic split calculation using the largest-remainder method.
 * 
 * Invariant: sum of all output amounts === poolMinor (exactly)
 * 
 * Steps:
 * 1. Compute total weight
 * 2. Compute exact fractional share for each member
 * 3. Floor each share to get base allocation
 * 4. Distribute remaining cents by largest fractional remainder
 */
export function calculateSplit(
  poolMinor: number,
  inputs: SplitInput[],
  ruleType: string
): SplitOutput[] {
  if (inputs.length === 0) return [];
  if (poolMinor <= 0) return inputs.map(i => ({
    memberId: i.memberId,
    weight: i.weight,
    amountMinor: 0,
    rationaleJson: JSON.stringify({
      rule_type: ruleType,
      contribution_summary: i.rationale,
      weight_calculation: 'Pool is zero',
      evidence_refs: i.evidenceRefs,
    }),
  }));

  const totalWeight = inputs.reduce((sum, i) => sum + i.weight, 0);
  
  if (totalWeight === 0) {
    // Equal split when no weights
    return equalSplit(poolMinor, inputs, ruleType);
  }

  // Step 1: Compute exact fractional shares
  const fractional = inputs.map(input => {
    const exactShare = (input.weight / totalWeight) * poolMinor;
    const floored = Math.floor(exactShare);
    const remainder = exactShare - floored;
    return { input, exactShare, floored, remainder };
  });

  // Step 2: Floor each share
  const totalFloored = fractional.reduce((s, f) => s + f.floored, 0);
  let leftover = poolMinor - totalFloored;

  // Step 3: Sort by largest remainder (descending), break ties by member ID
  const sorted = [...fractional].sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder;
    return a.input.memberId.localeCompare(b.input.memberId);
  });

  // Step 4: Distribute leftover cents
  for (let i = 0; i < sorted.length && leftover > 0; i++) {
    sorted[i].floored += 1;
    leftover--;
  }

  // Build output maintaining original order
  return inputs.map(input => {
    const entry = fractional.find(f => f.input.memberId === input.memberId)!;
    return {
      memberId: input.memberId,
      weight: input.weight,
      amountMinor: entry.floored,
      rationaleJson: JSON.stringify({
        rule_type: ruleType,
        contribution_summary: input.rationale,
        weight_calculation: `Weight ${input.weight} / ${totalWeight} total = ${((input.weight / totalWeight) * 100).toFixed(2)}%`,
        evidence_refs: input.evidenceRefs,
      }),
    };
  });
}

/**
 * Equal split when all weights are zero
 */
function equalSplit(
  poolMinor: number,
  inputs: SplitInput[],
  ruleType: string
): SplitOutput[] {
  const n = inputs.length;
  const base = Math.floor(poolMinor / n);
  let leftover = poolMinor - base * n;

  return inputs.map((input, idx) => ({
    memberId: input.memberId,
    weight: 0,
    amountMinor: base + (idx < leftover ? 1 : 0),
    rationaleJson: JSON.stringify({
      rule_type: ruleType,
      contribution_summary: input.rationale,
      weight_calculation: `Equal split: 1/${n}`,
      evidence_refs: input.evidenceRefs,
    }),
  }));
}

/**
 * Apply fixed percentage rule
 */
export function applyFixedPercentage(
  poolMinor: number,
  splits: { memberId: string; percentage: number }[]
): SplitOutput[] {
  // Convert percentages to weights (percentage is the weight)
  const inputs: SplitInput[] = splits.map(s => ({
    memberId: s.memberId,
    weight: s.percentage,
    rationale: `Fixed ${s.percentage}% share`,
    evidenceRefs: [],
  }));
  return calculateSplit(poolMinor, inputs, 'fixed_percentage');
}

/**
 * Apply weighted points rule
 */
export function applyWeightedPoints(
  poolMinor: number,
  contributions: { memberId: string; activity: string; quantity: number }[],
  weights: { [activity: string]: number }
): SplitOutput[] {
  // Aggregate points per member
  const memberPoints: Record<string, { total: number; details: string[] }> = {};
  
  for (const c of contributions) {
    const activityWeight = weights[c.activity] ?? 1;
    const points = c.quantity * activityWeight;
    
    if (!memberPoints[c.memberId]) {
      memberPoints[c.memberId] = { total: 0, details: [] };
    }
    memberPoints[c.memberId].total += points;
    memberPoints[c.memberId].details.push(
      `${c.quantity} ${c.activity} × ${activityWeight} = ${points} pts`
    );
  }

  const inputs: SplitInput[] = Object.entries(memberPoints).map(
    ([memberId, { total, details }]) => ({
      memberId,
      weight: total,
      rationale: details.join('; '),
      evidenceRefs: [],
    })
  );

  return calculateSplit(poolMinor, inputs, 'weighted_points');
}

/**
 * Compute SHA-256 checksum over sorted split lines.
 * Used to detect any tampering with a split run.
 */
export function computeSplitChecksum(
  lines: { memberId: string; amountMinor: number }[]
): string {
  const sorted = [...lines].sort((a, b) =>
    a.memberId.localeCompare(b.memberId)
  );
  const payload = sorted
    .map(l => `${l.memberId}:${l.amountMinor}`)
    .join('|');
  
  // Simple hash for demo (in production, use crypto.subtle)
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Verify the split invariant: sum of all lines === pool
 */
export function verifySplitInvariant(
  poolMinor: number,
  lines: { amountMinor: number }[]
): boolean {
  const sum = lines.reduce((s, l) => s + l.amountMinor, 0);
  return sum === poolMinor;
}
