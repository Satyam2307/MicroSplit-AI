'use client';

import { useState } from 'react';
import { Card, StatusChip } from '@/components/ui';
import { Flame, Shield, Calendar, Info } from 'lucide-react';

interface StreakHeatmapProps {
  memberName: string;
  streakDays: number;
  freezeDaysUsed: number;
  streakCapDays?: number;
  timezone?: string;
}

export default function StreakHeatmap({
  memberName,
  streakDays,
  freezeDaysUsed,
  streakCapDays = 100,
  timezone = 'America/New_York',
}: StreakHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<{ date: string; status: string } | null>(null);

  // Generate 112 days of grid data for the activity heatmap (using deterministic anchor)
  const totalDays = 112; // 16 weeks of 7 days
  const anchorDate = new Date('2024-11-20T00:00:00.000Z');
  const days = Array.from({ length: totalDays }).map((_, idx) => {
    const d = new Date(anchorDate);
    d.setUTCDate(d.getUTCDate() - (totalDays - 1 - idx));
    const dateStr = d.toISOString().slice(0, 10);
    const dayDiff = totalDays - 1 - idx;

    // Simulate verified activity aligned with the member's streak
    let status: 'empty' | 'active' | 'frozen' = 'empty';
    if (dayDiff < streakDays) {
      // Within streak
      if (dayDiff === 14 && freezeDaysUsed > 0) {
        status = 'frozen';
      } else {
        status = 'active';
      }
    } else if (idx % 3 === 0) {
      status = 'active';
    }

    return {
      date: dateStr,
      status,
      dayDiff,
    };
  });

  const isCapped = streakDays >= streakCapDays;

  return (
    <Card elevated padding="lg" className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
          >
            <Flame size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                Consistency Streak
              </h3>
              {isCapped && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--background)] text-[var(--accent)] border border-[var(--text)]/40">
                  Cap Reached (100d)
                </span>
              )}
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Computed in member timezone: <span className="font-mono">{timezone}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-black font-mono text-[var(--accent)]">
              {streakDays} <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>days</span>
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Current verified streak
            </p>
          </div>
          <div
            className="h-8 w-px"
            style={{ background: 'var(--border)' }}
          />
          <div className="text-right">
            <p className="text-2xl font-black font-mono text-[var(--accent)]">
              {freezeDaysUsed} <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>used</span>
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Freeze days preserved
            </p>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 p-3 rounded-xl bg-[var(--background)]/40 border border-[var(--border)]">
          {days.map((day) => {
            let bg = 'var(--text)';
            let border = 'transparent';

            if (day.status === 'active') {
              bg = 'var(--status-success)'; // var(--accent)
            } else if (day.status === 'frozen') {
              bg = 'var(--accent)'; // var(--accent)
              border = '1px solid var(--accent)';
            }

            return (
              <div
                key={day.date}
                className="w-3.5 h-3.5 rounded-xs transition-transform hover:scale-125 cursor-pointer"
                style={{ background: bg, border }}
                onMouseEnter={() =>
                  setHoveredDay({
                    date: day.date,
                    status:
                      day.status === 'active'
                        ? 'Approved contribution verified'
                        : day.status === 'frozen'
                        ? 'Freeze day granted (streak preserved)'
                        : 'No approved activity',
                  })
                }
                onMouseLeave={() => setHoveredDay(null)}
              />
            );
          })}
        </div>
      </div>

      {/* Legend & Hover Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs mt-4 pt-3 border-t border-[var(--border)] gap-2">
        <div className="flex items-center gap-4 text-[var(--muted)]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-xs bg-[var(--text)]" />
            <span>No activity</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-xs bg-[var(--status-success)]" />
            <span>Approved contribution</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-xs bg-[var(--accent)]" />
            <span>Freeze day used</span>
          </div>
        </div>

        {hoveredDay ? (
          <div className="font-mono text-xs text-[var(--accent)] font-bold">
            {hoveredDay.date}: {hoveredDay.status}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[var(--muted-light)]">
            <Info size={13} />
            <span>Streaks reset if an unfrozen day has zero approved contributions</span>
          </div>
        )}
      </div>
    </Card>
  );
}
