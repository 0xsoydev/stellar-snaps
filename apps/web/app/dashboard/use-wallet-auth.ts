'use client';

import { useState, useEffect, useCallback } from 'react';
import * as freighterApi from '@stellar/freighter-api';
import { Buffer } from 'buffer';

const SESSION_KEY = 'stellar-snaps-session';

interface Session {
  token: string;
  walletAddress: string;
  expiresAt: string;
}

export function useWalletAuth() {
  const [address, setAddress] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState('');

  // Load session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Session;
        // Check if session is still valid
        if (new Date(parsed.expiresAt) > new Date()) {
          setSession(parsed);
          setAddress(parsed.walletAddress);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  // Check if wallet is connected
  const checkConnection = useCallback(async () => {
    try {
      const { isConnected } = await freighterApi.isConnected();
      if (isConnected && !session) {
        const { address: addr } = await freighterApi.getAddress();
        if (addr) setAddress(addr);
      }
    } catch (err) {
      console.error('Connection check failed:', err);
    }
  }, [session]);

  useEffect(() => {
    if (!session) {
      checkConnection();
    }
  }, [checkConnection, session]);

  // Connect wallet
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError('');

    try {
      const accessResult = await freighterApi.requestAccess();
      if (accessResult.error) {
        setError(accessResult.error);
        setIsConnecting(false);
        return;
      }

      const { address: addr } = await freighterApi.getAddress();
      if (addr) {
        setAddress(addr);
      } else {
        setError('Failed to get address. Please unlock your wallet and try again.');
      }
    } catch (err: unknown) {
      console.error('Connect failed:', err);
      const message = err instanceof Error ? err.message : 'Connection failed';
      if (message.includes('Freighter') || message.includes('Extension')) {
        setError('Freighter wallet not found. Please install it from freighter.app');
      } else {
        setError(message);
      }
    }

    setIsConnecting(false);
  }, []);

  // Sign challenge and create session
  const signIn = useCallback(async () => {
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsSigning(true);
    setError('');

    try {
      // 1. Get challenge from server
      const challengeRes = await fetch('/api/auth/wallet/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (!challengeRes.ok) {
        const data = await challengeRes.json();
        throw new Error(data.error || 'Failed to get challenge');
      }

      const { challenge } = await challengeRes.json();

      // 2. Sign the challenge with Freighter
      const signResult = await freighterApi.signMessage(challenge, {
        address,
      });

      if (signResult.error || !signResult.signedMessage) {
        throw new Error(signResult.error || 'Signing cancelled');
      }

      // Handle both Buffer (v3) and string (v4) formats
      let signatureHex: string;
      if (typeof signResult.signedMessage === 'string') {
        signatureHex = signResult.signedMessage;
      } else {
        // Buffer - convert to hex
        signatureHex = Buffer.from(signResult.signedMessage).toString('hex');
      }

      // 3. Verify signature and get session token
      const verifyRes = await fetch('/api/auth/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          challenge,
          signedMessage: signatureHex,
        }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || 'Failed to verify signature');
      }

      const sessionData: Session = await verifyRes.json();
      
      // 4. Store session
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      setSession(sessionData);

    } catch (err: unknown) {
      console.error('Sign in failed:', err);
      setError(err instanceof Error ? err.message : 'Sign in failed');
    }

    setIsSigning(false);
  }, [address]);

  // Disconnect and clear session
  const disconnect = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setAddress(null);
  }, []);

  // Check if we have a valid session
  const isAuthenticated = Boolean(session && new Date(session.expiresAt) > new Date());

  return {
    address,
    session,
    isAuthenticated,
    isConnecting,
    isSigning,
    error,
    connect,
    signIn,
    disconnect,
    checkConnection,
  };
}
