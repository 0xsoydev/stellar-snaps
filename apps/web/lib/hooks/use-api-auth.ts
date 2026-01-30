'use client';

import { useState, useEffect, useCallback } from 'react';
import * as freighterApi from '@stellar/freighter-api';

const API_KEY_STORAGE_KEY = 'stellar-snaps-api-key';
const WALLET_STORAGE_KEY = 'stellar-snaps-wallet';

interface ApiKey {
  id: string;
  keyPrefix: string;
  name: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

interface UseApiAuthReturn {
  // Wallet state
  walletAddress: string | null;
  isWalletConnected: boolean;
  
  // API key state
  apiKey: string | null;
  isAuthenticated: boolean;
  
  // Loading states
  isConnecting: boolean;
  isAuthenticating: boolean;
  isLoading: boolean;
  
  // Error
  error: string | null;
  
  // Actions
  connectWallet: () => Promise<void>;
  authenticate: () => Promise<string | null>;
  logout: () => void;
  
  // API key management
  keys: ApiKey[];
  isLoadingKeys: boolean;
  fetchKeys: () => Promise<void>;
  createKey: (name?: string) => Promise<string | null>;
  revokeKey: (id: string) => Promise<boolean>;
}

export function useApiAuth(): UseApiAuthReturn {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [error, setError] = useState<string | null>(null);

  // Load stored values on mount
  useEffect(() => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    const storedWallet = localStorage.getItem(WALLET_STORAGE_KEY);
    
    if (storedKey) setApiKey(storedKey);
    if (storedWallet) setWalletAddress(storedWallet);
    
    // Check if wallet is still connected
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      const { isConnected } = await freighterApi.isConnected();
      if (isConnected) {
        const { address } = await freighterApi.getAddress();
        if (address) {
          setWalletAddress(address);
          localStorage.setItem(WALLET_STORAGE_KEY, address);
        }
      }
    } catch (err) {
      console.error('Wallet check failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const { isConnected } = await freighterApi.isConnected();
      if (!isConnected) {
        setError('Freighter wallet not found. Please install it from freighter.app');
        return;
      }

      const result = await freighterApi.requestAccess();
      if (result.error) {
        setError(result.error);
        return;
      }

      const { address } = await freighterApi.getAddress();
      if (address) {
        setWalletAddress(address);
        localStorage.setItem(WALLET_STORAGE_KEY, address);
      } else {
        setError('Failed to get wallet address');
      }
    } catch (err) {
      console.error('Connect failed:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const authenticate = useCallback(async (): Promise<string | null> => {
    if (!walletAddress) {
      setError('Wallet not connected');
      return null;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      // Step 1: Get challenge
      const challengeRes = await fetch('/api/auth/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      if (!challengeRes.ok) {
        const data = await challengeRes.json();
        throw new Error(data.error || 'Failed to get challenge');
      }

      const { challenge, message } = await challengeRes.json();

      // Step 2: Sign the message with Freighter
      const signResult = await freighterApi.signMessage(message, {
        address: walletAddress,
      });

      if (signResult.error) {
        throw new Error(signResult.error);
      }

      const signature = typeof signResult.signedMessage === 'string'
        ? signResult.signedMessage
        : Buffer.from(signResult.signedMessage || []).toString('base64');

      // Step 3: Verify and get API key
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          challenge,
          signature,
        }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || 'Authentication failed');
      }

      const { apiKey: newKey } = await verifyRes.json();
      
      setApiKey(newKey);
      localStorage.setItem(API_KEY_STORAGE_KEY, newKey);
      
      return newKey;
    } catch (err) {
      console.error('Auth failed:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      return null;
    } finally {
      setIsAuthenticating(false);
    }
  }, [walletAddress]);

  const logout = useCallback(() => {
    setApiKey(null);
    setWalletAddress(null);
    setKeys([]);
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem(WALLET_STORAGE_KEY);
  }, []);

  const fetchKeys = useCallback(async () => {
    if (!apiKey) return;

    setIsLoadingKeys(true);
    try {
      const res = await fetch('/api/keys', {
        headers: { 'X-API-Key': apiKey },
      });

      if (!res.ok) {
        if (res.status === 401) {
          // API key is invalid, clear it
          setApiKey(null);
          localStorage.removeItem(API_KEY_STORAGE_KEY);
          return;
        }
        throw new Error('Failed to fetch keys');
      }

      const data = await res.json();
      setKeys(data.keys || []);
    } catch (err) {
      console.error('Fetch keys failed:', err);
    } finally {
      setIsLoadingKeys(false);
    }
  }, [apiKey]);

  const createKey = useCallback(async (name?: string): Promise<string | null> => {
    if (!apiKey) return null;

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ name: name || 'New Key' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create key');
      }

      const data = await res.json();
      await fetchKeys(); // Refresh the list
      return data.apiKey; // Return the new key (only shown once!)
    } catch (err) {
      console.error('Create key failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to create key');
      return null;
    }
  }, [apiKey, fetchKeys]);

  const revokeKey = useCallback(async (id: string): Promise<boolean> => {
    if (!apiKey) return false;

    try {
      const res = await fetch(`/api/keys/${id}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': apiKey },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to revoke key');
      }

      await fetchKeys(); // Refresh the list
      return true;
    } catch (err) {
      console.error('Revoke key failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to revoke key');
      return false;
    }
  }, [apiKey, fetchKeys]);

  // Auto-fetch keys when API key is set
  useEffect(() => {
    if (apiKey) {
      fetchKeys();
    }
  }, [apiKey, fetchKeys]);

  return {
    walletAddress,
    isWalletConnected: !!walletAddress,
    apiKey,
    isAuthenticated: !!apiKey,
    isConnecting,
    isAuthenticating,
    isLoading,
    error,
    connectWallet,
    authenticate,
    logout,
    keys,
    isLoadingKeys,
    fetchKeys,
    createKey,
    revokeKey,
  };
}
