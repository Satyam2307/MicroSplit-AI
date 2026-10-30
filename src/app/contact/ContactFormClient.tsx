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
  Sparkles,
  Inbox
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
  const [dispatchLinks, setDispatchLinks] = useState<{
    whatsappAlertUrl?: string;
    gmailComposeUrl?: string;
    mailtoUrl?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // WhatsApp connection state
  const [activeWaPhone, setActiveWaPhone] = useState<string>('919294514754');
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
      if (data.dispatch) {
        setDispatchLinks(data.dispatch);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    'Hello MicroSplit AI team! I need priority assistance with squad revenue attribution and payout settlements.'
  );

  const directWhatsAppUrl = `https://wa.me/${activeWaPhone.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;

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
            Inquiries answered by human fintech engineers within 2 hours.
          </p>
          <a
            href="mailto:akshatsinghai6682@gmail.com,support@microsplit.ai"
            className="inline-block text-sm font-semibold text-teal-600 hover:underline"
          >
            akshatsinghai6682@gmail.com
          </a>
          <div className="mt-2 text-xs text-slate-400">
            Support Desk: <span className="text-slate-600 font-medium">support@microsplit.ai</span>
          </div>
        </div>

        {/* WhatsApp Support Card */}
        <div className="bg-gradient-to-br from-[#0B1F3A] to-[#102C4D] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400 mb-4">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-white">Live WhatsApp Desk</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
              Active (+91 9294514754)
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 mb-4 leading-relaxed">
            Direct priority channel for active squad leads, payout verifications, and streak disputes.
          </p>

          <a
            href={directWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Chat on WhatsApp Directly
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
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
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-[#0B1F3A]">Inquiry Registered!</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Your inquiry has been logged under ticket reference:
            </p>
            <div className="inline-block px-4 py-2 rounded-lg bg-slate-100 border border-slate-200 font-mono text-sm font-bold text-[#0B1F3A]">
              {successTicket}
            </div>

            {/* Instant Dispatch Action Buttons */}
            <div className="max-w-md mx-auto pt-3 space-y-2.5">
              <p className="text-xs font-bold text-slate-700">Instant Alert Channels:</p>

              {dispatchLinks?.whatsappAlertUrl && (
                <a
                  href={dispatchLinks.whatsappAlertUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Instant WhatsApp Message to +91 9294514754</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              )}

              {dispatchLinks?.gmailComposeUrl && (
                <a
                  href={dispatchLinks.gmailComposeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold hover:bg-slate-200 border border-slate-300 transition-all"
                >
                  <Mail className="w-4 h-4 text-rose-600" />
                  <span>Open & Send via Gmail to akshatsinghai6682@gmail.com</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>

            <div className="pt-4">
              <button
                onClick={() => {
                  setSuccessTicket(null);
                  setDispatchLinks(null);
                  setFormData({
                    name: '',
                    email: '',
                    squad: '',
                    topic: 'Support',
                    message: '',
                    whatsapp: '',
                  });
                }}
                className="px-5 py-2 rounded-xl bg-[#0B1F3A] text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Send Another Message
              </button>
            </div>
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
                  placeholder="yourname@gmail.com"
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
                  <span>Your WhatsApp Phone Number</span>
                  <span className="text-[10px] text-teal-600 font-bold">Fastest Response</span>
                </label>
                <input
                  id="whatsapp-input"
                  type="text"
                  placeholder="+91 98765 43210"
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
                  Registering Inquiry...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Inquiry &amp; Dispatch Alert
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
