/**
 * usePayment - Hook for handling the payment flow
 * 
 * Uses the /api/build-tx endpoint to build transactions server-side,
 * avoiding the need for @stellar/stellar-sdk on the client.
 */

import { useState, useCallback } from 'react';
import type { SnapMetadata, Network } from '@stellar-snaps/core';
import { useFreighter } from './useFreighter';
import { useStellarSnapsOptional } from '../context/StellarSnapsProvider';

export type PaymentStatus = 
  | 'idle'
  | 'connecting'
  | 'building'
  | 'signing'
  | 'submitting'
  | 'success'
  | 'error';

export interface PaymentDetails {
  destination: string;
  amount: string;
  assetCode?: string;
  assetIssuer?: string;
  memo?: string;
  memoType?: 'MEMO_TEXT' | 'MEMO_ID' | 'MEMO_HASH' | 'MEMO_RETURN';
  network?: Network;
}

export interface UsePaymentOptions {
  /** Payment details or snap metadata */
  payment: PaymentDetails | SnapMetadata | null;
  
  /** Called on successful payment */
  onSuccess?: (txHash: string) => void;
  
  /** Called on error */
  onError?: (error: Error) => void;
  
  /** Called when status changes */
  onStatusChange?: (status: PaymentStatus) => void;
  
  /** Custom base URL for build-tx endpoint (default: from context or stellar-snaps.vercel.app) */
  baseUrl?: string;
}

export interface UsePaymentResult {
  /** Current payment status */
  status: PaymentStatus;
  /** Whether payment is in progress */
  paying: boolean;
  /** Transaction hash (if successful) */
  txHash: string | null;
  /** Error (if failed) */
  error: Error | null;
  /** Initiate payment */
  pay: () => Promise<string | null>;
  /** Reset payment state */
  reset: () => void;
}

// Stellar Horizon URLs
const HORIZON_URLS = {
  public: 'https://horizon.stellar.org',
  testnet: 'https://horizon-testnet.stellar.org',
};

// Default API base URL
const DEFAULT_BASE_URL = 'https://stellar-snaps.vercel.app';

export function usePayment(options: UsePaymentOptions): UsePaymentResult {
  const { payment, onSuccess, onError, onStatusChange, baseUrl: optBaseUrl } = options;
  
  const context = useStellarSnapsOptional();
  const { wallet, connect, signTransaction } = useFreighter();
  
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Get base URL from options, context, or default
  const baseUrl = optBaseUrl ?? context?.baseUrl ?? DEFAULT_BASE_URL;
  
  const updateStatus = useCallback((newStatus: PaymentStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);
  
  const pay = useCallback(async (): Promise<string | null> => {
    if (!payment) {
      const err = new Error('No payment details provided');
      setError(err);
      onError?.(err);
      return null;
    }
    
    const network = payment.network ?? context?.network ?? 'testnet';
    const horizonUrl = HORIZON_URLS[network];
    
    try {
      // Step 1: Connect if not connected
      let sourceAddress = wallet;
      if (!sourceAddress) {
        updateStatus('connecting');
        sourceAddress = await connect();
        
        if (!sourceAddress) {
          throw new Error('Failed to connect wallet');
        }
      }
      
      // Step 2: Fetch account to get sequence number
      updateStatus('building');
      
      const accountResponse = await fetch(`${horizonUrl}/accounts/${sourceAddress}`);
      if (!accountResponse.ok) {
        if (accountResponse.status === 404) {
          throw new Error('Account not found. Please fund your account first.');
        }
        throw new Error(`Failed to fetch account: ${accountResponse.status}`);
      }
      const account = await accountResponse.json();
      
      // Step 3: Build transaction via API
      const buildResponse = await fetch(`${baseUrl}/api/build-tx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: sourceAddress,
          sequence: account.sequence,
          destination: payment.destination,
          amount: payment.amount ?? '0',
          assetCode: payment.assetCode ?? 'XLM',
          assetIssuer: payment.assetIssuer,
          memo: payment.memo,
          memoType: payment.memoType,
          network,
        }),
      });
      
      if (!buildResponse.ok) {
        const buildError = await buildResponse.json().catch(() => ({}));
        throw new Error(buildError.error || `Failed to build transaction: ${buildResponse.status}`);
      }
      
      const { xdr } = await buildResponse.json();
      
      if (!xdr) {
        throw new Error('No transaction XDR returned from build endpoint');
      }
      
      // Step 4: Sign with Freighter
      updateStatus('signing');
      const signedXdr = await signTransaction(xdr, network);
      
      // Step 5: Submit transaction
      updateStatus('submitting');
      
      const submitResponse = await fetch(`${horizonUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `tx=${encodeURIComponent(signedXdr)}`,
      });
      
      const result = await submitResponse.json();
      
      if (!submitResponse.ok) {
        const errorCode = result.extras?.result_codes?.operations?.[0] 
          || result.extras?.result_codes?.transaction
          || result.title 
          || 'Transaction failed';
        throw new Error(errorCode);
      }
      
      const hash = result.hash;
      setTxHash(hash);
      updateStatus('success');
      onSuccess?.(hash);
      
      return hash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      updateStatus('error');
      onError?.(error);
      return null;
    }
  }, [payment, wallet, connect, signTransaction, context, baseUrl, onSuccess, onError, updateStatus]);
  
  const reset = useCallback(() => {
    setStatus('idle');
    setTxHash(null);
    setError(null);
  }, []);
  
  return {
    status,
    paying: ['connecting', 'building', 'signing', 'submitting'].includes(status),
    txHash,
    error,
    pay,
    reset,
  };
}
