"use client";

import { useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

/**
 * Drop-in scroll progress: a glowing bar at the top that shifts from blue to
 * amber as you read, plus a percentage pill (click = back to top).
 * Self-contained: no props, no aliases, no extra CSS needed.
 */
export default function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();

  // Springy smoothing (skipped if the user prefers reduced motion).
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 24, mass: 0.4 });
  const progress = reduce ? scrollYProgress : smooth;

  const color = useTransform(progress, [0, 0.5, 1], ["#0F9D8A", "#5CC8B5", "#F5C26B"]);
  const glow = useTransform(
    progress,
    [0, 1],
    ["0 0 8px 1px rgba(15,157,138,0.55)", "0 0 14px 3px rgba(245,194,107,0.75)"],
  );
  const percent = useTransform(progress, (v) => `${Math.round(Math.min(Math.max(v, 0), 1) * 100)}%`);

  // Show the pill only after the user has scrolled a bit.
  const [showPill, setShowPill] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (v) => setShowPill(v > 0.04));

  return (
    <>
      {/* top bar */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] origin-left"
        style={{ scaleX: progress, backgroundColor: color, boxShadow: glow }}
      />

      {/* percentage pill */}
      <motion.button
        type="button"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
        initial={false}
        animate={{ opacity: showPill ? 1 : 0, y: showPill ? 0 : 12, scale: showPill ? 1 : 0.9 }}
        transition={{ duration: 0.25 }}
        style={{ pointerEvents: showPill ? "auto" : "none" }}
        className="fixed bottom-5 left-5 z-[100] flex items-center gap-2 rounded-full border border-[#34527F] bg-[#0B1F3A]/90 px-3.5 py-2 text-sm font-medium text-[#E8EEF7] shadow-lg backdrop-blur hover:bg-[#1B3A66] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C26B]"
      >
        <span aria-hidden="true">↑</span>
        <motion.span className="min-w-[2.5ch] text-right tabular-nums">{percent}</motion.span>
      </motion.button>
    </>
  );
}