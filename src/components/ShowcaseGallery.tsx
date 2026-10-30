'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Brain,
  GitFork,
  CreditCard,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Flame,
  Clock,
  Layers,
  Copy,
  Check,
  ChevronRight,
  Cpu,
  Eye,
  Sliders,
  DollarSign
} from 'lucide-react';
import { Reveal } from '@/components/ui';

export default function ShowcaseGallery() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ai_ocr' | 'ledger' | 'paypal'>('dashboard');
  const [copiedHash, setCopiedHash] = useState(false);

  // Live calculator state
  const [calcPool, setCalcPool] = useState<number>(10000);
  const [calcBonusPct, setCalcBonusPct] = useState<number>(5);

  const handleCopyHash = () => {
    navigator.clipboard?.writeText?.('7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069');
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Live calculation for the interactive calculator
  const bonusPool = Math.floor((calcPool * calcBonusPct) / 100);
  const workPool = calcPool - bonusPool;

  // 4 Squad members breakdown
  const memberA_work = Math.floor(workPool * 0.45);
  const memberB_work = Math.floor(workPool * 0.30);
  const memberC_work = Math.floor(workPool * 0.15);
  const memberD_work = workPool - (memberA_work + memberB_work + memberC_work);

  // Consistency distribution (Member A has 100d streak, B has 60d, C has 30d, D has 10d)
  const totalStreakPoints = 100 + 60 + 30 + 10; // 200
  const memberA_bonus = Math.floor((bonusPool * 100) / totalStreakPoints);
  const memberB_bonus = Math.floor((bonusPool * 60) / totalStreakPoints);
  const memberC_bonus = Math.floor((bonusPool * 30) / totalStreakPoints);
  const memberD_bonus = bonusPool - (memberA_bonus + memberB_bonus + memberC_bonus);

  return (
    <section className="py-20 sm:py-28 bg-[#07172B] relative overflow-hidden text-white border-t border-teal-500/20">
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(15, 157, 138, 0.15) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-4 bg-teal-500/15 border border-teal-400/30 text-teal-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Fintech Engine • Advanced Showcase</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
              See the system in action.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
              Explore the real-time attribution cockpit, multimodal AI fact extraction, cryptographic ledger verification, and deterministic PayPal batch settlements.
            </p>
          </div>
        </Reveal>

        {/* ─── SHOWCASE PIC 1: The Interactive Mission Control Mockup ─── */}
        <Reveal delay={0.1}>
          <div className="rounded-3xl border border-teal-500/30 bg-[#0B1F3A]/90 backdrop-blur-xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] overflow-hidden mb-24">

            {/* Window Chrome / Browser Topbar */}
            <div className="px-5 py-3.5 bg-[#07172B] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block" />
                <span className="text-xs font-mono text-slate-400 ml-2 hidden sm:inline">
                  https://app.microsplit.ai/splits/batch_0192
                </span>
              </div>

              {/* Showcase Sub-tabs */}
              <div className="flex items-center gap-1 bg-[#102C4D] p-1 rounded-xl border border-slate-700/80 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Squad Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ai_ocr')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'ai_ocr'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  AI Evidence Vision
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ledger')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'ledger'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SHA-256 Ledger
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('paypal')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'paypal'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  PayPal Batch
                </button>
              </div>
            </div>

            {/* Window Content Display */}
            <div className="p-6 sm:p-8">
              <AnimatePresence mode="wait">

                {/* TAB 1: SQUAD DASHBOARD VIEW */}
                {activeTab === 'dashboard' && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Header metrics */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl sm:text-2xl font-black text-white">
                            Autonomous Creator Collective #41
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                            Approved &amp; Ready
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Period: Oct 1 – Oct 31, 2026 • 4 Contributors • PayPal Batch ID: <code>BCH-9941-X</code>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-[11px] text-slate-400 font-medium">Total Pool</p>
                          <p className="text-2xl sm:text-3xl font-black text-teal-400 tracking-tight font-mono">
                            $12,500.00
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Visual 2-Pool Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-teal-400">Work Share Pool (95% = $11,875.00)</span>
                        <span className="text-amber-400">Consistency Streak Pool (5% = $625.00)</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex p-0.5">
                        <div className="h-full bg-teal-500 rounded-l-full" style={{ width: '95%' }} />
                        <div className="h-full bg-amber-400 rounded-r-full" style={{ width: '5%' }} />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
                        <span>Strict Hare-Niemeyer largest-remainder allocation</span>
                        <span className="text-emerald-400 font-mono font-bold">Exact 0-Cent Balance</span>
                      </p>
                    </div>

                    {/* Member split cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {[
                        {
                          name: 'Maya Chen',
                          role: 'Lead AI Engineer',
                          workPct: '45.0%',
                          workAmt: '$5,343.75',
                          streakDays: 100,
                          streakCapped: true,
                          streakAmt: '$312.50',
                          total: '$5,656.25',
                          tag: '100d Streak Cap 🔥',
                          avatar: 'MC',
                          color: 'from-teal-500 to-emerald-600',
                        },
                        {
                          name: 'Alex Rivera',
                          role: 'Protocol & Smart Contracts',
                          workPct: '30.0%',
                          workAmt: '$3,562.50',
                          streakDays: 60,
                          streakCapped: false,
                          streakAmt: '$187.50',
                          total: '$3,750.00',
                          tag: '60d Active Streak',
                          avatar: 'AR',
                          color: 'from-blue-500 to-indigo-600',
                        },
                        {
                          name: 'Jordan Kim',
                          role: 'Product Architecture',
                          workPct: '15.0%',
                          workAmt: '$1,781.25',
                          streakDays: 30,
                          streakCapped: false,
                          streakAmt: '$93.75',
                          total: '$1,875.00',
                          tag: '30d Active Streak',
                          avatar: 'JK',
                          color: 'from-purple-500 to-pink-600',
                        },
                        {
                          name: 'Sam Patel',
                          role: 'Security & QA Auditor',
                          workPct: '10.0%',
                          workAmt: '$1,187.50',
                          streakDays: 10,
                          streakCapped: false,
                          streakAmt: '$31.25',
                          total: '$1,218.75',
                          tag: '10d Active Streak',
                          avatar: 'SP',
                          color: 'from-amber-500 to-orange-600',
                        },
                      ].map((m) => (
                        <div
                          key={m.name}
                          className="p-4 rounded-2xl bg-[#102C4D]/80 border border-slate-700/80 hover:border-teal-500/40 transition-all hover:-translate-y-0.5"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center font-bold text-xs text-white shadow-sm`}
                              >
                                {m.avatar}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white leading-tight">{m.name}</h4>
                                <p className="text-[11px] text-slate-400">{m.role}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                              <Flame size={11} className="text-amber-400" />
                              {m.tag}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800">
                            <div className="flex justify-between text-slate-300">
                              <span>Work Share ({m.workPct}):</span>
                              <span className="font-mono text-slate-200">{m.workAmt}</span>
                            </div>
                            <div className="flex justify-between text-amber-300/90">
                              <span>Consistency Share ({m.streakDays}d):</span>
                              <span className="font-mono">{m.streakAmt}</span>
                            </div>
                            <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-slate-800/80">
                              <span className="text-teal-400">Total Payout:</span>
                              <span className="font-mono text-teal-300">{m.total}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* TAB 2: AI MULTIMODAL EVIDENCE OCR INSPECTION */}
                {activeTab === 'ai_ocr' && (
                  <motion.div
                    key="ai_ocr"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center"
                  >
                    {/* Simulated Document Scanning */}
                    <div className="bg-[#07172B] rounded-2xl p-5 border border-teal-500/30 relative overflow-hidden">
                      {/* Laser scanning bar */}
                      <motion.div
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent pointer-events-none shadow-[0_0_15px_#2DD4BF]"
                        animate={{ top: ['5%', '90%', '5%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      />

                      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs">
                        <span className="font-mono text-teal-300 flex items-center gap-1.5">
                          <Eye size={14} />
                          <span>Gemini Vision • Fact Extractor</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">
                          CONFIDENCE: 99.4%
                        </span>
                      </div>

                      {/* Document mockup content */}
                      <div className="space-y-3 font-mono text-xs text-slate-300">
                        <div className="p-3 bg-slate-900 rounded-xl border border-teal-500/20">
                          <p className="text-[10px] text-slate-500">// INGESTED EVIDENCE PAYLOAD</p>
                          <p className="text-teal-400 font-bold">SOURCE: github.com/squad/nexus-core/pull/184</p>
                          <p className="text-slate-400 mt-1">Author: @mayachen (Maya Chen)</p>
                          <p className="text-slate-400">Merges: 47 commits • 2,410 additions</p>
                          <p className="text-slate-400">SHA: 8f4a19b02e93d... [Tamper Check OK]</p>
                        </div>

                        <div className="p-3 bg-slate-900 rounded-xl border border-teal-500/20">
                          <p className="text-[10px] text-slate-500">// ATTACHED SOW INVOICE</p>
                          <p className="text-teal-400 font-bold">DOC: AWS-Oct-Production-Billing.pdf</p>
                          <p className="text-slate-400 mt-1">Total Verified Expense: $1,420.00 USD</p>
                          <p className="text-emerald-400">Status: Non-conflicting • Adjudicated</p>
                        </div>
                      </div>
                    </div>

                    {/* AI Structured JSON Output */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                        <Cpu className="w-5 h-5" />
                        <span>AI Extracts Structured Facts, Never Touches Money</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Multimodal Gemini scans incoming pull requests, CSV focus session logs, and client contracts. It emits verifiable fact records and flags anomalies. The deterministic split math engine handles all dollar allocations independently.
                      </p>

                      <div className="bg-[#07172B] rounded-2xl p-4 border border-slate-800 text-xs font-mono space-y-2 text-slate-300">
                        <p className="text-slate-500">// Output Fact Contract:</p>
                        <p><span className="text-purple-400">&quot;member_id&quot;</span>: <span className="text-teal-300">&quot;usr_maya_chen&quot;</span>,</p>
                        <p><span className="text-purple-400">&quot;verified_weight&quot;</span>: <span className="text-amber-300">0.4500</span>,</p>
                        <p><span className="text-purple-400">&quot;timezone&quot;</span>: <span className="text-teal-300">&quot;America/Los_Angeles&quot;</span>,</p>
                        <p><span className="text-purple-400">&quot;streak_eligible_days&quot;</span>: <span className="text-amber-300">100</span>,</p>
                        <p><span className="text-purple-400">&quot;evidence_hash&quot;</span>: <span className="text-teal-300">&quot;sha256:7f83b1...&quot;</span></p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 3: SHA-256 CRYPTOGRAPHIC MERKLE LEDGER */}
                {activeTab === 'ledger' && (
                  <motion.div
                    key="ledger"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2 text-teal-400">
                        <Lock size={16} />
                        <span className="font-bold">Cryptographic Ledger Chain • Block #1489</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyHash}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 transition-colors"
                      >
                        {copiedHash ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedHash ? 'Hash Copied!' : 'Copy Merkle Hash'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl bg-[#07172B] border border-slate-800">
                        <p className="text-[10px] text-slate-500">PREVIOUS BLOCK HASH</p>
                        <p className="text-slate-300 truncate mt-1">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#07172B] border border-teal-500/40 shadow-inner">
                        <p className="text-[10px] text-teal-400 font-bold">CURRENT SEALED HASH</p>
                        <p className="text-teal-300 truncate mt-1">7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#07172B] border border-slate-800">
                        <p className="text-[10px] text-slate-500">MERKLE ROOT</p>
                        <p className="text-slate-300 truncate mt-1">a8f5f167f44f4964e6c998dee827110c</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <div>
                          <p className="text-white font-bold">SHA-256 Ledger State: Sealed &amp; Tamper-Evident</p>
                          <p className="text-[11px] text-slate-400">Zero modifications possible without invalidating hash chaining.</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                        VERIFIED 100%
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* TAB 4: PAYPAL BATCH API DISBURSEMENT */}
                {activeTab === 'paypal' && (
                  <motion.div
                    key="paypal"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                      <div className="flex items-center gap-2 text-teal-400 font-bold">
                        <CreditCard size={16} />
                        <span>PayPal Payouts v1 Single Batch Submission</span>
                      </div>
                      <span className="font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                        HTTP 201 CREATED
                      </span>
                    </div>

                    <div className="bg-[#07172B] rounded-2xl p-4 font-mono text-xs text-slate-300 space-y-1.5 border border-slate-800 overflow-x-auto">
                      <p className="text-slate-500">// POST https://api-m.paypal.com/v1/payments/payouts</p>
                      <p className="text-teal-300">&#123;</p>
                      <p className="pl-4"><span className="text-purple-400">&quot;sender_batch_header&quot;</span>: &#123;</p>
                      <p className="pl-8"><span className="text-purple-400">&quot;sender_batch_id&quot;</span>: <span className="text-amber-300">&quot;microsplit_batch_0192&quot;</span>,</p>
                      <p className="pl-8"><span className="text-purple-400">&quot;email_subject&quot;</span>: <span className="text-amber-300">&quot;You have received your MicroSplit payout!&quot;</span></p>
                      <p className="pl-4">&#125;,</p>
                      <p className="pl-4"><span className="text-purple-400">&quot;items&quot;</span>: [</p>
                      <p className="pl-8">&#123; <span className="text-purple-400">&quot;recipient_type&quot;</span>: <span className="text-teal-300">&quot;EMAIL&quot;</span>, <span className="text-purple-400">&quot;amount&quot;</span>: &#123; <span className="text-purple-400">&quot;value&quot;</span>: <span className="text-teal-300">&quot;5656.25&quot;</span>, <span className="text-purple-400">&quot;currency&quot;</span>: <span className="text-teal-300">&quot;USD&quot;</span> &#125;, <span className="text-purple-400">&quot;receiver&quot;</span>: <span className="text-amber-300">&quot;maya@nexus.org&quot;</span> &#125;,</p>
                      <p className="pl-8">&#123; <span className="text-purple-400">&quot;recipient_type&quot;</span>: <span className="text-teal-300">&quot;EMAIL&quot;</span>, <span className="text-purple-400">&quot;amount&quot;</span>: &#123; <span className="text-purple-400">&quot;value&quot;</span>: <span className="text-teal-300">&quot;3750.00&quot;</span>, <span className="text-purple-400">&quot;currency&quot;</span>: <span className="text-teal-300">&quot;USD&quot;</span> &#125;, <span className="text-purple-400">&quot;receiver&quot;</span>: <span className="text-amber-300">&quot;alex@nexus.org&quot;</span> &#125;</p>
                      <p className="pl-4">]</p>
                      <p className="text-teal-300">&#125;</p>
                    </div>

                    <p className="text-xs text-slate-400">
                      Disburses payouts to your squad in one click. Handles global currency conversions, automatic retry strategies, and real-time webhook status confirmations.
                    </p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </Reveal>

        {/* ─── SHOWCASE PIC 2: Interactive 0-Cent Split Engine Calculator ─── */}
        <Reveal delay={0.2}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#0B1F3A]/70 rounded-3xl p-6 sm:p-10 border border-teal-500/20 mb-24">
            <div className="lg:col-span-5 space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 text-teal-300 text-xs font-bold border border-teal-400/30">
                <Sliders size={13} />
                <span>Deterministic Math Playground</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Simulate your squad&apos;s split in real time.
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Drag the sliders below to see how our integer-cent engine divides funds between core work and consistency streak bonuses with 0 cents lost or created.
              </p>

              {/* Slider 1: Total Pool */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">Total Revenue Pool</span>
                  <span className="text-teal-400 font-mono text-sm">${calcPool.toLocaleString()} USD</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="500"
                  value={calcPool}
                  onChange={(e) => setCalcPool(Number(e.target.value))}
                  className="w-full accent-teal-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Slider 2: Consistency Streak Bonus % */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">Consistency Streak Pool %</span>
                  <span className="text-amber-400 font-mono text-sm">{calcBonusPct}% (${bonusPool.toLocaleString()} USD)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={calcBonusPct}
                  onChange={(e) => setCalcBonusPct(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <p className="text-[10px] text-slate-400">Squad governance rule: maximum 10%</p>
              </div>
            </div>

            {/* Results Live Calculation Matrix */}
            <div className="lg:col-span-7 bg-[#07172B] rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Deterministic Allocation Results
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Sum = ${calcPool.toLocaleString()}.00 (0¢ drift)
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Maya Chen (100d Streak)', work: memberA_work, bonus: memberA_bonus, total: memberA_work + memberA_bonus, pct: '45% work' },
                  { name: 'Alex Rivera (60d Streak)', work: memberB_work, bonus: memberB_bonus, total: memberB_work + memberB_bonus, pct: '30% work' },
                  { name: 'Jordan Kim (30d Streak)', work: memberC_work, bonus: memberC_bonus, total: memberC_work + memberC_bonus, pct: '15% work' },
                  { name: 'Sam Patel (10d Streak)', work: memberD_work, bonus: memberD_bonus, total: memberD_work + memberD_bonus, pct: '10% work' },
                ].map((row) => (
                  <div key={row.name} className="flex items-center justify-between p-3 rounded-xl bg-[#102C4D]/60 border border-slate-800 text-xs">
                    <div>
                      <p className="font-bold text-white">{row.name}</p>
                      <p className="text-[10px] text-slate-400">
                        Work: ${row.work.toLocaleString()} + Streak: ${row.bonus.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-teal-300 text-sm">
                        ${row.total.toLocaleString()}.00
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {((row.total / calcPool) * 100).toFixed(1)}% of pool
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* ─── SHOWCASE PIC 3: 5-Stage Architecture Flow Diagram ─── */}
        <Reveal delay={0.25}>
          <div className="bg-[#0B1F3A]/60 rounded-3xl p-6 sm:p-10 border border-teal-500/20">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-1 block">
                End-to-End Pipeline
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                How MicroSplit AI settles squad capital
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
              {[
                {
                  step: '01',
                  icon: FileText,
                  title: 'Evidence Ingestion',
                  desc: 'GitHub PRs, invoices, CSV logs hashed with SHA-256 upon arrival.',
                },
                {
                  step: '02',
                  icon: Brain,
                  title: 'AI Fact Extraction',
                  desc: 'Multimodal vision structures hours, deliverables, and anomaly checks.',
                },
                {
                  step: '03',
                  icon: GitFork,
                  title: 'Deterministic Math',
                  desc: 'Largest-remainder rounding splits cents with 0 loss or inflation.',
                },
                {
                  step: '04',
                  icon: ShieldCheck,
                  title: 'Merkle Ledger',
                  desc: 'Every split line & streak sealed into an append-only audit trail.',
                },
                {
                  step: '05',
                  icon: CreditCard,
                  title: 'PayPal Batch v1',
                  desc: 'One-click disbursement pays up to 15,000 members worldwide.',
                },
              ].map((p, idx) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.step}
                    className="p-5 rounded-2xl bg-[#07172B] border border-slate-800 flex flex-col justify-between hover:border-teal-500/40 transition-colors group relative"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[11px] font-mono font-bold text-teal-400">
                          STAGE {p.step}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                          <Icon size={16} />
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-2">{p.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                    </div>

                    {idx < 4 && (
                      <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-20 text-teal-400/50">
                        <ChevronRight size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
