import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { magicLinks } from '@/lib/db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';

// Admin emails that can access the dashboard
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'yuknomebrawh@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase());

/**
 * POST /api/admin/verify
 * Verify an admin magic link token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token } = body;

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and token required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email is in admin list
    if (!ADMIN_EMAILS.includes(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    // Find the magic link in database
    const storedLink = await db.query.magicLinks.findFirst({
      where: and(
        eq(magicLinks.token, token),
        eq(magicLinks.email, normalizedEmail),
        isNull(magicLinks.usedAt),
        gt(magicLinks.expiresAt, new Date())
      ),
    });

    if (!storedLink) {
      return NextResponse.json(
        { error: 'Invalid, expired, or already used token' },
        { status: 401 }
      );
    }

    // Mark link as used
    await db.update(magicLinks)
      .set({ usedAt: new Date() })
      .where(eq(magicLinks.id, storedLink.id));

    return NextResponse.json({ 
      success: true,
      email: normalizedEmail,
    });
  } catch (error) {
    console.error('[Admin] Verify error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
