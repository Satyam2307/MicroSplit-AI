'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Sparkles,
  Globe,
  Mail,
  User,
} from 'lucide-react';
import { Reveal, Card } from '@/components/ui';
import { mockSquads, mockMemberships, mockUsers } from '@/lib/mock-data';

export default function NewSquadPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [ownerName, setOwnerName] = useState('Alex Rivera');
  const [ownerEmail, setOwnerEmail] = useState('alex@paypal.demo');
  const [ownerTimezone, setOwnerTimezone] = useState('Asia/Kolkata');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Squad name is required');
      return;
    }
    if (!ownerEmail.trim()) {
      setError('Owner email address is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/squads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          currency,
          ownerName: ownerName.trim() || ownerEmail.split('@')[0],
          ownerEmail: ownerEmail.trim(),
          ownerTimezone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create squad');
      }

      // Sync client in-memory data
      if (data.data && !mockSquads.some((s) => s.id === data.data.id)) {
        mockSquads.push(data.data);
      }
      if (data.membership && !mockMemberships.some((m) => m.id === data.membership.id)) {
        mockMemberships.push(data.membership);
      }
      if (data.user && !mockUsers.some((u) => u.id === data.user.id)) {
        mockUsers.push(data.user);
      }

      router.push(`/squads/${data.data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10" style={{ background: 'var(--background)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-6">
            <Link
              href="/squads"
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors text-[var(--text)] hover:text-[var(--primary)]"
            >
              <ArrowLeft size={16} /> Back to Squads
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
              style={{
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                boxShadow: '0 4px 12px color-mix(in srgb, var(--accent) 25%, transparent)',
              }}
            >
              <Users size={22} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--primary)' }}>
                Create New Squad
              </h1>
              <p className="text-sm text-[var(--text)]">
                Establish an isolated workspace for revenue splitting with you as the sole owner.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <Card padding="lg" elevated>
              {error && (
                <div className="mb-6 p-4 rounded-xl text-sm font-semibold bg-[var(--background)] text-[var(--primary)] border border-[var(--background)]">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Squad Name */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-[var(--primary)]">
                    Squad Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Growth Collective"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field text-base w-full"
                  />
                  <p className="text-xs mt-1.5 text-[var(--text)]">
                    The collaborative workspace name for your team or freelance project.
                  </p>
                </div>

                {/* Currency & Timezone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-[var(--primary)]">
                      Settlement Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="input-field text-base w-full font-medium"
                    >
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="INR">INR (₹) - Indian Rupee</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                      <option value="CAD">CAD (CA$) - Canadian Dollar</option>
                      <option value="AUD">AUD (A$) - Australian Dollar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-[var(--primary)]">
                      Owner Timezone
                    </label>
                    <select
                      value={ownerTimezone}
                      onChange={(e) => setOwnerTimezone(e.target.value)}
                      className="input-field text-base w-full font-medium"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30) - India</option>
                      <option value="America/New_York">America/New_York (EST, UTC-5)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST, UTC-8)</option>
                      <option value="Europe/London">Europe/London (GMT/BST, UTC+0)</option>
                      <option value="Europe/Berlin">Europe/Berlin (CET, UTC+1)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST, UTC+9)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4)</option>
                      <option value="UTC">UTC (Universal)</option>
                    </select>
                  </div>
                </div>

                {/* Creator Details (User can specify own name and email) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-[var(--primary)]">
                      Creator / Owner Name
                    </label>
                    <div className="relative flex items-center">
                      <User size={16} className="absolute left-3.5 text-[var(--text)] pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="Your full name"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="input-field text-sm w-full"
                        style={{ paddingLeft: '44px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-[var(--primary)]">
                      Creator PayPal / Payout Email
                    </label>
                    <div className="relative flex items-center">
                      <Mail size={16} className="absolute left-3.5 text-[var(--text)] pointer-events-none" />
                      <input
                        type="email"
                        required
                        placeholder="your@paypal.email"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        className="input-field text-sm w-full"
                        style={{ paddingLeft: '44px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Enterprise Notice */}
                <div
                  className="p-4 rounded-xl border flex items-start gap-3"
                  style={{ background: 'var(--background)', borderColor: 'var(--text)' }}
                >
                  <Sparkles size={18} className="text-[var(--accent)] mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-[var(--primary)] mb-0.5">
                      Clean Workspace Guarantee
                    </p>
                    <p className="text-[var(--text)]">
                      New squads are initialized exclusively with you as the verified owner. No demo members are pre-populated. You have full control to add collaborators anytime.
                    </p>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-[var(--text)]">
                  <Link href="/squads" className="btn-ghost text-sm font-semibold text-[var(--text)] hover:text-[var(--primary)]">
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="btn-primary"
                    style={{
                      background: 'var(--accent)',
                      boxShadow: '0 4px 12px color-mix(in srgb, var(--accent) 28%, transparent)',
                      opacity: loading || !name.trim() ? 0.6 : 1,
                      cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Squad...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Create Squad
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Card>
          </form>
        </Reveal>
      </div>
    </div>
  );
}
