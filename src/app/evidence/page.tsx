'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Image,
  FileSpreadsheet,
  Mic,
  Link2,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Brain,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
} from 'lucide-react';
import { Reveal, Card, StatusChip, ConfidenceMeter } from '@/components/ui';
import { mockEvidence, mockContributions, mockFocusSessions, MockFocusSession } from '@/lib/mock-data';

const kindIcons: Record<string, React.ReactNode> = {
  text: <FileText size={18} />,
  pdf: <FileText size={18} />,
  image: <Image size={18} />,
  audio: <Mic size={18} />,
  csv: <FileSpreadsheet size={18} />,
  link: <Link2 size={18} />,
};

const kindColors: Record<string, string> = {
  text: 'var(--accent)',
  pdf: 'var(--primary)',
  image: 'var(--accent)',
  audio: 'var(--accent)',
  csv: 'var(--text)',
  link: 'var(--accent)',
};

const statusConfig: Record<string, { variant: 'mint' | 'amber' | 'rose' | 'violet' | 'muted'; label: string }> = {
  pending: { variant: 'amber', label: 'Pending' },
  extracted: { variant: 'mint', label: 'Extracted' },
  failed: { variant: 'rose', label: 'Failed' },
  rejected: { variant: 'muted', label: 'Rejected' },
};

export default function EvidencePage() {
  const [activeTab, setActiveTab] = useState<'evidence' | 'focus_sessions'>('evidence');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dragOver, setDragOver] = useState(false);
  const [sessions, setSessions] = useState<MockFocusSession[]>(mockFocusSessions);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = filterStatus === 'all'
    ? mockEvidence
    : mockEvidence.filter((e) => e.status === filterStatus);

  const handleApproveSession = (id: string) => {
    setSessions(sessions.map((s) => (s.id === id ? { ...s, status: 'approved' as const } : s)));
  };

  const handleDisputeSession = (id: string) => {
    setSessions(sessions.map((s) => (s.id === id ? { ...s, status: 'disputed' as const } : s)));
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <Reveal>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
                Evidence & Work Trail
              </h1>
              <p className="text-base mt-1" style={{ color: 'var(--muted)' }}>
                Upload deliverables, review AI extractions, and adjudicate opt-in focus session conflicts
              </p>
            </div>

            {/* Tab switch */}
            <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[var(--border)] shadow-sm">
              <button
                onClick={() => setActiveTab('evidence')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'evidence'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                Deliverables & Files ({mockEvidence.length})
              </button>
              <button
                onClick={() => setActiveTab('focus_sessions')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'focus_sessions'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <span>Focus Sessions</span>
                <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
              </button>
            </div>
          </div>
        </Reveal>

        {activeTab === 'evidence' ? (
          <>
            {/* Upload zone */}
            <Reveal delay={0.1}>
          <div
            className="mb-8 rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer"
            style={{
              borderColor: dragOver ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 20%, transparent)',
              background: dragOver ? 'color-mix(in srgb, var(--accent) 6%, transparent)' : 'color-mix(in srgb, var(--accent) 2%, transparent)',
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              // Would handle file upload here
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.csv,.txt,.mp3,.wav"
            />
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'var(--accent-subtle)',
                color: 'var(--accent)',
              }}
            >
              <Upload size={28} />
            </div>
            <p className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>
              Drop files here or click to upload
            </p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              PDF, PNG, JPG, CSV, TXT, or audio (MP3/WAV) — Max 10MB each
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              {['PDF', 'Image', 'CSV', 'Link', 'Audio'].map((type) => (
                <span
                  key={type}
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{
                    background: 'var(--accent-subtle)',
                    color: 'var(--accent)',
                  }}
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Filter bar */}
        <Reveal delay={0.15}>
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
            <Filter size={16} style={{ color: 'var(--muted)' }} />
            {['all', 'pending', 'extracted', 'failed'].map((status) => (
              <button
                key={status}
                className="text-sm font-semibold px-4 py-2 rounded-xl transition-all whitespace-nowrap"
                style={{
                  background: filterStatus === status ? 'var(--accent-subtle)' : 'transparent',
                  color: filterStatus === status ? 'var(--accent)' : 'var(--muted)',
                }}
                onClick={() => setFilterStatus(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status === 'all' && ` (${mockEvidence.length})`}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Evidence list */}
        <div className="space-y-4">
          {filtered.map((evi, idx) => {
            const contributions = mockContributions.filter(
              (c) => c.evidenceId === evi.id
            );
            const isExpanded = expandedId === evi.id;
            const hasConflicts = contributions.some(
              (c) => c.flags.length > 0
            );
            const sc = statusConfig[evi.status] || statusConfig.pending;

            return (
              <Reveal key={evi.id} delay={idx * 0.05}>
                <Card padding="none" className="overflow-hidden">
                  {/* Main row */}
                  <div
                    className="px-6 py-4 flex items-center gap-4 cursor-pointer"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : evi.id)
                    }
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `color-mix(in srgb,  8%, transparent)`,
                        color: kindColors[evi.kind],
                      }}
                    >
                      {kindIcons[evi.kind]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                          {evi.fileName}
                        </p>
                        {hasConflicts && (
                          <AlertTriangle size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted-light)' }}>
                        {evi.kind.toUpperCase()} &bull;{' '}
                        {(evi.sizeBytes / 1024).toFixed(0)} KB &bull;{' '}
                        {new Date(evi.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusChip label={sc.label} variant={sc.variant} />
                      {contributions.length > 0 && (
                        <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                          {contributions.length} record{contributions.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={16} style={{ color: 'var(--muted)' }} />
                      </motion.div>
                    </div>
                  </div>

                  {/* Expanded: extracted contributions */}
                  <AnimatePresence>
                    {isExpanded && contributions.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div
                          className="px-6 py-4 space-y-3"
                          style={{
                            background: 'color-mix(in srgb, var(--accent) 2%, transparent)',
                            borderTop: '1px solid var(--border)',
                          }}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Brain size={14} style={{ color: 'var(--accent)' }} />
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                              AI Extracted Records
                            </span>
                          </div>
                          {contributions.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl"
                              style={{
                                background: c.flags.length > 0
                                  ? 'var(--primary-subtle)'
                                  : 'var(--surface)',
                                border: `1px solid ${c.flags.length > 0 ? 'color-mix(in srgb, var(--accent) 20%, transparent)' : 'var(--border)'}`,
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                                  {c.memberName}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                  {c.quantity} {c.unit} of {c.activity} &bull; {c.period}
                                </p>
                                {c.flags.length > 0 && (
                                  <div className="mt-1.5 space-y-1">
                                    {c.flags.map((flag, fi) => (
                                      <p
                                        key={fi}
                                        className="text-xs flex items-center gap-1"
                                        style={{ color: 'var(--primary)' }}
                                      >
                                        <AlertTriangle size={12} />
                                        {flag}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <ConfidenceMeter value={c.confidence} />
                                <StatusChip
                                  label={c.status}
                                  variant={
                                    c.status === 'confirmed' ? 'mint' :
                                    c.status === 'pending' ? 'amber' :
                                    c.status === 'rejected' ? 'rose' : 'muted'
                                  }
                                />
                              </div>
                            </div>
                          ))}

                          {/* Action buttons */}
                          <div className="flex items-center gap-3 mt-4">
                            <button className="btn-3d btn-3d-sm">
                              <CheckCircle2 size={14} />
                              Confirm all
                            </button>
                            <button className="btn-secondary text-sm py-2 px-4">
                              Re-extract
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </>
    ) : (
      /* Focus Sessions Approver Review */
      <div className="space-y-6">
        <Reveal delay={0.1}>
          <div className="p-4 rounded-xl bg-[var(--accent-subtle)] border border-[var(--border)] flex items-start gap-3">
            <AlertTriangle size={20} className="text-[var(--accent)] flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-[var(--accent)] mb-0.5">
                Approver Review Gating: Sessions are evidence, not pay.
              </p>
              <p className="text-[var(--accent)]">
                Members opt in to track deep work focus sessions. Sessions with overlapping timestamps or implausible totals (&gt;16 hours/day) are automatically flagged for approver adjudication. Approved sessions enter the verified evidence trail, but do not directly determine payout amounts.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card padding="md">
              <p className="text-xs font-semibold text-[var(--muted)]">Total Sessions</p>
              <p className="text-2xl font-black text-[var(--text)] mt-1">{sessions.length}</p>
            </Card>
            <Card padding="md">
              <p className="text-xs font-semibold text-[var(--muted)]">Approved Evidence</p>
              <p className="text-2xl font-black text-[var(--accent)] mt-1">
                {sessions.filter((s) => s.status === 'approved').length}
              </p>
            </Card>
            <Card padding="md" className="border-2 border-[var(--background)] bg-[var(--background)]">
              <p className="text-xs font-semibold text-[var(--primary)]">Flagged Conflicts</p>
              <p className="text-2xl font-black text-[var(--primary)] mt-1">
                {sessions.filter((s) => s.conflictFlag).length}
              </p>
            </Card>
          </div>
        </Reveal>

        <div className="space-y-4">
          {sessions.map((sess) => (
            <Card key={sess.id} padding="md" className={sess.conflictFlag ? 'border-2 border-[var(--background)]' : ''}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[var(--text)]">{sess.memberName}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--background)] text-[var(--accent)]">
                      {sess.taskId}
                    </span>
                    <span className="text-xs font-medium text-[var(--text)]">{sess.taskTitle}</span>
                    {sess.conflictFlag && (
                      <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--primary)] text-white">
                        <AlertTriangle size={12} />
                        Conflict: &gt;16h Threshold
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[var(--muted)]">
                    {new Date(sess.startedAt).toLocaleString()} &bull; Duration:{' '}
                    <strong>
                      {sess.durationMinutes
                        ? `${(sess.durationMinutes / 60).toFixed(1)} hours (${sess.durationMinutes}m)`
                        : 'In progress'}
                    </strong>{' '}
                    &bull; Source: <span className="font-mono">{sess.source}</span>
                  </p>

                  {sess.conflictFlag && (
                    <p className="text-xs font-mono text-[var(--primary)] bg-[var(--background)] p-2 rounded-lg mt-2">
                      ⚠ {sess.conflictFlag}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {sess.status === 'approved' ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-[var(--accent)] bg-[var(--background)] px-3 py-1.5 rounded-lg">
                      <CheckCircle2 size={14} />
                      Approved to Evidence
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleApproveSession(sess.id)}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 text-white"
                        style={{ background: 'var(--accent)' }}
                      >
                        <CheckCircle2 size={13} />
                        Approve Evidence
                      </button>
                      <button
                        onClick={() => handleDisputeSession(sess.id)}
                        className="btn-secondary text-xs py-1.5 px-3 text-[var(--primary)] hover:bg-[var(--background)]"
                      >
                        Dispute
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )}
  </div>
</div>
);
}
