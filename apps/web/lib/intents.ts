/**
 * NEAR Intents (1Click) integration constants and utilities
 */

export const ONECLICK_API_URL = 'https://1click.chaindefuser.com';

// Stellar asset IDs in NEAR Intents format
export const STELLAR_ASSETS = {
  XLM: 'nep245:v2_1.omni.hot.tg:1100_111bzQBB5v7AhLyPMDwS8uJgQV24KaAPXtwyVWu2KXbbfQU6NXRCz',
  USDC: 'nep245:v2_1.omni.hot.tg:1100_111bzQBB65GxAPAVoxqmMcgYo5oS3txhqs1Uh1cgahKQUeTUq1TJu',
} as const;

// Stellar uses 7 decimal places
export const STELLAR_DECIMALS = 7;

// Supported source chains with their native assets
export const SUPPORTED_CHAINS = {
  eth: {
    name: 'Ethereum',
    symbol: 'ETH',
    icon: '/chains/eth.svg',
    assets: [
      { symbol: 'ETH', assetId: 'nep141:eth.omft.near', decimals: 18 },
      { symbol: 'USDC', assetId: 'nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near', decimals: 6 },
      { symbol: 'USDT', assetId: 'nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near', decimals: 6 },
    ],
  },
  base: {
    name: 'Base',
    symbol: 'ETH',
    icon: '/chains/base.svg',
    assets: [
      { symbol: 'ETH', assetId: 'nep141:base.omft.near', decimals: 18 },
      { symbol: 'USDC', assetId: 'nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near', decimals: 6 },
    ],
  },
  sol: {
    name: 'Solana',
    symbol: 'SOL',
    icon: '/chains/sol.svg',
    assets: [
      { symbol: 'SOL', assetId: 'nep141:sol.omft.near', decimals: 9 },
      { symbol: 'USDC', assetId: 'nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near', decimals: 6 },
    ],
  },
  arb: {
    name: 'Arbitrum',
    symbol: 'ETH',
    icon: '/chains/arb.svg',
    assets: [
      { symbol: 'ETH', assetId: 'nep141:arb.omft.near', decimals: 18 },
      { symbol: 'USDC', assetId: 'nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near', decimals: 6 },
    ],
  },
  pol: {
    name: 'Polygon',
    symbol: 'POL',
    icon: '/chains/pol.svg',
    assets: [
      { symbol: 'POL', assetId: 'nep245:v2_1.omni.hot.tg:137_11111111111111111111', decimals: 18 },
      { symbol: 'USDC', assetId: 'nep245:v2_1.omni.hot.tg:137_qiStmoQJDQPTebaPjgx5VBxZv6L', decimals: 6 },
    ],
  },
  bsc: {
    name: 'BNB Chain',
    symbol: 'BNB',
    icon: '/chains/bsc.svg',
    assets: [
      { symbol: 'BNB', assetId: 'nep245:v2_1.omni.hot.tg:56_11111111111111111111', decimals: 18 },
      { symbol: 'USDC', assetId: 'nep245:v2_1.omni.hot.tg:56_2w93GqMcEmQFDru84j3HZZWt557r', decimals: 18 },
    ],
  },
  avax: {
    name: 'Avalanche',
    symbol: 'AVAX',
    icon: '/chains/avax.svg',
    assets: [
      { symbol: 'AVAX', assetId: 'nep245:v2_1.omni.hot.tg:43114_11111111111111111111', decimals: 18 },
      { symbol: 'USDC', assetId: 'nep245:v2_1.omni.hot.tg:43114_3atVJH3r5c4GqiSYmg9fECvjc47o', decimals: 6 },
    ],
  },
} as const;

export type ChainId = keyof typeof SUPPORTED_CHAINS;

export interface QuoteRequest {
  // What user pays with
  sourceChain: ChainId;
  sourceAsset: string; // Symbol like "ETH", "USDC"
  
  // What merchant receives on Stellar  
  destinationAsset: 'XLM' | 'USDC';
  amountOut: string; // Amount merchant should receive (in base units)
  
  // Addresses
  destinationAddress: string; // Stellar address
  refundAddress: string; // User's source chain address
  
  // Options
  dry?: boolean; // If true, don't generate deposit address
}

export interface QuoteResponse {
  // Deposit info
  depositAddress: string;
  depositMemo?: string;
  
  // Amounts
  amountIn: string; // What user needs to send (base units)
  amountInFormatted: string; // Human readable
  amountOut: string; // What merchant receives (base units)
  amountOutFormatted: string; // Human readable
  
  // Fees
  feeFormatted?: string;
  feeUsd?: string;
  
  // Timing
  expiresAt: string; // ISO timestamp
  estimatedTime: number; // Seconds
}

export type IntentStatus = 
  | 'PENDING_DEPOSIT'
  | 'PROCESSING' 
  | 'SUCCESS'
  | 'INCOMPLETE_DEPOSIT'
  | 'REFUNDED'
  | 'FAILED';

export interface StatusResponse {
  status: IntentStatus;
  depositTxHash?: string;
  settlementTxHash?: string;
  refundTxHash?: string;
  amountReceived?: string;
  amountDelivered?: string;
  error?: string;
}

/**
 * Convert amount to base units for a given asset
 */
export function toBaseUnits(amount: string | number, decimals: number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Math.floor(num * Math.pow(10, decimals)).toString();
}

/**
 * Convert base units to human readable amount
 */
export function fromBaseUnits(baseUnits: string, decimals: number): string {
  const num = parseInt(baseUnits, 10);
  return (num / Math.pow(10, decimals)).toString();
}

/**
 * Get the 1Click asset ID for a Stellar asset
 */
export function getStellarAssetId(assetCode: string): string {
  if (assetCode === 'USDC') return STELLAR_ASSETS.USDC;
  return STELLAR_ASSETS.XLM; // Default to XLM
}

/**
 * Get source asset details from chain and symbol
 */
export function getSourceAsset(chainId: ChainId, symbol: string) {
  const chain = SUPPORTED_CHAINS[chainId];
  if (!chain) return null;
  return chain.assets.find(a => a.symbol === symbol) || null;
}

/**
 * Generate unique intent ID
 */
export function generateIntentId(): string {
  return `int_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
}
