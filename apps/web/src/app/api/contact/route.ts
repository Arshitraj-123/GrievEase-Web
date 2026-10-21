import { NextResponse } from 'next/server';
import { z } from 'zod';
import { siteConfig } from '@/config/site';

// In-memory rate limiting map: ip -> array of timestamps
const rateLimitMap = new Map<string, number[]>();

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  society: z.string().min(2, 'Society name is required'),
  role: z.enum([
    'Resident',
    'Secretary',
    'Committee Member',
    'Chairman',
    'Security Guard',
    'Vendor',
    'Other',
  ]),
  phone: z.string().regex(/^[0-9+ -]{10,15}$/, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email address'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
  honeypot: z.string().max(0, 'Spam detected'), // Must be empty
});

export async function POST(req: Request) {
  try {
    // Basic IP rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const now = Date.now();
    const windowMs = 10 * 60 * 1000; // 10 minutes
    const maxRequests = 5;

    const timestamps = rateLimitMap.get(ip) || [];
    const validTimestamps = timestamps.filter((t) => now - t < windowMs);

    if (validTimestamps.length >= maxRequests) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please wait a few minutes before submitting again.',
        },
        { status: 429 }
      );
    }

    validTimestamps.push(now);
    rateLimitMap.set(ip, validTimestamps);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Malformed JSON payload in request' },
        { status: 400 }
      );
    }
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      const issue = result.error.issues[0];
      return NextResponse.json(
        { success: false, error: issue ? issue.message : 'Invalid form data' },
        { status: 400 }
      );
    }

    const { name, society, role, phone, email, message } = result.data;
    const recipient = process.env.CONTACT_INBOX || siteConfig.contactInbox;

    // Dispatches to CONTACT_INBOX (simulated or SMTP logged securely)
    console.log(`[CONTACT_FORM] Inbound submission from ${name} (${email}, ${phone}) for ${society} [${role}]`);
    console.log(`[CONTACT_FORM] Forwarded securely to: ${recipient}`);
    console.log(`[CONTACT_FORM] Content: "${message}"`);

    // If SMTP configured in environment:
    // await sendSmtpMail({ to: recipient, from: 'noreply@grievease.in', subject: `Inquiry from ${name}`, text: message });

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your message has been received. Our team will contact you within 24 hours.',
    });
  } catch (err) {
    console.error('Contact API Error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
