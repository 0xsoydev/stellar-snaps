import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authChallenges, developers, apiKeys } from '@/lib/db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { generateId, generateApiKey, isValidStellarAddress } from '@/lib/auth/utils';
import { verifySignature } from '@/lib/auth/verify';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

/**
 * POST /api/auth/verify
 * 
 * Verify a signed challenge and return an API key.
 * Creates a new developer account if one doesn't exist.
 * 
 * Body: { walletAddress: string, challenge: string, signature: string }
 * Response: { developer: {...}, apiKey: string } (key only shown once!)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, challenge, signature } = body;

    // Validate inputs
    if (!walletAddress || !isValidStellarAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!challenge || !signature) {
      return NextResponse.json(
        { error: 'Missing challenge or signature' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find the challenge in database
    const storedChallenge = await db.query.authChallenges.findFirst({
      where: and(
        eq(authChallenges.challenge, challenge),
        eq(authChallenges.walletAddress, walletAddress),
        isNull(authChallenges.usedAt),
        gt(authChallenges.expiresAt, new Date())
      ),
    });

    if (!storedChallenge) {
      return NextResponse.json(
        { error: 'Invalid, expired, or already used challenge' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Build the full message that was signed (same as what we sent to client)
    const message = `Sign this message to authenticate with Stellar Snaps:\n\n${challenge}`;

    // Verify signature
    const isValid = verifySignature(walletAddress, message, signature);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Mark challenge as used
    await db.update(authChallenges)
      .set({ usedAt: new Date() })
      .where(eq(authChallenges.id, storedChallenge.id));

    // Find or create developer
    let developer = await db.query.developers.findFirst({
      where: eq(developers.walletAddress, walletAddress),
    });

    if (!developer) {
      const newDeveloper = {
        id: generateId(),
        walletAddress,
      };
      await db.insert(developers).values(newDeveloper);
      developer = await db.query.developers.findFirst({
        where: eq(developers.id, newDeveloper.id),
      });
    }

    if (!developer) {
      return NextResponse.json(
        { error: 'Failed to create developer account' },
        { status: 500, headers: corsHeaders }
      );
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

    return NextResponse.json(
      {
        developer: {
          id: developer.id,
          walletAddress: developer.walletAddress,
          createdAt: developer.createdAt,
        },
        apiKey: key, // Only shown once!
        message: 'Save this API key securely. It will not be shown again.',
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[Auth] Verify error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}
