import { createHash, randomBytes } from 'crypto';

/**
 * Generate a random ID using nanoid-like approach
 */
export function generateId(length: number = 21): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const bytes = randomBytes(length);
  let id = '';
  for (let i = 0; i < length; i++) {
    id += alphabet[bytes[i]! % alphabet.length];
  }
  return id;
}

/**
 * Generate an API key with prefix
 * Format: snaps_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 */
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const randomPart = generateId(32);
  const key = `snaps_${randomPart}`;
  const hash = hashApiKey(key);
  const prefix = key.substring(0, 12); // "snaps_xxxxxx"
  
  return { key, hash, prefix };
}

/**
 * Hash an API key using SHA256
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a challenge string for wallet signature
 * Format: stellar-snaps:<random>:<timestamp>
 */
export function generateChallenge(): string {
  const random = generateId(16);
  const timestamp = Date.now();
  return `stellar-snaps:${random}:${timestamp}`;
}

/**
 * Calculate challenge expiry (5 minutes from now)
 */
export function getChallengeExpiry(): Date {
  return new Date(Date.now() + 5 * 60 * 1000);
}

/**
 * Validate Stellar public key format
 */
export function isValidStellarAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  if (address.length !== 56) return false;
  if (!address.startsWith('G')) return false;
  // Basic character check (Stellar uses base32)
  return /^G[A-Z2-7]{55}$/.test(address);
}
