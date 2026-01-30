/**
 * PaymentCard - Display payment details with pay button
 */

import React, { ReactNode } from 'react';
import { useSnap } from '../../hooks/useSnap';
import { usePayment, PaymentStatus } from '../../hooks/usePayment';
import { useFreighter } from '../../hooks/useFreighter';
import { cn, formatAmount, truncateAddress, getExplorerUrl } from '../../utils';
import type { SnapMetadata, Network } from '@stellar-snaps/core';

export interface PaymentCardProps {
  // Data source - either provide snap data or fetch by ID
  /** Snap metadata (if you have it) */
  snap?: SnapMetadata;
  /** Snap ID to fetch */
  snapId?: string;
  
  // OR inline payment details
  /** Title */
  title?: string;
  /** Description */
  description?: string;
  /** Destination address */
  destination?: string;
  /** Amount */
  amount?: string;
  /** Asset code */
  assetCode?: string;
  /** Asset issuer */
  assetIssuer?: string;
  /** Memo */
  memo?: string;
  /** Network */
  network?: Network;
  
  // Layout
  /** Card layout */
  layout?: 'vertical' | 'horizontal' | 'compact';
  /** Show description */
  showDescription?: boolean;
  /** Show destination address */
  showDestination?: boolean;
  /** Show network badge */
  showNetwork?: boolean;
  /** Show transaction link on success */
  showTxLink?: boolean;
  
  // Styling
  /** Additional class name */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  
  // Button customization
  /** Pay button label */
  buttonLabel?: string;
  /** Button size */
  buttonSize?: 'sm' | 'md' | 'lg';
  /** Button variant */
  buttonVariant?: 'solid' | 'outline' | 'ghost';
  
  // Slots for customization
  slots?: {
    beforeTitle?: ReactNode;
    afterTitle?: ReactNode;
    beforeAmount?: ReactNode;
    afterAmount?: ReactNode;
    beforeButton?: ReactNode;
    afterButton?: ReactNode;
    footer?: ReactNode;
  };
  
  // Component overrides
  components?: {
    Header?: React.ComponentType<{ snap: SnapMetadata }>;
    Amount?: React.ComponentType<{ amount: string; assetCode: string }>;
    Button?: React.ComponentType<PaymentCardButtonProps>;
    Footer?: React.ComponentType<{ txHash?: string; network: Network }>;
  };
  
  // Callbacks
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
  
  // Headless mode
  render?: (props: PaymentCardRenderProps) => ReactNode;
}

export interface PaymentCardButtonProps {
  onClick: () => void;
  disabled: boolean;
  paying: boolean;
  status: PaymentStatus;
  label: string;
}

export interface PaymentCardRenderProps {
  snap: SnapMetadata | null;
  loading: boolean;
  error: Error | null;
  status: PaymentStatus;
  paying: boolean;
  txHash: string | null;
  wallet: string | null;
  connected: boolean;
  pay: () => Promise<void>;
  connect: () => Promise<void>;
}

export function PaymentCard({
  snap: propSnap,
  snapId,
  title,
  description,
  destination,
  amount,
  assetCode = 'XLM',
  assetIssuer,
  memo,
  network = 'testnet',
  layout = 'vertical',
  showDescription = true,
  showDestination = false,
  showNetwork = true,
  showTxLink = true,
  className,
  style,
  buttonLabel = 'Pay Now',
  buttonSize = 'md',
  buttonVariant = 'solid',
  slots = {},
  components = {},
  onSuccess,
  onError,
  render,
}: PaymentCardProps) {
  // Fetch snap if ID provided
  const { snap: fetchedSnap, loading: fetchLoading, error: fetchError } = useSnap(snapId);
  
  // Build snap from props if not provided
  const inlineSnap: SnapMetadata | null = destination ? {
    id: `inline-${Date.now()}`,
    title: title ?? 'Payment',
    description,
    destination,
    amount,
    assetCode,
    assetIssuer,
    memo,
    network,
  } : null;
  
  // Use prop snap, fetched snap, or inline snap
  const snap = propSnap ?? fetchedSnap ?? inlineSnap;
  const loading = snapId ? fetchLoading : false;
  const error = snapId ? fetchError : null;
  
  // Payment hook
  const { wallet, connected, connect } = useFreighter({ network: snap?.network });
  const { status, paying, txHash, error: payError, pay } = usePayment({
    payment: snap,
    onSuccess,
    onError,
  });
  
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
          snap,
          loading,
          error: error ?? payError,
          status,
          paying,
          txHash,
          wallet,
          connected,
          pay: handlePay,
          connect: async () => { await connect(); },
        })}
      </>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <div className={cn('snaps-card', className)} style={style}>
        <div className="snaps-card-loading">
          <span className="snaps-spinner" />
          <span>Loading payment...</span>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !snap) {
    return (
      <div className={cn('snaps-card', className)} style={style}>
        <div className="snaps-card-error">
          {error?.message ?? 'Payment not found'}
        </div>
      </div>
    );
  }
  
  // Custom components
  const HeaderComponent = components.Header;
  const AmountComponent = components.Amount;
  const ButtonComponent = components.Button;
  const FooterComponent = components.Footer;
  
  // Card classes
  const cardClasses = cn(
    'snaps-card',
    `snaps-card-${layout}`,
    className
  );
  
  // Button label based on status
  const getButtonLabel = () => {
    if (!connected) return 'Connect Wallet';
    if (status === 'success') return 'Paid!';
    if (status === 'error') return 'Retry';
    if (paying) return 'Processing...';
    return buttonLabel;
  };
  
  return (
    <div className={cardClasses} style={style}>
      {/* Header */}
      {HeaderComponent ? (
        <HeaderComponent snap={snap} />
      ) : (
        <div className="snaps-card-header">
          {slots.beforeTitle}
          <h3 className="snaps-card-title">{snap.title}</h3>
          {showDescription && snap.description && (
            <p className="snaps-card-description">{snap.description}</p>
          )}
          {slots.afterTitle}
          
          {showNetwork && (
            <span className={cn('snaps-badge', snap.network === 'testnet' ? 'snaps-badge-warning' : 'snaps-badge-success')}>
              {snap.network}
            </span>
          )}
        </div>
      )}
      
      {/* Amount */}
      {slots.beforeAmount}
      {AmountComponent ? (
        <AmountComponent amount={snap.amount ?? '0'} assetCode={snap.assetCode} />
      ) : (
        <div className="snaps-card-amount">
          {snap.amount ?? '—'}
          <span className="snaps-card-amount-asset">{snap.assetCode}</span>
        </div>
      )}
      {slots.afterAmount}
      
      {/* Destination */}
      {showDestination && (
        <div className="snaps-card-destination">
          <span className="snaps-card-destination-label">To:</span>
          <span className="snaps-card-destination-address">
            {truncateAddress(snap.destination, 8)}
          </span>
        </div>
      )}
      
      {/* Success message */}
      {status === 'success' && txHash && (
        <div className="snaps-tx-status snaps-tx-status-success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Payment successful!</span>
          {showTxLink && (
            <a
              href={getExplorerUrl(txHash, snap.network)}
              target="_blank"
              rel="noopener noreferrer"
              className="snaps-tx-link"
            >
              View transaction
            </a>
          )}
        </div>
      )}
      
      {/* Error message */}
      {status === 'error' && payError && (
        <div className="snaps-tx-status snaps-tx-status-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>{payError.message}</span>
        </div>
      )}
      
      {/* Button */}
      <div className="snaps-card-footer">
        {slots.beforeButton}
        {ButtonComponent ? (
          <ButtonComponent
            onClick={handlePay}
            disabled={paying || status === 'success'}
            paying={paying}
            status={status}
            label={getButtonLabel()}
          />
        ) : (
          <button
            className={cn(
              'snaps-btn',
              `snaps-btn-${buttonVariant}`,
              `snaps-btn-${buttonSize}`,
              status === 'success' && 'snaps-btn-success'
            )}
            onClick={handlePay}
            disabled={paying || status === 'success'}
            style={{ width: '100%' }}
          >
            {paying && <span className="snaps-spinner" />}
            {getButtonLabel()}
          </button>
        )}
        {slots.afterButton}
      </div>
      
      {/* Footer */}
      {FooterComponent && <FooterComponent txHash={txHash ?? undefined} network={snap.network} />}
      {slots.footer}
    </div>
  );
}
