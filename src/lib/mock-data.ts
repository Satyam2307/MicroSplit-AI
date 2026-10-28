// In-memory mock data store for demo / development
// Simulates the Prisma database layer with realistic seed data

import { v4 as uuidv4 } from 'uuid';
import { createLedgerEntry, type LedgerEntry } from './ledger';

// ─── Mock Users ──────────────────────────────────────────────
export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  createdAt?: string;
}

export const mockUsers: MockUser[] = [
  { id: 'usr_1', name: 'Alex Rivera', email: 'alex@microsplit.demo', avatar: '/avatars/alex.svg', role: 'admin' },
  { id: 'usr_2', name: 'Maya Chen', email: 'maya@microsplit.demo', avatar: '/avatars/maya.svg', role: 'contributor' },
  { id: 'usr_3', name: 'Jordan Kim', email: 'jordan@microsplit.demo', avatar: '/avatars/jordan.svg', role: 'contributor' },
  { id: 'usr_4', name: 'Sam Patel', email: 'sam@microsplit.demo', avatar: '/avatars/sam.svg', role: 'contributor' },
  { id: 'usr_5', name: 'Casey Brooks', email: 'casey@microsplit.demo', avatar: '/avatars/casey.svg', role: 'contributor' },
];

// ─── Mock Squads ─────────────────────────────────────────────
export interface MockSquad {
  id: string;
  name: string;
  ownerId: string;
  currency: string;
  createdAt: string;
  memberCount: number;
  totalRevenue: number; // minor units
}

export const mockSquads: MockSquad[] = [
  {
    id: 'sqd_1',
    name: 'Vortex Design Studio',
    ownerId: 'usr_1',
    currency: 'USD',
    createdAt: '2024-09-15T10:00:00Z',
    memberCount: 4,
    totalRevenue: 850000, // $8,500
  },
  {
    id: 'sqd_2',
    name: 'OSS Contributors Fund',
    ownerId: 'usr_2',
    currency: 'USD',
    createdAt: '2024-10-01T14:30:00Z',
    memberCount: 5,
    totalRevenue: 1200000, // $12,000
  },
  {
    id: 'sqd_3',
    name: 'DevRelay Agency',
    ownerId: 'usr_1',
    currency: 'USD',
    createdAt: '2024-10-20T09:00:00Z',
    memberCount: 3,
    totalRevenue: 450000, // $4,500
  },
];

// ─── Mock Memberships ────────────────────────────────────────
export interface MockMembership {
  id: string;
  squadId: string;
  userId: string;
  memberName?: string;
  role: string;
  payoutReceiver: string;
  payoutReceiverType: string;
  timezone: string;
  focusSessionsOptIn: boolean;
  streakDays?: number;
}

export const mockMemberships: MockMembership[] = [
  { id: 'mem_1', squadId: 'sqd_1', userId: 'usr_1', memberName: 'Alex Rivera', role: 'owner', payoutReceiver: 'alex@paypal.demo', payoutReceiverType: 'EMAIL', timezone: 'America/New_York', focusSessionsOptIn: true, streakDays: 45 },
  { id: 'mem_2', squadId: 'sqd_1', userId: 'usr_2', memberName: 'Maya Chen', role: 'contributor', payoutReceiver: 'maya@paypal.demo', payoutReceiverType: 'EMAIL', timezone: 'America/Los_Angeles', focusSessionsOptIn: true, streakDays: 88 },
  { id: 'mem_3', squadId: 'sqd_1', userId: 'usr_3', memberName: 'Jordan Kim', role: 'approver', payoutReceiver: 'jordan@paypal.demo', payoutReceiverType: 'EMAIL', timezone: 'Europe/London', focusSessionsOptIn: false, streakDays: 32 },
  { id: 'mem_4', squadId: 'sqd_1', userId: 'usr_4', memberName: 'Sam Patel', role: 'contributor', payoutReceiver: 'sam@paypal.demo', payoutReceiverType: 'EMAIL', timezone: 'Asia/Kolkata', focusSessionsOptIn: false, streakDays: 0 },
  { id: 'mem_5', squadId: 'sqd_2', userId: 'usr_1', memberName: 'Alex Rivera', role: 'contributor', payoutReceiver: 'alex@paypal.demo', payoutReceiverType: 'EMAIL', timezone: 'America/New_York', focusSessionsOptIn: true, streakDays: 20 },
  { id: 'mem_6', squadId: 'sqd_2', userId: 'usr_2', memberName: 'Maya Chen', role: 'owner', payoutReceiver: 'maya@paypal.demo', payoutReceiverType: 'EMAIL', timezone: 'America/Los_Angeles', focusSessionsOptIn: true, streakDays: 60 },
  { id: 'mem_7', squadId: 'sqd_2', userId: 'usr_3', memberName: 'Jordan Kim', role: 'contributor', payoutReceiver: 'jordan@paypal.demo', payoutReceiverType: 'EMAIL', timezone: 'Europe/London', focusSessionsOptIn: false, streakDays: 15 },
  { id: 'mem_8', squadId: 'sqd_2', userId: 'usr_4', memberName: 'Sam Patel', role: 'contributor', payoutReceiver: 'sam@paypal.demo', payoutReceiverType: 'EMAIL', timezone: 'Asia/Kolkata', focusSessionsOptIn: false, streakDays: 0 },
  { id: 'mem_9', squadId: 'sqd_2', userId: 'usr_5', memberName: 'Casey Brooks', role: 'approver', payoutReceiver: 'casey@paypal.demo', payoutReceiverType: 'EMAIL', timezone: 'UTC', focusSessionsOptIn: false, streakDays: 5 },
];

// ─── Mock Revenue Events ─────────────────────────────────────
export interface MockRevenueEvent {
  id: string;
  squadId: string;
  amountMinor: number;
  currency: string;
  source: string;
  description: string;
  status: string;
  createdAt: string;
}

export const mockRevenueEvents: MockRevenueEvent[] = [
  { id: 'rev_1', squadId: 'sqd_1', amountMinor: 500000, currency: 'USD', source: 'client_payment', description: 'Acme Corp – Brand redesign milestone 2', status: 'active', createdAt: '2024-11-01T10:00:00Z' },
  { id: 'rev_2', squadId: 'sqd_1', amountMinor: 350000, currency: 'USD', source: 'client_payment', description: 'TechFlow – Dashboard UI kit', status: 'active', createdAt: '2024-11-15T14:00:00Z' },
  { id: 'rev_3', squadId: 'sqd_2', amountMinor: 1200000, currency: 'USD', source: 'sponsor_grant', description: 'GitHub Sponsors – Q4 2024', status: 'active', createdAt: '2024-12-01T09:00:00Z' },
  { id: 'rev_4', squadId: 'sqd_3', amountMinor: 450000, currency: 'USD', source: 'client_payment', description: 'StartupXYZ – MVP development', status: 'active', createdAt: '2024-12-10T16:00:00Z' },
];

// ─── Mock Evidence ───────────────────────────────────────────
export interface MockEvidence {
  id: string;
  squadId: string;
  uploaderId: string;
  kind: string;
  fileName: string;
  fileUrl: string;
  sha256: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
  createdAt: string;
}

export const mockEvidence: MockEvidence[] = [
  { id: 'evi_1', squadId: 'sqd_1', uploaderId: 'usr_2', kind: 'link', fileName: 'github-commits.link', fileUrl: 'https://github.com/vortex/brand-redesign/commits', sha256: 'a1b2c3d4', mimeType: 'text/uri-list', sizeBytes: 256, status: 'extracted', createdAt: '2024-11-02T08:00:00Z' },
  { id: 'evi_2', squadId: 'sqd_1', uploaderId: 'usr_3', kind: 'pdf', fileName: 'design-specs-v2.pdf', fileUrl: '/evidence/design-specs-v2.pdf', sha256: 'e5f6a7b8', mimeType: 'application/pdf', sizeBytes: 2048000, status: 'extracted', createdAt: '2024-11-03T11:30:00Z' },
  { id: 'evi_3', squadId: 'sqd_1', uploaderId: 'usr_4', kind: 'csv', fileName: 'hours-november.csv', fileUrl: '/evidence/hours-november.csv', sha256: 'c9d0e1f2', mimeType: 'text/csv', sizeBytes: 1024, status: 'extracted', createdAt: '2024-11-05T09:00:00Z' },
  { id: 'evi_4', squadId: 'sqd_1', uploaderId: 'usr_1', kind: 'image', fileName: 'screenshot-review.png', fileUrl: '/evidence/screenshot-review.png', sha256: 'g3h4i5j6', mimeType: 'image/png', sizeBytes: 512000, status: 'extracted', createdAt: '2024-11-06T15:00:00Z' },
  { id: 'evi_5', squadId: 'sqd_2', uploaderId: 'usr_3', kind: 'link', fileName: 'github-prs.link', fileUrl: 'https://github.com/oss-fund/core/pulls?q=is%3Amerged', sha256: 'k7l8m9n0', mimeType: 'text/uri-list', sizeBytes: 128, status: 'extracted', createdAt: '2024-12-02T10:00:00Z' },
  { id: 'evi_6', squadId: 'sqd_1', uploaderId: 'usr_2', kind: 'pdf', fileName: 'invoice-duplicate.pdf', fileUrl: '/evidence/invoice-dup.pdf', sha256: 'a1b2c3d4', mimeType: 'application/pdf', sizeBytes: 1024000, status: 'extracted', createdAt: '2024-11-07T12:00:00Z' },
];

// ─── Mock Contributions ──────────────────────────────────────
export interface MockContribution {
  id: string;
  evidenceId: string;
  memberId: string;
  memberName: string;
  activity: string;
  quantity: number;
  unit: string;
  period: string;
  confidence: number;
  flags: string[];
  status: string;
  createdAt?: string;
}

export const mockContributions: MockContribution[] = [
  { id: 'ctr_1', evidenceId: 'evi_1', memberId: 'usr_2', memberName: 'Maya Chen', activity: 'code_commit', quantity: 47, unit: 'commits', period: '2024-11', confidence: 0.95, flags: [], status: 'confirmed' },
  { id: 'ctr_2', evidenceId: 'evi_2', memberId: 'usr_3', memberName: 'Jordan Kim', activity: 'design', quantity: 12, unit: 'screens', period: '2024-11', confidence: 0.88, flags: [], status: 'confirmed' },
  { id: 'ctr_3', evidenceId: 'evi_3', memberId: 'usr_4', memberName: 'Sam Patel', activity: 'hours', quantity: 32, unit: 'hours', period: '2024-11', confidence: 0.92, flags: [], status: 'confirmed' },
  { id: 'ctr_4', evidenceId: 'evi_4', memberId: 'usr_1', memberName: 'Alex Rivera', activity: 'review', quantity: 8, unit: 'tasks', period: '2024-11', confidence: 0.97, flags: [], status: 'confirmed' },
  { id: 'ctr_5', evidenceId: 'evi_5', memberId: 'usr_3', memberName: 'Jordan Kim', activity: 'code_commit', quantity: 89, unit: 'commits', period: '2024-12', confidence: 0.93, flags: [], status: 'confirmed' },
  { id: 'ctr_6', evidenceId: 'evi_6', memberId: 'usr_2', memberName: 'Maya Chen', activity: 'hours', quantity: 32, unit: 'hours', period: '2024-11', confidence: 0.45, flags: ['duplicate_hash: sha256 matches evi_1', 'overlapping_period: Nov 2024 already claimed'], status: 'pending' },
];

// ─── Mock Split Runs ─────────────────────────────────────────
export interface MockSplitRun {
  id: string;
  revenueEventId: string;
  ruleVersion: number;
  poolMinor: number;
  checksum: string;
  status: string;
  createdAt: string;
  lines: MockSplitLine[];
  squadId?: string;
  currency?: string;
}

export interface MockSplitLine {
  id: string;
  runId: string;
  memberId: string;
  memberName: string;
  weight?: number;
  amountMinor: number;
  workAmountMinor: number;
  consistencyAmountMinor: number;
  streakDays: number;
  freezeDaysUsed?: number;
  rationale: {
    rule_type?: string;
    contribution_summary: string;
    weight_calculation?: string;
    evidence_refs?: string[];
    evidence_count?: number;
    consistency_days?: number;
  };
  weightBasis?: { percentage: number };
}

export const mockSplitRuns: MockSplitRun[] = [
  {
    id: 'run_1',
    revenueEventId: 'rev_1',
    ruleVersion: 1,
    poolMinor: 500000,
    checksum: 'a3f8c2e1',
    status: 'approved',
    createdAt: '2024-11-10T10:00:00Z',
    lines: [
      {
        id: 'ln_1', runId: 'run_1', memberId: 'usr_1', memberName: 'Alex Rivera',
        weight: 8, amountMinor: 65000, workAmountMinor: 61750, consistencyAmountMinor: 3250, streakDays: 45, freezeDaysUsed: 1,
        rationale: { rule_type: 'weighted_points', contribution_summary: 'Work 617.50 + Consistency 32.50 = 650.00 (45d streak, 1 freeze day)', weight_calculation: 'Weight 8 / 99 total = 8.08%', evidence_refs: ['evi_4'] },
      },
      {
        id: 'ln_2', runId: 'run_1', memberId: 'usr_2', memberName: 'Maya Chen',
        weight: 47, amountMinor: 237374, workAmountMinor: 225505, consistencyAmountMinor: 11869, streakDays: 88, freezeDaysUsed: 0,
        rationale: { rule_type: 'weighted_points', contribution_summary: 'Work 2,255.05 + Consistency 118.69 = 2,373.74 (88d streak)', weight_calculation: 'Weight 47 / 99 total = 47.47%', evidence_refs: ['evi_1'] },
      },
      {
        id: 'ln_3', runId: 'run_1', memberId: 'usr_3', memberName: 'Jordan Kim',
        weight: 12, amountMinor: 60606, workAmountMinor: 57576, consistencyAmountMinor: 3030, streakDays: 32, freezeDaysUsed: 0,
        rationale: { rule_type: 'weighted_points', contribution_summary: 'Work 575.76 + Consistency 30.30 = 606.06 (32d streak)', weight_calculation: 'Weight 12 / 99 total = 12.12%', evidence_refs: ['evi_2'] },
      },
      {
        id: 'ln_4', runId: 'run_1', memberId: 'usr_4', memberName: 'Sam Patel',
        weight: 32, amountMinor: 137020, workAmountMinor: 130169, consistencyAmountMinor: 6851, streakDays: 60, freezeDaysUsed: 2,
        rationale: { rule_type: 'weighted_points', contribution_summary: 'Work 1,301.69 + Consistency 68.51 = 1,370.20 (60d streak, 2 freeze days)', weight_calculation: 'Weight 32 / 99 total = 32.32%', evidence_refs: ['evi_3'] },
      },
    ],
  },
  {
    id: 'run_2',
    revenueEventId: 'rev_2',
    ruleVersion: 1,
    poolMinor: 350000,
    checksum: 'b4e9d3f2',
    status: 'pending_approval',
    createdAt: '2024-11-16T11:00:00Z',
    lines: [
      {
        id: 'ln_5', runId: 'run_2', memberId: 'usr_1', memberName: 'Alex Rivera',
        weight: 25, amountMinor: 87500, workAmountMinor: 87500, consistencyAmountMinor: 0, streakDays: 45, freezeDaysUsed: 0,
        rationale: { rule_type: 'fixed_percentage', contribution_summary: 'Work 875.00 + Consistency 0.00 = 875.00', weight_calculation: '25% of $3,500.00', evidence_refs: [] },
      },
      {
        id: 'ln_6', runId: 'run_2', memberId: 'usr_2', memberName: 'Maya Chen',
        weight: 35, amountMinor: 122500, workAmountMinor: 122500, consistencyAmountMinor: 0, streakDays: 88, freezeDaysUsed: 0,
        rationale: { rule_type: 'fixed_percentage', contribution_summary: 'Work 1,225.00 + Consistency 0.00 = 1,225.00', weight_calculation: '35% of $3,500.00', evidence_refs: [] },
      },
      {
        id: 'ln_7', runId: 'run_2', memberId: 'usr_3', memberName: 'Jordan Kim',
        weight: 25, amountMinor: 87500, workAmountMinor: 87500, consistencyAmountMinor: 0, streakDays: 32, freezeDaysUsed: 0,
        rationale: { rule_type: 'fixed_percentage', contribution_summary: 'Work 875.00 + Consistency 0.00 = 875.00', weight_calculation: '25% of $3,500.00', evidence_refs: [] },
      },
      {
        id: 'ln_8', runId: 'run_2', memberId: 'usr_4', memberName: 'Sam Patel',
        weight: 15, amountMinor: 52500, workAmountMinor: 52500, consistencyAmountMinor: 0, streakDays: 60, freezeDaysUsed: 0,
        rationale: { rule_type: 'fixed_percentage', contribution_summary: 'Work 525.00 + Consistency 0.00 = 525.00', weight_calculation: '15% of $3,500.00', evidence_refs: [] },
      },
    ],
  },
  {
    id: 'run_3',
    revenueEventId: 'rev_4',
    ruleVersion: 2,
    poolMinor: 100000, // $1,000.00 USD Canonical Example
    checksum: 'c5f1a7b9',
    status: 'approved',
    createdAt: '2024-12-15T10:00:00Z',
    lines: [
      {
        id: 'ln_9', runId: 'run_3', memberId: 'usr_2', memberName: 'Maya Chen',
        weight: 1, amountMinor: 52500, workAmountMinor: 47500, consistencyAmountMinor: 5000, streakDays: 100, freezeDaysUsed: 1,
        rationale: {
          rule_type: 'consistency_bonus',
          contribution_summary: 'Work 475.00 + Consistency 50.00 = 525.00 (100d streak, capped, 1 freeze day)',
          weight_calculation: 'Equal work share ($475.00) + 100% of consistency pool ($50.00)',
          evidence_refs: ['evi_1'],
        },
      },
      {
        id: 'ln_10', runId: 'run_3', memberId: 'usr_4', memberName: 'Sam Patel',
        weight: 1, amountMinor: 47500, workAmountMinor: 47500, consistencyAmountMinor: 0, streakDays: 0, freezeDaysUsed: 0,
        rationale: {
          rule_type: 'consistency_bonus',
          contribution_summary: 'Work 475.00 + Consistency 0.00 = 475.00 (0d streak)',
          weight_calculation: 'Equal work share ($475.00) + 0% consistency share ($0.00)',
          evidence_refs: ['evi_3'],
        },
      },
    ],
  },
];

// ─── Mock Payout Batches ─────────────────────────────────────
export interface MockPayoutBatch {
  id: string;
  runId: string;
  senderBatchId: string;
  paypalBatchId: string;
  status: string;
  totalMinor: number;
  createdAt: string;
  items: MockPayoutItem[];
}

export interface MockPayoutItem {
  id: string;
  batchId: string;
  lineId: string;
  senderItemId: string;
  paypalItemId: string;
  amountMinor: number;
  recipientName: string;
  recipientEmail: string;
  status: string;
  failureReason: string | null;
}

export const mockPayoutBatches: MockPayoutBatch[] = [
  {
    id: 'bat_1',
    runId: 'run_1',
    senderBatchId: 'run_1_20241110T120000Z',
    paypalBatchId: 'PAYPAL_BATCH_5X8K9M2',
    status: 'success',
    totalMinor: 500000,
    createdAt: '2024-11-10T12:00:00Z',
    items: [
      { id: 'pi_1', batchId: 'bat_1', lineId: 'ln_1', senderItemId: 'run_1_usr_1', paypalItemId: 'PP_ITEM_001', amountMinor: 65000, recipientName: 'Alex Rivera', recipientEmail: 'alex@paypal.demo', status: 'success', failureReason: null },
      { id: 'pi_2', batchId: 'bat_1', lineId: 'ln_2', senderItemId: 'run_1_usr_2', paypalItemId: 'PP_ITEM_002', amountMinor: 237374, recipientName: 'Maya Chen', recipientEmail: 'maya@paypal.demo', status: 'success', failureReason: null },
      { id: 'pi_3', batchId: 'bat_1', lineId: 'ln_3', senderItemId: 'run_1_usr_3', paypalItemId: 'PP_ITEM_003', amountMinor: 60606, recipientName: 'Jordan Kim', recipientEmail: 'jordan@paypal.demo', status: 'failed', failureReason: 'RECEIVER_UNREGISTERED' },
      { id: 'pi_4', batchId: 'bat_1', lineId: 'ln_4', senderItemId: 'run_1_usr_4', paypalItemId: 'PP_ITEM_004', amountMinor: 137020, recipientName: 'Sam Patel', recipientEmail: 'sam@paypal.demo', status: 'success', failureReason: null },
    ],
  },
];


// ─── Mock Ledger Events ──────────────────────────────────────
function buildMockLedger(): LedgerEntry[] {
  const events: LedgerEntry[] = [];
  let prevHash: string | null = null;

  const entries: { type: string; refId: string; amount: number; payload: Record<string, unknown> }[] = [
    { type: 'revenue_recorded', refId: 'rev_1', amount: 500000, payload: { squad: 'Vortex Design Studio', source: 'Acme Corp payment' } },
    { type: 'split_created', refId: 'run_1', amount: 500000, payload: { members: 4, rule: 'weighted_points' } },
    { type: 'split_approved', refId: 'run_1', amount: 500000, payload: { approver: 'Jordan Kim', decision: 'approved' } },
    { type: 'payout_created', refId: 'bat_1', amount: 500000, payload: { batch: 'run_1_20241110T120000Z', items: 4 } },
    { type: 'payout_item_status', refId: 'pi_1', amount: 65000, payload: { recipient: 'Alex Rivera', status: 'success' } },
    { type: 'payout_item_status', refId: 'pi_2', amount: 237374, payload: { recipient: 'Maya Chen', status: 'success' } },
    { type: 'payout_item_status', refId: 'pi_3', amount: 60606, payload: { recipient: 'Jordan Kim', status: 'failed', reason: 'RECEIVER_UNREGISTERED' } },
    { type: 'payout_item_status', refId: 'pi_4', amount: 137020, payload: { recipient: 'Sam Patel', status: 'success' } },
    { type: 'revenue_recorded', refId: 'rev_2', amount: 350000, payload: { squad: 'Vortex Design Studio', source: 'TechFlow UI kit' } },
    { type: 'split_created', refId: 'run_2', amount: 350000, payload: { members: 4, rule: 'fixed_percentage' } },
    { type: 'revenue_recorded', refId: 'rev_3', amount: 1200000, payload: { squad: 'OSS Contributors Fund', source: 'GitHub Sponsors Q4' } },
    { type: 'freeze_granted', refId: 'frz_1', amount: 0, payload: { squadId: 'sqd_1', memberId: 'usr_2', memberName: 'Maya Chen', approver: 'Jordan Kim', date: '2024-11-04', reason: 'Medical absence, authorized under squad freeze policy' } },
    { type: 'consistency_pool_allocated', refId: 'run_3', amount: 5000, payload: { squadId: 'sqd_1', consistencyPercent: 5, consistencyPoolMinor: 5000, workPoolMinor: 95000, streakCapDays: 100, recipients: [{ memberId: 'usr_2', streakDays: 100, amountMinor: 5000 }, { memberId: 'usr_4', streakDays: 0, amountMinor: 0 }] } },
  ];

  entries.forEach((e, idx) => {
    const entry = createLedgerEntry(
      `led_${idx + 1}`,
      e.type as LedgerEntry['type'],
      e.refId,
      e.amount,
      e.payload,
      prevHash
    );
    events.push(entry);
    prevHash = entry.hash;
  });

  return events;
}

export const mockLedgerEvents = buildMockLedger();

// ─── Mock Freeze Grants ──────────────────────────────────────
export interface MockFreezeGrant {
  id: string;
  squadId: string;
  memberId: string;
  memberName: string;
  approverId: string;
  approverName: string;
  date: string; // YYYY-MM-DD
  reason: string;
  createdAt: string;
}

export const mockFreezeGrants: MockFreezeGrant[] = [
  {
    id: 'frz_1',
    squadId: 'sqd_1',
    memberId: 'usr_2',
    memberName: 'Maya Chen',
    approverId: 'usr_3',
    approverName: 'Jordan Kim',
    date: '2024-11-04',
    reason: 'Medical recovery day covered by squad freeze allowance',
    createdAt: '2024-11-04T09:00:00Z',
  },
  {
    id: 'frz_2',
    squadId: 'sqd_1',
    memberId: 'usr_1',
    memberName: 'Alex Rivera',
    approverId: 'usr_3',
    approverName: 'Jordan Kim',
    date: '2024-10-18',
    reason: 'Conference travel for design workshop',
    createdAt: '2024-10-18T08:00:00Z',
  },
];

// ─── Mock Focus Sessions (Opt-in only, minimal metadata) ─────
export interface MockFocusSession {
  id: string;
  memberId: string;
  memberName: string;
  taskId: string;
  taskTitle: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes?: number;
  source: 'manual' | 'linked_evidence';
  evidenceId?: string;
  status: 'active' | 'completed' | 'disputed' | 'approved';
  conflictFlag?: string;
  createdAt: string;
}

export const mockFocusSessions: MockFocusSession[] = [
  {
    id: 'foc_1',
    memberId: 'usr_2',
    memberName: 'Maya Chen',
    taskId: 'TASK-104',
    taskTitle: 'Refactor split engine rounding logic',
    startedAt: '2024-11-12T09:00:00Z',
    endedAt: '2024-11-12T11:45:00Z',
    durationMinutes: 165,
    source: 'linked_evidence',
    evidenceId: 'evi_1',
    status: 'approved',
    createdAt: '2024-11-12T09:00:00Z',
  },
  {
    id: 'foc_2',
    memberId: 'usr_1',
    memberName: 'Alex Rivera',
    taskId: 'TASK-105',
    taskTitle: 'Design System palette audit',
    startedAt: '2024-11-13T13:00:00Z',
    endedAt: '2024-11-13T15:30:00Z',
    durationMinutes: 150,
    source: 'manual',
    status: 'approved',
    createdAt: '2024-11-13T13:00:00Z',
  },
  {
    id: 'foc_3',
    memberId: 'usr_2',
    memberName: 'Maya Chen',
    taskId: 'TASK-109',
    taskTitle: 'Excessive time tracking anomaly (>16h test)',
    startedAt: '2024-11-14T01:00:00Z',
    endedAt: '2024-11-14T19:30:00Z',
    durationMinutes: 1110, // 18.5 hours
    source: 'manual',
    status: 'disputed',
    conflictFlag: 'implausible_duration: Session duration (18.5h) exceeds 16-hour daily threshold',
    createdAt: '2024-11-14T01:00:00Z',
  },
];

// ─── Mock Approvals ──────────────────────────────────────────
export interface MockApproval {
  id: string;
  runId: string;
  approverId: string;
  approverName: string;
  decision: string;
  note: string;
  createdAt: string;
}

export const mockApprovals: MockApproval[] = [
  { id: 'apr_1', runId: 'run_1', approverId: 'usr_3', approverName: 'Jordan Kim', decision: 'approved', note: 'All contributions verified against GitHub and time logs.', createdAt: '2024-11-10T11:00:00Z' },
  { id: 'apr_2', runId: 'run_3', approverId: 'usr_3', approverName: 'Jordan Kim', decision: 'approved', note: 'Consistency bonus confirmed: Maya (100d capped streak = $50.00), Sam (0d streak = $0.00). Work share = $475.00 each.', createdAt: '2024-12-15T10:30:00Z' },
];

// ─── Dashboard Stats ─────────────────────────────────────────
export const mockDashboardStats = {
  totalSplitPaid: { amountMinor: 2550000, currency: 'USD' },
  activeSquads: 3,
  pendingReviews: 2,
  recentPayouts: 1,
  monthlyGrowth: 23.5,
  totalMembers: 12,
  evidenceProcessed: 47,
  avgConfidence: 0.91,
};
