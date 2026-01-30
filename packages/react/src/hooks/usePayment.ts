/**
 * usePayment - Hook for handling the payment flow
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

// Stellar SDK server URLs
const HORIZON_URLS = {
  public: 'https://horizon.stellar.org',
  testnet: 'https://horizon-testnet.stellar.org',
};

export function usePayment(options: UsePaymentOptions): UsePaymentResult {
  const { payment, onSuccess, onError, onStatusChange } = options;
  
  const context = useStellarSnapsOptional();
  const { wallet, connect, signTransaction, getNetworkPassphrase } = useFreighter();
  
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
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
      
      // Step 2: Build transaction
      updateStatus('building');
      
      // Fetch account to get sequence number
      const accountResponse = await fetch(`${horizonUrl}/accounts/${sourceAddress}`);
      if (!accountResponse.ok) {
        if (accountResponse.status === 404) {
          throw new Error('Account not found. Please fund your account first.');
        }
        throw new Error(`Failed to fetch account: ${accountResponse.status}`);
      }
      const account = await accountResponse.json();
      
      // Build the transaction using XDR (simplified - real implementation would use stellar-sdk)
      // For now, we'll use the Horizon API to build and submit
      
      // Step 3: Create payment operation
      const asset = payment.assetCode === 'XLM' || !payment.assetCode
        ? { asset_type: 'native' }
        : { 
            asset_type: 'credit_alphanum4',
            asset_code: payment.assetCode,
            asset_issuer: payment.assetIssuer,
          };
      
      // Build transaction XDR
      // Note: In a real implementation, you would use @stellar/stellar-sdk
      // This is a simplified version that works with Horizon's tx builder
      const txBuilderUrl = `${horizonUrl}/transactions`;
      
      // For the actual implementation, we need to use stellar-sdk
      // For now, we'll throw a helpful error
      updateStatus('signing');
      
      // Since we don't have stellar-sdk, let's use a workaround
      // We'll construct a basic payment transaction XDR
      const txXdr = await buildPaymentXdr({
        source: sourceAddress,
        destination: payment.destination,
        amount: payment.amount ?? '0',
        asset: payment.assetCode ?? 'XLM',
        assetIssuer: payment.assetIssuer,
        memo: payment.memo,
        sequence: (BigInt(account.sequence) + BigInt(1)).toString(),
        network,
      });
      
      // Step 4: Sign with Freighter
      const signedXdr = await signTransaction(txXdr, network);
      
      // Step 5: Submit transaction
      updateStatus('submitting');
      
      const submitResponse = await fetch(txBuilderUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `tx=${encodeURIComponent(signedXdr)}`,
      });
      
      const result = await submitResponse.json();
      
      if (!submitResponse.ok) {
        throw new Error(result.extras?.result_codes?.operations?.[0] || result.title || 'Transaction failed');
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
  }, [payment, wallet, connect, signTransaction, context, onSuccess, onError, updateStatus]);
  
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

// Simplified XDR builder (would use stellar-sdk in production)
async function buildPaymentXdr(options: {
  source: string;
  destination: string;
  amount: string;
  asset: string;
  assetIssuer?: string;
  memo?: string;
  sequence: string;
  network: Network;
}): Promise<string> {
  // In production, you would use @stellar/stellar-sdk to build this
  // For now, we'll use a fetch to a helper endpoint or throw
  
  // Check if stellar-sdk is available globally (some apps might include it)
  // @ts-expect-error - checking for global StellarSdk
  if (typeof window !== 'undefined' && window.StellarSdk) {
    // @ts-expect-error - using global StellarSdk
    const StellarSdk = window.StellarSdk;
    const server = new StellarSdk.Horizon.Server(
      options.network === 'public' 
        ? 'https://horizon.stellar.org'
        : 'https://horizon-testnet.stellar.org'
    );
    
    const sourceAccount = await server.loadAccount(options.source);
    
    let asset;
    if (options.asset === 'XLM' || !options.asset) {
      asset = StellarSdk.Asset.native();
    } else {
      asset = new StellarSdk.Asset(options.asset, options.assetIssuer);
    }
    
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: options.network === 'public'
        ? StellarSdk.Networks.PUBLIC
        : StellarSdk.Networks.TESTNET,
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: options.destination,
        asset,
        amount: options.amount,
      }))
      .setTimeout(180)
      .build();
    
    return transaction.toXDR();
  }
  
  // Fallback: throw error with helpful message
  throw new Error(
    'Transaction building requires @stellar/stellar-sdk. ' +
    'Please install it: npm install @stellar/stellar-sdk'
  );
}
