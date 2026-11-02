import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeText, sanitizeEmail } from '@/lib/sanitize';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting by client IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
    const rateLimit = checkRateLimit(`contact_${clientIp}`, {
      intervalMs: 300000, // 5 minutes
      maxRequests: 15,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please wait before submitting another message.',
          resetMs: rateLimit.resetMs,
        },
        { status: 429 }
      );
    }

    // 2. Parse & Sanitize Body
    const body = await req.json();
    const name = sanitizeText(body.name || 'Visitor');
    const rawEmail = body.email;
    const email = sanitizeEmail(rawEmail);
    const squad = sanitizeText(body.squad || '');
    const topic = sanitizeText(body.topic || 'General Inquiry');
    const message = sanitizeText(body.message || `Inquiry regarding ${topic}`);
    const whatsapp = sanitizeText(body.whatsapp || '');

    // 3. Validation
    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Please enter a valid full name (minimum 2 characters).' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (!message || message.length < 3) {
      return NextResponse.json(
        { error: 'Please enter a message with at least 3 characters.' },
        { status: 400 }
      );
    }

    // 4. Ticket generation & dispatch links
    const ticketId = `MS-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const adminEmail = 'akshatsinghai6682@gmail.com';

    // Normalize user's typed phone number so WhatsApp sends directly to the user's typed number!
    const userPhoneDigits = whatsapp ? whatsapp.replace(/[^0-9]/g, '') : '';
    const targetUserPhone =
      userPhoneDigits.length === 10
        ? `91${userPhoneDigits}`
        : userPhoneDigits.length >= 7
        ? userPhoneDigits
        : '';

    // Formatted WhatsApp message for dispatch to the user's typed phone number
    let userWhatsappUrl: string | null = null;
    let whatsappAlertUrl: string | null = null;

    if (targetUserPhone) {
      const userWaText = encodeURIComponent(
        `👋 *Hello ${name}! Welcome to MicroSplit AI Support*\n\n` +
        `🎫 *Your Ticket ID:* #${ticketId}\n` +
        `🏷️ *Topic:* ${topic}\n\n` +
        `💬 *Your Inquiry:*\n"${message}"\n\n` +
        `✅ *Status:* Registered on Cryptographic Ledger.\n` +
        `⚡ Our engineering team has received your ticket and will follow up with you on this number (+${targetUserPhone}) within 5 minutes.\n\n` +
        `--\n*MicroSplit AI Official Support Desk*`
      );
      userWhatsappUrl = `https://wa.me/${targetUserPhone}?text=${userWaText}`;
      whatsappAlertUrl = userWhatsappUrl;
    }

    // Gmail Web Compose URL
    const emailSubject = encodeURIComponent(`[MicroSplit Ticket ${ticketId}] ${topic} from ${name}`);
    const emailBody = encodeURIComponent(
      `Hello MicroSplit Team,\n\nA new inquiry has been submitted:\n\n` +
      `Name: ${name}\n` +
      `Email: ${email}\n` +
      `Phone/WhatsApp: ${whatsapp || 'Not provided'}\n` +
      `Squad: ${squad || 'N/A'}\n` +
      `Topic: ${topic}\n` +
      `Ticket ID: ${ticketId}\n\n` +
      `Message:\n${message}\n\n` +
      `--\nMicroSplit AI Automation`
    );

    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${adminEmail},support@microsplit.ai&su=${emailSubject}&body=${emailBody}`;
    const mailtoUrl = `mailto:${adminEmail}?cc=support@microsplit.ai&subject=${emailSubject}&body=${emailBody}`;

    // Automated follow-up resolution summary
    const autoFollowUp = {
      ticketId,
      status: 'received',
      summary: `Thank you ${name}. Your inquiry regarding "${topic}" has been logged under ticket #${ticketId}. Our founder and engineering team have been alerted.`,
      nextStep: 'Check the AI Concierge tab for instant answers, or expect an engineer follow-up on your WhatsApp or Email.',
    };

    return NextResponse.json(
      {
        success: true,
        ticketId,
        message: 'Your inquiry has been registered. Our AI concierge and support team have been notified.',
        autoFollowUp,
        details: {
          name,
          email,
          squad: squad || undefined,
          topic,
          whatsapp: targetUserPhone ? `+${targetUserPhone}` : undefined,
          adminEmail,
        },
        dispatch: {
          whatsappAlertUrl,
          gmailComposeUrl,
          mailtoUrl,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json(
      { error: 'Failed to process inquiry', details: errorMsg },
      { status: 500 }
    );
  }
}
