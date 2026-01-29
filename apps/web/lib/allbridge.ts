/**
 * Allbridge Core integration for cross-chain payments
 * 
 * Allbridge Core is a cross-chain bridge for stablecoins (USDC/USDT)
 * supporting Base <-> Stellar routes.
 * 
 * API Base: https://core.api.allbridgecoreapi.net
 */

export const ALLBRIDGE_API_URL = 'https://core.api.allbridgecoreapi.net';

// Chain IDs in Allbridge system
export const ALLBRIDGE_CHAINS = {
  ETH: 1,
  BSC: 2,
  POL: 3,
  SOL: 4,
  TRX: 5,
  ARB: 6,
  SRB: 7,  // Stellar/Soroban
  AVA: 8,
  BAS: 9,  // Base
  OPT: 10,
  CEL: 11,
  SNC: 12, // Sonic
  SUI: 13,
  LIN: 14, // Linea
  UNI: 15, // Unichain
  ALG: 16, // Algorand
} as const;

export type AllbridgeChainSymbol = keyof typeof ALLBRIDGE_CHAINS;

// Messenger types
export const MESSENGERS = {
  ALLBRIDGE: 1,
  WORMHOLE: 2,
  CCTP: 3,
  CCTP_V2: 4,
  OFT: 5,
} as const;

// Token info from Allbridge API
export interface AllbridgeToken {
  symbol: string;
  name: string;
  tokenAddress: string;
  poolAddress: string;
  decimals: number;
  feeShare: string;
  originTokenAddress?: string; // For Stellar tokens
  cctpAddress?: string;
  cctpFeeShare?: string;
  poolInfo: {
    aValue: string;
    dValue: string;
    tokenBalance: string;
    vUsdBalance: string;
    totalLpAmount: string;
    accRewardPerShareP: string;
    p: number;
  };
  flags: {
    swap: boolean;
    pool: boolean;
  };
}

export interface AllbridgeChainInfo {
  tokens: AllbridgeToken[];
  chainId: number;
  bridgeAddress: string;
  swapAddress: string;
  transferTime: Record<string, Record<string, number | null>>;
  confirmations: number;
  txCostAmount: {
    swap: string;
    transfer: string;
    maxAmount: string;
  };
}

export interface ReceiveFeeResponse {
  fee: string;
  sourceNativeTokenPrice: string;
  exchangeRate: string;
  sourceChainId: number;
  destinationChainId: number;
  messenger: number;
  timestamp: string;
}

export interface TransferStatusResponse {
  txId: string;
  sourceChainSymbol: string;
  destinationChainSymbol: string;
  sendAmount: string;
  receiveAmount?: string;
  sourceToken: string;
  destinationToken: string;
  sender: string;
  recipient: string;
  status: 'Pending' | 'InProgress' | 'Complete' | 'Failed';
  sendTransactionHash?: string;
  receiveTransactionHash?: string;
}

// Supported source chains for cross-chain payments to Stellar
export const SUPPORTED_CHAINS = {
  BAS: {
    symbol: 'BAS',
    name: 'Base',
    icon: '/chains/base.svg',
    chainId: ALLBRIDGE_CHAINS.BAS,
    nativeToken: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
    evmChainId: 8453,
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: '/chains/eth.svg',
    chainId: ALLBRIDGE_CHAINS.ETH,
    nativeToken: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
    evmChainId: 1,
  },
  ARB: {
    symbol: 'ARB',
    name: 'Arbitrum',
    icon: '/chains/arb.svg',
    chainId: ALLBRIDGE_CHAINS.ARB,
    nativeToken: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    evmChainId: 42161,
  },
  POL: {
    symbol: 'POL',
    name: 'Polygon',
    icon: '/chains/pol.svg',
    chainId: ALLBRIDGE_CHAINS.POL,
    nativeToken: 'POL',
    rpcUrl: 'https://polygon-rpc.com',
    evmChainId: 137,
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    icon: '/chains/sol.svg',
    chainId: ALLBRIDGE_CHAINS.SOL,
    nativeToken: 'SOL',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    evmChainId: null, // Not EVM
  },
} as const;

export type SupportedChainId = keyof typeof SUPPORTED_CHAINS;

// Cache for token info
let tokenInfoCache: Record<string, AllbridgeChainInfo> | null = null;
let tokenInfoCacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Fetch token info from Allbridge API
 */
export async function getTokenInfo(): Promise<Record<string, AllbridgeChainInfo>> {
  const now = Date.now();
  if (tokenInfoCache && now - tokenInfoCacheTime < CACHE_TTL) {
    return tokenInfoCache;
  }

  const response = await fetch(`${ALLBRIDGE_API_URL}/token-info?filter=all`);
  if (!response.ok) {
    throw new Error(`Failed to fetch token info: ${response.status}`);
  }

  tokenInfoCache = await response.json();
  tokenInfoCacheTime = now;
  return tokenInfoCache!;
}

/**
 * Get receive fee for a cross-chain transfer
 */
export async function getReceiveFee(
  sourceChainId: number,
  destinationChainId: number,
  messenger: number = MESSENGERS.ALLBRIDGE
): Promise<ReceiveFeeResponse> {
  const response = await fetch(`${ALLBRIDGE_API_URL}/receive-fee`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceChainId,
      destinationChainId,
      messenger,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get receive fee: ${error}`);
  }

  return response.json();
}

/**
 * Get transfer status
 */
export async function getTransferStatus(
  chainSymbol: string,
  txId: string
): Promise<TransferStatusResponse> {
  const response = await fetch(`${ALLBRIDGE_API_URL}/chain/${chainSymbol}/${txId}`);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get transfer status: ${error}`);
  }

  return response.json();
}

/**
 * Calculate amount to be received after fees
 * Uses the vUSD stable-swap model
 */
export function calculateAmountOut(
  amountIn: string,
  sourceToken: AllbridgeToken,
  destToken: AllbridgeToken
): string {
  // Convert to vUSD using source pool
  const vUsd = swapToVUsd(
    BigInt(amountIn),
    sourceToken.decimals,
    sourceToken.poolInfo
  );
  
  // Convert from vUSD to destination token
  const amountOut = swapFromVUsd(
    vUsd,
    destToken.decimals,
    destToken.poolInfo
  );

  return amountOut.toString();
}

/**
 * Calculate amount to send to receive exact output
 */
export function calculateAmountIn(
  amountOut: string,
  sourceToken: AllbridgeToken,
  destToken: AllbridgeToken
): string {
  // Convert from destination to vUSD (reverse)
  const vUsd = swapFromVUsdReverse(
    BigInt(amountOut),
    destToken.decimals,
    destToken.poolInfo
  );
  
  // Convert from vUSD to source (reverse)
  const amountIn = swapToVUsdReverse(
    vUsd,
    sourceToken.decimals,
    sourceToken.poolInfo
  );

  return amountIn.toString();
}

// System precision for vUSD (9 decimals)
const SYSTEM_PRECISION = 9;

/**
 * Swap to vUSD (using pool curve)
 */
function swapToVUsd(
  amount: bigint,
  decimals: number,
  poolInfo: AllbridgeToken['poolInfo']
): bigint {
  const { aValue, dValue, tokenBalance, vUsdBalance } = poolInfo;
  
  // Convert amount to system precision
  const amountSP = convertPrecision(amount, decimals, SYSTEM_PRECISION);
  
  // Simple approximation for fee calculation
  // In production, use the full curve math
  const feeShare = 0.003; // 0.3% typical fee
  const result = amountSP - BigInt(Math.floor(Number(amountSP) * feeShare));
  
  return result;
}

/**
 * Swap from vUSD (using pool curve)
 */
function swapFromVUsd(
  vUsdAmount: bigint,
  decimals: number,
  poolInfo: AllbridgeToken['poolInfo']
): bigint {
  // Convert from system precision to token decimals
  const amount = convertPrecision(vUsdAmount, SYSTEM_PRECISION, decimals);
  
  // Apply destination fee
  const feeShare = 0.003;
  const result = amount - BigInt(Math.floor(Number(amount) * feeShare));
  
  return result;
}

/**
 * Reverse swap from vUSD
 */
function swapFromVUsdReverse(
  amount: bigint,
  decimals: number,
  poolInfo: AllbridgeToken['poolInfo']
): bigint {
  const feeShare = 0.003;
  const amountBeforeFee = BigInt(Math.ceil(Number(amount) / (1 - feeShare)));
  return convertPrecision(amountBeforeFee, decimals, SYSTEM_PRECISION);
}

/**
 * Reverse swap to vUSD
 */
function swapToVUsdReverse(
  vUsdAmount: bigint,
  decimals: number,
  poolInfo: AllbridgeToken['poolInfo']
): bigint {
  const feeShare = 0.003;
  const amountBeforeFee = BigInt(Math.ceil(Number(vUsdAmount) / (1 - feeShare)));
  return convertPrecision(amountBeforeFee, SYSTEM_PRECISION, decimals);
}

/**
 * Convert between decimal precisions
 */
function convertPrecision(amount: bigint, fromDecimals: number, toDecimals: number): bigint {
  if (fromDecimals === toDecimals) return amount;
  if (fromDecimals > toDecimals) {
    return amount / BigInt(10 ** (fromDecimals - toDecimals));
  }
  return amount * BigInt(10 ** (toDecimals - fromDecimals));
}

/**
 * Format amount for display
 */
export function formatAmount(amount: string | bigint, decimals: number): string {
  const value = typeof amount === 'string' ? BigInt(amount) : amount;
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const fraction = value % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 4);
  return `${whole}.${fractionStr}`;
}

/**
 * Parse amount from string to base units
 */
export function parseAmount(amount: string, decimals: number): string {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return whole + paddedFraction;
}

/**
 * Get the USDC token for a chain
 */
export async function getUsdcToken(chainSymbol: string): Promise<AllbridgeToken | null> {
  const tokenInfo = await getTokenInfo();
  const chain = tokenInfo[chainSymbol];
  if (!chain) return null;
  return chain.tokens.find(t => t.symbol === 'USDC') || null;
}

/**
 * Get transfer time estimate in milliseconds
 */
export async function getTransferTime(
  sourceChain: string,
  destChain: string
): Promise<number | null> {
  const tokenInfo = await getTokenInfo();
  const source = tokenInfo[sourceChain];
  if (!source) return null;
  
  const times = source.transferTime[destChain];
  if (!times) return null;
  
  // Prefer allbridge messenger
  return times.allbridge || times.wormhole || null;
}

/**
 * Build quote response for frontend
 */
export interface AllbridgeQuote {
  sourceChain: string;
  sourceToken: AllbridgeToken;
  destChain: string;
  destToken: AllbridgeToken;
  amountIn: string;
  amountInFormatted: string;
  amountOut: string;
  amountOutFormatted: string;
  bridgeFee: string;
  bridgeFeeUsd: string;
  gasFee: string;
  gasFeeNative: string;
  estimatedTime: number;
  bridgeAddress: string;
  messenger: number;
}

export async function getQuote(
  sourceChainSymbol: SupportedChainId,
  amountOutStellar: string, // Amount merchant should receive (in base units)
  stellarAddress: string
): Promise<AllbridgeQuote> {
  const tokenInfo = await getTokenInfo();
  
  const sourceChain = tokenInfo[sourceChainSymbol];
  const destChain = tokenInfo['SRB'];
  
  if (!sourceChain || !destChain) {
    throw new Error('Chain not supported');
  }

  const sourceToken = sourceChain.tokens.find(t => t.symbol === 'USDC');
  const destToken = destChain.tokens.find(t => t.symbol === 'USDC');
  
  if (!sourceToken || !destToken) {
    throw new Error('USDC not available on chain');
  }

  // Calculate amount user needs to send
  const amountIn = calculateAmountIn(amountOutStellar, sourceToken, destToken);
  
  // Get gas fee
  const feeResponse = await getReceiveFee(
    sourceChain.chainId,
    destChain.chainId,
    MESSENGERS.ALLBRIDGE
  );
  
  // Get transfer time
  const transferTime = await getTransferTime(sourceChainSymbol, 'SRB');

  return {
    sourceChain: sourceChainSymbol,
    sourceToken,
    destChain: 'SRB',
    destToken,
    amountIn,
    amountInFormatted: formatAmount(amountIn, sourceToken.decimals),
    amountOut: amountOutStellar,
    amountOutFormatted: formatAmount(amountOutStellar, destToken.decimals),
    bridgeFee: calculateBridgeFee(amountIn, sourceToken),
    bridgeFeeUsd: calculateBridgeFeeUsd(amountIn, sourceToken),
    gasFee: feeResponse.fee,
    gasFeeNative: formatGasFee(feeResponse.fee, feeResponse.sourceNativeTokenPrice),
    estimatedTime: transferTime || 180000, // Default 3 min
    bridgeAddress: sourceChain.bridgeAddress,
    messenger: MESSENGERS.ALLBRIDGE,
  };
}

function calculateBridgeFee(amount: string, token: AllbridgeToken): string {
  const feeShare = parseFloat(token.feeShare);
  const fee = BigInt(Math.floor(Number(amount) * feeShare));
  return fee.toString();
}

function calculateBridgeFeeUsd(amount: string, token: AllbridgeToken): string {
  const feeShare = parseFloat(token.feeShare);
  const fee = Number(amount) / (10 ** token.decimals) * feeShare;
  return fee.toFixed(2);
}

function formatGasFee(feeWei: string, nativePrice: string): string {
  const feeEth = Number(feeWei) / 1e18;
  const feeUsd = feeEth * Number(nativePrice);
  return `${feeEth.toFixed(6)} ETH (~$${feeUsd.toFixed(2)})`;
}
