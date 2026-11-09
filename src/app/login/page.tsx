'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Mail, ArrowRight, User, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/ui';
import {
  setCurrentUser,
  getInitials,
  DEFAULT_DEMO_USER,
} from '@/lib/client-storage';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('owner');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim() || 'demo@microsplit.ai';
    let cleanName = name.trim();
    if (!cleanName) {
      cleanName =
        cleanEmail
          .split('@')[0]
          .split(/[._-]/)
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(' ') || 'MicroSplit User';
    }

    setCurrentUser({
      id: `usr_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role,
      initials: getInitials(cleanName),
    });

    router.push('/squads');
  };

  const handlePreFillDemo = () => {
    setName(DEFAULT_DEMO_USER.name);
    setEmail(DEFAULT_DEMO_USER.email);
    setRole(DEFAULT_DEMO_USER.role);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          'linear-gradient(135deg, var(--primary) 0%, var(--primary) 50%, var(--primary) 100%)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 70%)',
        }}
      />

      <Reveal>
        <div
          className="relative w-full max-w-md p-8 sm:p-10 rounded-3xl"
          style={{
            background: 'var(--background)',
            boxShadow:
              '0 20px 48px color-mix(in srgb, var(--primary) 25%, transparent)',
          }}
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{
                background:
                  'linear-gradient(135deg, var(--primary), var(--accent))',
                boxShadow:
                  '0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent)',
              }}
            >
              <Zap size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-[var(--primary)]">
              Micro<span style={{ color: 'var(--accent)' }}>Split</span>
            </span>
          </div>

          <h1 className="text-2xl font-black text-center mb-1 text-[var(--primary)]">
            Sign In to MicroSplit
          </h1>
          <p className="text-xs text-center mb-6 text-[var(--text)] opacity-80">
            Enter your credentials to manage your squads and revenue splits
          </p>

          {/* Quick Demo Pre-fill Pill */}
          <div className="flex justify-center mb-6">
            <button
              type="button"
              onClick={handlePreFillDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 cursor-pointer"
              style={{
                background: 'rgba(15, 157, 138, 0.12)',
                color: '#0F9D8A',
                border: '1px solid rgba(15, 157, 138, 0.3)',
              }}
            >
              <Sparkles size={13} />
              <span>Use Alex Rivera Demo Profile</span>
            </button>
          </div>

          {/* Email / Role login form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2 text-[var(--text)]">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-[var(--text)] opacity-60"
                />
                <input
                  type="text"
                  name="name"
                  className="input-field w-full text-sm font-medium"
                  placeholder="e.g. Alex Rivera or your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2 text-[var(--text)]">
                Email
              </label>
              <div className="relative flex items-center">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-[var(--text)] opacity-60"
                />
                <input
                  type="email"
                  name="email"
                  required
                  className="input-field w-full text-sm font-medium"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2 text-[var(--text)]">
                Role
              </label>
              <select
                name="role"
                className="input-field w-full text-sm font-medium"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="owner">Squad Owner</option>
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
              <span>Sign In &amp; Launch Console</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-xs text-center mt-6 text-[var(--text)] opacity-60">
            Secure session stored locally &bull; No third-party tracking
          </p>
        </div>
      </Reveal>
    </div>
  );
}
