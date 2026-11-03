import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Use | MicroSplit AI',
  description: 'Terms governing autonomous squad revenue attribution, zero-loss settlement rules, and batch dispatches.',
  alternates: {
    canonical: 'https://microsplit.ai/terms',
  },
  openGraph: {
    title: 'Terms of Use — MicroSplit AI',
    description: 'Terms governing squad revenue attribution and automated batch payouts.',
    url: 'https://microsplit.ai/terms',
  },
};

export default function TermsPage() {
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
            <FileText size={14} className="text-[#0F9D8A]" />
            Agreement &amp; Governance
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-white">
            Terms of Use
          </h1>
          <p className="text-base text-slate-300 max-w-2xl leading-relaxed">
            Effective Date: January 1, 2026. These terms govern your access to the MicroSplit AI attribution platform, deterministic math engines, and batch payout integrations.
          </p>
        </div>

        {/* Content sections */}
        <div className="space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#0B1F3A] mb-3">1. Scope of Service</h2>
            <p className="mb-4">
              MicroSplit AI provides software tooling for calculating multi-contributor revenue allocations down to integer cents using largest-remainder rounding algorithms. MicroSplit AI is a software provider and not a chartered bank or money transmitter. Payout dispatches are executed through certified third-party providers (e.g., PayPal).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1F3A] mb-3">2. Squad Governance &amp; Approvals</h2>
            <p className="mb-4">
              Each squad designates roles (Owner, Approver, Contributor, Viewer). Split distributions are final once approved by an authorized Approver or Owner. Squad members acknowledge that mathematical calculations follow explicit rules configured by squad owners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1F3A] mb-3">3. Cryptographic Audit Ledger</h2>
            <p className="mb-4">
              Every split run, approval event, and payout hash is recorded in an immutable, chained SHA-256 ledger. Modifying past transactions is cryptographically prevented. Users agree to rely on the ledger hash as canonical proof of settlement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1F3A] mb-3">4. Limitation of Liability</h2>
            <p className="text-sm">
              In no event shall MicroSplit AI Inc. be liable for indirect, punitive, or consequential damages resulting from third-party payment gateway outages or inaccuracies in user-provided payout recipient emails.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
