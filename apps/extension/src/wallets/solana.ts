/**
 * Solana Wallet Connector
 * 
 * Connects to Phantom, Solflare, etc. via window.solana
 * All calls go through injected.ts since content scripts can't access window.solana
 */

import type { WalletInfo } from './types';

/**
 * Connect to Solana wallet
 */
export async function connectSolana(): Promise<WalletInfo> {
  return callInjected('connectSolana');
}

/**
 * Get current Solana address
 */
export async function getSolanaAddress(): Promise<string> {
  return callInjected('getSolanaAddress');
}

/**
 * Send SOL
 */
export async function sendSOL(
  to: string,
  amount: string, // In lamports
): Promise<string> {
  return callInjected('sendSOL', { to, amount });
}

/**
 * Send SPL token
 */
export async function sendSPLToken(
  tokenMint: string,
  to: string,
  amount: string,
): Promise<string> {
  return callInjected('sendSPLToken', { tokenMint, to, amount });
}

// Helper to call injected script
function callInjected(method: string, params?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const messageId = `sol_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    const handler = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.data?.source !== 'stellar-snaps-injected') return;
      if (event.data?.id !== messageId) return;
      
      window.removeEventListener('message', handler);
      
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data.result);
      }
    };
    
    window.addEventListener('message', handler);
    
    window.postMessage({
      source: 'stellar-snaps-content',
      id: messageId,
      method,
      params,
    }, '*');
    
    // Timeout after 60 seconds (for user interaction)
    setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error('Solana wallet request timed out'));
    }, 60000);
  });
}
