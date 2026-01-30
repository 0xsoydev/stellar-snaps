import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authChallenges } from '@/lib/db/schema';
import { generateId, generateChallenge, getChallengeExpiry, isValidStellarAddress } from '@/lib/auth/utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

/**
 * POST /api/auth/challenge
 * 
 * Request a challenge to sign with your Stellar wallet.
 * 
 * Body: { walletAddress: string }
 * Response: { challenge: string, expiresAt: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    // Validate wallet address
    if (!walletAddress || !isValidStellarAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate challenge
    const challenge = generateChallenge();
    const expiresAt = getChallengeExpiry();

    // Store challenge in database
    await db.insert(authChallenges).values({
      id: generateId(),
      walletAddress,
      challenge,
      expiresAt,
    });

    return NextResponse.json(
      {
        challenge,
        expiresAt: expiresAt.toISOString(),
        message: `Sign this message to authenticate with Stellar Snaps:\n\n${challenge}`,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[Auth] Challenge error:', error);
    return NextResponse.json(
      { error: 'Failed to generate challenge' },
      { status: 500, headers: corsHeaders }
    );
  }
}
