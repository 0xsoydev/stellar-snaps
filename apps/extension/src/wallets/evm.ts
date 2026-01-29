/**
 * EVM Wallet Connector
 * 
 * Connects to MetaMask, Rabby, Coinbase Wallet, etc. via window.ethereum
 * All calls go through injected.ts since content scripts can't access window.ethereum
 */

import type { WalletInfo, ChainId } from './types';
import { EVM_CHAINS, CHAIN_ID_MAP } from './types';

/**
 * Connect to EVM wallet
 */
export async function connectEVM(): Promise<WalletInfo> {
  return callInjected('connectEVM');
}

/**
 * Get current EVM address
 */
export async function getEVMAddress(): Promise<string> {
  return callInjected('getEVMAddress');
}

/**
 * Get current chain ID
 */
export async function getEVMChainId(): Promise<number> {
  return callInjected('getEVMChainId');
}

/**
 * Switch to a different EVM chain
 */
export async function switchEVMChain(chainId: ChainId): Promise<void> {
  const chain = EVM_CHAINS[chainId];
  if (!chain) throw new Error(`Unknown chain: ${chainId}`);
  
  return callInjected('switchEVMChain', { chainId: chain.chainId });
}

/**
 * Send native token (ETH, MATIC, BNB, etc.)
 */
export async function sendEVMTransaction(
  to: string,
  amount: string, // In wei
): Promise<string> {
  return callInjected('sendEVMTransaction', { to, amount });
}

/**
 * Send ERC20 token
 */
export async function sendERC20(
  tokenAddress: string,
  to: string,
  amount: string, // In token's smallest unit
): Promise<string> {
  return callInjected('sendERC20', { tokenAddress, to, amount });
}

// Helper to call injected script
function callInjected(method: string, params?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const messageId = `evm_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
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
      reject(new Error('EVM wallet request timed out'));
    }, 60000);
  });
}
