/**
 * PayButton - Simple payment button component
 */

import React, { ReactNode } from 'react';
import { usePayment, PaymentStatus } from '../../hooks/usePayment';
import { useFreighter } from '../../hooks/useFreighter';
import { cn } from '../../utils';
import type { Network } from '@stellar-snaps/core';

export interface PayButtonProps {
  // Payment details
  /** Stellar destination address */
  destination: string;
  /** Payment amount */
  amount: string;
  /** Asset code (default: 'XLM') */
  assetCode?: string;
  /** Asset issuer (required for non-XLM) */
  assetIssuer?: string;
  /** Payment memo */
  memo?: string;
  /** Memo type */
  memoType?: 'MEMO_TEXT' | 'MEMO_ID' | 'MEMO_HASH' | 'MEMO_RETURN';
  /** Network */
  network?: Network;
  
  // Labels
  /** Default label */
  label?: string;
  /** Label while connecting */
  connectingLabel?: string;
  /** Label while processing */
  loadingLabel?: string;
  /** Label on success */
  successLabel?: string;
  /** Label on error */
  errorLabel?: string;
  
  // Styling
  /** Additional class name */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant */
  variant?: 'solid' | 'outline' | 'ghost';
  
  // Behavior
  /** Show connect button if wallet not connected */
  connectFirst?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Reset to initial state after success (ms) */
  resetAfter?: number;
  
  // Callbacks
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: PaymentStatus) => void;
  
  // Headless mode
  render?: (props: PayButtonRenderProps) => ReactNode;
}

export interface PayButtonRenderProps {
  pay: () => Promise<void>;
  status: PaymentStatus;
  paying: boolean;
  txHash: string | null;
  error: Error | null;
  wallet: string | null;
  connected: boolean;
  connect: () => Promise<void>;
  reset: () => void;
}

export function PayButton({
  destination,
  amount,
  assetCode = 'XLM',
  assetIssuer,
  memo,
  memoType,
  network = 'testnet',
  label = 'Pay Now',
  connectingLabel = 'Connecting...',
  loadingLabel = 'Processing...',
  successLabel = 'Paid!',
  errorLabel = 'Failed - Retry',
  className,
  style,
  size = 'md',
  variant = 'solid',
  connectFirst = true,
  disabled = false,
  resetAfter,
  onSuccess,
  onError,
  onStatusChange,
  render,
}: PayButtonProps) {
  const { wallet, connected, connecting, connect } = useFreighter({ network });
  
  const { status, paying, txHash, error, pay, reset } = usePayment({
    payment: {
      destination,
      amount,
      assetCode,
      assetIssuer,
      memo,
      memoType,
      network,
    },
    onSuccess: (hash) => {
      onSuccess?.(hash);
      
      // Auto-reset after success
      if (resetAfter) {
        setTimeout(reset, resetAfter);
      }
    },
    onError,
    onStatusChange,
  });
  
  const handleClick = async () => {
    if (!connected && connectFirst) {
      await connect();
    } else {
      await pay();
    }
  };
  
  // Headless render
  if (render) {
    return (
      <>
        {render({
          pay: handleClick,
          status,
          paying,
          txHash,
          error,
          wallet,
          connected,
          connect: async () => { await connect(); },
          reset,
        })}
      </>
    );
  }
  
  // Determine label
  const getLabel = () => {
    if (connecting) return connectingLabel;
    if (!connected && connectFirst) return 'Connect Wallet';
    if (status === 'success') return successLabel;
    if (status === 'error') return errorLabel;
    if (paying) return loadingLabel;
    return label;
  };
  
  // Button classes
  const buttonClasses = cn(
    'snaps-btn',
    `snaps-btn-${variant}`,
    `snaps-btn-${size}`,
    status === 'success' && 'snaps-btn-success',
    status === 'error' && 'snaps-btn-error',
    className
  );
  
  return (
    <button
      className={buttonClasses}
      style={style}
      onClick={handleClick}
      disabled={disabled || paying || connecting}
    >
      {(paying || connecting) && <span className="snaps-spinner" />}
      {getLabel()}
    </button>
  );
}
