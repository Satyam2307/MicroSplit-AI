import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ArrowLeft, ArrowRight, Zap, CheckCircle2, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Getting Started Guide | Documentation | MicroSplit AI',
  description: 'Learn how to create a squad, upload contribution evidence, calculate zero-loss revenue splits, and dispatch batch payouts.',
  alternates: {
    canonical: 'https://microsplit.ai/docs',
  },
  openGraph: {
    title: 'Getting Started Guide — MicroSplit AI Documentation',
    description: 'Complete guide to squad creation, fair revenue attribution, and automated settlements.',
    url: 'https://microsplit.ai/docs',
  },
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F9D8A] hover:underline mb-8"
        >
          <ArrowLeft size={16} />
          Back to Overview
        </Link>

        {/* Hero banner */}
        <div className="bg-[#0B1F3A] text-white rounded-3xl p-8 sm:p-12 mb-10 shadow-xl border border-[#102C4D]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F9D8A]/20 border border-[#0F9D8A]/40 text-[#DDF7F3] text-xs font-bold uppercase tracking-wider mb-4">
            <BookOpen size={14} className="text-[#0F9D8A]" />
            Documentation Hub
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-white">
            Getting Started with MicroSplit AI
          </h1>
          <p className="text-base text-slate-300 max-w-2xl leading-relaxed">
            A step-by-step walkthrough for configuring squads, importing contribution evidence, verifying mathematical proofs, and triggering zero-loss PayPal batch disbursements.
          </p>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Link
            href="/docs/api"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#0F9D8A]/50 hover:shadow-md transition-all group"
          >
            <span className="text-xs font-bold text-[#0F9D8A] uppercase tracking-wider">REST Endpoints</span>
            <h3 className="text-base font-bold text-[#0B1F3A] mt-1 group-hover:text-[#0F9D8A] flex items-center justify-between">
              API Reference
              <ArrowRight size={16} className="text-[#0F9D8A]" />
            </h3>
            <p className="text-xs text-slate-500 mt-1">Explore payload schemas, rate limits, and authentication headers.</p>
          </Link>

          <Link
            href="/docs/arch"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#0F9D8A]/50 hover:shadow-md transition-all group"
          >
            <span className="text-xs font-bold text-[#0F9D8A] uppercase tracking-wider">Algorithm</span>
            <h3 className="text-base font-bold text-[#0B1F3A] mt-1 group-hover:text-[#0F9D8A] flex items-center justify-between">
              Deterministic Math Proofs
              <ArrowRight size={16} className="text-[#0F9D8A]" />
            </h3>
            <p className="text-xs text-slate-500 mt-1">Proof of largest-remainder rounding with 0.00 remainder invariant.</p>
          </Link>
        </div>

        {/* Steps */}
        <div className="space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm text-slate-700 leading-relaxed">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-7 h-7 rounded-full bg-[#0F9D8A] text-white flex items-center justify-center font-bold text-xs">1</span>
              <h2 className="text-lg font-bold text-[#0B1F3A]">Create Your Squad</h2>
            </div>
            <p className="text-sm pl-10 text-slate-600">
              Navigate to <Link href="/squads/new" className="text-[#0F9D8A] font-semibold hover:underline">Create Squad</Link>. Set your squad currency (USD, EUR, GBP, or INR). Each member must enter and explicitly confirm their own PayPal email before payout; PayPal Sandbox payouts currently support USD only.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-7 h-7 rounded-full bg-[#0F9D8A] text-white flex items-center justify-center font-bold text-xs">2</span>
              <h2 className="text-lg font-bold text-[#0B1F3A]">Upload Evidence or Log Focus Hours</h2>
            </div>
            <p className="text-sm pl-10 text-slate-600">
              Import GitHub pull request links, invoices, or timesheets in <Link href="/evidence" className="text-[#0F9D8A] font-semibold hover:underline">Evidence Hub</Link>. Files are fingerprinted with SHA-256 for cryptographic integrity.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-7 h-7 rounded-full bg-[#0F9D8A] text-white flex items-center justify-center font-bold text-xs">3</span>
              <h2 className="text-lg font-bold text-[#0B1F3A]">Run the Revenue Split Engine</h2>
            </div>
            <p className="text-sm pl-10 text-slate-600">
              Define the settlement pool and bonus weights in <Link href="/splits/new" className="text-[#0F9D8A] font-semibold hover:underline">New Split Run</Link>. The engine outputs exact cent breakdowns with zero rounding loss.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-7 h-7 rounded-full bg-[#0F9D8A] text-white flex items-center justify-center font-bold text-xs">4</span>
              <h2 className="text-lg font-bold text-[#0B1F3A]">Approve &amp; Dispatch PayPal Batch</h2>
            </div>
            <p className="text-sm pl-10 text-slate-600">
              Approvers sign off on the split. The system triggers PayPal Batch API v1, settling all contributors simultaneously and committing the final hash to the audit ledger.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
