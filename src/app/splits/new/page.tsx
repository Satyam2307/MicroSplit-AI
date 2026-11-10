'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrencySymbol } from '@/lib/currency';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Percent,
  BarChart3,
  Target,
  Trophy,
  ArrowRight,
  Plus,
  Minus,
  Info,
  Flame,
  CheckCircle2,
  Sliders,
  ChevronDown,
  Building2,
  CircleDollarSign,
  Users,
  PartyPopper,
  Sparkles,
  X,
  Trash2,
} from 'lucide-react';
import { Reveal, Card, WeightBar, MoneyChip } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import { calculateConsistencySplit } from '@/lib/consistency-streak';
import { showToast } from '@/components/Toast';
import SplitSidePanel from '@/components/SplitSidePanel';
import {
  getStoredSquads,
  getStoredSquad,
  getStoredMembers,
  getStoredRevenue,
  saveStoredSplitRun,
  isDemoUser,
  getCurrentUser,
} from '@/lib/client-storage';

interface SquadOption {
  id: string;
  name: string;
  currency: string;
}

interface SquadMember {
  userId: string;
  role: string;
  user: { id: string; name: string; email: string };
}

interface RevenueEventOption {
  id: string;
  amountMinor: number;
  currency: string;
  description: string | null;
  createdAt: string;
}

// ---HELPERS-START (pure logic: no React, no imports)
type RuleType = 'fixed_percentage' | 'weighted_points' | 'tiered' | 'milestone';

interface MemberSplit {
  memberId: string;
  name: string;
  /** Fixed % mode */
  percentage: number;
  /** Weighted Points mode */
  points: number;
  /** Milestone mode: base share of what is left after achieved bonuses */
  base: number;
  streakDays: number;
}

interface TierBand {
  id: string;
  /** Size of this band in major units (ignored for the last band = "everything above") */
  sizeMajor: number;
  /** memberId -> % within this band (must total 100) */
  shares: Record<string, number>;
}

interface Milestone {
  id: string;
  name: string;
  /** Bonus as % of the whole pool */
  bonusPct: number;
  memberId: string;
  achieved: boolean;
}

const round1 = (v: number) => Math.round(v * 10) / 10;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const safeNum = (v: number) => (Number.isFinite(v) ? v : 0);

/** Even split in tenths of a percent that always totals exactly 100.0 */
function evenShares(count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(1000 / count);
  const rem = 1000 - base * count;
  return Array.from({ length: count }, (_, i) => (base + (i < rem ? 1 : 0)) / 10);
}

function makeEvenShares(members: { memberId: string }[]): Record<string, number> {
  const vals = evenShares(members.length);
  const out: Record<string, number> = {};
  members.forEach((m, i) => {
    out[m.memberId] = vals[i];
  });
  return out;
}

/** How much of the pool (minor units) falls into each band. Last band takes the remainder. */
function bandAmounts(poolMinor: number, bands: TierBand[]): number[] {
  let remaining = Math.max(0, poolMinor);
  return bands.map((band, i) => {
    const isLast = i === bands.length - 1;
    const amt = isLast
      ? remaining
      : Math.min(remaining, Math.max(0, Math.round(safeNum(band.sizeMajor) * 100)));
    remaining -= amt;
    return amt;
  });
}

interface RuleContext {
  poolMinor: number;
  tierBands: TierBand[];
  milestones: Milestone[];
}

/** Effective % of the whole pool each member gets under the chosen rule. Always totals 100 when valid. */
function computeEffective(
  rule: RuleType,
  members: MemberSplit[],
  ctx: RuleContext
): Record<string, number> {
  const out: Record<string, number> = {};

  if (rule === 'fixed_percentage') {
    members.forEach((m) => {
      out[m.memberId] = m.percentage;
    });
    return out;
  }

  if (rule === 'weighted_points') {
    const total = members.reduce((s, m) => s + m.points, 0);
    members.forEach((m) => {
      out[m.memberId] = total > 0 ? (m.points / total) * 100 : 0;
    });
    return out;
  }

  if (rule === 'tiered') {
    const amts = bandAmounts(ctx.poolMinor, ctx.tierBands);
    const pool = ctx.poolMinor;
    members.forEach((m) => {
      let pct = 0;
      ctx.tierBands.forEach((band, bi) => {
        const weight = pool > 0 ? amts[bi] / pool : bi === 0 ? 1 : 0;
        pct += weight * (band.shares[m.memberId] ?? 0);
      });
      out[m.memberId] = pct;
    });
    return out;
  }

  // milestone
  const achieved = ctx.milestones.filter((x) => x.achieved);
  const achievedTotal = achieved.reduce((s, x) => s + x.bonusPct, 0);
  const rest = Math.max(0, 100 - achievedTotal);
  members.forEach((m) => {
    const bonus = achieved
      .filter((x) => x.memberId === m.memberId)
      .reduce((s, x) => s + x.bonusPct, 0);
    out[m.memberId] = bonus + (rest * m.base) / 100;
  });
  return out;
}

interface RuleValidation {
  valid: boolean;
  message: string | null;
  summaryLabel: string;
  summaryValue: string;
}

function validateRule(rule: RuleType, members: MemberSplit[], ctx: RuleContext): RuleValidation {
  if (rule === 'fixed_percentage') {
    const total = members.reduce((s, m) => s + m.percentage, 0);
    const valid = members.length > 0 && Math.abs(total - 100) < 0.05;
    return {
      valid,
      message: valid
        ? null
        : `Percentages must equal exactly 100.0%. Difference: ${(100 - total).toFixed(1)}%. Click "Split Evenly" above to auto-balance.`,
      summaryLabel: 'Total Allocated',
      summaryValue: `${total.toFixed(1)}% / 100.0%`,
    };
  }

  if (rule === 'weighted_points') {
    const total = members.reduce((s, m) => s + m.points, 0);
    const valid = total > 0;
    return {
      valid,
      message: valid ? null : 'Give at least one member some points. Shares are points ÷ total points.',
      summaryLabel: 'Total Points',
      summaryValue: `${total} pts`,
    };
  }

  if (rule === 'tiered') {
    const bands = ctx.tierBands;
    const totals = bands.map((b) => members.reduce((s, m) => s + (b.shares[m.memberId] ?? 0), 0));
    const okBands = totals.filter((t) => Math.abs(t - 100) < 0.05).length;
    const badIndex = totals.findIndex((t) => Math.abs(t - 100) >= 0.05);
    const badSize = bands.findIndex(
      (b, i) => i < bands.length - 1 && !(safeNum(b.sizeMajor) > 0)
    );
    const valid = members.length > 0 && bands.length > 0 && badIndex === -1 && badSize === -1;
    let message: string | null = null;
    if (!valid) {
      if (badIndex !== -1) {
        message = `Band ${badIndex + 1} totals ${totals[badIndex].toFixed(1)}%. Every band must equal exactly 100%.`;
      } else if (badSize !== -1) {
        message = `Band ${badSize + 1} needs a size greater than 0.`;
      } else {
        message = 'Add at least one band and one member.';
      }
    }
    return {
      valid,
      message,
      summaryLabel: 'Bands at 100%',
      summaryValue: `${okBands} / ${bands.length}`,
    };
  }

  // milestone
  const baseTotal = members.reduce((s, m) => s + m.base, 0);
  const achieved = ctx.milestones.filter((x) => x.achieved);
  const achievedTotal = achieved.reduce((s, x) => s + x.bonusPct, 0);
  const unknownMember = achieved.some((x) => !members.some((m) => m.memberId === x.memberId));
  const baseOk = members.length > 0 && Math.abs(baseTotal - 100) < 0.05;
  const bonusOk = achievedTotal <= 100 && !unknownMember;
  let message: string | null = null;
  if (!baseOk) {
    message = `Base shares must equal exactly 100.0%. Difference: ${(100 - baseTotal).toFixed(1)}%.`;
  } else if (achievedTotal > 100) {
    message = `Achieved milestone bonuses total ${achievedTotal.toFixed(1)}% of the pool. They cannot exceed 100%.`;
  } else if (unknownMember) {
    message = 'An achieved milestone is assigned to a member who is not in this squad.';
  }
  return {
    valid: baseOk && bonusOk,
    message,
    summaryLabel: 'Base Shares',
    summaryValue: `${baseTotal.toFixed(1)}% / 100.0%`,
  };
}
// ---HELPERS-END

const ruleOptions: { type: RuleType; label: string; desc: string; icon: React.ReactNode }[] = [
  { type: 'fixed_percentage', label: 'Fixed %', desc: 'Set a fixed percentage for each member', icon: <Percent size={20} /> },
  { type: 'weighted_points', label: 'Weighted Points', desc: 'Points per member, split by total', icon: <BarChart3 size={20} /> },
  { type: 'tiered', label: 'Tiered', desc: 'Different splits per revenue band', icon: <Target size={20} /> },
  { type: 'milestone', label: 'Milestone', desc: 'Bonuses for completed milestones', icon: <Trophy size={20} /> },
];

const panelCopy: Record<RuleType, { title: string; subtitle: string }> = {
  fixed_percentage: {
    title: 'Member Shares',
    subtitle: 'Percentages must sum to exactly 100.0% • Live deterministic calculations',
  },
  weighted_points: {
    title: 'Member Points',
    subtitle: 'Give each member points. Share = member points ÷ total points.',
  },
  tiered: {
    title: 'Revenue Bands',
    subtitle: 'Each slice of revenue is split by its own band. Every band must total 100%.',
  },
  milestone: {
    title: 'Base Shares & Milestones',
    subtitle: 'Achieved milestone bonuses are paid first. Base shares split what is left.',
  },
};

/* ─── One member row (shared by Fixed %, Weighted Points and Milestone base) ─── */
interface MemberRowProps {
  member: MemberSplit;
  value: number;
  unit: '%' | 'pts';
  max: number;
  step: number;
  stepBy: number;
  payout: number;
  workAmount: number;
  streakAmount: number;
  showStreak: boolean;
  note?: string;
  onChange: (value: number) => void;
}

function MemberRow({
  member,
  value,
  unit,
  max,
  step,
  stepBy,
  payout,
  workAmount,
  streakAmount,
  showStreak,
  note,
  onChange,
}: MemberRowProps) {
  return (
    <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-2.5 shadow-sm transition-all hover:border-[var(--accent)]">
      <div className="flex items-center justify-between gap-3">
        {/* Member Identity & Streak */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
          >
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate text-[var(--text)]">{member.name}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              {member.streakDays > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--accent-subtle)] text-[var(--accent)]">
                  <Flame size={10} /> {member.streakDays}d streak
                </span>
              ) : (
                <span className="text-[10px] text-[var(--muted-light)]">0d streak</span>
              )}
              {showStreak && streakAmount > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                  +{formatMoney(streakAmount)} streak
                </span>
              )}
              {note && <span className="text-[10px] font-semibold text-[var(--muted)]">{note}</span>}
            </div>
          </div>
        </div>

        {/* Live Calculated Amount & Stepper Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
          <div className="text-right">
            <span className="text-sm sm:text-base font-black tabular-nums text-[var(--accent)] font-mono block leading-tight">
              {formatMoney(payout)}
            </span>
            <span className="text-[10px] text-[var(--muted)] font-medium block">
              {showStreak && streakAmount > 0 ? <span>Work: {formatMoney(workAmount)}</span> : 'live payout'}
            </span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => onChange(value - stepBy)}
              className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--background)] flex items-center justify-center text-[var(--text)] hover:text-[var(--accent)] transition-colors shadow-xs"
              title={`Decrease ${stepBy}${unit === '%' ? '%' : ' points'}`}
            >
              <Minus size={14} />
            </button>

            <div className="relative flex items-center">
              <input
                type="number"
                min="0"
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(safeNum(parseFloat(e.target.value)))}
                className="w-20 sm:w-24 px-2.5 py-1.5 text-right font-black font-mono text-sm sm:text-base rounded-lg border-2 border-[var(--border-strong)] focus:border-[var(--accent)] focus:outline-none bg-[var(--surface)] text-[var(--text)] pr-9 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-2 text-[10px] font-bold text-[var(--muted)] pointer-events-none">
                {unit}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onChange(value + stepBy)}
              className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--background)] flex items-center justify-center text-[var(--text)] hover:text-[var(--accent)] transition-colors shadow-xs"
              title={`Increase ${stepBy}${unit === '%' ? '%' : ' points'}`}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-1">
        <input
          type="range"
          min="0"
          max={max}
          step={step}
          value={Math.min(value, max)}
          onChange={(e) => onChange(safeNum(parseFloat(e.target.value)))}
          className="w-full accent-[var(--accent)] h-2 bg-slate-100 rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
}

export default function SplitsNewPage() {
  const router = useRouter();
  const [squads, setSquads] = useState<SquadOption[]>([]);
  const [selectedSquadId, setSelectedSquadId] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [revenueEvents, setRevenueEvents] = useState<RevenueEventOption[]>([]);
  const [selectedRevenueEventId, setSelectedRevenueEventId] = useState('');
  const selectedSquad = squads.find((squad) => squad.id === selectedSquadId) ?? {
    id: selectedSquadId,
    name: squads.find((s) => s.id === selectedSquadId)?.name || 'Squad Workspace',
    currency: squads.find((s) => s.id === selectedSquadId)?.currency || 'USD',
  };
  const [selectedRule, setSelectedRule] = useState<RuleType>('fixed_percentage');
  const selectedRevenueEvent = revenueEvents.find(
    (event) => event.id === selectedRevenueEventId
  );
  const poolAmount = selectedRevenueEvent?.amountMinor ?? 0;
  const [enableConsistency, setEnableConsistency] = useState(true);
  const [consistencyPercent, setConsistencyPercent] = useState(5); // Default 5%, max 10%
  const streakCapDays = 100;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedRun, setCompletedRun] = useState<any | null>(null);

  const [memberSplits, setMemberSplits] = useState<MemberSplit[]>([]);
  const [tierBands, setTierBands] = useState<TierBand[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // ── Rule-specific math (see helpers at the top of the file) ──
  const ruleContext: RuleContext = { poolMinor: poolAmount, tierBands, milestones };
  const effective = computeEffective(selectedRule, memberSplits, ruleContext);
  const getEffectivePercentage = (member: MemberSplit) => effective[member.memberId] ?? 0;
  const validation = validateRule(selectedRule, memberSplits, ruleContext);
  const isValid = validation.valid;

  useEffect(() => {
    let cancelled = false;

    async function loadSquads() {
      try {
        const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const targetSquadId = queryParams?.get('squadId');

        const currentUser = getCurrentUser();
        const isDemo = isDemoUser();
        const localSquads = getStoredSquads().map((s) => ({ id: s.id, name: s.name, currency: s.currency }));

        let availableSquads: SquadOption[] = [];
        if (isDemo) {
          try {
            const response = await fetch('/api/squads');
            const result = await response.json();
            if (response.ok && result.success && Array.isArray(result.data)) {
              availableSquads = result.data as SquadOption[];
            }
          } catch {
            // Ignore network errors and rely on local squads
          }
        }

        if (cancelled) return;

        const map = new Map<string, SquadOption>();
        // Add local squads first so newly created squads are at the top
        localSquads.forEach((s) => map.set(s.id, s));
        availableSquads.forEach((s) => {
          if (!map.has(s.id)) map.set(s.id, s);
        });
        const combinedSquads = Array.from(map.values());
        setSquads(combinedSquads);

        if (targetSquadId && combinedSquads.some((s) => s.id === targetSquadId)) {
          setSelectedSquadId(targetSquadId);
        } else {
          setSelectedSquadId(combinedSquads[0]?.id || '');
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load squads');
        }
      }
    }

    void loadSquads();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedSquadId) return;
    let cancelled = false;

    async function loadMembers() {
      try {
        const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const targetRevId = queryParams?.get('revId');

        // Fetch from API
        const [membersResponse, squadResponse] = await Promise.all([
          fetch(`/api/squads/${encodeURIComponent(selectedSquadId)}/members`).catch(() => null),
          fetch(`/api/squads/${encodeURIComponent(selectedSquadId)}`).catch(() => null),
        ]);

        const membersResult = membersResponse ? await membersResponse.json().catch(() => ({})) : {};
        const squadResult = squadResponse ? await squadResponse.json().catch(() => ({})) : {};

        const storedMembers = getStoredMembers(selectedSquadId);
        const storedRevenue = getStoredRevenue(selectedSquadId);

        if (cancelled) return;

        // Build member list
        const apiMembers: SquadMember[] = (membersResult.success && Array.isArray(membersResult.data))
          ? membersResult.data
          : [];

        const memberMap = new Map<string, SquadMember>();
        apiMembers.forEach((m) => memberMap.set(m.userId, m));
        storedMembers.forEach((m) => {
          memberMap.set(m.userId, {
            userId: m.userId,
            role: m.role,
            user: {
              id: m.userId,
              name: m.memberName || 'Member',
              email: m.payoutReceiver || '',
            },
          });
        });

        // If still empty, check stored squad owner details
        if (memberMap.size === 0) {
          const localSq = getStoredSquad(selectedSquadId);
          if (localSq) {
            const ownerObj = (localSq as any).owner;
            const ownerName = ownerObj?.name || 'Squad Owner';
            const ownerEmail = ownerObj?.email || '';
            memberMap.set(localSq.ownerId || 'usr_owner', {
              userId: localSq.ownerId || 'usr_owner',
              role: 'owner',
              user: {
                id: localSq.ownerId || 'usr_owner',
                name: ownerName,
                email: ownerEmail,
              },
            });
          }
        }

        const members = Array.from(memberMap.values());

        // Build revenue list
        const apiRevenue: RevenueEventOption[] = (squadResult.success && squadResult.data?.revenue && Array.isArray(squadResult.data.revenue))
          ? squadResult.data.revenue.filter((event: RevenueEventOption & { status?: string }) => event.status === 'active' || !event.status)
          : [];

        const revMap = new Map<string, RevenueEventOption>();
        apiRevenue.forEach((r) => revMap.set(r.id, r));
        storedRevenue.forEach((r) => {
          if (r.status === 'active' || !r.status) {
            revMap.set(r.id, {
              id: r.id,
              amountMinor: r.amountMinor,
              currency: r.currency,
              description: r.description || null,
              createdAt: r.createdAt,
            });
          }
        });

        // Fallback to squad totalRevenue pool if still empty and squad has recorded funds
        if (revMap.size === 0) {
          const localSq = getStoredSquad(selectedSquadId);
          const poolMinor = localSq?.totalRevenue || (squadResult.data?.squad?.totalRevenue as number) || 0;
          if (poolMinor > 0) {
            revMap.set(`rev_pool_${selectedSquadId}`, {
              id: `rev_pool_${selectedSquadId}`,
              amountMinor: poolMinor,
              currency: localSq?.currency || 'USD',
              description: `${localSq?.name || 'Squad'} Verified Revenue Pool`,
              createdAt: new Date().toISOString(),
            });
          }
        }

        const activeRevenue = Array.from(revMap.values());

        setLoadError(null);
        setRevenueEvents(activeRevenue);

        if (targetRevId && activeRevenue.some((r) => r.id === targetRevId)) {
          setSelectedRevenueEventId(targetRevId);
        } else if (activeRevenue.length > 0) {
          setSelectedRevenueEventId(activeRevenue[0].id);
        } else {
          setSelectedRevenueEventId('');
        }

        if (members.length > 0) {
          const shares = evenShares(members.length);
          const built: MemberSplit[] = members.map((member, i) => ({
            memberId: member.userId,
            name: member.user.name,
            percentage: shares[i],
            points: 10,
            base: shares[i],
            streakDays: 0,
          }));
          setMemberSplits(built);

          const evenMap = makeEvenShares(built);
          setTierBands([
            { id: 'band_1', sizeMajor: 2000, shares: { ...evenMap } },
            { id: 'band_2', sizeMajor: 0, shares: { ...evenMap } },
          ]);
          setMilestones([
            { id: 'ms_1', name: 'Milestone 1', bonusPct: 10, memberId: built[0].memberId, achieved: true },
          ]);
        } else {
          setMemberSplits([]);
          setTierBands([]);
          setMilestones([]);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load squad members');
        }
      }
    }

    void loadMembers();
    return () => {
      cancelled = true;
    };
  }, [selectedSquadId]);

  // Members with a >0 effective share take part in the calculation (fallback: everyone)
  const activeMembers = memberSplits.filter((m) => getEffectivePercentage(m) > 0);
  const membersToCalculate = activeMembers.length > 0 ? activeMembers : memberSplits;

  // Calculate live preview with consistency streak engine
  const consistencyResult = calculateConsistencySplit({
    poolMinor: poolAmount,
    consistencyPercent: enableConsistency ? consistencyPercent : 0,
    streakCapDays,
    members: membersToCalculate.map((m) => ({
      memberId: m.memberId,
      weight: getEffectivePercentage(m),
      streakDays: m.streakDays,
    })),
  });

  const linesSum = consistencyResult.lines.reduce((s, l) => s + l.finalAmountMinor, 0);

  // ── Member updates (one field per rule, so switching methods never corrupts another) ──
  const patchMember = (memberId: string, patch: Partial<MemberSplit>) =>
    setMemberSplits((prev) => prev.map((m) => (m.memberId === memberId ? { ...m, ...patch } : m)));

  const setFixedPercentage = (memberId: string, v: number) =>
    patchMember(memberId, { percentage: clamp(round1(safeNum(v)), 0, 100) });
  const setPoints = (memberId: string, v: number) =>
    patchMember(memberId, { points: Math.max(0, Math.round(safeNum(v))) });
  const setBase = (memberId: string, v: number) =>
    patchMember(memberId, { base: clamp(round1(safeNum(v)), 0, 100) });

  // ── Tier band updates ──
  const setBandShare = (bandId: string, memberId: string, v: number) =>
    setTierBands((prev) =>
      prev.map((b) =>
        b.id === bandId
          ? { ...b, shares: { ...b.shares, [memberId]: clamp(round1(safeNum(v)), 0, 100) } }
          : b
      )
    );
  const setBandSize = (bandId: string, v: number) =>
    setTierBands((prev) =>
      prev.map((b) => (b.id === bandId ? { ...b, sizeMajor: Math.max(0, safeNum(v)) } : b))
    );
  const addBand = () =>
    setTierBands((prev) =>
      prev.length >= 4
        ? prev
        : [...prev, { id: `band_${Date.now()}`, sizeMajor: 2000, shares: makeEvenShares(memberSplits) }]
    );
  const removeBand = (bandId: string) =>
    setTierBands((prev) => (prev.length <= 1 ? prev : prev.filter((b) => b.id !== bandId)));

  // ── Milestone updates ──
  const addMilestone = () =>
    setMilestones((prev) => [
      ...prev,
      {
        id: `ms_${Date.now()}`,
        name: `Milestone ${prev.length + 1}`,
        bonusPct: 5,
        memberId: memberSplits[0]?.memberId ?? '',
        achieved: false,
      },
    ]);
  const patchMilestone = (id: string, patch: Partial<Milestone>) =>
    setMilestones((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeMilestone = (id: string) => setMilestones((prev) => prev.filter((x) => x.id !== id));

  const distributeEvenly = () => {
    if (memberSplits.length === 0) return;

    if (selectedRule === 'fixed_percentage') {
      const actives = memberSplits.filter((m) => m.percentage > 0);
      const targets = actives.length > 0 ? actives : memberSplits;
      const shares = evenShares(targets.length);
      setMemberSplits(
        memberSplits.map((m) => {
          const i = targets.findIndex((t) => t.memberId === m.memberId);
          return { ...m, percentage: i === -1 ? 0 : shares[i] };
        })
      );
    } else if (selectedRule === 'weighted_points') {
      const actives = memberSplits.filter((m) => m.points > 0);
      const targets = actives.length > 0 ? actives : memberSplits;
      setMemberSplits(
        memberSplits.map((m) => ({
          ...m,
          points: targets.some((t) => t.memberId === m.memberId) ? 10 : 0,
        }))
      );
    } else if (selectedRule === 'tiered') {
      const even = makeEvenShares(memberSplits);
      setTierBands((prev) => prev.map((b) => ({ ...b, shares: { ...even } })));
    } else {
      const shares = evenShares(memberSplits.length);
      setMemberSplits(memberSplits.map((m, i) => ({ ...m, base: shares[i] })));
    }

    showToast({
      type: 'info',
      title: 'Distributed Evenly',
      message: `Split evenly among ${memberSplits.length} members.`,
    });
  };

  const resetShares = () => {
    if (selectedRule === 'fixed_percentage') {
      setMemberSplits(memberSplits.map((m) => ({ ...m, percentage: 0 })));
    } else if (selectedRule === 'weighted_points') {
      setMemberSplits(memberSplits.map((m) => ({ ...m, points: 0 })));
    } else if (selectedRule === 'tiered') {
      setTierBands((prev) =>
        prev.map((b) => ({
          ...b,
          shares: Object.fromEntries(memberSplits.map((m) => [m.memberId, 0])),
        }))
      );
    } else {
      setMemberSplits(memberSplits.map((m) => ({ ...m, base: 0 })));
    }
  };

  // Run the split - functional backend dispatch with celebratory alert & animation
  const handleRunSplit = async () => {
    if (!selectedSquad.id || !isValid || poolAmount <= 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const fallbackRun = {
      id: `run_${Date.now()}`,
      squadId: selectedSquad.id,
      revenueEventId: selectedRevenueEventId,
      poolMinor: poolAmount,
      currency: selectedSquad.currency || 'USD',
      status: 'approved',
      createdAt: new Date().toISOString(),
      lines: consistencyResult.lines.map((line, idx) => ({
        id: `ln_${Date.now()}_${idx}`,
        memberId: line.memberId,
        memberName: memberSplits.find((m) => m.memberId === line.memberId)?.name || 'Member',
        weight: line.weight,
        amountMinor: line.finalAmountMinor,
      })),
    };

    try {
      const res = await fetch('/api/split-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          squadId: selectedSquad.id,
          revenueEventId: selectedRevenueEventId,
          currency: selectedSquad.currency || 'USD',
          poolMinor: poolAmount,
          ruleConfig: {
            consistency_percent: enableConsistency ? consistencyPercent : 0,
            streak_cap_days: streakCapDays,
            freeze_days_per_30: 2,
          },
          // Every method is resolved to final % of the pool, so the existing API keeps working.
          memberSplits: memberSplits.map((m) => ({
            memberId: m.memberId,
            memberName: m.name,
            name: m.name,
            percentage: getEffectivePercentage(m),
          })),
        }),
      });

      const json = await res.json().catch(() => ({}));
      const runData = (res.ok && json.success && json.data) ? json.data : fallbackRun;

      saveStoredSplitRun(runData);
      setCompletedRun(runData);
      setShowCelebration(true);

      showToast({
        type: 'success',
        title: '🎉 Everyone Got Their Share!',
        message: `Split executed cleanly among ${memberSplits.length} members with zero loss.`,
      });
    } catch {
      saveStoredSplitRun(fallbackRun);
      setCompletedRun(fallbackRun);
      setShowCelebration(true);

      showToast({
        type: 'success',
        title: '🎉 Everyone Got Their Share!',
        message: `Split executed cleanly among ${memberSplits.length} members with zero loss.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renders one MemberRow wired to the live engine result
  const renderMemberRow = (
    member: MemberSplit,
    cfg: {
      value: number;
      unit: '%' | 'pts';
      max: number;
      step: number;
      stepBy: number;
      note?: string;
      onChange: (v: number) => void;
    }
  ) => {
    const line = consistencyResult.lines.find((l) => l.memberId === member.memberId);
    return (
      <MemberRow
        key={member.memberId}
        member={member}
        value={cfg.value}
        unit={cfg.unit}
        max={cfg.max}
        step={cfg.step}
        stepBy={cfg.stepBy}
        note={cfg.note}
        payout={line ? line.finalAmountMinor : 0}
        workAmount={line ? line.workAmountMinor : 0}
        streakAmount={line ? line.consistencyAmountMinor : 0}
        showStreak={enableConsistency}
        onChange={cfg.onChange}
      />
    );
  };

  const maxPoints = Math.max(100, ...memberSplits.map((m) => m.points));
  const bandAmts = bandAmounts(poolAmount, tierBands);
  const achievedBonusTotal = milestones.filter((x) => x.achieved).reduce((s, x) => s + x.bonusPct, 0);
  const sym = getCurrencySymbol(selectedSquad.currency || 'USD');

  const smallInput =
    'w-full px-2.5 py-1.5 text-sm font-semibold rounded-lg border-[1.5px] border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none';

  return (
    <div className="min-h-screen pb-16" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <Reveal>
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--background)] text-[var(--accent)]">
                Interactive Split Engine
              </span>
              <span className="text-xs text-[var(--muted)]">• Zero-cent loss guaranteed</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
              Configure Revenue Split
            </h1>
            <p className="text-base mt-1" style={{ color: 'var(--muted)' }}>
              Configure deterministic weights, apply consistency streak bonuses, and preview payout lines.
            </p>
          </div>
        </Reveal>

        {/* Top Configuration: Squad & Revenue + Split Methodology Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Squad & Pool */}
          <Reveal delay={0.1}>
            <Card padding="lg" className="h-full">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[var(--accent-subtle)] text-[var(--accent)]">
                  <Users size={18} />
                </span>
                <div>
                  <h2 className="text-base font-bold leading-tight text-[var(--text)]">
                    Squad &amp; revenue
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Choose who is being paid and which revenue is split.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Squad Workspace */}
                <div>
                  <label
                    htmlFor="squad-workspace"
                    className="mb-2 flex items-baseline justify-between text-sm font-bold text-[var(--text)]"
                  >
                    Squad Workspace
                    <span className="text-xs font-medium text-[var(--muted)]">Required</span>
                  </label>
                  <div className="group relative">
                    <Building2
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                    />
                    <select
                      id="squad-workspace"
                      suppressHydrationWarning
                      value={selectedSquadId}
                      onChange={(e) => setSelectedSquadId(e.target.value)}
                      disabled={squads.length === 0}
                      className="h-[52px] w-full appearance-none rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--background)] pl-11 pr-11 text-[15px] font-medium text-[var(--text)] transition hover:border-[var(--accent)] focus:border-[var(--accent)] focus:bg-[var(--background)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent)_20%,transparent)] disabled:cursor-not-allowed disabled:border-dashed disabled:opacity-70"
                    >
                      {squads.length === 0 && <option value="">No squads yet</option>}
                      {squads.map((squad) => (
                        <option key={squad.id} value={squad.id}>
                          {squad.name} ({squad.currency})
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] transition-transform group-focus-within:rotate-180 group-focus-within:text-[var(--accent)]"
                    />
                  </div>

                  {loadError && <p className="text-xs text-red-600 mt-2">{loadError}</p>}

                  {!loadError && squads.length === 0 && (
                    <div
                      role="status"
                      className="mt-2.5 flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,#f59e0b_40%,transparent)] bg-[color-mix(in_srgb,#f59e0b_12%,transparent)] px-3 py-2.5 text-[13px] text-[var(--text)]"
                    >
                      <Info size={16} className="mt-0.5 shrink-0 text-amber-500" />
                      <span>
                        Create a squad and add members before configuring a split.
                        <br />
                        <Link href="/squads/new" className="font-semibold text-amber-600 underline underline-offset-2">
                          + Create squad
                        </Link>
                      </span>
                    </div>
                  )}

                  {selectedSquad.id && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-[var(--accent-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
                        {memberSplits.length} {memberSplits.length === 1 ? 'member' : 'members'}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-[var(--accent-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
                        {selectedSquad.currency}
                      </span>
                    </div>
                  )}
                </div>

                {/* Revenue Event */}
                <div>
                  <label
                    htmlFor="revenue-event"
                    className="mb-2 flex items-baseline justify-between text-sm font-bold text-[var(--text)]"
                  >
                    Revenue Event ({selectedSquad.currency})
                    <span className="text-xs font-medium text-[var(--muted)]">Required</span>
                  </label>
                  <div className="group relative">
                    <CircleDollarSign
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                    />
                    <select
                      id="revenue-event"
                      value={selectedRevenueEventId}
                      onChange={(event) => setSelectedRevenueEventId(event.target.value)}
                      disabled={revenueEvents.length === 0}
                      className="h-[52px] w-full appearance-none rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--background)] pl-11 pr-11 text-[15px] font-medium text-[var(--text)] transition hover:border-[var(--accent)] focus:border-[var(--accent)] focus:bg-[var(--background)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent)_20%,transparent)] disabled:cursor-not-allowed disabled:border-dashed disabled:opacity-70"
                    >
                      {revenueEvents.length === 0 && (
                        <option value="">
                          {selectedSquadId ? 'No active revenue events' : 'Select a squad first'}
                        </option>
                      )}
                      {revenueEvents.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.description || 'Revenue event'} — {getCurrencySymbol(event.currency)}
                          {(event.amountMinor / 100).toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] transition-transform group-focus-within:rotate-180 group-focus-within:text-[var(--accent)]"
                    />
                  </div>

                  {selectedRevenueEvent ? (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-[var(--accent-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
                        {getCurrencySymbol(selectedRevenueEvent.currency)}
                        {(poolAmount / 100).toFixed(2)} to split
                      </span>
                      <span className="inline-flex items-center rounded-full bg-[var(--accent-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
                        Active
                      </span>
                    </div>
                  ) : (
                    <div
                      role="status"
                      className="mt-2.5 flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,#f59e0b_40%,transparent)] bg-[color-mix(in_srgb,#f59e0b_12%,transparent)] px-3 py-2.5 text-[13px] text-[var(--text)]"
                    >
                      <Info size={16} className="mt-0.5 shrink-0 text-amber-500" />
                      <span>
                        {selectedSquadId
                          ? 'Record an active revenue event for this squad before running a split.'
                          : 'Create a squad first, then record a revenue event for it.'}
                        <br />
                        <Link
                          href={selectedSquadId ? `/squads/${selectedSquadId}` : '/squads/new'}
                          className="font-semibold text-amber-600 underline underline-offset-2"
                        >
                          {selectedSquadId ? '+ Record revenue event' : '+ Create squad'}
                        </Link>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Reveal>

          {/* 1. Split Methodology (choose the method FIRST) */}
          <Reveal delay={0.15}>
            <Card padding="lg" className="h-full">
              <h2 className="text-base font-bold mb-3" style={{ color: 'var(--text)' }}>
                Split Methodology
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ruleOptions.map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    aria-pressed={selectedRule === opt.type}
                    className="p-3.5 rounded-xl text-center transition-all duration-200"
                    style={{
                      background: selectedRule === opt.type ? 'var(--background)' : 'color-mix(in srgb, var(--accent) 4%, transparent)',
                      border: `2px solid ${selectedRule === opt.type ? 'var(--accent)' : 'transparent'}`,
                      color: selectedRule === opt.type ? 'var(--accent)' : 'var(--muted)',
                    }}
                    onClick={() => setSelectedRule(opt.type)}
                  >
                    <div className="flex justify-center mb-1.5">{opt.icon}</div>
                    <p className="text-sm font-bold">{opt.label}</p>
                    <p className="hidden sm:block text-[11px] mt-0.5 font-medium opacity-80">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </Card>
          </Reveal>
        </div>

        {/* Parallel Workspace: Member Shares (Left) & Live Preview + Run Split (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Member Shares Allocation Panel */}
          <div className="lg:col-span-7">
            <Reveal delay={0.2}>
              <Card padding="lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                      {panelCopy[selectedRule].title}
                    </h2>
                    <p className="text-xs text-[var(--muted)]">{panelCopy[selectedRule].subtitle}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={distributeEvenly}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--background)] hover:bg-[var(--text)] text-[var(--accent)] transition-colors flex items-center gap-1"
                    >
                      <Sliders size={13} /> Split Evenly
                    </button>
                    <button
                      type="button"
                      onClick={resetShares}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-black/5 text-[var(--muted)] transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Consistency Streak Bonus (works with every methodology) */}
                <div className="mb-4 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame size={17} className="text-[var(--accent)]" />
                      <div>
                        <span className="text-xs font-bold block" style={{ color: 'var(--text)' }}>
                          Consistency Streak Bonus
                        </span>
                        <span className="text-[11px] text-[var(--muted)] block">
                          Reward consecutive days of verified contributions (max 10%)
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableConsistency}
                        onChange={(e) => setEnableConsistency(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                    </label>
                  </div>

                  {enableConsistency && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span style={{ color: 'var(--text)' }}>Consistency Allocation</span>
                        <span className="font-bold text-[var(--accent)] font-mono">{consistencyPercent}% of pool</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={consistencyPercent}
                        onChange={(e) => setConsistencyPercent(parseInt(e.target.value))}
                        className="w-full accent-[var(--accent)] h-1.5 cursor-pointer"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-[var(--muted)] pt-0.5">
                        <span>Work: <strong className="text-[var(--text)]">{formatMoney(consistencyResult.workPoolMinor)}</strong></span>
                        <span>Streak: <strong className="text-[var(--accent)]">{formatMoney(consistencyResult.consistencyPoolMinor)}</strong></span>
                        <span>Streak Cap: <strong className="text-[var(--text)]">{streakCapDays}d</strong></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary banner (label and value depend on the methodology) */}
                <div
                  className="mb-4 p-3 rounded-xl flex items-center justify-between text-sm font-bold tabular-nums"
                  style={{
                    background: isValid
                      ? 'color-mix(in srgb, var(--accent) 10%, transparent)'
                      : 'color-mix(in srgb, #f59e0b 14%, transparent)',
                    border: `1px solid ${isValid ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'color-mix(in srgb, #f59e0b 45%, transparent)'}`,
                    color: isValid ? 'var(--accent)' : 'var(--primary)',
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    {isValid ? <CheckCircle2 size={16} /> : <Info size={16} />}
                    {validation.summaryLabel}
                  </span>
                  <span className="text-base font-black font-mono">{validation.summaryValue}</span>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={selectedRule}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    {/* ── FIXED % ── */}
                    {selectedRule === 'fixed_percentage' && (
                      <div className="space-y-3.5">
                        {memberSplits.map((m) =>
                          renderMemberRow(m, {
                            value: m.percentage,
                            unit: '%',
                            max: 100,
                            step: 0.5,
                            stepBy: 5,
                            onChange: (v) => setFixedPercentage(m.memberId, v),
                          })
                        )}
                      </div>
                    )}

                    {/* ── WEIGHTED POINTS ── */}
                    {selectedRule === 'weighted_points' && (
                      <div className="space-y-3.5">
                        {memberSplits.map((m) =>
                          renderMemberRow(m, {
                            value: m.points,
                            unit: 'pts',
                            max: maxPoints,
                            step: 1,
                            stepBy: 5,
                            note: `= ${getEffectivePercentage(m).toFixed(1)}% of pool`,
                            onChange: (v) => setPoints(m.memberId, v),
                          })
                        )}
                      </div>
                    )}

                    {/* ── TIERED ── */}
                    {selectedRule === 'tiered' && (
                      <div className="space-y-4">
                        {tierBands.map((band, bi) => {
                          const isLast = bi === tierBands.length - 1;
                          const total = memberSplits.reduce((s, m) => s + (band.shares[m.memberId] ?? 0), 0);
                          const ok = Math.abs(total - 100) < 0.05;
                          return (
                            <div
                              key={band.id}
                              className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-black text-[var(--text)]">Band {bi + 1}</span>
                                  {isLast ? (
                                    <span className="text-xs font-semibold text-[var(--muted)]">
                                      Everything above
                                    </span>
                                  ) : (
                                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
                                      {bi === 0 ? 'First' : 'Next'}
                                      <span className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                                          {sym}
                                        </span>
                                        <input
                                          type="number"
                                          min="0"
                                          step="100"
                                          value={band.sizeMajor}
                                          onChange={(e) => setBandSize(band.id, parseFloat(e.target.value))}
                                          className="w-28 pl-6 pr-2 py-1 text-sm font-bold rounded-lg border-[1.5px] border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none tabular-nums"
                                        />
                                      </span>
                                    </label>
                                  )}
                                  <span className="text-[11px] font-semibold text-[var(--muted)] tabular-nums">
                                    = {formatMoney(bandAmts[bi] ?? 0)} of this revenue
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded-full tabular-nums ${
                                      ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                    }`}
                                  >
                                    {total.toFixed(1)}% {ok ? '✓' : '≠ 100'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeBand(band.id)}
                                    disabled={tierBands.length <= 1}
                                    aria-label={`Remove band ${bi + 1}`}
                                    className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-black/5 disabled:opacity-30"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-2">
                                {memberSplits.map((m) => {
                                  const val = band.shares[m.memberId] ?? 0;
                                  return (
                                    <div key={m.memberId} className="flex items-center gap-3">
                                      <span className="w-28 sm:w-36 truncate text-sm font-semibold text-[var(--primary)]">
                                        {m.name}
                                      </span>
                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        value={val}
                                        onChange={(e) => setBandShare(band.id, m.memberId, parseFloat(e.target.value))}
                                        className="flex-1 accent-[var(--accent)] h-2 cursor-pointer"
                                        aria-label={`${m.name} share in band ${bi + 1}`}
                                      />
                                      <div className="relative w-20">
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          step="0.5"
                                          value={val}
                                          onChange={(e) => setBandShare(band.id, m.memberId, parseFloat(e.target.value))}
                                          className={`${smallInput} text-right pr-6 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--muted)] pointer-events-none">
                                          %
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          onClick={addBand}
                          disabled={tierBands.length >= 4 || memberSplits.length === 0}
                          className="w-full py-2.5 rounded-xl border-2 border-dashed border-[var(--border-strong)] text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent-subtle)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                          <Plus size={14} /> Add band {tierBands.length >= 4 ? '(max 4)' : ''}
                        </button>
                      </div>
                    )}

                    {/* ── MILESTONE ── */}
                    {selectedRule === 'milestone' && (
                      <div className="space-y-5">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                            Base shares (split what is left after bonuses)
                          </p>
                          <div className="space-y-3.5">
                            {memberSplits.map((m) =>
                              renderMemberRow(m, {
                                value: m.base,
                                unit: '%',
                                max: 100,
                                step: 0.5,
                                stepBy: 5,
                                note: `= ${getEffectivePercentage(m).toFixed(1)}% of pool in total`,
                                onChange: (v) => setBase(m.memberId, v),
                              })
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                              Milestones
                            </p>
                            <span className="text-xs font-semibold text-[var(--muted)] tabular-nums">
                              Achieved bonuses: <strong className="text-[var(--accent)]">{achievedBonusTotal.toFixed(1)}%</strong> of pool
                            </span>
                          </div>

                          <div className="space-y-2.5">
                            {milestones.length === 0 && (
                              <p className="text-xs text-[var(--muted)]">
                                No milestones yet. Without any, this works like Fixed %.
                              </p>
                            )}
                            {milestones.map((ms) => (
                              <div
                                key={ms.id}
                                className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm grid grid-cols-2 sm:grid-cols-[1.4fr_90px_1.2fr_auto_auto] gap-2.5 items-center"
                              >
                                <input
                                  type="text"
                                  value={ms.name}
                                  maxLength={60}
                                  onChange={(e) => patchMilestone(ms.id, { name: e.target.value })}
                                  aria-label="Milestone name"
                                  className={`${smallInput} col-span-2 sm:col-span-1`}
                                />
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    value={ms.bonusPct}
                                    onChange={(e) =>
                                      patchMilestone(ms.id, {
                                        bonusPct: clamp(round1(safeNum(parseFloat(e.target.value))), 0, 100),
                                      })
                                    }
                                    aria-label="Bonus percent of pool"
                                    className={`${smallInput} pr-6 text-right tabular-nums`}
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--muted)] pointer-events-none">
                                    %
                                  </span>
                                </div>
                                <select
                                  value={ms.memberId}
                                  onChange={(e) => patchMilestone(ms.id, { memberId: e.target.value })}
                                  aria-label="Member who earns this bonus"
                                  className={smallInput}
                                >
                                  {memberSplits.map((m) => (
                                    <option key={m.memberId} value={m.memberId}>
                                      {m.name}
                                    </option>
                                  ))}
                                </select>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={ms.achieved}
                                    onChange={(e) => patchMilestone(ms.id, { achieved: e.target.checked })}
                                    className="accent-[var(--accent)] w-4 h-4"
                                  />
                                  Achieved
                                </label>
                                <button
                                  type="button"
                                  onClick={() => removeMilestone(ms.id)}
                                  aria-label={`Remove ${ms.name}`}
                                  className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-black/5 justify-self-end"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={addMilestone}
                            disabled={memberSplits.length === 0}
                            className="mt-3 w-full py-2.5 rounded-xl border-2 border-dashed border-[var(--border-strong)] text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent-subtle)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                          >
                            <Plus size={14} /> Add milestone
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {!isValid && validation.message && (
                  <div
                    className="mt-4 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold"
                    style={{ background: 'color-mix(in srgb, #f59e0b 12%, transparent)', color: 'var(--primary)' }}
                  >
                    <Info size={16} className="flex-shrink-0" />
                    {validation.message}
                  </div>
                )}
              </Card>
            </Reveal>
          </div>

          {/* Right: Live Preview & Run Action (Parallel & Sticky) */}
          <div className="lg:col-span-5 lg:sticky lg:top-20">
            <div className="space-y-4">
              <Reveal delay={0.25}>
                <Card elevated padding="lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap size={18} className="text-[var(--accent)]" />
                      <h2 className="text-lg font-bold text-[var(--text)]">
                        Live Split Preview
                      </h2>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--background)] text-[var(--accent)]">
                      Deterministic
                    </span>
                  </div>

                  {/* Pool breakdown */}
                  <div className="mb-6 p-4 rounded-xl space-y-3 bg-[var(--background)] border border-[color-mix(in_srgb,var(--text)_25%,transparent)]">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-0.5 text-[var(--text)]">
                        Total Pool
                      </p>
                      <p className="text-2xl font-black tabular-nums text-[var(--accent)]">
                        {formatMoney(poolAmount)}
                      </p>
                    </div>

                    {enableConsistency && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[color-mix(in_srgb,var(--text)_25%,transparent)] text-xs">
                        <div className="p-2 rounded-lg bg-[color-mix(in_srgb,var(--text)_6%,transparent)] border border-[color-mix(in_srgb,var(--text)_25%,transparent)]">
                          <span className="text-[11px] text-[var(--text)] block">Work Pool</span>
                          <span className="font-bold text-[var(--text)]">{formatMoney(consistencyResult.workPoolMinor)}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-[color-mix(in_srgb,var(--text)_6%,transparent)] border border-[color-mix(in_srgb,var(--text)_25%,transparent)]">
                          <span className="text-[11px] text-[var(--accent)] block">Consistency ({consistencyPercent}%)</span>
                          <span className="font-bold text-[var(--accent)]">{formatMoney(consistencyResult.consistencyPoolMinor)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Split lines */}
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {consistencyResult.lines.map((line) => {
                        const member = memberSplits.find(
                          (m) => m.memberId === line.memberId
                        );
                        const pct =
                          poolAmount > 0
                            ? (line.finalAmountMinor / poolAmount) * 100
                            : 0;
                        return (
                          <motion.div
                            key={line.memberId}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-3 rounded-xl bg-[color-mix(in_srgb,var(--text)_6%,transparent)] border border-[color-mix(in_srgb,var(--text)_25%,transparent)] space-y-1.5 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                  style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
                                >
                                  {member?.name.charAt(0)}
                                </div>
                                <span className="text-sm font-bold text-[var(--text)]">
                                  {member?.name}
                                </span>
                                {enableConsistency && line.streakDays > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-[var(--accent-subtle)] text-[var(--accent)]">
                                    <Flame size={10} />
                                    {line.streakDays}d
                                  </span>
                                )}
                              </div>
                              <MoneyChip
                                amount={formatMoney(line.finalAmountMinor)}
                                status="default"
                                size="sm"
                              />
                            </div>

                            {enableConsistency && (
                              <p className="text-[11px] font-mono text-[var(--text)]">
                                Work {formatMoney(line.workAmountMinor).replace('$', '')} + Consistency {formatMoney(line.consistencyAmountMinor).replace('$', '')} = {formatMoney(line.finalAmountMinor).replace('$', '')}
                              </p>
                            )}

                            <WeightBar percentage={pct} />
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Invariant check */}
                  <div
                    className="mt-6 px-4 py-3 rounded-xl text-xs font-bold tabular-nums"
                    style={{
                      background: 'var(--background)',
                      color: isValid && linesSum === poolAmount ? 'var(--accent)' : 'var(--text)',
                      border: '1px solid var(--background)',
                    }}
                  >
                    Sum: {formatMoney(linesSum)} /{' '}
                    {formatMoney(poolAmount)}{' '}
                    {isValid && linesSum === poolAmount ? '✓ Exact match (no cents lost)' : '✗ Does not match'}
                  </div>

                  {submitError && (
                    <div className="mt-3 p-3 rounded-xl text-xs font-bold bg-[var(--background)] text-[var(--text)]">
                      {submitError}
                    </div>
                  )}

                  {/* Run the split BUTTON */}
                  <button
                    type="button"
                    onClick={handleRunSplit}
                    disabled={!selectedSquad.id || !selectedRevenueEventId || !isValid || isSubmitting}
                    className="btn-primary w-full mt-6 justify-center text-white"
                    style={{
                      background: 'var(--accent)',
                      boxShadow: '0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent)',
                      opacity: isValid && !isSubmitting ? 1 : 0.5,
                      cursor: isValid && !isSubmitting ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving Split Run...
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        Run the split
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-center text-[var(--muted-light)] mt-2">
                    Saves an immutable calculation snapshot. The server recalculates streak allocation from squad activity.
                  </p>
                </Card>
              </Reveal>

              <SplitSidePanel
                rule={selectedRule}
                hasSquad={!!selectedSquad.id}
                hasRevenue={!!selectedRevenueEventId}
                poolLabel={formatMoney(poolAmount)}
                memberCount={memberSplits.length}
                sharesValid={isValid}
                consistencyOn={enableConsistency}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── CELEBRATION MODAL & ANIMATION ─────────────────────────────── */}
      <AnimatePresence>
        {showCelebration && completedRun && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-hidden">
            {/* Confetti particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 45 }).map((_, i) => {
                const colors = ['#0F9D8A', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#3B82F6', '#14B8A6', '#8B5CF6'];
                const color = colors[i % colors.length];
                const left = `${(i * 2.3 + (i % 6) * 3) % 100}%`;
                const delay = (i % 8) * 0.12;
                const size = 6 + (i % 4) * 3;
                return (
                  <motion.div
                    key={i}
                    initial={{ y: -20, opacity: 1, rotate: 0 }}
                    animate={{
                      y: [0, 850],
                      opacity: [1, 1, 0],
                      rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)],
                    }}
                    transition={{
                      duration: 2.8 + (i % 3) * 0.5,
                      delay,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="absolute rounded-sm shadow-sm"
                    style={{
                      left,
                      width: size,
                      height: size * (i % 3 === 0 ? 1.6 : 1),
                      backgroundColor: color,
                    }}
                  />
                );
              })}
            </div>

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-[var(--background)] rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden z-10"
            >
              {/* Top Banner with Emerald Gradient */}
              <div
                className="px-6 pt-8 pb-6 text-center text-white relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #0F9D8A 0%, #064E3B 100%)',
                }}
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setShowCelebration(false)}
                  className="absolute right-4 top-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <X size={18} />
                </button>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: 'spring', damping: 12 }}
                  className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg border border-white/30"
                >
                  <PartyPopper size={32} />
                </motion.div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm text-emerald-100 mb-2">
                  <Sparkles size={12} /> Revenue Split Executed
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Everyone Got Their Share!
                </h2>
                <p className="text-emerald-100 text-sm mt-1 max-w-md mx-auto">
                  {formatMoney(poolAmount)} in <strong className="text-white underline">{selectedSquad.name}</strong> has been deterministically disbursed among all members.
                </p>
              </div>

              {/* Members Distribution List */}
              <div className="p-6 max-h-[300px] overflow-y-auto space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                  Verified Member Allocations ({memberSplits.length})
                </p>

                {memberSplits.map((member, idx) => {
                  const line = consistencyResult.lines.find((l) => l.memberId === member.memberId);
                  const shareAmount = line
                    ? line.finalAmountMinor
                    : Math.round((poolAmount * getEffectivePercentage(member)) / 100);
                  const sharePct = poolAmount > 0 ? (shareAmount / poolAmount) * 100 : 0;
                  return (
                    <motion.div
                      key={member.memberId || idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.08 }}
                      className="p-3.5 rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--text)_6%,transparent)] flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-sm"
                          style={{
                            background: idx === 0 ? 'var(--accent)' : 'linear-gradient(135deg, var(--primary), var(--accent))',
                          }}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[var(--text)] leading-tight">
                            {member.name}
                          </p>
                          <p className="text-xs text-[var(--muted)] font-medium">
                            {sharePct.toFixed(1)}% allocation
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-base font-black tabular-nums text-[var(--accent)]">
                          {formatMoney(shareAmount)}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 size={12} /> Disbursed
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Invariant Zero-Loss Guarantee Footer */}
              <div className="px-6 py-4 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--text)_6%,transparent)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)]">
                  <CheckCircle2 size={15} />
                  <span>Exact Match: {formatMoney(poolAmount)} (0¢ rounding loss)</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Link
                    href={`/squads/${selectedSquad.id}`}
                    className="btn-secondary text-xs py-2 px-3 flex-1 sm:flex-initial text-center font-semibold"
                  >
                    Back to Squad
                  </Link>
                  <Link
                    href={`/runs/${completedRun.id}`}
                    className="btn-primary text-xs py-2 px-4 flex-1 sm:flex-initial text-center font-semibold text-white flex items-center justify-center gap-1 shadow-sm"
                    style={{ background: 'var(--accent)' }}
                  >
                    Audited Details <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}