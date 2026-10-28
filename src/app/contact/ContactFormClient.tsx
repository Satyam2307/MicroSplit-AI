'use client';

import React, { useState } from 'react';
import { Mail, MessageCircle, Send, CheckCircle2, AlertCircle, Clock, ShieldCheck } from 'lucide-react';

export default function ContactFormClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    squad: '',
    topic: 'Support',
    message: '',
    whatsapp: '',
  });

  const [loading, setLoading] = useState(false);
  const [successTicket, setSuccessTicket] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry');
      }

      setSuccessTicket(data.ticketId);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello MicroSplit AI team! I need assistance with squad revenue attribution and payout settlements.`
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Contact Channels Sidebar */}
      <div className="space-y-4">
        {/* Domain Email Card */}
        <div className="bg-white rounded-2xl p-6 border border-[var(--text)] shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[var(--background)] flex items-center justify-center text-[var(--accent)] mb-4">
            <Mail className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[var(--primary)]">Official Domain Email</h2>
          <p className="text-xs text-[var(--text)] mt-1 mb-3">
            Inquiries and enterprise support answered by human fintech engineers.
          </p>
          <a
            href="mailto:support@microsplit.ai"
            className="inline-block text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            support@microsplit.ai
          </a>
          <div className="mt-2 text-xs text-[var(--text)]">
            Sales: <a href="mailto:partners@microsplit.ai" className="hover:text-[var(--primary)]">partners@microsplit.ai</a>
          </div>
        </div>

        {/* WhatsApp Direct Support */}
        <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)] rounded-2xl p-6 text-white shadow-md">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] mb-4">
            <MessageCircle className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold">Live WhatsApp Support</h2>
          <p className="text-xs text-[var(--text)] mt-1 mb-4">
            Direct priority line for active squad leads and urgent payout verifications.
          </p>
          <a
            href={`https://wa.me/15550192834?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent)] transition-colors shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Chat on WhatsApp
          </a>
        </div>

        {/* Trust & Response Time */}
        <div className="bg-[var(--background)] rounded-2xl p-5 border border-[var(--accent)]/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--primary)] mb-2">
            <Clock className="w-4 h-4 text-[var(--accent)]" />
            Response SLA: &lt; 2 Hours
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text)]">
            <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
            Encrypted transmission with HSTS padlock
          </div>
        </div>
      </div>

      {/* Main Contact Form */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-8 border border-[var(--text)] shadow-sm">
        {successTicket ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[var(--background)] text-[var(--accent)] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--primary)]">Message Transmitted</h3>
            <p className="text-sm text-[var(--text)] max-w-md mx-auto">
              Your inquiry has been logged under ticket reference:
            </p>
            <div className="inline-block px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--text)] font-mono text-sm font-semibold text-[var(--primary)]">
              {successTicket}
            </div>
            <p className="text-xs text-[var(--text)]">
              A confirmation has been sent to our domain support desk at <strong className="text-[var(--primary)]">support@microsplit.ai</strong>.
            </p>
            <button
              onClick={() => {
                setSuccessTicket(null);
                setFormData({
                  name: '',
                  email: '',
                  squad: '',
                  topic: 'Support',
                  message: '',
                  whatsapp: '',
                });
              }}
              className="mt-4 px-5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary)] transition-colors"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--primary)]/20 text-[var(--primary)] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--primary)] mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--text)] text-sm text-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--primary)] mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--text)] text-sm text-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--primary)] mb-1">
                  Squad Name or ID (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fintech Alpha"
                  value={formData.squad}
                  onChange={(e) => setFormData({ ...formData, squad: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--text)] text-sm text-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--primary)] mb-1">
                  WhatsApp Contact (optional)
                </label>
                <input
                  type="text"
                  placeholder="+1 555 019 2834"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--text)] text-sm text-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--primary)] mb-1">
                Inquiry Topic
              </label>
              <select
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--text)] text-sm text-[var(--primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-colors"
              >
                <option value="Support">Technical Support &amp; Attribution</option>
                <option value="PayPal">PayPal Payouts &amp; Settlements</option>
                <option value="Enterprise">Enterprise License &amp; Invoicing</option>
                <option value="Security">Security Disclosures &amp; Audits</option>
                <option value="Other">Other Question</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--primary)] mb-1">
                Message <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Describe what you need assistance with..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--text)] text-sm text-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-[var(--accent)] text-white text-sm font-bold hover:bg-[var(--accent)] disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting Securely...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Inquiry
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
