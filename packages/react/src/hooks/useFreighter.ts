/**
 * useFreighter - Hook for Freighter wallet integration
 * 
 * Can be used standalone or with StellarSnapsProvider
 */

import { useState, useCallback, useEffect } from 'react';
import type { Network } from '@stellar-snaps/core';
import { useStellarSnapsOptional } from '../context/StellarSnapsProvider';

export interface UseFreighterOptions {
  /** Auto-connect on mount */
  autoConnect?: boolean;
  /** Network for signing */
  network?: Network;
}

export interface UseFreighterResult {
  /** Connected wallet address */
  wallet: string | null;
  /** Whether wallet is connected */
  connected: boolean;
  /** Whether connection is in progress */
  connecting: boolean;
  /** Whether Freighter is installed */
  isInstalled: boolean;
  /** Connect to Freighter */
  connect: () => Promise<string | null>;
  /** Disconnect wallet */
  disconnect: () => void;
  /** Sign a transaction XDR */
  signTransaction: (xdr: string, network?: Network) => Promise<string>;
  /** Get network passphrase */
  getNetworkPassphrase: (network: Network) => string;
}

export function useFreighter(options: UseFreighterOptions = {}): UseFreighterResult {
  const { autoConnect = false, network: optNetwork } = options;
  
  // Try to use context if available
  const context = useStellarSnapsOptional();
  
  // Local state (used if no context)
  const [localWallet, setLocalWallet] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  
  // Use context state if available, otherwise local state
  const wallet = context?.wallet.address ?? localWallet;
  const connected = context?.wallet.connected ?? !!localWallet;
  const isConnecting = context?.wallet.connecting ?? connecting;
  const network = optNetwork ?? context?.network ?? 'testnet';
  
  // Check Freighter installation
  useEffect(() => {
    const check = () => {
      const installed = typeof window !== 'undefined' && 
        // @ts-expect-error - Freighter types
        (!!window.freighter || !!window.freighterApi);
      setIsInstalled(installed);
    };
    
    check();
    const timeout = setTimeout(check, 1000);
    return () => clearTimeout(timeout);
  }, []);
  
  // Auto-connect
  useEffect(() => {
    if (autoConnect && isInstalled && !connected) {
      connect();
    }
  }, [autoConnect, isInstalled]);
  
  // Connect function
  const connect = useCallback(async (): Promise<string | null> => {
    // Use context connect if available
    if (context) {
      return context.connect();
    }
    
    if (!isInstalled) {
      console.warn('[useFreighter] Freighter is not installed');
      return null;
    }
    
    setConnecting(true);
    
    try {
      // @ts-expect-error - Freighter types
      const freighter = window.freighter || window.freighterApi;
      const publicKey = await freighter.getPublicKey();
      setLocalWallet(publicKey);
      return publicKey;
    } catch (error) {
      console.error('[useFreighter] Failed to connect:', error);
      return null;
    } finally {
      setConnecting(false);
    }
  }, [context, isInstalled]);
  
  // Disconnect function
  const disconnect = useCallback(() => {
    if (context) {
      context.disconnect();
    } else {
      setLocalWallet(null);
    }
  }, [context]);
  
  // Sign transaction
  const signTransaction = useCallback(async (
    xdr: string,
    signNetwork?: Network
  ): Promise<string> => {
    const targetNetwork = signNetwork ?? network;
    
    if (!isInstalled) {
      throw new Error('Freighter is not installed');
    }
    
    // @ts-expect-error - Freighter types
    const freighter = window.freighter || window.freighterApi;
    
    const networkPassphrase = getNetworkPassphrase(targetNetwork);
    const signedXdr = await freighter.signTransaction(xdr, {
      networkPassphrase,
    });
    
    return signedXdr;
  }, [isInstalled, network]);
  
  // Get network passphrase
  const getNetworkPassphrase = useCallback((net: Network): string => {
    return net === 'public'
      ? 'Public Global Stellar Network ; September 2015'
      : 'Test SDF Network ; September 2015';
  }, []);
  
  return {
    wallet,
    connected,
    connecting: isConnecting,
    isInstalled,
    connect,
    disconnect,
    signTransaction,
    getNetworkPassphrase,
  };
}
