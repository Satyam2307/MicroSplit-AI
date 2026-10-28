'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrencySymbol } from '@/lib/currency';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Settings,
  Users,
  Percent,
  BarChart3,
  Target,
  Trophy,
  ArrowRight,
  Plus,
  Minus,
  DollarSign,
  Info,
  Flame,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Sliders,
  UserPlus,
} from 'lucide-react';
import { Reveal, Card, WeightBar, MoneyChip } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import { calculateConsistencySplit } from '@/lib/consistency-streak';
import { mockSquads, mockUsers, mockMemberships } from '@/lib/mock-data';
import { showToast } from '@/components/Toast';

type RuleType = 'fixed_percentage' | 'weighted_points' | 'tiered' | 'milestone';

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
  const [selectedSquad, setSelectedSquad] = useState(mockSquads[0]);
  const [selectedRule, setSelectedRule] = useState<RuleType>('fixed_percentage');
  const [poolAmount, setPoolAmount] = useState(100000); // Default to $1,000.00 (100,000 cents)
  const [enableConsistency, setEnableConsistency] = useState(true);
  const [consistencyPercent, setConsistencyPercent] = useState(5); // Default 5%, max 10%
  const [streakCapDays, setStreakCapDays] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [memberSplits, setMemberSplits] = useState<MemberSplit[]>([
    { memberId: 'usr_2', name: 'Maya Chen', percentage: 50, streakDays: 100 },
    { memberId: 'usr_4', name: 'Sam Patel', percentage: 50, streakDays: 0 },
    { memberId: 'usr_1', name: 'Alex Rivera', percentage: 0, streakDays: 45 },
    { memberId: 'usr_3', name: 'Jordan Kim', percentage: 0, streakDays: 32 },
  ]);

  // Synchronize members dynamically when selected squad changes
  useEffect(() => {
    const mems = mockMemberships.filter((m) => m.squadId === selectedSquad.id);
    if (mems.length > 0) {
      const baseShare = Math.floor(1000 / mems.length) / 10;
      let remainder = 1000 - Math.floor(1000 / mems.length) * mems.length;
      const initialSplits = mems.map((m) => {
        const u = mockUsers.find((usr) => usr.id === m.userId);
        const name =
          m.memberName ||
          u?.name ||
          (m.payoutReceiver?.includes('@') ? m.payoutReceiver.split('@')[0] : 'Collaborator');
        const extra = remainder > 0 ? 0.1 : 0;
        if (remainder > 0) remainder--;
        return {
          memberId: m.userId,
          name,
          percentage: Math.round((baseShare + extra) * 10) / 10,
          streakDays: m.streakDays ?? 0,
        };
      });
      setMemberSplits(initialSplits);
    }
  }, [selectedSquad.id]);

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
    if (!isValid || poolAmount <= 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/split-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          squadId: selectedSquad.id,
          poolMinor: poolAmount,
          currency: selectedSquad.currency || 'USD',
          ruleConfig: {
            consistency_percent: enableConsistency ? consistencyPercent : 0,
            streak_cap_days: streakCapDays,
            freeze_days_per_30: 2,
          },
          memberSplits: memberSplits.map((m) => ({
            memberId: m.memberId,
            name: m.name,
            percentage: m.percentage,
            streakDays: m.streakDays,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to execute split run');
      }

      showToast({
        type: 'success',
        title: 'Split Run Created!',
        message: `Run ${json.data.id} is ready for human approver sign-off.`,
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>
                      Squad Workspace
                    </label>
                    <select
                      value={selectedSquad.id}
                      onChange={(e) => {
                        const s = mockSquads.find((sq) => sq.id === e.target.value);
                        if (s) setSelectedSquad(s);
                      }}
                      className="input-field font-medium"
                    >
                      {mockSquads.map((squad) => (
                        <option key={squad.id} value={squad.id}>
                          {squad.name} ({squad.currency})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-[var(--primary)]">
                      Total Revenue Pool ({selectedSquad.currency})
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-base font-bold text-[var(--text)] select-none z-10 font-mono">
                        {getCurrencySymbol(selectedSquad.currency)}
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={poolAmount / 100}
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value || '0'));
                          setPoolAmount(Math.round(val * 100));
                        }}
                        className="input-field font-bold font-mono text-base w-full"
                        placeholder="1000.00"
                        style={{ paddingLeft: '48px' }}
                      />
                    </div>
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

                    {/* Quick Preset: Canonical $1000 Example */}
                    <button
                      type="button"
                      onClick={() => {
                        setPoolAmount(100000);
                        setConsistencyPercent(5);
                        setEnableConsistency(true);
                        setMemberSplits([
                          { memberId: 'usr_2', name: 'Maya Chen', percentage: 50, streakDays: 100 },
                          { memberId: 'usr_4', name: 'Sam Patel', percentage: 50, streakDays: 0 },
                          { memberId: 'usr_1', name: 'Alex Rivera', percentage: 0, streakDays: 45 },
                          { memberId: 'usr_3', name: 'Jordan Kim', percentage: 0, streakDays: 32 },
                        ]);
                        showToast({
                          type: 'success',
                          title: 'Loaded Canonical $1,000 Preset',
                          message: 'Maya (100d streak, 50%) vs Sam (0d streak, 50%).',
                        });
                      }}
                      className="w-full py-2.5 px-3 rounded-lg text-xs font-bold text-[var(--accent)] bg-[var(--background)] hover:bg-[var(--text)] border border-[var(--text)] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles size={13} />
                      Load $1,000 Canonical Preset (Maya 100d vs Sam 0d)
                    </button>
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
                    Percentages must equal exactly 100.0%. Difference: {(100 - totalPct).toFixed(1)}%. Click "Split Evenly" above to auto-balance.
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
                                status="paid"
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
                    disabled={!isValid || isSubmitting}
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
                        Executing Split Run...
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
                    Creates an immutable run requiring human approver sign-off.
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
