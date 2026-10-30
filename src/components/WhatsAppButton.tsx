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
  Check,
  CheckCheck,
  ShieldCheck,
  ArrowRight,
  Mail,
  Phone,
  HelpCircle,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type LanguageType = 'en' | 'hi' | 'hinglish';
type WidgetTab = 'chat' | 'voice' | 'contact' | 'faq';

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

const voicePrompts: Record<LanguageType, string[]> = {
  en: [
    'Explain 0-cent remainder split',
    'How do I verify evidence in the vault?',
    'Explain consistency streaks',
    'How do PayPal batch payouts work?',
  ],
  hi: [
    '0-सेंट स्प्लिट का तरीका समझाइए',
    'एविडेंस वॉल्ट कैसे चेक करें?',
    'कंसिस्टेंसी स्ट्रीक क्या है?',
    'पेपैल बैच पेआउट कैसे होता है?',
  ],
  hinglish: [
    '0-cent split math explain karo',
    'Evidence vault kaise verify hota hai?',
    'Consistency streak ka formula kya hai?',
    'PayPal batch payouts kaise kaam karta hai?',
  ],
};

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

  // Language & Voice Settings
  const [language, setLanguage] = useState<LanguageType>('hinglish');
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

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

  // Voice Cockpit State
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceReply, setVoiceReply] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');

  // Contact / Inquiry Desk State
  const [contactName, setContactName] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactTopic, setContactTopic] = useState('0-Cent Split & Math');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSubmittedTicket, setContactSubmittedTicket] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  // WhatsApp & Email Constants
  const defaultSupportNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE ||
    '919294514754';
  const cleanSupportNumber = defaultSupportNumber.replace(/[^0-9]/g, '') || '919294514754';
  const supportEmail = 'akshatsinghai6682@gmail.com';

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      scrollToBottom();
    }
  }, [chatMessages, isTyping, isOpen, activeTab]);

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

    // Stop speaking if switching languages
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsAiSpeaking(false);
      setVoiceStatus('idle');
    }

    // Add greeting in chat
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
            v.name.includes('Natural') ||
            v.name.includes('India'))
      );
      if (naturalEn) utterance.voice = naturalEn;
      utterance.rate = 0.95;
    }

    utterance.onstart = () => {
      setIsAiSpeaking(true);
      if (activeTab === 'voice') setVoiceStatus('speaking');
    };

    utterance.onend = () => {
      setIsAiSpeaking(false);
      if (activeTab === 'voice') setVoiceStatus('idle');
    };

    utterance.onerror = () => {
      setIsAiSpeaking(false);
      if (activeTab === 'voice') setVoiceStatus('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  // Toggle Microphone (Speech-To-Text via Web Speech API)
  const handleToggleMic = (targetScreen: 'chat' | 'voice' = 'chat') => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        'Speech Recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.'
      );
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setVoiceStatus('idle');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'hinglish' ? 'en-IN' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatus('listening');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        if (transcript && transcript.trim()) {
          if (targetScreen === 'voice') {
            setVoiceTranscript(transcript);
            executeVoiceQuery(transcript);
          } else {
            setInputText(transcript);
            handleSendMessage(transcript);
          }
        } else {
          setVoiceStatus('idle');
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceStatus('idle');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceStatus('idle');
    }
  };

  // Query Claude AI for the Voice Cockpit
  const executeVoiceQuery = async (query: string) => {
    setVoiceStatus('thinking');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: [],
          language,
        }),
      });

      const data = await response.json();
      const reply =
        data.reply ||
        'MicroSplit AI orchestrates 0-cent deterministic revenue splits with PayPal batch disbursements.';

      setVoiceReply(reply);
      speakText(reply, language);
    } catch {
      const fallback =
        'Network error. Please switch to the WhatsApp & Gmail tab to talk directly with our engineering team.';
      setVoiceReply(fallback);
      setVoiceStatus('idle');
    }
  };

  // Send message to Claude AI Backend (/api/chat) for Chat Tab
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
        'MicroSplit AI orchestrates verifiable revenue splits using deterministic math and PayPal batch disbursements. Switch to WhatsApp & Gmail tab to connect with our team.';

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
        'Network issue. Please switch to the "WhatsApp & Gmail" tab to connect directly with our engineering team.';
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

  // Contact Inquiry Dispatch Handler (WhatsApp or Gmail)
  const handleInquiryDispatch = async (destination: 'whatsapp' | 'gmail') => {
    if (!contactName.trim()) {
      setContactError('Please enter your full name.');
      return;
    }
    if (!contactMessage.trim()) {
      setContactError('Please enter your question or inquiry.');
      return;
    }

    setContactError(null);
    setIsSubmittingContact(true);

    let generatedTicket = `MS-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

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
      // Graceful fallback to client-generated ticket
    }

    setIsSubmittingContact(false);
    setContactSubmittedTicket(generatedTicket);

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
    } else {
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
            className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[430px] h-[min(620px,calc(100vh-3rem))] bg-white rounded-3xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden"
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

              {/* Controls: Speaker Mute + Close */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const next = !isSpeechEnabled;
                    setIsSpeechEnabled(next);
                    if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                      setIsAiSpeaking(false);
                    }
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isSpeechEnabled
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30'
                      : 'bg-white/10 text-slate-400'
                  }`}
                  title={isSpeechEnabled ? 'Voice Output ON (Click to Mute)' : 'Voice Output MUTED (Click to Unmute)'}
                >
                  {isSpeechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

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

            {/* ─── Sub-bar 1: Language Segmented Selector (Unclipped & Always Visible) ─── */}
            <div className="bg-[#0e2646] px-3.5 py-2 flex items-center justify-between border-b border-teal-500/20 flex-shrink-0">
              <span className="text-[11px] font-semibold text-teal-200/80 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-400" />
                <span>Language / भाषा:</span>
              </span>

              {/* Horizontal Segmented Bar - Eliminates any dropdown clipping */}
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

            {/* ─── Sub-bar 2: Navigation Tabs (AI Chat | Voice | WhatsApp & Gmail | FAQ) ─── */}
            <div className="bg-[#102C4D] px-2 py-1.5 flex items-center border-b border-teal-500/20 flex-shrink-0">
              <div className="grid grid-cols-4 w-full gap-1">
                {/* Tab 1: AI Chat */}
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10.5px] font-bold transition-all ${
                    activeTab === 'chat'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>AI Chat</span>
                </button>

                {/* Tab 2: Voice Assistant */}
                <button
                  type="button"
                  onClick={() => setActiveTab('voice')}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10.5px] font-bold transition-all ${
                    activeTab === 'voice'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-teal-300" />
                  <span>Voice</span>
                </button>

                {/* Tab 3: WhatsApp & Gmail Inquiry Desk */}
                <button
                  type="button"
                  onClick={() => setActiveTab('contact')}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10.5px] font-bold transition-all ${
                    activeTab === 'contact'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-300" />
                  <span>WhatsApp & Desk</span>
                </button>

                {/* Tab 4: FAQ */}
                <button
                  type="button"
                  onClick={() => setActiveTab('faq')}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10.5px] font-bold transition-all ${
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
                TAB 1: AI CHAT (WhatsApp Bubble Aesthetic)
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

                {/* Switch to WhatsApp Banner */}
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

                {/* Input Bar */}
                <div className="p-2.5 sm:p-3 bg-white border-t border-slate-200 flex-shrink-0">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    {/* Voice Mic Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleMic('chat')}
                      className={`p-2.5 rounded-full transition-all shadow-xs flex-shrink-0 ${
                        isListening
                          ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-teal-700'
                      }`}
                      title={isListening ? 'Listening... (Tap to stop)' : 'Tap to speak your question'}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    {/* Text Input */}
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
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════════
                TAB 2: VOICE ASSISTANT COCKPIT (Animated Equalizer & Speech)
            ════════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'voice' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col justify-between bg-gradient-to-b from-[#0B1F3A] via-[#0E2744] to-[#0B1F3A] text-white">
                {/* Voice Status Pill */}
                <div className="flex items-center justify-between pb-2 border-b border-teal-500/20">
                  <div className="flex items-center gap-1.5 text-xs text-teal-300">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                    <span className="font-bold">Web Speech API Voice Cockpit</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-medium">
                    Native • 100% Free
                  </span>
                </div>

                {/* Center Visualizer & Mic Button */}
                <div className="py-6 flex flex-col items-center justify-center text-center">
                  {/* Equalizer Sound Waves */}
                  <div className="flex items-center justify-center gap-1 h-12 mb-5">
                    {[30, 60, 95, 45, 80, 100, 70, 50, 85, 40, 65, 30].map((h, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-full transition-all duration-300 ${
                          voiceStatus === 'listening'
                            ? 'bg-rose-400 animate-pulse'
                            : voiceStatus === 'speaking'
                            ? 'bg-teal-400 animate-bounce'
                            : 'bg-teal-500/30'
                        }`}
                        style={{
                          height:
                            voiceStatus === 'listening' || voiceStatus === 'speaking'
                              ? `${h}%`
                              : '20%',
                          animationDelay: `${i * 75}ms`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Circular Microphone Trigger */}
                  <div className="relative mb-3">
                    {voiceStatus === 'listening' && (
                      <span className="absolute -inset-3 rounded-full bg-rose-500/30 animate-ping" />
                    )}
                    {voiceStatus === 'speaking' && (
                      <span className="absolute -inset-3 rounded-full bg-teal-500/30 animate-pulse" />
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleMic('voice')}
                      className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform active:scale-95 ${
                        voiceStatus === 'listening'
                          ? 'bg-rose-600 text-white ring-4 ring-rose-400/50'
                          : voiceStatus === 'thinking'
                          ? 'bg-amber-600 text-white animate-spin'
                          : 'bg-gradient-to-tr from-teal-500 to-emerald-400 text-[#0B1F3A] hover:scale-105'
                      }`}
                    >
                      {voiceStatus === 'listening' ? (
                        <MicOff className="w-8 h-8" />
                      ) : voiceStatus === 'thinking' ? (
                        <RotateCcw className="w-8 h-8" />
                      ) : (
                        <Mic className="w-8 h-8 font-bold" />
                      )}
                    </button>
                  </div>

                  {/* Status Text */}
                  <p className="text-sm font-bold text-white mt-2">
                    {voiceStatus === 'listening'
                      ? '🎙️ Listening to you... (बोलिए)'
                      : voiceStatus === 'thinking'
                      ? '⚡ Claude AI is thinking...'
                      : voiceStatus === 'speaking'
                      ? '🔊 AI is speaking answer...'
                      : 'Tap Mic to Speak (बोलने के लिए दबाएं)'}
                  </p>
                  <p className="text-xs text-slate-300 mt-1 max-w-xs">
                    Ask in {language === 'en' ? 'English' : language === 'hi' ? 'हिंदी' : 'Hinglish'} about 0-cent splits, evidence verification, or PayPal payouts.
                  </p>
                </div>

                {/* Transcripts Readout Section */}
                <div className="space-y-2.5">
                  {voiceTranscript && (
                    <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-300 uppercase tracking-wider mb-1">
                        <span>🗣️ You said (आपने कहा):</span>
                      </div>
                      <p className="text-xs text-white leading-relaxed font-medium">"{voiceTranscript}"</p>
                    </div>
                  )}

                  {voiceReply && (
                    <div className="bg-teal-950/60 backdrop-blur-xs rounded-2xl p-3 border border-teal-500/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">
                          🤖 Claude AI Answer:
                        </span>
                        <button
                          type="button"
                          onClick={() => speakText(voiceReply, language)}
                          className="text-[10.5px] text-teal-300 hover:text-white flex items-center gap-1 font-bold underline"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Replay</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{voiceReply}</p>
                    </div>
                  )}

                  {/* Quick Voice Prompt Chips */}
                  {!voiceTranscript && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 mb-1.5">
                        Quick Voice Questions (Tap to ask):
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {voicePrompts[language].map((prompt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setVoiceTranscript(prompt);
                              executeVoiceQuery(prompt);
                            }}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-left text-[10.5px] text-slate-200 hover:text-white transition-colors"
                          >
                            🎤 {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cockpit Footer */}
                <div className="pt-3 border-t border-teal-500/20 text-center">
                  <span className="text-[10.5px] text-slate-400">
                    Need official confirmation? Check the{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('contact')}
                      className="text-teal-300 hover:underline font-bold"
                    >
                      WhatsApp & Gmail Desk
                    </button>
                  </span>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════════
                TAB 3: WHATSAPP & GMAIL DESK (Direct WhatsApp + Inquiry Form)
            ════════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'contact' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50 text-slate-900 space-y-4">
                {/* Desk Header Banner */}
                <div className="bg-gradient-to-r from-[#0B1F3A] to-[#102C4D] text-white p-3.5 rounded-2xl border border-teal-500/30 shadow-xs">
                  <div className="flex items-center gap-2">
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

                {/* ── CARD 1: 1-Click WhatsApp Direct Chat ── */}
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
                    Open WhatsApp directly with our team for quick questions about contracts, payouts, or squad setup.
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
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-300"></div>
                  <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Or Send Official Inquiry
                  </span>
                  <div className="flex-grow border-t border-slate-300"></div>
                </div>

                {/* ── CARD 2: Send Official Inquiry Form (WhatsApp & Gmail) ── */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <h5 className="font-bold text-xs text-slate-900 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-teal-600" />
                    <span>Submit Inquiry (WhatsApp or Gmail)</span>
                  </h5>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Generates a verified Ticket ID. Dispatches directly to WhatsApp and akshatsinghai6682@gmail.com.
                  </p>

                  {/* Success Alert */}
                  {contactSubmittedTicket && (
                    <div className="mb-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Inquiry Dispatched!</span>
                        <span>Ticket ID: </span>
                        <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">
                          {contactSubmittedTicket}
                        </code>
                        <p className="text-[10.5px] text-emerald-800 mt-1">
                          Our team has been notified. Check your WhatsApp or Email for the engineering response.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error Alert */}
                  {contactError && (
                    <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{contactError}</span>
                    </div>
                  )}

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
                          Your WhatsApp No.
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

                    {/* Topic */}
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                        Inquiry Topic
                      </label>
                      <select
                        value={contactTopic}
                        onChange={(e) => setContactTopic(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-teal-500 bg-slate-50"
                      >
                        <option value="0-Cent Split & Math">0-Cent Split & Math Logic</option>
                        <option value="Evidence Vault & Verification">Evidence Vault & Verification (/evidence)</option>
                        <option value="Consistency Streak Bonus">Consistency Streak Bonus Calculation</option>
                        <option value="PayPal Batch Payouts">PayPal Batch Payouts Integration</option>
                        <option value="General Support">General Squad Support</option>
                      </select>
                    </div>

                    {/* Message */}
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

                    {/* Dual Action Dispatch Buttons */}
                    <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isSubmittingContact}
                        onClick={() => handleInquiryDispatch('whatsapp')}
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Send on WhatsApp →</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmittingContact}
                        onClick={() => handleInquiryDispatch('gmail')}
                        className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send via Gmail →</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 text-center mt-1">
                      Target Support Email: <strong>akshatsinghai6682@gmail.com</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════════
                TAB 4: FAQ (Instant Knowledge Base)
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
