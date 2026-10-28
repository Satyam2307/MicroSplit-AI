'use client';

import Link from 'next/link';
import { use, Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  ArrowLeft,
  Crown,
  Shield,
  UserCheck,
  Eye,
  Plus,
  Mail,
  Zap,
  Globe,
  Clock,
  CheckCircle2,
  X,
  AlertTriangle,
  ArrowRight,
  FileText,
  Flame,
  Trash2,
} from 'lucide-react';
import { Reveal, Card, MoneyChip } from '@/components/ui';
import {
  mockSquads,
  mockMemberships,
  mockUsers,
  mockRevenueEvents,
  mockSplitRuns,
  type MockMembership,
  type MockRevenueEvent,
  type MockUser,
} from '@/lib/mock-data';
import { formatMoney } from '@/lib/money';
import { getCurrencySymbol } from '@/lib/currency';
import { showToast } from '@/components/Toast';

const roleColors: Record<string, { bg: string; color: string }> = {
  owner: { bg: 'var(--background)', color: 'var(--accent)' },
  approver: { bg: 'var(--background)', color: 'var(--accent)' },
  contributor: { bg: 'var(--background)', color: 'var(--accent)' },
  viewer: { bg: 'var(--background)', color: 'var(--text)' },
};

const roleIcons: Record<string, React.ReactNode> = {
  owner: <Crown size={13} />,
  approver: <Shield size={13} />,
  contributor: <UserCheck size={13} />,
  viewer: <Eye size={13} />,
};

const getTimeInTimezone = (tz: string) => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date());
  } catch {
    return '';
  }
};

function SquadDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  // Local state for dynamic interactivity
  const initialSquad = mockSquads.find((s) => s.id === id) || {
    id,
    name: 'Collaborative Squad',
    ownerId: 'usr_1',
    currency: 'USD',
    createdAt: new Date().toISOString(),
    memberCount: 1,
    totalRevenue: 0,
  };
  const [squad, setSquad] = useState(initialSquad);
  const [users, setUsers] = useState<MockUser[]>(mockUsers);
  const [members, setMembers] = useState<MockMembership[]>(
    mockMemberships.filter((m) => m.squadId === squad.id)
  );
  const [revenue, setRevenue] = useState<MockRevenueEvent[]>(
    mockRevenueEvents.filter((r) => r.squadId === squad.id)
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'revenue' | 'splits'>('overview');

  // Fetch latest squad data from backend API
  useEffect(() => {
    fetch(`/api/squads/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.data?.squad) {
          setSquad(data.data.squad);
          if (Array.isArray(data.data.members)) {
            setMembers(data.data.members);
          }
          if (Array.isArray(data.data.revenue)) {
            setRevenue(data.data.revenue);
          }
          if (Array.isArray(data.data.users)) {
            setUsers(data.data.users);
          }
        }
      })
      .catch(() => {});
  }, [id]);

  // Modals state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showRecordRevenueModal, setShowRecordRevenueModal] = useState(false);
  const [showDeleteSquadModal, setShowDeleteSquadModal] = useState(false);

  // Add member form state
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'contributor' | 'approver' | 'viewer' | 'owner'>('contributor');
  const [newMemberTimezone, setNewMemberTimezone] = useState('Asia/Kolkata');
  const [newMemberOptIn, setNewMemberOptIn] = useState(true);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  // Record revenue form state
  const [revAmount, setRevAmount] = useState('1000.00');
  const [revSource, setRevSource] = useState('Stripe');
  const [revDesc, setRevDesc] = useState('SaaS Monthly Subscription Pool');
  const [isRecordingRev, setIsRecordingRev] = useState(false);
  const [revError, setRevError] = useState<string | null>(null);

  // Split runs for this squad
  const runs = mockSplitRuns.filter(
    (r) => r.squadId === squad.id || revenue.some((rev) => rev.id === r.revenueEventId)
  );

  // Current Indian Time (IST)
  const indianTime = getTimeInTimezone('Asia/Kolkata');

  // Handle Add Member Submission
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) {
      setMemberError('Email address is required');
      return;
    }

    setIsAddingMember(true);
    setMemberError(null);

    const enteredName = newMemberName.trim() || newMemberEmail.split('@')[0];

    try {
      const res = await fetch(`/api/squads/${squad.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: enteredName,
          email: newMemberEmail.trim(),
          role: newMemberRole,
          timezone: newMemberTimezone,
          focusSessionsOptIn: newMemberOptIn,
          payoutReceiver: newMemberEmail.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add member');
      }

      const createdMem = data.data.membership;
      const createdUser = data.data.user;

      if (createdUser) {
        setUsers((prev) => [...prev.filter((u) => u.id !== createdUser.id), createdUser]);
        if (!mockUsers.some((u) => u.id === createdUser.id)) {
          mockUsers.push(createdUser);
        }
      }

      // Ensure membership has memberName directly
      if (!createdMem.memberName) {
        createdMem.memberName = enteredName;
      }

      setMembers((prev) => [...prev, createdMem]);
      setSquad((prev) => ({ ...prev, memberCount: prev.memberCount + 1 }));

      showToast({
        type: 'success',
        title: 'Member Added to Squad',
        message: `${enteredName} is now registered with initial 0d streak.`,
      });

      // Reset & close
      setNewMemberName('');
      setNewMemberEmail('');
      setShowAddMemberModal(false);
    } catch (err: unknown) {
      setMemberError(err instanceof Error ? err.message : 'Error adding member');
    } finally {
      setIsAddingMember(false);
    }
  };

  // Handle Delete Member
  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from squad "${squad.name}"?`)) return;

    try {
      const res = await fetch(`/api/squads/${squad.id}/members?memberId=${memberId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to remove member');
      }

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setSquad((prev) => ({ ...prev, memberCount: Math.max(1, prev.memberCount - 1) }));

      showToast({
        type: 'info',
        title: 'Member Removed',
        message: `${memberName} has been removed from this squad.`,
      });
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Removal Error',
        message: err instanceof Error ? err.message : 'Could not remove member',
      });
    }
  };

  // Handle Delete Squad
  const handleDeleteSquad = async () => {
    try {
      const res = await fetch(`/api/squads/${squad.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete squad');
      }

      showToast({
        type: 'success',
        title: 'Squad Deleted',
        message: `Squad "${squad.name}" has been permanently deleted.`,
      });

      router.push('/squads');
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Deletion Error',
        message: err instanceof Error ? err.message : 'Could not delete squad',
      });
    }
  };

  // Handle Record Revenue Submission
  const handleRecordRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(revAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setRevError('Please enter a valid amount');
      return;
    }

    setIsRecordingRev(true);
    setRevError(null);

    try {
      const amountMinor = Math.round(amountVal * 100);
      const res = await fetch(`/api/squads/${squad.id}/revenue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountMinor,
          currency: squad.currency,
          source: revSource,
          description: revDesc.trim() || `${revSource} Revenue Event`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record revenue');
      }

      const createdRev = data.data;
      setRevenue((prev) => [createdRev, ...prev]);
      setSquad((prev) => ({ ...prev, totalRevenue: prev.totalRevenue + amountMinor }));

      showToast({
        type: 'success',
        title: 'Revenue Event Recorded',
        message: `Added ${formatMoney(amountMinor)} from ${revSource} to squad pool.`,
      });

      setShowRecordRevenueModal(false);
      setRevAmount('1000.00');
    } catch (err: unknown) {
      setRevError(err instanceof Error ? err.message : 'Error recording revenue');
    } finally {
      setIsRecordingRev(false);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      {/* Top Banner / Breadcrumb */}
      <div style={{ background: 'var(--background)', borderBottom: '1px solid var(--text)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
            <Link href="/" className="hover:text-[var(--accent)] transition-colors">MicroSplit</Link>
            <span>/</span>
            <Link href="/squads" className="hover:text-[var(--accent)] transition-colors">Squads</Link>
            <span>/</span>
            <span className="text-[var(--primary)] font-bold">{squad.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Squad Header */}
        <Reveal>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white"
                style={{
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  boxShadow: '0 8px 24px color-mix(in srgb, var(--accent) 25%, transparent)',
                }}
              >
                <Users size={30} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--primary)]">
                    {squad.name}
                  </h1>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ background: 'var(--background)', color: 'var(--accent)', border: '1px solid var(--text)' }}
                  >
                    {squad.currency} ({getCurrencySymbol(squad.currency)})
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text)]">
                  <span>{members.length} verified collaborator{members.length !== 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>Created {new Date(squad.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--background)] text-[var(--accent)] border border-[var(--text)]">
                    <Clock size={11} />
                    IST India: {indianTime || '5:30 PM'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowRecordRevenueModal(true)}
                className="btn-secondary text-sm py-2 px-3.5 flex items-center gap-2 font-bold transition-all"
                style={{ borderColor: 'var(--text)', color: 'var(--accent)', background: 'var(--background)' }}
              >
                <span className="w-5 h-5 rounded-full bg-[var(--background)] text-[var(--accent)] flex items-center justify-center text-xs font-black font-mono">
                  {getCurrencySymbol(squad.currency)}
                </span>
                Record revenue
              </button>

              <button
                type="button"
                onClick={() => setShowAddMemberModal(true)}
                className="btn-secondary text-sm py-2 px-3.5 flex items-center gap-1.5 font-semibold"
                style={{ borderColor: 'var(--text)', color: 'var(--primary)', background: 'var(--background)' }}
              >
                <Plus size={15} />
                Add member
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteSquadModal(true)}
                className="btn-secondary text-sm py-2 px-3 transition-colors flex items-center gap-1.5 font-semibold text-[var(--primary)] border-[var(--background)] hover:bg-[var(--background)]"
                title="Delete this squad"
              >
                <Trash2 size={14} />
                <span>Delete squad</span>
              </button>

              <Link
                href="/splits/new"
                className="btn-primary text-sm py-2 px-4 rounded-xl flex items-center gap-1.5 font-semibold shadow-sm text-white"
                style={{ background: 'var(--accent)' }}
              >
                <Zap size={15} />
                Run the split
              </Link>
            </div>
          </div>
        </Reveal>

        {/* KPI Summary Grid */}
        <Reveal delay={0.08}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Revenue Pool', value: formatMoney(squad.totalRevenue), color: 'var(--accent)', badge: `${squad.currency} Active Pool` },
              { label: 'Verified Members', value: members.length.toString(), color: 'var(--primary)', badge: 'Active' },
              { label: 'Revenue Inflow Events', value: revenue.length.toString(), color: 'var(--accent)', badge: 'Audited' },
              { label: 'Executed Split Runs', value: runs.length.toString(), color: 'var(--accent)', badge: 'Deterministic' },
            ].map((stat) => (
              <Card key={stat.label} padding="md" elevated>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                    {stat.label}
                  </p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--background)] text-[var(--text)]">
                    {stat.badge}
                  </span>
                </div>
                <p className="text-2xl font-black tabular-nums" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </Card>
            ))}
          </div>
        </Reveal>

        {/* Tab Navigation */}
        <div className="border-b border-[var(--text)] mb-8 flex gap-6 text-sm font-bold">
          {(['overview', 'members', 'revenue', 'splits'] as const).map((tab) => {
            const labels = {
              overview: 'Overview',
              members: `Members (${members.length})`,
              revenue: `Revenue Events (${revenue.length})`,
              splits: `Split Runs (${runs.length})`,
            };
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 relative transition-colors ${
                  isActive ? 'text-[var(--accent)]' : 'text-[var(--text)] hover:text-[var(--primary)]'
                }`}
              >
                {labels[tab]}
                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Members Section */}
            <div className="lg:col-span-1">
              <Card padding="none" elevated>
                <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--text)]">
                  <h2 className="text-base font-bold text-[var(--primary)]">
                    Squad Members
                  </h2>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
                <div className="divide-y divide-[var(--text)]">
                  {members.map((mem) => {
                    const user = users.find((u) => u.id === mem.userId);
                    const displayName =
                      mem.memberName ||
                      user?.name ||
                      (mem.payoutReceiver?.includes('@') ? mem.payoutReceiver.split('@')[0] : 'Collaborator');
                    const rc = roleColors[mem.role] || roleColors.viewer;
                    const tz = mem.timezone || 'Asia/Kolkata';
                    const localTime = getTimeInTimezone(tz);

                    return (
                      <div key={mem.id} className="px-6 py-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: 'var(--primary)' }}
                          >
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold truncate text-[var(--primary)]">
                                {displayName}
                              </p>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
                                <Flame size={11} className="text-amber-500 fill-amber-500" />
                                {mem.streakDays ?? 0}d
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-[var(--text)] truncate mt-0.5">
                              <Clock size={11} />
                              <span>{tz === 'Asia/Kolkata' ? 'Asia/Kolkata (IST)' : tz}</span>
                              {localTime && (
                                <span className="text-[10px] text-[var(--accent)] font-semibold">
                                  ({localTime})
                                </span>
                              )}
                              {mem.focusSessionsOptIn && (
                                <span className="text-[10px] text-[var(--accent)] font-bold">• Opt-in</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{ background: rc.bg, color: rc.color }}
                          >
                            {roleIcons[mem.role]}
                            {mem.role}
                          </span>

                          {mem.role !== 'owner' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(mem.id, displayName)}
                              className="p-1 text-[var(--text)] hover:text-[var(--primary)] hover:bg-[var(--background)] rounded transition-colors"
                              title={`Remove ${displayName} from squad`}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Revenue Events */}
            <div className="lg:col-span-2 space-y-8">
              <Card padding="none" elevated>
                <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--text)]">
                  <div>
                    <h2 className="text-base font-bold text-[var(--primary)]">
                      Recent Inflow Events
                    </h2>
                    <p className="text-xs text-[var(--text)]">
                      Deposited funds ready for deterministic multi-contributor splitting.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRecordRevenueModal(true)}
                    className="btn-primary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 font-semibold text-white"
                    style={{ background: 'var(--accent)' }}
                  >
                    <span className="font-mono font-bold">{getCurrencySymbol(squad.currency)}</span> Record revenue
                  </button>
                </div>
                <div className="divide-y divide-[var(--text)]">
                  {revenue.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[var(--text)]">
                      No revenue recorded yet. Click "Record revenue" to add an inflow.
                    </div>
                  ) : (
                    revenue.map((rev) => {
                      const run = runs.find((r) => r.revenueEventId === rev.id);
                      return (
                        <div key={rev.id} className="px-6 py-4 flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate text-[var(--primary)]">
                              {rev.description}
                            </p>
                            <p className="text-xs text-[var(--text)] mt-0.5">
                              {rev.source} • {new Date(rev.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <MoneyChip amount={formatMoney(rev.amountMinor)} status="paid" size="md" />
                            {run ? (
                              <Link
                                href={`/runs/${run.id}`}
                                className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                              >
                                View Split <ArrowRight size={12} />
                              </Link>
                            ) : (
                              <Link
                                href={`/splits/new?squadId=${squad.id}&revId=${rev.id}&amount=${rev.amountMinor}`}
                                className="text-xs font-bold text-[var(--primary)] bg-[var(--background)] hover:bg-[var(--background)] px-2.5 py-1 rounded transition-colors"
                              >
                                Split This
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>

              {/* Split Runs */}
              <Card padding="none" elevated>
                <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--text)]">
                  <div>
                    <h2 className="text-base font-bold text-[var(--primary)]">
                      Executed Split Runs
                    </h2>
                    <p className="text-xs text-[var(--text)]">
                      Cryptographic zero-cent-loss payout executions.
                    </p>
                  </div>
                  <Link
                    href="/splits/new"
                    className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                  >
                    New Run <ArrowRight size={12} />
                  </Link>
                </div>
                <div className="divide-y divide-[var(--text)]">
                  {runs.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[var(--text)]">
                      No split runs executed for this squad yet.
                    </div>
                  ) : (
                    runs.map((run) => (
                      <div key={run.id} className="px-6 py-4 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-[var(--primary)]">
                              {run.id}
                            </span>
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                              style={{
                                background: run.status === 'executed' ? 'var(--background)' : 'var(--background)',
                                color: run.status === 'executed' ? 'var(--accent)' : 'var(--accent)',
                              }}
                            >
                              {run.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text)] mt-0.5">
                            Rule: v{run.ruleVersion} • {new Date(run.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-black font-mono text-[var(--primary)]">
                              {formatMoney(run.poolMinor)}
                            </p>
                            <p className="text-[11px] text-[var(--text)]">
                              {run.lines.length} lines settled
                            </p>
                          </div>
                          <Link
                            href={`/runs/${run.id}`}
                            className="btn-ghost text-xs py-1 px-2.5 rounded font-semibold text-[var(--accent)]"
                          >
                            Details →
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tab Content: Members */}
        {activeTab === 'members' && (
          <Card padding="none" elevated>
            <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--text)]">
              <div>
                <h2 className="text-base font-bold text-[var(--primary)]">
                  Squad Collaborators ({members.length})
                </h2>
                <p className="text-xs text-[var(--text)]">
                  Team roster, settlement destination addresses, timezones, and focus tracking preferences.
                </p>
              </div>
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="btn-primary text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 font-semibold text-white"
                style={{ background: 'var(--accent)' }}
              >
                <Plus size={14} /> Add new member
              </button>
            </div>
            <div className="divide-y divide-[var(--text)]">
              {members.map((mem) => {
                const user = users.find((u) => u.id === mem.userId);
                const displayName =
                  mem.memberName ||
                  user?.name ||
                  (mem.payoutReceiver?.includes('@') ? mem.payoutReceiver.split('@')[0] : 'Collaborator');
                const rc = roleColors[mem.role] || roleColors.viewer;
                const tz = mem.timezone || 'Asia/Kolkata';
                const localTime = getTimeInTimezone(tz);

                return (
                  <div key={mem.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: 'var(--primary)' }}
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-bold text-[var(--primary)]">
                            {displayName}
                          </p>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Flame size={13} className="text-amber-500 fill-amber-500" />
                            {mem.streakDays ?? 0}d streak
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text)] mt-0.5">
                          {mem.payoutReceiver} ({mem.payoutReceiverType})
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-[var(--text)]">
                        <Globe size={13} />
                        <span>{tz === 'Asia/Kolkata' ? 'Asia/Kolkata (IST)' : tz}</span>
                        {localTime && (
                          <span className="text-[11px] text-[var(--accent)] font-semibold">
                            ({localTime})
                          </span>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full font-bold ${
                        mem.focusSessionsOptIn ? 'bg-[var(--background)] text-[var(--accent)]' : 'bg-slate-100 text-[var(--text)]'
                      }`}>
                        {mem.focusSessionsOptIn ? 'Focus: Opted In' : 'Focus: Opted Out'}
                      </span>
                      <span
                        className="px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[11px]"
                        style={{ background: rc.bg, color: rc.color }}
                      >
                        {mem.role}
                      </span>
                      {mem.role !== 'owner' ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(mem.id, displayName)}
                          className="p-1.5 text-[var(--text)] hover:text-[var(--primary)] hover:bg-[var(--background)] rounded-lg transition-colors ml-1"
                          title={`Remove ${displayName} from squad`}
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : (
                        <span className="text-[10px] text-[var(--text)] font-semibold italic px-1">Owner</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Tab Content: Revenue */}
        {activeTab === 'revenue' && (
          <Card padding="none" elevated>
            <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--text)]">
              <div>
                <h2 className="text-base font-bold text-[var(--primary)]">
                  All Revenue Inflows ({revenue.length})
                </h2>
                <p className="text-xs text-[var(--text)]">
                  Every verified inflow entering the squad's pool with SHA-256 ledger integrity.
                </p>
              </div>
              <button
                onClick={() => setShowRecordRevenueModal(true)}
                className="btn-primary text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 font-semibold text-white"
                style={{ background: 'var(--accent)' }}
              >
                <span className="font-mono font-bold">{getCurrencySymbol(squad.currency)}</span> Record revenue
              </button>
            </div>
            <div className="divide-y divide-[var(--text)]">
              {revenue.length === 0 ? (
                <div className="p-8 text-center text-sm text-[var(--text)]">
                  No revenue recorded yet. Click "Record revenue" above.
                </div>
              ) : (
                revenue.map((rev) => (
                  <div key={rev.id} className="p-6 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-bold text-[var(--primary)]">{rev.description}</p>
                      <p className="text-xs text-[var(--text)] mt-0.5">
                        Source: {rev.source} • Recorded {new Date(rev.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <MoneyChip amount={formatMoney(rev.amountMinor)} status="paid" size="md" />
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* Tab Content: Splits */}
        {activeTab === 'splits' && (
          <Card padding="none" elevated>
            <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--text)]">
              <div>
                <h2 className="text-base font-bold text-[var(--primary)]">
                  Executed Split Runs ({runs.length})
                </h2>
                <p className="text-xs text-[var(--text)]">
                  Audited deterministic split runs with PayPal batch items.
                </p>
              </div>
              <Link
                href="/splits/new"
                className="btn-primary text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 font-semibold text-white"
                style={{ background: 'var(--accent)' }}
              >
                <Zap size={14} /> Run a new split
              </Link>
            </div>
            <div className="divide-y divide-[var(--text)]">
              {runs.length === 0 ? (
                <div className="p-8 text-center text-sm text-[var(--text)]">
                  No split runs created yet. Run a split to allocate revenue among members.
                </div>
              ) : (
                runs.map((run) => (
                  <div key={run.id} className="p-6 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-[var(--primary)]">{run.id}</span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded"
                          style={{
                            background: run.status === 'executed' ? 'var(--background)' : 'var(--background)',
                            color: run.status === 'executed' ? 'var(--accent)' : 'var(--accent)',
                          }}
                        >
                          {run.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text)] mt-1">
                        Rule: v{run.ruleVersion} • Executed {new Date(run.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-black font-mono text-[var(--primary)]">
                          {formatMoney(run.poolMinor)}
                        </p>
                        <p className="text-xs text-[var(--text)]">
                          {run.lines.length} lines settled
                        </p>
                      </div>
                      <Link
                        href={`/runs/${run.id}`}
                        className="btn-secondary text-xs py-1.5 px-3 rounded-lg font-semibold"
                      >
                        Inspect Proof →
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>

      {/* ─── MODAL: ADD SQUAD MEMBER ────────────────────────── */}
      <AnimatePresence>
        {showAddMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[var(--text)] overflow-hidden"
            >
              <div className="px-6 py-4 bg-[var(--background)] border-b border-[var(--text)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--background)] flex items-center justify-center text-[var(--accent)]">
                    <Plus size={18} />
                  </div>
                  <h3 className="text-base font-bold text-[var(--primary)]">Add Collaborator to Squad</h3>
                </div>
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="text-[var(--text)] hover:text-[var(--primary)] p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="p-6 space-y-4">
                {memberError && (
                  <div className="p-3 rounded-lg text-xs font-bold bg-[var(--background)] text-[var(--primary)]">
                    {memberError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[var(--primary)] mb-1">
                    Member Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Satyam Chaurasia"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="input-field text-sm w-full"
                  />
                  <p className="text-[11px] text-[var(--text)] mt-1">
                    This exact name will be displayed in the squad roster and split sheets.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--primary)] mb-1">
                    Email / PayPal Payout Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="member@paypal.demo"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="input-field text-sm w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--primary)] mb-1">Squad Role</label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as any)}
                      className="input-field text-sm font-medium w-full"
                    >
                      <option value="contributor">Contributor</option>
                      <option value="approver">Approver</option>
                      <option value="viewer">Viewer</option>
                      <option value="owner">Owner</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--primary)] mb-1">Timezone</label>
                    <select
                      value={newMemberTimezone}
                      onChange={(e) => setNewMemberTimezone(e.target.value)}
                      className="input-field text-sm font-medium w-full"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30) - India</option>
                      <option value="America/New_York">America/New_York (EST, UTC-5)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST, UTC-8)</option>
                      <option value="Europe/London">Europe/London (GMT/BST, UTC+0)</option>
                      <option value="Europe/Berlin">Europe/Berlin (CET, UTC+1)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST, UTC+9)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4)</option>
                      <option value="UTC">UTC (Universal)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--text)] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[var(--primary)]">Focus Sessions Opt-in</p>
                    <p className="text-[11px] text-[var(--text)]">Permit self-service deep work logs</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={newMemberOptIn}
                    onChange={(e) => setNewMemberOptIn(e.target.checked)}
                    className="w-4 h-4 accent-[var(--accent)]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(false)}
                    className="btn-ghost text-sm font-semibold text-[var(--text)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingMember}
                    className="btn-primary text-sm font-semibold text-white px-4 py-2 rounded-xl"
                    style={{ background: 'var(--accent)' }}
                  >
                    {isAddingMember ? 'Adding...' : 'Confirm Member'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: RECORD REVENUE (FIXED PADDING & PROPER CURRENCY) ─── */}
      <AnimatePresence>
        {showRecordRevenueModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[var(--text)] overflow-hidden"
            >
              <div className="px-6 py-4 bg-[var(--background)] border-b border-[var(--text)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--background)] flex items-center justify-center text-[var(--accent)] font-black font-mono text-base">
                    {getCurrencySymbol(squad.currency)}
                  </div>
                  <h3 className="text-base font-bold text-[var(--primary)]">Record Squad Inflow</h3>
                </div>
                <button
                  onClick={() => setShowRecordRevenueModal(false)}
                  className="text-[var(--text)] hover:text-[var(--primary)] p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRecordRevenue} className="p-6 space-y-4">
                {revError && (
                  <div className="p-3 rounded-lg text-xs font-bold bg-[var(--background)] text-[var(--primary)]">
                    {revError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[var(--primary)] mb-1.5">
                    Revenue Amount ({squad.currency})
                  </label>
                  <div className="relative flex items-center">
                    <span
                      className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-base font-bold font-mono text-[var(--text)] select-none z-10"
                    >
                      {getCurrencySymbol(squad.currency)}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      autoComplete="off"
                      placeholder="0.00"
                      value={revAmount}
                      onChange={(e) => setRevAmount(e.target.value)}
                      className="input-field font-bold font-mono text-base w-full"
                      style={{ paddingLeft: '56px' }}
                    />
                  </div>
                  <p className="text-[11px] text-[var(--text)] mt-1">
                    Settled in {squad.currency}. Will be split across verified members with 0-cent loss.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--primary)] mb-1">Inflow Channel / Source</label>
                  <select
                    value={revSource}
                    onChange={(e) => setRevSource(e.target.value)}
                    className="input-field text-sm font-medium w-full"
                  >
                    <option value="Stripe">Stripe Checkout / Billing</option>
                    <option value="PayPal">PayPal Business Payment</option>
                    <option value="GitHub Sponsors">GitHub Sponsors</option>
                    <option value="Client Project">Client Milestone Invoice</option>
                    <option value="Bounty">Bounty / Grant Settlement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--primary)] mb-1">Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., November Milestone Payout"
                    value={revDesc}
                    onChange={(e) => setRevDesc(e.target.value)}
                    className="input-field text-sm w-full"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRecordRevenueModal(false)}
                    className="btn-ghost text-sm font-semibold text-[var(--text)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRecordingRev}
                    className="btn-primary text-sm font-semibold text-white px-4 py-2 rounded-xl flex items-center gap-1.5"
                    style={{ background: 'var(--accent)' }}
                  >
                    <span className="font-mono font-bold">{getCurrencySymbol(squad.currency)}</span>
                    {isRecordingRev ? 'Recording...' : 'Record Inflow'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: DELETE SQUAD CONFIRMATION ───────────────── */}
      <AnimatePresence>
        {showDeleteSquadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[var(--background)] overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-xl bg-[var(--background)] text-[var(--primary)] flex items-center justify-center mb-4">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-[var(--primary)] mb-1">
                  Delete Squad Workspace?
                </h3>
                <p className="text-sm text-[var(--text)] mb-4">
                  Are you sure you want to permanently delete <strong className="text-[var(--primary)]">"{squad.name}"</strong>? This will remove all associated member rosters, revenue events, and ledger records. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteSquadModal(false)}
                    className="btn-ghost text-sm font-semibold text-[var(--text)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSquad}
                    className="text-sm font-semibold px-4 py-2 rounded-xl text-white bg-[var(--primary)] hover:bg-[var(--primary)] transition-colors"
                  >
                    Permanently Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SquadDetailPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-16 px-4 max-w-7xl mx-auto flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
            <p className="text-sm font-medium text-[var(--text)]">Loading squad workspace...</p>
          </div>
        </div>
      }
    >
      <SquadDetailContent {...props} />
    </Suspense>
  );
}
