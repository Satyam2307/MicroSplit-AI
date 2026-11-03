"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

type Member = { id: string; name: string; cents: number; chips: number };

// Match the live landing-page demo pool and the multi-scenario payout totals presented below it.
const MEMBERS: Member[] = [
  { id: "maya", name: "Maya Chen", cents: 565_625, chips: 12 },
  { id: "alex", name: "Alex Rivera", cents: 375_000, chips: 8 },
  { id: "jordan", name: "Jordan Kim", cents: 187_500, chips: 4 },
  { id: "sam", name: "Sam Patel", cents: 121_875, chips: 3 },
];
const POOL_CENTS = MEMBERS.reduce((sum, m) => sum + m.cents, 0);

// Mirror your own invariant: the split must equal the pool exactly.
const TOTAL = MEMBERS.reduce((sum, m) => sum + m.cents, 0);
if (process.env.NODE_ENV !== "production" && TOTAL !== POOL_CENTS) {
  throw new Error(`Split does not add up: ${TOTAL} !== ${POOL_CENTS}`);
}

const MAX_CENTS = Math.max(...MEMBERS.map((m) => m.cents));

// Interleave chips so members receive bundles in a mixed order.
const CHIPS = MEMBERS.flatMap((m, member) =>
  Array.from({ length: m.chips }, (_, k) => ({ member, k }))
).sort((a, b) => a.k - b.k || a.member - b.member);

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const fmt = (cents: number) => money.format(cents / 100);

// Tune these to change the feel.
const START = 0.5; // seconds before the first bundle leaves
const STEP = 0.06; // delay between bundles
const FLIGHT = 0.7; // travel time per bundle
const CHIP_W = 20;
const CHIP_H = 12;

export default function SplitStage() {
  const stageRef = useRef<HTMLElement>(null);
  const poolRef = useRef<HTMLDivElement>(null);
  const poolFillRef = useRef<HTMLDivElement>(null);
  const poolAmountRef = useRef<HTMLSpanElement>(null);
  const badgeRef = useRef<HTMLParagraphElement>(null);
  const amountRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chipRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const reducedRef = useRef(false);

  const build = () => {
    const stage = stageRef.current;
    const pool = poolRef.current;
    const badge = badgeRef.current;
    const poolAmount = poolAmountRef.current;
    if (!stage || !pool || !badge || !poolAmount) return null;

    const s = stage.getBoundingClientRect();
    const p = pool.getBoundingClientRect();
    const poolX = p.left - s.left;
    const poolY = p.top - s.top;

    // Reset to the starting state.
    poolAmount.textContent = fmt(POOL_CENTS);
    amountRefs.current.forEach((el) => {
      if (el) el.textContent = fmt(0);
    });
    gsap.set(poolFillRef.current, { scaleY: 1 });
    gsap.set(barRefs.current, { scaleX: 0 });
    gsap.set(chipRefs.current, { opacity: 0, scale: 1 });
    gsap.set(badge, { opacity: 0, scale: 0.96, color: "#9FB3C8" });

    const tl = gsap.timeline();
    const counters = MEMBERS.map(() => ({ v: 0 }));
    const poolCounter = { v: POOL_CENTS };

    const firstLand: number[] = MEMBERS.map(() => Infinity);
    const lastLand: number[] = MEMBERS.map(() => 0);

    CHIPS.forEach((chip, i) => {
      const el = chipRefs.current[i];
      const target = amountRefs.current[chip.member];
      if (!el || !target) return;

      const t = target.getBoundingClientRect();
      const toX = t.left - s.left + t.width / 2 - CHIP_W / 2 + (Math.random() - 0.5) * 16;
      const toY = t.top - s.top + t.height / 2 - CHIP_H / 2 + (Math.random() - 0.5) * 8;
      const fromX = poolX + p.width * (0.2 + 0.6 * Math.random()) - CHIP_W / 2;
      const fromY = poolY + p.height * (0.3 + 0.6 * Math.random()) - CHIP_H / 2;

      const depart = START + i * STEP;
      const land = depart + FLIGHT;
      firstLand[chip.member] = Math.min(firstLand[chip.member], land);
      lastLand[chip.member] = Math.max(lastLand[chip.member], land);

      tl.set(el, { x: fromX, y: fromY, opacity: 0, scale: 1 }, 0)
        .to(el, { opacity: 1, duration: 0.12, ease: "none" }, depart)
        .to(el, { x: toX, y: toY, duration: FLIGHT, ease: "power2.inOut" }, depart)
        .to(el, { scale: 0.3, opacity: 0, duration: 0.18, ease: "power1.in" }, land - 0.18);
    });

    // Member totals and bars grow while their bundles land.
    MEMBERS.forEach((m, i) => {
      const dur = Math.max(lastLand[i] - firstLand[i], 0.2);
      tl.to(
        counters[i],
        {
          v: m.cents,
          duration: dur,
          ease: "none",
          onUpdate: () => {
            const el = amountRefs.current[i];
            if (el) el.textContent = fmt(Math.round(counters[i].v));
          },
          onComplete: () => {
            const el = amountRefs.current[i];
            if (el) el.textContent = fmt(m.cents); // exact, no drift
          },
        },
        firstLand[i]
      ).to(barRefs.current[i], { scaleX: m.cents / MAX_CENTS, duration: dur, ease: "none" }, firstLand[i]);
    });

    // Pool drains while bundles leave.
    const drainDur = (CHIPS.length - 1) * STEP + 0.3;
    tl.to(
      poolCounter,
      {
        v: 0,
        duration: drainDur,
        ease: "none",
        onUpdate: () => {
          poolAmount.textContent = fmt(Math.round(poolCounter.v));
        },
        onComplete: () => {
          poolAmount.textContent = fmt(0);
        },
      },
      START
    ).to(poolFillRef.current, { scaleY: 0, duration: drainDur, ease: "none" }, START);

    // Final confirmation.
    const end = Math.max(...lastLand) + 0.15;
    tl.to(
      badge,
      { opacity: 1, scale: 1, color: "#3DDC97", duration: 0.5, ease: "back.out(2)" },
      end
    );

    return tl;
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        reducedRef.current = true;
        tlRef.current?.kill();
        if (poolAmountRef.current) poolAmountRef.current.textContent = fmt(0);
        gsap.set(poolFillRef.current, { scaleY: 0 });
        gsap.set(badgeRef.current, { opacity: 1, scale: 1, color: "#3DDC97" });
        MEMBERS.forEach((m, i) => {
          gsap.set(barRefs.current[i], { scaleX: m.cents / MAX_CENTS });
        });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        reducedRef.current = false;
        tlRef.current?.kill();
        tlRef.current = build();
      });

      return () => {
        mm.revert();
        tlRef.current?.kill();
      };
    },
    { scope: stageRef }
  );

  const replay = () => {
    if (reducedRef.current) return;
    tlRef.current?.kill();
    tlRef.current = build();
  };

  return (
    <section
      ref={stageRef}
      aria-label="Example split: a $5,000.00 pool paid out to four members"
      className="relative mx-auto w-full max-w-[620px] overflow-hidden rounded-2xl bg-[#0B1F3A] p-4 text-slate-100 md:p-6"
    >
      {/* Screen readers get the final result, not the animation. */}
      <p className="sr-only">
        {MEMBERS.map((m) => `${m.name} ${fmt(m.cents)}`).join(", ")}. Total{" "}
        {fmt(TOTAL)}. 0 cents lost.
      </p>

      <div className="grid gap-4 md:grid-cols-[12rem_1fr] md:items-center" aria-hidden="true">
        {/* Pool */}
        <div
          ref={poolRef}
          className="relative h-32 overflow-hidden rounded-xl border border-white/15 md:h-40"
        >
          <div ref={poolFillRef} className="absolute inset-0 origin-bottom bg-[#E2B04A]/25" />
          <div className="relative flex h-full flex-col justify-end gap-1 p-4">
            <span className="text-sm text-slate-300">Squad pool</span>
            <span
              ref={poolAmountRef}
              className="text-3xl font-semibold tabular-nums tracking-tight"
            >
              {fmt(0)}
            </span>
          </div>
        </div>

        {/* Members */}
        <ul className="space-y-3">
          {MEMBERS.map((m, i) => (
            <li key={m.id}>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-base text-slate-200">{m.name}</span>
                <span
                  ref={(el) => {
                    amountRefs.current[i] = el;
                  }}
                  className="text-xl font-semibold tabular-nums"
                >
                  {fmt(m.cents)}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
                <div
                  ref={(el) => {
                    barRefs.current[i] = el;
                  }}
                  className="h-full w-full origin-left rounded-full bg-[#E2B04A]"
                  style={{ transform: `scaleX(${m.cents / MAX_CENTS})` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Flying bundles */}
      {CHIPS.map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            chipRefs.current[i] = el;
          }}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 rounded-[3px] bg-[#E2B04A] opacity-0 shadow-[0_0_0_1px_rgba(11,31,58,0.6)]"
          style={{ width: CHIP_W, height: CHIP_H }}
        />
      ))}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p
          ref={badgeRef}
          role="status"
          className="text-sm font-medium tabular-nums"
          style={{ color: "#3DDC97" }}
        >
          Paid out {fmt(TOTAL)} of {fmt(POOL_CENTS)}. 0 cents lost.
        </p>
        <button
          type="button"
          onClick={replay}
          className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E2B04A]"
        >
          Replay split
        </button>
      </div>
    </section>
  );
}