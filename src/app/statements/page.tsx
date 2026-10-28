'use client';

import { Reveal, Card, MoneyChip, StatusChip } from '@/components/ui';
import { mockUsers, mockSplitRuns, mockPayoutBatches } from '@/lib/mock-data';
import { formatMoney } from '@/lib/money';
import {
  User,
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  Download,
  Flame,
} from 'lucide-react';
import StreakHeatmap from '@/components/StreakHeatmap';
import FocusSessionWidget from '@/components/FocusSessionWidget';

export default function StatementsPage() {
  // Show statement for first user
  const member = mockUsers[1]; // Maya Chen
  const lines = mockSplitRuns.flatMap((r) =>
    r.lines.filter((l) => l.memberId === member.id).map((l) => ({ ...l, run: r }))
  );
  const payoutItems = mockPayoutBatches.flatMap((b) =>
    b.items.filter((i) => lines.some((l) => l.id === i.lineId))
  );
  const totalEarned = lines.reduce((s, l) => s + l.amountMinor, 0);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Reveal>
          <div className="flex items-center justify-between mb-8">
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
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
              >
                {member.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--primary)]">{member.name}</h2>
                <p className="text-sm text-[var(--text)]">{member.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-[var(--background)]">
                <p className="text-2xl font-black tabular-nums text-[var(--accent)]">
                  {formatMoney(totalEarned)}
                </p>
                <p className="text-xs font-semibold mt-1 text-[var(--accent)]">Total earned</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-[var(--background)]">
                <p className="text-2xl font-black text-[var(--accent)]">
                  100 <span className="text-xs">days</span>
                </p>
                <p className="text-xs font-semibold mt-1 text-[var(--accent)]">Verified streak</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-[var(--background)] border border-[var(--text)]/50">
                <p className="text-2xl font-black text-[var(--accent)]">{lines.length}</p>
                <p className="text-xs font-semibold mt-1 text-[var(--accent)]">Split lines</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-[var(--background)]">
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
            streakDays={100}
            freezeDaysUsed={1}
            streakCapDays={100}
            timezone="America/Los_Angeles"
          />
        </Reveal>

        {/* Opt-in Focus Sessions Component */}
        <Reveal delay={0.14}>
          <FocusSessionWidget memberId={member.id} initialOptIn={true} />
        </Reveal>

        {/* Earnings table */}
        <Reveal delay={0.15}>
          <Card padding="none">
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Earnings History</h3>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {lines.map((line) => {
                const payout = payoutItems.find((p) => p.lineId === line.id);
                return (
                  <div key={line.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: payout?.status === 'success' ? 'var(--accent-subtle)' : 'var(--accent-subtle)',
                        color: payout?.status === 'success' ? 'var(--accent)' : 'var(--accent)',
                      }}>
                      {payout?.status === 'success' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                        {line.rationale.contribution_summary}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted-light)' }}>
                        {(line.rationale.rule_type || 'fixed_percentage').replace('_', ' ')} &bull; {new Date(line.run.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <MoneyChip
                      amount={formatMoney(line.amountMinor)}
                      status={payout?.status === 'success' ? 'paid' : 'pending'}
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
