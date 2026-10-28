// Type definitions for MicroSplit AI

// ─── Enums ───────────────────────────────────────────────────
export type UserRole = 'admin' | 'contributor';
export type MemberRole = 'owner' | 'approver' | 'contributor' | 'viewer';
export type SplitRuleType = 'fixed_percentage' | 'weighted_points' | 'tiered' | 'milestone';
export type EvidenceKind = 'text' | 'pdf' | 'image' | 'audio' | 'csv' | 'link';
export type EvidenceStatus = 'pending' | 'extracted' | 'failed' | 'rejected';
export type ContributionStatus = 'pending' | 'confirmed' | 'edited' | 'rejected';
export type SplitRunStatus = 'draft' | 'pending_approval' | 'approved' | 'disputed' | 'paid';
export type ApprovalDecision = 'approved' | 'disputed' | 'adjusted';
export type PayoutBatchStatus = 'created' | 'processing' | 'success' | 'denied' | 'canceled';
export type PayoutItemStatus = 'created' | 'pending' | 'success' | 'failed' | 'unclaimed' | 'returned' | 'blocked';
export type LedgerEventType =
  | 'revenue_recorded'
  | 'split_created'
  | 'split_approved'
  | 'payout_created'
  | 'payout_item_status'
  | 'payout_completed'
  | 'freeze_granted'
  | 'consistency_pool_allocated';

// ─── AI Extraction Schema ────────────────────────────────────
export interface ExtractedContribution {
  member_name: string;
  member_email?: string;
  activity: string;
  quantity: number;
  unit: string;
  date?: string;
  period?: string;
  confidence: number; // 0-1
  source_reference: string;
  conflicts?: string[];
}

export interface AIExtractionResult {
  contributions: ExtractedContribution[];
  summary: string;
  warnings: string[];
}

// ─── Split Rule Configs ──────────────────────────────────────
export interface FixedPercentageConfig {
  splits: { memberId: string; percentage: number }[];
}

export interface WeightedPointsConfig {
  weights: {
    [activityType: string]: number; // e.g., "code_commit": 3, "design": 5
  };
}

export interface TieredConfig {
  tiers: {
    upTo: number; // minor units
    splits: { memberId: string; percentage: number }[];
  }[];
}

export interface MilestoneConfig {
  milestones: {
    name: string;
    bonus: number; // minor units
    assignedTo: string; // memberId
  }[];
  baseSplit: { memberId: string; percentage: number }[];
}

// ─── Split Line Rationale ────────────────────────────────────
export interface SplitRationale {
  rule_type: string;
  contribution_summary: string;
  weight_calculation: string;
  evidence_refs: string[];
}

// ─── API Response Types ──────────────────────────────────────
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Pipeline Status ─────────────────────────────────────────
export type PipelineStage = 'draft' | 'approved' | 'sent' | 'paid';

export interface PipelineStatus {
  stage: PipelineStage;
  stages: {
    name: string;
    status: 'completed' | 'active' | 'pending';
    timestamp?: string;
  }[];
}

// ─── Money formatting ────────────────────────────────────────
export interface MoneyAmount {
  amountMinor: number;
  currency: string;
}

// ─── Ledger verification ─────────────────────────────────────
export interface LedgerVerification {
  valid: boolean;
  totalEvents: number;
  checkedAt: string;
  brokenAt?: number; // index of first broken link
}

// ─── Dashboard Stats ─────────────────────────────────────────
export interface DashboardStats {
  totalSplitPaid: MoneyAmount;
  activeSquads: number;
  pendingReviews: number;
  recentPayouts: number;
}

// ─── Consistency Streak & Focus Sessions ──────────────────────
export interface ConsistencyRuleConfig {
  consistencyPercent: number; // default 5, max 10
  streakCapDays: number;      // default 100
  freezeDaysPer30: number;    // default 2
}

export interface FreezeGrant {
  id: string;
  squadId: string;
  memberId: string;
  approverId: string;
  date: string; // YYYY-MM-DD
  reason: string;
  createdAt: string;
}

export type FocusSessionSource = 'manual' | 'linked_evidence';

export interface FocusSession {
  id: string;
  memberId: string;
  taskId: string;
  startedAt: string;
  endedAt: string | null;
  source: FocusSessionSource;
  evidenceId?: string;
  status: 'active' | 'completed' | 'disputed' | 'approved';
  conflictFlag?: string;
  createdAt: string;
}

export interface SplitLineBreakdown {
  workAmountMinor: number;
  consistencyAmountMinor: number;
  streakDays: number;
  freezeDaysUsed: number;
}

