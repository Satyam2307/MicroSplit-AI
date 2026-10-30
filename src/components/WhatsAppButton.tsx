'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Bot,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Globe,
  ChevronDown,
  Check,
  CheckCheck,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type LanguageType = 'en' | 'hi' | 'hinglish';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

const greetings: Record<LanguageType, string> = {
  en: '👋 Hello! I am your MicroSplit AI Concierge. How can I assist you with evidence verification, 0-cent splits, consistency streaks, or PayPal batch payouts today?',
  hi: '👋 नमस्ते! मैं MicroSplit AI असिस्टेंट हूँ। मैं आपकी टीम के एविडेंस अपलोड, 0-सेंट स्प्लिट, कंसिस्टेंसी स्ट्रीक, या पेपैल पेआउट में कैसे सहायता कर सकता हूँ?',
  hinglish: '👋 Hello! Main MicroSplit AI Assistant hoon. Squad revenue splits, evidence vault, 0-cent math ya PayPal batch payouts ke baare mein aapko kya jaankari chahiye?',
};

const placeholders: Record<LanguageType, string> = {
  en: 'Ask a question or tap mic to speak...',
  hi: 'अपना सवाल लिखें या माइक दबाकर बोलें...',
  hinglish: 'Sawaal likhein ya mic daba kar bolein...',
};

const quickPills: Record<LanguageType, string[]> = {
  en: [
    'How does 0-cent split work?',
    'How can we see the evidence feature?',
    'How is Consistency Streak calculated?',
    'How to integrate PayPal Batch payouts?',
  ],
  hi: [
    '0-सेंट स्प्लिट कैसे काम करता है?',
    'एविडेंस फीचर कैसे देखें?',
    'कंसिस्टेंसी स्ट्रीक बोनस क्या है?',
    'पेपैल बैच पेआउट कैसे सेटअप करें?',
  ],
  hinglish: [
    '0-cent split kaise kaam karta hai?',
    'Evidence feature kaise dekhe?',
    'Streak bonus kaise calculate hota hai?',
    'PayPal batch payouts kaise setup karein?',
  ],
};

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  // Settings
  const [language, setLanguage] = useState<LanguageType>('hinglish');
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

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

  // Team se baat karein Modal State
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamQuestion, setTeamQuestion] = useState('');

  // WhatsApp Phone Number from Environment
  const defaultSupportNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE ||
    '919294514754';
  const cleanSupportNumber = defaultSupportNumber.replace(/[^0-9]/g, '') || '919294514754';

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const langRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [chatMessages, isTyping, isOpen]);

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    if (langDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [langDropdownOpen]);

  // Preload speech synthesis voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Language switch handler
  const handleLanguageChange = (newLang: LanguageType) => {
    setLanguage(newLang);
    setLangDropdownOpen(false);

    // Stop speaking if switching languages
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Add notice in chat
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

  // Speaks aloud using browser Web Speech Synthesis
  const speakText = (text: string, lang: LanguageType) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !isSpeechEnabled) return;

    window.speechSynthesis.cancel();

    // Clean markdown characters for smooth speech
    const speechClean = text.replace(/[*#`_•]/g, '').slice(0, 450);
    const utterance = new SpeechSynthesisUtterance(speechClean);
    const voices = window.speechSynthesis.getVoices();

    if (lang === 'hi') {
      utterance.lang = 'hi-IN';
      const hiVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.includes('Lekha') ||
          v.name.includes('Kalpana')
      );
      if (hiVoice) utterance.voice = hiVoice;
      utterance.rate = 0.92;
    } else {
      utterance.lang = lang === 'hinglish' ? 'en-IN' : 'en-US';
      const naturalEn = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel') ||
            v.name.includes('Natural'))
      );
      if (naturalEn) utterance.voice = naturalEn;
      utterance.rate = 0.95;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Toggle Microphone (Speech-To-Text via Web Speech API)
  const handleToggleMic = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'hinglish' ? 'en-IN' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        if (transcript && transcript.trim()) {
          setInputText(transcript);
          // Automatically send the voice query
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
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
        'MicroSplit AI orchestrates verifiable revenue splits using deterministic math and PayPal batch disbursements. Team se baat karne ke liye upar diye gaye button par click karein.';

      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);

      if (isSpeechEnabled) {
        speakText(reply, language);
      }
    } catch {
      setIsTyping(false);
      const fallbackReply =
        'Network issue. Please tap "Team se baat karein" to connect directly with our engineering team on WhatsApp.';
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

  // Submit "Team se baat karein" WhatsApp action
  const handleTeamWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamQuestion.trim()) return;

    // Gather last 3 chat messages for context
    const recentChatContext = chatMessages
      .slice(-4)
      .map((m) => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.text.slice(0, 100)}`)
      .join('\n');

    const messageText =
      `👋 *New Inquiry for MicroSplit Team*\n\n` +
      `👤 *Name:* ${teamName.trim() || 'Visitor'}\n` +
      `💬 *Question / Sawaal:*\n"${teamQuestion.trim()}"\n\n` +
      `📜 *Recent Chat History:*\n${recentChatContext}\n\n` +
      `---\n*Sent via MicroSplit AI Assistant*`;

    const waUrl = `https://wa.me/${cleanSupportNumber}?text=${encodeURIComponent(messageText)}`;

    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank');
    }

    setShowTeamModal(false);
    setTeamQuestion('');

    // Add confirmation bubble in chat
    setChatMessages((prev) => [
      ...prev,
      {
        id: `team-sent-${Date.now()}`,
        sender: 'assistant',
        text: `✅ Aapka sawaal WhatsApp par (+${cleanSupportNumber}) dispatch kar diya gaya hai! Hamari team jald hi aapko WhatsApp par reply karegi.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* ─── Floating Launcher Button (visible only when chat is closed) ─── */}
      {!isOpen && (
        <aside
          aria-label="MicroSplit Assistant"
          className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5"
        >
          {showTooltip && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#0B1F3A] text-white rounded-xl shadow-xl border border-teal-500/30 text-xs font-semibold animate-in fade-in slide-in-from-right-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>MicroSplit AI Assistant</span>
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
            aria-label="Open MicroSplit AI Chat Assistant"
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

      {/* ─── WhatsApp-Style Chat Box ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[410px] h-[min(580px,calc(100vh-3.5rem))] bg-[#ECE5DD] rounded-3xl shadow-2xl border border-slate-300/80 flex flex-col overflow-hidden"
            style={{
              boxShadow: '0 20px 50px rgba(11, 31, 58, 0.25), 0 0 0 1px rgba(15, 157, 138, 0.2)',
            }}
          >
            {/* Header (Navy #0B1F3A with Teal accents - NO overflow-hidden on container to allow dropdown) */}
            <div className="bg-[#0B1F3A] text-white px-4 py-3 sm:px-4 sm:py-3.5 flex items-center justify-between relative flex-shrink-0 border-b border-teal-500/20 z-20">
              {/* Background decorative glow (isolated overflow-hidden) */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-t-3xl">
                <div
                  className="absolute top-0 right-0 w-36 h-36 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(15, 157, 138, 0.25), transparent 70%)' }}
                />
              </div>

              {/* Bot Info */}
              <div className="flex items-center gap-2.5 relative z-10">
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
                    <span className="text-[11px] text-slate-300 font-medium">Online • Fintech Assistant</span>
                  </div>
                </div>
              </div>

              {/* Header Controls: Language Selector, Speaker Toggle, Close */}
              <div className="flex items-center gap-1 relative z-10">
                {/* Language Dropdown with outside-click ref */}
                <div className="relative" ref={langRef}>
                  <button
                    type="button"
                    onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-slate-200 transition-colors"
                    title="Change Assistant Language"
                  >
                    <Globe className="w-3.5 h-3.5 text-teal-400" />
                    <span className="uppercase">{language}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {langDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-36 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 py-1 text-xs font-semibold z-50 animate-in fade-in zoom-in-95">
                      <button
                        type="button"
                        onClick={() => handleLanguageChange('en')}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-teal-50 transition-colors ${
                          language === 'en' ? 'text-teal-700 font-bold bg-teal-50/50' : 'text-slate-700'
                        }`}
                      >
                        <span>English</span>
                        {language === 'en' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLanguageChange('hi')}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-teal-50 transition-colors ${
                          language === 'hi' ? 'text-teal-700 font-bold bg-teal-50/50' : 'text-slate-700'
                        }`}
                      >
                        <span>हिंदी (Hindi)</span>
                        {language === 'hi' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLanguageChange('hinglish')}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-teal-50 transition-colors ${
                          language === 'hinglish' ? 'text-teal-700 font-bold bg-teal-50/50' : 'text-slate-700'
                        }`}
                      >
                        <span>Hinglish</span>
                        {language === 'hinglish' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Speaker Audio Output Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !isSpeechEnabled;
                    setIsSpeechEnabled(next);
                    if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title={isSpeechEnabled ? 'Voice Output ON (Click to Mute)' : 'Voice Output MUTED (Click to Unmute)'}
                >
                  {isSpeechEnabled ? (
                    <Volume2 className="w-4 h-4 text-teal-300" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close Chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-bar: Team se baat karein (WhatsApp Direct Trigger) */}
            <div className="bg-[#102C4D] text-white px-3.5 py-1.5 flex items-center justify-between text-xs border-b border-teal-500/20 flex-shrink-0 z-10">
              <span className="text-[11px] text-teal-200/90 flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-teal-400" />
                <span>Instant Verified Support</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  setTeamQuestion(inputText || '');
                  setShowTeamModal(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Team se baat karein</span>
              </button>
            </div>

            {/* Chat Body (WhatsApp Wallpaper aesthetic) */}
            <div
              className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 relative"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 10% 20%, rgba(15, 157, 138, 0.04) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(11, 31, 58, 0.04) 0%, transparent 40%)',
              }}
            >
              {/* Date pill */}
              <div className="flex justify-center my-1">
                <span className="px-2.5 py-0.5 rounded-full bg-white/70 backdrop-blur-xs text-[10px] font-bold text-slate-500 shadow-2xs border border-slate-200/60 uppercase tracking-wider">
                  Today
                </span>
              </div>

              {/* Chat Message Bubbles */}
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-[#0B1F3A] text-white rounded-tr-none'
                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/90'
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

              {/* WhatsApp-Style Typing Dots Indicator */}
              {isTyping && (
                <div className="flex items-start">
                  <div className="bg-white rounded-2xl rounded-tl-none px-3.5 py-2.5 border border-slate-200/90 shadow-xs flex items-center gap-1.5 text-slate-500">
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
                    <span className="text-[11px] font-medium text-slate-400 ml-1">AI Assistant typing...</span>
                  </div>
                </div>
              )}

              {/* Quick Prompt Pills (shown initially) */}
              {chatMessages.length <= 2 && (
                <div className="pt-2">
                  <p className="text-[11px] font-bold text-slate-500 mb-1.5 px-1">
                    {language === 'hi'
                      ? 'सुझाए गए सवाल:'
                      : language === 'hinglish'
                      ? 'Frequent sawaal:'
                      : 'Suggested questions:'}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {quickPills[language].map((pill, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(pill)}
                        className="text-left px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-slate-200 text-slate-700 text-[11px] font-medium hover:border-teal-400 hover:text-teal-900 transition-colors flex items-center justify-between group shadow-2xs"
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

            {/* Input Bar (WhatsApp-style with Voice Mic & Send) */}
            <div className="p-2.5 sm:p-3 bg-white border-t border-slate-200 flex-shrink-0 z-10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                {/* Voice Assistant Mic Button */}
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`p-2.5 rounded-full transition-all shadow-xs flex-shrink-0 ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-teal-700'
                  }`}
                  title={isListening ? 'Listening to voice... (Tap to stop)' : 'Tap to speak your question'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Input Text Box */}
                <input
                  type="text"
                  placeholder={isListening ? '🎙️ Listening... Speak now...' : placeholders[language]}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-full border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/70"
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

            {/* ─── "Team se baat karein" WhatsApp Modal Overlay ─── */}
            <AnimatePresence>
              {showTeamModal && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm p-4 sm:p-5 flex flex-col justify-between overflow-y-auto"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">Team se WhatsApp par baat karein</h4>
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            Direct Support (+{cleanSupportNumber})
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTeamModal(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      Aapka sawaal aur chat history automatically WhatsApp message mein format ho kar open hogi taaki hamari engineering team aapko turant reply kar sake.
                    </p>

                    {/* Form */}
                    <form onSubmit={handleTeamWhatsAppSubmit} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Aapka Naam (Your Name)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Alex Sharma"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Aapka Sawaal / Query *
                        </label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Aapko MicroSplit AI ke baare mein kya poochna hai..."
                          value={teamQuestion}
                          onChange={(e) => setTeamQuestion(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 bg-white resize-none"
                        />
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
                        <span className="font-bold text-slate-700 block mb-0.5">Chat Context Attached:</span>
                        Last {Math.min(chatMessages.length, 3)} messages will be attached so our team understands your context.
                      </div>

                      <div className="pt-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowTeamModal(false)}
                          className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={!teamQuestion.trim()}
                          className="flex-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>WhatsApp par Send karein →</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="mt-3 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Official verified MicroSplit AI WhatsApp Desk</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
