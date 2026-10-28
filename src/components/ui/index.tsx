'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// ─── Reveal (scroll-triggered fade in) ──────────────────────
interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function Reveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();

  const offsets = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { y: 0, x: -30 },
    right: { y: 0, x: 30 },
  };

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── MoneyChip ───────────────────────────────────────────────
interface MoneyChipProps {
  amount: string;
  status?: 'paid' | 'pending' | 'failed' | 'default';
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MoneyChip({
  amount,
  status = 'default',
  size = 'md',
}: MoneyChipProps) {
  const statusStyles = {
    paid: { bg: 'var(--status-success-bg)', color: 'var(--status-success)', dot: 'var(--status-success)' },
    pending: { bg: 'var(--status-warning-bg)', color: 'var(--status-warning)', dot: 'var(--status-warning)' },
    failed: { bg: 'var(--status-error-bg)', color: 'var(--status-error)', dot: 'var(--status-error)' },
    default: {
      bg: 'var(--accent-subtle)',
      color: 'var(--accent)',
      dot: 'var(--accent)',
    },
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3.5 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const s = statusStyles[status];

  return (
    <span
      className={`money-chip ${sizeStyles[size]} tabular-nums inline-flex items-center gap-1.5 rounded-full font-bold`}
      style={{ background: s.bg, color: s.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: s.dot }}
      />
      {amount}
    </span>
  );
}

// ─── StatusChip ──────────────────────────────────────────────
interface StatusChipProps {
  label: string;
  variant: 'mint' | 'amber' | 'rose' | 'violet' | 'teal' | 'info' | 'muted' | 'success' | 'warning' | 'error';
}

export function StatusChip({ label, variant }: StatusChipProps) {
  return <span className={`chip chip-${variant}`}>{label}</span>;
}

// ─── ProgressPipeline ────────────────────────────────────────
interface PipelineProps {
  stages: {
    label: string;
    status: 'completed' | 'active' | 'pending';
  }[];
}

export function ProgressPipeline({ stages }: PipelineProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex items-center w-full gap-0 overflow-x-auto py-2">
      {stages.map((stage, i) => (
        <div key={stage.label} className="flex items-center">
          <motion.div
            className="pipeline-step whitespace-nowrap"
            style={{
              background:
                stage.status === 'completed'
                  ? 'var(--status-success-bg)'
                  : stage.status === 'active'
                    ? 'var(--accent-subtle)'
                    : 'var(--surface)',
              color:
                stage.status === 'completed'
                  ? 'var(--status-success)'
                  : stage.status === 'active'
                    ? 'var(--accent)'
                    : 'var(--muted-light)',
              fontWeight: stage.status === 'active' ? 700 : 600,
            }}
            initial={
              prefersReducedMotion ? false : { scale: 0.9, opacity: 0 }
            }
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            {stage.status === 'completed' && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3 7.5L5.5 10L11 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {stage.status === 'active' && (
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: 'var(--accent)',
                  boxShadow: '0 0 8px color-mix(in srgb, var(--accent) 50%, transparent)',
                }}
              />
            )}
            {stage.label}
          </motion.div>
          {i < stages.length - 1 && (
            <div
              className="pipeline-connector"
              style={{
                background:
                  stage.status === 'completed'
                    ? 'linear-gradient(90deg, var(--accent), var(--status-success))'
                    : 'var(--border)',
                minWidth: 32,
                height: 2,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── WeightBar ───────────────────────────────────────────────
interface WeightBarProps {
  percentage: number;
  label?: string;
  color?: string;
}

export function WeightBar({
  percentage,
  label,
  color = 'var(--accent)',
}: WeightBarProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            {label}
          </span>
          <span
            className="text-xs font-bold tabular-nums"
            style={{ color: 'var(--text)' }}
          >
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
      <div className="weight-bar">
        <motion.div
          className="weight-bar-fill"
          style={{ background: `linear-gradient(90deg, ${color}, var(--accent))` }}
          initial={prefersReducedMotion ? { width: `${percentage}%` } : { width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </div>
    </div>
  );
}

// ─── ConfidenceMeter ─────────────────────────────────────────
interface ConfidenceMeterProps {
  value: number; // 0-1
  showLabel?: boolean;
}

export function ConfidenceMeter({
  value,
  showLabel = true,
}: ConfidenceMeterProps) {
  const dots = 5;
  const filled = Math.round(value * dots);
  const variant = value >= 0.7 ? 'active' : value >= 0.4 ? 'warning' : 'danger';

  return (
    <div className="flex items-center gap-2">
      <div className="confidence-meter">
        {Array.from({ length: dots }).map((_, i) => (
          <span
            key={i}
            className={`confidence-dot ${i < filled ? variant : ''}`}
          />
        ))}
      </div>
      {showLabel && (
        <span
          className="text-xs font-semibold tabular-nums"
          style={{
            color:
              variant === 'active'
                ? 'var(--status-success)'
                : variant === 'warning'
                  ? 'var(--status-warning)'
                  : 'var(--status-error)',
          }}
        >
          {(value * 100).toFixed(0)}%
        </span>
      )}
    </div>
  );
}

// ─── CountUp ─────────────────────────────────────────────────
interface CountUpProps {
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function CountUp({
  end,
  prefix = '',
  suffix = '',
  duration = 2,
  className = '',
}: CountUpProps) {
  const [count, setCount] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    if (prefersReducedMotion) {
      setCount(end);
      return;
    }

    const steps = 60;
    const increment = end / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, (duration * 1000) / steps);

    return () => clearInterval(timer);
  }, [hasStarted, end, duration, prefersReducedMotion]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Card ────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export function Card({
  children,
  className = '',
  elevated = false,
  padding = 'md',
  hover = true,
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`${elevated ? 'glass-card-elevated' : 'glass-card'} ${paddings[padding]} ${className}`}
      style={{
        ...(hover ? {} : { boxShadow: 'var(--shadow-sm)' }),
      }}
    >
      {children}
    </div>
  );
}

// ─── EmptyState ──────────────────────────────────────────────
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: 'var(--accent-subtle)',
          color: 'var(--accent)',
          border: '1px solid var(--border-strong)',
        }}
      >
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>
        {title}
      </h3>
      <p
        className="text-sm max-w-sm mb-6"
        style={{ color: 'var(--muted)' }}
      >
        {description}
      </p>
      {action}
    </div>
  );
}
