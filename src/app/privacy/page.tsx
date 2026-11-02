import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Lock, Eye, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | MicroSplit AI',
  description: 'Our commitment to zero surveillance, local privacy, and cryptographic data protection.',
  alternates: {
    canonical: 'https://microsplit.ai/privacy',
  },
  openGraph: {
    title: 'Privacy Policy — MicroSplit AI',
    description: 'Zero surveillance guarantee and cryptographic data protection.',
    url: 'https://microsplit.ai/privacy',
  },
};

export default function PrivacyPage() {
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
            <Shield size={14} className="text-[#0F9D8A]" />
            Trust &amp; Transparency
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-white">
            Privacy Policy &amp; Zero-Surveillance Guarantee
          </h1>
          <p className="text-base text-slate-300 max-w-2xl leading-relaxed">
            Effective Date: January 1, 2026. MicroSplit AI is architected with a non-negotiable premise: revenue attribution must be verifiable without intrusive workplace surveillance.
          </p>
        </div>

        {/* Content sections */}
        <div className="space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#0B1F3A] mb-3 flex items-center gap-2">
              <Lock size={18} className="text-[#0F9D8A]" />
              1. Non-Custodial &amp; Zero-Surveillance Architecture
            </h2>
            <p className="mb-4">
              MicroSplit AI does not record keystrokes, take periodic desktop screenshots, or track cursor coordinates. Focus session validation relies solely on opt-in, client-side aggregate metrics and deterministic cryptographic hashes.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>No keylogging or audio/video recording.</li>
              <li>Files uploaded as evidence are processed for cryptographic SHA-256 fingerprinting only.</li>
              <li>Attribution weights are derived by deterministic mathematical rules, not opaque black-box profiling.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1F3A] mb-3 flex items-center gap-2">
              <Eye size={18} className="text-[#0F9D8A]" />
              2. Information We Process
            </h2>
            <p className="mb-4">
              We process only the minimum information necessary to execute squad revenue splits and batch payouts:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                <p className="font-bold text-[#0B1F3A] mb-1">Squad &amp; Identity Data</p>
                <p className="text-xs text-slate-500">Squad name, member aliases, and payout recipient emails (e.g., PayPal email or wallet address).</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                <p className="font-bold text-[#0B1F3A] mb-1">Audit Ledger Entries</p>
                <p className="text-xs text-slate-500">Cryptographic hashes of contribution summaries and batch payout dispatches on our immutable ledger.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1F3A] mb-3">
              3. Third-Party Integrations &amp; PayPal Disbursements
            </h2>
            <p className="text-sm">
              When executing batch payouts via PayPal Batch API v1, necessary recipient identifiers (PayPal email and amount in minor currency units) are transmitted directly to PayPal via encrypted TLS 1.3 endpoints. MicroSplit AI never stores raw financial credit card credentials.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1F3A] mb-3">
              4. Contact Our Data Protection Team
            </h2>
            <p className="text-sm">
              If you have inquiries regarding privacy practices or wish to request data purging, please reach out to{' '}
              <a href="mailto:privacy@microsplit.ai" className="text-[#0F9D8A] font-semibold hover:underline">
                privacy@microsplit.ai
              </a>{' '}
              or via our <Link href="/contact" className="text-[#0F9D8A] font-semibold hover:underline">Contact Center</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
