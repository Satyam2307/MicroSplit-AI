'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, GitBranch, Mail, ArrowRight, UserCheck } from 'lucide-react';
import { Reveal } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('alex@microsplit.demo');
  const [role, setRole] = useState('owner');

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/squads');
  };

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
            Demo Workspace
          </h1>
          <p className="text-sm text-center mb-8 text-[var(--text)]">
            Explore MicroSplit AI with the pre-loaded Alex Rivera demo profile
          </p>

          {/* GitHub button (Mockup demo flow) */}
          <button
            onClick={() => router.push('/squads')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm mb-4 transition-all text-white cursor-pointer hover:opacity-90"
            style={{ background: 'var(--primary)' }}
          >
            <GitBranch size={18} />
            Continue with GitHub (Demo)
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[var(--text)] opacity-20" />
            <span className="text-xs font-medium text-[var(--text)]">or demo role</span>
            <div className="flex-1 h-px bg-[var(--text)] opacity-20" />
          </div>

          {/* Email / Role login */}
          <form onSubmit={handleContinue} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2 text-[var(--text)]">
                Email
              </label>
              <div className="relative flex items-center">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-[var(--text)]"
                />
                <input
                  type="email"
                  name="email"
                  className="input-field w-full text-sm font-medium"
                  placeholder="alex@microsplit.demo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2 text-[var(--text)]">
                Demo Role
              </label>
              <select
                name="role"
                className="input-field w-full text-sm font-medium"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="owner">Owner (Alex Rivera)</option>
                <option value="approver">Approver</option>
                <option value="contributor">Contributor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center mt-2 text-white flex items-center gap-2 cursor-pointer hover:opacity-90"
              style={{ background: 'var(--accent)' }}
            >
              <span>Launch Demo Console</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-xs text-center mt-6 text-[var(--text)] opacity-80">
            Demo mode active &bull; No authentication required
          </p>
        </div>
      </Reveal>
    </div>
  );
}
