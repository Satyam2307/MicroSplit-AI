'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  AnimatePresence,
} from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  GitPullRequest,
  Flame,
  CreditCard,
  Sparkles,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Zap,
  Layers,
  Terminal,
  Activity,
  Maximize2
} from 'lucide-react';

interface ExhibitCard {
  id: string;
  year: string;
  tag: string;
  title: string;
  subtitle: string;
  hash: string;
  stat: string;
  statLabel: string;
  badgeColor: string;
  link: string;
  wall: 'left' | 'right';
  wallPosition: 'near' | 'far';
}

const exhibits: ExhibitCard[] = [
  {
    id: 'pr-verify',
    year: '2026.10',
    tag: 'EVIDENCE VAULT',
    title: 'GitHub PR #142 Merkle Proof',
    subtitle: 'SHA-256 cryptographic signature verified against commit tree. Zero tamper risk.',
    hash: 'sha256:9f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    stat: '100% Valid',
    statLabel: 'Cryptographic Integrity',
    badgeColor: '#0F9D8A',
    link: '/evidence',
    wall: 'left',
    wallPosition: 'near',
  },
  {
    id: 'focus-audit',
    year: '2026.10',
    tag: 'PRIVACY-FIRST',
    title: 'Proof-of-Focus Telemetry',
    subtitle: 'Zero surveillance. Local deterministic hashing validates active contribution sessions.',
    hash: 'session:focus_9182_a48b_e391_zkp',
    stat: '8h 42m',
    statLabel: 'Verified Deep Focus',
    badgeColor: '#38BDF8',
    link: '/evidence',
    wall: 'left',
    wallPosition: 'far',
  },
  {
    id: 'streak-bonus',
    year: '2026.10',
    tag: 'CONSISTENCY MULTIPLIER',
    title: '100-Day Streak Guarantee',
    subtitle: 'Mathematically capped at 10% pool bonus. Authorized freeze days preserve equity.',
    hash: 'streak:member_alex_100d_freeze_active',
    stat: '+10.0%',
    statLabel: 'Pool Multiplier Locked',
    badgeColor: '#F59E0B',
    link: '/statements',
    wall: 'right',
    wallPosition: 'near',
  },
  {
    id: 'paypal-batch',
    year: '2026.10',
    tag: 'INSTANT SETTLEMENT',
    title: 'PayPal Batch API v1 Dispatch',
    subtitle: 'Single payout batch across 15,000 global squad members. Exactly 0-cent residue.',
    hash: 'payout:batch_204_settled_integer_cents',
    stat: '$10,000.00',
    statLabel: 'Exact $0.00 Drift',
    badgeColor: '#10B981',
    link: '/payouts',
    wall: 'right',
    wallPosition: 'far',
  },
];

export default function CinematicVaultGallery() {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeExhibit, setActiveExhibit] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'hallway' | 'ledger' | 'simulator'>('hallway');

  // Mouse tilt tracking for 3D spatial perspective
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 120, damping: 25 };
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), springConfig);
  const perspectiveFloorSkew = useSpring(useTransform(mouseY, [-0.5, 0.5], [-3, 3]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText?.(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-[750px] sm:min-h-[850px] bg-[#040D1A] overflow-hidden py-16 sm:py-24 select-none flex flex-col justify-between"
      style={{
        perspective: '1200px',
      }}
    >
      {/* ── 1. Cosmic Atmospheric Glow & Starfield (Awwwards Space Canvas) ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top subtle moonlit arc */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[450px] rounded-full opacity-35"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(15, 157, 138, 0.35) 0%, rgba(11, 31, 58, 0.1) 60%, transparent 80%)',
            filter: 'blur(70px)',
          }}
        />

        {/* Ambient star particles */}
        {[
          { t: '12%', l: '18%', s: 2.5, d: 3 },
          { t: '18%', l: '75%', s: 2, d: 4.5 },
          { t: '25%', l: '35%', s: 3, d: 5 },
          { t: '32%', l: '88%', s: 2.5, d: 3.5 },
          { t: '45%', l: '12%', s: 3, d: 4 },
          { t: '60%', l: '82%', s: 2, d: 5.5 },
          { t: '72%', l: '24%', s: 2.5, d: 3.2 },
          { t: '80%', l: '70%', s: 3, d: 4.8 },
        ].map((star, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-teal-300 shadow-[0_0_8px_#0F9D8A]"
            style={{
              top: star.t,
              left: star.l,
              width: `${star.s}px`,
              height: `${star.s}px`,
            }}
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.3, 1] }}
            transition={{ duration: star.d, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* ── 2. Header Strip: Museum Curation Tags ── */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono uppercase tracking-widest text-[11px] text-teal-300">
            Vault 01 • Deterministic Corridor
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="text-slate-400">MERKLE DEPTH: 16 LEVELS</span>
          <span className="hidden sm:inline text-teal-400 font-bold">● LIVE VERIFICATION</span>
        </div>
      </div>

      {/* ── 3. 3D Spatial Vanishing Hallway (The Monet Perspective Room) ── */}
      <motion.div
        className="relative z-10 w-full max-w-6xl mx-auto my-auto py-8 sm:py-12"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ── Center Portal & Master Typography ── */}
        <div className="relative text-center flex flex-col items-center justify-center my-6 z-10">
          {/* Luminous Merkle Portal in the Horizon */}
          <div className="relative w-40 h-40 sm:w-56 sm:h-56 mx-auto mb-6 flex items-center justify-center">
            {/* Pulsing Aura Rings */}
            <div className="absolute inset-0 rounded-full border border-teal-500/25 animate-ping opacity-25" />
            <div className="absolute -inset-4 rounded-full border border-teal-400/20 animate-pulse opacity-40" />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(15, 157, 138, 0.35) 0%, rgba(16, 185, 129, 0.15) 45%, transparent 75%)',
                boxShadow: '0 0 60px rgba(15, 157, 138, 0.45), inset 0 0 30px rgba(16, 185, 129, 0.3)',
              }}
            />

            {/* Glowing Vault Monogram */}
            <div className="relative z-10 text-center">
              <span className="font-mono text-2xl sm:text-3xl font-black text-white tracking-tighter block">
                0.00<span className="text-teal-400">¢</span>
              </span>
              <span className="text-[10px] font-mono text-teal-200 uppercase tracking-widest block mt-0.5">
                Zero Drift
              </span>
            </div>
          </div>

          {/* Majestic Hero Headline (Awwwards Style Display Type) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="px-4"
          >
            <h2
              className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.05] uppercase"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '-0.03em',
                textShadow: '0 8px 30px rgba(0, 0, 0, 0.9), 0 0 35px rgba(15, 157, 138, 0.4)',
              }}
            >
              The Ledger Never Lies
            </h2>

            <p className="mt-3 text-sm sm:text-lg text-teal-200/90 max-w-xl mx-auto font-medium leading-relaxed">
              Every cent calculated by deterministic arithmetic. Every PR, design, and focus hour hashed into an immutable Merkle tree.
            </p>
          </motion.div>
        </div>

        {/* ── Perspective Floating Exhibit Frames (Left & Right Corridor Walls) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12 px-4 sm:px-8 mt-8">

          {/* Left Wall Exhibit: Evidence & Focus */}
          <div className="space-y-4">
            {exhibits
              .filter((e) => e.wall === 'left')
              .map((exhibit) => {
                const isSelected = activeExhibit === exhibit.id;
                return (
                  <motion.div
                    key={exhibit.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    onClick={() => setActiveExhibit(isSelected ? null : exhibit.id)}
                    className="cursor-pointer relative p-4 sm:p-5 rounded-2xl border transition-all duration-300 backdrop-blur-md"
                    style={{
                      background: isSelected
                        ? 'rgba(15, 157, 138, 0.15)'
                        : 'rgba(11, 31, 58, 0.65)',
                      borderColor: isSelected
                        ? 'rgba(20, 184, 166, 0.6)'
                        : 'rgba(255, 255, 255, 0.1)',
                      boxShadow: isSelected
                        ? '0 12px 30px rgba(15, 157, 138, 0.3)'
                        : '0 6px 20px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] text-teal-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_6px_#0F9D8A]" />
                        <span>{exhibit.tag}</span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{exhibit.year}</span>
                    </div>

                    <h4 className="text-base sm:text-lg font-bold text-white mb-1">
                      {exhibit.title}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {exhibit.subtitle}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-mono">
                          {exhibit.statLabel}
                        </span>
                        <span className="font-bold text-sm text-white font-mono">
                          {exhibit.stat}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(exhibit.hash, exhibit.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10.5px] font-mono text-slate-300 flex items-center gap-1 transition-colors"
                          title="Copy SHA-256 Hash"
                        >
                          {copiedHash === exhibit.id ? (
                            <>
                              <Check size={11} className="text-emerald-400" />
                              <span className="text-emerald-300">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Hash</span>
                            </>
                          )}
                        </button>

                        <Link
                          href={exhibit.link}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 rounded-lg bg-teal-600/80 hover:bg-teal-500 text-[10.5px] font-bold text-white flex items-center gap-1 transition-colors"
                        >
                          <span>Inspect</span>
                          <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>

          {/* Right Wall Exhibit: Streaks & PayPal Batch */}
          <div className="space-y-4">
            {exhibits
              .filter((e) => e.wall === 'right')
              .map((exhibit) => {
                const isSelected = activeExhibit === exhibit.id;
                return (
                  <motion.div
                    key={exhibit.id}
                    whileHover={{ scale: 1.02, x: -4 }}
                    onClick={() => setActiveExhibit(isSelected ? null : exhibit.id)}
                    className="cursor-pointer relative p-4 sm:p-5 rounded-2xl border transition-all duration-300 backdrop-blur-md"
                    style={{
                      background: isSelected
                        ? 'rgba(15, 157, 138, 0.15)'
                        : 'rgba(11, 31, 58, 0.65)',
                      borderColor: isSelected
                        ? 'rgba(20, 184, 166, 0.6)'
                        : 'rgba(255, 255, 255, 0.1)',
                      boxShadow: isSelected
                        ? '0 12px 30px rgba(15, 157, 138, 0.3)'
                        : '0 6px 20px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#F59E0B]" />
                        <span>{exhibit.tag}</span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{exhibit.year}</span>
                    </div>

                    <h4 className="text-base sm:text-lg font-bold text-white mb-1">
                      {exhibit.title}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {exhibit.subtitle}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-mono">
                          {exhibit.statLabel}
                        </span>
                        <span className="font-bold text-sm text-white font-mono">
                          {exhibit.stat}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(exhibit.hash, exhibit.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10.5px] font-mono text-slate-300 flex items-center gap-1 transition-colors"
                          title="Copy Proof Hash"
                        >
                          {copiedHash === exhibit.id ? (
                            <>
                              <Check size={11} className="text-emerald-400" />
                              <span className="text-emerald-300">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Proof</span>
                            </>
                          )}
                        </button>

                        <Link
                          href={exhibit.link}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 rounded-lg bg-teal-600/80 hover:bg-teal-500 text-[10.5px] font-bold text-white flex items-center gap-1 transition-colors"
                        >
                          <span>Inspect</span>
                          <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>

        </div>

        {/* ── 4. Reflective Water Floor with Moving Light Inscription (The Monet Waterlilies Illusion) ── */}
        <div className="relative mt-12 pt-8 text-center overflow-hidden">
          {/* Surface perspective reflection plane */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background:
                'linear-gradient(to top, rgba(15, 157, 138, 0.25) 0%, rgba(4, 13, 26, 0.8) 60%, transparent 100%)',
              maskImage: 'radial-gradient(ellipse at 50% 100%, black 30%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse at 50% 100%, black 30%, transparent 80%)',
            }}
          />

          {/* Luminous Moving Floor Text */}
          <motion.p
            className="relative font-serif italic text-lg sm:text-2xl text-teal-200/80 tracking-wide select-none"
            style={{
              textShadow: '0 0 20px rgba(15, 157, 138, 0.8), 0 0 40px rgba(15, 157, 138, 0.4)',
            }}
            animate={
              prefersReducedMotion
                ? {}
                : {
                    opacity: [0.65, 0.95, 0.65],
                    letterSpacing: ['0.02em', '0.04em', '0.02em'],
                  }
            }
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            "The math is still proving. The light is still moving."
          </motion.p>
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mt-1 block">
            Deterministic Settlement • Pure Integer-Cent Math
          </span>
        </div>
      </motion.div>

      {/* ── 5. Awwwards-Style Floating Island Pill Controller (Bottom Bar) ── */}
      <div className="relative z-20 max-w-2xl mx-auto px-4 mt-6">
        <div
          className="flex items-center justify-between p-1.5 rounded-full backdrop-blur-xl border border-white/15 bg-black/60 shadow-[0_16px_40px_rgba(0,0,0,0.7)]"
        >
          {/* Awwwards W. Badge */}
          <div className="px-3 py-1 rounded-full bg-white/10 font-bold text-xs text-white flex items-center gap-1">
            <span className="text-[#0F9D8A]">M.</span>
            <span className="text-[10px] text-slate-300">Vault</span>
          </div>

          {/* Controller Tabs */}
          <div className="flex items-center gap-1 text-xs">
            <Link
              href="/splits/new"
              className="px-3 py-1 rounded-full font-bold transition-all text-slate-300 hover:text-white hover:bg-white/10"
            >
              Live Split
            </Link>
            <Link
              href="/evidence"
              className="px-3 py-1 rounded-full font-bold transition-all text-slate-300 hover:text-white hover:bg-white/10"
            >
              Evidence
            </Link>
            <Link
              href="/ledger"
              className="px-3 py-1 rounded-full font-bold transition-all text-slate-300 hover:text-white hover:bg-white/10"
            >
              Merkle Ledger
            </Link>
          </div>

          {/* Action CTA Pill */}
          <Link
            href="/splits/new"
            className="px-4 py-1.5 rounded-full font-bold text-xs bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 transition-all hover:scale-105 shadow-md flex items-center gap-1"
          >
            <span>Launch</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </section>
  );
}
