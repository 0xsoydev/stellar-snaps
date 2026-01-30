/**
 * TxStatus - Transaction status display component
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { cn, getExplorerUrl } from '../../utils';
import type { Network } from '@stellar-snaps/core';

export type TransactionStatusType = 'pending' | 'success' | 'error';

export interface TxStatusProps {
  /** Transaction hash */
  txHash: string;
  /** Network */
  network?: Network;
  /** Initial status (will be verified) */
  status?: TransactionStatusType;
  /** Show explorer link */
  showLink?: boolean;
  /** Poll for confirmation */
  pollForConfirmation?: boolean;
  /** Poll interval (ms) */
  pollInterval?: number;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  
  // Callbacks
  onConfirmed?: () => void;
  onFailed?: (error: Error) => void;
  
  // Headless
  render?: (props: TxStatusRenderProps) => ReactNode;
}

export interface TxStatusRenderProps {
  status: TransactionStatusType;
  txHash: string;
  explorerUrl: string;
  ledger?: number;
}

export function TxStatus({
  txHash,
  network = 'testnet',
  status: initialStatus = 'pending',
  showLink = true,
  pollForConfirmation = true,
  pollInterval = 2000,
  className,
  style,
  onConfirmed,
  onFailed,
  render,
}: TxStatusProps) {
  const [status, setStatus] = useState<TransactionStatusType>(initialStatus);
  const [ledger, setLedger] = useState<number | undefined>();
  
  const explorerUrl = getExplorerUrl(txHash, network);
  const horizonUrl = network === 'public'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';
  
  // Poll for confirmation
  useEffect(() => {
    if (!pollForConfirmation || status !== 'pending') return;
    
    let cancelled = false;
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`${horizonUrl}/transactions/${txHash}`);
        
        if (response.ok) {
          const tx = await response.json();
          if (!cancelled) {
            setStatus('success');
            setLedger(tx.ledger);
            onConfirmed?.();
          }
        } else if (response.status === 404) {
          // Still pending, continue polling
        } else {
          throw new Error(`Transaction check failed: ${response.status}`);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus('error');
          onFailed?.(error instanceof Error ? error : new Error(String(error)));
        }
      }
    };
    
    const interval = setInterval(checkStatus, pollInterval);
    checkStatus(); // Check immediately
    
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [txHash, horizonUrl, pollForConfirmation, pollInterval, status]);
  
  // Headless render
  if (render) {
    return (
      <>
        {render({
          status,
          txHash,
          explorerUrl,
          ledger,
        })}
      </>
    );
  }
  
  const statusClasses = cn(
    'snaps-tx-status',
    status === 'pending' && 'snaps-tx-status-pending',
    status === 'success' && 'snaps-tx-status-success',
    status === 'error' && 'snaps-tx-status-error',
    className
  );
  
  const getIcon = () => {
    switch (status) {
      case 'pending':
        return <span className="snaps-spinner" />;
      case 'success':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      case 'error':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
    }
  };
  
  const getMessage = () => {
    switch (status) {
      case 'pending':
        return 'Transaction pending...';
      case 'success':
        return ledger ? `Confirmed in ledger ${ledger}` : 'Transaction confirmed';
      case 'error':
        return 'Transaction failed';
    }
  };
  
  return (
    <div className={statusClasses} style={style}>
      {getIcon()}
      <span>{getMessage()}</span>
      {showLink && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="snaps-tx-link"
        >
          View
        </a>
      )}
    </div>
  );
}
