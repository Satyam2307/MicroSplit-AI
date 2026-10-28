'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Shield,
  Hash,
  Clock,
  DollarSign,
  CreditCard,
  GitFork,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Reveal, Card, StatusChip, MoneyChip } from '@/components/ui';
import { mockLedgerEvents } from '@/lib/mock-data';
import { verifyLedgerChain, type LedgerEntry } from '@/lib/ledger';
import { formatMoney } from '@/lib/money';

const typeIcons: Record<string, React.ReactNode> = {
  revenue_recorded: <DollarSign size={14} />,
  split_created: <GitFork size={14} />,
  split_approved: <CheckCircle2 size={14} />,
  payout_created: <CreditCard size={14} />,
  payout_item_status: <Clock size={14} />,
  payout_completed: <CheckCircle2 size={14} />,
};

const typeColors: Record<string, { bg: string; color: string }> = {
  revenue_recorded: { bg: 'var(--accent-subtle)', color: 'var(--accent)' },
  split_created: { bg: 'var(--accent-subtle)', color: 'var(--accent)' },
  split_approved: { bg: 'var(--accent-subtle)', color: 'var(--accent)' },
  payout_created: { bg: 'var(--accent-subtle)', color: 'var(--accent)' },
  payout_item_status: { bg: 'color-mix(in srgb, var(--accent) 6%, transparent)', color: 'var(--muted)' },
  payout_completed: { bg: 'var(--accent-subtle)', color: 'var(--accent)' },
};

export default function LedgerPage() {
  const [verifyResult, setVerifyResult] = useState<{
    valid: boolean;
    totalEvents: number;
    brokenAt?: number;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered =
    filterType === 'all'
      ? mockLedgerEvents
      : mockLedgerEvents.filter((e) => e.type === filterType);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleVerify = () => {
    setIsVerifying(true);
    // Simulate verification delay
    setTimeout(() => {
      const result = verifyLedgerChain(mockLedgerEvents);
      setVerifyResult(result);
      setIsVerifying(false);
    }, 800);
  };

  const eventTypes = [
    'all',
    ...Array.from(new Set(mockLedgerEvents.map((e) => e.type))),
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <Reveal>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
                Ledger
              </h1>
              <p className="text-base mt-1" style={{ color: 'var(--muted)' }}>
                Append-only, hash-chained audit trail — every event is immutable
              </p>
            </div>
            <button
              className="btn-3d btn-3d-sm"
              onClick={handleVerify}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw size={14} />
                </motion.div>
              ) : (
                <Shield size={14} />
              )}
              {isVerifying ? 'Verifying...' : 'Verify chain'}
            </button>
          </div>
        </Reveal>

        {/* Verification result */}
        {verifyResult && (
          <Reveal>
            <Card
              padding="md"
              className="mb-6"
              hover={false}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: verifyResult.valid ? 'var(--accent-subtle)' : 'var(--primary-subtle)',
                    color: verifyResult.valid ? 'var(--accent)' : 'var(--primary)',
                  }}
                >
                  {verifyResult.valid ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <XCircle size={24} />
                  )}
                </div>
                <div>
                  <p
                    className="text-lg font-bold"
                    style={{
                      color: verifyResult.valid ? 'var(--accent)' : 'var(--primary)',
                    }}
                  >
                    {verifyResult.valid
                      ? 'Chain integrity verified ✓'
                      : `Chain broken at event #${verifyResult.brokenAt}`}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    {verifyResult.totalEvents} events checked &bull;{' '}
                    SHA-256 hash chain &bull; Just now
                  </p>
                </div>
              </div>
            </Card>
          </Reveal>
        )}

        {/* Filter bar */}
        <Reveal delay={0.1}>
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            <Filter size={16} style={{ color: 'var(--muted)' }} />
            {eventTypes.map((type) => (
              <button
                key={type}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                style={{
                  background: filterType === type ? 'var(--accent-subtle)' : 'transparent',
                  color: filterType === type ? 'var(--accent)' : 'var(--muted)',
                }}
                onClick={() => {
                  setFilterType(type);
                  setPage(1);
                }}
              >
                {type === 'all' ? 'All' : type.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Ledger table */}
        <Reveal delay={0.15}>
          <Card padding="none">
            {/* Table header */}
            <div
              className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold uppercase tracking-wider"
              style={{
                color: 'var(--muted-light)',
                borderBottom: '1px solid var(--border)',
                background: 'color-mix(in srgb, var(--accent) 2%, transparent)',
              }}
            >
              <div className="col-span-1">#</div>
              <div className="col-span-3">Event</div>
              <div className="col-span-2">Ref</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-2">Hash</div>
              <div className="col-span-2 text-right">Time</div>
            </div>

            {/* Table rows */}
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {paginated.map((event, idx) => {
                const tc = typeColors[event.type] || typeColors.payout_item_status;
                const payload = JSON.parse(event.payloadJson);
                const globalIdx = (page - 1) * pageSize + idx;

                return (
                  <div
                    key={event.id}
                    className="px-6 py-3 sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center flex flex-col gap-2 hover:bg-[var(--accent-subtle)] transition-colors"
                  >
                    {/* Index */}
                    <div className="col-span-1">
                      <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--muted-light)' }}>
                        {globalIdx + 1}
                      </span>
                    </div>

                    {/* Event type */}
                    <div className="col-span-3 flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: tc.bg, color: tc.color }}
                      >
                        {typeIcons[event.type]}
                      </div>
                      <span className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                        {event.type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Ref */}
                    <div className="col-span-2">
                      <code
                        className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{
                          background: 'color-mix(in srgb, var(--accent) 6%, transparent)',
                          color: 'var(--muted)',
                        }}
                      >
                        {event.refId}
                      </code>
                    </div>

                    {/* Amount */}
                    <div className="col-span-2 text-right">
                      <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                        {formatMoney(event.amountMinor)}
                      </span>
                    </div>

                    {/* Hash */}
                    <div className="col-span-2">
                      <code
                        className="text-[10px] font-mono truncate block"
                        style={{ color: 'var(--muted-light)' }}
                        title={event.hash}
                      >
                        {event.hash.substring(0, 12)}…
                      </code>
                    </div>

                    {/* Time */}
                    <div className="col-span-2 text-right">
                      <span className="text-xs" style={{ color: 'var(--muted-light)' }}>
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div
              className="px-6 py-3 flex items-center justify-between"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <span className="text-xs" style={{ color: 'var(--muted-light)' }}>
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="btn-ghost text-xs px-3 py-1.5"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{ opacity: page <= 1 ? 0.4 : 1 }}
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>
                <button
                  className="btn-ghost text-xs px-3 py-1.5"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{ opacity: page >= totalPages ? 0.4 : 1 }}
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </Card>
        </Reveal>

        {/* Chain info */}
        <Reveal delay={0.2}>
          <Card padding="md" className="mt-6" hover={false}>
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
              >
                <Hash size={16} />
              </div>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>
                  How the hash chain works
                </p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Each ledger event stores the SHA-256 hash of the previous event.
                  The hash is computed over: type + refId + amount + payload + prevHash + timestamp.
                  Verifying the chain means recomputing every hash and checking each link.
                  If any event is tampered with, the chain breaks at that point.
                </p>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
