'use client';

import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(true);

  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '15550192834';
  const message = encodeURIComponent(
    'Hi MicroSplit AI team, I need help with squad revenue attribution and payout settlements.'
  );
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

  return (
    <aside aria-label="Support chat" className="fixed bottom-6 right-6 z-40 flex items-end gap-2 group">
      {/* Tooltip speech bubble */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-white rounded-2xl shadow-xl border border-slate-200 text-xs font-semibold text-[#0B1F3A] animate-in fade-in slide-in-from-right-2">
          <span>Chat on WhatsApp</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowTooltip(false);
            }}
            className="text-slate-400 hover:text-[#0B1F3A] transition-colors p-0.5 rounded-full hover:bg-slate-100"
            aria-label="Dismiss tooltip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with MicroSplit AI on WhatsApp"
        className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
        style={{
          background: 'linear-gradient(135deg, #0F9D8A 0%, #087F73 100%)',
          boxShadow: '0 8px 24px rgba(15, 157, 138, 0.4)',
        }}
      >
        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm">
          <span className="w-2.5 h-2.5 bg-[#0F9D8A] rounded-full animate-ping" />
        </span>
      </a>
    </aside>
  );
}
