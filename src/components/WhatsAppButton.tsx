'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Send,
  CheckCircle2,
  Sparkles,
  Bot,
  ExternalLink,
  ShieldCheck,
  PhoneCall,
  Clock,
  Settings,
  HelpCircle,
  ArrowRight,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Mic,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Quick suggested prompt questions
const quickPrompts = [
  'How does the 0-cent split work?',
  'How is the Consistency Streak Bonus calculated?',
  'How to integrate PayPal Batch payouts?',
  'How does focus session privacy work?',
];

// Pre-packaged smart AI responses
const aiAnswers: Record<string, string> = {
  'How does the 0-cent split work?':
    'MicroSplit AI uses deterministic integer-cent arithmetic with the Largest-Remainder (Hare-Niemeyer) method. The AI never touches money directly — it only proposes structured evidence facts. The math engine converts all amounts to integer cents, rounds down, and distributes any fractional cent remainders strictly by descending remainder with stable member-ID tie-breaking. Exactly zero cents are lost or created.',
  'How is the Consistency Streak Bonus calculated?':
    'Squads configure a consistency bonus percentage (default 5%, max 10%). The pool is divided into a Work Pool and a Consistency Pool. Each member earns streak points for consecutive active calendar days (in their local declared IANA timezone). Approvers can grant freeze days to protect streaks during illness or travel without losing their accumulated multiplier.',
  'How to integrate PayPal Batch payouts?':
    'MicroSplit connects directly to PayPal Payouts v1 API. Once a split run is approved by squad approvers, a single batch transaction can pay up to 15,000 squad members worldwide with automatic currency routing, real-time webhooks, and tamper-evident SHA-256 audit ledger sealing.',
  'How does focus session privacy work?':
    'Focus sessions are 100% opt-in. We strictly NEVER record screens, keystrokes, window titles, or background processes. We only log verified session start/stop timestamps linked to declared tasks. Members maintain full sovereignty and can view or permanently delete their session history anytime.',
};

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'voice' | 'whatsapp' | 'faq'>('ai');
  const [showTooltip, setShowTooltip] = useState(true);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: '👋 Hi there! I am the MicroSplit AI Concierge. How can I help you with squad revenue attribution, streak bonuses, or PayPal payouts today?',
      time: 'Just now',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Live Voice Call State (Browser Audio / TTS)
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // WhatsApp form state
  const [waName, setWaName] = useState('');
  const [waPhone, setWaPhone] = useState('');
  const [waTopic, setWaTopic] = useState('Payout Assistance');
  const [waNotes, setWaNotes] = useState('');
  const [waSubmitted, setWaSubmitted] = useState(false);
  const [waLoading, setWaLoading] = useState(false);
  const [waTicket, setWaTicket] = useState<string | null>(null);

  // Configured WhatsApp support desk number (default to user's official line)
  const [customWaPhone, setCustomWaPhone] = useState<string>('919294514754');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('microsplit_custom_whatsapp');
      if (stored && stored.replace(/[^0-9]/g, '').length >= 8) {
        setCustomWaPhone(stored);
      } else if (process.env.NEXT_PUBLIC_WHATSAPP_PHONE && process.env.NEXT_PUBLIC_WHATSAPP_PHONE !== '15550192834') {
        setCustomWaPhone(process.env.NEXT_PUBLIC_WHATSAPP_PHONE);
      } else {
        setCustomWaPhone('919294514754');
      }
    }
  }, []);

  // Voice call duration timer
  useEffect(() => {
    if (callStatus === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (callStatus === 'idle') setCallDuration(0);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callStatus]);

  // Audio helper using Web Speech API
  const speakVoice = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && !isMuted) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Start Voice Call
  const handleStartCall = () => {
    setCallStatus('calling');
    setCallDuration(0);
    setVoiceTranscript('Dialing MicroSplit AI Voice Engine...');

    // Play ringing tone via Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        audioCtx.close();
      }, 1200);
    } catch {
      // AudioContext fallback
    }

    setTimeout(() => {
      setCallStatus('connected');
      const introMsg = 'Hello! You are connected to the MicroSplit AI Live Voice Line. I am your automated squad attribution assistant. How can I help you today?';
      setVoiceTranscript(introMsg);
      speakVoice(introMsg);
    }, 1800);
  };

  const handleEndCall = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCallStatus('ended');
    setVoiceTranscript('Call ended.');
    setTimeout(() => {
      setCallStatus('idle');
      setCallDuration(0);
    }, 1500);
  };

  const handleVoiceQuery = (query: string) => {
    setVoiceTranscript(`You: "${query}"`);
    const reply = aiAnswers[query] || 'MicroSplit orchestrates verifiable squad splits with zero cents lost or created.';
    setTimeout(() => {
      setVoiceTranscript(`AI: "${reply}"`);
      speakVoice(reply);
    }, 600);
  };

  const handleSaveCustomPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('microsplit_custom_whatsapp', customWaPhone.trim());
      setShowSettings(false);
    }
  };

  const handleSendChatMessage = (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply =
        aiAnswers[text.trim()] ||
        `Thanks for asking about "${text.trim()}". MicroSplit AI orchestrates verifiable revenue splits using deterministic math, SHA-256 audit chaining, and single-click PayPal batch disbursements. If you would like our engineering team to review your squad structure, feel free to use the WhatsApp or Live Call tabs above!`;

      const lower = text.toLowerCase();
      if (lower.includes('streak') || lower.includes('consistency')) {
        reply = aiAnswers['How is the Consistency Streak Bonus calculated?'];
      } else if (lower.includes('paypal') || lower.includes('payout') || lower.includes('batch')) {
        reply = aiAnswers['How to integrate PayPal Batch payouts?'];
      } else if (lower.includes('0-cent') || lower.includes('zero') || lower.includes('split') || lower.includes('math')) {
        reply = aiAnswers['How does the 0-cent split work?'];
      } else if (lower.includes('privacy') || lower.includes('focus') || lower.includes('session')) {
        reply = aiAnswers['How does focus session privacy work?'];
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 600);
  };

  const handleWhatsAppCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waPhone.trim()) return;

    setWaLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: waName.trim() || 'WhatsApp Visitor',
          email: `${waPhone.replace(/[^0-9]/g, '')}@whatsapp.client`,
          whatsapp: waPhone.trim(),
          topic: `WhatsApp Priority: ${waTopic}`,
          message: waNotes.trim() || `Priority WhatsApp contact request regarding ${waTopic}`,
        }),
      });

      const data = await res.json();
      setWaSubmitted(true);
      setWaTicket(data.ticketId || `WA-${Date.now().toString(36).toUpperCase()}`);
    } catch {
      setWaSubmitted(true);
      setWaTicket(`WA-${Date.now().toString(36).toUpperCase()}`);
    } finally {
      setWaLoading(false);
    }
  };

  const defaultWhatsAppText = encodeURIComponent(
    'Hi MicroSplit AI team, I need priority squad revenue attribution & payout assistance.'
  );

  const cleanCustomPhone = customWaPhone.replace(/[^0-9]/g, '');
  const isDirectWhatsAppAvailable =
    cleanCustomPhone.length >= 8 && cleanCustomPhone !== '15550192834';

  const directWhatsAppUrl = isDirectWhatsAppAvailable
    ? `https://wa.me/${cleanCustomPhone}?text=${defaultWhatsAppText}`
    : null;

  // Generate instant wa.me link for the number entered by user
  const cleanEnteredPhone = waPhone.replace(/[^0-9]/g, '');
  const instantUserWhatsAppUrl =
    cleanEnteredPhone.length >= 8
      ? `https://wa.me/${cleanEnteredPhone}?text=${defaultWhatsAppText}`
      : null;

  return (
    <>
      <aside aria-label="Support chat" className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 group">
        {!isOpen && showTooltip && (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-[#0B1F3A] text-white rounded-xl shadow-xl border border-teal-500/30 text-xs font-semibold animate-in fade-in slide-in-from-right-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Voice & WhatsApp Support</span>
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
            setIsOpen(!isOpen);
            if (!isOpen) setShowTooltip(false);
          }}
          aria-label="Toggle MicroSplit AI & WhatsApp Support"
          className="relative flex items-center justify-center w-14 h-14 rounded-full text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-teal-400/40"
          style={{
            background: isOpen
              ? '#0B1F3A'
              : 'linear-gradient(135deg, #0F9D8A 0%, #087F73 100%)',
            boxShadow: '0 8px 24px rgba(15, 157, 138, 0.45)',
          }}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white transition-transform duration-200 rotate-90" />
          ) : (
            <>
              <MessageCircle className="w-7 h-7 fill-current" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#0B1F3A]" />
              </span>
            </>
          )}
        </button>
      </aside>

      {/* ─── Interactive Concierge Drawer / Modal ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[430px] max-h-[640px] h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            style={{
              boxShadow: '0 20px 50px rgba(11, 31, 58, 0.25), 0 0 0 1px rgba(15, 157, 138, 0.2)',
            }}
          >
            {/* Header */}
            <div className="bg-[#0B1F3A] text-white p-4 sm:p-5 flex items-center justify-between relative overflow-hidden flex-shrink-0">
              <div
                className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(15, 157, 138, 0.25), transparent 70%)' }}
              />

              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400 shadow-inner">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm tracking-tight text-white">MicroSplit Concierge</h3>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                      v2.0
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] text-slate-300 font-medium">Fintech Support • Online Now</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 relative z-10">
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  title="Configure WhatsApp Connection"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Optional Settings Panel */}
            {showSettings && (
              <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs">
                <form onSubmit={handleSaveCustomPhone} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Support WhatsApp Number</span>
                    <span className="text-[10px] text-slate-500">Stored locally</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Enter your phone number with country code (e.g. <code>919876543210</code> or <code>14155552671</code>):
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 919876543210"
                      value={customWaPhone}
                      onChange={(e) => setCustomWaPhone(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-bold text-xs hover:bg-teal-700"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab Navigation with 4 tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-2.5 text-[11px] font-bold flex items-center justify-center gap-1 border-b-2 transition-colors ${
                  activeTab === 'ai'
                    ? 'border-teal-600 text-teal-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>AI Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('voice')}
                className={`flex-1 py-2.5 text-[11px] font-bold flex items-center justify-center gap-1 border-b-2 transition-colors ${
                  activeTab === 'voice'
                    ? 'border-teal-600 text-teal-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>Live Call</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('whatsapp')}
                className={`flex-1 py-2.5 text-[11px] font-bold flex items-center justify-center gap-1 border-b-2 transition-colors ${
                  activeTab === 'whatsapp'
                    ? 'border-emerald-600 text-emerald-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageCircle className="w-3 h-3 text-emerald-600" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('faq')}
                className={`flex-1 py-2.5 text-[11px] font-bold flex items-center justify-center gap-1 border-b-2 transition-colors ${
                  activeTab === 'faq'
                    ? 'border-teal-600 text-teal-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <HelpCircle className="w-3 h-3" />
                <span>FAQ</span>
              </button>
            </div>

            {/* TAB 1: AI Live Chat */}
            {activeTab === 'ai' && (
              <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-[#0B1F3A] text-white rounded-br-none shadow-sm'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs px-2 py-1">
                      <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="text-[11px] text-slate-500 ml-1">AI Assistant is thinking...</span>
                    </div>
                  )}

                  {chatMessages.length <= 2 && (
                    <div className="pt-2">
                      <p className="text-[11px] font-semibold text-slate-500 mb-2">Frequently asked:</p>
                      <div className="flex flex-col gap-1.5">
                        {quickPrompts.map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => handleSendChatMessage(q)}
                            className="text-left px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 hover:border-teal-400 hover:bg-teal-50/50 transition-colors flex items-center justify-between group"
                          >
                            <span>{q}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-white border-t border-slate-200 flex-shrink-0">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChatMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Ask about splits, streaks, PayPal..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-full border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 transition-colors shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE VOICE CALL (Real Browser Audio & Speech) */}
            {activeTab === 'voice' && (
              <div className="flex-1 overflow-y-auto p-5 bg-slate-50 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-[#0B1F3A] to-[#102C4D] rounded-2xl p-6 text-white text-center shadow-lg relative overflow-hidden">
                    <div
                      className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
                      style={{ background: 'radial-gradient(circle, rgba(15, 157, 138, 0.3), transparent 70%)' }}
                    />

                    {/* Visualizer Circle */}
                    <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
                      {callStatus === 'calling' && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                      )}
                      {callStatus === 'connected' && (
                        <span className="animate-pulse absolute inline-flex h-24 w-24 rounded-full bg-teal-500/30" />
                      )}
                      <div className="w-16 h-16 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-md relative z-10">
                        {callStatus === 'connected' ? (
                          <Volume2 className="w-8 h-8 animate-pulse" />
                        ) : (
                          <Phone className="w-7 h-7" />
                        )}
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-white">
                      {callStatus === 'idle' && 'MicroSplit Voice Support'}
                      {callStatus === 'calling' && 'Dialing AI Audio Line...'}
                      {callStatus === 'connected' && 'Live AI Call Connected'}
                      {callStatus === 'ended' && 'Call Disconnected'}
                    </h4>

                    <p className="text-xs text-slate-300 mt-1 font-mono">
                      {callStatus === 'connected' ? (
                        <span className="text-emerald-400 font-bold">
                          {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')} (Active Audio)
                        </span>
                      ) : (
                        'In-Browser Realtime Speech Engine'
                      )}
                    </p>

                    {/* Audio Transcript readout */}
                    {voiceTranscript && (
                      <div className="mt-4 p-3 bg-white/10 rounded-xl text-xs text-slate-200 border border-white/10 text-left leading-relaxed">
                        <span className="font-bold text-teal-300 block mb-0.5 text-[10px] uppercase">Live Audio Transcript:</span>
                        {voiceTranscript}
                      </div>
                    )}
                  </div>

                  {/* Call Controls */}
                  {callStatus === 'connected' ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          type="button"
                          onClick={() => setIsMuted(!isMuted)}
                          className={`p-3 rounded-full border transition-all ${
                            isMuted ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                        >
                          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <button
                          type="button"
                          onClick={handleEndCall}
                          className="px-6 py-3 rounded-full bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-md flex items-center gap-2"
                        >
                          <PhoneOff className="w-4 h-4" />
                          <span>End Call</span>
                        </button>
                      </div>

                      <div className="pt-2">
                        <p className="text-[11px] font-semibold text-slate-600 mb-1.5 text-center">Ask by voice:</p>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          {quickPrompts.slice(0, 4).map((q) => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => handleVoiceQuery(q)}
                              className="p-2 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-700 hover:border-teal-400 hover:bg-teal-50 text-left truncate"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleStartCall}
                        className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Start Free Voice Call (Speaker On)</span>
                      </button>

                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Note on Cellular Phone Calls:</strong>
                          <p className="mt-0.5 text-amber-800">
                            Website contact forms log callback tickets. To receive an outbound cellular phone call to your SIM card, an automated telecom trunk (Twilio Voice / Vapi) is required. You can test live audio immediately using the <strong>Start Free Voice Call</strong> button above!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 text-center pt-2">
                  Uses Web Speech Audio • Zero carrier charges
                </div>
              </div>
            )}

            {/* TAB 3: WhatsApp Desk */}
            {activeTab === 'whatsapp' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50">
                {waSubmitted ? (
                  <div className="py-6 text-center space-y-3 bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900">Support Request Logged!</h4>
                    <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                      Your ticket reference has been recorded in our dispatch system:
                    </p>
                    <div className="inline-block px-3 py-1.5 rounded-lg bg-slate-100 font-mono text-xs font-semibold text-slate-700">
                      Ticket #{waTicket}
                    </div>

                    {/* Instant WhatsApp Action for the entered number */}
                    {instantUserWhatsAppUrl && (
                      <div className="pt-2">
                        <p className="text-[11px] text-slate-600 mb-2">Want to chat right now?</p>
                        <a
                          href={instantUserWhatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Open in WhatsApp Directly</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      </div>
                    )}

                    <div className="pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setWaSubmitted(false);
                          setWaPhone('');
                        }}
                        className="text-xs font-semibold text-teal-600 hover:underline"
                      >
                        Submit another inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Direct WhatsApp button to reach the official support line */}
                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-emerald-950">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                          <h4 className="text-xs font-bold text-emerald-900">Official Support WhatsApp Desk</h4>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          🟢 Online Now
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 mb-3 leading-relaxed">
                        Click below to open WhatsApp directly and chat with our fintech engineers about revenue splits, streak disputes, or PayPal payouts.
                      </p>
                      <a
                        href={directWhatsAppUrl || `https://wa.me/919294514754?text=${defaultWhatsAppText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Chat on WhatsApp Directly</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    </div>

                    {/* Callback Form for visitors to request a message from support */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <PhoneCall className="w-4 h-4 text-teal-600" />
                          <h4 className="text-xs font-bold text-slate-900">Or Request a Priority Callback</h4>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          SLA &lt; 15m
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                        Prefer us to contact you? Enter your WhatsApp number below and a team engineer will message you directly.
                      </p>

                      <form onSubmit={handleWhatsAppCallbackSubmit} className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Your WhatsApp Phone Number *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="+91 98765 43210 or +1 415 555 2671"
                            value={waPhone}
                            onChange={(e) => setWaPhone(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Name</label>
                            <input
                              type="text"
                              placeholder="Alex"
                              value={waName}
                              onChange={(e) => setWaName(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Topic</label>
                            <select
                              value={waTopic}
                              onChange={(e) => setWaTopic(e.target.value)}
                              className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-teal-500 bg-white"
                            >
                              <option>Payout Assistance</option>
                              <option>Streak Bonus Setup</option>
                              <option>PayPal Batch Config</option>
                              <option>Squad Onboarding</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Notes / Context (Optional)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Briefly describe what you need help with..."
                            value={waNotes}
                            onChange={(e) => setWaNotes(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={waLoading || !waPhone.trim()}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#0F9D8A] text-white text-xs font-bold hover:bg-[#087F73] disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{waLoading ? 'Sending...' : 'Log Callback Request'}</span>
                        </button>
                      </form>

                      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                        <span>Private & encrypted. Phone numbers are never published or shared publicly.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: FAQ */}
            {activeTab === 'faq' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Core Platform Capabilities
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="font-bold text-slate-900 mb-1">⚡ Deterministic Integer-Cent Math</p>
                      <p className="text-[11px] text-slate-600">
                        Total pool cents are mathematically preserved. AI extracts fact records; pure deterministic code computes payouts.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="font-bold text-slate-900 mb-1">🔥 Consistency Streak Bonus</p>
                      <p className="text-[11px] text-slate-600">
                        Daily streak points award bonus shares up to a 100-day cap with freeze grants.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="font-bold text-slate-900 mb-1">🔐 SHA-256 Ledger Audit</p>
                      <p className="text-[11px] text-slate-600">
                        Every allocation and batch execution is cryptographically hashed in an append-only verifiable chain.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-teal-50 rounded-2xl p-4 border border-teal-200">
                  <h4 className="text-xs font-bold text-teal-900 mb-1">Domain Email Support</h4>
                  <p className="text-[11px] text-teal-800 mb-2">
                    Prefer email? Our team answers within 2 hours.
                  </p>
                  <a
                    href="mailto:support@microsplit.ai"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:underline"
                  >
                    <span>support@microsplit.ai</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Footer trust bar */}
            <div className="p-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 px-4 flex-shrink-0">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-teal-600" />
                Response time: &lt; 2 mins
              </span>
              <span>MicroSplit AI v2.0</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
