'use client';

import { useState, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { Zap, Check, CheckCircle2 } from 'lucide-react';
import { CountUp } from '@/components/ui';

export default function PaymentCard() {
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Mouse tilt tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 220, damping: 20 };
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [10, -10]),
    springConfig
  );
  const tiltY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-10, 10]),
    springConfig
  );

  // Dynamic glare coordinates
  const glareX = useSpring(
    useTransform(mouseX, [-0.5, 0.5], ['0%', '100%']),
    springConfig
  );
  const glareY = useSpring(
    useTransform(mouseY, [-0.5, 0.5], ['0%', '100%']),
    springConfig
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const toggleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFlip();
    }
  };

  return (
    <div className="relative w-full max-w-[360px] sm:max-w-[420px] mx-auto select-none">
      {/* ── Top-Left Floating Chip ── */}
      <motion.div
        className="absolute -top-3.5 -left-2 sm:-top-5 sm:-left-5 z-20 whitespace-nowrap pointer-events-none"
        animate={prefersReducedMotion ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      >
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-lg"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--primary)',
          }}
        >
          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Check size={11} strokeWidth={3} />
          </span>
          <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>Approved</span>
          <span className="text-[10px] font-semibold text-slate-400">·</span>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>Batch v1</span>
        </div>
      </motion.div>

      {/* ── Card Container with 3D Perspective & Idle Float ── */}
      <motion.div
        className="relative"
        style={{ perspective: 1000 }}
        animate={prefersReducedMotion ? {} : { y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Depth card peeking behind (rotated -8°) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl pointer-events-none transform -rotate-8 scale-[0.96] opacity-60 blur-[1px] shadow-2xl transition-transform duration-300"
          style={{
            background:
              'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 65%, var(--accent)) 50%, var(--accent) 100%)',
            border: '1px solid color-mix(in srgb, var(--background) 15%, transparent)',
          }}
        />

        {/* 3D Tilt Wrapper */}
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX: prefersReducedMotion ? 0 : rotateX,
            rotateY: prefersReducedMotion ? 0 : tiltY,
            transformStyle: 'preserve-3d',
          }}
          className="relative cursor-pointer focus:outline-none"
        >
          {/* Flip Container */}
          <div
            role="button"
            tabIndex={0}
            onClick={toggleFlip}
            onKeyDown={handleKeyDown}
            aria-label="Settlement Payment Card for Squad Treasury. Click or press Enter to flip to audit trail."
            className="w-full aspect-[1.586/1] rounded-2xl relative shadow-2xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-teal-400"
            style={{
              transformStyle: 'preserve-3d',
              transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* ════════════════════════════════════════════════════════
               CARD FRONT
            ════════════════════════════════════════════════════════ */}
            <div
              className="absolute inset-0 w-full h-full rounded-2xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden"
              style={{
                backfaceVisibility: 'hidden',
                background:
                  'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 70%, var(--accent)) 55%, var(--accent) 100%)',
                border: '1px solid color-mix(in srgb, var(--background) 18%, transparent)',
                boxShadow: '0 24px 50px -12px rgba(7, 23, 43, 0.45)',
              }}
            >
              {/* Glossy light streak */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(115deg, transparent 25%, rgba(255, 255, 255, 0.08) 45%, rgba(255, 255, 255, 0.18) 50%, rgba(255, 255, 255, 0.08) 55%, transparent 75%)',
                }}
              />

              {/* Moving glare highlight */}
              {!prefersReducedMotion && (
                <motion.div
                  className="absolute inset-0 pointer-events-none rounded-2xl opacity-40 mix-blend-overlay"
                  style={{
                    background: useTransform(
                      [glareX, glareY],
                      ([gx, gy]) =>
                        `radial-gradient(circle 240px at ${gx} ${gy}, rgba(255,255,255,0.7), transparent)`
                    ),
                  }}
                />
              )}

              {/* ── Top Row: Logo & NFC ── */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                    style={{
                      background: 'rgba(255, 255, 255, 0.16)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                    }}
                  >
                    <Zap size={15} strokeWidth={2.8} className="text-white" />
                  </div>
                  <span className="font-black text-sm tracking-tight text-white">
                    Micro<span style={{ color: '#5EEAD4' }}>Split</span>
                  </span>
                </div>

                {/* Contactless / NFC SVG */}
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="text-white/80"
                  aria-hidden="true"
                >
                  <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                  <path d="M12 19a8.5 8.5 0 0 0 0-14" />
                  <path d="M15.5 21.5a12 12 0 0 0 0-19" />
                  <path d="M5 14a1.5 1.5 0 0 1 0-4" />
                </svg>
              </div>

              {/* ── Middle Row: EMV Chip & Card Number ── */}
              <div className="relative z-10 my-auto pt-1 sm:pt-2">
                <div className="flex items-center justify-between mb-3">
                  {/* EMV Chip */}
                  <div
                    className="w-10 h-7 sm:w-11 sm:h-8 rounded-md relative overflow-hidden shadow-inner border border-amber-300/50"
                    style={{
                      background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
                    }}
                    aria-hidden="true"
                  >
                    <svg
                      width="44"
                      height="32"
                      viewBox="0 0 44 32"
                      className="absolute inset-0 opacity-45"
                    >
                      <rect x="0" y="0" width="44" height="32" fill="none" stroke="#78350f" strokeWidth="1" />
                      <path d="M0 11 h14 v10 h-14" stroke="#78350f" strokeWidth="1" fill="none" />
                      <path d="M44 11 h-14 v10 h14" stroke="#78350f" strokeWidth="1" fill="none" />
                      <path d="M14 0 v32" stroke="#78350f" strokeWidth="1" fill="none" />
                      <path d="M30 0 v32" stroke="#78350f" strokeWidth="1" fill="none" />
                      <path d="M14 16 h16" stroke="#78350f" strokeWidth="1" fill="none" />
                    </svg>
                  </div>

                  {/* Generic Network Mark (Split Circles) */}
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <div className="flex items-center">
                      <span className="w-5 h-5 rounded-full bg-teal-300/80" />
                      <span className="w-5 h-5 rounded-full bg-cyan-200/70 -ml-2.5 mix-blend-screen" />
                    </div>
                    <span className="text-[10px] font-black tracking-widest text-white/90">SPLIT</span>
                  </div>
                </div>

                {/* Embossed Card Number */}
                <div
                  className="font-mono tracking-widest text-white/95 text-xs sm:text-sm font-bold"
                  style={{
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)',
                    letterSpacing: '0.14em',
                  }}
                >
                  4444 &nbsp;•••• &nbsp;•••• &nbsp;4f98
                </div>
              </div>

              {/* ── Bottom Row: Amount & Squad Treasury ── */}
              <div className="relative z-10 flex items-end justify-between pt-1">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/70 font-semibold mb-0.5">
                    SETTLEMENT POOL
                  </p>
                  <p className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white leading-none mb-1.5">
                    <CountUp end={1000} prefix="$" suffix=".00" />
                  </p>
                  <p className="text-[8px] uppercase tracking-wider text-white/70 font-semibold">
                    CARDHOLDER
                  </p>
                  <p className="text-[11px] font-mono font-bold tracking-wide text-white leading-none">
                    SQUAD TREASURY
                  </p>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <p className="text-[9px] font-mono text-white/70">
                    VALID THRU <span className="text-white font-bold">12/30</span>
                  </p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-bold border border-white/20 shadow-sm">
                    <CheckCircle2 size={11} className="text-teal-300" />
                    Zero-Loss Verified
                  </span>
                </div>
              </div>

              {/* Flip Hint */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-white/50 tracking-wider uppercase font-semibold pointer-events-none">
                Click to flip ↺
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════
               CARD BACK (RotateY 180deg)
            ════════════════════════════════════════════════════════ */}
            <div
              className="absolute inset-0 w-full h-full rounded-2xl flex flex-col justify-between overflow-hidden"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background:
                  'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 70%, var(--accent)) 60%, var(--accent) 100%)',
                border: '1px solid color-mix(in srgb, var(--background) 18%, transparent)',
                boxShadow: '0 24px 50px -12px rgba(7, 23, 43, 0.45)',
              }}
            >
              {/* Magnetic Stripe */}
              <div className="w-full h-9 sm:h-10 bg-slate-950 mt-4 border-y border-white/10" />

              {/* Signature Panel & Hash */}
              <div className="px-5 sm:px-6 my-auto">
                <div className="rounded bg-white/95 p-2 sm:p-2.5 flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-2">
                    <span className="font-serif italic text-slate-400 text-xs sm:text-sm select-none">
                      MicroSplit Squad Treasury
                    </span>
                  </div>
                  <span className="font-mono text-[10px] sm:text-[11px] font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                    SHA-256: 4f98...e1b2
                  </span>
                </div>

                <div className="mt-2.5 text-center px-2">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-white/90">
                    Every cent is mathematically auditable.
                  </p>
                  <p className="text-[9px] text-white/60 mt-0.5">
                    Integer-cents arithmetic · Largest-remainder rounding · Strict sum equality
                  </p>
                </div>
              </div>

              {/* Back Footer */}
              <div className="px-5 pb-3 flex items-center justify-between text-[9px] text-white/60">
                <span>4 Verified Contributors</span>
                <span className="font-bold text-teal-300">Click to flip front ↻</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Bottom-Right Floating Chip ── */}
      {/* On mobile (<sm), static below the card. On sm+, absolute at bottom-right corner. */}
      <motion.div
        className="mt-4 sm:mt-0 sm:absolute sm:-bottom-6 sm:-right-4 lg:-right-6 z-20 whitespace-nowrap"
        animate={prefersReducedMotion ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      >
        <div
          className="p-3 rounded-xl shadow-xl w-full sm:w-auto"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold"
              style={{
                background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                color: 'var(--accent)',
              }}
            >
              Approved
            </span>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold"
              style={{
                background: 'var(--surface)',
                color: 'var(--primary)',
                border: '1px solid var(--border)',
              }}
            >
              Batch v1
            </span>
          </div>
          <p
            className="text-[11px] font-semibold"
            style={{ color: 'var(--primary)' }}
          >
            PayPal batch dispatched for 4 members
          </p>
        </div>
      </motion.div>
    </div>
  );
}

