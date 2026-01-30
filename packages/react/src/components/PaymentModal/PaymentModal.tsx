/**
 * PaymentModal - Modal dialog for payments
 */

import React, { ReactNode, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePayment, PaymentStatus } from '../../hooks/usePayment';
import { useFreighter } from '../../hooks/useFreighter';
import { cn, formatAmount, getExplorerUrl } from '../../utils';
import type { Network } from '@stellar-snaps/core';

export interface PaymentModalProps {
  // Modal state
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  
  // Payment details
  /** Title */
  title?: string;
  /** Description */
  description?: string;
  /** Destination address */
  destination: string;
  /** Amount */
  amount: string;
  /** Asset code */
  assetCode?: string;
  /** Asset issuer */
  assetIssuer?: string;
  /** Memo */
  memo?: string;
  /** Memo type */
  memoType?: 'MEMO_TEXT' | 'MEMO_ID' | 'MEMO_HASH' | 'MEMO_RETURN';
  /** Network */
  network?: Network;
  
  // Styling
  /** Modal class name */
  className?: string;
  /** Overlay class name */
  overlayClassName?: string;
  /** Modal styles */
  style?: React.CSSProperties;
  
  // Behavior
  /** Close on overlay click */
  closeOnOverlayClick?: boolean;
  /** Close on Escape key */
  closeOnEsc?: boolean;
  /** Close on successful payment */
  closeOnSuccess?: boolean;
  /** Delay before closing on success (ms) */
  closeDelay?: number;
  
  // Slots
  slots?: {
    header?: ReactNode;
    footer?: ReactNode;
    beforeAmount?: ReactNode;
    afterAmount?: ReactNode;
  };
  
  // Callbacks
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
  
  // Portal
  /** Portal container (default: document.body) */
  portalTo?: Element;
  
  // Headless
  render?: (props: PaymentModalRenderProps) => ReactNode;
}

export interface PaymentModalRenderProps {
  isOpen: boolean;
  close: () => void;
  status: PaymentStatus;
  paying: boolean;
  txHash: string | null;
  error: Error | null;
  wallet: string | null;
  connected: boolean;
  pay: () => Promise<void>;
  connect: () => Promise<void>;
}

export function PaymentModal({
  isOpen,
  onClose,
  title = 'Complete Payment',
  description,
  destination,
  amount,
  assetCode = 'XLM',
  assetIssuer,
  memo,
  memoType,
  network = 'testnet',
  className,
  overlayClassName,
  style,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  closeOnSuccess = true,
  closeDelay = 2000,
  slots = {},
  onSuccess,
  onError,
  portalTo,
  render,
}: PaymentModalProps) {
  const { wallet, connected, connect } = useFreighter({ network });
  
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
      
      if (closeOnSuccess) {
        setTimeout(() => {
          onClose();
          reset();
        }, closeDelay);
      }
    },
    onError,
  });
  
  // Handle Escape key
  useEffect(() => {
    if (!closeOnEsc || !isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !paying) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeOnEsc, isOpen, paying, onClose]);
  
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget && !paying) {
      onClose();
    }
  };
  
  const handlePay = async () => {
    if (!connected) {
      await connect();
    }
    await pay();
  };
  
  // Headless render
  if (render) {
    return (
      <>
        {render({
          isOpen,
          close: onClose,
          status,
          paying,
          txHash,
          error,
          wallet,
          connected,
          pay: handlePay,
          connect: async () => { await connect(); },
        })}
      </>
    );
  }
  
  if (!isOpen) return null;
  
  const modalContent = (
    <div
      className={cn('snaps-modal-overlay', overlayClassName)}
      onClick={handleOverlayClick}
    >
      <div className={cn('snaps-modal', className)} style={style}>
        {/* Header */}
        <div className="snaps-modal-header">
          {slots.header ?? <h2 className="snaps-modal-title">{title}</h2>}
          <button
            className="snaps-modal-close"
            onClick={onClose}
            disabled={paying}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        
        {/* Body */}
        <div className="snaps-modal-body">
          {description && (
            <p style={{ color: 'var(--snaps-text-secondary)', marginBottom: '16px' }}>
              {description}
            </p>
          )}
          
          {slots.beforeAmount}
          
          <div className="snaps-card-amount" style={{ textAlign: 'center' }}>
            {amount}
            <span className="snaps-card-amount-asset">{assetCode}</span>
          </div>
          
          {slots.afterAmount}
          
          {/* Network badge */}
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <span className={cn('snaps-badge', network === 'testnet' ? 'snaps-badge-warning' : 'snaps-badge-success')}>
              {network}
            </span>
          </div>
          
          {/* Success state */}
          {status === 'success' && txHash && (
            <div className="snaps-tx-status snaps-tx-status-success" style={{ marginTop: '16px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Payment successful!</span>
              <a
                href={getExplorerUrl(txHash, network)}
                target="_blank"
                rel="noopener noreferrer"
                className="snaps-tx-link"
              >
                View
              </a>
            </div>
          )}
          
          {/* Error state */}
          {status === 'error' && error && (
            <div className="snaps-tx-status snaps-tx-status-error" style={{ marginTop: '16px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{error.message}</span>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="snaps-modal-footer">
          {slots.footer ?? (
            <>
              <button
                className="snaps-btn snaps-btn-ghost"
                onClick={onClose}
                disabled={paying}
              >
                Cancel
              </button>
              <button
                className="snaps-btn snaps-btn-solid"
                onClick={handlePay}
                disabled={paying || status === 'success'}
              >
                {paying && <span className="snaps-spinner" />}
                {!connected ? 'Connect Wallet' : 
                 status === 'success' ? 'Done' :
                 paying ? 'Processing...' : 'Pay Now'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
  
  // Use portal
  const container = portalTo ?? (typeof document !== 'undefined' ? document.body : null);
  
  if (container) {
    return createPortal(modalContent, container);
  }
  
  return modalContent;
}

// Hook for managing modal state
export function usePaymentModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}
