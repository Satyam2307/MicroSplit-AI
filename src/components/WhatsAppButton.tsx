'use client';

import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(true);

  const phone = '15550192834'; // MicroSplit direct support number
  const message = encodeURIComponent(
    'Hi MicroSplit AI team, I need help with squad revenue attribution and payout settlements.'
  );
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

  return (
    <aside aria-label="Support chat" className="fixed bottom-6 right-6 z-40 flex items-end gap-2 group">
      {/* Tooltip speech bubble */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-lg border border-[var(--text)] text-xs font-semibold text-[var(--primary)] animate-in fade-in slide-in-from-right-2">
          <span>Chat on WhatsApp</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowTooltip(false);
            }}
            className="text-[var(--text)] hover:text-[var(--primary)] transition-colors"
            aria-label="Dismiss tooltip"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Floating Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with MicroSplit AI on WhatsApp"
        className="relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[var(--accent)] text-white shadow-xl hover:bg-[var(--accent)] hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <MessageCircle className="w-7 h-7 fill-current" />
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center">
          <span className="w-2.5 h-2.5 bg-[var(--accent)] rounded-full animate-ping" />
        </span>
      </a>
    </aside>
  );
}
