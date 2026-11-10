'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  DollarSign,
  ArrowRight,
  Crown,
  Eye,
  Shield,
  UserCheck,
  Zap,
  Search,
  Sparkles,
  Layers,
  X,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Reveal, Card, MoneyChip } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import { showToast } from '@/components/Toast';
import {
  getStoredSquads,
  saveStoredSquad,
  saveStoredMember,
  deleteStoredSquad,
  getCurrentUser,
  isDemoUser,
  seedStarterSquadForUser,
  type UserSession,
} from '@/lib/client-storage';

interface SquadListItem {
  id: string;
  name: string;
  ownerId: string;
  currency: string;
  memberCount: number;
  totalRevenue: number;
  currentRole: string;
  owner: { name: string } | null;
}

const initialDemoSquads: SquadListItem[] = [
  {
    id: 'sqd_1',
    name: 'Vortex Design Studio',
    ownerId: 'usr_1',
    currency: 'USD',
    memberCount: 4,
    totalRevenue: 850000,
    currentRole: 'owner',
    owner: { name: 'Alex Rivera' },
  },
  {
    id: 'sqd_2',
    name: 'OSS Contributors Fund',
    ownerId: 'usr_2',
    currency: 'USD',
    memberCount: 5,
    totalRevenue: 1200000,
    currentRole: 'owner',
    owner: { name: 'Alex Rivera' },
  },
  {
    id: 'sqd_3',
    name: 'DevRelay Agency',
    ownerId: 'usr_1',
    currency: 'USD',
    memberCount: 3,
    totalRevenue: 450000,
    currentRole: 'owner',
    owner: { name: 'Alex Rivera' },
  },
];

export default function SquadsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isDemo, setIsDemo] = useState(true);
  const [squads, setSquads] = useState<SquadListItem[]>([]);
  const [search, setSearch] = useState('');
  const [listError, setListError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadCurrency, setNewSquadCurrency] = useState('USD');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const filteredSquads = squads.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPool = squads.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalCollaborators = squads.reduce((sum, squad) => sum + squad.memberCount, 0);

  useEffect(() => {
    let active = true;

    const user = getCurrentUser();
    const demo = isDemoUser();
    setCurrentUser(user);
    setIsDemo(demo);

    if (user) {
      setNewOwnerName(user.name);
      setNewOwnerEmail(user.email);
    } else {
      setNewOwnerName('Alex Rivera');
      setNewOwnerEmail('alex@microsplit.demo');
    }

    // Load user-scoped stored custom squads
    const stored = getStoredSquads().map((s) => ({
      id: s.id,
      name: s.name,
      ownerId: s.ownerId,
      currency: s.currency,
      memberCount: s.memberCount || 1,
      totalRevenue: s.totalRevenue || 0,
      currentRole: 'owner',
      owner: { name: (s as any).owner?.name || user?.name || 'Owner' },
    }));

    if (demo) {
      const map = new Map<string, SquadListItem>();
      stored.forEach((s) => map.set(s.id, s));
      initialDemoSquads.forEach((s) => {
        if (!map.has(s.id)) map.set(s.id, s);
      });
      setSquads(Array.from(map.values()));

      fetch('/api/squads')
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok || !result.success) {
            throw new Error(result.error || 'Unable to load squads');
          }
          if (active) {
            const apiSquads = (result.data || []) as SquadListItem[];
            setSquads(() => {
              const m = new Map<string, SquadListItem>();
              stored.forEach((s) => m.set(s.id, s));
              apiSquads.forEach((s) => {
                if (!m.has(s.id)) m.set(s.id, s);
              });
              return Array.from(m.values());
            });
          }
        })
        .catch((err: unknown) => {
          if (active) {
            setListError(err instanceof Error ? err.message : 'Unable to load squads');
          }
        });
    } else {
      // For custom user: show strictly their own squads
      setSquads(stored);
    }

    return () => {
      active = false;
    };
  }, []);

  const handleSeedStarter = () => {
    const starter = seedStarterSquadForUser();
    if (starter) {
      const user = getCurrentUser();
      const squadItem: SquadListItem = {
        id: starter.id,
        name: starter.name,
        ownerId: starter.ownerId,
        currency: starter.currency,
        memberCount: starter.memberCount || 2,
        totalRevenue: starter.totalRevenue || 300000,
        currentRole: 'owner',
        owner: { name: user?.name || 'Owner' },
      };
      setSquads((prev) => [squadItem, ...prev]);
      showToast({
        type: 'success',
        title: 'Starter Workspace Ready!',
        message: `Created "${starter.name}" with 2 members and verified revenue.`,
      });
    }
  };

  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSquadName.trim()) {
      setCreateError('Squad name is required');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/squads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSquadName.trim(),
          currency: newSquadCurrency,
          ownerName: newOwnerName.trim(),
          ownerEmail: newOwnerEmail.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create squad');
      }

      saveStoredSquad(data.data);
      if (data.membership) {
        saveStoredMember(data.membership);
      }

      setSquads((prev) => [data.data, ...prev.filter((s) => s.id !== data.data.id)]);
      showToast({
        type: 'success',
        title: 'Squad Workspace Created!',
        message: `${newSquadName} created with ${newOwnerName || 'owner'} as lead. Add teammates anytime.`,
      });

      setShowCreateModal(false);
      setNewSquadName('');
      router.push(`/squads/${data.data.id}`);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Error creating squad');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSquad = async (squadId: string, squadName: string) => {
    if (!confirm(`Are you sure you want to permanently delete squad "${squadName}"?`)) return;

    deleteStoredSquad(squadId);
    setSquads((prev) => prev.filter((s) => s.id !== squadId));

    try {
      const res = await fetch(`/api/squads/${squadId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete squad');
      }

      setSquads((prev) => prev.filter((s) => s.id !== squadId));

      showToast({
        type: 'info',
        title: 'Squad Deleted',
        message: `Squad "${squadName}" has been removed.`,
      });
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Deletion Failed',
        message: err instanceof Error ? err.message : 'Could not delete squad',
      });
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      {/* Top Breadcrumb */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--text)' }}>
            <Link href="/" className="hover:text-[var(--accent)] transition-colors">MicroSplit</Link>
            <span>/</span>
            <span className="font-bold" style={{ color: 'var(--primary)' }}>Squads Workspace</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <Reveal>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: 'var(--background)', color: 'var(--accent)' }}>
                  Team Directory
                </span>
                <span className="text-xs" style={{ color: 'var(--text)' }}>• Multi-squad revenue routing</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: 'var(--primary)' }}>
                Collaborative Squads
              </h1>
              <p className="text-base mt-1" style={{ color: 'var(--text)' }}>
                Manage high-velocity teams, track verified member streaks, and configure revenue splits.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="btn-3d btn-3d-sm"
                style={{
                  background: 'var(--accent)',
                  boxShadow: '0 4px 0 var(--accent), 0 8px 16px color-mix(in srgb, var(--accent) 25%, transparent)',
                }}
              >
                <Plus size={16} />
                Create squad
              </button>
            </div>
          </div>
        </Reveal>

        {/* Enterprise KPI Summary */}
        <Reveal delay={0.08}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Distributed Pool', value: formatMoney(totalPool), color: 'var(--accent)', badge: 'Audited' },
              { label: 'Verified Collaborators', value: totalCollaborators.toString(), color: 'var(--accent)', badge: 'Active' },
              { label: 'Active Squads', value: squads.length.toString(), color: 'var(--primary)', badge: 'Managed' },
              { label: 'Settlement Speed', value: '1-Batch', color: 'var(--accent)', badge: 'PayPal v1' },
            ].map((kpi) => (
              <Card key={kpi.label} padding="md" elevated>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
                    {kpi.label}
                  </p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--background)', color: 'var(--text)' }}>
                    {kpi.badge}
                  </span>
                </div>
                <p className="text-2xl font-black tabular-nums" style={{ color: kpi.color }}>
                  {kpi.value}
                </p>
              </Card>
            ))}
          </div>
        </Reveal>

        {/* Search & Filter Toolbar */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80 flex items-center">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10"
              style={{ color: 'var(--text)' }}
            />
            <input
              type="text"
              placeholder="Search squads by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field input-with-icon text-sm py-2.5"
              style={{ paddingLeft: '44px' }}
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold w-full sm:w-auto justify-end" style={{ color: 'var(--text)' }}>
            <span>Showing {filteredSquads.length} of {squads.length} squads</span>
          </div>
        </div>

        {/* Empty state banner when custom user has no squads */}
        {squads.length === 0 && (
          <div
            className="mb-8 p-8 rounded-3xl border text-center"
            style={{
              background: 'var(--background)',
              borderColor: 'color-mix(in srgb, var(--accent) 30%, var(--border))',
              boxShadow: '0 4px 20px color-mix(in srgb, var(--accent) 8%, transparent)',
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 text-white font-bold"
              style={{
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                boxShadow: '0 4px 14px color-mix(in srgb, var(--accent) 30%, transparent)',
              }}
            >
              <Users size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2 font-['Playfair_Display',serif]" style={{ color: 'var(--primary)' }}>
              Welcome to your personal workspace{currentUser?.name ? `, ${currentUser.name}` : ''}!
            </h3>
            <p className="text-sm max-w-lg mx-auto mb-6 leading-relaxed" style={{ color: 'var(--text)', opacity: 0.85 }}>
              You are signed in as <strong>{currentUser?.email || 'your account'}</strong>. You don't have any squads yet. Create your first squad workspace to add members, record revenue, and run automated integer-cent splits.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 cursor-pointer shadow-md"
                style={{ background: 'var(--accent)' }}
              >
                <Plus size={16} />
                Create First Squad
              </button>
              <button
                type="button"
                onClick={handleSeedStarter}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100 cursor-pointer border"
                style={{
                  background: 'var(--background)',
                  color: 'var(--primary)',
                  borderColor: 'var(--border)',
                }}
              >
                <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                Explore with Sample Squad
              </button>
            </div>
          </div>
        )}

        {/* Squad Cards Grid */}
        {listError && (
          <p className="mb-5 text-sm font-semibold text-rose-700" role="alert">
            {listError}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSquads.map((squad, idx) => {
            const owner = squad.owner;
            return (
              <Reveal key={squad.id} delay={idx * 0.05}>
                <Card
                  className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
                  padding="lg"
                  elevated
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                        style={{
                          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                          boxShadow: '0 4px 12px color-mix(in srgb, var(--accent) 25%, transparent)',
                        }}
                      >
                        <Users size={22} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MoneyChip
                          amount={formatMoney(squad.totalRevenue)}
                          status="paid"
                          size="sm"
                        />
                        {squad.currentRole === 'owner' && <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteSquad(squad.id, squad.name);
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                          style={{ color: 'var(--text)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
                          title={`Delete squad "${squad.name}"`}
                        >
                          <Trash2 size={15} />
                        </button>}
                      </div>
                    </div>

                    <Link href={`/squads/${squad.id}`} className="block">
                      <h3 className="text-lg font-bold mb-1 tracking-tight group-hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--primary)' }}>
                        {squad.name}
                      </h3>
                    </Link>

                    <div className="flex items-center gap-4 mb-4 text-xs font-semibold" style={{ color: 'var(--text)' }}>
                      <span className="flex items-center gap-1">
                        <Users size={13} />
                        {squad.memberCount} members
                      </span>
                      <span>•</span>
                      <span>{squad.currency} Settlement</span>
                    </div>

                    {owner && (
                      <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)]">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ background: 'var(--accent)' }}
                        >
                          {owner.name.charAt(0)}
                        </div>
                        <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                          Lead: {owner.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto" style={{ background: 'var(--background)', color: 'var(--accent)' }}>
                          Owner
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick Card Action Footer */}
                  <div className="pt-4 mt-4 border-t border-[var(--border)] flex items-center justify-between gap-2">
                    <Link
                      href={`/squads/${squad.id}`}
                      className="text-xs font-bold hover:underline flex items-center gap-1"
                      style={{ color: 'var(--accent)' }}
                    >
                      Workspace <ArrowRight size={13} />
                    </Link>
                    <Link
                      href={`/splits/new?squadId=${squad.id}`}
                      className="text-xs font-bold px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1"
                      style={{ background: 'var(--background)', color: 'var(--accent)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--background)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--background)'; }}
                    >
                      <Zap size={12} /> Run split
                    </Link>
                  </div>
                </Card>
              </Reveal>
            );
          })}

          {/* New Squad Quick Card */}
          <Reveal delay={filteredSquads.length * 0.05}>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="w-full h-full min-h-[220px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all p-6 text-center cursor-pointer group"
              style={{ borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)', background: 'color-mix(in srgb, var(--background) 40%, transparent)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--background)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 25%, transparent)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--background) 40%, transparent)'; }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:text-white transition-all shadow-sm"
                style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}
              >
                <Plus size={22} />
              </div>
              <div>
                <p className="text-sm font-bold group-hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--primary)' }}>
                  Create New Squad
                </p>
                <p className="text-xs mt-0.5 max-w-[200px]" style={{ color: 'var(--text)' }}>
                  Add a new collective with PayPal batch payouts.
                </p>
              </div>
            </button>
          </Reveal>
        </div>
      </div>

      {/* ─── MODAL: CREATE SQUAD (FUNCTIONAL) ─────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between" style={{ background: 'var(--background)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--background)', color: 'var(--accent)' }}>
                    <Plus size={18} />
                  </div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--primary)' }}>Create New Squad</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1" style={{ color: 'var(--text)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSquad} className="p-6 space-y-4">
                {createError && (
                  <div className="p-3 rounded-lg text-xs font-bold" style={{ background: 'var(--background)', color: 'var(--primary)' }}>
                    {createError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Squad Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Growth Engineering Collective"
                    value={newSquadName}
                    onChange={(e) => setNewSquadName(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Owner Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Rivera or Satyam"
                      value={newOwnerName}
                      onChange={(e) => setNewOwnerName(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Owner Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. owner@microsplit.demo"
                      value={newOwnerEmail}
                      onChange={(e) => setNewOwnerEmail(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Currency</label>
                  <select
                    value={newSquadCurrency}
                    onChange={(e) => setNewSquadCurrency(e.target.value)}
                    className="input-field text-sm font-medium"
                  >
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="CAD">CAD ($) - Canadian Dollar</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl border border-[var(--border)] text-xs" style={{ background: 'var(--background)', color: 'var(--text)' }}>
                  Lead / Admin: <strong style={{ color: 'var(--primary)' }}>{newOwnerName || 'Owner'}</strong> ({newOwnerEmail || 'email'}). You can invite additional contributors and approvers once created.
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-ghost text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="btn-3d btn-3d-sm"
                    style={{ background: 'var(--accent)', boxShadow: '0 3px 0 var(--accent)' }}
                  >
                    {isCreating ? 'Creating...' : 'Create Squad'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
