'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Reveal, Card, MoneyChip } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/lib/date-format';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
} from 'lucide-react';
import StreakHeatmap from '@/components/StreakHeatmap';
import FocusSessionWidget from '@/components/FocusSessionWidget';
import {
  getCurrentUser,
  isDemoUser,
  getStoredSplitRuns,
  getStoredSquads,
} from '@/lib/client-storage';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface StatementLine {
  id: string;
  runId: string;
  runStatus: string;
  createdAt: string;
  poolMinor: number;
  amountMinor: number;
  currency: string;
  squadName: string;
  contributionSummary: string;
  payoutStatus: string;
}

export default function StatementsPage() {
  const [lines, setLines] = useState<StatementLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [member, setMember] = useState({
    id: 'usr_1',
    name: 'Alex Rivera',
    email: 'alex@microsplit.demo',
  });

  useEffect(() => {
    let active = true;
    const user = getCurrentUser();
    const isDemo = isDemoUser();

    if (user) {
      setMember({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    }

    if (isDemo) {
      fetch('/api/statements')
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok || !result.success) {
            throw new Error(result.error || 'Unable to load your statement');
          }
          if (active) setLines(Array.isArray(result.data) ? result.data : []);
        })
        .catch((error: unknown) => {
          if (active) {
            setLoadError(error instanceof Error ? error.message : 'Unable to load your statement');
          }
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    } else {
      // Custom user: load their stored split runs
      const userRuns = getStoredSplitRuns();
      const userSquads = getStoredSquads();
      const generatedLines: StatementLine[] = [];
      userRuns.forEach((r: any) => {
        const sq = userSquads.find((s) => s.id === r.squadId);
        const myLine = r.lines?.find(
          (l: any) =>
            (user?.email && l.payoutReceiver?.toLowerCase() === user.email.toLowerCase()) ||
            l.memberName === user?.name
        );
        if (myLine) {
          generatedLines.push({
            id: myLine.id || `line_${Date.now()}`,
            runId: r.id,
            runStatus: r.status || 'paid',
            createdAt: r.createdAt || new Date().toISOString(),
            poolMinor: r.totalPoolMinor || 0,
            amountMinor: myLine.allocatedAmountMinor || 0,
            currency: r.currency || 'USD',
            squadName: sq?.name || 'Squad Workspace',
            contributionSummary: myLine.contributionSummary || 'Verified squad contribution',
            payoutStatus: r.status === 'paid' ? 'success' : 'processing',
          });
        }
      });
      setLines(generatedLines);
      setIsLoading(false);
    }

    return () => {
      active = false;
    };
  }, []);

  const totalEarned = lines.reduce((sum, line) => sum + line.amountMinor, 0);
  const rootRef = useRef<HTMLDivElement>(null);

  // GSAP entrance + micro-interactions (skipped when the user prefers reduced motion)
  useGSAP(
    () => {
      if (isLoading || !rootRef.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const q = gsap.utils.selector(rootRef);

        // 1. Header: title, subtitle and button rise in one after another
        gsap.from(q('.st-head > *'), {
          y: 28, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12,
        });

        // 2. Avatar springs in; identity text slides after it
        gsap.from(q('.st-avatar'), {
          scale: 0, rotate: -120, duration: 0.9, ease: 'back.out(1.8)', delay: 0.25,
        });
        gsap.from(q('.st-identity > *'), {
          x: -18, opacity: 0, duration: 0.5, ease: 'power2.out', stagger: 0.1, delay: 0.45,
        });

        // 3. Stat tiles cascade up
        gsap.from(q('.st-tile'), {
          y: 36, opacity: 0, scale: 0.92, duration: 0.65, ease: 'back.out(1.4)',
          stagger: 0.1, delay: 0.5, clearProps: 'transform,opacity,scale',
        });

        // 4. Count-up for the numbers
        const earned = q('.st-count-money')[0] as HTMLElement | undefined;
        if (earned) {
          const counter = { v: 0 };
          earned.textContent = formatMoney(0);
          gsap.to(counter, {
            v: totalEarned, duration: 1.6, delay: 0.7, ease: 'power2.out',
            onUpdate: () => { earned.textContent = formatMoney(Math.round(counter.v)); },
            onComplete: () => { earned.textContent = formatMoney(totalEarned); },
          });
        }
        const linesEl = q('.st-count-lines')[0] as HTMLElement | undefined;
        if (linesEl) {
          const counter = { v: 0 };
          linesEl.textContent = '0';
          gsap.to(counter, {
            v: lines.length, duration: 1, delay: 0.8, ease: 'power1.out', snap: { v: 1 },
            onUpdate: () => { linesEl.textContent = String(Math.round(counter.v)); },
            onComplete: () => { linesEl.textContent = String(lines.length); },
          });
        }

        // 5. Tiles lift on hover
        const tiles = q('.st-tile') as HTMLElement[];
        const cleanups = tiles.map((tile) => {
          const enter = () => gsap.to(tile, { y: -6, scale: 1.04, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
          const leave = () => gsap.to(tile, { y: 0, scale: 1, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
          tile.addEventListener('mouseenter', enter);
          tile.addEventListener('mouseleave', leave);
          return () => {
            tile.removeEventListener('mouseenter', enter);
            tile.removeEventListener('mouseleave', leave);
          };
        });

        // 6. Earnings rows slide in as the list scrolls into view
        const rows = q('.st-row');
        if (rows.length > 0) {
          gsap.from(rows, {
            x: -28, opacity: 0, duration: 0.55, ease: 'power2.out', stagger: 0.08,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: q('.st-rows')[0], start: 'top 88%', once: true },
          });
        }

        return () => cleanups.forEach((fn) => fn());
      });
      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [isLoading, totalEarned, lines.length] }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading your statement...</p>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Reveal>
          <div className="st-head flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
                Statement
              </h1>
              <p className="text-base mt-1" style={{ color: 'var(--muted)' }}>
                Earnings summary for {member.name}
              </p>
            </div>
            <button className="btn-secondary text-sm">
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </Reveal>

        {/* Member card */}
        <Reveal delay={0.1}>
          <Card elevated padding="lg" className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="st-avatar w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
              >
                {member.name.charAt(0)}
              </div>
              <div className="st-identity">
                <h2 className="text-xl font-bold text-[var(--primary)]">{member.name}</h2>
                <p className="text-sm text-[var(--text)]">{member.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="st-tile text-center p-4 rounded-xl bg-[var(--background)]">
                <p className="st-count-money text-2xl font-black tabular-nums text-[var(--accent)]">
                  {formatMoney(totalEarned)}
                </p>
                <p className="text-xs font-semibold mt-1 text-[var(--accent)]">Total earned</p>
              </div>
              <div className="st-tile text-center p-4 rounded-xl bg-[var(--background)]">
                <p className="text-2xl font-black text-[var(--accent)]">
                  0 <span className="text-xs">days</span>
                </p>
                <p className="text-xs font-semibold mt-1 text-[var(--accent)]">Verified streak</p>
              </div>
              <div className="st-tile text-center p-4 rounded-xl bg-[var(--background)] border border-[var(--text)]/50">
                <p className="st-count-lines text-2xl font-black text-[var(--accent)]">{lines.length}</p>
                <p className="text-xs font-semibold mt-1 text-[var(--accent)]">Split lines</p>
              </div>
              <div className="st-tile text-center p-4 rounded-xl bg-[var(--background)]">
                <p className="text-2xl font-black text-[var(--accent)]">1 used</p>
                <p className="text-xs font-semibold mt-1 text-[var(--accent)]">Freeze days</p>
              </div>
            </div>
          </Card>
        </Reveal>

        {/* Consistency Streak Heatmap */}
        <Reveal delay={0.12}>
          <StreakHeatmap
            memberName={member.name}
            streakDays={0}
            freezeDaysUsed={0}
            streakCapDays={100}
            timezone="America/Los_Angeles"
          />
        </Reveal>

        {/* Opt-in Focus Sessions Component */}
        <Reveal delay={0.14}>
          <FocusSessionWidget memberId={member.id} initialOptIn={false} />
        </Reveal>

        {/* Earnings table */}
        <Reveal delay={0.15}>
          <Card padding="none">
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Earnings History</h3>
            </div>
            <div className="st-rows divide-y" style={{ borderColor: 'var(--border)' }}>
              {lines.map((line) => {
                const isPaid = line.payoutStatus === 'success';
                const needsAttention = [
                  'failed',
                  'unclaimed',
                  'returned',
                  'blocked',
                ].includes(line.payoutStatus);
                return (
                  <div key={line.id} className="st-row px-6 py-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: needsAttention ? 'var(--primary-subtle)' : 'var(--accent-subtle)',
                        color: isPaid ? 'var(--accent)' : needsAttention ? 'var(--primary)' : 'var(--muted)',
                      }}>
                      {isPaid ? <CheckCircle2 size={14} /> : needsAttention ? <AlertTriangle size={14} /> : <Clock size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                        {line.contributionSummary}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted-light)' }}>
                        {line.squadName} · {line.runStatus.replaceAll('_', ' ')} · {formatDate(line.createdAt)}
                      </p>
                    </div>
                    <MoneyChip
                      amount={formatMoney(line.amountMinor, line.currency)}
                      status={isPaid ? 'paid' : needsAttention ? 'failed' : 'pending'}
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>
            {loadError && (
              <p role="alert" className="px-6 py-4 text-sm text-[var(--primary)]">
                {loadError}
              </p>
            )}
          </Card>
        </Reveal>
      </div>
    </div>
  );
}