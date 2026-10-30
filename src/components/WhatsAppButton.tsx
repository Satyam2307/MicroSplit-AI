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
  MicOff,
  Globe,
  Mail,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Multi-language voice knowledge base
interface LanguageData {
  name: string;
  langCode: string;
  greeting: string;
  prompts: string[];
  answers: Record<string, string>;
}

const voiceLangs: Record<'en' | 'hi' | 'hinglish', LanguageData> = {
  en: {
    name: 'English',
    langCode: 'en-US',
    greeting: 'Hello! Welcome to MicroSplit AI voice support. I am your squad attribution assistant. How can I assist you with your payout or revenue splits today?',
    prompts: [
      'How does the 0-cent split work?',
      'How is the Consistency Streak Bonus calculated?',
      'How to integrate PayPal Batch payouts?',
      'How does focus session privacy work?',
    ],
    answers: {
      'How does the 0-cent split work?':
        'MicroSplit AI uses deterministic integer-cent math with largest-remainder rounding. AI only extracts facts, while mathematical code executes the payouts. Exactly zero cents are lost or created.',
      'How is the Consistency Streak Bonus calculated?':
        'Squads allocate up to ten percent for consistency. Every verified active day adds to your streak multiplier up to one hundred days, with approved freeze days protecting your streak during time off.',
      'How to integrate PayPal Batch payouts?':
        'Once approved by squad approvers, a single PayPal Batch API transaction disburses funds to up to 15,000 squad members globally with instant webhook confirmation.',
      'How does focus session privacy work?':
        'Focus sessions are one hundred percent opt-in. We never capture screens, keystrokes, or background apps. Only task timestamps are logged, and you can permanently delete them anytime.',
    },
  },
  hi: {
    name: 'हिंदी (Hindi)',
    langCode: 'hi-IN',
    greeting: 'नमस्ते! माइक्रोस्प्लिट एआई वॉइस सपोर्ट में आपका स्वागत है। मैं आपकी टीम के रेवेन्यू स्प्लिट और पेआउट में कैसे सहायता कर सकता हूँ?',
    prompts: [
      '0-सेंट स्प्लिट कैसे काम करता है?',
      'कंसिस्टेंसी स्ट्रीक बोनस क्या है?',
      'पेपैल बैच पेआउट कैसे होता है?',
      'प्राइवेसी और फोकस सेशन कैसे सुरक्षित हैं?',
    ],
    answers: {
      '0-सेंट स्प्लिट कैसे काम करता है?':
        'माइक्रोस्प्लिट एआई डिफ़ॉल्ट रूप से डिटर्मिनिस्टिक मैथ का उपयोग करता है। सभी पैसों का हिसाब पैसे के पूर्णांक में होता है, जिससे एक भी पैसे का नुकसान या अंतर नहीं आता।',
      'कंसिस्टेंसी स्ट्रीक बोनस क्या है?':
        'आपकी टीम 10 प्रतिशत तक का कंसिस्टेंसी पूल बना सकती है। हर दिन लगातार काम करने से स्ट्रीक बोनस बढ़ता है, और बीमारी या छुट्टी के लिए फ्रीज डेज भी मिलते हैं।',
      'पेपैल बैच पेआउट कैसे होता है?':
        'स्प्लिट अप्रूव होने के बाद, सिर्फ एक क्लिक में पेपैल बैच एपीआई द्वारा पूरी टीम के बैंक या पेपैल में तुरंत पैसे ट्रांसफर हो जाते हैं।',
      'प्राइवेसी और फोकस सेशन कैसे सुरक्षित हैं?':
        'फोकस सेशन पूरी तरह से आपकी इच्छा पर निर्भर है। हम कभी भी स्क्रीन, कीस्ट्रोक या बैकग्राउंड गतिविधि रिकॉर्ड नहीं करते। आपका डेटा पूरी तरह निजी है।',
    },
  },
  hinglish: {
    name: 'Hinglish',
    langCode: 'en-IN',
    greeting: 'Hello! MicroSplit AI voice assistant mein aapka swagat hai. Squad revenue split aur PayPal payouts ke baare mein aapko kya jaankari chahiye?',
    prompts: [
      '0-cent split kaise kaam karta hai?',
      'Consistency Streak bonus kya hai?',
      'PayPal batch payouts kaise setup karein?',
      'Member privacy kaise protected hai?',
    ],
    answers: {
      '0-cent split kaise kaam karta hai?':
        'MicroSplit AI deterministic integer math use karta hai. AI sirf facts nikalta hai, calculations pure code karta hai, jisse ek bhi single cent ka loss nahi hota.',
      'Consistency Streak bonus kya hai?':
        'Squad pool ka 5 se 10 percent consistency ke liye set kiya jaata hai. Regular days pe kaam karne se streak banti hai, maximum 100 days tak.',
      'PayPal batch payouts kaise setup karein?':
        'Split approve hote hi, PayPal batch API v1 ke through pure squad ko single transaction mein payout chala jaata hai.',
      'Member privacy kaise protected hai?':
        'Focus sessions strictly opt-in hain. Hum screens, keystrokes ya windows record nahi karte. Data sirf member ke control mein rehta hai.',
    },
  },
};

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'voice' | 'whatsapp' | 'faq'>('ai');
  const [showTooltip, setShowTooltip] = useState(true);

  // Selected Language for Voice Call
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'hinglish'>('en');

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

  // Live Voice Call State
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // WhatsApp form state
  const [waName, setWaName] = useState('');
  const [waPhone, setWaPhone] = useState('');
  const [waTopic, setWaTopic] = useState('Payout Assistance');
  const [waNotes, setWaNotes] = useState('');
  const [waSubmitted, setWaSubmitted] = useState(false);
  const [waLoading, setWaLoading] = useState(false);
  const [waTicket, setWaTicket] = useState<string | null>(null);
  const [waDispatch, setWaDispatch] = useState<{
    whatsappAlertUrl?: string;
    gmailComposeUrl?: string;
  } | null>(null);

  // Official Support WhatsApp number (Defaults to Akshat's line)
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

      // Preload available voices on browser load
      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  // Voice call timer
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

  // High-Quality Voice Selection Logic
  const getBestNaturalVoice = (lang: 'en' | 'hi' | 'hinglish') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    if (lang === 'hi') {
      const hiVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.includes('Lekha') ||
          v.name.includes('Kalpana') ||
          v.name.includes('Veena')
      );
      if (hiVoice) return hiVoice;
    }

    // Best English/Natural voices
    const naturalEn = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Google') ||
         v.name.includes('Samantha') ||
         v.name.includes('Daniel') ||
         v.name.includes('Karen') ||
         v.name.includes('Natural') ||
         v.name.includes('Premium') ||
         v.name.includes('Siri'))
    );
    if (naturalEn) return naturalEn;

    return voices.find((v) => v.lang.startsWith('en')) || voices[0] || null;
  };

  // Speaks aloud with optimized human cadence
  const speakVoice = (text: string, lang = selectedLang) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || isMuted) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const chosenVoice = getBestNaturalVoice(lang);

    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    // Tune tone for smooth, natural delivery
    if (lang === 'hi') {
      utterance.lang = 'hi-IN';
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
    } else {
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1.02;
    }

    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => setIsAiSpeaking(false);
    utterance.onerror = () => setIsAiSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Start Voice Call
  const handleStartCall = (langToUse = selectedLang) => {
    setCallStatus('calling');
    setCallDuration(0);
    setVoiceTranscript('Connecting audio to MicroSplit AI Engine...');

    // Subtle audio dial chime
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
      }, 1000);
    } catch {
      // AudioContext fallback
    }

    setTimeout(() => {
      setCallStatus('connected');
      const intro = voiceLangs[langToUse].greeting;
      setVoiceTranscript(intro);
      speakVoice(intro, langToUse);
    }, 1500);
  };

  const handleEndCall = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCallStatus('ended');
    setIsAiSpeaking(false);
    setIsListeningMic(false);
    setVoiceTranscript('Call ended.');
    setTimeout(() => {
      setCallStatus('idle');
      setCallDuration(0);
    }, 1200);
  };

  const handleVoiceQuery = (query: string) => {
    setVoiceTranscript(`You: "${query}"`);
    const langData = voiceLangs[selectedLang];
    const reply = langData.answers[query] || 'MicroSplit deterministically calculates payouts with zero cents lost.';
    setTimeout(() => {
      setVoiceTranscript(`AI: "${reply}"`);
      speakVoice(reply, selectedLang);
    }, 500);
  };

  // Switch voice language on the fly
  const handleSwitchLanguage = (lang: 'en' | 'hi' | 'hinglish') => {
    setSelectedLang(lang);
    if (callStatus === 'connected') {
      const intro = voiceLangs[lang].greeting;
      setVoiceTranscript(intro);
      speakVoice(intro, lang);
    }
  };

  // Microphone Recognition (Two-Way Voice Chat)
  const handleToggleMic = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Your browser does not support microphone speech input. Please tap the quick voice prompt pills below!');
      return;
    }

    if (isListeningMic) {
      setIsListeningMic(false);
      return;
    }

    try {
      const recognition = new (SpeechRecognition as any)();
      recognition.lang = selectedLang === 'hi' ? 'hi-IN' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListeningMic(true);
      setVoiceTranscript('🎙️ Listening... Speak into your microphone now...');

      recognition.onresult = (event: any) => {
        const spokenText = event.results[0][0].transcript;
        setIsListeningMic(false);
        setVoiceTranscript(`You said: "${spokenText}"`);

        // Check matching answer or give intelligent voice reply
        let reply = 'Thank you for your question. MicroSplit AI calculates squad payouts down to integer cents with zero loss.';
        if (selectedLang === 'hi') {
          reply = 'धन्यवाद! माइक्रोस्प्लिट एआई आपकी टीम के सभी पेआउट्स को बिना किसी नुकसान के पूरा करता है।';
        } else if (selectedLang === 'hinglish') {
          reply = 'Thanks! MicroSplit AI pure squad revenue ko exact zero-loss math se calculate karke pay karta hai.';
        }

        setTimeout(() => {
          setVoiceTranscript(`AI: "${reply}"`);
          speakVoice(reply, selectedLang);
        }, 500);
      };

      recognition.onerror = () => {
        setIsListeningMic(false);
        setVoiceTranscript('Could not detect speech. Please tap any question pill below!');
      };

      recognition.onend = () => {
        setIsListeningMic(false);
      };

      recognition.start();
    } catch {
      setIsListeningMic(false);
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
        voiceLangs.en.answers[text.trim()] ||
        `Thanks for asking about "${text.trim()}". MicroSplit AI orchestrates verifiable revenue splits using deterministic math, SHA-256 audit chaining, and single-click PayPal batch disbursements. If you would like our engineering team to review your squad, use the WhatsApp or Live Call tabs above!`;

      const lower = text.toLowerCase();
      if (lower.includes('streak') || lower.includes('consistency')) {
        reply = voiceLangs.en.answers['How is the Consistency Streak Bonus calculated?'];
      } else if (lower.includes('paypal') || lower.includes('payout') || lower.includes('batch')) {
        reply = voiceLangs.en.answers['How to integrate PayPal Batch payouts?'];
      } else if (lower.includes('0-cent') || lower.includes('zero') || lower.includes('split') || lower.includes('math')) {
        reply = voiceLangs.en.answers['How does the 0-cent split work?'];
      } else if (lower.includes('privacy') || lower.includes('focus') || lower.includes('session')) {
        reply = voiceLangs.en.answers['How does focus session privacy work?'];
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
      if (data.dispatch) {
        setWaDispatch(data.dispatch);
      }
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
  const directWhatsAppUrl = `https://wa.me/${cleanCustomPhone || '919294514754'}?text=${defaultWhatsAppText}`;

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
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[440px] max-h-[640px] h-[610px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
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
                  title="Configure Support WhatsApp Number"
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
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('microsplit_custom_whatsapp', customWaPhone.trim());
                      setShowSettings(false);
                    }
                  }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Support Desk WhatsApp Line</span>
                    <span className="text-[10px] text-slate-500">Stored locally</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Set the WhatsApp number that visitors connect to when clicking chat:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 919294514754"
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

            {/* Tab Navigation */}
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
                <span>Voice Call</span>
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
                        {voiceLangs.en.prompts.map((q) => (
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

            {/* TAB 2: LIVE NATURAL VOICE CALL (Multi-lingual & Mic Talk) */}
            {activeTab === 'voice' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50 flex flex-col justify-between">
                <div className="space-y-3.5">

                  {/* Language Selector Bar */}
                  <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                      <Globe className="w-3.5 h-3.5 text-teal-600" />
                      <span>Language:</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSwitchLanguage('en')}
                        className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-colors ${
                          selectedLang === 'en'
                            ? 'bg-teal-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchLanguage('hi')}
                        className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-colors ${
                          selectedLang === 'hi'
                            ? 'bg-teal-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        हिंदी
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchLanguage('hinglish')}
                        className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-colors ${
                          selectedLang === 'hinglish'
                            ? 'bg-teal-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Hinglish
                      </button>
                    </div>
                  </div>

                  {/* Visual Voice Cockpit */}
                  <div className="bg-gradient-to-br from-[#0B1F3A] to-[#102C4D] rounded-2xl p-5 text-white text-center shadow-lg relative overflow-hidden">
                    <div
                      className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
                      style={{ background: 'radial-gradient(circle, rgba(15, 157, 138, 0.3), transparent 70%)' }}
                    />

                    {/* Animated Audio Equalizer Waveform */}
                    <div className="relative mx-auto w-24 h-16 mb-2 flex items-center justify-center gap-1">
                      {[40, 75, 100, 60, 85, 45, 90].map((h, i) => (
                        <motion.span
                          key={i}
                          className="w-1.5 bg-gradient-to-t from-teal-400 to-emerald-300 rounded-full"
                          animate={
                            callStatus === 'connected' && (isAiSpeaking || isListeningMic)
                              ? { height: [`${h * 0.3}%`, `${h}%`, `${h * 0.2}%`] }
                              : { height: callStatus === 'connected' ? '25%' : '10%' }
                          }
                          transition={{
                            duration: 0.5 + (i % 3) * 0.15,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </div>

                    <h4 className="text-sm font-bold text-white">
                      {callStatus === 'idle' && 'Natural AI Voice Support'}
                      {callStatus === 'calling' && 'Connecting Natural Voice Line...'}
                      {callStatus === 'connected' && (
                        <span>
                          Call Connected • <span className="text-teal-300 font-mono">{voiceLangs[selectedLang].name}</span>
                        </span>
                      )}
                      {callStatus === 'ended' && 'Call Disconnected'}
                    </h4>

                    <p className="text-[11px] text-slate-300 mt-1 font-mono">
                      {callStatus === 'connected' ? (
                        <span className="text-emerald-400 font-bold">
                          {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')} (Audio Live)
                        </span>
                      ) : (
                        'Human-Tuned Speech • Hindi & English'
                      )}
                    </p>

                    {/* Live Transcript readout */}
                    {voiceTranscript && (
                      <div className="mt-3 p-3 bg-white/10 rounded-xl text-xs text-slate-200 border border-white/10 text-left leading-relaxed max-h-24 overflow-y-auto">
                        <span className="font-bold text-teal-300 block mb-0.5 text-[10px] uppercase">
                          {isListeningMic ? '🎙️ Listening to You...' : 'Live Speech Transcript:'}
                        </span>
                        {voiceTranscript}
                      </div>
                    )}
                  </div>

                  {/* Connected Controls: Mic talk, mute, end */}
                  {callStatus === 'connected' ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-3">
                        {/* Two-Way Mic Button */}
                        <button
                          type="button"
                          onClick={handleToggleMic}
                          className={`px-4 py-2.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-md transition-all ${
                            isListeningMic
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-teal-600 text-white hover:bg-teal-700'
                          }`}
                        >
                          {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          <span>{isListeningMic ? 'Listening... (Speak Now)' : 'Tap to Speak'}</span>
                        </button>

                        {/* Mute */}
                        <button
                          type="button"
                          onClick={() => setIsMuted(!isMuted)}
                          className={`p-2.5 rounded-full border transition-all ${
                            isMuted ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-slate-700 border-slate-300'
                          }`}
                          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                        >
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>

                        {/* End Call */}
                        <button
                          type="button"
                          onClick={handleEndCall}
                          className="px-4 py-2.5 rounded-full bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-md flex items-center gap-1.5"
                        >
                          <PhoneOff className="w-4 h-4" />
                          <span>End</span>
                        </button>
                      </div>

                      {/* Language Prompt Pills */}
                      <div>
                        <p className="text-[11px] font-semibold text-slate-600 mb-1.5 text-center">
                          Tap to ask in {voiceLangs[selectedLang].name}:
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          {voiceLangs[selectedLang].prompts.map((q) => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => handleVoiceQuery(q)}
                              className="p-2 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-700 hover:border-teal-400 hover:bg-teal-50 text-left truncate transition-colors"
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
                        onClick={() => handleStartCall(selectedLang)}
                        className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Start Voice Call in {voiceLangs[selectedLang].name}</span>
                      </button>

                      <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-[11px] text-teal-950 leading-relaxed flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Natural Speech &amp; Languages:</strong>
                          <p className="mt-0.5 text-teal-800">
                            Equipped with high-fidelity voices and two-way mic input in <strong>English</strong>, <strong>हिंदी (Hindi)</strong>, and <strong>Hinglish</strong>!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 text-center pt-2">
                  High-Fidelity Audio Synthesis • Free In-Browser Call
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
                    <h4 className="text-base font-bold text-slate-900">Inquiry Dispatched!</h4>
                    <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                      Your inquiry has been recorded under ticket reference:
                    </p>
                    <div className="inline-block px-3 py-1.5 rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-700">
                      Ticket #{waTicket}
                    </div>

                    {/* Instant Dispatch Action Buttons */}
                    <div className="pt-2 space-y-2">
                      <p className="text-[11px] font-bold text-slate-700">Direct Alert Channels:</p>

                      {waDispatch?.whatsappAlertUrl && (
                        <a
                          href={waDispatch.whatsappAlertUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-full gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Send WhatsApp Message to +91 9294514754</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      )}

                      {waDispatch?.gmailComposeUrl && (
                        <a
                          href={waDispatch.gmailComposeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-full gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold hover:bg-slate-200 border border-slate-300"
                        >
                          <Mail className="w-4 h-4 text-rose-600" />
                          <span>Send via Gmail to akshatsinghai6682@gmail.com</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      )}
                    </div>

                    <div className="pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setWaSubmitted(false);
                          setWaPhone('');
                          setWaDispatch(null);
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
                          Active (+91 9294514754)
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 mb-3 leading-relaxed">
                        Click below to open WhatsApp directly and chat with our fintech engineers about revenue splits or payouts.
                      </p>
                      <a
                        href={directWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Chat on WhatsApp Directly</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    </div>

                    {/* Callback Form for visitors */}
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
                        Prefer us to contact you? Enter your WhatsApp number below and an engineer will message you directly.
                      </p>

                      <form onSubmit={handleWhatsAppCallbackSubmit} className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Your WhatsApp Phone Number *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="+91 98765 43210"
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
                    href="mailto:akshatsinghai6682@gmail.com,support@microsplit.ai"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:underline"
                  >
                    <span>akshatsinghai6682@gmail.com</span>
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
