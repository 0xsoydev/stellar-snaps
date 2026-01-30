import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { walletChallenges } from '@/lib/db/schema';
import { generateId, generateChallenge, getChallengeExpiry, isValidStellarAddress } from '@/lib/auth/utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress } = body;

    if (!walletAddress || !isValidStellarAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    const challenge = generateChallenge();
    const expiresAt = getChallengeExpiry();

    await db.insert(walletChallenges).values({
      id: generateId(),
      walletAddress,
      challenge,
      expiresAt,
    });

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error('Challenge generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate challenge' },
      { status: 500 }
    );
  }
}
