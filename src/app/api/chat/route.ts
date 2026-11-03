import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const KNOWLEDGE_RESPONSES: Record<string, { en: string; hi: string; hinglish: string }> = {
  split: {
    en: "MicroSplit AI uses deterministic 0-cent split math. You define percentage rules (e.g. 60/40 or milestone tiers), and our split engine guarantees exact penny distribution without floating-point errors. Any fractional cents are allocated deterministically to maintain a 100% balanced ledger.",
    hi: "माइक्रोस्प्लिट एआई 0-सेंट गणित का उपयोग करता है। आप स्क्वॉड के सदस्यों के लिए प्रतिशत नियम तय करते हैं (जैसे 60/40), और हमारा इंजन बिना किसी पैसे के नुकसान के सटीक भुगतान सुनिश्चित करता है।",
    hinglish: "MicroSplit AI ka deterministic 0-cent split engine ensure karta hai ki revenue 100% accurately divide ho. Fractional cents ka koi rounding error nahi hota aur squad members ko unka exact share milta hai bina kisi dispute ke."
  },
  paypal: {
    en: "PayPal Batch Payouts allow squads to disburse funds to up to 500 members in a single click using the PayPal Payouts API. Each disbursement is verified against the ledger hash and updates real-time transaction receipts.",
    hi: "पेपैल बैच पेआउट्स की मदद से आप एक क्लिक में 500 टीम मेंबर्स को सीधे उनके पेपैल अकाउंट में फंड भेज सकते हैं। प्रत्येक ट्रांसफर लेज़र हैश द्वारा सत्यापित होता है।",
    hinglish: "PayPal Batch Payouts ke through aap single-click mein poore squad ko direct unke PayPal accounts mein payout de sakte hain. Sabhi transactions ledger se verify hokar instant clear hoti hain."
  },
  proof: {
    en: "Proof-of-Focus links verified work evidence (GitHub commits, recorded session screenshots, milestone markers) to revenue splits. Every evidence item is SHA-256 hashed and stored immutably in the Evidence Vault.",
    hi: "प्रूफ-ऑफ-फोकस आपके काम (गिटहब कमिट्स, सत्र स्क्रीनशॉट्स) को रेवेन्यू स्प्लिट से जोड़ता है। सभी सबूत SHA-256 हैश के साथ एविडेंस वॉल्ट में सुरक्षित रहते हैं।",
    hinglish: "Proof-of-Focus system aapke real work evidence (GitHub commits, focus logs, screenshots) ko verify karta hai. Sabhi items SHA-256 cryptographic hash ke sath Evidence Vault mein lock hote hain."
  },
  streak: {
    en: "Consistency Streaks reward squads for regular milestone delivery. Teams with active streaks unlock freeze grants, lower settlement fees, and priority PayPal batch execution.",
    hi: "कंसिस्टेंसी स्ट्रीक आपकी टीम के लगातार अच्छे काम को ट्रैक करती है। लगातार स्ट्रीक बनाए रखने पर फीस में छूट और प्राथमिकता मिलती है।",
    hinglish: "Consistency Streaks aapki squad ki regular delivery ko track karti hai. Active streak hone par freeze grants aur zero-delay payout perks milte hain."
  },
  ticket: {
    en: "You can generate an instant support ticket right here! Switch to the WhatsApp tab for instant mobile chat or the Email tab to send a direct desk inquiry with ticket tracking.",
    hi: "आप यहीं से तुरंत सपोर्ट टिकट बना सकते हैं! तुरंत मोबाइल चैट के लिए व्हाट्सएप टैब या सीधे डेस्क पूछताछ के लिए ईमेल टैब चुनें।",
    hinglish: "Aap yahan se turant ticket generate kar sakte hain! Quick mobile chat ke liye WhatsApp tab ya verified tracking ke liye Email tab use karein."
  },
  default: {
    en: "I'm your MicroSplit AI Fintech Concierge! I can assist you with squad revenue splits, 0-cent math calculations, Proof-of-Focus evidence verification, PayPal batch payouts, or raising a support ticket on WhatsApp/Email.",
    hi: "मैं आपका माइक्रोस्प्लिट एआई फिंटेक कंसीयज हूँ! मैं स्क्वॉड रेवेन्यू स्प्लिट्स, 0-सेंट मैथ, एविडेंस वॉल्ट, पेपैल पेआउट्स और सपोर्ट टिकट में आपकी पूरी मदद कर सकता हूँ।",
    hinglish: "Main hoon MicroSplit AI Assistant! Main aapko squad revenue splits, 0-cent math calculations, Evidence Vault verification, PayPal batch payouts, aur instant WhatsApp/Email ticket raise karne mein help kar sakta hoon."
  }
};

function generateFallbackResponse(query: string, language: 'en' | 'hi' | 'hinglish'): string {
  const lower = query.toLowerCase();
  let key = 'default';

  if (lower.includes('split') || lower.includes('revenue') || lower.includes('percent') || lower.includes('share') || lower.includes('बंटवारा') || lower.includes('hissa')) {
    key = 'split';
  } else if (lower.includes('paypal') || lower.includes('payout') || lower.includes('transfer') || lower.includes('payment') || lower.includes('पेपैल') || lower.includes('bhugtan')) {
    key = 'paypal';
  } else if (lower.includes('proof') || lower.includes('evidence') || lower.includes('vault') || lower.includes('commit') || lower.includes('सबूत') || lower.includes('saboot')) {
    key = 'proof';
  } else if (lower.includes('streak') || lower.includes('consistency') || lower.includes('freeze') || lower.includes('लगातार')) {
    key = 'streak';
  } else if (lower.includes('whatsapp') || lower.includes('email') || lower.includes('contact') || lower.includes('ticket') || lower.includes('support') || lower.includes('help')) {
    key = 'ticket';
  }

  const category = KNOWLEDGE_RESPONSES[key] || KNOWLEDGE_RESPONSES.default;
  return category[language] || category.en;
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
    const rateLimit = checkRateLimit(`chat_${clientIp}`, {
      intervalMs: 60000,
      maxRequests: 30,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit reached. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const message = sanitizeText(body.message || '');
    const language = (body.language as 'en' | 'hi' | 'hinglish') || 'hinglish';
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    // Check if Claude API key is configured
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey && !anthropicKey.includes('sk-ant-api03-...')) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
            max_tokens: 600,
            system: `You are MicroSplit AI Concierge, a helpful fintech assistant for MicroSplit AI (squad revenue attribution, 0-cent split math, proof of focus, and PayPal batch payouts). Respond helpfully in the requested language: ${language} (EN = English, HI = Pure Hindi, Hinglish = natural Hindi written in Roman script). Keep responses friendly, punchy, and fintech-accurate.`,
            messages: [
              ...messages.map((m) => ({ role: m.role, content: m.content })),
              { role: 'user', content: message },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data.content?.[0]?.text;
          if (replyText) {
            return NextResponse.json({ reply: replyText, source: 'claude' });
          }
        }
      } catch {
        // Fall back gracefully
      }
    }

    // Knowledge base response
    const reply = generateFallbackResponse(message, language);
    return NextResponse.json({ reply, source: 'fintech_engine' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ error: 'Chat error', details: errorMsg }, { status: 500 });
  }
}
