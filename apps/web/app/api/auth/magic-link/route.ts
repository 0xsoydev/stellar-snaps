import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { magicLinks } from '@/lib/db/schema';
import { generateId, generateMagicToken, getMagicLinkExpiry, isValidEmail } from '@/lib/auth/utils';
import { sendMagicLinkEmail } from '@/lib/auth/email';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

/**
 * POST /api/auth/magic-link
 * 
 * Request a magic link to be sent to your email.
 * 
 * Body: { email: string }
 * Response: { success: true, message: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400, headers: corsHeaders }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

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

    // Get base URL for the magic link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    request.headers.get('origin') || 
                    'https://stellar-snaps.vercel.app';

    // Send email
    await sendMagicLinkEmail({
      email: normalizedEmail,
      token,
      baseUrl,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Check your email for a sign-in link',
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[Auth] Magic link error:', error);
    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500, headers: corsHeaders }
    );
  }
}
