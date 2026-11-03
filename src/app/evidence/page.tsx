'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Mic,
  Link2,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { Reveal, Card, StatusChip } from '@/components/ui';
import type { MockFocusSession } from '@/lib/mock-data';
import {
  DATE_INTERPRETATION_WARNING_PREFIX,
  getContributionDateWarning,
  getContributionWarnings,
  getExtractionDisplayStatus,
} from '@/lib/evidence-extraction-display';

type EvidenceRecord = {
  id: string;
  squadId: string;
  uploaderId: string;
  kind: string;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  status: string;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  uploader: { name: string | null };
  reviewedBy: { name: string | null } | null;
  aiLogs: ExtractionAttempt[];
};

type ExtractionAttempt = {
  id: string;
  attempt: number;
  modelName: string;
  promptVersion: string;
  outputJson: string | null;
  status: string;
  errorCategory: string | null;
  createdAt: string;
  completedAt: string | null;
  contributions: ExtractedContribution[];
};

type ExtractedContribution = {
  id: string;
  memberId: string | null;
  memberIdentifier: string | null;
  identityMatchStatus: string;
  activity: string;
  contributionType: string | null;
  description: string | null;
  sourceReference: string | null;
  contributionDate: string | null;
  confidence: number;
  flagsJson: string | null;
  status: string;
  reviewedAt: string | null;
  member: { id: string; name: string | null } | null;
  reviewedBy: { name: string | null } | null;
};

type EvidenceMember = {
  userId: string;
  user: { id: string; name: string | null; email: string };
};

type ContributionDraft = {
  memberId: string;
  contributionType: string;
  description: string;
  sourceReference: string;
  contributionDate: string;
};

type EvidenceSquad = {
  id: string;
  name: string;
  currentRole: string;
};

const kindIcons: Record<string, React.ReactNode> = {
  text: <FileText size={18} />,
  pdf: <FileText size={18} />,
  image: <ImageIcon size={18} aria-hidden="true" />,
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
  uploading: { variant: 'violet', label: 'Uploading' },
  pending_review: { variant: 'amber', label: 'Pending review' },
  confirmed: { variant: 'mint', label: 'Confirmed' },
  rejected: { variant: 'muted', label: 'Rejected' },
  extraction_pending: { variant: 'violet', label: 'Extraction pending' },
  extraction_processing: { variant: 'violet', label: 'Extracting' },
  extraction_completed: { variant: 'mint', label: 'Extraction completed' },
  extraction_failed: { variant: 'rose', label: 'Extraction failed' },
};

function uploadEvidenceFile(
  signedUrl: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', signedUrl);
    request.setRequestHeader('Content-Type', file.type);
    request.setRequestHeader('x-upsert', 'false');
    request.timeout = 120_000;
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
      } else {
        reject(new Error(`Storage upload failed with status ${request.status}`));
      }
    });
    request.addEventListener('error', () => reject(new Error('Storage upload failed')));
    request.addEventListener('timeout', () => reject(new Error('Storage upload timed out')));
    request.send(file);
  });
}

export default function EvidencePage() {
  const [activeTab, setActiveTab] = useState<'evidence' | 'focus_sessions'>('evidence');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dragOver, setDragOver] = useState(false);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [squads, setSquads] = useState<EvidenceSquad[]>([]);
  const [selectedSquadId, setSelectedSquadId] = useState('');
  const [sessions, setSessions] = useState<MockFocusSession[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [reviewingContributionId, setReviewingContributionId] = useState<string | null>(null);
  const [squadMembers, setSquadMembers] = useState<EvidenceMember[]>([]);
  const [contributionDrafts, setContributionDrafts] = useState<
    Record<string, ContributionDraft>
  >({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadKeysRef = useRef(new Map<string, string>());

  useEffect(() => {
    let cancelled = false;
    async function loadSquads() {
      try {
        const squadResponse = await fetch('/api/squads');
        const squadResult = await squadResponse.json();
        if (!squadResponse.ok || !squadResult.success) {
          throw new Error(squadResult.error || 'Unable to load squads');
        }
        if (cancelled) return;
        const availableSquads = squadResult.data as EvidenceSquad[];
        setSquads(availableSquads);
        setSelectedSquadId((current) => current || availableSquads[0]?.id || '');
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load squads');
        }
      }
    }

    void loadSquads();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadSessions() {
      try {
        const response = await fetch('/api/focus-sessions');
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load focus sessions');
        }
        if (!cancelled) setSessions(result.data as MockFocusSession[]);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load focus sessions');
        }
      }
    }

    void loadSessions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedSquadId) {
      return;
    }

    let cancelled = false;
    async function loadEvidence() {
      setIsLoadingEvidence(true);
      setLoadError(null);
      try {
        const response = await fetch(
          `/api/evidence?squadId=${encodeURIComponent(selectedSquadId)}`
        );
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load evidence');
        }
        if (!cancelled) setEvidence(result.data as EvidenceRecord[]);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load evidence');
        }
      } finally {
        if (!cancelled) setIsLoadingEvidence(false);
      }
    }

    void loadEvidence();
    return () => {
      cancelled = true;
    };
  }, [selectedSquadId]);

  useEffect(() => {
    if (!selectedSquadId) {
      return;
    }

    let cancelled = false;
    async function loadSquadMembers() {
      try {
        const response = await fetch(`/api/squads/${selectedSquadId}/members`);
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load squad members');
        }
        if (!cancelled) setSquadMembers(result.data as EvidenceMember[]);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load squad members');
        }
      }
    }

    void loadSquadMembers();
    return () => {
      cancelled = true;
    };
  }, [selectedSquadId]);

  const squadEvidence = evidence.filter((item) => item.squadId === selectedSquadId);
  const filtered = filterStatus === 'all'
    ? squadEvidence
    : squadEvidence.filter((e) => e.status === filterStatus);

  const selectedSquad = squads.find((squad) => squad.id === selectedSquadId);
  const canReviewEvidence =
    selectedSquad?.currentRole === 'owner' || selectedSquad?.currentRole === 'approver';
  const canExtractEvidence = ['owner', 'approver', 'contributor'].includes(
    selectedSquad?.currentRole ?? ''
  );

  const refreshEvidence = async () => {
    const response = await fetch(
      `/api/evidence?squadId=${encodeURIComponent(selectedSquadId)}`
    );
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Unable to refresh evidence');
    }
    setEvidence(result.data as EvidenceRecord[]);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const queuedFiles = Array.from(files);
    if (!selectedSquadId) {
      setUploadMessage('Create or join a squad before uploading evidence.');
      return;
    }

    setLoadError(null);
    setUploadMessage(null);
    for (const [index, file] of queuedFiles.entries()) {
      setUploadProgress(0);
      setUploadMessage(`Preparing ${file.name} (${index + 1} of ${queuedFiles.length})`);
      let evidenceId: string | undefined;
      let fileUploaded = false;
      try {
        const uploadIdentity =
          `${selectedSquadId}:${file.name}:${file.size}:${file.lastModified}`;
        const idempotencyKey =
          uploadKeysRef.current.get(uploadIdentity) ?? crypto.randomUUID();
        uploadKeysRef.current.set(uploadIdentity, idempotencyKey);
        const prepareResponse = await fetch('/api/evidence', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            squadId: selectedSquadId,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          }),
        });
        const prepared = await prepareResponse.json();
        if (!prepareResponse.ok || !prepared.success) {
          throw new Error(prepared.error || `Unable to prepare ${file.name}`);
        }
        evidenceId = prepared.data.id as string;
        if (prepared.data.completed) {
          uploadKeysRef.current.delete(uploadIdentity);
          continue;
        }
        if (typeof prepared.data.signedUrl !== 'string') {
          throw new Error('Upload service did not return a signed upload URL');
        }

        await uploadEvidenceFile(
          prepared.data.signedUrl,
          file,
          (progress) => {
            setUploadProgress(progress);
            setUploadMessage(`Uploading ${file.name} (${index + 1} of ${queuedFiles.length})`);
          }
        );
        fileUploaded = true;
        setUploadMessage(`Verifying ${file.name} (${index + 1} of ${queuedFiles.length})`);

        const completeResponse = await fetch(`/api/evidence/${evidenceId}/complete`, {
          method: 'POST',
        });
        const completed = await completeResponse.json();
        if (!completeResponse.ok || !completed.success) {
          throw new Error(completed.error || `Unable to save ${file.name}`);
        }
        uploadKeysRef.current.delete(uploadIdentity);
      } catch (error) {
        const message = error instanceof Error ? error.message : `Unable to upload ${file.name}`;
        if (evidenceId && fileUploaded) {
          try {
            const statusResponse = await fetch(`/api/evidence/${evidenceId}`);
            const current = await statusResponse.json();
            if (statusResponse.ok && current.success && current.data.status === 'pending_review') {
              uploadKeysRef.current.delete(
                `${selectedSquadId}:${file.name}:${file.size}:${file.lastModified}`
              );
              continue;
            }
            if (!statusResponse.ok || !current.success) {
              setLoadError(`${message}. Could not confirm whether the upload completed; retry after checking the evidence list.`);
              break;
            }
          } catch {
            setLoadError(`${message}. Could not confirm whether the upload completed; retry after checking the evidence list.`);
            break;
          }
        }
        if (evidenceId) {
          const cleanupResponse = await fetch(`/api/evidence/${evidenceId}`, {
            method: 'DELETE',
          });
          if (!cleanupResponse.ok) {
            setLoadError(`${message}. Upload cleanup also failed; retry deleting this evidence.`);
            break;
          }
        }
        setLoadError(message);
      }
    }
    setUploadProgress(null);
    setUploadMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    try {
      const response = await fetch(
        `/api/evidence?squadId=${encodeURIComponent(selectedSquadId)}`
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to refresh evidence');
      }
      setEvidence(result.data as EvidenceRecord[]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to refresh evidence');
    }
  };

  const handleEvidenceReview = async (id: string, status: 'confirmed' | 'rejected') => {
    setReviewingId(id);
    setLoadError(null);
    try {
      const response = await fetch(`/api/evidence/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to update evidence review');
      }
      setEvidence((current) =>
        current.map((item) => (item.id === id ? result.data as EvidenceRecord : item))
      );
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to update evidence review');
    } finally {
      setReviewingId(null);
    }
  };

  const handleExtractEvidence = async (id: string) => {
    setExtractingId(id);
    setLoadError(null);
    setUploadMessage(null);
    try {
      const response = await fetch(`/api/evidence/${id}`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to extract evidence');
      }
      const hasWarnings =
        Array.isArray(result.data?.contributions) &&
        result.data.contributions.some(
          (contribution: { uncertainties?: unknown }) =>
            Array.isArray(contribution.uncertainties) &&
            contribution.uncertainties.some(
              (warning: unknown) =>
                typeof warning === 'string' &&
                warning.startsWith(DATE_INTERPRETATION_WARNING_PREFIX)
            )
        );
      setUploadMessage(
        hasWarnings
          ? 'Extraction completed with warnings. Review and correct flagged proposal dates before confirming.'
          : `Extraction completed for ${evidence.find((item) => item.id === id)?.fileName ?? 'evidence'}. All contribution matches are proposals for human review.`
      );
      await refreshEvidence();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to extract evidence');
      try {
        await refreshEvidence();
      } catch (refreshError) {
        setLoadError(
          refreshError instanceof Error
            ? refreshError.message
            : 'Unable to refresh evidence after extraction'
        );
      }
    } finally {
      setExtractingId(null);
    }
  };

  const handleContributionReview = async (
    contribution: ExtractedContribution,
    status: 'pending' | 'confirmed' | 'rejected'
  ) => {
    const draft = contributionDrafts[contribution.id];
    setReviewingContributionId(contribution.id);
    setLoadError(null);
    try {
      const response = await fetch(
        `/api/evidence/contributions/${contribution.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            memberId: draft
              ? draft.memberId || null
              : contribution.memberId,
            contributionType: draft?.contributionType || contribution.contributionType,
            description: draft?.description ?? contribution.description,
            sourceReference: draft?.sourceReference ?? contribution.sourceReference,
            contributionDate: draft
              ? draft.contributionDate || null
              : contribution.contributionDate
                ? new Date(contribution.contributionDate).toISOString().slice(0, 10)
                : null,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to save contribution review');
      }
      setContributionDrafts((current) => {
        const next = { ...current };
        delete next[contribution.id];
        return next;
      });
      setUploadMessage(
        status === 'confirmed'
          ? 'Contribution confirmed. It is now eligible for future split calculations.'
          : status === 'rejected'
            ? 'Contribution proposal rejected.'
            : 'Corrections saved. The proposal remains pending and is not split-eligible until confirmed.'
      );
      await refreshEvidence();
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Unable to save contribution review'
      );
    } finally {
      setReviewingContributionId(null);
    }
  };

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
                Upload files, review squad evidence, and adjudicate opt-in focus session conflicts
              </p>
              {loadError && <p role="alert" className="text-sm text-red-600 mt-2">{loadError}</p>}
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
                Deliverables & Files ({evidence.length})
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
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <label className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    Squad
                    <select
                      value={selectedSquadId}
                      onChange={(event) => {
                        setSquadMembers([]);
                        setSelectedSquadId(event.target.value);
                      }}
                      onClick={(event) => event.stopPropagation()}
                      className="ml-3 rounded-lg border px-3 py-2"
                      style={{
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        borderColor: 'var(--border)',
                      }}
                    >
                      <option value="">Select a squad</option>
                      {squads.map((squad) => (
                        <option key={squad.id} value={squad.id}>{squad.name}</option>
                      ))}
                    </select>
                  </label>
                  {selectedSquad && (
                    <span className="text-xs capitalize" style={{ color: 'var(--muted)' }}>
                      Your role: {selectedSquad.currentRole}
                    </span>
                  )}
                </div>
                <div
                  className="rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer"
                  style={{
                    borderColor: dragOver ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 20%, transparent)',
                    background: dragOver ? 'color-mix(in srgb, var(--accent) 6%, transparent)' : 'color-mix(in srgb, var(--accent) 2%, transparent)',
                    opacity: uploadProgress === null ? 1 : 0.75,
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragOver(false);
                    void uploadFiles(event.dataTransfer.files);
                  }}
                  onClick={() => uploadProgress === null && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.csv,.txt,.mp3,.wav"
                    disabled={uploadProgress !== null}
                    onChange={(event) => {
                      if (event.target.files) void uploadFiles(event.target.files);
                    }}
                  />
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                  >
                    <Upload size={28} />
                  </div>
                  <p className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>
                    {uploadProgress === null ? 'Drop files here or click to upload' : uploadMessage}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    PDF, PNG, JPG, CSV, TXT, or audio (MP3/WAV) — Max 10MB each
                  </p>
                  {uploadProgress !== null && (
                    <div className="max-w-md mx-auto mt-4">
                      <progress className="w-full" max={100} value={uploadProgress} />
                      <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                        {uploadProgress}% uploaded
                      </p>
                    </div>
                  )}
                  {uploadMessage && uploadProgress === null && (
                    <p className="text-sm mt-3" role="status" style={{ color: 'var(--accent)' }}>
                      {uploadMessage}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-3 mt-4">
                    {['PDF', 'Image', 'CSV', 'Text', 'Audio'].map((type) => (
                      <span
                        key={type}
                        className="text-xs font-semibold px-3 py-1 rounded-full"
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

        {/* Filter bar */}
        <Reveal delay={0.15}>
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
            <Filter size={16} style={{ color: 'var(--muted)' }} />
            {[
              'all',
              'pending_review',
              'extraction_processing',
              'extraction_completed',
              'extraction_failed',
              'confirmed',
              'rejected',
            ].map((status) => (
              <button
                key={status}
                className="text-sm font-semibold px-4 py-2 rounded-xl transition-all whitespace-nowrap"
                style={{
                  background: filterStatus === status ? 'var(--accent-subtle)' : 'transparent',
                  color: filterStatus === status ? 'var(--accent)' : 'var(--muted)',
                }}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' ? 'All' : statusConfig[status].label}
                {status === 'all' && ` (${evidence.length})`}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Evidence list */}
        <div className="space-y-4">
          {isLoadingEvidence && (
            <p className="text-sm" role="status" style={{ color: 'var(--muted)' }}>
              Loading evidence…
            </p>
          )}
          {!isLoadingEvidence && squads.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Join or create a squad to manage evidence.
            </p>
          )}
          {!isLoadingEvidence && selectedSquadId && filtered.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              No evidence matches this filter yet.
            </p>
          )}
          {filtered.map((evi, idx) => {
            const isExpanded = expandedId === evi.id;
            const displayStatus = getExtractionDisplayStatus(
              evi.status,
              evi.aiLogs[0]?.contributions ?? []
            );
            const sc = statusConfig[evi.status] ?? {
              variant: 'muted' as const,
              label: evi.status,
            };
            const displayedStatusConfig =
              displayStatus === 'Extraction completed with warnings'
                ? { variant: 'amber' as const, label: displayStatus }
                : { ...sc, label: displayStatus };

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
                        color: kindColors[evi.kind] ?? 'var(--accent)',
                      }}
                    >
                      {kindIcons[evi.kind] ?? <FileText size={18} aria-hidden="true" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                          {evi.fileName ?? 'Untitled file'}
                        </p>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted-light)' }}>
                        {evi.kind.toUpperCase()} &bull;{' '}
                        {((evi.sizeBytes ?? 0) / 1024).toFixed(0)} KB &bull;{' '}
                        {new Date(evi.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusChip
                        label={displayedStatusConfig.label}
                        variant={displayedStatusConfig.variant}
                      />
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={16} style={{ color: 'var(--muted)' }} />
                      </motion.div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
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
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>
                            Uploaded by {evi.uploader.name ?? 'Squad member'} on{' '}
                            {new Date(evi.createdAt).toLocaleString()}
                          </p>
                          {evi.reviewedAt && (
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>
                              Reviewed by {evi.reviewedBy?.name ?? 'Squad member'} on{' '}
                              {new Date(evi.reviewedAt).toLocaleString()}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3">
                            <a
                              className="btn-secondary text-sm py-2 px-4"
                              href={`/api/evidence/${evi.id}/file`}
                            >
                              Download file
                            </a>
                            {canReviewEvidence && evi.status === 'pending_review' && (
                              <>
                                <button
                                  className="btn-3d btn-3d-sm"
                                  disabled={reviewingId === evi.id}
                                  onClick={() => void handleEvidenceReview(evi.id, 'confirmed')}
                                >
                                  <CheckCircle2 size={14} />
                                  {reviewingId === evi.id ? 'Saving…' : 'Confirm evidence'}
                                </button>
                                <button
                                  className="btn-secondary text-sm py-2 px-4"
                                  disabled={reviewingId === evi.id}
                                  onClick={() => void handleEvidenceReview(evi.id, 'rejected')}
                                >
                                  Reject evidence
                                </button>
                              </>
                            )}
                            {canExtractEvidence &&
                              [
                                'pending_review',
                                'confirmed',
                                'rejected',
                                'extraction_pending',
                                'extraction_failed',
                                'extraction_completed',
                              ].includes(evi.status) && (
                                <button
                                  className="btn-secondary text-sm py-2 px-4"
                                  disabled={extractingId === evi.id}
                                  onClick={() => void handleExtractEvidence(evi.id)}
                                  aria-label={`Run AI Extraction for ${evi.fileName ?? 'evidence'}`}
                                >
                                  {extractingId === evi.id
                                    ? 'Extracting…'
                                    : evi.aiLogs.length > 0
                                      ? 'Run AI Extraction Again'
                                      : 'Run AI Extraction'}
                                </button>
                              )}
                          </div>
                          {evi.aiLogs.length > 0 && (
                            <section className="pt-4 space-y-4" aria-label="AI extraction history">
                              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
                                <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                                  AI extraction creates proposals only
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                                  Review and correct each item before confirmation. Gemini does not approve contributions or calculate payouts.
                                </p>
                              </div>
                              {evi.aiLogs.map((attempt) => {
                                let summary: string | null = null;
                                try {
                                  const output: unknown = attempt.outputJson
                                    ? JSON.parse(attempt.outputJson)
                                    : null;
                                  if (
                                    output &&
                                    typeof output === 'object' &&
                                    'summary' in output &&
                                    typeof output.summary === 'string'
                                  ) {
                                    summary = output.summary;
                                  }
                                } catch {
                                  summary = null;
                                }
                                const hasDateWarning = attempt.contributions.some((contribution) =>
                                  getContributionDateWarning(contribution.flagsJson)
                                );
                                return (
                                  <div key={attempt.id} className="space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                                        Attempt {attempt.attempt} · {attempt.modelName} ·{' '}
                                        {attempt.status === 'success' && hasDateWarning
                                          ? 'completed with warnings'
                                          : attempt.status}
                                      </p>
                                      <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                                        {new Date(attempt.createdAt).toLocaleString()}
                                        {attempt.errorCategory ? ` · ${attempt.errorCategory}` : ''}
                                      </p>
                                    </div>
                                    {summary && (
                                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                        {summary}
                                      </p>
                                    )}
                                    {attempt.contributions.map((contribution) => {
                                      const draft = contributionDrafts[contribution.id];
                                      const uncertainties = getContributionWarnings(
                                        contribution.flagsJson
                                      ).filter(
                                        (warning) =>
                                          !warning.startsWith(
                                            DATE_INTERPRETATION_WARNING_PREFIX
                                          )
                                      );
                                      const dateWarning = getContributionDateWarning(
                                        contribution.flagsJson
                                      );
                                      const currentType =
                                        draft?.contributionType ??
                                        contribution.contributionType ??
                                        'other';
                                      return (
                                        <div
                                          key={contribution.id}
                                          className="rounded-xl border p-4 space-y-3"
                                          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                                        >
                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                                              {contribution.member?.name ??
                                                contribution.memberIdentifier ??
                                                'Unresolved member'}{' '}
                                              · {contribution.status}
                                            </p>
                                            <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                                              {Math.round(contribution.confidence * 100)}% model confidence · {contribution.identityMatchStatus}
                                            </p>
                                          </div>
                                          <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                            {contribution.description}
                                          </p>
                                          {dateWarning && (
                                            <p
                                              className="flex items-start gap-2 rounded-lg border p-3 text-xs"
                                              role="alert"
                                              style={{
                                                borderColor: 'var(--border)',
                                                background: 'var(--accent-subtle)',
                                                color: 'var(--text)',
                                              }}
                                            >
                                              <AlertTriangle
                                                size={15}
                                                aria-hidden="true"
                                                className="mt-0.5 shrink-0"
                                              />
                                              <span>{dateWarning}</span>
                                            </p>
                                          )}
                                          {contribution.sourceReference && (
                                            <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                              Source: {contribution.sourceReference}
                                            </p>
                                          )}
                                          {uncertainties.length > 0 && (
                                            <ul className="list-disc pl-5 text-xs" style={{ color: 'var(--muted)' }}>
                                              {uncertainties.map((uncertainty, index) => (
                                                <li key={`${contribution.id}-uncertainty-${index}`}>
                                                  {uncertainty}
                                                </li>
                                              ))}
                                            </ul>
                                          )}
                                          {canReviewEvidence && contribution.status === 'pending' && (
                                            <div className="grid gap-2 sm:grid-cols-2">
                                              <label className="text-xs" style={{ color: 'var(--muted)' }}>
                                                Assign squad member
                                                <select
                                                  value={
                                                    draft?.memberId ??
                                                    contribution.memberId ??
                                                    ''
                                                  }
                                                  onChange={(event) =>
                                                    setContributionDrafts((current) => ({
                                                      ...current,
                                                      [contribution.id]: {
                                                        memberId: event.target.value,
                                                        contributionType: currentType,
                                                        description:
                                                          draft?.description ??
                                                          contribution.description ??
                                                          '',
                                                        sourceReference:
                                                          draft?.sourceReference ??
                                                          contribution.sourceReference ??
                                                          '',
                                                        contributionDate:
                                                          draft?.contributionDate ??
                                                          (contribution.contributionDate
                                                            ? new Date(contribution.contributionDate)
                                                                .toISOString()
                                                                .slice(0, 10)
                                                            : ''),
                                                      },
                                                    }))
                                                  }
                                                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                                                  style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' }}
                                                >
                                                  <option value="">Unresolved</option>
                                                  {squadMembers.map((member) => (
                                                    <option key={member.userId} value={member.userId}>
                                                      {member.user.name ?? member.user.email}
                                                    </option>
                                                  ))}
                                                </select>
                                              </label>
                                              <label className="text-xs" style={{ color: 'var(--muted)' }}>
                                                Contribution type
                                                <select
                                                  value={currentType}
                                                  onChange={(event) =>
                                                    setContributionDrafts((current) => ({
                                                      ...current,
                                                      [contribution.id]: {
                                                        memberId:
                                                          draft?.memberId ??
                                                          contribution.memberId ??
                                                          '',
                                                        contributionType: event.target.value,
                                                        description:
                                                          draft?.description ??
                                                          contribution.description ??
                                                          '',
                                                        sourceReference:
                                                          draft?.sourceReference ??
                                                          contribution.sourceReference ??
                                                          '',
                                                        contributionDate:
                                                          draft?.contributionDate ??
                                                          (contribution.contributionDate
                                                            ? new Date(contribution.contributionDate)
                                                                .toISOString()
                                                                .slice(0, 10)
                                                            : ''),
                                                      },
                                                    }))
                                                  }
                                                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                                                  style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' }}
                                                >
                                                  {['code', 'design', 'research', 'documentation', 'testing', 'management', 'other'].map((type) => (
                                                    <option key={type} value={type}>{type}</option>
                                                  ))}
                                                </select>
                                              </label>
                                              <label className="text-xs sm:col-span-2" style={{ color: 'var(--muted)' }}>
                                                Corrected contribution description
                                                <textarea
                                                  value={draft?.description ?? contribution.description ?? ''}
                                                  onChange={(event) =>
                                                    setContributionDrafts((current) => ({
                                                      ...current,
                                                      [contribution.id]: {
                                                        memberId:
                                                          draft?.memberId ??
                                                          contribution.memberId ??
                                                          '',
                                                        contributionType: currentType,
                                                        description: event.target.value,
                                                        sourceReference:
                                                          draft?.sourceReference ??
                                                          contribution.sourceReference ??
                                                          '',
                                                        contributionDate:
                                                          draft?.contributionDate ??
                                                          (contribution.contributionDate
                                                            ? new Date(contribution.contributionDate)
                                                                .toISOString()
                                                                .slice(0, 10)
                                                            : ''),
                                                      },
                                                    }))
                                                  }
                                                  rows={2}
                                                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                                                  style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' }}
                                                />
                                              </label>
                                              <label className="text-xs" style={{ color: 'var(--muted)' }}>
                                                Source reference
                                                <input
                                                  value={draft?.sourceReference ?? contribution.sourceReference ?? ''}
                                                  onChange={(event) =>
                                                    setContributionDrafts((current) => ({
                                                      ...current,
                                                      [contribution.id]: {
                                                        memberId:
                                                          draft?.memberId ??
                                                          contribution.memberId ??
                                                          '',
                                                        contributionType: currentType,
                                                        description:
                                                          draft?.description ??
                                                          contribution.description ??
                                                          '',
                                                        sourceReference: event.target.value,
                                                        contributionDate:
                                                          draft?.contributionDate ??
                                                          (contribution.contributionDate
                                                            ? new Date(contribution.contributionDate)
                                                                .toISOString()
                                                                .slice(0, 10)
                                                            : ''),
                                                      },
                                                    }))
                                                  }
                                                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                                                  style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' }}
                                                />
                                              </label>
                                              <label className="text-xs" style={{ color: 'var(--muted)' }}>
                                                Contribution date
                                                <input
                                                  type="date"
                                                  value={
                                                    draft?.contributionDate ??
                                                    (contribution.contributionDate
                                                      ? new Date(contribution.contributionDate)
                                                          .toISOString()
                                                          .slice(0, 10)
                                                      : '')
                                                  }
                                                  onChange={(event) =>
                                                    setContributionDrafts((current) => ({
                                                      ...current,
                                                      [contribution.id]: {
                                                        memberId:
                                                          draft?.memberId ??
                                                          contribution.memberId ??
                                                          '',
                                                        contributionType: currentType,
                                                        description:
                                                          draft?.description ??
                                                          contribution.description ??
                                                          '',
                                                        sourceReference:
                                                          draft?.sourceReference ??
                                                          contribution.sourceReference ??
                                                          '',
                                                        contributionDate: event.target.value,
                                                      },
                                                    }))
                                                  }
                                                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                                                  style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' }}
                                                />
                                              </label>
                                              <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
                                                {draft && (
                                                  <button
                                                    className="btn-secondary text-sm py-2 px-4"
                                                    disabled={
                                                      reviewingContributionId === contribution.id
                                                    }
                                                    onClick={() =>
                                                      void handleContributionReview(
                                                        contribution,
                                                        'pending'
                                                      )
                                                    }
                                                  >
                                                    {reviewingContributionId === contribution.id
                                                      ? 'Saving…'
                                                      : 'Save corrections'}
                                                  </button>
                                                )}
                                                <button
                                                  className="btn-3d btn-3d-sm"
                                                  disabled={reviewingContributionId === contribution.id}
                                                  onClick={() =>
                                                    void handleContributionReview(contribution, 'confirmed')
                                                  }
                                                >
                                                  {reviewingContributionId === contribution.id
                                                    ? 'Saving…'
                                                    : 'Confirm contribution'}
                                                </button>
                                                <button
                                                  className="btn-secondary text-sm py-2 px-4"
                                                  disabled={reviewingContributionId === contribution.id}
                                                  onClick={() =>
                                                    void handleContributionReview(contribution, 'rejected')
                                                  }
                                                >
                                                  Reject proposal
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                          {contribution.reviewedAt && (
                                            <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                                              Reviewed by {contribution.reviewedBy?.name ?? 'Squad approver'} on{' '}
                                              {new Date(contribution.reviewedAt).toLocaleString()}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </section>
                          )}
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
