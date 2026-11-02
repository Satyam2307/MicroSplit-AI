'use client';

import { Zap, GitBranch, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/ui';
import { signInWithGitHub } from '@/app/actions/auth';

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary) 50%, var(--primary) 100%)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 70%)' }}
      />

      <Reveal>
        <div
          className="relative w-full max-w-md p-8 sm:p-10 rounded-3xl"
          style={{ background: 'var(--background)', boxShadow: '0 20px 48px color-mix(in srgb, var(--primary) 25%, transparent)' }}
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                boxShadow: '0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent)',
              }}
            >
              <Zap size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-[var(--primary)]">
              Micro<span style={{ color: 'var(--accent)' }}>Split</span>
            </span>
          </div>

          <h1 className="text-2xl font-black text-center mb-2 text-[var(--primary)]">
            Welcome back
          </h1>
          <p className="text-sm text-center mb-8 text-[var(--text)]">
            Sign in to manage your squads and splits
          </p>

          {/* GitHub button */}
          <form action={signInWithGitHub}>
            <button
              type="submit"
              className="btn-primary w-full justify-center mt-2 text-white"
              style={{ background: 'var(--accent)' }}
            >
              <GitBranch size={18} />
              Continue with GitHub
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-xs text-center mt-6 text-[var(--text)]">
            Sign in securely with your GitHub account
          </p>
        </div>
      </Reveal>
    </div>
  );
}
