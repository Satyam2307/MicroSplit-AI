'use client';

import { useState, useEffect } from 'react';
import { Card, StatusChip } from '@/components/ui';
import {
  Clock,
  Play,
  Square,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Lock,
  Link as LinkIcon,
  CheckCircle2,
} from 'lucide-react';
import { mockFocusSessions, MockFocusSession } from '@/lib/mock-data';

interface FocusSessionWidgetProps {
  memberId: string;
  initialOptIn?: boolean;
}

export default function FocusSessionWidget({
  memberId,
  initialOptIn = true,
}: FocusSessionWidgetProps) {
  const [optIn, setOptIn] = useState(initialOptIn);
  const [sessions, setSessions] = useState<MockFocusSession[]>(
    mockFocusSessions.filter((s) => s.memberId === memberId)
  );
  const [activeSession, setActiveSession] = useState<MockFocusSession | null>(
    sessions.find((s) => s.endedAt === null) || null
  );

  const [taskId, setTaskId] = useState('TASK-112');
  const [taskTitle, setTaskTitle] = useState('Build streak heatmap UI');
  const [source, setSource] = useState<'manual' | 'linked_evidence'>('manual');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  // Timer tick for active session
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeSession) {
      const startTime = new Date(activeSession.startedAt).getTime();
      timer = setInterval(() => {
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [activeSession]);

  const handleToggleOptIn = async () => {
    const nextVal = !optIn;
    try {
      const res = await fetch('/api/members/opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, optIn: nextVal }),
      });
      const data = await res.json();
      if (data.success) {
        setOptIn(nextVal);
        setMessage(data.message);
        setTimeout(() => setMessage(null), 4000);
      }
    } catch {
      setOptIn(nextVal);
    }
  };

  const handleStart = async () => {
    if (!optIn) {
      alert('Focus sessions require explicit opt-in.');
      return;
    }

    try {
      const res = await fetch('/api/focus-sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          taskId,
          taskTitle,
          source,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to start session');
        return;
      }
      setActiveSession(json.data);
      setSessions([json.data, ...sessions]);
    } catch {
      // Fallback in-memory
      const newSession: MockFocusSession = {
        id: `foc_${Date.now()}`,
        memberId,
        memberName: 'Member',
        taskId,
        taskTitle,
        startedAt: new Date().toISOString(),
        endedAt: null,
        source,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      setActiveSession(newSession);
      setSessions([newSession, ...sessions]);
    }
  };

  const handleStop = async () => {
    if (!activeSession) return;
    try {
      const res = await fetch(`/api/focus-sessions/${activeSession.id}/stop`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        setActiveSession(null);
        setSessions(sessions.map((s) => (s.id === json.data.id ? json.data : s)));
      }
    } catch {
      const stopped = {
        ...activeSession,
        endedAt: new Date().toISOString(),
        durationMinutes: Math.round(elapsedSeconds / 60),
        status: 'completed' as const,
      };
      setActiveSession(null);
      setSessions(sessions.map((s) => (s.id === stopped.id ? stopped : s)));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/focus-sessions/${id}`, { method: 'DELETE' });
    } catch {
      // Ignore
    }
    setSessions(sessions.filter((s) => s.id !== id));
    if (activeSession?.id === id) setActiveSession(null);
  };

  const formatElapsed = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card elevated padding="lg" className="mb-8">
      {/* Header & Opt-in Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-[var(--accent)]" />
            <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              Focus Sessions (Opt-in)
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--background)] text-[var(--accent)] font-semibold">
              Evidence Trail Only
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Record deep work intervals. Sessions contribute to audit evidence, not pay amounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={optIn}
              onChange={handleToggleOptIn}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
          </label>
          <span className="text-xs font-semibold" style={{ color: optIn ? 'var(--text)' : 'var(--muted-light)' }}>
            {optIn ? 'Opted In' : 'Opted Out'}
          </span>
        </div>
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="p-4 my-4 rounded-xl bg-[var(--background)] border border-[var(--text)]/40">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="text-[var(--accent)] flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-[var(--primary)]">
              Privacy Protection Guarantee
            </p>
            <p style={{ color: 'var(--muted)' }}>
              We store <strong>only</strong>: your member ID, task ID, started time, ended time, and source. We <strong>never</strong> capture screen content, keystrokes, window titles, or background processes. You have full right to view and permanently delete your session history at any time.
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-3 mb-4 rounded-lg bg-[var(--background)] text-[var(--accent)] text-xs font-bold flex items-center gap-2 border border-[var(--accent)]/20">
          <CheckCircle2 size={14} />
          <span>{message}</span>
        </div>
      )}

      {/* Active Session Timer / Start Form */}
      {optIn ? (
        <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--border)] mb-6">
          {activeSession ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-block px-2 py-0.5 text-xs font-bold rounded-md bg-[var(--primary)] text-white animate-pulse mb-2">
                  RECORDING IN PROGRESS
                </span>
                <h4 className="text-base font-bold text-[var(--primary)]">
                  {activeSession.taskTitle}
                </h4>
                <p className="text-xs font-mono text-[var(--text)]">
                  {activeSession.taskId} &bull; Started {new Date(activeSession.startedAt).toLocaleTimeString()}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-3xl font-mono font-black tracking-wider text-[var(--accent)]">
                  {formatElapsed(elapsedSeconds)}
                </div>
                <button
                  onClick={handleStop}
                  className="bg-[var(--primary)] hover:bg-[var(--primary)] text-white flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-xs"
                >
                  <Square size={14} />
                  Stop Session
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Task ID & Title
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={taskId}
                    onChange={(e) => setTaskId(e.target.value)}
                    className="w-28 px-3 py-2 text-xs font-mono rounded-lg border border-[var(--text)] bg-white text-[var(--primary)] focus:outline-none focus:border-[var(--accent)]"
                    placeholder="TASK-101"
                  />
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-[var(--text)] bg-white text-[var(--primary)] focus:outline-none focus:border-[var(--accent)]"
                    placeholder="What are you working on?"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as 'manual' | 'linked_evidence')}
                  className="px-3 py-2 text-xs rounded-lg border border-[var(--text)] bg-white text-[var(--primary)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="manual">Manual timer</option>
                  <option value="linked_evidence">Linked deliverable</option>
                </select>
              </div>

              <button
                onClick={handleStart}
                className="btn-primary flex items-center gap-2 text-xs font-bold px-5 py-2.5 h-[38px] rounded-lg shadow-xs"
                style={{ background: 'var(--accent)' }}
              >
                <Play size={14} />
                Start Focus
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-[var(--text)] rounded-xl border border-dashed border-[var(--text)] mb-6 bg-[var(--background)]">
          <Lock size={20} className="mx-auto mb-2 text-[var(--text)]" />
          Focus sessions are disabled. Toggle the switch above to opt in.
        </div>
      )}

      {/* Session History & Deletion Rights */}
      <div>
        <h4 className="text-sm font-bold text-[var(--primary)] mb-3 flex items-center justify-between">
          <span>Session History ({sessions.length})</span>
          <span className="text-xs font-normal text-[var(--text)]">Members have full deletion rights</span>
        </h4>

        {sessions.length === 0 ? (
          <p className="text-xs text-[var(--text)]">No focus sessions recorded yet.</p>
        ) : (
          <div className="divide-y divide-[var(--text)] border border-[var(--text)] rounded-xl overflow-hidden bg-white">
            {sessions.map((s) => (
              <div key={s.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-[var(--background)] transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-[var(--primary)]">{s.taskId}</span>
                    <span className="text-[var(--primary)] font-medium">{s.taskTitle}</span>
                    {s.conflictFlag && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--background)] text-[var(--primary)]">
                        <AlertTriangle size={11} />
                        Conflict: &gt;16h Threshold
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--text)] text-[11px]">
                    {new Date(s.startedAt).toLocaleDateString()} &bull;{' '}
                    {s.durationMinutes ? `${Math.floor(s.durationMinutes / 60)}h ${s.durationMinutes % 60}m` : 'In progress'}{' '}
                    &bull; Source: <span className="font-mono">{s.source}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      s.status === 'approved'
                        ? 'bg-[var(--background)] text-[var(--accent)]'
                        : s.status === 'disputed'
                        ? 'bg-[var(--background)] text-[var(--primary)]'
                        : 'bg-[var(--background)] text-[var(--accent)]'
                    }`}
                  >
                    {s.status}
                  </span>
                  <button
                    onClick={() => handleDelete(s.id)}
                    title="Delete session"
                    className="p-1.5 text-[var(--text)] hover:text-[var(--primary)] hover:bg-[var(--background)] rounded transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
