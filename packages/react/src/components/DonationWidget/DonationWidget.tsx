/**
 * DonationWidget - Preset amount donation component
 */

import React, { useState, ReactNode } from 'react';
import { usePayment, PaymentStatus } from '../../hooks/usePayment';
import { useFreighter } from '../../hooks/useFreighter';
import { cn, getExplorerUrl } from '../../utils';
import type { Network } from '@stellar-snaps/core';

export interface DonationWidgetProps {
  // Destination
  destination: string;
  
  // Configuration
  /** Title */
  title?: string;
  /** Description */
  description?: string;
  /** Preset amounts */
  presets?: number[];
  /** Allow custom amount input */
  allowCustom?: boolean;
  /** Default selected preset index */
  defaultPreset?: number;
  /** Asset code */
  assetCode?: string;
  /** Asset issuer */
  assetIssuer?: string;
  /** Memo prefix */
  memoPrefix?: string;
  /** Network */
  network?: Network;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  
  // Callbacks
  onSuccess?: (txHash: string, amount: string) => void;
  onError?: (error: Error) => void;
  
  // Headless
  render?: (props: DonationWidgetRenderProps) => ReactNode;
}

export interface DonationWidgetRenderProps {
  selectedAmount: string;
  setAmount: (amount: string) => void;
  customAmount: string;
  setCustomAmount: (amount: string) => void;
  isCustom: boolean;
  setIsCustom: (isCustom: boolean) => void;
  presets: number[];
  status: PaymentStatus;
  paying: boolean;
  txHash: string | null;
  error: Error | null;
  wallet: string | null;
  connected: boolean;
  pay: () => Promise<void>;
  connect: () => Promise<void>;
}

export function DonationWidget({
  destination,
  title = 'Support this project',
  description,
  presets = [5, 10, 25, 50],
  allowCustom = true,
  defaultPreset = 1,
  assetCode = 'XLM',
  assetIssuer,
  memoPrefix = 'donation',
  network = 'testnet',
  className,
  style,
  onSuccess,
  onError,
  render,
}: DonationWidgetProps) {
  const [selectedIndex, setSelectedIndex] = useState(defaultPreset);
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  
  const amount = isCustom ? customAmount : String(presets[selectedIndex] ?? 0);
  
  const { wallet, connected, connect } = useFreighter({ network });
  
  const { status, paying, txHash, error, pay, reset } = usePayment({
    payment: {
      destination,
      amount,
      assetCode,
      assetIssuer,
      memo: `${memoPrefix}:${amount}`,
      network,
    },
    onSuccess: (hash) => onSuccess?.(hash, amount),
    onError,
  });
  
  const handlePresetClick = (index: number) => {
    setSelectedIndex(index);
    setIsCustom(false);
  };
  
  const handleCustomClick = () => {
    setIsCustom(true);
  };
  
  const handlePay = async () => {
    if (!connected) {
      await connect();
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }
    
    await pay();
  };
  
  // Headless render
  if (render) {
    return (
      <>
        {render({
          selectedAmount: amount,
          setAmount: (amt) => {
            setCustomAmount(amt);
            setIsCustom(true);
          },
          customAmount,
          setCustomAmount,
          isCustom,
          setIsCustom,
          presets,
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
  
  return (
    <div className={cn('snaps-card', className)} style={style}>
      {/* Header */}
      <div className="snaps-card-header">
        <h3 className="snaps-card-title">{title}</h3>
        {description && <p className="snaps-card-description">{description}</p>}
      </div>
      
      {/* Preset buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {presets.map((preset, index) => (
          <button
            key={preset}
            className={cn(
              'snaps-btn',
              selectedIndex === index && !isCustom ? 'snaps-btn-solid' : 'snaps-btn-outline'
            )}
            onClick={() => handlePresetClick(index)}
            disabled={paying}
            style={{ flex: 1, minWidth: '60px' }}
          >
            {preset} {assetCode}
          </button>
        ))}
        
        {allowCustom && (
          <button
            className={cn(
              'snaps-btn',
              isCustom ? 'snaps-btn-solid' : 'snaps-btn-outline'
            )}
            onClick={handleCustomClick}
            disabled={paying}
            style={{ flex: 1, minWidth: '60px' }}
          >
            Custom
          </button>
        )}
      </div>
      
      {/* Custom amount input */}
      {isCustom && (
        <div style={{ marginBottom: '16px' }}>
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="Enter amount"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            disabled={paying}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '16px',
              border: '1px solid var(--snaps-border)',
              borderRadius: 'var(--snaps-radius)',
              background: 'var(--snaps-bg)',
              color: 'var(--snaps-text)',
            }}
          />
        </div>
      )}
      
      {/* Selected amount display */}
      {amount && parseFloat(amount) > 0 && (
        <div className="snaps-card-amount" style={{ textAlign: 'center', margin: '16px 0' }}>
          {amount}
          <span className="snaps-card-amount-asset">{assetCode}</span>
        </div>
      )}
      
      {/* Success state */}
      {status === 'success' && txHash && (
        <div className="snaps-tx-status snaps-tx-status-success" style={{ marginBottom: '16px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Thank you for your support!</span>
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
        <div className="snaps-tx-status snaps-tx-status-error" style={{ marginBottom: '16px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>{error.message}</span>
        </div>
      )}
      
      {/* Pay button */}
      <button
        className="snaps-btn snaps-btn-solid snaps-btn-lg"
        onClick={handlePay}
        disabled={paying || !amount || parseFloat(amount) <= 0 || status === 'success'}
        style={{ width: '100%' }}
      >
        {paying && <span className="snaps-spinner" />}
        {!connected ? 'Connect Wallet' :
         status === 'success' ? 'Donated!' :
         paying ? 'Processing...' : 'Donate Now'}
      </button>
    </div>
  );
}
