'use client';

import React from 'react';
import { Sun, Moon, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VaultCurtainTransitionProps {
  isActive: boolean;
  onComplete?: () => void;
  targetTheme?: 'light' | 'dark';
  title?: string;
  subtitle?: string;
}

export function VaultCurtainTransition({
  isActive,
  onComplete,
  targetTheme = 'dark',
  title,
  subtitle,
}: VaultCurtainTransitionProps) {
  const isLight = targetTheme === 'light';
  const displayTitle = title || (isLight ? 'DAYLIGHT PROTOCOL' : 'NIGHT OBSIDIAN PROTOCOL');
  const displaySubtitle = subtitle || (isLight ? 'CLEAN SLATE FINTECH PALETTE' : 'ZERO-LOSS CRYPTOGRAPHIC OBSIDIAN');

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[100] pointer-events-none flex select-none overflow-hidden"
          aria-hidden="true"
        >
          {/* Left Curtain Drape */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={`w-1/2 h-full relative shadow-[25px_0_50px_rgba(0,0,0,0.85)] border-r ${
              isLight
                ? 'bg-gradient-to-r from-slate-200 via-slate-100 to-white border-teal-500/30'
                : 'bg-gradient-to-r from-[#030914] via-[#07172B] to-[#0B1F3A] border-teal-500/40'
            }`}
          >
            {/* Curtain Fabric Folds */}
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-teal-500/30 via-transparent to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-gradient-to-l from-teal-400/50 to-transparent" />
          </motion.div>

          {/* Right Curtain Drape */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={`w-1/2 h-full relative shadow-[-25px_0_50px_rgba(0,0,0,0.85)] border-l ${
              isLight
                ? 'bg-gradient-to-l from-slate-200 via-slate-100 to-white border-teal-500/30'
                : 'bg-gradient-to-l from-[#030914] via-[#07172B] to-[#0B1F3A] border-teal-500/40'
            }`}
          >
            {/* Curtain Fabric Folds */}
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-teal-500/30 via-transparent to-transparent" />
            <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-teal-400/50 to-transparent" />
          </motion.div>

          {/* Center Theatrical Reveal Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.75, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.75, y: -20 }}
            transition={{ duration: 0.3, delay: 0.12 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto"
          >
            <div className="px-6 py-4 rounded-3xl bg-[#0B1F3A]/95 border-2 border-teal-400/70 shadow-[0_0_60px_rgba(15,157,138,0.55)] backdrop-blur-2xl flex items-center gap-4 text-white">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg animate-pulse">
                {isLight ? <Sun className="w-6 h-6 text-amber-300" /> : <Moon className="w-6 h-6 text-teal-200" />}
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-teal-400 block uppercase font-bold">
                  MICROSPLIT // THEME ENGINE
                </span>
                <span className="text-sm sm:text-base font-black tracking-tight text-white block">
                  {displayTitle}
                </span>
                <span className="text-[10px] font-mono text-emerald-300 block mt-0.5">
                  ● {displaySubtitle}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default VaultCurtainTransition;
