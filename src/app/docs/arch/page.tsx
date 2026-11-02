import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, CheckCircle2, Calculator } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Deterministic Math Proofs & Zero-Loss Invariant | MicroSplit AI',
  description: 'Mathematical proofs of integer-cents arithmetic and largest-remainder quota allocation.',
  alternates: {
    canonical: 'https://microsplit.ai/docs/arch',
  },
  openGraph: {
    title: 'Deterministic Math Proofs — MicroSplit AI',
    description: 'Proofs of zero-loss integer-cent arithmetic and largest-remainder rounding.',
    url: 'https://microsplit.ai/docs/arch',
  },
};

export default function MathProofPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F9D8A] hover:underline mb-8"
        >
          <ArrowLeft size={16} />
          Back to Documentation
        </Link>

        {/* Hero banner */}
        <div className="bg-[#0B1F3A] text-white rounded-3xl p-8 sm:p-12 mb-10 shadow-xl border border-[#102C4D]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F9D8A]/20 border border-[#0F9D8A]/40 text-[#DDF7F3] text-xs font-bold uppercase tracking-wider mb-4">
            <Calculator size={14} className="text-[#0F9D8A]" />
            Algorithmic Invariant
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-white">
            Deterministic Math Proofs
          </h1>
          <p className="text-base text-slate-300 max-w-2xl leading-relaxed">
            Standard floating-point numbers in computer systems introduce precision loss (e.g., 0.1 + 0.2 = 0.30000000000000004). MicroSplit AI guarantees strict zero-cent loss by operating solely on integer minor currency units.
          </p>
        </div>

        {/* Content sections */}
        <div className="space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#0B1F3A] mb-3">1. The Hare-Niemeyer Largest Remainder Method</h2>
            <p className="text-sm mb-4">
              To distribute a pool of <em>P</em> cents among <em>n</em> members with weights <em>w₁, w₂, ..., wₙ</em> (where sum of weights = <em>W</em>):
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-sm">
              <li>Calculate each member&apos;s exact quota: <code>qᵢ = (P × wᵢ) / W</code>.</li>
              <li>Assign the integer floor: <code>aᵢ = floor(qᵢ)</code>.</li>
              <li>Calculate the remainder: <code>rᵢ = qᵢ - aᵢ</code>.</li>
              <li>Compute the remaining unallocated cents: <code>R = P - Σ aᵢ</code>.</li>
              <li>Sort members by remainder <code>rᵢ</code> descending (with deterministic tie-breaking by member ID) and distribute 1 cent to each of the top <code>R</code> members.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1F3A] mb-3">2. Invariant Theorem: Exact Pool Equality</h2>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
              <p className="font-bold flex items-center gap-2 mb-1">
                <CheckCircle2 size={16} className="text-emerald-600" />
                Proof of Exact Equality
              </p>
              <p className="text-xs leading-relaxed">
                By definition, <code>R = P - Σ aᵢ</code>. Exactly <em>R</em> members receive +1 cent, adding <code>Σ 1 = R</code> additional cents. Therefore:
                <br />
                <strong>Final Sum = Σ aᵢ + R = Σ aᵢ + (P - Σ aᵢ) = P.</strong>
                <br />
                The sum of all member allocations strictly equals the total pool <em>P</em>, down to the last single cent. Zero cents are created, and zero cents are lost.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
