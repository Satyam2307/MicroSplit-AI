'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChevronDown,
  FileText,
  Shield,
  Flame,
} from 'lucide-react';
import {
  Reveal,
  Card,
  MoneyChip,
  StatusChip,
  WeightBar,
  ProgressPipeline,
} from '@/components/ui';
import type {
  SplitRunApprovalDTO,
  SplitRunDTO,
  SplitRunEvidenceDTO,
} from '@/lib/split-run-types';
import { formatMoney } from '@/lib/money';

const statusPipeline: Record<
  string,
  { label: string; status: 'completed' | 'active' | 'pending' }[]
> = {
  draft: [
    { label: 'Draft', status: 'active' },
    { label: 'Approved', status: 'pending' },
    { label: 'Sent', status: 'pending' },
    { label: 'Paid', status: 'pending' },
  ],
  pending_approval: [
    { label: 'Draft', status: 'completed' },
    { label: 'Approved', status: 'active' },
    { label: 'Sent', status: 'pending' },
    { label: 'Paid', status: 'pending' },
  ],
  approved: [
    { label: 'Draft', status: 'completed' },
    { label: 'Approved', status: 'completed' },
    { label: 'Sent', status: 'active' },
    { label: 'Paid', status: 'pending' },
  ],
  paid: [
    { label: 'Draft', status: 'completed' },
    { label: 'Approved', status: 'completed' },
    { label: 'Sent', status: 'completed' },
    { label: 'Paid', status: 'completed' },
  ],
  disputed: [
    { label: 'Draft', status: 'completed' },
    { label: 'Disputed', status: 'active' },
    { label: 'Sent', status: 'pending' },
    { label: 'Paid', status: 'pending' },
  ],
};

function RunDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [run, setRun] = useState<SplitRunDTO | null>(null);
  const [approvals, setApprovals] = useState<SplitRunApprovalDTO[]>([]);
  const [evidence, setEvidence] = useState<SplitRunEvidenceDTO[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedLine, setExpandedLine] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadRun() {
      try {
        const response = await fetch(`/api/split-runs/${encodeURIComponent(id)}`);
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load split run');
        }
        if (cancelled) return;
        setRun(result.data);
        setApprovals(result.data.approvals ?? []);
        setEvidence(result.data.evidence ?? []);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load split run');
        }
      }
    }

    void loadRun();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const pipeline = run ? statusPipeline[run.status] || statusPipeline.draft : statusPipeline.draft;

  if (loadError || !run) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
        <Card elevated padding="lg" className="max-w-lg w-full text-center">
          <p className="font-semibold" style={{ color: 'var(--text)' }}>
            {loadError || 'Loading split run...'}
          </p>
          {loadError && (
            <Link href="/squads" className="btn-secondary mt-4 inline-flex">
              Back to squads
            </Link>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back link */}
        <Link
          href="/squads"
          className="inline-flex items-center gap-2 text-sm font-medium mb-6 transition-colors"
          style={{ color: 'var(--muted)' }}
        >
          <ArrowLeft size={16} />
          Back to squads
        </Link>

        {/* Header */}
        <Reveal>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
                  Split Run
                </h1>
                <StatusChip
                  label={run.status.replace('_', ' ')}
                  variant={
                    run.status === 'approved' ? 'mint' :
                    run.status === 'pending_approval' ? 'amber' :
                    run.status === 'disputed' ? 'rose' :
                    run.status === 'paid' ? 'mint' : 'muted'
                  }
                />
              </div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Run {run.id} &bull; Rule v{run.ruleVersion} &bull; Calculation #{run.calculationVersion} &bull;{' '}
                {new Date(run.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div
              className="text-xs flex items-center gap-2"
              style={{ color: 'var(--muted)' }}
            >
              <Shield size={14} />
              Approval and payout actions will be enabled in a later stage.
            </div>
          </div>
        </Reveal>

        {/* Pipeline */}
        <Reveal delay={0.1}>
          <Card padding="md" className="mb-6">
            <ProgressPipeline stages={pipeline} />
          </Card>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Split Lines */}
          <div className="lg:col-span-2">
            <Reveal delay={0.15}>
              <Card padding="none">
                <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                    Split Lines
                  </h2>
                  <MoneyChip amount={formatMoney(run.poolMinor)} status="default" />
                </div>

                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {run.lines.map((line) => {
                    const isExpanded = expandedLine === line.id;
                    const pct = (line.amountMinor / run.poolMinor) * 100;
                    // Find related evidence
                    const evidenceRefs = line.rationale.evidence_refs || [];
                    const relatedEvidence = evidence.filter((e) =>
                      evidenceRefs.includes(e.id)
                    );

                    return (
                      <div key={line.id}>
                        {/* Main row */}
                        <div
                          className="px-6 py-4 cursor-pointer hover:bg-[var(--accent-subtle)] transition-colors"
                          onClick={() => setExpandedLine(isExpanded ? null : line.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                              style={{
                                background: 'var(--accent-subtle)',
                                color: 'var(--accent)',
                              }}
                            >
                              {line.memberName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                                    {line.memberName}
                                  </span>
                                  {line.streakDays !== undefined && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)]">
                                      <Flame size={12} />
                                      {line.streakDays}d streak
                                    </span>
                                  )}
                                  {Boolean(line.freezeDaysUsed && line.freezeDaysUsed > 0) && (
                                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-[var(--background)] text-[var(--accent)]">
                                      {line.freezeDaysUsed} freeze
                                    </span>
                                  )}
                                </div>
                                <MoneyChip
                                  amount={formatMoney(line.amountMinor)}
                                  status="default"
                                  size="sm"
                                />
                              </div>
                              {line.workAmountMinor !== undefined && line.consistencyAmountMinor !== undefined && (
                                <p className="text-xs font-mono mb-2" style={{ color: 'var(--muted)' }}>
                                  Work {formatMoney(line.workAmountMinor).replace('$', '')} + Consistency {formatMoney(line.consistencyAmountMinor).replace('$', '')} = {formatMoney(line.amountMinor).replace('$', '')}
                                </p>
                              )}
                              <WeightBar percentage={pct} />
                            </div>
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              className="ml-2"
                            >
                              <ChevronDown size={16} style={{ color: 'var(--muted)' }} />
                            </motion.div>
                          </div>
                        </div>

                        {/* Expanded: why panel */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div
                                className="px-6 py-4 ml-14 space-y-3"
                                style={{
                                  background: 'color-mix(in srgb, var(--accent) 2%, transparent)',
                                  borderTop: '1px solid var(--border)',
                                }}
                              >
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-light)' }}>
                                    Rule Type
                                  </p>
                                  <StatusChip label={(line.rationale.rule_type || 'fixed_percentage').replace('_', ' ')} variant="violet" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-light)' }}>
                                    Contribution Summary
                                  </p>
                                  <p className="text-sm" style={{ color: 'var(--text)' }}>
                                    {line.rationale.contribution_summary}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-light)' }}>
                                    Weight Calculation
                                  </p>
                                  <p className="text-sm tabular-nums" style={{ color: 'var(--text)' }}>
                                    {line.rationale.weight_calculation}
                                  </p>
                                </div>
                                {relatedEvidence.length > 0 && (
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-light)' }}>
                                      Evidence
                                    </p>
                                    <div className="space-y-1.5">
                                      {relatedEvidence.map((e) => (
                                        <div
                                          key={e.id}
                                          className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
                                          style={{
                                            background: 'var(--surface)',
                                            border: '1px solid var(--border)',
                                          }}
                                        >
                                          <FileText size={14} style={{ color: 'var(--accent)' }} />
                                          <span style={{ color: 'var(--text)' }}>{e.fileName}</span>
                                          <span className="text-xs ml-auto" style={{ color: 'var(--muted-light)' }}>
                                            {e.kind}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                {/* Footer: invariant */}
                <div
                  className="px-6 py-3 flex items-center justify-between text-sm"
                  style={{
                    background: run.isConserved ? 'var(--accent-subtle)' : 'var(--primary-subtle)',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <span
                    className="font-semibold"
                    style={{ color: run.isConserved ? 'var(--accent)' : 'var(--primary)' }}
                  >
                    {run.isConserved
                      ? '✓ Sum matches pool exactly'
                      : 'Stored lines do not match the run total'}
                  </span>
                  <span className="font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
                    {formatMoney(run.lines.reduce((s, l) => s + l.amountMinor, 0))} / {formatMoney(run.poolMinor)}
                  </span>
                </div>
              </Card>
            </Reveal>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Run Info */}
            <Reveal delay={0.2}>
              <Card padding="md">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--muted)' }}>
                  Run Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted)' }}>Checksum</span>
                    <code className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                      {run.checksum}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted)' }}>Rule version</span>
                    <span className="font-semibold" style={{ color: 'var(--text)' }}>v{run.ruleVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted)' }}>Members</span>
                    <span className="font-semibold" style={{ color: 'var(--text)' }}>{run.lines.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted)' }}>Created</span>
                    <span className="font-semibold" style={{ color: 'var(--text)' }}>
                      {new Date(run.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            </Reveal>

            {/* Approvals */}
            <Reveal delay={0.25}>
              <Card padding="md">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--muted)' }}>
                  Approvals
                </h3>
                {approvals.length > 0 ? (
                  <div className="space-y-3">
                    {approvals.map((a) => (
                      <div key={a.id} className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                          style={{
                            background: a.decision === 'approved' ? 'var(--accent-subtle)' : 'var(--primary-subtle)',
                            color: a.decision === 'approved' ? 'var(--accent)' : 'var(--primary)',
                          }}
                        >
                          {a.decision === 'approved' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                            {a.approverName}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>
                            {a.note}
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--muted-light)' }}>
                            {new Date(a.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--muted-light)' }}>
                    No approvals yet. This run is awaiting review.
                  </p>
                )}
              </Card>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RunDetailPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-16 px-4 max-w-7xl mx-auto flex items-center justify-center" style={{ background: 'var(--background)' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
            <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Loading run details...</p>
          </div>
        </div>
      }
    >
      <RunDetailContent {...props} />
    </Suspense>
  );
}
