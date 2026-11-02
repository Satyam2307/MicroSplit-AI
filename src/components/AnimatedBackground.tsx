'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export default function AnimatedBackground() {
  const prefersReducedMotion = useReducedMotion();
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Pre-calculated static star / node positions for cryptographic particle grid
  const staticParticles = [
    { top: '8%', left: '12%', size: 3, delay: 0, duration: 4 },
    { top: '15%', left: '85%', size: 2.5, delay: 1, duration: 5 },
    { top: '28%', left: '42%', size: 2, delay: 0.5, duration: 3.5 },
    { top: '35%', left: '7%', size: 3, delay: 1.5, duration: 4.5 },
    { top: '48%', left: '92%', size: 2, delay: 2, duration: 4 },
    { top: '62%', left: '18%', size: 3.5, delay: 0.8, duration: 5.5 },
    { top: '70%', left: '78%', size: 2.5, delay: 1.2, duration: 4.2 },
    { top: '82%', left: '35%', size: 2, delay: 2.2, duration: 3.8 },
    { top: '90%', left: '88%', size: 3, delay: 0.3, duration: 4.8 },
    { top: '22%', left: '65%', size: 2, delay: 1.8, duration: 4 },
    { top: '55%', left: '50%', size: 2.5, delay: 2.5, duration: 5 },
    { top: '75%', left: '6%', size: 2, delay: 0.7, duration: 3.6 },
  ];

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* ── 1. Interactive Mouse Spotlight (Awwwards-style Ambient Follower) ── */}
      {isClient && !prefersReducedMotion && (
        <div
          className="absolute w-[650px] h-[650px] rounded-full transition-transform duration-300 ease-out -translate-x-1/2 -translate-y-1/2 opacity-35"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            background:
              'radial-gradient(circle, rgba(15, 157, 138, 0.14) 0%, rgba(11, 31, 58, 0.05) 45%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
      )}

      {/* ── 2. Atmospheric Ambient Glowing Orbs ── */}
      {/* Top-Right Teal Nebula */}
      <motion.div
        className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(15, 157, 138, 0.22) 0%, rgba(16, 44, 77, 0.08) 50%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={
          prefersReducedMotion
            ? {}
            : {
                scale: [1, 1.15, 1],
                x: [0, 20, 0],
                y: [0, -20, 0],
              }
        }
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Top-Left Midnight Navy Atmosphere */}
      <motion.div
        className="absolute top-1/4 -left-40 w-[550px] h-[550px] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(11, 31, 58, 0.25) 0%, rgba(15, 157, 138, 0.1) 50%, transparent 70%)',
          filter: 'blur(90px)',
        }}
        animate={
          prefersReducedMotion
            ? {}
            : {
                scale: [1.1, 1, 1.1],
                x: [0, -15, 0],
                y: [0, 25, 0],
              }
        }
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Center-Bottom Emerald Pulse */}
      <motion.div
        className="absolute bottom-10 left-1/3 w-[700px] h-[500px] rounded-full opacity-25"
        style={{
          background: 'radial-gradient(ellipse, rgba(16, 185, 129, 0.15) 0%, rgba(11, 31, 58, 0.06) 55%, transparent 75%)',
          filter: 'blur(100px)',
        }}
        animate={
          prefersReducedMotion
            ? {}
            : {
                scale: [1, 1.08, 1],
                opacity: [0.2, 0.32, 0.2],
              }
        }
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── 3. Subtle Perspective Grid (Monet-Inspired Spatial Floor) ── */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(11, 31, 58, 0.8) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(11, 31, 58, 0.8) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at 50% 40%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 20%, transparent 75%)',
        }}
      />

      {/* ── 4. Floating Cryptographic Particles (Nodes & Merkle Blocks) ── */}
      {staticParticles.map((p, idx) => (
        <motion.div
          key={idx}
          className="absolute rounded-full"
          style={{
            top: p.top,
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: idx % 2 === 0 ? '#0F9D8A' : '#38BDF8',
            boxShadow: `0 0 10px ${idx % 2 === 0 ? 'rgba(15, 157, 138, 0.8)' : 'rgba(56, 189, 248, 0.8)'}`,
          }}
          animate={
            prefersReducedMotion
              ? {}
              : {
                  opacity: [0.15, 0.75, 0.15],
                  scale: [1, 1.4, 1],
                  y: [0, -10, 0],
                }
          }
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* ── 5. Ambient Top Light Beam (Awwwards Horizon Glow) ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-24 pointer-events-none opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(15, 157, 138, 0.35) 0%, rgba(11, 31, 58, 0.1) 40%, transparent 70%)',
        }}
      />
    </div>
  );
}
