'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Flame,
  ShieldCheck,
  CreditCard,
  FileCheck,
  Copy,
  Check,
  ArrowRight,
  Cpu,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Contributor {
  name: string;
  role: string;
  initials: string;
  avatarColor: string;
  streakDays: number;
  workSharePct: number;
  workPayout: string;
  streakPayout: string;
  totalPayout: string;
}

interface SquadScenario {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  period: string;
  totalPool: string;
  workPool: string;
  streakPool: string;
  batchId: string;
  merkleHash: string;
  contributors: Contributor[];
  mathProof: string;
}

const scenarios: SquadScenario[] = [
  {
    id: 'creator-collective',
    badge: '0-Cent Hare-Niemeyer Algorithm',
    title: 'Autonomous Creator Collective #41',
    subtitle: 'High-velocity AI software squad with strict integer-cent allocation',
    period: 'Oct 1 – Oct 31, 2026',
    totalPool: '$12,500.00',
    workPool: '$11,875.00 (95%)',
    streakPool: '$625.00 (5%)',
    batchId: 'BCH-9941-X',
    merkleHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    mathProof: 'Strict integer-cent Hare-Niemeyer rounding guarantees exact $0.00 drift across 4 members.',
    contributors: [
      {
        name: 'Maya Chen',
        role: 'Lead AI Engineer',
        initials: 'MC',
        avatarColor: 'from-teal-500 to-emerald-600',
        streakDays: 100,
        workSharePct: 45.0,
        workPayout: '$5,343.75',
        streakPayout: '$312.50',
        totalPayout: '$5,656.25',
      },
      {
        name: 'Alex Rivera',
        role: 'Protocol & Smart Contracts',
        initials: 'AR',
        avatarColor: 'from-blue-500 to-indigo-600',
        streakDays: 60,
        workSharePct: 30.0,
        workPayout: '$3,562.50',
        streakPayout: '$187.50',
        totalPayout: '$3,750.00',
      },
      {
        name: 'Jordan Kim',
        role: 'Product Architecture',
        initials: 'JK',
        avatarColor: 'from-purple-500 to-pink-600',
        streakDays: 30,
        workSharePct: 15.0,
        workPayout: '$1,781.25',
        streakPayout: '$93.75',
        totalPayout: '$1,875.00',
      },
      {
        name: 'Sam Patel',
        role: 'Security & QA Auditor',
        initials: 'SP',
        avatarColor: 'from-amber-500 to-orange-600',
        streakDays: 10,
        workSharePct: 10.0,
        workPayout: '$1,187.50',
        streakPayout: '$31.25',
        totalPayout: '$1,218.75',
      },
    ],
  },
  {
    id: 'open-source-guild',
    badge: '150-Member Merkle Ledger',
    title: 'Open Source Rust Protocol Guild',
    subtitle: 'Cryptographically hashed GitHub PRs and community streak rewards',
    period: 'Q3 Global Sprint',
    totalPool: '$50,000.00',
    workPool: '$45,000.00 (90%)',
    streakPool: '$5,000.00 (10%)',
    batchId: 'BCH-8820-RUST',
    merkleHash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    mathProof: '16-level Merkle tree verification ensures zero unauthorized allocation tampering.',
    contributors: [
      {
        name: 'Elena Rostova',
        role: 'Core Engine Maintainer',
        initials: 'ER',
        avatarColor: 'from-rose-500 to-pink-600',
        streakDays: 95,
        workSharePct: 40.0,
        workPayout: '$18,000.00',
        streakPayout: '$2,375.00',
        totalPayout: '$20,375.00',
      },
      {
        name: 'Devon Lee',
        role: 'Compiler Optimization',
        initials: 'DL',
        avatarColor: 'from-cyan-500 to-blue-600',
        streakDays: 70,
        workSharePct: 35.0,
        workPayout: '$15,750.00',
        streakPayout: '$1,750.00',
        totalPayout: '$17,500.00',
      },
      {
        name: 'Zara Thorne',
        role: 'Docs & Developer Tooling',
        initials: 'ZT',
        avatarColor: 'from-emerald-500 to-teal-600',
        streakDays: 45,
        workSharePct: 25.0,
        workPayout: '$11,250.00',
        streakPayout: '$875.00',
        totalPayout: '$12,125.00',
      },
    ],
  },
  {
    id: 'design-agency',
    badge: 'AI Vision OCR Multi-Modal',
    title: 'Apex Design & Motion Studio',
    subtitle: 'Client deliverable verification with conflict adjudication',
    period: 'October Deliverables',
    totalPool: '$8,400.00',
    workPool: '$8,000.00 (95.2%)',
    streakPool: '$400.00 (4.8%)',
    batchId: 'BCH-APEX-03',
    merkleHash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
    mathProof: 'AI Vision OCR verified 6 invoices and 14 Figma prototypes with zero duplicate overlap.',
    contributors: [
      {
        name: 'Lucas Vance',
        role: 'Principal 3D Motion Lead',
        initials: 'LV',
        avatarColor: 'from-purple-600 to-violet-700',
        streakDays: 80,
        workSharePct: 55.0,
        workPayout: '$4,400.00',
        streakPayout: '$240.00',
        totalPayout: '$4,640.00',
      },
      {
        name: 'Chloe Monet',
        role: 'Design Systems Architect',
        initials: 'CM',
        avatarColor: 'from-fuchsia-500 to-rose-600',
        streakDays: 40,
        workSharePct: 45.0,
        workPayout: '$3,600.00',
        streakPayout: '$160.00',
        totalPayout: '$3,760.00',
      },
    ],
  },
];

export function SquadShowcaseCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedHash, setCopiedHash] = useState(false);

  const current = scenarios[activeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? scenarios.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === scenarios.length - 1 ? 0 : prev + 1));
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard?.writeText?.(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <section className="relative w-full py-16 sm:py-24 bg-[#051124] text-white overflow-hidden border-t border-teal-500/20 select-none">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-3 bg-teal-500/15 border border-teal-400/30 text-teal-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Interactive 3D Squad Showcase</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-['Playfair_Display',serif]">
            Real squad splits, <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">proven by math.</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300">
            Explore deterministic integer-cent allocation, Merkle proof hashing, and consistency streaks across real scenarios.
          </p>

          {/* Interactive Preset Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {scenarios.map((sc, idx) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeIndex === idx
                    ? 'bg-teal-500 text-slate-950 shadow-lg scale-105'
                    : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
                }`}
              >
                {sc.title.split(' #')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-5xl mx-auto">
          {/* Arrow Buttons */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous scenario"
            className="absolute -left-3 sm:-left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-2xl bg-[#0B1F3A]/90 hover:bg-teal-600 border border-teal-500/30 text-white flex items-center justify-center shadow-xl transition-all hover:scale-110 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next scenario"
            className="absolute -right-3 sm:-right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-2xl bg-[#0B1F3A]/90 hover:bg-teal-600 border border-teal-500/30 text-white flex items-center justify-center shadow-xl transition-all hover:scale-110 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Active Card Body */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="rounded-3xl border border-teal-500/30 bg-[#0B1F3A]/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Top Banner Meta */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                      {current.badge}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Batch: <code>{current.batchId}</code>
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{current.title}</h3>
                  <p className="text-xs text-slate-300 mt-0.5">{current.subtitle}</p>
                </div>

                <div className="text-left md:text-right flex-shrink-0">
                  <p className="text-xs text-slate-400 font-medium">Settlement Pool</p>
                  <p className="text-3xl sm:text-4xl font-black text-teal-300 font-mono tracking-tight">
                    {current.totalPool}
                  </p>
                  <span className="text-[10px] font-bold text-emerald-400 font-mono flex items-center gap-1 md:justify-end">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Zero-Drift Verified ($0.00)
                  </span>
                </div>
              </div>

              {/* Pool Split Progress Bar */}
              <div className="my-5">
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-teal-300">Core Work Share: {current.workPool}</span>
                  <span className="text-amber-300 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    Consistency Streak Share: {current.streakPool}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden flex p-0.5 border border-white/10">
                  <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-l-full" style={{ width: '92%' }} />
                  <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-r-full" style={{ width: '8%' }} />
                </div>
              </div>

              {/* Contributor Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {current.contributors.map((c, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-[#102C4D]/80 border border-white/10 hover:border-teal-400/50 transition-all hover:-translate-y-0.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.avatarColor} flex items-center justify-center font-bold text-xs text-white shadow-sm`}
                        >
                          {c.initials}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight">{c.name}</h4>
                          <p className="text-[11px] text-slate-400">{c.role}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" />
                        {c.streakDays}d Streak
                      </span>
                    </div>

                    <div className="space-y-1 text-xs pt-2 border-t border-white/10 font-mono">
                      <div className="flex justify-between text-slate-300 text-[11px]">
                        <span>Work Share ({c.workSharePct}%):</span>
                        <span className="text-white font-bold">{c.workPayout}</span>
                      </div>
                      <div className="flex justify-between text-amber-300/90 text-[11px]">
                        <span>Streak Multiplier:</span>
                        <span className="font-bold">{c.streakPayout}</span>
                      </div>
                      <div className="flex justify-between text-sm font-black text-teal-300 pt-1 border-t border-white/10">
                        <span>Total Payout:</span>
                        <span>{c.totalPayout}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Cryptographic Ledger Proof Bar */}
              <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                  <span className="text-teal-400 font-bold">SHA-256 Merkle Proof:</span>
                  <span className="bg-black/30 px-2 py-0.5 rounded border border-white/10 truncate max-w-[220px] sm:max-w-xs">
                    {current.merkleHash}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyHash(current.merkleHash)}
                    className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer"
                    title="Copy hash"
                  >
                    {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {current.mathProof}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-4">
            {scenarios.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  activeIndex === i ? 'bg-teal-400 w-7' : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
export default SquadShowcaseCarousel;
