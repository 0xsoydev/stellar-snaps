import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { walletChallenges, walletSessions } from '@/lib/db/schema';
import { generateId, isValidStellarAddress } from '@/lib/auth/utils';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { Keypair, hash } from '@stellar/stellar-sdk';
import { randomBytes } from 'crypto';

// Session valid for 24 hours
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, challenge, signedMessage } = body;

    if (!walletAddress || !isValidStellarAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    if (!challenge || !signedMessage) {
      return NextResponse.json(
        { error: 'Missing challenge or signature' },
        { status: 400 }
      );
    }

    // Find the challenge in DB
    const [challengeRecord] = await db
      .select()
      .from(walletChallenges)
      .where(
        and(
          eq(walletChallenges.walletAddress, walletAddress),
          eq(walletChallenges.challenge, challenge),
          isNull(walletChallenges.usedAt),
          gt(walletChallenges.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!challengeRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired challenge' },
        { status: 400 }
      );
    }

    // Verify the signature
    const isValid = verifySignature(walletAddress, challenge, signedMessage);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Mark challenge as used
    await db
      .update(walletChallenges)
      .set({ usedAt: new Date() })
      .where(eq(walletChallenges.id, challengeRecord.id));

    // Create session token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await db.insert(walletSessions).values({
      id: generateId(),
      walletAddress,
      token,
      expiresAt,
    });

    // Return token (client will store in cookie/localStorage)
    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
      walletAddress,
    });
  } catch (error) {
    console.error('Wallet verify error:', error);
    return NextResponse.json(
      { error: 'Failed to verify signature' },
      { status: 500 }
    );
  }
}

/**
 * Verify a Stellar wallet signature from Freighter (SEP-53)
 * 
 * Freighter uses SEP-53 message signing:
 * 1. Prepends "Stellar Signed Message:\n" to the message
 * 2. Hashes the result with SHA-256 (Stellar's hash function)
 * 3. Signs the hash
 */
function verifySignature(
  publicKey: string,
  message: string,
  signature: string
): boolean {
  try {
    const keypair = Keypair.fromPublicKey(publicKey);
    
    // Decode signature from base64
    const signatureBuffer = Buffer.from(signature, 'base64');
    
    if (signatureBuffer.length !== 64) {
      console.error('Invalid signature length:', signatureBuffer.length, 'expected 64');
      return false;
    }
    
    // SEP-53: Prefix + message, then hash
    const SIGN_MESSAGE_PREFIX = 'Stellar Signed Message:\n';
    const prefixBytes = Buffer.from(SIGN_MESSAGE_PREFIX, 'utf8');
    const messageBytes = Buffer.from(message, 'utf8');
    const encodedMessage = Buffer.concat([prefixBytes, messageBytes]);
    const hashedMessage = hash(encodedMessage);
    
    return keypair.verify(hashedMessage, signatureBuffer);
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}
