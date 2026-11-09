'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import {
  Reveal,
  Card,
  MoneyChip,
  StatusChip,
  ProgressPipeline,
} from '@/components/ui';
import { formatDateTime } from '@/lib/date-format';
import { formatMoney } from '@/lib/money';

interface PayoutItemView {
  id: string;
  lineId: string;
  amountMinor: number;
  status: string;
  failureReason: string | null;
  recipientName: string;
  recipientEmail: string;
}

interface PayoutBatchView {
  id: string;
  runId: string;
  senderBatchId: string;
  paypalBatchId: string | null;
  status: string;
  totalMinor: number;
  createdAt: string;
  squadId: string;
  squadName: string;
  currency: string;
  items: PayoutItemView[];
}

const itemStatusConfig: Record<
  string,
  { icon: React.ReactNode; color: string }
> = {
  success: { icon: <CheckCircle2 size={14} />, color: 'var(--accent)' },
  pending: { icon: <Clock size={14} />, color: 'var(--accent)' },
  created: { icon: <Clock size={14} />, color: 'var(--muted)' },
  failed: { icon: <XCircle size={14} />, color: 'var(--primary)' },
  unclaimed: { icon: <AlertTriangle size={14} />, color: 'var(--primary)' },
  returned: { icon: <RefreshCw size={14} />, color: 'var(--primary)' },
  blocked: { icon: <XCircle size={14} />, color: 'var(--primary)' },
};

const failedStatuses = new Set(['failed', 'unclaimed', 'returned', 'blocked']);

export default function PayoutsPage() {
  const [batches, setBatches] = useState<PayoutBatchView[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadPayouts() {
      try {
        const response = await fetch('/api/payouts');
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load payouts');
        }
        const data = Array.isArray(result.data)
          ? (result.data as PayoutBatchView[])
          : [];
        if (!cancelled) {
          setBatches(data);
          setSelectedBatchId(data[0]?.id ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load payouts');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadPayouts();
    return () => {
      cancelled = true;
    };
  }, []);

  const batch =
    batches.find((item) => item.id === selectedBatchId) ?? batches[0] ?? null;

  const handleRefresh = async () => {
    if (!batch) return;
    setIsRefreshing(true);
    setActionError(null);
    try {
      const url = batch.paypalBatchId
        ? `/api/payouts/${encodeURIComponent(batch.id)}/reconcile`
        : `/api/split-runs/${encodeURIComponent(batch.runId)}/payout`;
      const response = await fetch(url, { method: 'POST' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to refresh payout status');
      }
      const updated = result.data as PayoutBatchView;
      setBatches((current) =>
        current.map((item) => {
          if (item.id !== updated.id) return item;
          const previousItems = new Map(item.items.map((payoutItem) => [payoutItem.id, payoutItem]));
          return {
            ...item,
            ...updated,
            items: updated.items.map((payoutItem) => ({
              ...previousItems.get(payoutItem.id),
              ...payoutItem,
            })),
          };
        })
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Unable to refresh payout status'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-[var(--muted)]">Loading payouts...</div>;
  }
  if (loadError) {
    return <div role="alert" className="p-12 text-center text-[var(--primary)]">{loadError}</div>;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Reveal>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
                Payouts
              </h1>
              <p className="text-base mt-1" style={{ color: 'var(--muted)' }}>
                Persisted PayPal Sandbox batch history and reconciliation
              </p>
            </div>
            <Link href="/squads" className="btn-secondary text-sm">
              <ArrowLeft size={14} />
              Squads
            </Link>
          </div>
        </Reveal>

        {!batch ? (
          <Card padding="lg" className="text-center">
            <CreditCard size={24} className="mx-auto mb-3" style={{ color: 'var(--muted)' }} />
            <p className="font-semibold" style={{ color: 'var(--text)' }}>
              No persisted payouts are available for your squads.
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              Only squad owners and approvers can view payout history.
            </p>
          </Card>
        ) : (
          <>
            {batches.length > 1 && (
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
                <label htmlFor="payout-history" className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  Payout history
                </label>
                <select
                  id="payout-history"
                  value={batch.id}
                  onChange={(event) => {
                    setSelectedBatchId(event.target.value);
                    setActionError(null);
                  }}
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                >
                  {batches.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.squadName} · {formatDateTime(item.createdAt)} · {item.status}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  disabled={isRefreshing}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  <RefreshCw size={14} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh status'}
                </button>
              </div>
            )}

            {batches.length === 1 && (
              <div className="mb-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  disabled={isRefreshing}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  <RefreshCw size={14} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh status'}
                </button>
              </div>
            )}
            {actionError && (
              <p role="alert" className="mb-4 text-sm text-[var(--primary)]">
                {actionError}
              </p>
            )}

            <Reveal delay={0.05}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Batch Total', value: formatMoney(batch.totalMinor, batch.currency) },
                  {
                    label: 'Paid Out',
                    value: formatMoney(
                      batch.items
                        .filter((item) => item.status === 'success')
                        .reduce((sum, item) => sum + item.amountMinor, 0),
                      batch.currency
                    ),
                  },
                  {
                    label: 'Successful',
                    value: `${batch.items.filter((item) => item.status === 'success').length}/${batch.items.length}`,
                  },
                  {
                    label: 'Needs attention',
                    value: batch.items.filter((item) => failedStatuses.has(item.status)).length.toString(),
                  },
                ].map((stat) => (
                  <Card key={stat.label} padding="md">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-light)' }}>
                      {stat.label}
                    </p>
                    <p className="text-2xl font-black tabular-nums" style={{ color: 'var(--accent)' }}>
                      {stat.value}
                    </p>
                  </Card>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <Card padding="none" className="mb-6">
                <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
                        <CreditCard size={20} color="var(--accent)" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                          {batch.squadName} · {batch.senderBatchId}
                        </h2>
                        <p className="text-xs" style={{ color: 'var(--muted-light)' }}>
                          PayPal ID: {batch.paypalBatchId || 'Not confirmed'} · {formatDateTime(batch.createdAt)}
                        </p>
                      </div>
                    </div>
                    <StatusChip label={batch.status.replaceAll('_', ' ')} variant={batch.status === 'success' ? 'mint' : batch.status === 'denied' || batch.status === 'completed_with_issues' ? 'rose' : 'amber'} />
                  </div>
                  <ProgressPipeline
                    stages={[
                      { label: 'Claimed', status: 'completed' },
                      { label: 'Processing', status: batch.status === 'processing' || batch.status === 'submitting' || batch.status === 'submission_unknown' ? 'active' : 'completed' },
                      { label: batch.status === 'completed_with_issues' ? 'Completed with issues' : 'Completed', status: batch.status === 'success' || batch.status === 'completed_with_issues' || batch.status === 'denied' || batch.status === 'canceled' ? 'completed' : 'pending' },
                    ]}
                  />
                </div>

                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {batch.items.map((item) => {
                    const config = itemStatusConfig[item.status] || itemStatusConfig.created;
                    const hasFailure = failedStatuses.has(item.status);
                    return (
                      <div key={item.id} className="px-6 py-4 flex items-center gap-4" style={{ background: hasFailure ? 'var(--primary-subtle)' : 'transparent' }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: item.status === 'success' ? 'var(--accent-subtle)' : 'color-mix(in srgb, var(--accent) 6%, transparent)', color: config.color }}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{item.recipientName}</p>
                          <p className="text-xs" style={{ color: 'var(--muted-light)' }}>{item.recipientEmail}</p>
                          {item.failureReason && (
                            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                              <AlertTriangle size={12} />
                              {item.failureReason}
                            </p>
                          )}
                        </div>
                        <MoneyChip
                          amount={formatMoney(item.amountMinor, batch.currency)}
                          status={item.status === 'success' ? 'paid' : hasFailure ? 'failed' : 'pending'}
                          size="sm"
                        />
                      </div>
                    );
                  })}
                </div>
                {batch.items.some((item) => failedStatuses.has(item.status)) && (
                  <p className="px-6 py-4 text-sm" style={{ color: 'var(--muted)' }}>
                    Failed or unclaimed items are not automatically resubmitted. Resolve the provider status before any manual recovery to avoid duplicate payments.
                  </p>
                )}
              </Card>
            </Reveal>

            <Reveal delay={0.15}>
              <Card padding="md">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Persisted Sandbox reconciliation</p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      Batch and item statuses are reconciled from verified PayPal webhooks or this explicit status refresh. An uncertain submission retains its unique run claim and stable request ID; it is never replaced with a mock success.
                    </p>
                  </div>
                </div>
              </Card>
            </Reveal>
          </>
        )}
      </div>
    </div>
  );
}
