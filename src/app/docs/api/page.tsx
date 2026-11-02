import type { Metadata } from 'next';
import Link from 'next/link';
import { Terminal, ArrowLeft, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'API Reference | Documentation | MicroSplit AI',
  description: 'REST API documentation for squad management, split calculation, evidence hashing, and batch payouts.',
  alternates: {
    canonical: 'https://microsplit.ai/docs/api',
  },
  openGraph: {
    title: 'API Reference — MicroSplit AI Documentation',
    description: 'REST endpoints and schemas for programmatic revenue splitting.',
    url: 'https://microsplit.ai/docs/api',
  },
};

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F9D8A] hover:underline mb-8"
        >
          <ArrowLeft size={16} />
          Back to Documentation
        </Link>

        {/* Hero banner */}
        <div className="bg-[#0B1F3A] text-white rounded-3xl p-8 sm:p-12 mb-10 shadow-xl border border-[#102C4D]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F9D8A]/20 border border-[#0F9D8A]/40 text-[#DDF7F3] text-xs font-bold uppercase tracking-wider mb-4">
            <Terminal size={14} className="text-[#0F9D8A]" />
            REST v1.0
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-white">
            MicroSplit AI API Reference
          </h1>
          <p className="text-base text-slate-300 max-w-2xl leading-relaxed">
            All API endpoints accept and return JSON payloads. Rate limits are applied per client IP using sliding windows.
          </p>
        </div>

        {/* Endpoints */}
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">POST</span>
              <code className="text-sm font-bold text-[#0B1F3A]">/api/split-runs</code>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Executes a zero-loss attribution calculation across squad members and queues the split run for approval.
            </p>
            <div className="bg-[#07172B] text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto">
              <pre>{`{
  "squadId": "sqd_1",
  "poolMinor": 100000,
  "currency": "USD",
  "ruleConfig": {
    "consistency_percent": 5,
    "streak_cap_days": 100
  },
  "memberSplits": [
    { "memberId": "mem_1", "percentage": 40, "streakDays": 45 },
    { "memberId": "mem_2", "percentage": 30, "streakDays": 12 },
    { "memberId": "mem_3", "percentage": 30, "streakDays": 0 }
  ]
}`}</pre>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800">GET</span>
              <code className="text-sm font-bold text-[#0B1F3A]">/api/squads</code>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Returns all active squads, member counts, total settlements, and base currency.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">POST</span>
              <code className="text-sm font-bold text-[#0B1F3A]">/api/contact</code>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Submits a support inquiry ticket. Sanitized against XSS and rate limited to 5 requests per 5 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
