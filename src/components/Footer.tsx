'use client';

import Link from 'next/link';
import {
  Zap,
  ExternalLink,
  ShieldCheck,
  Globe,
  Lock,
  CreditCard,
  Flame,
} from 'lucide-react';

const footerSections = [
  {
    title: 'Products & Engines',
    links: [
      { label: 'Split Calculation Engine', href: '/splits/new' },
      { label: 'Consistency Streak Bonus', href: '/statements' },
      { label: 'Privacy-First Focus Sessions', href: '/statements' },
      { label: 'PayPal Batch v1 Payouts', href: '/payouts' },
      { label: 'SHA-256 Cryptographic Ledger', href: '/ledger' },
    ],
  },
  {
    title: 'Squad Solutions',
    links: [
      { label: 'Autonomous Agent Collectives', href: '/squads' },
      { label: 'Open Source Contributors', href: '/squads' },
      { label: 'Freelancer & Founder Guilds', href: '/squads' },
      { label: 'Multi-Timezone Remote Teams', href: '/evidence' },
      { label: 'Freeze Grant Governance', href: '/evidence' },
    ],
  },
  {
    title: 'Documentation',
    links: [
      { label: 'Getting Started Guide', href: '/docs' },
      { label: 'API Reference', href: '/docs/api' },
      { label: 'Canonical $1,000 Demo Script', href: '/runs/run_3' },
      { label: 'Deterministic Math Proofs', href: '/docs/arch' },
      { label: 'GitHub Repository', href: 'https://github.com', external: true },
    ],
  },
  {
    title: 'Trust & Security',
    links: [
      { label: 'Zero-Surveillance Guarantee', href: '/evidence' },
      { label: 'PayPal Sandbox Certified', href: '/payouts' },
      { label: 'SOC-2 Type II Compliance', href: '/privacy' },
      { label: 'MIT Open Source License', href: '/licence' },
      { label: 'Tamper-Evident Ledger Audit', href: '/ledger' },
    ],
  },
];

const trustHighlights = [
  { icon: Lock, label: 'Integer-Cents Arithmetic', desc: 'Strict 0-cent loss largest-remainder split.', accent: 'var(--accent)' },
  { icon: CreditCard, label: 'PayPal Batch API v1', desc: 'Pay up to 15,000 members in one click.', accent: 'var(--accent)' },
  { icon: Flame, label: 'Consistency Streak Bonus', desc: 'Deterministic rewards with freeze grants.', accent: 'var(--accent)' },
  { icon: ShieldCheck, label: 'SHA-256 Audit Trail', desc: 'Cryptographically verifiable governance.', accent: 'var(--accent)' },
];

export default function Footer() {
  return (
    <footer style={{ background: 'var(--primary)', color: 'var(--background)' }}>

      {/* ── Trust Highlights Strip ── */}
      <div style={{ background: '#0B1F3A', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
            {trustHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(15, 157, 138, 0.15)', border: '1px solid rgba(15, 157, 138, 0.3)', color: '#0F9D8A' }}
                  >
                    <Icon size={15} />
                  </div>
                  <div>
                    <p className="font-bold text-white">{item.label}</p>
                    <p className="text-slate-400">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Links Grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" style={{ background: '#07172B' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-10">

          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3 group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #0B1F3A, #0F9D8A)', border: '1px solid rgba(15, 157, 138, 0.4)', boxShadow: '0 2px 8px rgba(15, 157, 138, 0.25)' }}
              >
                <Zap size={15} strokeWidth={2.5} className="text-white" />
              </div>
              <span className="text-white font-extrabold text-base tracking-tight">
                Micro<span style={{ color: '#0F9D8A' }}>Split</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed mb-4 text-slate-300">
              Enterprise revenue splitting and automated batch payouts for autonomous squads, open source collectives, and high-velocity teams.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] text-slate-300" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F9D8A] shadow-[0_0_6px_#0F9D8A]" />
              All Systems Operational
            </div>
          </div>

          {/* Link Columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/90 mb-3.5">
                {section.title}
              </h4>
              <ul className="space-y-2 text-xs">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors flex items-center gap-1 text-slate-300 hover:text-[#0F9D8A]"
                      >
                        {link.label}
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="transition-colors text-slate-300 hover:text-[#0F9D8A]"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom Bar ── */}
        <div
          className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400"
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
        >
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-slate-400" />
            <select
              aria-label="Select Region / Language"
              className="bg-transparent border rounded px-2 py-1 text-xs cursor-pointer focus:outline-none text-slate-300"
              style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}
              defaultValue="en-US"
            >
              <option value="en-US" className="bg-[#0B1F3A] text-white">English (United States)</option>
              <option value="en-GB" className="bg-[#0B1F3A] text-white">English (United Kingdom)</option>
              <option value="de-DE" className="bg-[#0B1F3A] text-white">Deutsch (Deutschland)</option>
              <option value="ja-JP" className="bg-[#0B1F3A] text-white">日本語 (日本)</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-center">
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Use', href: '/terms' },
              { label: 'Security Disclosures', href: '/security' },
              { label: 'MIT License', href: '/licence' },
            ].map((link, i) => (
              <span key={link.label} className="flex items-center gap-4">
                {i > 0 && <span className="text-slate-600">·</span>}
                <Link
                  href={link.href}
                  className="transition-colors text-slate-400 hover:text-[#0F9D8A]"
                >
                  {link.label}
                </Link>
              </span>
            ))}
          </div>

          <p className="text-slate-500">
            © 2026 MicroSplit AI, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
