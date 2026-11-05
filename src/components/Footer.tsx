'use client';

import Link from 'next/link';
import {
  Zap,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowUpRight,
  Lock,
} from 'lucide-react';

const footerNav = [
  {
    title: 'Platform',
    links: [
      { label: 'Squad Workspaces', href: '/squads' },
      { label: 'New Revenue Split', href: '/splits/new' },
      { label: 'PayPal Batch Payouts', href: '/payouts' },
      { label: 'Cryptographic Ledger', href: '/ledger' },
      { label: 'Proof-of-Focus Evidence', href: '/evidence' },
      { label: 'Member Statements', href: '/statements' },
    ],
  },
  {
    title: 'Developers & Architecture',
    links: [
      { label: 'Documentation Hub', href: '/docs' },
      { label: 'REST API Reference', href: '/docs/api' },
      { label: 'Deterministic Math Proofs', href: '/docs/arch' },
      { label: 'Security Architecture', href: '/security' },
      {
        label: 'GitHub Repository',
        href: 'https://github.com/Satyam2307/MicroSplit-AI',
        external: true,
      },
    ],
  },
  {
    title: 'Trust & Governance',
    links: [
      { label: 'Contact & Support', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Security Disclosures', href: '/security' },
      { label: 'MIT Open Source License', href: '/licence' },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      className="relative z-10 w-full"
      style={{
        background: '#07172B',
        borderTop: '1px solid rgba(15, 157, 138, 0.2)',
        color: '#E2E8F0',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        {/* Top Section: 5-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 pb-14">
          {/* Brand Column (Spans 2 columns on desktop) */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #0B1F3A 0%, #0F9D8A 100%)',
                  border: '1px solid rgba(15, 157, 138, 0.4)',
                  boxShadow: '0 2px 12px rgba(15, 157, 138, 0.3)',
                }}
              >
                <Zap size={18} strokeWidth={2.5} className="text-white" />
              </div>
              <span className="text-white font-black text-xl tracking-tight">
                Micro<span style={{ color: '#0F9D8A' }}>Split</span>{' '}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-950/60 text-[#0F9D8A] border border-[#0F9D8A]/30 ml-1">
                  AI v2.0
                </span>
              </span>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Autonomous squad revenue attribution platform. Proof-of-focus tracking,
              deterministic integer-cent ledger verification, and automated PayPal batch disbursements.
            </p>

            {/* System Status Pill */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(15, 157, 138, 0.25)',
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F9D8A] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0F9D8A]" />
              </span>
              <span>All Settlement Systems Operational</span>
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300">
                <ShieldCheck size={12} className="text-[#0F9D8A]" />
                Zero-Loss Math
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300">
                <Cpu size={12} className="text-[#0F9D8A]" />
                SHA-256 Chain
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300">
                <Lock size={12} className="text-[#0F9D8A]" />
                PayPal API v1
              </span>
            </div>
          </div>

          {/* Nav Columns (3 columns) */}
          {footerNav.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                {section.title}
              </h4>
              <ul className="space-y-2.5 text-sm">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-[#0F9D8A] transition-colors duration-150 inline-flex items-center gap-1 group"
                      >
                        <span>{link.label}</span>
                        <ArrowUpRight
                          size={12}
                          className="text-slate-500 group-hover:text-[#0F9D8A] transition-colors"
                        />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-slate-400 hover:text-[#0F9D8A] transition-colors duration-150 inline-block"
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

        {/* Bottom Bar */}
        <div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400"
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <p className="text-slate-400">
              &copy; 2026 MicroSplit AI, Inc. Built for autonomous developer squads.
            </p>
            <span className="hidden sm:inline text-slate-600">&bull;</span>
            <span className="text-slate-500">
              Deterministic integer-cent attribution
            </span>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href="/security"
              className="hover:text-[#0F9D8A] transition-colors text-slate-400"
            >
              Security Disclosures
            </Link>
            <span className="text-slate-600">&bull;</span>
            <a
              href="https://github.com/Satyam2307/MicroSplit-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-[#0F9D8A] hover:text-[#0F9D8A] text-slate-300 transition-all duration-150"
            >
              <span>GitHub</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
