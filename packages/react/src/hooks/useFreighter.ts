/**
 * useFreighter - Hook for Freighter wallet integration
 * 
 * Uses @stellar/freighter-api for proper Freighter detection and interaction
 */

import { useState, useCallback, useEffect } from 'react';
import * as freighterApi from '@stellar/freighter-api';
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
  
  // Check Freighter installation using the official API
  useEffect(() => {
    let mounted = true;
    
    const checkFreighter = async () => {
      try {
        // Use the official isConnected check - it will fail if Freighter isn't installed
        const result = await freighterApi.isConnected();
        if (mounted) {
          // If we get here, Freighter is installed
          setIsInstalled(true);
          
          // If already connected, get the address
          if (result.isConnected) {
            try {
              const { address } = await freighterApi.getAddress();
              if (mounted && address) {
                setLocalWallet(address);
              }
            } catch (e) {
              // Not allowed yet, that's fine
            }
          }
        }
      } catch (err) {
        // Freighter not installed
        if (mounted) {
          setIsInstalled(false);
        }
      }
    };
    
    // Check immediately
    checkFreighter();
    
    // Also check after a delay (Freighter may inject later)
    const timeout = setTimeout(checkFreighter, 1000);
    
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []);
  
  // Auto-connect
  useEffect(() => {
    if (autoConnect && isInstalled && !connected) {
      connect();
    }
  }, [autoConnect, isInstalled, connected]);
  
  // Connect function
  const connect = useCallback(async (): Promise<string | null> => {
    // Use context connect if available
    if (context) {
      return context.connect();
    }
    
    if (!isInstalled) {
      console.warn('[StellarSnaps] Freighter is not installed');
      return null;
    }
    
    setConnecting(true);
    
    try {
      // Request access permission
      await freighterApi.setAllowed();
      
      // Get the public key
      const { address } = await freighterApi.getAddress();
      
      if (address) {
        setLocalWallet(address);
        return address;
      }
      
      return null;
    } catch (error) {
      console.error('[StellarSnaps] Failed to connect:', error);
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
    
    const networkPassphrase = getNetworkPassphrase(targetNetwork);
    
    const { signedTxXdr } = await freighterApi.signTransaction(xdr, {
      networkPassphrase,
    });
    
    return signedTxXdr;
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
