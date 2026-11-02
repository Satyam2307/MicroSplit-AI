export interface SplitLineRationale {
  rule_type?: string;
  contribution_summary: string;
  weight_calculation?: string;
  evidence_refs?: string[];
  evidence_count?: number;
  consistency_days?: number;
}

export interface SplitRunLineDTO {
  id: string;
  runId: string;
  memberId: string;
  membershipId: string | null;
  memberName: string;
  weight: number;
  amountMinor: number;
  workAmountMinor: number;
  consistencyAmountMinor: number;
  streakDays: number;
  freezeDaysUsed: number;
  rationale: SplitLineRationale;
  weightBasis: { percentage: number };
}

export interface SplitRunDTO {
  id: string;
  revenueEventId: string;
  squadId: string;
  currency: string;
  ruleVersion: number;
  calculationVersion: number;
  poolMinor: number;
  checksum: string;
  status: string;
  createdAt: string;
  lines: SplitRunLineDTO[];
  isConserved: boolean;
}

export interface SplitRunApprovalDTO {
  id: string;
  runId: string;
  approverId: string;
  approverName: string;
  decision: string;
  note: string | null;
  createdAt: string;
}

export interface SplitRunEvidenceDTO {
  id: string;
  squadId: string;
  kind: string;
  fileName: string | null;
  status: string;
  createdAt: string;
}
