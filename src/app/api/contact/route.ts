import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeText, sanitizeEmail } from '@/lib/sanitize';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting by client IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
    const rateLimit = checkRateLimit(`contact_${clientIp}`, {
      intervalMs: 300000, // 5 minutes
      maxRequests: 5,
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
    const name = sanitizeText(body.name);
    const rawEmail = body.email;
    const email = sanitizeEmail(rawEmail);
    const squad = sanitizeText(body.squad || '');
    const topic = sanitizeText(body.topic || 'General Inquiry');
    const message = sanitizeText(body.message);
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

    if (!message || message.length < 10) {
      return NextResponse.json(
        { error: 'Please enter a message with at least 10 characters.' },
        { status: 400 }
      );
    }

    // 4. Ticket generation & confirmation
    const ticketId = `MS-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    return NextResponse.json(
      {
        success: true,
        ticketId,
        message: 'Your message has been received. Our team will respond within 2 hours.',
        details: {
          name,
          email,
          squad: squad || undefined,
          topic,
          whatsapp: whatsapp || undefined,
          domainEmail: 'support@microsplit.ai',
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
