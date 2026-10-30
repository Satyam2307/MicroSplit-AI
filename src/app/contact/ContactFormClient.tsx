'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  MessageCircle,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ExternalLink,
  PhoneCall,
  Sparkles
} from 'lucide-react';

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

  // WhatsApp connection state
  const [activeWaPhone, setActiveWaPhone] = useState<string | null>(null);
  const [showWaCallbackNote, setShowWaCallbackNote] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('microsplit_custom_whatsapp');
      if (stored && stored.replace(/[^0-9]/g, '').length >= 8 && stored !== '15550192834') {
        setActiveWaPhone(stored);
      } else if (
        process.env.NEXT_PUBLIC_WHATSAPP_PHONE &&
        process.env.NEXT_PUBLIC_WHATSAPP_PHONE !== '15550192834' &&
        process.env.NEXT_PUBLIC_WHATSAPP_PHONE.replace(/[^0-9]/g, '').length >= 8
      ) {
        setActiveWaPhone(process.env.NEXT_PUBLIC_WHATSAPP_PHONE);
      } else {
        setActiveWaPhone('919294514754');
      }
    }
  }, []);

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
    'Hello MicroSplit AI team! I need priority assistance with squad revenue attribution and payout settlements.'
  );

  const directWhatsAppUrl = activeWaPhone
    ? `https://wa.me/${activeWaPhone.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`
    : null;

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    if (!directWhatsAppUrl) {
      e.preventDefault();
      setShowWaCallbackNote(true);
      // Autofocus the WhatsApp field on the form
      const el = document.getElementById('whatsapp-input');
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Contact Channels Sidebar */}
      <div className="space-y-4">
        {/* Domain Email Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-teal-600 mb-4">
            <Mail className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#0B1F3A]">Official Domain Email</h2>
          <p className="text-xs text-slate-500 mt-1 mb-3">
            Inquiries and enterprise support answered by human fintech engineers.
          </p>
          <a
            href="mailto:support@microsplit.ai"
            className="inline-block text-sm font-semibold text-teal-600 hover:underline"
          >
            support@microsplit.ai
          </a>
          <div className="mt-2 text-xs text-slate-400">
            Sales: <a href="mailto:partners@microsplit.ai" className="hover:text-teal-600 text-slate-600 font-medium">partners@microsplit.ai</a>
          </div>
        </div>

        {/* WhatsApp Support Card */}
        <div className="bg-gradient-to-br from-[#0B1F3A] to-[#102C4D] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400 mb-4">
            <MessageCircle className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-white">Live WhatsApp Desk</h2>
          <p className="text-xs text-slate-300 mt-1 mb-4 leading-relaxed">
            Direct priority channel for active squad leads, payout verifications, and streak disputes.
          </p>

          {directWhatsAppUrl ? (
            <a
              href={directWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Chat on WhatsApp
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          ) : (
            <div>
              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="inline-flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-500 transition-colors shadow-sm"
              >
                <PhoneCall className="w-4 h-4" />
                Request Priority WhatsApp Ping
              </button>
              {showWaCallbackNote && (
                <div className="mt-3 p-3 bg-white/10 rounded-xl text-[11px] text-teal-200 border border-teal-400/20 animate-in fade-in">
                  Fill in your WhatsApp number on the form beside this card to receive an instant message from our engineer!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trust & Response Time */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-teal-500/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0B1F3A] mb-2">
            <Clock className="w-4 h-4 text-teal-600" />
            Response SLA: &lt; 2 Hours (WhatsApp &lt; 15m)
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            Encrypted transmission with HSTS padlock
          </div>
        </div>
      </div>

      {/* Main Contact Form */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        {successTicket ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-[#0B1F3A]">Message Transmitted</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Your inquiry has been logged under ticket reference:
            </p>
            <div className="inline-block px-4 py-2 rounded-lg bg-slate-100 border border-slate-200 font-mono text-sm font-semibold text-[#0B1F3A]">
              {successTicket}
            </div>
            <p className="text-xs text-slate-500">
              A confirmation has been sent to our domain support desk at <strong className="text-[#0B1F3A]">support@microsplit.ai</strong>.
              {formData.whatsapp && (
                <span className="block mt-1 text-emerald-700 font-medium">
                  Priority alert sent to our WhatsApp on-call team for {formData.whatsapp}.
                </span>
              )}
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
              className="mt-4 px-5 py-2.5 rounded-xl bg-[#0B1F3A] text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                  Squad Name or ID (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fintech Alpha"
                  value={formData.squad}
                  onChange={(e) => setFormData({ ...formData, squad: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1F3A] mb-1 flex items-center justify-between">
                  <span>WhatsApp Contact (for instant reply)</span>
                  <span className="text-[10px] text-teal-600 font-bold">Fastest Response</span>
                </label>
                <input
                  id="whatsapp-input"
                  type="text"
                  placeholder="+1 (555) 000-0000 or +91 98765 43210"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                Inquiry Topic
              </label>
              <select
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0B1F3A] bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              >
                <option value="Support">Technical Support &amp; Attribution</option>
                <option value="PayPal">PayPal Payouts &amp; Settlements</option>
                <option value="Enterprise">Enterprise License &amp; Invoicing</option>
                <option value="Security">Security Disclosures &amp; Audits</option>
                <option value="Other">Other Question</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                Message <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Describe what you need assistance with..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
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
