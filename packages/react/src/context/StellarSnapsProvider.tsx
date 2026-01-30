/**
 * StellarSnapsProvider - Global context for Stellar Snaps React components
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { Network } from '@stellar-snaps/core';
import { Theme, lightTheme, darkTheme, ThemeName, themeToCssVars } from '../themes';

// ============ TYPES ============

export interface WalletState {
  address: string | null;
  connected: boolean;
  connecting: boolean;
}

export interface StellarSnapsContextValue {
  // Wallet state
  wallet: WalletState;
  connect: () => Promise<string | null>;
  disconnect: () => void;
  
  // Configuration
  network: Network;
  setNetwork: (network: Network) => void;
  baseUrl: string;
  
  // Theme
  theme: Theme;
  themeName: ThemeName;
  setTheme: (theme: ThemeName | Theme) => void;
  
  // Freighter availability
  freighterAvailable: boolean;
}

export interface StellarSnapsProviderProps {
  children: ReactNode;
  
  /** Default network (default: 'testnet') */
  network?: Network;
  
  /** API base URL (default: 'https://stellar-snaps.vercel.app') */
  baseUrl?: string;
  
  /** Theme: 'light', 'dark', or custom Theme object */
  theme?: ThemeName | Theme;
  
  /** Auto-connect to wallet on mount */
  autoConnect?: boolean;
}

// ============ CONTEXT ============

const StellarSnapsContext = createContext<StellarSnapsContextValue | null>(null);

// ============ PROVIDER ============

export function StellarSnapsProvider({
  children,
  network: initialNetwork = 'testnet',
  baseUrl = 'https://stellar-snaps.vercel.app',
  theme: initialTheme = 'light',
  autoConnect = false,
}: StellarSnapsProviderProps) {
  // Network state
  const [network, setNetwork] = useState<Network>(initialNetwork);
  
  // Theme state
  const [themeName, setThemeName] = useState<ThemeName>(
    typeof initialTheme === 'string' ? initialTheme : 'none'
  );
  const [customTheme, setCustomTheme] = useState<Theme | null>(
    typeof initialTheme === 'object' ? initialTheme : null
  );
  
  // Wallet state
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    connected: false,
    connecting: false,
  });
  
  // Freighter availability
  const [freighterAvailable, setFreighterAvailable] = useState(false);
  
  // Check for Freighter on mount
  useEffect(() => {
    const checkFreighter = () => {
      const available = typeof window !== 'undefined' && 
        // @ts-expect-error - Freighter types
        (!!window.freighter || !!window.freighterApi);
      setFreighterAvailable(available);
    };
    
    checkFreighter();
    
    // Check again after a short delay (Freighter may inject later)
    const timeout = setTimeout(checkFreighter, 1000);
    return () => clearTimeout(timeout);
  }, []);
  
  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && freighterAvailable) {
      connect();
    }
  }, [autoConnect, freighterAvailable]);
  
  // Connect to Freighter
  const connect = useCallback(async (): Promise<string | null> => {
    if (!freighterAvailable) {
      console.warn('[StellarSnaps] Freighter is not installed');
      return null;
    }
    
    setWallet(prev => ({ ...prev, connecting: true }));
    
    try {
      // @ts-expect-error - Freighter types
      const freighter = window.freighter || window.freighterApi;
      const publicKey = await freighter.getPublicKey();
      
      setWallet({
        address: publicKey,
        connected: true,
        connecting: false,
      });
      
      return publicKey;
    } catch (error) {
      console.error('[StellarSnaps] Failed to connect:', error);
      setWallet(prev => ({ ...prev, connecting: false }));
      return null;
    }
  }, [freighterAvailable]);
  
  // Disconnect
  const disconnect = useCallback(() => {
    setWallet({
      address: null,
      connected: false,
      connecting: false,
    });
  }, []);
  
  // Set theme
  const setTheme = useCallback((theme: ThemeName | Theme) => {
    if (typeof theme === 'string') {
      setThemeName(theme);
      setCustomTheme(null);
    } else {
      setThemeName('none');
      setCustomTheme(theme);
    }
  }, []);
  
  // Get current theme
  const theme: Theme = customTheme || (themeName === 'dark' ? darkTheme : lightTheme);
  
  // Context value
  const value: StellarSnapsContextValue = {
    wallet,
    connect,
    disconnect,
    network,
    setNetwork,
    baseUrl,
    theme,
    themeName,
    setTheme,
    freighterAvailable,
  };
  
  // Apply theme CSS variables
  const themeStyle = themeName !== 'none' ? themeToCssVars(theme) : {};
  
  return (
    <StellarSnapsContext.Provider value={value}>
      <div style={themeStyle as React.CSSProperties} className={themeName === 'dark' ? 'snaps-dark' : ''}>
        {children}
      </div>
    </StellarSnapsContext.Provider>
  );
}

// ============ HOOK ============

export function useStellarSnaps(): StellarSnapsContextValue {
  const context = useContext(StellarSnapsContext);
  
  if (!context) {
    throw new Error(
      'useStellarSnaps must be used within a StellarSnapsProvider. ' +
      'Wrap your app with <StellarSnapsProvider>.'
    );
  }
  
  return context;
}

// Optional context access (doesn't throw if not in provider)
export function useStellarSnapsOptional(): StellarSnapsContextValue | null {
  return useContext(StellarSnapsContext);
}
