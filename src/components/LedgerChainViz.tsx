"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export type LedgerBlock = { id: string; type: string; hash: string };
export type VerifyStatus = "idle" | "verifying" | "valid" | "invalid";

type Props = {
  blocks: LedgerBlock[]; // oldest first
  status: VerifyStatus;
  brokenIndex?: number | null;
  maxVisible?: number;
};

const NEUTRAL = "rgba(255,255,255,0.2)";
const NEUTRAL_LED = "#5B7191";
const LINK_NEUTRAL = "rgba(255,255,255,0.22)";
const GOLD = "#E2B04A";
const GREEN = "#3DDC97";
const RED = "#FF6B6B";

const STATUS_TEXT: Record<VerifyStatus, string> = {
  idle: "Ready to verify.",
  verifying: "Checking each block against the one before it.",
  valid: "Chain verified. Every block links to the one before it.",
  invalid: "Verification failed. A block does not match its predecessor.",
};

const shortHash = (h: string) =>
  h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-4)}` : h;

const label = (type: string) => type.replace(/_/g, " ");

export default function LedgerChainViz({
  blocks,
  status,
  brokenIndex = null,
  maxVisible = 8,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const linkRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const base = Math.max(0, blocks.length - maxVisible);
  const start =
    brokenIndex != null && brokenIndex >= 0 ? Math.min(base, brokenIndex) : base;
  const visible = blocks.slice(start);
  const n = visible.length;
  const broken = brokenIndex != null ? brokenIndex - start : null;

  useGSAP(
    () => {
      if (n === 0) return;

      const blockAt = (i: number) => blockRefs.current[i];
      const linkAt = (i: number) => linkRefs.current[i];
      const ledAt = (i: number) =>
        blockRefs.current[i]?.querySelector<HTMLElement>("[data-led]") ?? null;
      const allBlocks = () =>
        blockRefs.current.slice(0, n).filter((el): el is HTMLDivElement => !!el);
      const allLinks = () =>
        linkRefs.current.slice(1, n).filter((el): el is HTMLSpanElement => !!el);
      const allLeds = () =>
        allBlocks()
          .map((b) => b.querySelector<HTMLElement>("[data-led]"))
          .filter((el): el is HTMLElement => !!el);

      // Baseline: every block tilted slightly, like slabs standing on a floor.
      const resetAll = () => {
        gsap.set(allBlocks(), {
          borderColor: NEUTRAL,
          scale: 1,
          x: 0,
          y: 0,
          opacity: 1,
          rotationY: -10,
          rotationX: 4,
          transformPerspective: 800,
        });
        gsap.set(allLeds(), { color: NEUTRAL_LED });
        gsap.set(allLinks(), { backgroundColor: LINK_NEUTRAL, scaleX: 1, opacity: 1 });
      };

      // null = neutral
      const setNow = (i: number, c: string | null) => {
        const b = blockAt(i);
        const l = ledAt(i);
        if (b) gsap.set(b, { borderColor: c ?? NEUTRAL });
        if (l) gsap.set(l, { color: c ?? NEUTRAL_LED });
      };

      const paint = (
        tl: gsap.core.Timeline,
        i: number,
        c: string | null,
        at: number,
        dur: number
      ) => {
        const b = blockAt(i);
        const l = ledAt(i);
        if (b) tl.to(b, { borderColor: c ?? NEUTRAL, duration: dur }, at);
        if (l) tl.to(l, { color: c ?? NEUTRAL_LED, duration: dur }, at);
      };

      const hasBrokenBlock = broken != null && broken >= 0 && broken < n;

      const applyFinal = () => {
        resetAll();
        if (status === "valid") {
          for (let i = 0; i < n; i++) setNow(i, GREEN);
          gsap.set(allLinks(), { backgroundColor: GREEN });
        }
        if (status === "invalid") {
          for (let i = 0; i < n; i++) {
            const l = i > 0 ? linkAt(i) : null;
            if (!hasBrokenBlock) {
              setNow(i, RED);
              continue;
            }
            const k = broken as number;
            setNow(i, i < k ? GREEN : i === k ? RED : null);
            if (i > k) {
              const b = blockAt(i);
              if (b) gsap.set(b, { opacity: 0.45 });
            }
            if (l) {
              gsap.set(l, {
                backgroundColor: i < k ? GREEN : i === k ? RED : LINK_NEUTRAL,
                opacity: i > k ? 0.35 : 1,
              });
            }
          }
        }
      };

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        applyFinal();
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        resetAll();

        if (status === "verifying") {
          // Gold light travels along the chain; each block lifts as it passes.
          const step = Math.min(0.28, 2.6 / n);
          const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.35 });
          tl.set(allLinks(), { scaleX: 0, backgroundColor: GOLD }, 0);
          for (let i = 0; i < n; i++) {
            const t = i * step;
            const b = blockAt(i);
            const l = i > 0 ? linkAt(i) : null;
            if (l) {
              tl.to(l, { scaleX: 1, duration: step * 0.6, ease: "none" }, Math.max(0, t - step * 0.4));
              tl.to(l, { backgroundColor: LINK_NEUTRAL, duration: step * 0.5 }, t + step);
            }
            paint(tl, i, GOLD, t, step * 0.35);
            paint(tl, i, null, t + step * 0.4, step * 0.5);
            if (b) {
              tl.to(b, { y: -8, scale: 1.04, duration: step * 0.35, ease: "power2.out" }, t);
              tl.to(b, { y: 0, scale: 1, duration: step * 0.5, ease: "power2.inOut" }, t + step * 0.4);
            }
          }
        }

        if (status === "valid") {
          const step = Math.min(0.12, 1.2 / n);
          const tl = gsap.timeline();
          tl.set(allLinks(), { scaleX: 0, backgroundColor: GREEN }, 0);
          for (let i = 0; i < n; i++) {
            const l = i > 0 ? linkAt(i) : null;
            if (l) tl.to(l, { scaleX: 1, duration: step * 0.6, ease: "none" }, Math.max(0, i * step - step * 0.4));
            paint(tl, i, GREEN, i * step, step * 0.5);
          }
          // A small wave: blocks hop up one after another.
          tl.to(
            allBlocks(),
            {
              y: -8,
              duration: 0.18,
              yoyo: true,
              repeat: 1,
              ease: "power1.inOut",
              stagger: { each: 0.03 },
            },
            n * step + 0.1
          );
        }

        if (status === "invalid") {
          const tl = gsap.timeline();

          if (!hasBrokenBlock) {
            for (let i = 0; i < n; i++) paint(tl, i, RED, i * 0.04, 0.25);
          } else {
            const k = broken as number;
            const step = Math.min(0.14, 1.2 / Math.max(k, 1));

            for (let i = 0; i <= k; i++) {
              const color = i === k ? RED : GREEN;
              const l = i > 0 ? linkAt(i) : null;
              if (l) {
                tl.set(l, { scaleX: 0, backgroundColor: color }, 0);
                tl.to(l, { scaleX: 1, duration: step * 0.6, ease: "none" }, Math.max(0, i * step - step * 0.4));
              }
              paint(tl, i, color, i * step, step * 0.5);
            }

            const afterT = k * step + step;
            const kb = blockAt(k);
            if (kb) {
              const shake = gsap.timeline();
              shake
                .to(kb, { x: -8, duration: 0.06 })
                .to(kb, { x: 8, duration: 0.06 })
                .to(kb, { x: -5, duration: 0.06 })
                .to(kb, { x: 5, duration: 0.06 })
                .to(kb, { x: 0, duration: 0.06 });
              tl.add(shake, afterT);
            }

            const laterBlocks = allBlocks().slice(k + 1);
            const laterLinks = allLinks().slice(k);
            if (laterBlocks.length) tl.to(laterBlocks, { opacity: 0.45, duration: 0.3 }, afterT);
            if (laterLinks.length) tl.to(laterLinks, { opacity: 0.35, duration: 0.3 }, afterT);
          }
        }
      });

      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [status, brokenIndex, n], revertOnUpdate: true }
  );

  return (
    <div
      ref={rootRef}
      className="rounded-3xl p-5 text-slate-100 md:p-7"
      style={{
        background: "linear-gradient(180deg, #0F2748 0%, #0A1B33 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 40px rgba(11,31,58,0.35)",
      }}
    >
      <p role="status" className="mb-3 text-sm text-slate-300">
        {STATUS_TEXT[status]}
      </p>

      {n === 0 ? (
        <p className="text-sm text-slate-400">No ledger events yet.</p>
      ) : (
        <ol
          aria-label="Ledger blocks, oldest first"
          className="flex items-center overflow-x-auto px-1 pb-6 pt-3"
        >
          {visible.map((b, i) => (
            <li key={b.id} className="flex min-w-[6.5rem] flex-1 items-center">
              {i > 0 && (
                <span
                  ref={(el) => {
                    linkRefs.current[i] = el;
                  }}
                  aria-hidden="true"
                  className="block h-1.5 w-4 shrink-0 origin-left rounded-full"
                  style={{
                    background: LINK_NEUTRAL,
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 3px rgba(0,0,0,0.5)",
                  }}
                />
              )}
              <div
                ref={(el) => {
                  blockRefs.current[i] = el;
                }}
                className="relative w-full min-w-0 rounded-xl border-2 p-3"
                style={{
                  borderColor: NEUTRAL,
                  background: "linear-gradient(145deg, #1D3D6B 0%, #10284D 100%)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.16), 0 5px 0 #06142A, 0 14px 22px rgba(0,0,0,0.45)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] tabular-nums text-slate-400">
                    #{start + i + 1}
                  </span>
                  <span
                    data-led
                    className="block h-2 w-2 rounded-full"
                    style={{
                      color: NEUTRAL_LED,
                      background: "currentColor",
                      boxShadow: "0 0 8px currentColor",
                    }}
                  />
                </div>
                <p className="mt-2 truncate text-sm font-semibold capitalize text-slate-50">
                  {label(b.type)}
                </p>
                <p className="mt-1.5 truncate rounded-md bg-black/25 px-1.5 py-0.5 text-[11px] tabular-nums text-slate-300">
                  {shortHash(b.hash)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {start > 0 && (
        <p className="text-xs text-slate-400">
          Showing {n} of {blocks.length} events.
        </p>
      )}
    </div>
  );
}