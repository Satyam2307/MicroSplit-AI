'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  X,
  Send,
  CheckCircle2,
  Sparkles,
  Bot,
  ExternalLink,
  ShieldCheck,
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
  FileText,
  Users,
  BookOpen,
  Zap,
  AlertCircle,
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
    greeting: 'Hello! Welcome to MicroSplit AI voice concierge. How can I assist you with squad attribution, evidence vault, streak bonuses, or PayPal payouts today?',
    prompts: [
      'How does the evidence feature work?',
      'How does the 0-cent split work?',
      'How is the Consistency Streak Bonus calculated?',
      'How to inspect the Merkle Ledger?',
      'How to integrate PayPal Batch payouts?',
    ],
    answers: {
      'How does the evidence feature work?':
        'MicroSplit AI has a dedicated Evidence Vault at slash evidence. Upload client receipts, GitHub PRs, or invoices. Multi-modal AI Vision extracts timestamps and amounts with tamper-proof SHA-256 conflict detection.',
      'How does the 0-cent split work?':
        'MicroSplit AI uses deterministic integer-cent math with largest-remainder rounding. AI only extracts facts, while mathematical code executes the payouts. Exactly zero cents are lost or created.',
      'How is the Consistency Streak Bonus calculated?':
        'Squads allocate up to ten percent for consistency. Every verified active day adds to your streak multiplier up to one hundred days, with approved freeze days protecting your streak during time off.',
      'How to inspect the Merkle Ledger?':
        'Every allocation calculation and PayPal batch execution is sealed into an append-only SHA-256 Merkle chain at slash ledger, guaranteeing immutable, dispute-free audits.',
      'How to integrate PayPal Batch payouts?':
        'Once approved by squad approvers, a single PayPal Batch API transaction disburses funds to up to 15,000 squad members globally with instant webhook confirmation.',
    },
  },
  hi: {
    name: 'हिंदी (Hindi)',
    langCode: 'hi-IN',
    greeting: 'नमस्ते! माइक्रोस्प्लिट एआई वॉइस सपोर्ट में आपका स्वागत है। मैं आपकी टीम के रेवेन्यू स्प्लिट, एविडेंस ओसीआर और पेआउट में कैसे सहायता कर सकता हूँ?',
    prompts: [
      'एविडेंस और ओसीआर फीचर कैसे काम करता है?',
      '0-सेंट स्प्लिट कैसे काम करता है?',
      'कंसिस्टेंसी स्ट्रीक बोनस क्या है?',
      'मर्कल लेजर ऑडिट क्या है?',
      'पेपैल बैच पेआउट कैसे होता है?',
    ],
    answers: {
      'एविडेंस और ओसीआर फीचर कैसे काम करता है?':
        'माइक्रोस्प्लिट एआई में स्लैश एविडेंस पर पूरा वॉल्ट है। आप रसीद या इनवॉइस अपलोड कर सकते हैं, एआई ओसीआर तुरंत डेटा निकालता है और शहा-२५६ हैश से सुरक्षित करता है।',
      '0-सेंट स्प्लिट कैसे काम करता है?':
        'माइक्रोस्प्लिट एआई डिफ़ॉल्ट रूप से डिटर्मिनिस्टिक मैथ का उपयोग करता है। सभी पैसों का हिसाब पैसे के पूर्णांक में होता है, जिससे एक भी पैसे का नुकसान या अंतर नहीं आता।',
      'कंसिस्टेंसी स्ट्रीक बोनस क्या है?':
        'आपकी टीम 10 प्रतिशत तक का कंसिस्टेंसी पूल बना सकती है। हर दिन लगातार काम करने से स्ट्रीक बोनस बढ़ता है, और बीमारी या छुट्टी के लिए फ्रीज डेज भी मिलते हैं।',
      'मर्कल लेजर ऑडिट क्या है?':
        'स्लैश लेजर पर हर पेआउट और नियम क्रिप्टोग्राफिक ब्लॉकचेन की तरह शहा-२५६ हैश में लॉक होते हैं, जिससे कोई भी रिकॉर्ड बदला नहीं जा सकता।',
      'पेपैल बैच पेआउट कैसे होता है?':
        'स्प्लिट अप्रूव होने के बाद, सिर्फ एक क्लिक में पेपैल बैच एपीआई द्वारा पूरी टीम के बैंक या पेपैल में तुरंत पैसे ट्रांसफर हो जाते हैं।',
    },
  },
  hinglish: {
    name: 'Hinglish',
    langCode: 'en-IN',
    greeting: 'Hello! MicroSplit AI voice assistant mein aapka swagat hai. Squad revenue split, evidence OCR aur PayPal payouts ke baare mein aapko kya jaankari chahiye?',
    prompts: [
      'Evidence feature kaise kaam karta hai?',
      '0-cent split kaise kaam karta hai?',
      'Consistency Streak bonus kya hai?',
      'Merkle Ledger audit kaise check karein?',
      'PayPal batch payouts kaise setup karein?',
    ],
    answers: {
      'Evidence feature kaise kaam karta hai?':
        'Aap slash evidence par jaakar receipts ya invoices upload kar sakte hain. AI OCR automatically timestamps aur amounts extract karta hai with SHA-256 security.',
      '0-cent split kaise kaam karta hai?':
        'MicroSplit AI deterministic integer math use karta hai. AI sirf facts nikalta hai, calculations pure code karta hai, jisse ek bhi single cent ka loss nahi hota.',
      'Consistency Streak bonus kya hai?':
        'Squad pool ka 5 se 10 percent consistency ke liye set kiya jaata hai. Regular days pe kaam karne se streak banti hai, maximum 100 days tak.',
      'Merkle Ledger audit kaise check karein?':
        'Slash ledger par har split aur PayPal payout SHA-256 blocks mein seal hota hai, taaki past records tamper na ho sakein.',
      'PayPal batch payouts kaise setup karein?':
        'Split approve hote hi, PayPal batch API v1 ke through pure squad ko single transaction mein payout chala jaata hai.',
    },
  },
};

interface AiResponseResult {
  reply: string;
  link?: { label: string; href: string };
  suggestions: string[];
}

// Comprehensive intent and semantic query matching engine
function resolveAiResponse(userInput: string): AiResponseResult {
  const query = userInput.toLowerCase().trim();

  // 1. Evidence Feature & Proofs & OCR
  if (
    query.includes('evidence') ||
    query.includes('proof') ||
    query.includes('upload') ||
    query.includes('receipt') ||
    query.includes('screenshot') ||
    query.includes('ocr') ||
    query.includes('invoice') ||
    query.includes('deliverable') ||
    query.includes('document') ||
    query.includes('conflict')
  ) {
    return {
      reply:
        "MicroSplit AI features a dedicated **Evidence Vault** accessible at **`/evidence`** (or by clicking 'Evidence' in the top navbar).\n\n" +
        "**How to see and use the Evidence feature:**\n" +
        "1. 📄 **Upload Work Proof:** Drag and drop client receipts, GitHub commits, design milestones, or invoice PDFs.\n" +
        "2. 👁️ **AI Vision OCR:** Multi-modal AI reads text automatically to extract timestamps, deliverables, and dollar values.\n" +
        "3. 🔒 **SHA-256 Cryptographic Hash:** Every submission receives an immutable cryptographic hash so it cannot be altered.\n" +
        "4. ⚠️ **Automated Conflict Adjudication:** Flags overlapping hours or duplicate invoices before payouts are approved.\n\n" +
        "Click the button below to navigate to the Evidence Vault right now!",
      link: { label: 'Open Evidence Vault (/evidence) →', href: '/evidence' },
      suggestions: [
        'How does 0-cent split work?',
        'How to inspect Merkle Ledger?',
        'Send WhatsApp Inquiry to +91 9294514754',
      ],
    };
  }

  // 2. Squads & Creation & Roles
  if (
    query.includes('squad') ||
    query.includes('team') ||
    query.includes('create squad') ||
    query.includes('add member') ||
    query.includes('join') ||
    query.includes('role') ||
    query.includes('approver') ||
    query.includes('contributor')
  ) {
    return {
      reply:
        "Squad creation and team governance are hosted at **`/squads`** (or create a new squad at **`/squads/new`**).\n\n" +
        "**Squad Capabilities:**\n" +
        "• **Define Revenue Pools:** Set pool amounts in USD with deterministic integer-cent allocation.\n" +
        "• **Role-Based Governance:** Assign Owner, Approver, and Contributor roles with customizable voting thresholds.\n" +
        "• **Split Models:** Allocate based on logged hours, completed milestones, or equal shares with Streak multipliers.\n" +
        "• **Batch Disbursal:** Connect PayPal handles for 1-click team payouts.",
      link: { label: 'Explore Squads (/squads) →', href: '/squads' },
      suggestions: [
        'How can we see the evidence feature?',
        'What is Merkle Ledger?',
        'How does 0-cent math work?',
      ],
    };
  }

  // 3. Merkle Ledger & Cryptographic Auditing
  if (
    query.includes('ledger') ||
    query.includes('merkle') ||
    query.includes('audit') ||
    query.includes('sha-256') ||
    query.includes('sha256') ||
    query.includes('immutable') ||
    query.includes('block') ||
    query.includes('tamper') ||
    query.includes('chain')
  ) {
    return {
      reply:
        "The **Merkle Ledger** is viewable at **`/ledger`**.\n\n" +
        "• **Cryptographic Block Chaining:** Every split calculation, evidence approval, and PayPal payout is chained using SHA-256 hashes.\n" +
        "• **Tamper-Proof Integrity:** Any alteration to past records breaks the cryptographic hash, instantly flagging an alert.\n" +
        "• **Dispute-Free Settlements:** Approvers and contributors can verify the Merkle root before and after PayPal disbursement.",
      link: { label: 'Inspect Merkle Ledger (/ledger) →', href: '/ledger' },
      suggestions: [
        'How does 0-cent split work?',
        'How can we see the evidence feature?',
        'View Statements (/statements)',
      ],
    };
  }

  // 4. Statements & History
  if (
    query.includes('statement') ||
    query.includes('history') ||
    query.includes('earning') ||
    query.includes('my payout') ||
    query.includes('tax') ||
    query.includes('breakdown')
  ) {
    return {
      reply:
        "Individual earnings and historical settlement statements are located at **`/statements`**.\n\n" +
        "• **Itemized Breakdown:** Detailed view of base revenue share, consistency streak bonus credits, and verified task hours.\n" +
        "• **Audit-Ready Exports:** Export PDF/CSV settlement statements with corresponding PayPal Batch transaction IDs.\n" +
        "• **Cryptographic Verification:** Each statement links directly to its block hash in the Merkle Ledger.",
      link: { label: 'View Statements (/statements) →', href: '/statements' },
      suggestions: [
        'How does consistency streak work?',
        'How does 0-cent split work?',
        'Inspect Merkle Ledger',
      ],
    };
  }

  // 5. 0-Cent Math Guarantee
  if (
    query.includes('0-cent') ||
    query.includes('zero cent') ||
    query.includes('cent') ||
    query.includes('math') ||
    query.includes('algorithm') ||
    query.includes('rounding') ||
    query.includes('remainder') ||
    query.includes('hare-niemeyer')
  ) {
    return {
      reply:
        "MicroSplit AI enforces a strict **Zero-Cent Loss Guarantee**:\n\n" +
        "• **Pure Integer-Cent Arithmetic:** We calculate money strictly in integer cents (e.g., $100.00 = 10,000 cents), eliminating floating-point rounding bugs.\n" +
        "• **Largest-Remainder Algorithm (Hare-Niemeyer):** Fractional cents are distributed deterministically to members with the largest remainders.\n" +
        "• **AI Role:** AI only extracts structured facts from evidence; pure deterministic TypeScript code executes the payouts.\n\n" +
        "`Sum(Member Payouts) === Total Pool` holds true 100% of the time down to the exact cent.",
      link: { label: 'Try 0-Cent Slider on Home Page →', href: '/#showcase' },
      suggestions: [
        'How is Consistency Streak calculated?',
        'How to integrate PayPal Batch payouts?',
        'How can we see the evidence feature?',
      ],
    };
  }

  // 6. Consistency Streak & Freeze Days
  if (
    query.includes('streak') ||
    query.includes('consistency') ||
    query.includes('freeze') ||
    query.includes('daily') ||
    query.includes('bonus') ||
    query.includes('100 day') ||
    query.includes('vacation')
  ) {
    return {
      reply:
        "The **Consistency Streak Bonus** rewards daily contribution discipline:\n\n" +
        "• **Dedicated Pool:** Squads allocate 5% to 10% of their total revenue pool specifically for consistency.\n" +
        "• **Progressive Multiplier:** Consecutive verified active days build a streak multiplier up to 100 days.\n" +
        "• **Freeze Day Protection:** Contributors receive approved freeze tokens (e.g. for sickness, travel, or exams) so planned breaks never reset your streak.",
      link: { label: 'Explore Squads (/squads) →', href: '/squads' },
      suggestions: [
        'How does 0-cent split work?',
        'How can we see the evidence feature?',
        'What is Merkle Ledger?',
      ],
    };
  }

  // 7. PayPal Batch Payouts & Disbursal
  if (
    query.includes('paypal') ||
    query.includes('batch') ||
    query.includes('payout') ||
    query.includes('disburse') ||
    query.includes('mass pay') ||
    query.includes('run') ||
    query.includes('execute')
  ) {
    return {
      reply:
        "MicroSplit AI integrates directly with **PayPal Payouts API v1**:\n\n" +
        "• **Single-Transaction Disbursal:** Pay up to 15,000 squad members across 180+ countries in one batch transaction.\n" +
        "• **Low Processing Overhead:** Avoid high individual wire and transfer fees.\n" +
        "• **Instant Webhooks:** PayPal webhooks instantly confirm delivery and trigger automatic cryptographic block sealing in `/ledger`.",
      link: { label: 'View Payout Runs (/runs) →', href: '/runs' },
      suggestions: [
        'How does 0-cent split work?',
        'What is Merkle Ledger?',
        'Send WhatsApp Inquiry to +91 9294514754',
      ],
    };
  }

  // 8. Privacy & Focus Sessions
  if (
    query.includes('privacy') ||
    query.includes('focus') ||
    query.includes('track') ||
    query.includes('spy') ||
    query.includes('screen') ||
    query.includes('keystroke') ||
    query.includes('camera')
  ) {
    return {
      reply:
        "Privacy is built into MicroSplit AI's architecture:\n\n" +
        "• **100% Opt-In:** Focus sessions only track self-reported task intervals.\n" +
        "• **Zero Invasive Surveillance:** We NEVER record screens, capture webcam footage, or log keystrokes.\n" +
        "• **Self-Custody of Data:** You can view, export, or permanently delete your focus logs at any time.",
      link: { label: 'View Focus Sessions (/evidence) →', href: '/evidence' },
      suggestions: [
        'How can we see the evidence feature?',
        'How does consistency streak work?',
        'What is Merkle Ledger?',
      ],
    };
  }

  // 9. Pricing & Plans
  if (
    query.includes('price') ||
    query.includes('pricing') ||
    query.includes('cost') ||
    query.includes('free') ||
    query.includes('charge') ||
    query.includes('subscription')
  ) {
    return {
      reply:
        "MicroSplit AI is currently **100% free to use** during our public beta for open-source squads and freelance collectives!\n\n" +
        "There are zero platform subscriptions. When executing batch payouts, you only pay PayPal's standard transaction fee.",
      link: { label: 'Create Free Squad (/squads/new) →', href: '/squads/new' },
      suggestions: [
        'How does 0-cent split work?',
        'How to integrate PayPal Batch payouts?',
        'Send WhatsApp Inquiry to +91 9294514754',
      ],
    };
  }

  // 10. Contact, WhatsApp, Call, Human Support
  if (
    query.includes('contact') ||
    query.includes('support') ||
    query.includes('whatsapp') ||
    query.includes('call') ||
    query.includes('phone') ||
    query.includes('number') ||
    query.includes('email') ||
    query.includes('gmail') ||
    query.includes('help') ||
    query.includes('human') ||
    query.includes('founder')
  ) {
    return {
      reply:
        "You can connect directly with our founder & engineering desk:\n\n" +
        "📱 **WhatsApp Support:** +91 9294514754 (or switch to the **WhatsApp** tab right above to send your inquiry directly!)\n" +
        "📞 **Live Voice Call:** Switch to the **Voice Call** tab for free instant AI voice assistance in English, Hindi, or Hinglish!\n" +
        "📧 **Email:** akshatsinghai6682@gmail.com\n\n" +
        "We typically reply within 5 to 15 minutes.",
      suggestions: [
        'Switch to WhatsApp Tab',
        'Start Voice Call',
        'How can we see the evidence feature?',
      ],
    };
  }

  // 11. Hindi / Hinglish queries
  if (
    query.includes('kaise') ||
    query.includes('kya') ||
    query.includes('batao') ||
    query.includes('paisa') ||
    query.includes('madad') ||
    query.includes('suno') ||
    query.includes('namaste') ||
    query.includes('karein') ||
    query.includes('karna')
  ) {
    return {
      reply:
        "नमस्ते! MicroSplit AI में आपका स्वागत है:\n\n" +
        "• **Evidence Feature कैसे देखें:** ऊपर नेवबार में **Evidence** (`/evidence`) लिंक पर क्लिक करें। वहां आप अपने बिल्स और वर्क प्रूफ का AI OCR स्कैन देख सकते हैं।\n" +
        "• **Squads:** `/squads` पर जाकर अपनी टीम का रेवेन्यू पूल बना सकते हैं।\n" +
        "• **Merkle Ledger:** `/ledger` पर बिना किसी गड़बड़ी के SHA-256 लेजर देख सकते हैं।\n" +
        "• **WhatsApp Inquiry:** अगर आप हमसे सीधे बात करना चाहते हैं, तो ऊपर **WhatsApp** टैब पर क्लिक करके +91 9294514754 पर सीधा मैसेज भेज सकते हैं!\n\n" +
        "आपको किस फीचर के बारे में विस्तार से जानना है?",
      link: { label: 'Open Evidence Vault (/evidence) →', href: '/evidence' },
      suggestions: [
        '0-सेंट स्प्लिट कैसे काम करता है?',
        'कंसिस्टेंसी स्ट्रीक बोनस क्या है?',
        'पेपैल बैच पेआउट कैसे होता है?',
      ],
    };
  }

  // 12. Greetings
  if (
    query === 'hi' ||
    query === 'hello' ||
    query === 'hey' ||
    query === 'sup' ||
    query === 'good morning' ||
    query === 'good afternoon' ||
    query === 'good evening' ||
    query === 'hola'
  ) {
    return {
      reply:
        "👋 Hello! Welcome to MicroSplit AI. I am your concierge for squad revenue splits, verifiable evidence, and instant PayPal payouts.\n\n" +
        "Here are some popular topics you can ask me about:\n" +
        "• 📄 **Evidence Vault & OCR Extraction** (`/evidence`)\n" +
        "• 👥 **Squad Creation & Roles** (`/squads`)\n" +
        "• 🔐 **SHA-256 Merkle Ledger** (`/ledger`)\n" +
        "• ⚡ **0-Cent Loss Guarantee & Math**\n" +
        "• 🔥 **Consistency Streak Bonuses**\n\n" +
        "What can I help you with today?",
      suggestions: [
        'How can we see the evidence feature?',
        'How does 0-cent split work?',
        'What is Merkle Ledger?',
      ],
    };
  }

  // 13. Dynamic Contextual Fallback (Never repeats identically!)
  let hashVal = 0;
  for (let i = 0; i < query.length; i++) {
    hashVal = (hashVal << 5) - hashVal + query.charCodeAt(i);
  }
  const intros = [
    `Regarding "${userInput.trim()}": MicroSplit AI is architected to make squad revenue attribution mathematically precise and verifiable.`,
    `Great question about "${userInput.trim()}". In MicroSplit AI, all attribution is backed by cryptographic evidence and deterministic rules.`,
    `Here is how that fits into MicroSplit AI ("${userInput.trim()}"):`,
  ];
  const chosenIntro = intros[Math.abs(hashVal) % intros.length];

  return {
    reply:
      `${chosenIntro}\n\n` +
      `Our platform is built on three core pillars:\n` +
      `1. **Evidence Vault (/evidence):** Upload receipts, PRs, and invoices scanned with AI OCR.\n` +
      `2. **Deterministic Attribution:** Pure integer-cent math ensures zero cents lost across squad splits.\n` +
      `3. **Cryptographic Merkle Ledger (/ledger):** Immutable SHA-256 audit logs before executing PayPal Batch payouts.\n\n` +
      `Would you like to explore the Evidence feature, review Squad settings, or send an inquiry directly to our team?`,
    suggestions: [
      'How can we see the evidence feature?',
      'How to create a squad?',
      'Send WhatsApp Inquiry to +91 9294514754',
    ],
  };
}

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'voice' | 'whatsapp' | 'faq'>('ai');
  const [showTooltip, setShowTooltip] = useState(true);

  // Selected Language for Voice Call
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'hinglish'>('en');

  // Chat state
  const [chatMessages, setChatMessages] = useState<
    Array<{
      sender: 'ai' | 'user';
      text: string;
      time: string;
      link?: { label: string; href: string };
      suggestions?: string[];
    }>
  >([
    {
      sender: 'ai',
      text: '👋 Hi there! I am the MicroSplit AI Concierge. How can I help you with squad revenue attribution, the Evidence Vault, streak bonuses, or PayPal payouts today?',
      time: 'Just now',
      suggestions: [
        'How can we see the evidence feature?',
        'How does the 0-cent split work?',
        'How to inspect the Merkle Ledger?',
      ],
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

  // WhatsApp form state (Direct Inquiry to Owner)
  const [waName, setWaName] = useState('');
  const [waPhone, setWaPhone] = useState('');
  const [waEmail, setWaEmail] = useState('');
  const [waTopic, setWaTopic] = useState('Evidence Feature Inquiry');
  const [waNotes, setWaNotes] = useState('');
  const [waSubmitted, setWaSubmitted] = useState(false);
  const [waLoading, setWaLoading] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);
  const [waTicket, setWaTicket] = useState<string | null>(null);
  const [waDispatch, setWaDispatch] = useState<{
    whatsappAlertUrl?: string;
    gmailComposeUrl?: string;
  } | null>(null);

  // Official Support WhatsApp number (Always routes to Akshat's line)
  const supportPhone = '919294514754';
  const supportEmail = 'akshatsinghai6682@gmail.com';
  const [customWaPhone, setCustomWaPhone] = useState<string>('919294514754');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('microsplit_custom_whatsapp');
      if (stored && stored.replace(/[^0-9]/g, '').length >= 8) {
        setCustomWaPhone(stored);
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

    try {
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
    const reply = langData.answers[query] || resolveAiResponse(query).reply;
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
      alert('Your browser does not support speech recognition. Please tap any prompt pill below!');
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

        const aiRes = resolveAiResponse(spokenText);
        let spokenReply = aiRes.reply.replace(/[*#`_]/g, '');

        if (selectedLang === 'hi') {
          spokenReply =
            'माइक्रोस्प्लिट एआई में आपका स्वागत है। आप ऊपर स्लैश एविडेंस पर जाकर एविडेंस देख सकते हैं, और स्लैश लेजर पर बिना किसी नुकसान के पेआउट चेक कर सकते हैं।';
        }

        setTimeout(() => {
          setVoiceTranscript(`AI: "${spokenReply}"`);
          speakVoice(spokenReply, selectedLang);
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

  // Send AI Chat Message with intent resolution and suggestions
  const handleSendChatMessage = (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    // Check if the suggestion is to jump to WhatsApp
    if (text.toLowerCase().includes('whatsapp') && text.toLowerCase().includes('inquiry')) {
      setActiveTab('whatsapp');
      setChatInput('');
      return;
    }

    const userMsg = {
      sender: 'user' as const,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      const res = resolveAiResponse(text.trim());
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.reply,
          link: res.link,
          suggestions: res.suggestions,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 550);
  };

  // Send Inquiry directly to owner's WhatsApp (+91 9294514754)
  const handleSendWhatsAppInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waPhone.trim()) {
      setWaError('Please enter your WhatsApp or mobile number.');
      return;
    }
    if (!waNotes.trim()) {
      setWaError('Please enter your inquiry or message.');
      return;
    }

    setWaError(null);
    setWaLoading(true);

    const targetRecipient = customWaPhone.replace(/[^0-9]/g, '') || supportPhone;
    const visitorName = waName.trim() || 'Visitor';
    const cleanVisitorPhone = waPhone.trim();
    const visitorEmail = waEmail.trim() || `${cleanVisitorPhone.replace(/[^0-9]/g, '')}@inquiry.microsplit.ai`;

    // Formatted WhatsApp message for direct dispatch to owner (+91 9294514754)
    const waText =
      `🔔 *New Inquiry for MicroSplit AI:*\n\n` +
      `👤 *Name:* ${visitorName}\n` +
      `📱 *Visitor Phone:* ${cleanVisitorPhone}\n` +
      `📧 *Email:* ${waEmail.trim() || 'Not provided'}\n` +
      `🏷️ *Topic:* ${waTopic}\n\n` +
      `💬 *Inquiry Message:*\n"${waNotes.trim()}"\n\n` +
      `---\n*Sent via MicroSplit AI Support Desk*`;

    const directWhatsAppUrl = `https://wa.me/${targetRecipient}?text=${encodeURIComponent(waText)}`;

    // Immediately launch WhatsApp targeting +91 9294514754
    if (typeof window !== 'undefined') {
      window.open(directWhatsAppUrl, '_blank');
    }

    // Simultaneously register ticket via backend API
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: visitorName,
          email: visitorEmail,
          whatsapp: cleanVisitorPhone,
          topic: `Inquiry: ${waTopic}`,
          message: waNotes.trim(),
        }),
      });

      const data = await res.json();
      const generatedTicket = data.ticketId || `MS-${Date.now().toString(36).toUpperCase()}`;
      setWaTicket(generatedTicket);
      setWaDispatch({
        whatsappAlertUrl: directWhatsAppUrl,
        gmailComposeUrl:
          data.dispatch?.gmailComposeUrl ||
          `https://mail.google.com/mail/?view=cm&fs=1&to=${supportEmail}&su=${encodeURIComponent(
            `[MicroSplit Ticket ${generatedTicket}] ${waTopic} from ${visitorName}`
          )}&body=${encodeURIComponent(waText)}`,
      });
    } catch {
      const fallbackTicket = `MS-${Date.now().toString(36).toUpperCase()}`;
      setWaTicket(fallbackTicket);
      setWaDispatch({
        whatsappAlertUrl: directWhatsAppUrl,
        gmailComposeUrl: `https://mail.google.com/mail/?view=cm&fs=1&to=${supportEmail}&su=${encodeURIComponent(
          `[MicroSplit Ticket ${fallbackTicket}] ${waTopic} from ${visitorName}`
        )}&body=${encodeURIComponent(waText)}`,
      });
    } finally {
      setWaLoading(false);
      setWaSubmitted(true);
    }
  };

  // Direct fast WhatsApp link
  const defaultWhatsAppText = encodeURIComponent(
    'Hi MicroSplit AI Team, I have an inquiry about squad revenue attribution & PayPal payouts.'
  );
  const fastWhatsAppUrl = `https://wa.me/${supportPhone}?text=${defaultWhatsAppText}`;

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
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[460px] max-h-[660px] h-[630px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
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
                    Set the WhatsApp number that receives visitor inquiries:
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
                        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                          msg.sender === 'user'
                            ? 'bg-[#0B1F3A] text-white rounded-br-none shadow-sm'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-sm'
                        }`}
                      >
                        {msg.text}

                        {/* Clickable Feature Deep-Link */}
                        {msg.link && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100">
                            <a
                              href={msg.link.href}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-[11px] font-bold hover:bg-teal-700 transition-colors shadow-sm"
                            >
                              <span>{msg.link.label}</span>
                              <ArrowRight className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Interactive suggestion pills */}
                      {msg.sender === 'ai' && msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%]">
                          {msg.suggestions.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => handleSendChatMessage(sug)}
                              className="px-2.5 py-1 rounded-full bg-white border border-teal-200 text-[10px] font-semibold text-teal-700 hover:bg-teal-50 hover:border-teal-400 transition-colors shadow-2xs text-left"
                            >
                              💡 {sug}
                            </button>
                          ))}
                        </div>
                      )}

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
                      placeholder="Ask: 'how can we see evidence', 'squads', '0-cent math'..."
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
                        'High-Fidelity Human Speech • Hindi & English'
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

            {/* TAB 3: WhatsApp Desk — Send Inquiry Feature */}
            {activeTab === 'whatsapp' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50">
                {waSubmitted ? (
                  <div className="py-6 text-center space-y-3 bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm animate-in fade-in zoom-in-95">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900">Inquiry Dispatched!</h4>
                    <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                      Your inquiry has been directed to our official WhatsApp line: <strong className="text-slate-900">+91 9294514754</strong>
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
                          className="inline-flex items-center justify-center w-full gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Open WhatsApp Chat (+91 9294514754)</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      )}

                      {waDispatch?.gmailComposeUrl && (
                        <a
                          href={waDispatch.gmailComposeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-full gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold hover:bg-slate-200 border border-slate-300 transition-colors"
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
                          setWaNotes('');
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
                    {/* Fast Direct WhatsApp Link Card */}
                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-emerald-950">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                          <h4 className="text-xs font-bold text-emerald-900">Official Support WhatsApp Desk</h4>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active (+91 9294514754)
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 mb-2.5 leading-relaxed">
                        Need immediate assistance? Click below to chat directly with our engineering team on WhatsApp.
                      </p>
                      <a
                        href={fastWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Chat Directly on WhatsApp (+91 9294514754)</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    </div>

                    {/* Send Inquiry Form Card */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4 text-teal-600" />
                          <h4 className="text-xs font-bold text-slate-900">Send Inquiry to Support</h4>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          To +91 9294514754
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                        Type your question below. Clicking <strong>Send Inquiry</strong> will immediately format and open WhatsApp to deliver your message to our official line:
                      </p>

                      {waError && (
                        <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{waError}</span>
                        </div>
                      )}

                      <form onSubmit={handleSendWhatsAppInquiry} className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Your Name
                            </label>
                            <input
                              type="text"
                              placeholder="Alex"
                              value={waName}
                              onChange={(e) => setWaName(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Your Phone / WhatsApp *
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
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Your Email (Optional)
                            </label>
                            <input
                              type="email"
                              placeholder="you@gmail.com"
                              value={waEmail}
                              onChange={(e) => setWaEmail(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Topic
                            </label>
                            <select
                              value={waTopic}
                              onChange={(e) => setWaTopic(e.target.value)}
                              className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-teal-500 bg-white"
                            >
                              <option>Evidence Feature Inquiry</option>
                              <option>Payout Assistance & 0-Cent Math</option>
                              <option>Streak Bonus Setup</option>
                              <option>PayPal Batch Config</option>
                              <option>Squad Onboarding</option>
                              <option>General Question</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Your Inquiry / Message *
                          </label>
                          <textarea
                            rows={3}
                            required
                            placeholder="Type your inquiry here (e.g. How can we test the evidence feature with our squad?)..."
                            value={waNotes}
                            onChange={(e) => setWaNotes(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 resize-none"
                          />
                        </div>

                        {/* Primary Send Inquiry Button */}
                        <button
                          type="submit"
                          disabled={waLoading || !waPhone.trim() || !waNotes.trim()}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>
                            {waLoading ? 'Dispatching...' : 'Send Inquiry on WhatsApp (To +91 9294514754)'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        {/* Secondary Gmail Button */}
                        <a
                          href={`https://mail.google.com/mail/?view=cm&fs=1&to=${supportEmail}&su=${encodeURIComponent(
                            `[MicroSplit Inquiry] ${waTopic} from ${waName || 'Visitor'}`
                          )}&body=${encodeURIComponent(
                            `Name: ${waName || 'Visitor'}\nPhone: ${waPhone}\nTopic: ${waTopic}\n\nInquiry:\n${waNotes}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Mail className="w-3.5 h-3.5 text-rose-600" />
                          <span>Or Send via Gmail to akshatsinghai6682@gmail.com</span>
                          <ExternalLink className="w-3 h-3 ml-0.5 text-slate-400" />
                        </a>
                      </form>

                      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                        <span>Private & encrypted. Messages are routed directly to our verified support desk.</span>
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
                      <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-teal-600" />
                        <span>Evidence Vault & AI OCR (/evidence)</span>
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Upload invoices, receipts, and PRs. Multi-modal AI Vision extracts timestamps and amounts with tamper-proof SHA-256 conflict detection.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-teal-600" />
                        <span>Deterministic Integer-Cent Math</span>
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Total pool cents are mathematically preserved. AI extracts fact records; pure deterministic code executes zero-loss splits.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                        <span>SHA-256 Merkle Ledger (/ledger)</span>
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Every allocation and batch execution is cryptographically hashed in an append-only verifiable chain.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-teal-50 rounded-2xl p-4 border border-teal-200">
                  <h4 className="text-xs font-bold text-teal-900 mb-1">Direct Support Lines</h4>
                  <p className="text-[11px] text-teal-800 mb-2">
                    Connect directly with our engineering team:
                  </p>
                  <div className="space-y-1 text-xs font-bold">
                    <p className="text-teal-900">
                      📱 WhatsApp: <span className="text-teal-700">+91 9294514754</span>
                    </p>
                    <p className="text-teal-900">
                      📧 Email: <span className="text-teal-700">akshatsinghai6682@gmail.com</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer trust bar */}
            <div className="p-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 px-4 flex-shrink-0">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-teal-600" />
                Response time: &lt; 15 mins
              </span>
              <span>MicroSplit AI v2.0 • Online</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
