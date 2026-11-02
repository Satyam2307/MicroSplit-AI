'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Upload,
  Brain,
  GitFork,
  CreditCard,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  FileText,
  Users,
  TrendingUp,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import {
  Reveal,
  CountUp,
  Card,
  ProgressPipeline,
  WeightBar,
} from '@/components/ui';
import PaymentCard from '@/components/PaymentCard';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HERO — GuestVerify-inspired split layout
   Left: bold headline + description + CTAs + stats
   Right: virtual card showcase with floating chip
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Subtle ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 70%)', filter: 'blur(80px)' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14 sm:pt-12 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* ── Left Column ── */}
          <div>
            <Reveal>
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-7"
                style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(11, 31, 58, 0.05)' }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)', boxShadow: '0 0 8px color-mix(in srgb, var(--accent) 50%, transparent)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                  PayPal Payouts v1 Certified • SHA-256 Ledger
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h1
                className="text-4xl sm:text-5xl lg:text-[3.4rem] font-black leading-[1.08] tracking-tight mb-5"
                style={{ color: 'var(--primary)' }}
              >
                Split squad revenue,<br />
                <span style={{ color: 'var(--accent)' }}>with better judgment.</span>
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="text-[17px] max-w-lg mb-8 leading-relaxed" style={{ color: 'var(--muted)' }}>
                Upload contribution evidence. <strong style={{ color: 'var(--primary)' }}>MicroSplit AI</strong>{' '}
                extracts verified facts, applies deterministic math down to integer cents, and pays everyone in one PayPal batch.
              </p>
            </Reveal>

            <Reveal delay={0.22}>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <Link
                  href="/splits/new"
                  className="inline-flex items-center gap-2 px-7 py-3 text-[15px] font-bold rounded-xl text-white transition-all duration-200 hover:-translate-y-[1px]"
                  style={{ background: 'var(--accent)', boxShadow: '0 4px 14px color-mix(in srgb, var(--accent) 30%, transparent)' }}
                >
                  Open live console
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-6 py-3 text-[15px] font-semibold rounded-xl transition-all duration-200 hover:bg-slate-100"
                  style={{ background: '#FFFFFF', color: 'var(--primary)', border: '1.5px solid #CBD5E1' }}
                >
                  See how it works
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="flex flex-wrap items-center gap-8 sm:gap-10 mt-10 pt-7" style={{ borderTop: '1px solid #E2E8F0' }}>
                {[
                  { label: 'Deterministic', desc: 'Integer-cent math', color: 'var(--accent)' },
                  { label: 'SHA-256', desc: 'Audit trail', color: 'var(--primary)' },
                  { label: 'Fail-closed', desc: 'Zero-loss splits', color: 'var(--accent)' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-sm font-bold" style={{ color: s.color }}>{s.label}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* ── Right Column — Realistic Payment Card ── */}
          <Reveal delay={0.15} direction="right">
            <PaymentCard />
          </Reveal>

        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HOW IT WORKS — 4-step scroll story
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const steps = [
  {
    icon: Upload,
    title: 'Upload evidence',
    description: 'Drop in GitHub links, PDF invoices, screenshots, CSVs, or audio notes. We hash every file for tamper-evident integrity.',
    color: 'var(--accent)',
    preview: (
      <div className="space-y-3">
        {['github-commits.link', 'invoice-nov.pdf', 'hours-log.csv'].map((f) => (
          <div key={f} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(11, 31, 58, 0.04)' }}>
            <FileText size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>{f}</span>
            <CheckCircle2 size={14} className="ml-auto" style={{ color: 'var(--accent)' }} />
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Brain,
    title: 'AI extracts the facts',
    description: 'Our multimodal model reads each file and extracts structured records — who did what, when, and how much. Conflicts are flagged automatically.',
    color: 'var(--accent)',
    preview: (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(11, 31, 58, 0.04)' }}>
          <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>Maya Chen — 47 commits</span>
          <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent)' }}>95% Conf</span>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(11, 31, 58, 0.04)' }}>
          <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>Jordan Kim — 12 screens</span>
          <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent)' }}>88% Conf</span>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <span className="text-xs font-bold text-red-700">⚠ Duplicate hash detected</span>
          <span className="text-xs font-mono font-bold text-red-600">Flagged</span>
        </div>
      </div>
    ),
  },
  {
    icon: GitFork,
    title: 'Code splits the pool',
    description: 'Deterministic math — integer cents, largest-remainder rounding. The AI never touches the money. The sum always matches the pool exactly.',
    color: 'var(--accent)',
    preview: (
      <div className="space-y-3">
        {[
          { name: 'Maya Chen', pct: 47.47, amt: '$2,373.74' },
          { name: 'Sam Patel', pct: 32.32, amt: '$1,616.16' },
          { name: 'Jordan Kim', pct: 12.12, amt: '$606.06' },
          { name: 'Alex Rivera', pct: 8.09, amt: '$404.04' },
        ].map((m) => (
          <div key={m.name} className="flex items-center gap-3">
            <span className="text-xs font-semibold w-24 truncate" style={{ color: 'var(--primary)' }}>{m.name}</span>
            <div className="flex-1"><WeightBar percentage={m.pct} /></div>
            <span className="text-xs font-bold font-mono tabular-nums w-20 text-right" style={{ color: 'var(--primary)' }}>{m.amt}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: CreditCard,
    title: 'One batch pays everyone',
    description: 'Approve the split, hit send. PayPal pays your entire squad in one batch. Webhooks update status in real time with automatic retry handling.',
    color: 'var(--accent)',
    preview: (
      <ProgressPipeline
        stages={[
          { label: 'Draft', status: 'completed' },
          { label: 'Approved', status: 'completed' },
          { label: 'Sent', status: 'completed' },
          { label: 'Paid', status: 'active' },
        ]}
      />
    ),
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28" style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: 'var(--accent)' }}>How it works</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight" style={{ color: 'var(--primary)' }}>
              Evidence to payout in 4 steps
            </h2>
            <p className="text-base max-w-xl mx-auto mt-3" style={{ color: 'var(--muted)' }}>
              Traceable, transparent, and completely deterministic financial distribution.
            </p>
          </div>
        </Reveal>

        <div className="space-y-14 sm:space-y-20">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isEven = idx % 2 === 0;
            return (
              <Reveal key={step.title} delay={idx * 0.08}>
                <div className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 md:gap-14 items-center`}>
                  <div className="flex-1 md:max-w-md">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ background: `color-mix(in srgb, ${step.color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${step.color} 25%, transparent)`, color: step.color }}
                      >
                        <Icon size={22} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Step {idx + 1}</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight" style={{ color: 'var(--primary)' }}>{step.title}</h3>
                    <p className="text-base leading-relaxed" style={{ color: 'var(--muted)' }}>{step.description}</p>
                  </div>
                  <div className="flex-1 w-full">
                    <Card elevated padding="lg" hover={false}>{step.preview}</Card>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TRUST STRIP — Enterprise Security & Architecture
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function TrustStrip() {
  const features = [
    { icon: Shield, title: 'Tamper-proof ledger', desc: 'SHA-256 cryptographic chain. Every allocation is verifiable.' },
    { icon: Lock, title: 'AI never moves money', desc: 'AI proposes fact summaries. Deterministic code executes the math.' },
    { icon: Users, title: 'Role-based access', desc: 'Owner, approver, contributor, viewer — strictly scoped permissions.' },
    { icon: TrendingUp, title: 'Deterministic splits', desc: 'Integer cents, largest-remainder rounding. Exact sum equality guaranteed.' },
  ];

  return (
    <section className="relative z-10 py-20 sm:py-28" style={{ background: 'var(--primary)', borderTop: '1px solid color-mix(in srgb, var(--background) 8%, transparent)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: 'var(--accent)' }}>
              Enterprise Security & Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Every cent is mathematically auditable
            </h2>
            <p className="text-sm max-w-md mx-auto mt-3" style={{ color: 'color-mix(in srgb, var(--background) 75%, transparent)' }}>
              Built for teams that demand verifiable, trustless revenue splits.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={i * 0.08}>
                <div
                  className="p-6 rounded-2xl text-center transition-all duration-200 hover:-translate-y-1 h-full flex flex-col items-center justify-center"
                  style={{ background: 'color-mix(in srgb, var(--primary) 85%, transparent)', border: '1px solid color-mix(in srgb, var(--background) 8%, transparent)', boxShadow: '0 4px 16px color-mix(in srgb, var(--primary) 30%, transparent)' }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 flex-shrink-0"
                    style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', color: 'var(--accent)' }}
                  >
                    <Icon size={24} />
                  </div>
                  <h3 className="text-[15px] font-bold mb-2 text-white">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'color-mix(in srgb, var(--background) 75%, transparent)' }}>{f.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CTA Section — Cleanly isolated with unmistakable spacing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function CTASection() {
  return (
    <section className="relative z-10 py-24 sm:py-32" style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Reveal>
          <div
            className="p-10 sm:p-16 rounded-3xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #0B1F3A 0%, #102C4D 60%, #0F9D8A 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 48px rgba(11, 31, 58, 0.16)',
            }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(15, 157, 138, 0.25), transparent 70%)' }} />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 text-white tracking-tight relative z-10">
              Ready to split revenue fairly?
            </h2>
            <p className="text-base sm:text-lg mb-8 max-w-lg mx-auto relative z-10 leading-relaxed text-slate-200">
              Create your squad, upload contribution evidence, and let deterministic math calculate the exact distribution.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link
                href="/squads"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold rounded-xl text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#087F73]"
                style={{
                  background: '#0F9D8A',
                  boxShadow: '0 4px 14px rgba(15, 157, 138, 0.4)',
                }}
              >
                Create a Squad
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/splits/new"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold rounded-xl transition-all hover:bg-white/15 text-white"
                style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.25)' }}
              >
                Launch Demo Split
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <TrustStrip />
      <CTASection />
    </>
  );
}
