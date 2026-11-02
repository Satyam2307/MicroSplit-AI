'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Mail, Phone, X, Send, ShieldCheck, ExternalLink } from 'lucide-react';

type Channel = 'whatsapp' | 'email';

const DEFAULT_COUNTRY_CODE = '91'; // added when a 10-digit number is typed
const MAX_LEN = 500;
const EMAIL_SUBJECT = 'MicroSplit AI enquiry';
const DEFAULT_MESSAGE =
  'Hi MicroSplit AI team, I need help with squad revenue attribution and payout settlements.';

const QUICK_MESSAGES = [
  { label: 'Payout help', text: 'Hi MicroSplit AI team, I need help with a payout settlement.' },
  { label: 'Pricing', text: 'Hi MicroSplit AI team, could you share your pricing details?' },
  { label: 'Book a demo', text: 'Hi MicroSplit AI team, I would like to book a demo.' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [channel, setChannel] = useState<Channel>('whatsapp');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [inquiryText, setInquiryText] = useState(DEFAULT_MESSAGE);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const validate = (): string | null => {
    if (!inquiryText.trim()) return 'Please type your enquiry message.';
    if (channel === 'whatsapp') {
      const d = getWhatsAppDigits();
      if (d.length < 11 || d.length > 15)
        return 'Enter a valid number with country code, e.g. +91 98765 43210.';
    } else if (!EMAIL_RE.test(email.trim())) {
      return 'Enter a valid email address, e.g. name@example.com.';
    }
    return null;
  };

  function getWhatsAppDigits() {
    let d = phoneNumber.replace(/\D/g, '');
    if (d.length === 10) d = DEFAULT_COUNTRY_CODE + d;
    return d;
  }

  const open = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    setError(problem);
    if (problem) return;

    const text = inquiryText.trim();
    if (channel === 'whatsapp') {
      open(`https://wa.me/${getWhatsAppDigits()}?text=${encodeURIComponent(text)}`);
    } else {
      // Gmail web compose (works without a desktop mail app)
      open(
        `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email.trim())}` +
          `&su=${encodeURIComponent(EMAIL_SUBJECT)}&body=${encodeURIComponent(text)}`
      );
    }
  };

  const handleMailApp = () => {
    const problem = validate();
    setError(problem);
    if (problem) return;
    window.location.href =
      `mailto:${email.trim()}?subject=${encodeURIComponent(EMAIL_SUBJECT)}` +
      `&body=${encodeURIComponent(inquiryText.trim())}`;
    setIsOpen(false);
  };

  const switchChannel = (c: Channel) => {
    setChannel(c);
    setError(null);
  };

  const inputBase =
    'w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-[#0B1F3A] placeholder:text-slate-400 transition focus:border-[#0F9D8A] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0F9D8A]/15';

  return (
    <aside aria-label="Support chat" className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.form
            key="panel"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="w-[340px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div
              className="flex items-start justify-between px-5 py-4 text-white"
              style={{ background: 'linear-gradient(135deg, #0F9D8A 0%, #087F73 100%)' }}
            >
              <div>
                <h2 className="text-base font-bold">Talk to MicroSplit AI</h2>
                <p className="mt-0.5 text-xs text-white/80">Pick a channel and send your enquiry.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="rounded-full p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {/* Channel toggle */}
              <div role="tablist" className="mb-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                {(['whatsapp', 'email'] as Channel[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="tab"
                    aria-selected={channel === c}
                    onClick={() => switchChannel(c)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                      channel === c
                        ? 'bg-white text-[#087F73] shadow-sm'
                        : 'text-slate-500 hover:text-[#0B1F3A]'
                    }`}
                  >
                    {c === 'whatsapp' ? <MessageCircle className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                    {c === 'whatsapp' ? 'WhatsApp' : 'Email'}
                  </button>
                ))}
              </div>

              {/* Contact field */}
              {channel === 'whatsapp' ? (
                <div className="mb-4">
                  <label htmlFor="ms-phone" className="mb-1.5 block text-xs font-semibold text-slate-600">
                    WhatsApp number
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="ms-phone"
                      type="tel"
                      inputMode="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className={`${inputBase} ${error && channel === 'whatsapp' ? 'border-red-300' : 'border-slate-200'}`}
                    />
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <label htmlFor="ms-email" className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="ms-email"
                      type="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={`${inputBase} ${error && channel === 'email' ? 'border-red-300' : 'border-slate-200'}`}
                    />
                  </div>
                </div>
              )}

              {/* Quick messages */}
              <div className="mb-2 flex flex-wrap gap-1.5">
                {QUICK_MESSAGES.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => setInquiryText(q.text)}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-[#0F9D8A] hover:text-[#087F73]"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {/* Message */}
              <label htmlFor="ms-msg" className="mb-1.5 block text-xs font-semibold text-slate-600">
                Enquiry message
              </label>
              <textarea
                id="ms-msg"
                value={inquiryText}
                onChange={(e) => setInquiryText(e.target.value.slice(0, MAX_LEN))}
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-[#0B1F3A] transition focus:border-[#0F9D8A] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0F9D8A]/15"
              />
              <div className="mb-3 mt-1 text-right text-[11px] text-slate-400">
                {inquiryText.length}/{MAX_LEN}
              </div>

              {error && (
                <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  {error}
                </p>
              )}

              {/* Primary action */}
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 active:scale-[0.99]"
                style={{
                  background: 'linear-gradient(135deg, #0F9D8A 0%, #087F73 100%)',
                  boxShadow: '0 8px 20px rgba(15, 157, 138, 0.3)',
                }}
              >
                <Send className="h-4 w-4" />
                {channel === 'whatsapp' ? 'Open WhatsApp' : 'Open Gmail'}
              </button>

              {/* Secondary action for email */}
              {channel === 'email' && (
                <button
                  type="button"
                  onClick={handleMailApp}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-[#087F73]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Use my default mail app instead
                </button>
              )}

              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#0F9D8A]" />
                You&apos;ll be redirected. Nothing is stored on our site.
              </p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2">
        {showTooltip && !isOpen && (
          <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#0B1F3A] shadow-xl sm:flex">
            <span>Need help? Chat with us</span>
            <button
              type="button"
              onClick={() => setShowTooltip(false)}
              className="rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#0B1F3A]"
              aria-label="Dismiss tooltip"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-label="Open support chat"
          aria-expanded={isOpen}
          className="relative flex h-12 w-12 items-center justify-center rounded-full text-white shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 sm:h-14 sm:w-14"
          style={{
            background: 'linear-gradient(135deg, #0F9D8A 0%, #087F73 100%)',
            boxShadow: '0 8px 24px rgba(15, 157, 138, 0.4)',
          }}
        >
          {isOpen ? (
            <X className="h-6 w-6 sm:h-7 sm:w-7" />
          ) : (
            <MessageCircle className="h-6 w-6 fill-current sm:h-7 sm:w-7" />
          )}
        </button>
      </div>
    </aside>
  );
}
