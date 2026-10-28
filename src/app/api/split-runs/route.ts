// POST /api/split-runs – Create and execute a new split run
// GET /api/split-runs – List all split runs
import { NextRequest, NextResponse } from 'next/server';
import {
  mockSplitRuns,
  mockLedgerEvents,
  mockMemberships,
  mockSquads,
  mockRevenueEvents,
} from '@/lib/mock-data';
import { createLedgerEntry } from '@/lib/ledger';
import { calculateConsistencySplit } from '@/lib/consistency-streak';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      squadId = 'sqd_1',
      revenueEventId,
      poolMinor,
      currency = 'USD',
      ruleConfig = {
        consistency_percent: 5,
        streak_cap_days: 100,
        freeze_days_per_30: 2,
      },
      memberSplits = [],
    } = body;

    const pool = Math.round(Number(poolMinor) || 0);
    if (pool <= 0) {
      return NextResponse.json(
        { success: false, error: 'poolMinor must be a positive integer in cents' },
        { status: 400 }
      );
    }

    if (!Array.isArray(memberSplits) || memberSplits.length === 0) {
      return NextResponse.json(
        { success: false, error: 'memberSplits must be a non-empty array' },
        { status: 400 }
      );
    }

    // Prepare members for consistency split engine
    const activeMembers = memberSplits.filter((m: { percentage: number }) => m.percentage > 0);
    const splitMembers = activeMembers.length > 0 ? activeMembers : memberSplits;

    const consistencyResult = calculateConsistencySplit({
      poolMinor: pool,
      consistencyPercent: Number(ruleConfig.consistency_percent) || 0,
      streakCapDays: Number(ruleConfig.streak_cap_days) || 100,
      members: splitMembers.map((m: { memberId: string; percentage: number; streakDays?: number; name?: string }) => ({
        memberId: m.memberId,
        weight: Number(m.percentage) || 0,
        streakDays: Number(m.streakDays) || 0,
      })),
    });

    const runId = `run_${Date.now()}`;
    const newRun = {
      id: runId,
      squadId,
      revenueEventId: revenueEventId || `rev_${Date.now()}`,
      poolMinor: pool,
      currency,
      checksum: `chk_${Math.random().toString(36).substring(2, 10)}`,
      status: 'pending_approval' as const,
      ruleVersion: 1,
      lines: consistencyResult.lines.map((l) => {
        const mInfo = memberSplits.find((m: { memberId: string }) => m.memberId === l.memberId);
        return {
          id: `line_${Date.now()}_${l.memberId}`,
          runId,
          memberId: l.memberId,
          memberName: mInfo?.name || l.memberId,
          amountMinor: l.finalAmountMinor,
          workAmountMinor: l.workAmountMinor,
          consistencyAmountMinor: l.consistencyAmountMinor,
          streakDays: l.streakDays,
          weightBasis: { percentage: mInfo?.percentage || 0 },
          rationale: {
            contribution_summary: `${mInfo?.percentage || 0}% weight with ${l.streakDays}-day verified streak. Work: ${(l.workAmountMinor / 100).toFixed(2)} + Bonus: ${(l.consistencyAmountMinor / 100).toFixed(2)}`,
            evidence_count: 3,
            consistency_days: l.streakDays,
          },
        };
      }),
      createdAt: new Date().toISOString(),
    };

    // Prepend to mockSplitRuns
    mockSplitRuns.unshift(newRun);

    // Write audit ledger entry: split_created
    const prevHash =
      mockLedgerEvents.length > 0
        ? mockLedgerEvents[mockLedgerEvents.length - 1].hash
        : null;

    const ledgerEntry = createLedgerEntry(
      `led_${Date.now()}`,
      'split_created',
      newRun.id,
      pool,
      {
        squadId,
        linesCount: newRun.lines.length,
        workPoolMinor: consistencyResult.workPoolMinor,
        consistencyPoolMinor: consistencyResult.consistencyPoolMinor,
      },
      prevHash
    );
    mockLedgerEvents.push(ledgerEntry);

    // If consistency pool was allocated, log consistency_pool_allocated event
    if (consistencyResult.consistencyPoolMinor > 0) {
      const consistencyHash = mockLedgerEvents[mockLedgerEvents.length - 1].hash;
      const consistencyEntry = createLedgerEntry(
        `led_${Date.now() + 1}`,
        'consistency_pool_allocated',
        newRun.id,
        consistencyResult.consistencyPoolMinor,
        {
          squadId,
          consistency_percent: ruleConfig.consistency_percent,
          streak_cap_days: ruleConfig.streak_cap_days,
          eligible_members: consistencyResult.lines.filter((l) => l.consistencyAmountMinor > 0).length,
        },
        consistencyHash
      );
      mockLedgerEvents.push(consistencyEntry);
    }

    // If there was a revenue event associated, mark it
    if (revenueEventId) {
      const rev = mockRevenueEvents.find((r) => r.id === revenueEventId);
      if (rev) {
        rev.status = 'split_completed';
      }
    }

    return NextResponse.json({ success: true, data: newRun }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, data: mockSplitRuns });
}
