'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  X,
  Send,
  ShieldCheck,
  Bot,
  Phone,
  Mail,
  HelpCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

type Language = 'en' | 'hi' | 'hinglish';
type ActiveTab = 'chat' | 'whatsapp' | 'email' | 'faq';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

const INITIAL_MESSAGES: Record<Language, string> = {
  en: "👋 Welcome to MicroSplit AI! How can I assist you with evidence verification, 0-cent splits, consistency streaks, or PayPal batch payouts today?",
  hi: "👋 नमस्ते! मैं MicroSplit AI असिस्टेंट हूँ। मैं आपकी टीम के एविडेंस अपलोड, 0-सेंट स्प्लिट, कंसिस्टेंसी स्ट्रीक, या पेपैल पेआउट में कैसे सहायता कर सकता हूँ?",
  hinglish: "👋 Hello! Main MicroSplit AI Assistant hoon. Squad revenue splits, evidence vault, 0-cent math ya PayPal batch payouts ke baare mein aapko kya jaankari chahiye?",
};

const PLACEHOLDERS: Record<Language, string> = {
  en: "Type your fintech question...",
  hi: "अपना सवाल यहाँ लिखें...",
  hinglish: "Apna sawaal yahan likhein...",
};

const SUGGESTIONS: Record<Language, string[]> = {
  en: [
    "⚡ How does 0-cent math work?",
    "💰 How do PayPal batch payouts work?",
    "🛡️ Evidence Vault verification",
    "🔥 Consistency streaks & perks",
  ],
  hi: [
    "⚡ 0-सेंट गणित कैसे काम करता है?",
    "💰 पेपैल बैच पेआउट्स कैसे करें?",
    "🛡️ एविडेंस वॉल्ट और सुरक्षा",
    "🔥 कंसिस्टेंसी स्ट्रीक के फायदे",
  ],
  hinglish: [
    "⚡ 0-Cent splits kaise calculate hote hain?",
    "💰 PayPal batch payouts ka workflow kya hai?",
    "🛡️ Evidence Vault aur SHA-256 verification",
    "🔥 Consistency streaks ke benefits",
  ],
};

const FAQS = [
  {
    q: "How does MicroSplit AI guarantee 0-cent math?",
    a: "Our split engine eliminates floating-point rounding errors. Percentages are converted into integer micro-units, and remainder cents are deterministically attributed based on verifiable ledger precedence.",
  },
  {
    q: "How fast are PayPal Batch Payouts processed?",
    a: "Batches are triggered in a single click via the PayPal Payouts API. Squad members receive funds directly into their verified PayPal accounts within seconds.",
  },
  {
    q: "What constitutes valid Proof-of-Focus evidence?",
    a: "Verified GitHub commit trees, milestone delivery markers, and optional session screenshots with tamper-evident SHA-256 cryptographic hashes.",
  },
  {
    q: "Can I invite team members outside my region?",
    a: "Yes! MicroSplit AI supports global squad collaborations with multi-currency conversion and international PayPal payouts.",
  },
];

export default function MicroSplitConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [language, setLanguage] = useState<Language>('hinglish');

  // AI Chat States
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-en',
      sender: 'ai',
      text: INITIAL_MESSAGES.en,
      timestamp: '19:35',
    },
    {
      id: 'init-hi',
      sender: 'ai',
      text: INITIAL_MESSAGES.hi,
      timestamp: '19:35',
    },
    {
      id: 'init-hinglish',
      sender: 'ai',
      text: INITIAL_MESSAGES.hinglish,
      timestamp: '19:35',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // WhatsApp States
  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [waError, setWaError] = useState<string | null>(null);

  // Email States
  const [emailForm, setEmailForm] = useState({
    name: '',
    email: '',
    squad: '',
    topic: 'Revenue Splits & Math',
    message: '',
  });
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [emailSuccessTicket, setEmailSuccessTicket] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeTab, isAiLoading]);

  // Send Chat Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isAiLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language,
          messages: messages.slice(-4).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        }),
      });

      const data = await res.json();
      const reply = data.reply || INITIAL_MESSAGES[language];

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text:
          language === 'hi'
            ? 'क्षमा करें, कनेक्शन में त्रुटि हुई। कृपया नीचे व्हाट्सएप डेस्क का उपयोग करें।'
            : 'Sorry, connection error occurred. Please use our WhatsApp desk below.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // WhatsApp Submission — always routes to MicroSplit support line +91 8251048701
  const SUPPORT_WHATSAPP = '918251048701';

  const handleLaunchWhatsApp = (e?: React.FormEvent) => {
    e?.preventDefault();

    setWaError(null);
    const ticketId = `MS-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const userRef = waPhone.trim() ? `📱 *From:* ${waPhone.trim()}\n` : '';
    const formattedMessage =
      `👋 *MicroSplit AI — Support Desk*\n\n` +
      `🎫 *Ticket ID:* #${ticketId}\n` +
      userRef +
      `💬 *Inquiry:*\n"${waMessage.trim() || 'Hi MicroSplit AI team, I need help with squad revenue attribution, 0-cent splits, and payout settlements.'}"\n\n` +
      `⚡ *Status:* Registered on Cryptographic Ledger\n` +
      `---\n*MicroSplit AI Support Desk*`;

    const whatsappUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(formattedMessage)}`;
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank');
    }
  };

  // Email Submission
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setIsSubmittingEmail(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setEmailError(data.error || 'Failed to submit inquiry.');
      } else {
        setEmailSuccessTicket(data.ticketId || `MS-${Date.now().toString(36).toUpperCase()}`);
        setEmailForm({
          name: '',
          email: '',
          squad: '',
          topic: 'Revenue Splits & Math',
          message: '',
        });
      }
    } catch {
      setEmailError('Network error. Please try again or use WhatsApp.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  return (
    <aside
      aria-label="MicroSplit AI Support Concierge"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3 select-none"
    >
      {/* ── Main Concierge Popup ── */}
      {isOpen && (
        <div className="w-[calc(100vw-1.5rem)] sm:w-[400px] h-[580px] max-h-[85vh] bg-[#071322] rounded-3xl shadow-2xl border border-teal-500/20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* 1. Header */}
          <div className="bg-[#0B1F3A] px-4 py-3 border-b border-slate-700/50 flex items-center justify-between text-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center shadow-inner">
                <Bot className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white tracking-wide">MicroSplit AI</h3>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                    Claude
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online • Fintech Concierge</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Language Bar */}
          <div className="bg-[#0e2646] px-3 py-2 flex items-center justify-between border-b border-slate-700/40 text-[11px] text-slate-300 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-teal-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Language / भाषा:</span>
            </div>
            <div className="flex items-center gap-1 bg-[#091a30] p-0.5 rounded-xl border border-slate-700/60">
              {(
                [
                  { code: 'en', label: '🇬🇧 EN' },
                  { code: 'hi', label: '🇮🇳 हिंदी' },
                  { code: 'hinglish', label: '🌐 Hinglish' },
                ] as const
              ).map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLanguage(item.code)}
                  className={`px-2 py-0.5 rounded-lg text-[10.5px] font-semibold transition-all ${
                    language === item.code
                      ? 'bg-teal-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Navigation Tabs */}
          <div className="bg-[#091a30] px-2.5 py-1.5 flex items-center gap-1 border-b border-slate-700/30 flex-shrink-0 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 font-semibold text-[11px] transition-all ${
                activeTab === 'chat'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI Chat</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('whatsapp')}
              className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 font-semibold text-[11px] transition-all ${
                activeTab === 'whatsapp'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp & Desk</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 font-semibold text-[11px] transition-all ${
                activeTab === 'email'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              title="Email Inquiry Desk"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Email</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('faq')}
              className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 font-semibold text-[11px] transition-all ${
                activeTab === 'faq'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              title="FAQ"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">FAQ</span>
            </button>
          </div>

          {/* 4. Tab Body Content */}
          <div className="flex-1 overflow-hidden flex flex-col bg-[#050e1a]">
            {/* ──── TAB: AI CHAT ──── */}
            {activeTab === 'chat' && (
              <>
                <div
                  ref={chatScrollRef}
                  className="flex-1 overflow-y-auto p-3.5 space-y-3 scroll-smooth text-xs"
                >
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        m.sender === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[88%] p-3 rounded-2xl shadow-sm text-xs leading-relaxed ${
                          m.sender === 'user'
                            ? 'bg-teal-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[9px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
                    </div>
                  ))}

                  {isAiLoading && (
                    <div className="flex items-center gap-2 text-slate-400 bg-white/5 p-2.5 rounded-xl w-fit">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                      <span className="text-[11px]">MicroSplit AI is thinking...</span>
                    </div>
                  )}

                  {/* Suggestion Chips */}
                  <div className="pt-2">
                    <p className="text-[10px] text-slate-400 font-semibold mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-teal-400" /> Quick Inquiries:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTIONS[language].map((sugg, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSendMessage(sugg)}
                          className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-teal-900/60 border border-slate-700/80 hover:border-teal-500/50 text-[10.5px] text-slate-300 hover:text-white transition-all text-left"
                        >
                          {sugg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* WhatsApp Quick Banner */}
                <div
                  onClick={() => setActiveTab('whatsapp')}
                  className="bg-emerald-950/40 hover:bg-emerald-900/50 border-t border-emerald-800/30 px-3 py-1.5 flex items-center justify-between text-[11px] text-emerald-400 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span className="font-medium">Talk to Team on WhatsApp:</span>
                  </div>
                  <span className="text-emerald-300 font-bold hover:underline flex items-center gap-0.5">
                    Open Desk <ArrowRight className="w-3 h-3" />
                  </span>
                </div>

                {/* Chat Input Bar */}
                <div className="p-2.5 bg-[#08172b] border-t border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={PLACEHOLDERS[language]}
                    className="flex-1 px-3.5 py-2.5 bg-slate-900/90 rounded-xl border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />

                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputVal.trim() || isAiLoading}
                    className="p-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:hover:bg-teal-600 text-white transition-all cursor-pointer"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {/* ──── TAB: WHATSAPP & DESK ──── */}
            {activeTab === 'whatsapp' && (
              <form onSubmit={handleLaunchWhatsApp} className="p-4 space-y-3.5 flex-1 overflow-y-auto">
                <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3 flex items-start gap-2 text-xs text-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-emerald-300">WhatsApp Instant Concierge</p>
                    <p className="text-[11px] text-emerald-400/80">
                      Creates an immutable ticket on the MicroSplit support ledger and connects directly with attribution engineers.
                    </p>
                  </div>
                </div>

                {waError && (
                  <div className="p-2 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{waError}</span>
                  </div>
                )}

                {/* Support number badge */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/50 border border-emerald-500/30">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-emerald-300">Connects to: +91 82510 48701</p>
                    <p className="text-[10px] text-emerald-400/70">MicroSplit Support Line</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Message (Optional)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe your squad split question or payout status..."
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Open WhatsApp Chat →</span>
                </button>
              </form>
            )}

            {/* ──── TAB: EMAIL INQUIRY ──── */}
            {activeTab === 'email' && (
              <div className="p-4 flex-1 overflow-y-auto">
                {emailSuccessTicket ? (
                  <div className="bg-teal-950/40 border border-teal-500/40 rounded-2xl p-4 text-center space-y-2.5">
                    <CheckCircle2 className="w-8 h-8 text-teal-400 mx-auto" />
                    <h4 className="font-bold text-sm text-white">Inquiry Received</h4>
                    <p className="text-xs text-slate-300">
                      Your ticket has been dispatched to <span className="text-teal-300">akshat.singhai701@gmail.com</span>.
                    </p>
                    <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono text-teal-300">
                      Ticket ID: #{emailSuccessTicket}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailSuccessTicket(null)}
                      className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold transition-colors"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendEmail} className="space-y-3">
                    <div className="text-xs text-slate-400">
                      Send an official inquiry directly to our fintech desk (SLA: &lt; 2 hrs).
                    </div>

                    {emailError && (
                      <div className="p-2 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
                        {emailError}
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={emailForm.name}
                        onChange={(e) => setEmailForm({ ...emailForm, name: e.target.value })}
                        placeholder="Alex Morgan"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={emailForm.email}
                        onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                        placeholder="alex@squad.dev"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Topic
                      </label>
                      <select
                        value={emailForm.topic}
                        onChange={(e) => setEmailForm({ ...emailForm, topic: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                      >
                        <option>Revenue Splits & Math</option>
                        <option>PayPal Batch Payouts</option>
                        <option>Proof of Focus Evidence</option>
                        <option>Custom Enterprise Integration</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Message *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={emailForm.message}
                        onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                        placeholder="Describe your inquiry in detail (min 10 chars)..."
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingEmail}
                      className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      {isSubmittingEmail ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting Ticket...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Official Email Ticket</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ──── TAB: FAQ ──── */}
            {activeTab === 'faq' && (
              <div className="p-3.5 flex-1 overflow-y-auto space-y-2.5 text-xs">
                {FAQS.map((faq, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-teal-500/40 transition-colors"
                  >
                    <h5 className="font-bold text-white text-[11.5px] mb-1">{faq.q}</h5>
                    <p className="text-slate-300 text-[10.5px] leading-relaxed mb-2">{faq.a}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('chat');
                        handleSendMessage(`Explain more about: ${faq.q}`);
                      }}
                      className="text-[10px] text-teal-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      Ask AI about this <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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
            className="flex items-center gap-2 px-3.5 py-2 bg-[#0B1F3A] rounded-full shadow-xl border border-teal-500/30 text-xs font-semibold text-white hover:border-teal-400 transition-all cursor-pointer group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="group-hover:text-teal-300 transition-colors">
              Chat & Voice Concierge
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              className="text-slate-400 hover:text-white transition-colors p-0.5 rounded-full hover:bg-white/10"
              aria-label="Dismiss tooltip"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Floating Button Orb */}
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setShowTooltip(false);
          }}
          aria-label="Open MicroSplit AI Concierge"
          className="relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #0F9D8A 0%, #087F73 100%)',
            boxShadow: '0 8px 24px rgba(15, 157, 138, 0.45)',
          }}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <MessageSquare className="w-6 h-6 fill-current text-white" />
          )}

          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          </span>
        </button>
      </div>
    </aside>
  );
}
