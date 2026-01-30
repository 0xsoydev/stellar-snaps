import { Keypair } from '@stellar/stellar-sdk';

/**
 * Verify a Stellar wallet signature
 * 
 * @param walletAddress - The Stellar public key (G...)
 * @param message - The original message that was signed
 * @param signature - The signature in base64 format
 * @returns true if signature is valid
 */
export function verifySignature(
  walletAddress: string,
  message: string,
  signature: string
): boolean {
  try {
    const keypair = Keypair.fromPublicKey(walletAddress);
    const messageBuffer = Buffer.from(message, 'utf8');
    const signatureBuffer = Buffer.from(signature, 'base64');
    
    return keypair.verify(messageBuffer, signatureBuffer);
  } catch (error) {
    console.error('[Auth] Signature verification error:', error);
    return false;
  }
}
