'use client';

import Link from 'next/link';
import { Zap, ExternalLink } from 'lucide-react';

const footerSections = [
  {
    title: 'Platform',
    links: [
      { label: 'Squads', href: '/squads' },
      { label: 'New Split Run', href: '/splits/new' },
      { label: 'Batch Payouts', href: '/payouts' },
      { label: 'Audit Ledger', href: '/ledger' },
      { label: 'Evidence Trail', href: '/evidence' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'API Reference', href: '/docs/api' },
      { label: 'Deterministic Math Proofs', href: '/docs/arch' },
      { label: 'Contact & Support', href: '/contact' },
    ],
  },
  {
    title: 'Trust & Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Use', href: '/terms' },
      { label: 'Security Disclosures', href: '/security' },
      { label: 'MIT License', href: '/licence' },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      className="relative z-10 w-full"
      style={{
        background: '#07172B',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#E2E8F0',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #0B1F3A 0%, #0F9D8A 100%)',
                  border: '1px solid rgba(15, 157, 138, 0.4)',
                  boxShadow: '0 2px 10px rgba(15, 157, 138, 0.25)',
                }}
              >
                <Zap size={16} strokeWidth={2.5} className="text-white" />
              </div>
              <span className="text-white font-extrabold text-lg tracking-tight">
                Micro<span style={{ color: '#0F9D8A' }}>Split</span>
              </span>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Deterministic squad revenue attribution and automated batch payouts. Built for high-velocity developer teams and autonomous collectives.
            </p>

            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-[#0F9D8A] shadow-[0_0_8px_#0F9D8A] animate-pulse" />
              All Settlement Systems Operational
            </div>
          </div>

          {/* Links Columns */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                {section.title}
              </h4>
              <ul className="space-y-2.5 text-sm">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-slate-400 hover:text-[#0F9D8A] transition-colors duration-150 inline-flex items-center gap-1"
                    >
                      {link.label}
                    </Link>
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
          <p className="text-slate-400 text-center sm:text-left">
            &copy; 2026 MicroSplit AI, Inc. Zero-loss deterministic settlements.
          </p>

          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/privacy" className="hover:text-[#0F9D8A] transition-colors">
              Privacy
            </Link>
            <span>&bull;</span>
            <Link href="/terms" className="hover:text-[#0F9D8A] transition-colors">
              Terms
            </Link>
            <span>&bull;</span>
            <Link href="/security" className="hover:text-[#0F9D8A] transition-colors">
              Security
            </Link>
            <span>&bull;</span>
            <a
              href="https://github.com/Satyam2307/MicroSplit-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#0F9D8A] transition-colors inline-flex items-center gap-1"
            >
              GitHub <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
