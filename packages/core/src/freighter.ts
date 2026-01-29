/**
 * Freighter Wallet Integration
 *
 * Utilities for connecting to and signing transactions with Freighter.
 * These work in browser environments where Freighter is installed.
 */

import type { Network, SignedTransaction } from './types';

declare global {
  interface Window {
    freighterApi?: {
      isConnected: () => Promise<boolean>;
      getPublicKey: () => Promise<string>;
      getNetwork: () => Promise<string>;
      signTransaction: (
        xdr: string,
        opts?: { networkPassphrase?: string; address?: string }
      ) => Promise<string>;
      requestAccess: () => Promise<{ address: string }>;
    };
  }
}

const NETWORK_PASSPHRASES: Record<Network, string> = {
  public: 'Public Global Stellar Network ; September 2015',
  testnet: 'Test SDF Network ; September 2015',
};

/**
 * Check if Freighter wallet is installed
 */
export function isFreighterInstalled(): boolean {
  return typeof window !== 'undefined' && !!window.freighterApi;
}

/**
 * Connect to Freighter and get the user's wallet address
 *
 * @example
 * ```typescript
 * const { address, network } = await connectFreighter();
 * console.log('Connected:', address);
 * ```
 */
export async function connectFreighter(): Promise<{ address: string; network: string }> {
  if (!isFreighterInstalled()) {
    throw new Error('Freighter wallet is not installed');
  }

  const api = window.freighterApi!;

  // Request access (this will prompt the user)
  const { address } = await api.requestAccess();
  const network = await api.getNetwork();

  return { address, network };
}

/**
 * Get the currently connected Freighter address (if any)
 */
export async function getFreighterAddress(): Promise<string | null> {
  if (!isFreighterInstalled()) {
    return null;
  }

  const api = window.freighterApi!;

  try {
    const isConnected = await api.isConnected();
    if (!isConnected) {
      return null;
    }
    return api.getPublicKey();
  } catch {
    return null;
  }
}

/**
 * Sign a transaction XDR with Freighter
 *
 * @example
 * ```typescript
 * const xdr = await buildPaymentTx({ ... });
 * const signed = await signWithFreighter(xdr, 'public');
 * const result = await submitTx(signed.signedXdr, 'public');
 * ```
 */
export async function signWithFreighter(
  xdr: string,
  network: Network = 'testnet'
): Promise<SignedTransaction> {
  if (!isFreighterInstalled()) {
    throw new Error('Freighter wallet is not installed');
  }

  const api = window.freighterApi!;
  const networkPassphrase = NETWORK_PASSPHRASES[network];

  // Check if connected
  const isConnected = await api.isConnected();
  if (!isConnected) {
    // Request access first
    await api.requestAccess();
  }

  // Get the current address for signing
  const address = await api.getPublicKey();

  // Sign the transaction
  const signedXdr = await api.signTransaction(xdr, {
    networkPassphrase,
    address,
  });

  return {
    signedXdr,
    networkPassphrase,
  };
}

/**
 * Check if Freighter is connected to the expected network
 */
export async function checkFreighterNetwork(
  expectedNetwork: Network
): Promise<{ matches: boolean; currentNetwork: string }> {
  if (!isFreighterInstalled()) {
    throw new Error('Freighter wallet is not installed');
  }

  const api = window.freighterApi!;
  const currentNetwork = await api.getNetwork();

  // Freighter returns 'TESTNET' or 'PUBLIC'
  const normalizedCurrent = currentNetwork.toLowerCase();
  const matches =
    (expectedNetwork === 'testnet' && normalizedCurrent === 'testnet') ||
    (expectedNetwork === 'public' && normalizedCurrent === 'public');

  return { matches, currentNetwork };
}
