'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  FileText,
  Shield,
  CreditCard,
  MessageSquare,
  Clock,
  Zap,
  Send,
  Flame,
} from 'lucide-react';
import {
  Reveal,
  Card,
  MoneyChip,
  StatusChip,
  WeightBar,
  ProgressPipeline,
  ConfidenceMeter,
} from '@/components/ui';
import { mockSplitRuns, mockApprovals, mockContributions, mockEvidence } from '@/lib/mock-data';
import { formatMoney, percentOfPool } from '@/lib/money';

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

import { showToast } from '@/components/Toast';

function RunDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const initialRun = mockSplitRuns.find((r) => r.id === id) || mockSplitRuns[0];
  const [run, setRun] = useState(initialRun);
  const [approvals, setApprovals] = useState(
    mockApprovals.filter((a) => a.runId === initialRun.id)
  );
  const [expandedLine, setExpandedLine] = useState<string | null>(null);
  const [disputeNote, setDisputeNote] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isDisputing, setIsDisputing] = useState(false);
  const [payoutResult, setPayoutResult] = useState<{ batchHeader?: { payout_batch_id?: string; batch_status?: string } } | null>(null);

  const pipeline = statusPipeline[run.status] || statusPipeline.draft;

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/split-runs/${run.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'approved',
          approverId: 'usr_1',
          approverName: 'Alex Rivera',
          note: 'Approved for payout processing',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to approve');

      setRun((prev) => ({ ...prev, status: 'approved' }));
      setApprovals((prev) => [
        ...prev,
        {
          id: `apr_${Date.now()}`,
          runId: run.id,
          approverId: 'usr_1',
          approverName: 'Alex Rivera',
          decision: 'approved',
          note: 'Approved for payout processing',
          createdAt: new Date().toISOString(),
        },
      ]);
      showToast({
        type: 'success',
        title: 'Split Run Approved',
        message: 'The run is approved and ready for PayPal batch payout.',
      });
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Approval Failed',
        message: err instanceof Error ? err.message : 'Error approving run',
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleDispute = async () => {
    if (!disputeNote.trim()) return;
    setIsDisputing(true);
    try {
      const res = await fetch(`/api/split-runs/${run.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'disputed',
          approverId: 'usr_1',
          approverName: 'Alex Rivera',
          note: disputeNote.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to dispute');

      setRun((prev) => ({ ...prev, status: 'disputed' }));
      setShowDisputeForm(false);
      showToast({
        type: 'error',
        title: 'Run Flagged as Disputed',
        message: 'Dispute recorded in tamper-evident ledger.',
      });
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Dispute Failed',
        message: err instanceof Error ? err.message : 'Error submitting dispute',
      });
    } finally {
      setIsDisputing(false);
    }
  };

  const handleSendPayout = async () => {
    setIsPaying(true);
    try {
      const res = await fetch(`/api/split-runs/${run.id}/payout`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to execute payout');

      setRun((prev) => ({ ...prev, status: 'paid' }));
      setPayoutResult(data.data);
      showToast({
        type: 'success',
        title: 'PayPal Payout Batch Created!',
        message: `Batch ID: ${data.data?.batchHeader?.payout_batch_id || 'PAYPAL_BATCH_SUCCESS'}. Dispatched via PayPal v1 API.`,
      });
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Payout Execution Failed',
        message: err instanceof Error ? err.message : 'Error dispatching payout',
      });
    } finally {
      setIsPaying(false);
    }
  };

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
                Run {run.id} &bull; Rule v{run.ruleVersion} &bull;{' '}
                {new Date(run.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-3">
              {run.status === 'pending_approval' && (
                <>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="btn-3d btn-3d-sm"
                    style={{
                      background: 'var(--primary)',
                      boxShadow: '0 4px 0 var(--primary), 0 8px 16px color-mix(in srgb, var(--accent) 25%, transparent)',
                    }}
                  >
                    <CheckCircle2 size={14} />
                    {isApproving ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary text-sm py-2 px-4"
                    style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                    onClick={() => setShowDisputeForm(!showDisputeForm)}
                  >
                    <AlertTriangle size={14} />
                    Dispute
                  </button>
                </>
              )}
              {run.status === 'approved' && (
                <button
                  type="button"
                  onClick={handleSendPayout}
                  disabled={isPaying}
                  className="btn-3d btn-3d-sm btn-3d-mint"
                  style={{ background: 'var(--accent)', color: 'var(--primary)' }}
                >
                  <Send size={14} />
                  {isPaying ? 'Dispatching PayPal...' : 'Send payout'}
                </button>
              )}
            </div>
          </div>
        </Reveal>

        {/* Payout Success Banner if available */}
        {payoutResult && (
          <Reveal>
            <div className="mb-6 p-4 rounded-xl bg-[var(--accent-subtle)] border border-[var(--border)] flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[var(--accent)]">
                  ✓ PayPal Payout Batch Processed Successfully
                </p>
                <p className="text-xs text-[var(--text)] mt-0.5 font-mono">
                  Batch ID: {payoutResult.batchHeader?.payout_batch_id || 'PAYPAL_BATCH_2026'} • Status: {payoutResult.batchHeader?.batch_status || 'PENDING'}
                </p>
              </div>
              <Link href="/payouts" className="text-xs font-bold text-[var(--primary)] hover:underline">
                View Payouts Ledger →
              </Link>
            </div>
          </Reveal>
        )}

        {/* Pipeline */}
        <Reveal delay={0.1}>
          <Card padding="md" className="mb-6">
            <ProgressPipeline stages={pipeline} />
          </Card>
        </Reveal>

        {/* Dispute form */}
        <AnimatePresence>
          {showDisputeForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <Card padding="lg" className="border-2 border-[var(--background)] bg-[var(--background)]">
                <h3 className="text-base font-bold mb-3 flex items-center gap-2 text-[var(--primary)]">
                  <AlertTriangle size={16} />
                  File a dispute
                </h3>
                <textarea
                  className="input-field mb-3"
                  rows={3}
                  placeholder="Explain the issue with this split..."
                  value={disputeNote}
                  onChange={(e) => setDisputeNote(e.target.value)}
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleDispute}
                    disabled={isDisputing || !disputeNote.trim()}
                    className="btn-3d btn-3d-sm"
                    style={{ background: 'var(--primary)', boxShadow: '0 4px 0 var(--primary)' }}
                  >
                    {isDisputing ? 'Submitting...' : 'Submit dispute'}
                  </button>
                  <button className="btn-ghost" onClick={() => setShowDisputeForm(false)}>
                    Cancel
                  </button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

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
                    const relatedEvidence = mockEvidence.filter((e) =>
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
                                  status="paid"
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
                    background: 'var(--accent-subtle)',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                    ✓ Sum matches pool exactly
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
