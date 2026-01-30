import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { magicLinks, developers, apiKeys } from '@/lib/db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { generateId, generateApiKey } from '@/lib/auth/utils';

/**
 * GET /api/auth/verify?token=xxx
 * 
 * Verify a magic link token and return an API key.
 * Creates a new developer account if one doesn't exist.
 * Redirects to the API keys page with the new key.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return redirectWithError('Missing token');
    }

    // Find the magic link in database
    const storedLink = await db.query.magicLinks.findFirst({
      where: and(
        eq(magicLinks.token, token),
        isNull(magicLinks.usedAt),
        gt(magicLinks.expiresAt, new Date())
      ),
    });

    if (!storedLink) {
      return redirectWithError('Invalid, expired, or already used link');
    }

    // Mark link as used
    await db.update(magicLinks)
      .set({ usedAt: new Date() })
      .where(eq(magicLinks.id, storedLink.id));

    // Find or create developer
    let developer = await db.query.developers.findFirst({
      where: eq(developers.email, storedLink.email),
    });

    if (!developer) {
      const newDeveloper = {
        id: generateId(),
        email: storedLink.email,
      };
      await db.insert(developers).values(newDeveloper);
      developer = await db.query.developers.findFirst({
        where: eq(developers.id, newDeveloper.id),
      });
    }

    if (!developer) {
      return redirectWithError('Failed to create account');
    }

    // Generate new API key
    const { key, hash, prefix } = generateApiKey();

    await db.insert(apiKeys).values({
      id: generateId(),
      developerId: developer.id,
      keyHash: hash,
      keyPrefix: prefix,
      name: 'Default',
    });

    // Redirect to API keys page with the new key
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stellar-snaps.vercel.app';
    const redirectUrl = new URL('/developers/hub/api-keys', baseUrl);
    redirectUrl.searchParams.set('newKey', key);
    redirectUrl.searchParams.set('email', storedLink.email);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('[Auth] Verify error:', error);
    return redirectWithError('Authentication failed');
  }
}

function redirectWithError(message: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stellar-snaps.vercel.app';
  const redirectUrl = new URL('/developers/hub/api-keys', baseUrl);
  redirectUrl.searchParams.set('error', message);
  return NextResponse.redirect(redirectUrl.toString());
}
