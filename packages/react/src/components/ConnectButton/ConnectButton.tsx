/**
 * ConnectButton - Wallet connection button with dropdown
 */

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { useFreighter } from '../../hooks/useFreighter';
import { cn, truncateAddress, getAccountExplorerUrl } from '../../utils';
import type { Network } from '@stellar-snaps/core';

export interface ConnectButtonProps {
  // Labels
  /** Label when disconnected */
  connectLabel?: string;
  /** Label when connected - can be a function that receives the address */
  connectedLabel?: string | ((address: string) => string);
  /** Label while connecting */
  connectingLabel?: string;
  
  // Behavior
  /** Show dropdown when connected */
  showDropdown?: boolean;
  /** Show copy address option in dropdown */
  showCopyAddress?: boolean;
  /** Show disconnect option in dropdown */
  showDisconnect?: boolean;
  /** Show explorer link in dropdown */
  showExplorer?: boolean;
  
  // Styling
  /** Additional class name */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant */
  variant?: 'solid' | 'outline' | 'ghost';
  
  // Custom dropdown items
  /** Additional dropdown items */
  dropdownItems?: Array<{
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  }>;
  
  // Network for explorer links
  network?: Network;
  
  // Callbacks
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  
  // Headless mode
  /** Render function for complete control */
  render?: (props: ConnectButtonRenderProps) => ReactNode;
}

export interface ConnectButtonRenderProps {
  wallet: string | null;
  connected: boolean;
  connecting: boolean;
  isInstalled: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  truncatedAddress: string | null;
}

export function ConnectButton({
  connectLabel = 'Connect Wallet',
  connectedLabel,
  connectingLabel = 'Connecting...',
  showDropdown = true,
  showCopyAddress = true,
  showDisconnect = true,
  showExplorer = true,
  className,
  style,
  size = 'md',
  variant = 'solid',
  dropdownItems = [],
  network = 'testnet',
  onConnect,
  onDisconnect,
  onError,
  render,
}: ConnectButtonProps) {
  const { wallet, connected, connecting, isInstalled, connect, disconnect } = useFreighter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const truncatedAddress = wallet ? truncateAddress(wallet) : null;
  
  const handleConnect = async () => {
    try {
      const address = await connect();
      if (address) {
        onConnect?.(address);
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  };
  
  const handleDisconnect = () => {
    disconnect();
    setDropdownOpen(false);
    onDisconnect?.();
  };
  
  const handleCopyAddress = async () => {
    if (wallet) {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleOpenExplorer = () => {
    if (wallet) {
      window.open(getAccountExplorerUrl(wallet, network), '_blank');
    }
  };
  
  // Headless render
  if (render) {
    return (
      <>
        {render({
          wallet,
          connected,
          connecting,
          isInstalled,
          connect: handleConnect,
          disconnect: handleDisconnect,
          truncatedAddress,
        })}
      </>
    );
  }
  
  // Get display label
  const getDisplayLabel = () => {
    if (connecting) return connectingLabel;
    if (!connected) return connectLabel;
    
    if (typeof connectedLabel === 'function') {
      return connectedLabel(wallet!);
    }
    if (connectedLabel) {
      return connectedLabel;
    }
    return truncatedAddress;
  };
  
  // Button classes
  const buttonClasses = cn(
    'snaps-btn',
    `snaps-btn-${variant}`,
    `snaps-btn-${size}`,
    className
  );
  
  // Not installed state
  if (!isInstalled) {
    return (
      <a
        href="https://www.freighter.app/"
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses}
        style={style}
      >
        Install Freighter
      </a>
    );
  }
  
  // Disconnected state
  if (!connected) {
    return (
      <button
        className={buttonClasses}
        style={style}
        onClick={handleConnect}
        disabled={connecting}
      >
        {connecting && <span className="snaps-spinner" />}
        {getDisplayLabel()}
      </button>
    );
  }
  
  // Connected state with dropdown
  return (
    <div className="snaps-connect" ref={dropdownRef}>
      <button
        className={buttonClasses}
        style={style}
        onClick={() => showDropdown ? setDropdownOpen(!dropdownOpen) : handleDisconnect()}
      >
        {getDisplayLabel()}
        {showDropdown && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        )}
      </button>
      
      {showDropdown && dropdownOpen && (
        <div className="snaps-connect-dropdown">
          {showCopyAddress && (
            <button className="snaps-connect-dropdown-item" onClick={handleCopyAddress}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              {copied ? 'Copied!' : 'Copy Address'}
            </button>
          )}
          
          {showExplorer && (
            <button className="snaps-connect-dropdown-item" onClick={handleOpenExplorer}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              View on Explorer
            </button>
          )}
          
          {dropdownItems.map((item, index) => (
            <button
              key={index}
              className="snaps-connect-dropdown-item"
              onClick={() => {
                item.onClick();
                setDropdownOpen(false);
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          
          {showDisconnect && (
            <>
              <div className="snaps-connect-dropdown-divider" />
              <button className="snaps-connect-dropdown-item" onClick={handleDisconnect}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Disconnect
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
