'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Send,
  ExternalLink,
  DollarSign,
  ChevronDown,
} from 'lucide-react';
import {
  Reveal,
  Card,
  MoneyChip,
  StatusChip,
  ProgressPipeline,
} from '@/components/ui';
import { mockPayoutBatches } from '@/lib/mock-data';
import { formatMoney } from '@/lib/money';

const itemStatusConfig: Record<string, { icon: React.ReactNode; variant: 'mint' | 'amber' | 'rose' | 'muted'; color: string }> = {
  success: { icon: <CheckCircle2 size={14} />, variant: 'mint', color: 'var(--accent)' },
  pending: { icon: <Clock size={14} />, variant: 'amber', color: 'var(--accent)' },
  created: { icon: <Clock size={14} />, variant: 'muted', color: 'var(--muted)' },
  failed: { icon: <XCircle size={14} />, variant: 'rose', color: 'var(--primary)' },
  unclaimed: { icon: <AlertTriangle size={14} />, variant: 'amber', color: 'var(--accent)' },
  returned: { icon: <RefreshCw size={14} />, variant: 'rose', color: 'var(--primary)' },
  blocked: { icon: <XCircle size={14} />, variant: 'rose', color: 'var(--primary)' },
};

export default function PayoutsPage() {
  const batch = mockPayoutBatches[0]; // Primary batch
  const successCount = batch.items.filter((i) => i.status === 'success').length;
  const failedItems = batch.items.filter((i) => i.status === 'failed');
  const totalPaid = batch.items
    .filter((i) => i.status === 'success')
    .reduce((sum, i) => sum + i.amountMinor, 0);

  const pipeline = [
    {
      label: 'Created',
      status: batch.status === 'created' ? 'active' as const : 'completed' as const,
    },
    {
      label: 'Processing',
      status: batch.status === 'processing'
        ? 'active' as const
        : batch.status === 'created'
          ? 'pending' as const
          : 'completed' as const,
    },
    {
      label: 'Completed',
      status: batch.status === 'success'
        ? 'completed' as const
        : 'pending' as const,
    },
  ];

  // Since the batch has both success and failed, treat it as completed with issues
  const adjustedPipeline = [
    { label: 'Created', status: 'completed' as const },
    { label: 'Processing', status: 'completed' as const },
    { label: `${successCount}/${batch.items.length} Paid`, status: failedItems.length > 0 ? 'active' as const : 'completed' as const },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <Reveal>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
                Payouts
              </h1>
              <p className="text-base mt-1" style={{ color: 'var(--muted)' }}>
                Track PayPal batch payouts and retry failed items
              </p>
            </div>
          </div>
        </Reveal>

        {/* Stats */}
        <Reveal delay={0.1}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Batch Total', value: formatMoney(batch.totalMinor), color: 'var(--accent)' },
              { label: 'Paid Out', value: formatMoney(totalPaid), color: 'var(--accent)' },
              { label: 'Successful', value: `${successCount}/${batch.items.length}`, color: 'var(--accent)' },
              { label: 'Failed', value: failedItems.length.toString(), color: failedItems.length > 0 ? 'var(--primary)' : 'var(--accent)' },
            ].map((stat) => (
              <Card key={stat.label} padding="md">
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-light)' }}>
                  {stat.label}
                </p>
                <p className="text-2xl font-black tabular-nums" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </Card>
            ))}
          </div>
        </Reveal>

        {/* Batch card */}
        <Reveal delay={0.15}>
          <Card padding="none" className="mb-6">
            {/* Batch header */}
            <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent), var(--accent))',
                    }}
                  >
                    <CreditCard size={20} color="var(--background)" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                      Batch {batch.senderBatchId}
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--muted-light)' }}>
                      PayPal ID: {batch.paypalBatchId} &bull;{' '}
                      {new Date(batch.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <MoneyChip amount={formatMoney(batch.totalMinor)} status="default" />
              </div>
              <ProgressPipeline stages={adjustedPipeline} />
            </div>

            {/* Items */}
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {batch.items.map((item) => {
                const sc = itemStatusConfig[item.status] || itemStatusConfig.created;
                const isFailed = item.status === 'failed';
                return (
                  <div
                    key={item.id}
                    className="px-6 py-4 flex items-center gap-4"
                    style={{
                      background: isFailed ? 'color-mix(in srgb, var(--accent) 3%, transparent)' : 'transparent',
                    }}
                  >
                    {/* Status icon */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isFailed ? 'var(--primary-subtle)' : item.status === 'success' ? 'var(--accent-subtle)' : 'color-mix(in srgb, var(--accent) 6%, transparent)',
                        color: sc.color,
                      }}
                    >
                      {sc.icon}
                    </div>

                    {/* Recipient info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                        {item.recipientName}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted-light)' }}>
                        {item.recipientEmail}
                      </p>
                      {item.failureReason && (
                        <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                          <AlertTriangle size={12} />
                          {item.failureReason}
                        </p>
                      )}
                    </div>

                    {/* Amount & status */}
                    <div className="flex items-center gap-3">
                      <MoneyChip
                        amount={formatMoney(item.amountMinor)}
                        status={item.status === 'success' ? 'paid' : item.status === 'failed' ? 'failed' : 'pending'}
                        size="sm"
                      />
                      {isFailed && (
                        <button
                          className="btn-3d btn-3d-sm text-xs"
                          style={{
                            background: 'var(--primary)',
                            boxShadow: '0 4px 0 var(--primary), 0 8px 16px color-mix(in srgb, var(--accent) 20%, transparent)',
                            padding: '8px 16px',
                          }}
                        >
                          <RefreshCw size={12} />
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            {failedItems.length > 0 && (
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{
                  background: 'var(--primary-subtle)',
                  borderTop: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
                }}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} style={{ color: 'var(--primary)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                    {failedItems.length} item{failedItems.length !== 1 ? 's' : ''} failed
                  </span>
                </div>
                <button className="btn-3d btn-3d-sm text-xs" style={{ padding: '8px 20px' }}>
                  <RefreshCw size={12} />
                  Retry all failed
                </button>
              </div>
            )}
          </Card>
        </Reveal>

        {/* Info card */}
        <Reveal delay={0.2}>
          <Card padding="md">
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
              >
                <DollarSign size={16} />
              </div>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>
                  How retry works
                </p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Failed items are retried in a <strong>new batch</strong> with new sender IDs,
                  ensuring idempotency. The ledger records every status change. PayPal rate limits
                  apply — we use webhooks for updates and poll only as a fallback.
                </p>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
