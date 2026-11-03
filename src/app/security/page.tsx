import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Lock, CheckCircle2, ArrowLeft, Key, Server, Terminal } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security Disclosures & Architecture | MicroSplit AI',
  description: 'Enterprise security standards, SOC-2 compliance posture, SHA-256 cryptographic audit trails, and vulnerability reporting.',
  alternates: {
    canonical: 'https://microsplit.ai/security',
  },
  openGraph: {
    title: 'Security Disclosures — MicroSplit AI',
    description: 'Cryptographic audit trails and non-custodial financial security architecture.',
    url: 'https://microsplit.ai/security',
  },
};

export default function SecurityPage() {
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
            <ShieldCheck size={14} className="text-[#0F9D8A]" />
            Enterprise-Grade Defenses
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-white">
            Security Disclosures &amp; Cryptographic Architecture
          </h1>
          <p className="text-base text-slate-300 max-w-2xl leading-relaxed">
            Every dollar split on MicroSplit AI is protected by zero-loss deterministic algorithms, cryptographic SHA-256 state chaining, and least-privilege role boundaries.
          </p>
        </div>

        {/* Content sections */}
        <div className="space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm text-slate-700 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#0B1F3A]/5 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-[#0F9D8A]/20 flex items-center justify-center text-[#0F9D8A] mb-4">
                <Lock size={20} />
              </div>
              <h3 className="font-bold text-[#0B1F3A] text-base mb-2">Zero-Cent Loss Math</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Calculations execute strictly in integer minor units (cents) using the largest-remainder method (Hare-Niemeyer quota). The sum of payouts equals 100% of the allocated pool with 0.00 remainder.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0B1F3A]/5 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-[#0F9D8A]/20 flex items-center justify-center text-[#0F9D8A] mb-4">
                <Server size={20} />
              </div>
              <h3 className="font-bold text-[#0B1F3A] text-base mb-2">Immutable SHA-256 Ledger</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every state transition links back to the preceding block hash. Any post-hoc tampering breaks the cryptographic chain and triggers an immediate verification alert.
              </p>
            </div>
          </div>

          <section>
            <h2 className="text-xl font-bold text-[#0B1F3A] mb-3">HTTP Security Headers &amp; Defenses</h2>
            <p className="text-sm mb-4">
              Our edge infrastructure enforces modern browser protections on every single request:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li><strong>HSTS:</strong> max-age=63072000; includeSubDomains; preload</li>
              <li><strong>X-Frame-Options:</strong> DENY (Clickjacking mitigation)</li>
              <li><strong>X-Content-Type-Options:</strong> nosniff (MIME sniffing defense)</li>
              <li><strong>Referrer-Policy:</strong> strict-origin-when-cross-origin</li>
              <li><strong>Permissions-Policy:</strong> camera=(), microphone=(), geolocation=()</li>
              <li><strong>Sliding-window IP rate limiting:</strong> Active on all mutation APIs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1F3A] mb-3">Responsible Disclosure Program</h2>
            <p className="text-sm">
              If you discover a security vulnerability, we encourage you to report it to our engineering team at{' '}
              <a href="mailto:security@microsplit.ai" className="text-[#0F9D8A] font-semibold hover:underline">
                security@microsplit.ai
              </a>. We acknowledge all legitimate reports within 24 hours and do not pursue legal action against researchers acting in good faith.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
