/**
 * Wallet types and interfaces for cross-chain payments
 */

export type ChainType = 'stellar' | 'evm' | 'solana';

export type ChainId = 
  | 'stellar'
  | 'eth' 
  | 'base' 
  | 'arb' 
  | 'pol' 
  | 'bsc' 
  | 'avax'
  | 'sol';

export interface WalletInfo {
  type: ChainType;
  chainId: ChainId;
  name: string;           // "MetaMask", "Phantom", "Freighter"
  icon: string;           // Emoji or icon URL
  address: string;        // Connected address
  connected: boolean;
}

export interface DetectedWallet {
  type: ChainType;
  chainId: ChainId;
  name: string;
  icon: string;
  available: boolean;     // Is wallet extension installed?
  provider: any;          // The actual provider object
}

export interface WalletConnector {
  detect(): Promise<DetectedWallet | null>;
  connect(): Promise<WalletInfo>;
  disconnect(): Promise<void>;
  getAddress(): Promise<string>;
  getChainId(): Promise<string | number>;
  switchChain?(chainId: string | number): Promise<void>;
  sendTransaction(to: string, amount: string, asset?: string): Promise<string>;
}

// Chain configurations for EVM networks
export const EVM_CHAINS: Record<string, { chainId: number; name: string; rpcUrl?: string }> = {
  eth: { chainId: 1, name: 'Ethereum' },
  base: { chainId: 8453, name: 'Base' },
  arb: { chainId: 42161, name: 'Arbitrum One' },
  pol: { chainId: 137, name: 'Polygon' },
  bsc: { chainId: 56, name: 'BNB Smart Chain' },
  avax: { chainId: 43114, name: 'Avalanche C-Chain' },
};

// Map chain ID numbers to our chain IDs
export const CHAIN_ID_MAP: Record<number, ChainId> = {
  1: 'eth',
  8453: 'base',
  42161: 'arb',
  137: 'pol',
  56: 'bsc',
  43114: 'avax',
};
