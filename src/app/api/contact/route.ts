import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeText, sanitizeEmail } from '@/lib/sanitize';

const TO_EMAIL = 'akshat.singhai701@gmail.com';

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

    // 4. Ticket generation
    const ticketId = `MS-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // 5. Send real email via Resend → akshat.singhai701@gmail.com
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(RESEND_API_KEY);

        await resend.emails.send({
          from: 'MicroSplit AI <onboarding@resend.dev>',
          to: TO_EMAIL,
          replyTo: email,
          subject: `[MicroSplit] #${ticketId} — ${topic} from ${name}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
              <h2 style="color:#2dd4bf;margin:0 0 4px;">🎫 MicroSplit Support Ticket</h2>
              <p style="color:#94a3b8;font-size:13px;margin:0 0 20px;">Ticket ID: <strong style="color:#2dd4bf;">#${ticketId}</strong></p>

              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr><td style="padding:8px 0;color:#94a3b8;width:120px;">Name</td><td style="padding:8px 0;font-weight:600;">${name}</td></tr>
                <tr><td style="padding:8px 0;color:#94a3b8;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#2dd4bf;">${email}</a></td></tr>
                ${whatsapp ? `<tr><td style="padding:8px 0;color:#94a3b8;">WhatsApp</td><td style="padding:8px 0;">${whatsapp}</td></tr>` : ''}
                ${squad ? `<tr><td style="padding:8px 0;color:#94a3b8;">Squad</td><td style="padding:8px 0;">${squad}</td></tr>` : ''}
                <tr><td style="padding:8px 0;color:#94a3b8;">Topic</td><td style="padding:8px 0;">${topic}</td></tr>
              </table>

              <div style="margin-top:20px;padding:16px;background:#1e293b;border-radius:8px;border-left:3px solid #2dd4bf;">
                <p style="color:#94a3b8;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Message</p>
                <p style="margin:0;white-space:pre-wrap;color:#e2e8f0;">${message}</p>
              </div>

              <p style="margin-top:20px;font-size:12px;color:#475569;">
                Reply directly to this email to respond to ${name}.<br/>
                Sent by MicroSplit AI Support Concierge
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        // Log but don't fail — ticket is still generated
        console.error('[contact] Resend delivery error:', emailErr);
      }
    }

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
          domainEmail: TO_EMAIL,
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
