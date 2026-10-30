'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  ExternalLink,
  ShieldCheck,
  Globe,
  Lock,
  CreditCard,
  Flame,
  ArrowUp,
  Mail,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { showToast } from '@/components/Toast';

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
  { icon: Lock, label: 'Integer-Cents Arithmetic', desc: 'Strict 0-cent loss largest-remainder split.' },
  { icon: CreditCard, label: 'PayPal Batch API v1', desc: 'Pay up to 15,000 members in one click.' },
  { icon: Flame, label: 'Consistency Streak Bonus', desc: 'Deterministic rewards with freeze grants.' },
  { icon: ShieldCheck, label: 'SHA-256 Audit Trail', desc: 'Cryptographically verifiable governance.' },
];

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setIsSubscribed(true);
    showToast({
      type: 'success',
      title: 'Subscribed!',
      message: 'You have been enrolled in weekly squad settlement benchmarks.',
    });
    setNewsletterEmail('');
  };

  return (
    <footer className="relative bg-[#07172B] text-slate-300 overflow-hidden border-t border-teal-500/20 z-10">

      {/* ── Top Atmospheric Glowing Arc (Awwwards Horizon Effect) ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-36 pointer-events-none opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(15, 157, 138, 0.4) 0%, rgba(11, 31, 58, 0.1) 50%, transparent 80%)',
        }}
      />

      {/* ── Trust Highlights Strip ── */}
      <div className="relative border-b border-white/10 bg-[#0B1F3A]/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trustHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-teal-500/40 hover:bg-white/[0.06] transition-all duration-300 group shadow-xs"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-inner"
                    style={{
                      background: 'rgba(15, 157, 138, 0.18)',
                      border: '1px solid rgba(15, 157, 138, 0.35)',
                      color: '#0F9D8A',
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-white group-hover:text-teal-300 transition-colors">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Links Grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">

          {/* Brand & Newsletter Column */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-3 group">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all duration-300 group-hover:scale-105 shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #0B1F3A, #0F9D8A)',
                  border: '1px solid rgba(15, 157, 138, 0.4)',
                  boxShadow: '0 2px 10px rgba(15, 157, 138, 0.3)',
                }}
              >
                <Zap size={16} strokeWidth={2.5} className="text-teal-300" />
              </div>
              <span className="text-white font-black text-lg tracking-tight">
                Micro<span className="text-[#0F9D8A]">Split</span>
              </span>
            </Link>

            <p className="text-xs leading-relaxed mb-4 text-slate-400">
              Deterministic revenue splitting and automated PayPal batch disbursements for high-velocity software squads and freelance collectives.
            </p>

            {/* Newsletter Pill */}
            <form onSubmit={handleNewsletterSubmit} className="space-y-2 mb-4">
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="Enter your work email..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full h-9 rounded-full bg-slate-900/90 border border-white/15 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 pr-20"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-3 rounded-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-[10.5px] transition-colors"
                >
                  Join
                </button>
              </div>
              {isSubscribed && (
                <p className="text-[10px] text-teal-300 flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  <span>Enrolled in weekly benchmarks!</span>
                </p>
              )}
            </form>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold text-teal-300 bg-teal-500/10 border border-teal-500/25">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981] animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Link Columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
                <Sparkles size={11} className="text-teal-400" />
                <span>{section.title}</span>
              </h4>
              <ul className="space-y-2.5 text-xs">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors flex items-center gap-1 text-slate-400 hover:text-teal-300"
                      >
                        {link.label}
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="transition-colors text-slate-400 hover:text-teal-300"
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

        {/* ── Bottom Bar with Back to Top Pill ── */}
        <div
          className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 border-t border-white/10"
        >
          {/* Region / Language */}
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-teal-400" />
            <select
              aria-label="Select Region / Language"
              className="bg-transparent border rounded-lg px-2 py-1 text-xs cursor-pointer focus:outline-none text-slate-300 border-white/15"
              defaultValue="en-US"
            >
              <option value="en-US" className="bg-[#0B1F3A] text-white">English (United States)</option>
              <option value="en-GB" className="bg-[#0B1F3A] text-white">English (United Kingdom)</option>
              <option value="de-DE" className="bg-[#0B1F3A] text-white">Deutsch (Deutschland)</option>
              <option value="ja-JP" className="bg-[#0B1F3A] text-white">日本語 (日本)</option>
            </select>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap items-center gap-3 text-center">
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Use', href: '/terms' },
              { label: 'Security Disclosures', href: '/security' },
              { label: 'MIT License', href: '/licence' },
            ].map((link, i) => (
              <span key={link.label} className="flex items-center gap-3">
                {i > 0 && <span className="text-slate-600">·</span>}
                <Link
                  href={link.href}
                  className="transition-colors text-slate-400 hover:text-teal-300"
                >
                  {link.label}
                </Link>
              </span>
            ))}
          </div>

          {/* Back to Top Smooth Trigger */}
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all hover:-translate-y-0.5 active:translate-y-0"
            aria-label="Scroll back to top"
          >
            <span>Back to top</span>
            <ArrowUp size={13} className="text-teal-400" />
          </button>
        </div>

        <div className="mt-4 text-center md:text-left text-[11px] text-slate-500">
          © 2026 MicroSplit AI, Inc. Deterministic revenue attribution engine. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
