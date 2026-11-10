import type { MockSquad, MockMembership, MockRevenueEvent } from './mock-data';

const SQUADS_KEY = 'microsplit_custom_squads';
const MEMBERS_KEY = 'microsplit_custom_members';
const REVENUE_KEY = 'microsplit_custom_revenue';
const SPLIT_RUNS_KEY = 'microsplit_custom_split_runs';
const USER_SESSION_KEY = 'microsplit_user_session';
export const AUTH_CHANGE_EVENT = 'microsplit_auth_change';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
}

export const DEFAULT_DEMO_USER: UserSession = {
  id: 'usr_1',
  name: 'Alex Rivera',
  email: 'alex@microsplit.demo',
  role: 'owner',
  initials: 'AR',
};

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function getItem<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to save ${key} to localStorage:`, err);
  }
}

// ─── User Session ─────────────────────────────────────────────
export function getCurrentUser(): UserSession | null {
  return getItem<UserSession | null>(USER_SESSION_KEY, null);
}

export function isDemoUser(): boolean {
  const user = getCurrentUser();
  if (!user || !user.email) return true;
  return user.email.trim().toLowerCase() === DEFAULT_DEMO_USER.email.toLowerCase();
}

function getScopedKey(baseKey: string): string {
  const user = getCurrentUser();
  if (!user || !user.email) return baseKey;
  const email = user.email.trim().toLowerCase();
  if (email === DEFAULT_DEMO_USER.email.toLowerCase()) return baseKey;
  return `${baseKey}:${email}`;
}

export function setCurrentUser(user: UserSession): void {
  setItem(USER_SESSION_KEY, user);
  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: user }));
  }
}

export function clearCurrentUser(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(USER_SESSION_KEY);
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: null }));
  } catch (err) {
    console.warn('Failed to clear user session:', err);
  }
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Squads ──────────────────────────────────────────────────
export function getStoredSquads(): MockSquad[] {
  return getItem<MockSquad[]>(getScopedKey(SQUADS_KEY), []);
}

export function getStoredSquad(id: string): MockSquad | null {
  const squads = getStoredSquads();
  const found = squads.find((s) => s.id === id);
  if (found) return found;

  if (isDemoUser()) {
    const baseSquads = getItem<MockSquad[]>(SQUADS_KEY, []);
    return baseSquads.find((s) => s.id === id) || null;
  }
  return null;
}

export function saveStoredSquad(squad: MockSquad): void {
  const key = getScopedKey(SQUADS_KEY);
  const current = getItem<MockSquad[]>(key, []);
  const filtered = current.filter((s) => s.id !== squad.id);
  setItem(key, [squad, ...filtered]);
}

export function deleteStoredSquad(id: string): void {
  const sKey = getScopedKey(SQUADS_KEY);
  const current = getItem<MockSquad[]>(sKey, []);
  setItem(sKey, current.filter((s) => s.id !== id));

  // Clean up associated members, revenue, and split runs
  const memKey = getScopedKey(MEMBERS_KEY);
  const members = getItem<MockMembership[]>(memKey, []);
  setItem(memKey, members.filter((m) => m.squadId !== id));

  const revKey = getScopedKey(REVENUE_KEY);
  const revenue = getItem<MockRevenueEvent[]>(revKey, []);
  setItem(revKey, revenue.filter((r) => r.squadId !== id));

  const runKey = getScopedKey(SPLIT_RUNS_KEY);
  const runs = getItem<any[]>(runKey, []);
  setItem(runKey, runs.filter((r) => r.squadId !== id));
}

// ─── Members ─────────────────────────────────────────────────
export function getStoredMembers(squadId?: string): MockMembership[] {
  const key = getScopedKey(MEMBERS_KEY);
  const all = getItem<MockMembership[]>(key, []);
  if (!squadId) return all;
  return all.filter((m) => m.squadId === squadId);
}

export function saveStoredMember(member: MockMembership): void {
  const key = getScopedKey(MEMBERS_KEY);
  const all = getItem<MockMembership[]>(key, []);
  const filtered = all.filter(
    (m) => m.id !== member.id && !(m.squadId === member.squadId && m.userId === member.userId)
  );
  setItem(key, [...filtered, member]);
}

export function deleteStoredMember(squadId: string, memberId: string): void {
  const key = getScopedKey(MEMBERS_KEY);
  const all = getItem<MockMembership[]>(key, []);
  setItem(
    key,
    all.filter((m) => !(m.squadId === squadId && (m.id === memberId || m.userId === memberId)))
  );
}

// ─── Revenue Events ──────────────────────────────────────────
export function getStoredRevenue(squadId?: string): MockRevenueEvent[] {
  const key = getScopedKey(REVENUE_KEY);
  const all = getItem<MockRevenueEvent[]>(key, []);
  if (!squadId) return all;
  return all.filter((r) => r.squadId === squadId);
}

export function saveStoredRevenue(event: MockRevenueEvent): void {
  const key = getScopedKey(REVENUE_KEY);
  const all = getItem<MockRevenueEvent[]>(key, []);
  const filtered = all.filter((r) => r.id !== event.id);
  setItem(key, [event, ...filtered]);
}

// ─── Split Runs ──────────────────────────────────────────────
export function getStoredSplitRuns(squadId?: string): any[] {
  const key = getScopedKey(SPLIT_RUNS_KEY);
  const all = getItem<any[]>(key, []);
  if (!squadId) return all;
  return all.filter((r) => r.squadId === squadId);
}

export function getStoredSplitRun(id: string): any | null {
  const key = getScopedKey(SPLIT_RUNS_KEY);
  const all = getItem<any[]>(key, []);
  return all.find((r) => r.id === id) || null;
}

export function saveStoredSplitRun(run: any): void {
  const key = getScopedKey(SPLIT_RUNS_KEY);
  const all = getItem<any[]>(key, []);
  const filtered = all.filter((r) => r.id !== run.id);
  setItem(key, [run, ...filtered]);
}

// ─── Starter Workspace Seeder ─────────────────────────────────
export function seedStarterSquadForUser(): MockSquad | null {
  const user = getCurrentUser();
  if (!user) return null;

  const squadId = `sqd_${Date.now()}`;
  const firstName = user.name.split(' ')[0] || 'Team';
  const starterSquad: MockSquad = {
    id: squadId,
    name: `${firstName}'s Core Workspace`,
    ownerId: user.id,
    currency: 'USD',
    createdAt: new Date().toISOString(),
    memberCount: 2,
    totalRevenue: 300000,
  };
  saveStoredSquad(starterSquad);

  const ownerMember: MockMembership = {
    id: `mem_${Date.now()}_1`,
    squadId,
    userId: user.id,
    memberName: user.name,
    role: 'owner',
    payoutReceiver: user.email,
    payoutReceiverType: 'EMAIL',
    payoutReceiverConfigured: true,
    payoutReceiverMasked: user.email,
    timezone: 'UTC',
    focusSessionsOptIn: true,
    streakDays: 14,
  };
  saveStoredMember(ownerMember);

  const teammate: MockMembership = {
    id: `mem_${Date.now()}_2`,
    squadId,
    userId: `usr_collab_${Date.now()}`,
    memberName: 'Jordan Blake',
    role: 'contributor',
    payoutReceiver: 'jordan.blake@example.com',
    payoutReceiverType: 'EMAIL',
    payoutReceiverConfigured: true,
    payoutReceiverMasked: 'j***@example.com',
    timezone: 'UTC',
    focusSessionsOptIn: true,
    streakDays: 8,
  };
  saveStoredMember(teammate);

  saveStoredRevenue({
    id: `rev_${Date.now()}`,
    squadId,
    amountMinor: 300000,
    currency: 'USD',
    source: 'stripe',
    description: 'Initial Team Revenue Pool',
    status: 'active',
    createdAt: new Date().toISOString(),
  });

  return starterSquad;
}
