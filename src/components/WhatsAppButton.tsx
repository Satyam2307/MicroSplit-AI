'use client';

import React, { useState } from 'react';
import { MessageCircle, X, Send, ShieldCheck } from 'lucide-react';

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [inquiryText, setInquiryText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleStartWhatsAppChat = (e?: React.FormEvent) => {
    e?.preventDefault();
    const digits = phoneNumber.replace(/[^0-9]/g, '');
    const targetPhone =
      digits.length === 10
        ? `91${digits}`
        : digits.length >= 7
        ? digits
        : '';

    if (!targetPhone) {
      setError('Please enter a valid WhatsApp phone number (minimum 10 digits).');
      return;
    }

    setError(null);
    const ticketId = `MS-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const formattedMessage =
      `👋 *MicroSplit AI — Official Inquiry*\n\n` +
      `🎫 *Ticket ID:* #${ticketId}\n` +
      `📱 *Recipient:* +${targetPhone}\n` +
      `💬 *Inquiry Details:*\n"${inquiryText.trim() || 'Hi MicroSplit AI team, I need help with squad revenue attribution, 0-cent splits, and payout settlements.'}"\n\n` +
      `⚡ *Status:* Registered on Cryptographic Ledger\n` +
      `---\n*MicroSplit AI Support Desk*`;

    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(formattedMessage)}`;
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <aside aria-label="Support chat" className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 select-none">
      {/* ── Dynamic Inquiry Dialog ── */}
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] sm:w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-[#0B1F3A] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white leading-tight">Chat on WhatsApp</h3>
                <p className="text-[10px] text-slate-300">MicroSplit AI Instant Support</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleStartWhatsAppChat} className="p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              <span>Enter your number to receive an inquiry ticket on WhatsApp:</span>
            </div>

            {error && (
              <p className="text-[11px] text-rose-600 font-medium bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200">
                {error}
              </p>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Your WhatsApp Phone Number *
              </label>
              <input
                type="tel"
                required
                autoFocus
                placeholder="e.g. 9876543210 or +1..."
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 bg-slate-50/70"
              />
              <span className="text-[9.5px] text-teal-600 block mt-0.5">
                ✓ Inquiry will be sent directly to this typed number
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Inquiry Message (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Hi MicroSplit AI team, I need help with..."
                value={inquiryText}
                onChange={(e) => setInquiryText(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 bg-slate-50/70 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Open in WhatsApp →</span>
            </button>
          </form>
        </div>
      )}

      {/* ── Floating Launcher ── */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Tooltip speech bubble */}
        {!isOpen && showTooltip && (
          <div
            onClick={() => {
              setIsOpen(true);
              setShowTooltip(false);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-full shadow-lg border border-slate-200 text-xs font-semibold text-slate-800 hover:border-teal-500 transition-all cursor-pointer group"
          >
            <span className="group-hover:text-teal-700 transition-colors">Chat on WhatsApp</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-100"
              aria-label="Dismiss tooltip"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Floating Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setShowTooltip(false);
          }}
          aria-label="Chat with MicroSplit AI on WhatsApp"
          className="relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[var(--accent)] text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #0F9D8A 0%, #087F73 100%)',
            boxShadow: '0 8px 24px rgba(15, 157, 138, 0.45)',
          }}
        >
          <MessageCircle className="w-7 h-7 fill-current" />
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          </span>
        </button>
      </div>
    </aside>
  );
}
