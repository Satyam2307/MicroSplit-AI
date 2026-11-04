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
} from 'lucide-react';
import { Reveal, Card, WeightBar, MoneyChip } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import { calculateConsistencySplit } from '@/lib/consistency-streak';
import { showToast } from '@/components/Toast';

type RuleType = 'fixed_percentage' | 'weighted_points' | 'tiered' | 'milestone';
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

const ruleOptions: { type: RuleType; label: string; desc: string; icon: React.ReactNode }[] = [
  { type: 'fixed_percentage', label: 'Fixed %', desc: 'Set a fixed percentage for each member', icon: <Percent size={20} /> },
  { type: 'weighted_points', label: 'Weighted Points', desc: 'Points per activity type, split by total', icon: <BarChart3 size={20} /> },
  { type: 'tiered', label: 'Tiered', desc: 'Different splits per revenue band', icon: <Target size={20} /> },
  { type: 'milestone', label: 'Milestone', desc: 'Bonuses for completed milestones', icon: <Trophy size={20} /> },
];

interface MemberSplit {
  memberId: string;
  name: string;
  percentage: number;
  streakDays: number;
}

export default function SplitsNewPage() {
  const router = useRouter();
  const [squads, setSquads] = useState<SquadOption[]>([]);
  const [selectedSquadId, setSelectedSquadId] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [revenueEvents, setRevenueEvents] = useState<RevenueEventOption[]>([]);
  const [selectedRevenueEventId, setSelectedRevenueEventId] = useState('');
  const selectedSquad = squads.find((squad) => squad.id === selectedSquadId) ?? {
    id: '',
    name: '',
    currency: 'USD',
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

  const [memberSplits, setMemberSplits] = useState<MemberSplit[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadSquads() {
      try {
        const response = await fetch('/api/squads');
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load squads');
        }
        if (cancelled) return;
        const availableSquads = result.data as SquadOption[];
        setSquads(availableSquads);
        setSelectedSquadId((current) => current || availableSquads[0]?.id || '');
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
        const [membersResponse, squadResponse] = await Promise.all([
          fetch(`/api/squads/${encodeURIComponent(selectedSquadId)}/members`),
          fetch(`/api/squads/${encodeURIComponent(selectedSquadId)}`),
        ]);
        const [membersResult, squadResult] = await Promise.all([
          membersResponse.json(),
          squadResponse.json(),
        ]);
        if (!membersResponse.ok || !membersResult.success) {
          throw new Error(membersResult.error || 'Unable to load squad members');
        }
        if (!squadResponse.ok || !squadResult.success) {
          throw new Error(squadResult.error || 'Unable to load squad revenue');
        }
        if (cancelled) return;
        const members = membersResult.data as SquadMember[];
        const activeRevenue = squadResult.data.revenue.filter(
          (event: RevenueEventOption & { status: string }) => event.status === 'active'
        ) as RevenueEventOption[];
        setLoadError(null);
        setRevenueEvents(activeRevenue);
        setSelectedRevenueEventId(activeRevenue[0]?.id || '');
        const baseShare = Math.floor(1000 / members.length) / 10;
        let remainder = 1000 - Math.floor(1000 / members.length) * members.length;
        setMemberSplits(members.map((member) => {
          const extra = remainder > 0 ? 0.1 : 0;
          if (remainder > 0) remainder--;
          return {
            memberId: member.userId,
            name: member.user.name,
            percentage: Math.round((baseShare + extra) * 10) / 10,
            streakDays: 0,
          };
        }));
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

  // Active members with >0% share or active in calculation
  const activeMembers = memberSplits.filter((m) => m.percentage > 0);
  const membersToCalculate = activeMembers.length > 0 ? activeMembers : memberSplits;

  // Calculate live preview with consistency streak engine
  const consistencyResult = calculateConsistencySplit({
    poolMinor: poolAmount,
    consistencyPercent: enableConsistency ? consistencyPercent : 0,
    streakCapDays,
    members: membersToCalculate.map((m) => ({
      memberId: m.memberId,
      weight: m.percentage,
      streakDays: m.streakDays,
    })),
  });

  const totalPct = memberSplits.reduce((sum, m) => sum + m.percentage, 0);
  const isValid = Math.abs(totalPct - 100) < 0.05;

  const updatePercentage = (idx: number, value: number) => {
    const updated = [...memberSplits];
    const val = isNaN(value) ? 0 : Math.max(0, Math.min(100, Math.round(value * 10) / 10));
    updated[idx] = { ...updated[idx], percentage: val };
    setMemberSplits(updated);
  };

  const adjustBy = (idx: number, delta: number) => {
    const cur = memberSplits[idx].percentage;
    updatePercentage(idx, cur + delta);
  };

  const distributeEvenly = () => {
    // Filter active members or use all members
    const targets = memberSplits.filter((m) => m.percentage > 0);
    const pool = targets.length > 0 ? targets : memberSplits;
    const count = pool.length;
    if (count === 0) return;

    // Largest remainder for percentages to sum to exactly 100.0%
    const baseShare = Math.floor((1000 / count)) / 10;
    const remainderTenths = 1000 - Math.floor(1000 / count) * count;

    let remainderLeft = remainderTenths;
    const updated = memberSplits.map((m) => {
      const isTarget = pool.some((p) => p.memberId === m.memberId);
      if (!isTarget) return { ...m, percentage: 0 };
      const extra = remainderLeft > 0 ? 0.1 : 0;
      if (remainderLeft > 0) remainderLeft--;
      return { ...m, percentage: Math.round((baseShare + extra) * 10) / 10 };
    });

    setMemberSplits(updated);
    showToast({
      type: 'info',
      title: 'Distributed Evenly',
      message: `Split 100% equally among ${count} members.`,
    });
  };

  const resetShares = () => {
    setMemberSplits(memberSplits.map((m) => ({ ...m, percentage: 0 })));
  };

  // Run the split - functional backend dispatch
  const handleRunSplit = async () => {
    if (!selectedSquad.id || !isValid || poolAmount <= 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/split-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          squadId: selectedSquad.id,
          revenueEventId: selectedRevenueEventId,
          currency: selectedSquad.currency || 'USD',
          ruleConfig: {
            consistency_percent: enableConsistency ? consistencyPercent : 0,
            streak_cap_days: streakCapDays,
            freeze_days_per_30: 2,
          },
          memberSplits: memberSplits.map((m) => ({
            memberId: m.memberId,
            percentage: m.percentage,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to execute split run');
      }

      showToast({
        type: 'success',
        title: 'Split Run Saved',
        message: `Run ${json.data.id} was saved as an immutable calculation snapshot.`,
      });

      // Redirect to the newly generated run page
      router.push(`/runs/${json.data.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Execution failed';
      setSubmitError(msg);
      showToast({
        type: 'error',
        title: 'Error Creating Split',
        message: msg,
      });
      setIsSubmitting(false);
    }
  };

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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Configuration Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Squad & Pool */}
            <Reveal delay={0.1}>
              <Card padding="lg">
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
                        value={selectedSquadId}
                        onChange={(e) => setSelectedSquadId(e.target.value)}
                        disabled={squads.length === 0}
                        className="h-[52px] w-full appearance-none rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--background)] pl-11 pr-11 text-[15px] font-medium text-[var(--text)] transition hover:border-[var(--accent)] focus:border-[var(--accent)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent)_20%,transparent)] disabled:cursor-not-allowed disabled:border-dashed disabled:opacity-70"
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
                        className="h-[52px] w-full appearance-none rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--background)] pl-11 pr-11 text-[15px] font-medium text-[var(--text)] transition hover:border-[var(--accent)] focus:border-[var(--accent)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent)_20%,transparent)] disabled:cursor-not-allowed disabled:border-dashed disabled:opacity-70"
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
                          Record an active revenue event for this squad before running a split.
                          <br />
                          <Link
                            href={selectedSquadId ? `/squads/${selectedSquadId}` : '/squads'}
                            className="font-semibold text-amber-600 underline underline-offset-2"
                          >
                            + Record revenue event
                          </Link>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Reveal>

            {/* Rule Selector */}
            <Reveal delay={0.15}>
              <Card padding="lg">
                <h2 className="text-base font-bold mb-3" style={{ color: 'var(--text)' }}>
                  Split Methodology
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ruleOptions.map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
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
                    </button>
                  ))}
                </div>
              </Card>
            </Reveal>

            {/* Consistency Streak Bonus Config */}
            <Reveal delay={0.18}>
              <Card padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Flame size={18} className="text-[var(--accent)]" />
                    <div>
                      <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                        Consistency Streak Bonus
                      </h2>
                      <p className="text-xs text-[var(--muted)]">
                        Reward consecutive days of verified contributions
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableConsistency}
                      onChange={(e) => setEnableConsistency(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                  </label>
                </div>

                {enableConsistency && (
                  <div className="space-y-4 pt-3 border-t border-[var(--border)]">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5 font-semibold">
                        <span style={{ color: 'var(--text)' }}>Consistency Allocation</span>
                        <span className="font-bold text-[var(--accent)] font-mono">{consistencyPercent}% (max 10%)</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={consistencyPercent}
                        onChange={(e) => setConsistencyPercent(parseInt(e.target.value))}
                        className="w-full accent-[var(--accent)]"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="font-medium text-[var(--muted)]">Streak Cap Days</span>
                      <span className="font-mono font-bold text-[var(--text)]">{streakCapDays} days</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--accent-subtle)] border border-[var(--border)] text-xs space-y-1">
                      <p className="font-bold text-[var(--accent)]">Deterministic Math Formula</p>
                      <p className="text-[var(--text)]">
                        Consistency Pool ({consistencyPercent}%) = {formatMoney(consistencyResult.consistencyPoolMinor)} • Work Pool ({100 - consistencyPercent}%) = {formatMoney(consistencyResult.workPoolMinor)}
                      </p>
                    </div>

                  </div>
                )}
              </Card>
            </Reveal>

            {/* Member Percentages - REVAMPED TO PREVENT COLLAPSING */}
            <Reveal delay={0.2}>
              <Card padding="lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                      Member Shares
                    </h2>
                    <p className="text-xs text-[var(--muted)]">
                      Percentages must sum to exactly 100.0%
                    </p>
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

                {/* Total Counter Banner */}
                <div
                  className="mb-4 p-3 rounded-xl flex items-center justify-between text-sm font-bold tabular-nums"
                  style={{
                    background: isValid ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'color-mix(in srgb, var(--accent) 10%, transparent)',
                    border: `1px solid ${isValid ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'color-mix(in srgb, var(--accent) 30%, transparent)'}`,
                    color: isValid ? 'var(--accent)' : 'var(--primary)',
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    {isValid ? <CheckCircle2 size={16} /> : <Info size={16} />}
                    Total Allocated
                  </span>
                  <span className="text-base font-black font-mono">
                    {totalPct.toFixed(1)}% / 100.0%
                  </span>
                </div>

                {/* Member Input Rows */}
                <div className="space-y-4">
                  {memberSplits.map((member, idx) => (
                    <div
                      key={member.memberId}
                      className="p-3.5 rounded-xl border border-[var(--border)] bg-white/50 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Member Identity & Streak */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                            style={{
                              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                            }}
                          >
                            {member.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate text-[var(--primary)]">
                              {member.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {member.streakDays > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--accent-subtle)] text-[var(--accent)]">
                                  <Flame size={10} /> {member.streakDays}d streak
                                </span>
                              ) : (
                                <span className="text-[10px] text-[var(--muted-light)]">
                                  0d streak
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Direct Percentage Stepper & Input - WIDE & CLEAR */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => adjustBy(idx, -5)}
                            className="w-8 h-8 rounded-lg border border-[var(--border)] bg-white hover:bg-slate-50 flex items-center justify-center text-[var(--text)] hover:text-[var(--primary)] transition-colors"
                            title="Decrease 5%"
                          >
                            <Minus size={14} />
                          </button>

                          <div className="relative flex items-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={member.percentage}
                              onChange={(e) => updatePercentage(idx, parseFloat(e.target.value))}
                              className="w-24 px-3 py-1.5 text-right font-black font-mono text-base rounded-lg border-2 border-[var(--text)] focus:border-[var(--accent)] focus:outline-none bg-white text-[var(--primary)] pr-6 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="absolute right-2.5 text-xs font-bold text-[var(--text)] pointer-events-none">
                              %
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => adjustBy(idx, 5)}
                            className="w-8 h-8 rounded-lg border border-[var(--border)] bg-white hover:bg-slate-50 flex items-center justify-center text-[var(--text)] hover:text-[var(--primary)] transition-colors"
                            title="Increase 5%"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Range slider */}
                      <div className="pt-1">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="0.5"
                          value={member.percentage}
                          onChange={(e) => updatePercentage(idx, parseFloat(e.target.value))}
                          className="w-full accent-[var(--accent)] h-2 bg-slate-100 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {!isValid && (
                  <div
                    className="mt-4 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold"
                    style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', color: 'var(--primary)' }}
                  >
                    <Info size={16} className="flex-shrink-0" />
                    Percentages must equal exactly 100.0%. Difference: {(100 - totalPct).toFixed(1)}%. Click &quot;Split Evenly&quot; above to auto-balance.
                  </div>
                )}
              </Card>
            </Reveal>
          </div>

          {/* Right: Live Preview & Run Action */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <Reveal delay={0.25}>
                <Card elevated padding="lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap size={18} className="text-[var(--accent)]" />
                      <h2 className="text-lg font-bold text-[var(--primary)]">
                        Live Split Preview
                      </h2>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--background)] text-[var(--accent)]">
                      Deterministic
                    </span>
                  </div>

                  {/* Pool breakdown */}
                  <div className="mb-6 p-4 rounded-xl space-y-3 bg-[var(--background)] border border-[var(--text)]">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-0.5 text-[var(--text)]">
                        Total Pool
                      </p>
                      <p className="text-2xl font-black tabular-nums text-[var(--accent)]">
                        {formatMoney(poolAmount)}
                      </p>
                    </div>

                    {enableConsistency && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--text)] text-xs">
                        <div className="p-2 rounded-lg bg-white border border-[var(--text)]">
                          <span className="text-[11px] text-[var(--text)] block">Work Pool</span>
                          <span className="font-bold text-[var(--primary)]">{formatMoney(consistencyResult.workPoolMinor)}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-[var(--text)]">
                          <span className="text-[11px] text-[var(--accent)] block">Consistency ({consistencyPercent}%)</span>
                          <span className="font-bold text-[var(--accent)]">{formatMoney(consistencyResult.consistencyPoolMinor)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Split lines */}
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
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
                            className="p-3 rounded-xl bg-white border border-[var(--text)] space-y-1.5 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                  style={{ background: 'var(--primary)' }}
                                >
                                  {member?.name.charAt(0)}
                                </div>
                                <span className="text-sm font-bold text-[var(--primary)]">
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
                      background: isValid ? 'var(--background)' : 'var(--background)',
                      color: isValid ? 'var(--accent)' : 'var(--primary)',
                      border: `1px solid ${isValid ? 'var(--background)' : 'var(--background)'}`,
                    }}
                  >
                    Sum: {formatMoney(consistencyResult.lines.reduce((s, l) => s + l.finalAmountMinor, 0))} /{' '}
                    {formatMoney(poolAmount)}{' '}
                    {isValid ? '✓ Exact match (no cents lost)' : '✗ Does not match'}
                  </div>

                  {submitError && (
                    <div className="mt-3 p-3 rounded-xl text-xs font-bold bg-[var(--background)] text-[var(--primary)]">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}