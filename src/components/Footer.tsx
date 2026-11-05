'use client';

import Link from 'next/link';
import { Zap, ExternalLink } from 'lucide-react';

const platformLinks = [
  { label: 'Squads', href: '/squads' },
  { label: 'Splits', href: '/splits/new' },
  { label: 'Payouts', href: '/payouts' },
  { label: 'Ledger', href: '/ledger' },
];

const companyLinks = [
  { label: 'Docs', href: '/docs' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

export default function Footer() {
  return (
    <footer
      className="relative z-10 w-full"
      style={{
        background: '#07172B',
        borderTop: '1px solid rgba(15, 157, 138, 0.15)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
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

            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Deterministic revenue splitting for modern dev teams.
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-[#0F9D8A] transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-[#0F9D8A] transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400"
          style={{ borderTop: '1px solid rgba(15, 157, 138, 0.10)' }}
        >
          <p>&copy; 2026 MicroSplit AI, Inc.</p>

          <a
            href="https://github.com/Satyam2307/MicroSplit-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-[#0F9D8A] transition-colors duration-150"
          >
            GitHub <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </footer>
  );
}
