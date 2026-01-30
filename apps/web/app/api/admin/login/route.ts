import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { magicLinks } from '@/lib/db/schema';
import { generateId, generateMagicToken, getMagicLinkExpiry, isValidEmail } from '@/lib/auth/utils';
import { sendMagicLinkEmail } from '@/lib/auth/email';

// Admin emails that can access the dashboard
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'yuknomebrawh@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase());

/**
 * POST /api/admin/login
 * Send a magic link to an admin email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email is in admin list
    if (!ADMIN_EMAILS.includes(normalizedEmail)) {
      // Don't reveal whether email is admin or not
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    // Generate magic link token
    const token = generateMagicToken();
    const expiresAt = getMagicLinkExpiry();

    // Store in database
    await db.insert(magicLinks).values({
      id: generateId(),
      email: normalizedEmail,
      token,
      expiresAt,
    });

    // Send email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // For admin, we send a special link that includes adminToken
    await sendAdminMagicLinkEmail({ email: normalizedEmail, token, baseUrl });

    return NextResponse.json({ 
      success: true,
      message: 'Check your email for the login link',
    });
  } catch (error) {
    console.error('[Admin] Login error:', error);
    return NextResponse.json(
      { error: 'Failed to send login link' },
      { status: 500 }
    );
  }
}

async function sendAdminMagicLinkEmail({ email, token, baseUrl }: { email: string; token: string; baseUrl: string }) {
  // Reuse the magic link email but with admin-specific redirect
  const { sendMagicLinkEmail: sendEmail } = await import('@/lib/auth/email');
  
  // We'll handle this differently - send the token directly
  // The admin page will use this token for verification
  const magicLink = `${baseUrl}/admin?email=${encodeURIComponent(email)}&adminToken=${token}`;

  const { Resend } = await import('resend');
  
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not set');
  }
  
  const resend = new Resend(apiKey);
  const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Admin Login - Stellar Snaps',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #fe330a; font-size: 28px; margin: 0;">Stellar Snaps Admin</h1>
            </div>
            
            <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Admin Login</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
              Click the button below to sign in to the admin dashboard. This link expires in 15 minutes.
            </p>
            
            <a href="${magicLink}" style="display: block; background: #fe330a; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center; margin-bottom: 24px;">
              Sign In to Admin
            </a>
            
            <p style="color: #999; font-size: 14px; line-height: 1.5; margin: 0;">
              If you didn't request this email, you can safely ignore it.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Admin Login - Stellar Snaps\n\nClick this link to sign in: ${magicLink}\n\nThis link expires in 15 minutes.`,
  });

  if (error) {
    console.error('[Admin] Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}
