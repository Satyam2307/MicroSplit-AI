'use client';

import React, { useState } from 'react';
import { MessageCircle, X, Send, ShieldCheck } from 'lucide-react';

const DEFAULT_COUNTRY_CODE = '91'; // used when a 10-digit number is typed without a country code

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [inquiryText, setInquiryText] = useState(
    'Hi MicroSplit AI team, I need help with squad revenue attribution and payout settlements.'
  );
  const [error, setError] = useState<string | null>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let digits = phoneNumber.replace(/\D/g, '');

    // 10 digits (e.g. 9876543210) -> add default country code
    if (digits.length === 10) digits = DEFAULT_COUNTRY_CODE + digits;

    if (digits.length < 11 || digits.length > 15) {
      setError('Enter a valid number with country code, e.g. +91 98765 43210.');
      return;
    }

    const url = `https://wa.me/${digits}?text=${encodeURIComponent(inquiryText.trim())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <aside aria-label="Support chat" className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <form
          onSubmit={handleSend}
          className="w-[320px] max-w-[calc(100vw-3rem)] rounded-2xl bg-white p-4 shadow-2xl border border-slate-200"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0B1F3A]">Chat on WhatsApp</h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-[#0B1F3A]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <label className="mb-1 block text-xs font-semibold text-slate-600">WhatsApp number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+91 98765 43210"
            required
            className="mb-3 w-full rounded-lg border border-slate-300 p-2 text-sm text-[#0B1F3A] focus:border-[#0F9D8A] focus:outline-none"
          />

          <label className="mb-1 block text-xs font-semibold text-slate-600">Enquiry message</label>
          <textarea
            value={inquiryText}
            onChange={(e) => setInquiryText(e.target.value)}
            rows={4}
            className="mb-3 w-full resize-none rounded-lg border border-slate-300 p-2 text-sm text-[#0B1F3A] focus:border-[#0F9D8A] focus:outline-none"
          />

          {error && <p className="mb-3 text-xs font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #0F9D8A 0%, #087F73 100%)' }}
          >
            <Send className="h-4 w-4" />
            Open WhatsApp
          </button>

          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-[#0F9D8A]" />
            You&apos;ll be redirected to WhatsApp. Nothing is stored on our site.
          </p>
        </form>
      )}

      <div className="flex items-end gap-2">
        {showTooltip && !isOpen && (
          <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#0B1F3A] shadow-xl">
            <span>Chat on WhatsApp</span>
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
          aria-label="Chat on WhatsApp"
          aria-expanded={isOpen}
          className="relative flex h-12 w-12 items-center justify-center rounded-full text-white shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 sm:h-14 sm:w-14"
          style={{
            background: 'linear-gradient(135deg, #0F9D8A 0%, #087F73 100%)',
            boxShadow: '0 8px 24px rgba(15, 157, 138, 0.4)',
          }}
        >
          <MessageCircle className="h-6 w-6 fill-current sm:h-7 sm:w-7" />
        </button>
      </div>
    </aside>
  );
}
