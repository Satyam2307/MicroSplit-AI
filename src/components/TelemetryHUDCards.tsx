'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Flame,
  CreditCard,
  FileCheck,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  Cpu
} from 'lucide-react';

interface TelemetryHUDCardsProps {
  onTriggerAudit?: () => void;
}

export function TelemetryHUDCards({ onTriggerAudit }: TelemetryHUDCardsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard?.writeText?.(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <section className="relative w-full py-14 sm:py-20 bg-[#030914] text-white overflow-hidden border-t border-teal-500/20 select-none">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-300 text-xs font-semibold mb-2.5">
              <Cpu className="w-3.5 h-3.5 text-teal-400" />
              <span>Cryptographic Telemetry HUD</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-['Playfair_Display',serif]">
              Tamper-evident verification, <span className="text-teal-400">every single cent.</span>
            </h2>
          </div>

          {onTriggerAudit && (
            <button
              type="button"
              onClick={onTriggerAudit}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>Simulate Protocol Vault Audit Wipe →</span>
            </button>
          )}
        </div>

        {/* 3 Obsidian HUD Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: 0-Cent Hare-Niemeyer Proof */}
          <div className="p-6 rounded-3xl bg-[#07172B]/90 border border-teal-500/30 hover:border-teal-400/60 transition-all shadow-xl hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
                <Zap className="w-5 h-5 text-teal-400" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 font-bold">
                0-CENT DRIFT: $0.00
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
              Deterministic 0-Cent Math
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Money is strictly split in integer cents using the Hare-Niemeyer algorithm. Zero floating-point drift is mathematically guaranteed.
            </p>

            <div className="space-y-2 p-3 rounded-2xl bg-black/40 border border-white/10 font-mono text-xs">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Total Pool:</span>
                <span className="text-white font-bold">$10,000.00 (1M¢)</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Sum(Allocations):</span>
                <span className="text-emerald-400 font-bold">$10,000.00 (1M¢)</span>
              </div>
              <div className="flex justify-between text-teal-300 text-[11px] pt-1.5 border-t border-white/10 font-bold">
                <span>Discrepancy Drift:</span>
                <span>0.00¢ (Exact Match)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Merkle Tree Cryptographic Integrity */}
          <div className="p-6 rounded-3xl bg-[#07172B]/90 border border-teal-500/30 hover:border-teal-400/60 transition-all shadow-xl hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                MERKLE DEPTH: 16
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
              SHA-256 Merkle Ledger
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Every invoice, GitHub commit, and focus hour receives an immutable digital fingerprint. Merkle root guarantees zero unauthorized edits.
            </p>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 font-mono text-[11px] space-y-1.5">
              <div className="flex justify-between items-center text-slate-400">
                <span>Root Digest:</span>
                <button
                  type="button"
                  onClick={() => handleCopy('4f98e1b2...9a7c', 2)}
                  className="text-teal-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedIndex === 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
              </div>
              <p className="text-slate-200 truncate font-bold">
                0x4f98e1b2c45d88921e09c82fa9b47e
              </p>
              <p className="text-[10px] text-emerald-400 pt-1 border-t border-white/10 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Cryptographically Immutable
              </p>
            </div>
          </div>

          {/* Card 3: PayPal Batch API v1 Instant Settlement */}
          <div className="p-6 rounded-3xl bg-[#07172B]/90 border border-teal-500/30 hover:border-teal-400/60 transition-all shadow-xl hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">
                PAYPAL BATCH v1
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
              Automated Batch Payouts
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Squad payouts are packaged into single cryptographic batches and dispatched via PayPal Payouts API across up to 15,000 accounts.
            </p>

            <div className="space-y-2 p-3 rounded-2xl bg-black/40 border border-white/10 font-mono text-xs">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Batch Status:</span>
                <span className="text-emerald-400 font-bold">● DISPATCH_READY</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>SLA Window:</span>
                <span className="text-white font-bold">&lt; 30 Seconds</span>
              </div>
              <div className="flex justify-between text-amber-300 text-[11px] pt-1.5 border-t border-white/10 font-bold">
                <span>Multi-Currency:</span>
                <span>USD, EUR, GBP, INR</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default TelemetryHUDCards;
