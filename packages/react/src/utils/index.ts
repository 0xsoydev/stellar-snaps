/**
 * Utility functions for @stellar-snaps/react
 */

/**
 * Merge class names, filtering out falsy values
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Truncate a Stellar address for display
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address || address.length < chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format amount with asset code
 */
export function formatAmount(amount: string, assetCode: string = 'XLM'): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return `${amount} ${assetCode}`;
  
  // Format with appropriate decimal places
  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 7,
  });
  
  return `${formatted} ${assetCode}`;
}

/**
 * Get explorer URL for a transaction
 */
export function getExplorerUrl(
  txHash: string,
  network: 'public' | 'testnet' = 'testnet'
): string {
  const base = network === 'public'
    ? 'https://stellar.expert/explorer/public'
    : 'https://stellar.expert/explorer/testnet';
  return `${base}/tx/${txHash}`;
}

/**
 * Get explorer URL for an account
 */
export function getAccountExplorerUrl(
  address: string,
  network: 'public' | 'testnet' = 'testnet'
): string {
  const base = network === 'public'
    ? 'https://stellar.expert/explorer/public'
    : 'https://stellar.expert/explorer/testnet';
  return `${base}/account/${address}`;
}
