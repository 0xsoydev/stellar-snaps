'use client';

import { useState, useEffect, useCallback } from 'react';
import * as freighterApi from '@stellar/freighter-api';

export function useWalletConnection() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const checkConnection = useCallback(async () => {
    try {
      const { isConnected } = await freighterApi.isConnected();
      if (isConnected) {
        const { address: addr } = await freighterApi.getAddress();
        if (addr) setAddress(addr);
      }
    } catch (err) {
      console.error('Connection check failed:', err);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

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
      if (
        typeof message === 'string' &&
        (message.includes('Freighter') || message.includes('Extension'))
      ) {
        setError('Freighter wallet not found. Please install it from freighter.app');
      } else {
        setError(message);
      }
    }

    setIsConnecting(false);
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  return {
    address,
    isConnecting,
    error,
    connect,
    disconnect,
    checkConnection,
  };
}
