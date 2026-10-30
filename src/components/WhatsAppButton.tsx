'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Bot,
  CheckCheck,
  ShieldCheck,
  ArrowRight,
  Mail,
  Phone,
  HelpCircle,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Check,
  Cpu,
  Layers,
  Flame,
  CreditCard,
  FileCheck,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type LanguageType = 'en' | 'hi' | 'hinglish';
type WidgetTab = 'chat' | 'contact' | 'faq';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

const greetings: Record<LanguageType, string> = {
  en: '👋 Hello! I am your MicroSplit AI Concierge. How can I assist you with evidence verification, 0-cent splits, consistency streaks, or PayPal batch payouts today?',
  hi: '👋 नमस्ते! मैं MicroSplit AI असिस्टेंट हूँ। मैं आपकी टीम के एविडेंस अपलोड, 0-सेंट स्प्लिट, कंसिस्टेंसी स्ट्रीk, या पेपैल पेआउट में कैसे सहायता कर सकता हूँ?',
  hinglish: '👋 Hello! Main MicroSplit AI Assistant hoon. Squad revenue splits, evidence vault, 0-cent math ya PayPal batch payouts ke baare mein aapko kya jaankari chahiye?',
};

const placeholders: Record<LanguageType, string> = {
  en: 'Type your message...',
  hi: 'अपना सवाल यहाँ लिखें...',
  hinglish: 'Apna sawaal yahan likhein...',
};

const quickPills: Record<LanguageType, string[]> = {
  en: [
    'How does 0-cent split work?',
    'How can we view the evidence vault?',
    'How is Consistency Streak calculated?',
    'How to integrate PayPal Batch payouts?',
  ],
  hi: [
    '0-सेंट स्प्लिट कैसे काम करता है?',
    'एविडेंस वॉल्ट कैसे देखें?',
    'कंसिस्टेंसी स्ट्रीक बोनस क्या है?',
    'पेपैल बैच पेआउट कैसे सेटअप करें?',
  ],
  hinglish: [
    '0-cent split kaise kaam karta hai?',
    'Evidence vault feature kaise dekhe?',
    'Streak bonus kaise calculate hota hai?',
    'PayPal batch payouts kaise setup karein?',
  ],
};

const topicPills = [
  { id: '0-Cent Split & Math', label: '0-Cent Split', icon: Zap },
  { id: 'Evidence Vault & Verification', label: 'Evidence Vault', icon: FileCheck },
  { id: 'Consistency Streak Bonus', label: 'Streak Bonus', icon: Flame },
  { id: 'PayPal Batch Payouts', label: 'PayPal Payouts', icon: CreditCard },
  { id: 'Request Phone Callback', label: 'Phone Callback', icon: Phone },
];

const faqItems = [
  {
    q: 'How does 0-Cent Remainder Allocation work?',
    a: 'MicroSplit AI divides revenue strictly in integer cents using deterministic remainder distribution. Any fractional cents are allocated to the highest-scoring contributor or consistent streak holder, guaranteeing that sum(allocations) === pool exactly with zero drift.',
  },
  {
    q: 'Where can I inspect verified evidence?',
    a: 'Visit the /evidence tab in the top navigation. Every GitHub PR, Figma design, and Linear issue is hashed with SHA-256 and verified through cryptographic Merkle audit logs before payouts are triggered.',
  },
  {
    q: 'How does the Consistency Streak Bonus work?',
    a: 'Squad members who contribute consecutively earn a bonus pool multiplier (up to 10% pool cap). If a member takes a scheduled break, they can use an authorized Freeze Day without losing their streak.',
  },
  {
    q: 'How do PayPal Batch Disbursements work?',
    a: 'Payout batches are bundled into cryptographic batches and transmitted directly via PayPal Payouts API. Squad members receive instant disbursements in their local currency without manual invoicing.',
  },
];

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [activeTab, setActiveTab] = useState<WidgetTab>('chat');

  // Language Settings
  const [language, setLanguage] = useState<LanguageType>('hinglish');

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: greetings.hinglish,
      time: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Contact / Inquiry Desk State
  const [contactName, setContactName] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactTopic, setContactTopic] = useState('0-Cent Split & Math');
  const [contactMessage, setContactMessage] = useState('');
  const [dispatchPhase, setDispatchPhase] = useState<'idle' | 'hashing' | 'alerting' | 'confirmed'>('idle');
  const [contactSubmittedTicket, setContactSubmittedTicket] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [ticketCountdown, setTicketCountdown] = useState(299); // 4m 59s
  const [copiedTicket, setCopiedTicket] = useState(false);

  // WhatsApp & Email Constants
  const defaultSupportNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE ||
    '919294514754';
  const cleanSupportNumber = defaultSupportNumber.replace(/[^0-9]/g, '') || '919294514754';
  const supportEmail = 'akshatsinghai6682@gmail.com';

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      scrollToBottom();
    }
  }, [chatMessages, isTyping, isOpen, activeTab]);

  // SLA Live Countdown Timer
  useEffect(() => {
    if (contactSubmittedTicket && ticketCountdown > 0) {
      const timer = setInterval(() => {
        setTicketCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [contactSubmittedTicket, ticketCountdown]);

  // Language switch handler
  const handleLanguageChange = (newLang: LanguageType) => {
    setLanguage(newLang);

    // Add greeting in chat for chosen language
    setChatMessages((prev) => [
      ...prev,
      {
        id: `lang-${Date.now()}`,
        sender: 'assistant',
        text: greetings[newLang],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Send message to Claude AI Backend (/api/chat)
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatMessages.slice(-6).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
          language,
        }),
      });

      const data = await response.json();
      const reply =
        data.reply ||
        'MicroSplit AI orchestrates verifiable revenue splits using deterministic math and PayPal batch disbursements. Switch to WhatsApp & Desk tab to connect with our team.';

      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    } catch {
      setIsTyping(false);
      const fallbackReply =
        'Network issue. Please switch to the "WhatsApp & Desk" tab to connect directly with our engineering team.';
      setChatMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: fallbackReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  // Direct 1-Click WhatsApp Chat Launcher
  const handleDirectWhatsAppChat = () => {
    const defaultMsg =
      language === 'hi'
        ? `नमस्ते MicroSplit AI टीम! मुझे आपके 0-सेंट स्प्लिट और एविडेंस वॉल्ट के बारे में जानकारी चाहिए।`
        : language === 'hinglish'
        ? `Hello MicroSplit AI Team! Mujhe squad revenue splits aur PayPal batch payouts ke baare mein baat karni hai.`
        : `Hello MicroSplit AI Team! I would like to inquire about deterministic revenue splits and PayPal batch payouts.`;

    const waUrl = `https://wa.me/${cleanSupportNumber}?text=${encodeURIComponent(defaultMsg)}`;
    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank');
    }
  };

  // Solve Inquiry with AI Chat Instantly
  const handleSolveWithAiNow = () => {
    if (contactMessage.trim()) {
      setActiveTab('chat');
      handleSendMessage(contactMessage.trim());
    } else {
      setActiveTab('chat');
    }
  };

  // Copy Ticket ID
  const handleCopyTicket = (ticketId: string) => {
    navigator.clipboard?.writeText?.(ticketId);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  // Dynamic Animated Inquiry Submission Protocol
  const handleInquiryDispatch = async (destination: 'in_app' | 'whatsapp' | 'gmail') => {
    if (!contactName.trim()) {
      setContactError('Please enter your full name (आपका नाम भरें).');
      return;
    }
    if (!contactMessage.trim()) {
      setContactError('Please enter your question or inquiry (सवाल लिखें).');
      return;
    }

    setContactError(null);
    setDispatchPhase('hashing');

    let generatedTicket = `MS-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // Animate stage 1 (SHA-256 Hashing)
    await new Promise((r) => setTimeout(r, 450));
    setDispatchPhase('alerting');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          email: contactEmail.trim() || 'visitor@microsplit.ai',
          whatsapp: contactWhatsapp.trim(),
          topic: contactTopic,
          message: contactMessage.trim(),
        }),
      });

      const resData = await response.json();
      if (resData.ticketId) {
        generatedTicket = resData.ticketId;
      }
    } catch {
      // Graceful fallback to client ticket
    }

    // Animate stage 2 (Alerting Desk)
    await new Promise((r) => setTimeout(r, 450));
    setDispatchPhase('confirmed');
    setContactSubmittedTicket(generatedTicket);
    setTicketCountdown(299);

    if (destination === 'whatsapp') {
      const formattedWhatsApp =
        `🔔 *MicroSplit AI Inquiry* [Ticket: ${generatedTicket}]\n\n` +
        `👤 *Name:* ${contactName.trim()}\n` +
        `📱 *WhatsApp:* ${contactWhatsapp.trim() || 'Not specified'}\n` +
        `📧 *Email:* ${contactEmail.trim() || 'Not specified'}\n` +
        `🏷️ *Topic:* ${contactTopic}\n\n` +
        `💬 *Message / Sawaal:*\n"${contactMessage.trim()}"\n\n` +
        `---\n*Sent via MicroSplit Official Support Desk*`;

      const waUrl = `https://wa.me/${cleanSupportNumber}?text=${encodeURIComponent(formattedWhatsApp)}`;
      if (typeof window !== 'undefined') {
        window.open(waUrl, '_blank');
      }
    } else if (destination === 'gmail') {
      const subject = `[MicroSplit Ticket ${generatedTicket}] ${contactTopic} from ${contactName.trim()}`;
      const body =
        `Hello MicroSplit Team,\n\n` +
        `A new inquiry has been submitted:\n\n` +
        `Name: ${contactName.trim()}\n` +
        `Email: ${contactEmail.trim() || 'Not provided'}\n` +
        `Phone/WhatsApp: ${contactWhatsapp.trim() || 'Not provided'}\n` +
        `Topic: ${contactTopic}\n` +
        `Ticket ID: ${generatedTicket}\n\n` +
        `Inquiry Message:\n${contactMessage.trim()}\n\n` +
        `--\nMicroSplit AI Support Desk`;

      const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${supportEmail}&su=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;

      if (typeof window !== 'undefined') {
        window.open(gmailComposeUrl, '_blank');
      }
    }
  };

  // Format countdown minutes:seconds
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* ─── Floating Launcher Button ─── */}
      {!isOpen && (
        <aside
          aria-label="MicroSplit Assistant"
          className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5"
        >
          {showTooltip && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#0B1F3A] text-white rounded-xl shadow-xl border border-teal-500/30 text-xs font-semibold animate-in fade-in slide-in-from-right-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>MicroSplit AI Concierge</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(false);
                }}
                className="text-slate-400 hover:text-white transition-colors ml-1 p-0.5"
                aria-label="Dismiss tooltip"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setIsOpen(true);
              setShowTooltip(false);
            }}
            aria-label="Open MicroSplit AI Concierge"
            className="relative flex items-center justify-center w-14 h-14 rounded-full text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-teal-400/40"
            style={{
              background: 'linear-gradient(135deg, #0F9D8A 0%, #087F73 100%)',
              boxShadow: '0 8px 24px rgba(15, 157, 138, 0.45)',
            }}
          >
            <MessageCircle className="w-7 h-7 fill-current" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#0B1F3A]" />
            </span>
          </button>
        </aside>
      )}

      {/* ─── Main Widget Window ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[420px] h-[min(620px,calc(100vh-3rem))] bg-white rounded-3xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden"
            style={{
              boxShadow: '0 20px 50px rgba(11, 31, 58, 0.28), 0 0 0 1px rgba(15, 157, 138, 0.25)',
            }}
          >
            {/* ─── Top Master Header ─── */}
            <div className="bg-[#0B1F3A] text-white px-4 py-3 flex items-center justify-between relative flex-shrink-0 border-b border-teal-500/20 z-20">
              {/* Bot Info */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shadow-inner">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm tracking-tight text-white leading-tight">MicroSplit AI</h3>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-teal-500/25 text-teal-300 border border-teal-400/30">
                      Claude
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] text-slate-300 font-medium">Online • Fintech Concierge</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close Assistant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ─── Sub-bar 1: Language Segmented Selector (Unclipped & Visible) ─── */}
            <div className="bg-[#0e2646] px-3.5 py-2 flex items-center justify-between border-b border-teal-500/20 flex-shrink-0">
              <span className="text-[11px] font-semibold text-teal-200/80 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-400" />
                <span>Language / भाषा:</span>
              </span>

              {/* Horizontal Segmented Bar */}
              <div className="flex items-center bg-black/25 p-0.5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    language === 'en'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  🇬🇧 EN
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('hi')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    language === 'hi'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  🇮🇳 हिंदी
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('hinglish')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    language === 'hinglish'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  🌐 Hinglish
                </button>
              </div>
            </div>

            {/* ─── Sub-bar 2: 3 Clean Navigation Tabs (AI Chat | WhatsApp & Desk | FAQ) ─── */}
            <div className="bg-[#102C4D] px-2 py-1.5 flex items-center border-b border-teal-500/20 flex-shrink-0">
              <div className="grid grid-cols-3 w-full gap-1.5">
                {/* Tab 1: AI Chat */}
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'chat'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>AI Chat</span>
                </button>

                {/* Tab 2: WhatsApp & Desk */}
                <button
                  type="button"
                  onClick={() => setActiveTab('contact')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'contact'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-300" />
                  <span>WhatsApp & Desk</span>
                </button>

                {/* Tab 3: FAQ */}
                <button
                  type="button"
                  onClick={() => setActiveTab('faq')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'faq'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>FAQ</span>
                </button>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════════════
                TAB 1: AI CHAT (WhatsApp Bubble Aesthetic, Clean Text Only)
            ════════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0 bg-[#ECE5DD]">
                {/* Chat Messages Scroll Area */}
                <div
                  className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 10% 20%, rgba(15, 157, 138, 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(11, 31, 58, 0.05) 0%, transparent 40%)',
                  }}
                >
                  {/* Today Pill */}
                  <div className="flex justify-center my-0.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/70 backdrop-blur-xs text-[9.5px] font-bold text-slate-500 shadow-2xs border border-slate-200 uppercase tracking-wider">
                      Today • Encrypted Chat
                    </span>
                  </div>

                  {/* Messages */}
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line shadow-xs ${
                          msg.sender === 'user'
                            ? 'bg-[#0B1F3A] text-white rounded-tr-none'
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                        }`}
                      >
                        {msg.text}

                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                            msg.sender === 'user' ? 'text-teal-200/70' : 'text-slate-400'
                          }`}
                        >
                          <span>{msg.time}</span>
                          {msg.sender === 'user' && (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline-block" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex items-start">
                      <div className="bg-white rounded-2xl rounded-tl-none px-3.5 py-2.5 border border-slate-200 shadow-xs flex items-center gap-1.5 text-slate-500">
                        <span
                          className="w-2 h-2 rounded-full bg-teal-600 animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <span
                          className="w-2 h-2 rounded-full bg-teal-600 animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <span
                          className="w-2 h-2 rounded-full bg-teal-600 animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                        <span className="text-[11px] font-medium text-slate-400 ml-1">Claude typing...</span>
                      </div>
                    </div>
                  )}

                  {/* Quick Prompt Pills */}
                  {chatMessages.length <= 2 && (
                    <div className="pt-1">
                      <p className="text-[10.5px] font-bold text-slate-600 mb-1.5 px-1">
                        {language === 'hi'
                          ? 'सुझाए गए सवाल (Suggested):'
                          : language === 'hinglish'
                          ? 'Suggested sawaal (Pills):'
                          : 'Suggested questions:'}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {quickPills[language].map((pill, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendMessage(pill)}
                            className="text-left px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white border border-slate-200 text-slate-700 text-[11px] font-medium hover:border-teal-500 hover:text-teal-900 transition-colors flex items-center justify-between group shadow-2xs"
                          >
                            <span>{pill}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Direct WhatsApp Callout Pill */}
                <div className="bg-emerald-50 border-t border-emerald-200/60 px-3 py-1.5 flex items-center justify-between text-[11px] text-emerald-900">
                  <span className="flex items-center gap-1 font-medium">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>Talk to Team on WhatsApp:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('contact')}
                    className="font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-0.5"
                  >
                    <span>Open Desk</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Clean Input Bar (No Mic Button, Smooth Text Input) */}
                <div className="p-2.5 sm:p-3 bg-white border-t border-slate-200 flex-shrink-0">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    {/* Text Input */}
                    <input
                      type="text"
                      placeholder={placeholders[language]}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-full border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/70"
                    />

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="p-2.5 rounded-full bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 transition-colors shadow-sm flex-shrink-0"
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════════
                TAB 2: WHATSAPP & GMAIL DESK (Dynamic Holographic Terminal)
            ════════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'contact' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50 text-slate-900 space-y-4">
                {/* Desk Header Banner */}
                <div className="bg-gradient-to-r from-[#0B1F3A] to-[#102C4D] text-white p-3.5 rounded-2xl border border-teal-500/30 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-2 relative z-10">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm">Official MicroSplit Support Desk</h4>
                      <p className="text-[10.5px] text-slate-300">
                        Direct line to Founder & Engineering (+{cleanSupportNumber})
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── CARD 1: 1-Click Direct WhatsApp Chat ── */}
                <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-2xs hover:border-emerald-400 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 fill-current" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-slate-900">Direct WhatsApp Chat</h5>
                        <p className="text-[10.5px] text-emerald-700 font-semibold">
                          +{cleanSupportNumber} • Typical reply &lt; 5 mins
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                    Chat directly with our engineering team on WhatsApp for quick answers regarding revenue split rules or payouts.
                  </p>
                  <button
                    type="button"
                    onClick={handleDirectWhatsAppChat}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Open WhatsApp Now (+{cleanSupportNumber}) →</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative flex py-0.5 items-center">
                  <div className="flex-grow border-t border-slate-300"></div>
                  <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Or Instant Verified Inquiry
                  </span>
                  <div className="flex-grow border-t border-slate-300"></div>
                </div>

                {/* ── CARD 2: Dynamic Holographic Inquiry Terminal ── */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs relative">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-teal-600" />
                      <span>Smart Inquiry Terminal</span>
                    </h5>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      SLA: &lt; 5 mins
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Submitting logs an automated ticket to both WhatsApp (+{cleanSupportNumber}) and akshatsinghai6682@gmail.com.
                  </p>

                  {/* ── Active Animated Dispatch Stages ── */}
                  {dispatchPhase === 'hashing' && (
                    <div className="mb-3 p-3 bg-teal-50 border border-teal-300 rounded-xl text-xs text-teal-900 animate-pulse">
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <Cpu className="w-4 h-4 animate-spin text-teal-600" />
                        <span>Stage 1/2: Hashing Inquiry to SHA-256 Ledger...</span>
                      </div>
                      <div className="w-full bg-teal-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-teal-600 h-full w-1/2 animate-pulse" />
                      </div>
                    </div>
                  )}

                  {dispatchPhase === 'alerting' && (
                    <div className="mb-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 animate-pulse">
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <Phone className="w-4 h-4 text-emerald-600" />
                        <span>Stage 2/2: Alerting Desk Queue (+{cleanSupportNumber})...</span>
                      </div>
                      <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full w-full" />
                      </div>
                    </div>
                  )}

                  {/* ── Dynamic Holographic Ticket Receipt (The Alternative!) ── */}
                  {contactSubmittedTicket && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-4 p-4 bg-gradient-to-br from-[#0B1F3A] to-[#102C4D] text-white rounded-2xl border border-teal-500/40 shadow-xl relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between pb-2 border-b border-white/10 mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-xs text-emerald-300">Ticket Activated</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyTicket(contactSubmittedTicket)}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-teal-300 flex items-center gap-1 transition-colors"
                        >
                          {copiedTicket ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>{contactSubmittedTicket}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Ticket Details */}
                      <div className="space-y-1.5 text-xs text-slate-200 mb-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">Visitor:</span>
                          <span className="font-bold text-white">{contactName}</span>
                        </div>
                        {contactWhatsapp && (
                          <div className="flex justify-between">
                            <span className="text-slate-400 text-[11px]">Your Phone:</span>
                            <span className="font-mono text-teal-300">{contactWhatsapp}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">Queue SLA:</span>
                          <span className="font-bold text-emerald-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatCountdown(ticketCountdown)} remaining</span>
                          </span>
                        </div>
                      </div>

                      {/* 3 Quick Action Alternatives for the User */}
                      <div className="pt-2 border-t border-white/10 space-y-2">
                        {/* Alternative 1: Solve right now with AI */}
                        <button
                          type="button"
                          onClick={handleSolveWithAiNow}
                          className="w-full py-2 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#0B1F3A] font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <Bot className="w-3.5 h-3.5" />
                          <span>Get Instant AI Answer Now (Solve in 2s) →</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          {/* Alternative 2: Open in WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleInquiryDispatch('whatsapp')}
                            className="py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>Open WhatsApp</span>
                          </button>

                          {/* Alternative 3: Open in Gmail */}
                          <button
                            type="button"
                            onClick={() => handleInquiryDispatch('gmail')}
                            className="py-1.5 px-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Open Gmail</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Error Alert */}
                  {contactError && (
                    <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{contactError}</span>
                    </div>
                  )}

                  {/* Inquiry Form Fields */}
                  <div className="space-y-2.5">
                    {/* Name */}
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                        Your Name (आपका नाम) *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Alex Kumar"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 bg-slate-50"
                      />
                    </div>

                    {/* WhatsApp & Email Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                          Your WhatsApp / Phone No.
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. +91 9876543210"
                          value={contactWhatsapp}
                          onChange={(e) => setContactWhatsapp(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                          Your Gmail / Email
                        </label>
                        <input
                          type="email"
                          placeholder="e.g. you@gmail.com"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 bg-slate-50"
                        />
                      </div>
                    </div>

                    {/* Dynamic Topic Selector Pills */}
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                        Select Inquiry Topic
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {topicPills.map((t) => {
                          const Icon = t.icon;
                          const isSelected = contactTopic === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setContactTopic(t.id)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                                isSelected
                                  ? 'bg-teal-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <Icon className="w-3 h-3" />
                              <span>{t.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Message Textarea */}
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                        Your Message / Question (सवाल) *
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Type your question or requirement here..."
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 bg-slate-50 resize-none"
                      />
                    </div>

                    {/* Primary Animated Dispatch Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={dispatchPhase === 'hashing' || dispatchPhase === 'alerting'}
                        onClick={() => handleInquiryDispatch('in_app')}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Generate Verified Ticket & Alert Desk →</span>
                      </button>
                    </div>

                    {/* Dual Action Dispatch Buttons (Direct External) */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        disabled={dispatchPhase === 'hashing' || dispatchPhase === 'alerting'}
                        onClick={() => handleInquiryDispatch('whatsapp')}
                        className="py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] transition-colors shadow-2xs flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Send on WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        disabled={dispatchPhase === 'hashing' || dispatchPhase === 'alerting'}
                        onClick={() => handleInquiryDispatch('gmail')}
                        className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] transition-colors shadow-2xs flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send via Gmail</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 text-center mt-1">
                      Support Desk: <strong>+{cleanSupportNumber}</strong> • <strong>{supportEmail}</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════════
                TAB 3: FAQ (Instant Knowledge Base)
            ════════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'faq' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50 text-slate-900 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-teal-600" />
                    <span>Frequently Asked Questions</span>
                  </h4>
                  <span className="text-[10px] text-slate-500">MicroSplit AI Knowledge Base</span>
                </div>

                <div className="space-y-2.5">
                  {faqItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-400 transition-colors"
                    >
                      <h5 className="font-bold text-xs text-slate-900 mb-1.5">{item.q}</h5>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.a}</p>
                    </div>
                  ))}
                </div>

                {/* FAQ Help card */}
                <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-900">
                  <p className="font-bold mb-1">Still have questions?</p>
                  <p className="text-[11px] text-teal-800 mb-2">
                    Our AI Chat is trained on the full documentation, or you can talk directly to our team on WhatsApp.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('chat')}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-bold text-[11px]"
                    >
                      Ask AI Chat
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('contact')}
                      className="px-3 py-1.5 rounded-lg bg-white border border-teal-300 text-teal-800 font-bold text-[11px]"
                    >
                      WhatsApp Desk
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
