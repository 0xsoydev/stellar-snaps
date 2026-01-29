/**
 * Wallet detection - finds available wallet extensions
 * 
 * Works by checking for injected providers in the page context.
 * Since we're in a content script, we need to access these via injected.ts
 */

import type { DetectedWallet, ChainType, ChainId } from './types';

export interface AvailableWallets {
  stellar: DetectedWallet | null;
  evm: DetectedWallet | null;
  solana: DetectedWallet | null;
}

/**
 * Detect all available wallets
 * Returns object with detected wallet for each chain type
 */
export async function detectWallets(): Promise<AvailableWallets> {
  return new Promise((resolve) => {
    const messageId = `detect_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    const handler = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.data?.source !== 'stellar-snaps-injected') return;
      if (event.data?.id !== messageId) return;
      
      window.removeEventListener('message', handler);
      resolve(event.data.wallets as AvailableWallets);
    };
    
    window.addEventListener('message', handler);
    
    // Ask injected script to detect wallets
    window.postMessage({
      source: 'stellar-snaps-content',
      id: messageId,
      method: 'detectWallets',
    }, '*');
    
    // Timeout after 2 seconds
    setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve({
        stellar: null,
        evm: null,
        solana: null,
      });
    }, 2000);
  });
}

/**
 * Get list of all detected wallets as array
 */
export async function getAvailableWallets(): Promise<DetectedWallet[]> {
  const wallets = await detectWallets();
  const available: DetectedWallet[] = [];
  
  if (wallets.stellar?.available) available.push(wallets.stellar);
  if (wallets.evm?.available) available.push(wallets.evm);
  if (wallets.solana?.available) available.push(wallets.solana);
  
  return available;
}
