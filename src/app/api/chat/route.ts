import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

const SYSTEM_PROMPT = `You are the official AI Concierge for MicroSplit AI (https://microsplit-ai-five.vercel.app), an autonomous squad revenue attribution and automated fintech settlement platform.

KNOWLEDGE BASE:
1. Evidence Vault & Verification (/evidence):
   - Squad members upload deliverables: client invoices, GitHub PRs, Figma milestone links, and receipts.
   - Multi-modal AI Vision OCR automatically scans deliverables to extract timestamps, deliverables, and dollar figures.
   - SHA-256 cryptographic hashing seals every file with an immutable fingerprint so it cannot be altered.
   - Automated conflict adjudication flags duplicate receipts or overlapping hours before payouts are approved.

2. 0-Cent Deterministic Math & Settlements (/splits/new, /runs):
   - Pure integer-cent arithmetic eliminates floating-point rounding bugs (e.g., $100.00 = 10,000 cents).
   - Hare-Niemeyer (Largest-Remainder) algorithm allocates fractional cents deterministically to members with the largest remainders.
   - Sum(Member Payouts) mathematically equals Total Pool cents down to the exact cent (0-cent loss guarantee).
   - AI only extracts structured facts from evidence; pure deterministic TypeScript code executes the payouts.

3. Consistency Streak Bonus:
   - Squads dedicate 5% to 10% of their total revenue pool specifically to reward daily contributor discipline.
   - Consecutive verified active days build streak multipliers up to 100 days.
   - Freeze Days protect member streaks during approved vacations, sickness, or exams without losing bonus points.

4. PayPal Batch Payouts (/payouts, /runs):
   - Single-click mass disbursement to up to 15,000 squad members across 180+ countries via PayPal Payouts API v1.
   - Low flat fees; instant PayPal webhooks confirm transaction delivery and seal the Merkle ledger block.

5. Cryptographic Merkle Ledger (/ledger):
   - Append-only verifiable SHA-256 block chain where all allocations, rule changes, and payouts are permanently recorded.
   - Eliminates squad disputes before disbursement.

6. Member Privacy:
   - 100% opt-in focus sessions. Zero spyware, zero keystroke logging, zero webcam or screen recording.

LANGUAGE & TONE RULES:
- If user speaks in Hindi (हिंदी): Reply in clear, natural Hindi (Devanagari script).
- If user speaks in Hinglish: Reply in friendly, conversational Hinglish (Hindi written in Roman script).
- If user speaks in English: Reply in concise, professional English.
- STRICT SCOPE & BOUNDARY:
  * You ONLY answer questions about MicroSplit AI, squad revenue attribution, evidence uploads, 0-cent math, consistency streaks, PayPal payouts, and the Merkle ledger.
  * If the user asks something outside MicroSplit AI or asks a question where information is not known, politely answer:
    "Is baare mein adhik jaankari ke liye kripya 'Team se baat karein' button dabayein aur hamari support team se WhatsApp par sampark karein." (or in English: "For more details on this, please tap 'Team se baat karein' to chat directly with our engineering team on WhatsApp.")
- Keep responses concise, clear, and well-formatted with markdown bullet points.`;

// High-fidelity fallback knowledge engine for offline / unconfigured API key scenarios
function getLocalFallbackReply(userMessage: string, lang: 'en' | 'hi' | 'hinglish' = 'en'): string {
  const q = userMessage.toLowerCase().trim();

  // 1. Evidence
  if (q.includes('evidence') || q.includes('proof') || q.includes('upload') || q.includes('ocr') || q.includes('invoice') || q.includes('receipt') || q.includes('screen')) {
    if (lang === 'hi') {
      return 'MicroSplit AI में स्लैश एविडेंस (/evidence) पर पूरा **Evidence Vault** है:\n• 📄 **Upload Proof**: आप इनवॉइस, रसीद, या GitHub PR अपलोड कर सकते हैं।\n• 👁️ **AI Vision OCR**: AI अपने आप टाइमस्टैम्प और रकम निकालता है।\n• 🔒 **SHA-256 Hash**: हर फाइल क्रिप्टोग्राफिक रूप से सुरक्षित होती है।\n• ⚠️ **Conflict Detection**: डुप्लीकेट बिल तुरंत फ्लैग होते हैं।\n\nअधिक सहायता के लिए नीचे "Team se baat karein" दबाकर WhatsApp पर संपर्क करें।';
    }
    if (lang === 'hinglish') {
      return 'MicroSplit AI mein slash evidence (/evidence) par dedicated **Evidence Vault** hai:\n• 📄 **Upload Deliverables**: Aap invoices, receipts ya GitHub PR links upload kar sakte hain.\n• 👁️ **AI Vision OCR**: AI text, timestamps aur amounts automatically extract karta hai.\n• 🔒 **SHA-256 Hashing**: Tamper-proof digital fingerprint ensure karti hai koi fraud na ho.\n• ⚠️ **Conflict Detection**: Overlapping hours ya duplicate bills payout se pehle flag ho jaate hain.\n\nAage ki jaankari ke liye "Team se baat karein" button dabayein!';
    }
    return 'MicroSplit AI includes an **Evidence Vault** at `/evidence`:\n• 📄 **Multi-Format Upload**: Upload client receipts, GitHub commits, or invoices.\n• 👁️ **AI Vision OCR**: Multi-modal AI extracts timestamps and dollar figures automatically.\n• 🔒 **SHA-256 Evidence Hashing**: Every submission receives an immutable digital fingerprint.\n• ⚠️ **Conflict Adjudication**: Flags duplicate invoices or overlapping hours before payout.\n\nTap "Team se baat karein" above to chat with our engineering desk on WhatsApp!';
  }

  // 2. 0-Cent Math
  if (q.includes('0-cent') || q.includes('zero') || q.includes('split') || q.includes('math') || q.includes('calculate') || q.includes('cent')) {
    if (lang === 'hi') {
      return 'MicroSplit AI का **0-Cent Loss Guarantee** ऐसे काम करता है:\n• **Pure Integer-Cent Math**: पैसों का हिसाब पूर्णांक सेंट में होता है, जिससे 1 सेंट का भी राउंडिंग लॉस नहीं होता।\n• **Hare-Niemeyer Algorithm**: दशमलव सेंट्स को सबसे बड़े शेषफल वाले सदस्यों में नियमानुसार बांटा जाता है।\n• **AI vs Code**: AI सिर्फ फैक्ट्स पढ़ता है, गणितीय कोड ही पेआउट निष्पादित करता है।\n\n`Sum(Payouts) === Total Pool` 100% सटीक रहता है!';
    }
    if (lang === 'hinglish') {
      return 'MicroSplit AI ka **0-Cent Loss Guarantee** deterministic math par based hai:\n• **Integer-Cent Arithmetic**: Calculation integer cents mein hoti hai, floating-point rounding errors zero hoti hain.\n• **Largest-Remainder (Hare-Niemeyer)**: Fractional cents un members ko milti hain jinka remainder sabse bada hota hai.\n• **AI vs Code**: AI sirf evidence facts extract karta hai, mathematical code payouts execute karta hai.\n\nExact zero cents lost or created!';
    }
    return 'MicroSplit AI enforces a strict **Zero-Cent Loss Guarantee**:\n• **Integer-Cent Arithmetic**: Calculates money strictly in integer cents ($100.00 = 10,000 cents), preventing rounding drift.\n• **Hare-Niemeyer Largest-Remainder**: Fractional cents are deterministically awarded to members with highest remainders.\n• **Separation of Concerns**: AI extracts facts from evidence; pure TypeScript math executes the split.\n\n`Sum(Member Payouts) === Total Pool` is guaranteed down to the exact cent!';
  }

  // 3. Consistency Streak
  if (q.includes('streak') || q.includes('consistency') || q.includes('freeze') || q.includes('bonus')) {
    if (lang === 'hi') {
      return 'कंसिस्टेंसी स्ट्रीक बोनस (Consistency Streak Bonus):\n• टीम अपने रेवेन्यू पूल का 5% से 10% स्ट्रीक बोनस के लिए अलग रखती है।\n• हर लगातार सक्रिय दिन पर स्ट्रीक मल्टीप्लायर बढ़ता है (अधिकतम 100 दिन)।\n• **Freeze Days**: बीमारी या छुट्टी के दिनों में फ्रीज टोकन से आपकी स्ट्रीक सुरक्षित रहती है!';
    }
    if (lang === 'hinglish') {
      return 'Consistency Streak Bonus discipline ko reward karta hai:\n• Squad revenue pool ka 5% se 10% consistency pool mein allocate hota hai.\n• Daily verified active days se 100 days tak multiplier boost milta hai.\n• **Freeze Days**: Exams ya illness ke dauran approved freeze token aapki streak ko tootne se bachata hai!';
    }
    return 'The **Consistency Streak Bonus** rewards reliable squad contributors:\n• Squads allocate 5% to 10% of their revenue pool specifically for consistency.\n• Consecutive verified active days build a streak multiplier up to 100 days.\n• **Freeze Days**: Approved freeze tokens protect your streak during illness or vacation without resetting points!';
  }

  // 4. PayPal Batch
  if (q.includes('paypal') || q.includes('batch') || q.includes('payout') || q.includes('disburse')) {
    if (lang === 'hi') {
      return 'पेपैल बैच पेआउट (PayPal Batch Payouts):\n• एक क्लिक में 15,000 टीम मेंबर्स को पेपैल बैच एपीआई v1 द्वारा तुरंत पैसे ट्रांसफर होते हैं।\n• कम फ्लैट फीस और तुरंत वेबहुक कन्फर्मेशन मिलती है।\n• पेआउट होते ही /ledger पर क्रिप्टोग्राफिक ब्लॉक सील हो जाता है!';
    }
    if (lang === 'hinglish') {
      return 'PayPal Batch Payouts MicroSplit ka core disbursement engine hai:\n• Single API call mein pure squad (15,000 members tak) ko instantly transfer chala jaata hai.\n• Manual wire fees aur delay se bachat hoti hai.\n• Real-time webhooks turant Merkle Ledger block ko SHA-256 se seal kar dete hain!';
    }
    return 'MicroSplit AI integrates directly with **PayPal Payouts API v1**:\n• **Mass Disbursement**: Pay up to 15,000 squad members across 180+ countries in a single batch transaction.\n• **Low Fees**: Avoid expensive individual wires.\n• **Instant Webhooks**: PayPal webhooks confirm payments and seal the cryptographic Merkle ledger block in `/ledger`!';
  }

  // 5. Ledger
  if (q.includes('ledger') || q.includes('merkle') || q.includes('audit') || q.includes('sha-256') || q.includes('hash')) {
    if (lang === 'hi') {
      return 'मर्कल लेजर (/ledger) में हर पेआउट और एविडेंस का SHA-256 क्रिप्टोग्राफिक हैश ब्लॉकचेन की तरह सुरक्षित रहता है। इससे कोई भी रिकॉर्ड बदला नहीं जा सकता और विवाद की कोई गुंजाइश नहीं होती।';
    }
    if (lang === 'hinglish') {
      return 'Slash ledger (/ledger) par har split, evidence approval aur PayPal transaction SHA-256 block chain mein seal hoti hai. Yeh immutable audit trail hai jisse koi dispute nahi hota!';
    }
    return 'The **Merkle Ledger** at `/ledger` records every allocation, evidence approval, and batch payout in an append-only SHA-256 hash chain, guaranteeing transparent, tamper-proof audit trails.';
  }

  // 6. Greetings / Out of scope
  if (q === 'hi' || q === 'hello' || q === 'hey' || q === 'namaste' || q.includes('kya hal')) {
    if (lang === 'hi') {
      return 'नमस्ते! मैं MicroSplit AI असिस्टेंट हूँ। मैं आपकी टीम के रेवेन्यू स्प्लिट, एविडेंस अपलोड, 0-सेंट मैथ, और पेपैल पेआउट में कैसे सहायता कर सकता हूँ? अगर किसी इंसान से बात करनी हो तो ऊपर "Team se baat karein" दबाएँ!';
    }
    if (lang === 'hinglish') {
      return 'Hello! Main MicroSplit AI Assistant hoon. Squad revenue splits, evidence vault, 0-cent math ya PayPal payouts ke baare mein aapko kya jaankari chahiye? Team se direct connect karne ke liye "Team se baat karein" button use karein!';
    }
    return 'Hello! I am the MicroSplit AI Assistant. How can I help you with squad revenue splits, the Evidence Vault, 0-cent math, consistency streaks, or PayPal batch payouts today? You can also tap "Team se baat karein" to reach our human desk!';
  }

  if (lang === 'hi') {
    return 'इस बारे में अधिक जानकारी के लिए कृपया ऊपर "Team se baat karein" बटन दबाएँ और हमारी सपोर्ट टीम से WhatsApp पर संपर्क करें।';
  }
  if (lang === 'hinglish') {
    return 'Is baare mein adhik jaankari ke liye kripya upar "Team se baat karein" button dabayein aur hamari support team se WhatsApp par direct connect karein.';
  }
  return 'For more details on this topic, please tap "Team se baat karein" above to connect directly with our engineering team on WhatsApp.';
}

export async function POST(req: NextRequest) {
  try {
    // 1. Client IP Rate Limiting (60 requests per 5 minutes)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
    const rateLimit = checkRateLimit(`chat_${clientIp}`, {
      intervalMs: 300000,
      maxRequests: 60,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait a minute before sending another message.',
          resetMs: rateLimit.resetMs,
        },
        { status: 429 }
      );
    }

    // 2. Parse request
    const body = await req.json();
    const userMessage: string = body.message?.trim() || '';
    const history: Array<{ role: 'user' | 'assistant'; content: string }> = Array.isArray(body.history)
      ? body.history
      : [];
    const language: 'en' | 'hi' | 'hinglish' = ['en', 'hi', 'hinglish'].includes(body.language)
      ? body.language
      : 'en';

    if (!userMessage) {
      return NextResponse.json(
        { error: 'Message cannot be empty.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

    // 3. If Claude API Key is configured on the server, call Anthropic Messages API
    if (apiKey && apiKey.length > 10 && apiKey !== 'your_anthropic_api_key_here') {
      try {
        // Build conversational messages structure for Claude
        const formattedMessages = [
          ...history
            .slice(-6) // Keep last 6 context messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
          {
            role: 'user' as const,
            content: userMessage,
          },
        ];

        // Ensure first message has role 'user'
        if (formattedMessages.length > 0 && formattedMessages[0].role !== 'user') {
          formattedMessages.shift();
        }

        const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

        const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: 800,
            system: `${SYSTEM_PROMPT}\n\nSelected User Language Mode: ${language.toUpperCase()}`,
            messages: formattedMessages,
          }),
        });

        if (anthropicRes.ok) {
          const data = await anthropicRes.json();
          const assistantReply =
            data.content?.[0]?.text?.trim() ||
            getLocalFallbackReply(userMessage, language);

          return NextResponse.json({
            reply: assistantReply,
            provider: 'claude',
            model: data.model || model,
          });
        }

        // If Anthropic returned an error (e.g. invalid key or out of credits), log and fallback
        const errData = await anthropicRes.text();
        console.warn('Anthropic API error, using intelligent fallback:', errData);
      } catch (anthropicErr) {
        console.warn('Anthropic fetch exception, using intelligent fallback:', anthropicErr);
      }
    }

    // 4. Fallback Knowledge Engine (guaranteed 100% uptime with zero crashes)
    const fallbackReply = getLocalFallbackReply(userMessage, language);
    return NextResponse.json({
      reply: fallbackReply,
      provider: 'local-intelligence',
      note: apiKey ? undefined : 'ANTHROPIC_API_KEY not configured in .env; using local MicroSplit knowledge engine.',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json(
      {
        error: 'Failed to generate response',
        details: errorMsg,
        reply: 'Maaf kijiye, system mein temporary error aaya hai. Kripya "Team se baat karein" par click karke WhatsApp par sampark karein.',
      },
      { status: 500 }
    );
  }
}
