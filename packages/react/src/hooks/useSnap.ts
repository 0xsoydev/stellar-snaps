/**
 * useSnap - Hook for fetching snap metadata
 */

import { useState, useEffect, useCallback } from 'react';
import type { SnapMetadata, Network } from '@stellar-snaps/core';
import { useStellarSnapsOptional } from '../context/StellarSnapsProvider';

export interface UseSnapOptions {
  /** Base URL for hosted snaps API */
  baseUrl?: string;
}

export interface UseSnapResult {
  /** Snap metadata */
  snap: SnapMetadata | null;
  /** Loading state */
  loading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Refetch the snap */
  refetch: () => Promise<void>;
}

export function useSnap(
  snapId: string | null | undefined,
  options: UseSnapOptions = {}
): UseSnapResult {
  const context = useStellarSnapsOptional();
  const baseUrl = options.baseUrl ?? context?.baseUrl ?? 'https://stellar-snaps.vercel.app';
  
  const [snap, setSnap] = useState<SnapMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchSnap = useCallback(async () => {
    if (!snapId) {
      setSnap(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${baseUrl}/api/metadata/${snapId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch snap: ${response.status}`);
      }
      
      const data = await response.json();
      setSnap(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setSnap(null);
    } finally {
      setLoading(false);
    }
  }, [snapId, baseUrl]);
  
  useEffect(() => {
    fetchSnap();
  }, [fetchSnap]);
  
  return {
    snap,
    loading,
    error,
    refetch: fetchSnap,
  };
}

/**
 * useSnapMetadata - Hook for using inline snap metadata (not fetched)
 */
export interface UseSnapMetadataOptions {
  id?: string;
  title: string;
  description?: string;
  destination: string;
  amount?: string;
  assetCode?: string;
  assetIssuer?: string;
  memo?: string;
  memoType?: 'MEMO_TEXT' | 'MEMO_ID' | 'MEMO_HASH' | 'MEMO_RETURN';
  network?: Network;
}

export function useSnapMetadata(options: UseSnapMetadataOptions): SnapMetadata {
  return {
    id: options.id ?? `snap-${Date.now()}`,
    title: options.title,
    description: options.description,
    destination: options.destination,
    amount: options.amount,
    assetCode: options.assetCode ?? 'XLM',
    assetIssuer: options.assetIssuer,
    memo: options.memo,
    memoType: options.memoType,
    network: options.network ?? 'testnet',
  };
}
