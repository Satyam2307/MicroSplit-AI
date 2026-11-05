import type { MockSquad, MockMembership, MockRevenueEvent } from './mock-data';

const SQUADS_KEY = 'microsplit_custom_squads';
const MEMBERS_KEY = 'microsplit_custom_members';
const REVENUE_KEY = 'microsplit_custom_revenue';

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

// ─── Squads ──────────────────────────────────────────────────
export function getStoredSquads(): MockSquad[] {
  return getItem<MockSquad[]>(SQUADS_KEY, []);
}

export function getStoredSquad(id: string): MockSquad | null {
  const squads = getStoredSquads();
  return squads.find((s) => s.id === id) || null;
}

export function saveStoredSquad(squad: MockSquad): void {
  const current = getStoredSquads();
  const filtered = current.filter((s) => s.id !== squad.id);
  setItem(SQUADS_KEY, [squad, ...filtered]);
}

export function deleteStoredSquad(id: string): void {
  const current = getStoredSquads();
  setItem(SQUADS_KEY, current.filter((s) => s.id !== id));
  
  // Clean up associated members and revenue
  const members = getItem<MockMembership[]>(MEMBERS_KEY, []);
  setItem(MEMBERS_KEY, members.filter((m) => m.squadId !== id));

  const revenue = getItem<MockRevenueEvent[]>(REVENUE_KEY, []);
  setItem(REVENUE_KEY, revenue.filter((r) => r.squadId !== id));
}

// ─── Members ─────────────────────────────────────────────────
export function getStoredMembers(squadId?: string): MockMembership[] {
  const all = getItem<MockMembership[]>(MEMBERS_KEY, []);
  if (!squadId) return all;
  return all.filter((m) => m.squadId === squadId);
}

export function saveStoredMember(member: MockMembership): void {
  const all = getItem<MockMembership[]>(MEMBERS_KEY, []);
  const filtered = all.filter((m) => m.id !== member.id && !(m.squadId === member.squadId && m.userId === member.userId));
  setItem(MEMBERS_KEY, [...filtered, member]);
}

export function deleteStoredMember(squadId: string, memberId: string): void {
  const all = getItem<MockMembership[]>(MEMBERS_KEY, []);
  setItem(
    MEMBERS_KEY,
    all.filter((m) => !(m.squadId === squadId && (m.id === memberId || m.userId === memberId)))
  );
}

// ─── Revenue Events ──────────────────────────────────────────
export function getStoredRevenue(squadId?: string): MockRevenueEvent[] {
  const all = getItem<MockRevenueEvent[]>(REVENUE_KEY, []);
  if (!squadId) return all;
  return all.filter((r) => r.squadId === squadId);
}

export function saveStoredRevenue(event: MockRevenueEvent): void {
  const all = getItem<MockRevenueEvent[]>(REVENUE_KEY, []);
  const filtered = all.filter((r) => r.id !== event.id);
  setItem(REVENUE_KEY, [event, ...filtered]);
}

