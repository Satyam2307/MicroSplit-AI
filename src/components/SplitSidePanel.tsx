import { CheckCircle2, Circle, ShieldCheck, Lock, Scale, Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui';

type RuleType = 'fixed_percentage' | 'weighted_points' | 'tiered' | 'milestone';

interface SplitSidePanelProps {
  rule: RuleType;
  hasSquad: boolean;
  hasRevenue: boolean;
  poolLabel: string;
  memberCount: number;
  sharesValid: boolean;
  consistencyOn: boolean;
}

const methodInfo: Record<RuleType, { title: string; body: string; example: string }> = {
  fixed_percentage: {
    title: 'Fixed %',
    body: 'You decide each member’s percentage by hand. The shares must total exactly 100%.',
    example: 'Example: 40 / 30 / 20 / 10 on a $5,000 pool pays $2,000, $1,500, $1,000, $500.',
  },
  weighted_points: {
    title: 'Weighted Points',
    body: 'Give each member points. Their share is their points divided by everyone’s total points.',
    example: 'Example: 40, 30, 20 and 10 points give the same 40 / 30 / 20 / 10 split.',
  },
  tiered: {
    title: 'Tiered',
    body: 'Different splits apply to different revenue bands, so larger deals can be shared differently.',
    example: 'Example: the first $2,000 split evenly, anything above it favors the lead.',
  },
  milestone: {
    title: 'Milestone',
    body: 'A base split is paid first, then a bonus goes to members who completed a milestone.',
    example: 'Example: 80% shared by base shares, 20% shared among members who hit their milestone.',
  },
};

function CheckRow({ done, label, hint }: { done: boolean; label: string; hint?: string }) {
  return (
    <li className="flex items-start gap-2.5">
      {done ? (
        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--accent)]" />
      ) : (
        <Circle size={16} className="mt-0.5 shrink-0 text-[var(--muted)]" />
      )}
      <div className="min-w-0">
        <p
          className="text-xs font-bold"
          style={{ color: done ? 'var(--text)' : 'var(--muted)' }}
        >
          {label}
        </p>
        {hint && <p className="text-[11px] text-[var(--muted)]">{hint}</p>}
      </div>
    </li>
  );
}

export default function SplitSidePanel({
  rule,
  hasSquad,
  hasRevenue,
  poolLabel,
  memberCount,
  sharesValid,
  consistencyOn,
}: SplitSidePanelProps) {
  const info = methodInfo[rule];
  const allReady = hasSquad && hasRevenue && memberCount > 0 && sharesValid;

  return (
    <div className="space-y-4">
      {/* Ready-to-run checklist */}
      <Card padding="md" elevated>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[var(--text)]">Ready to run?</h3>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              color: allReady ? 'var(--accent)' : 'var(--muted)',
              background: allReady
                ? 'color-mix(in srgb, var(--accent) 14%, transparent)'
                : 'color-mix(in srgb, var(--text) 8%, transparent)',
              border: `1px solid ${
                allReady
                  ? 'color-mix(in srgb, var(--accent) 30%, transparent)'
                  : 'color-mix(in srgb, var(--text) 15%, transparent)'
              }`,
            }}
          >
            {allReady ? 'All set' : 'Action needed'}
          </span>
        </div>
        <ul className="space-y-2.5">
          <CheckRow done={hasSquad} label="Squad selected" />
          <CheckRow
            done={hasRevenue}
            label="Revenue event selected"
            hint={hasRevenue ? `${poolLabel} will be split` : 'Record revenue on the squad page'}
          />
          <CheckRow
            done={memberCount > 0}
            label={`${memberCount} ${memberCount === 1 ? 'member' : 'members'} in this squad`}
          />
          <CheckRow
            done={sharesValid}
            label={
              rule === 'weighted_points'
                ? 'Points added for members'
                : rule === 'milestone'
                  ? 'Base shares and bonuses set'
                  : 'Shares total exactly 100%'
            }
            hint={sharesValid ? undefined : 'Adjust the shares or use Split Evenly'}
          />
          <CheckRow
            done={consistencyOn}
            label={consistencyOn ? 'Consistency bonus on' : 'Consistency bonus off'}
            hint="Optional"
          />
        </ul>
      </Card>

      {/* How this method works */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb size={16} className="text-[var(--accent)]" />
          <h3 className="text-sm font-bold text-[var(--text)]">How {info.title} works</h3>
        </div>
        <p className="text-xs text-[var(--text)] leading-relaxed">{info.body}</p>
        <p
          className="mt-3 text-[11px] font-mono leading-relaxed rounded-lg px-3 py-2"
          style={{
            background: 'rgba(15, 157, 138, 0.12)',
            color: 'var(--text)',
            border: '1px solid rgba(15, 157, 138, 0.14)',
          }}
        >
          {info.example}
        </p>
      </Card>

      {/* Guarantees strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: <Scale size={15} />, label: 'Zero-cent loss' },
          { icon: <ShieldCheck size={15} />, label: 'Deterministic' },
          { icon: <Lock size={15} />, label: 'Audit ledger' },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-center"
            style={{
              background: 'rgba(15, 157, 138, 0.06)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
            }}
          >
            <span className="text-[var(--accent)]">{item.icon}</span>
            <span className="text-[10px] font-bold text-[var(--text)]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}