/**
 * Transaction Builder Utilities
 *
 * Build and submit Stellar payment transactions.
 * Uses the hosted API to avoid bundling stellar-sdk in browser.
 */

import type { PaymentTxOptions, TransactionResult, Network } from './types';

const DEFAULT_API_URL = 'https://stellar-snaps.vercel.app';

const HORIZON_URLS: Record<Network, string> = {
  public: 'https://horizon.stellar.org',
  testnet: 'https://horizon-testnet.stellar.org',
};

/**
 * Build a payment transaction XDR
 *
 * This calls the hosted API to build the transaction, avoiding
 * the need to bundle stellar-sdk in your frontend.
 *
 * @example
 * ```typescript
 * const xdr = await buildPaymentTx({
 *   source: userWallet,
 *   destination: merchantWallet,
 *   amount: '10.00',
 *   assetCode: 'USDC',
 *   assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
 *   memo: 'order:123',
 *   network: 'public',
 * });
 * ```
 */
export async function buildPaymentTx(
  options: PaymentTxOptions,
  apiUrl: string = DEFAULT_API_URL
): Promise<string> {
  const {
    source,
    destination,
    amount,
    assetCode = 'XLM',
    assetIssuer,
    memo,
    memoType = 'MEMO_TEXT',
    network = 'testnet',
  } = options;

  const response = await fetch(`${apiUrl}/api/build-tx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source,
      destination,
      amount,
      assetCode,
      assetIssuer,
      memo,
      memoType,
      network,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to build transaction: ${error}`);
  }

  const data = await response.json() as { xdr: string };
  return data.xdr;
}

/**
 * Submit a signed transaction to the Stellar network
 *
 * @example
 * ```typescript
 * const result = await submitTx(signedXdr, 'public');
 * if (result.success) {
 *   console.log('Transaction hash:', result.hash);
 * }
 * ```
 */
export async function submitTx(
  signedXdr: string,
  network: Network = 'testnet'
): Promise<TransactionResult> {
  const horizonUrl = HORIZON_URLS[network];

  const response = await fetch(`${horizonUrl}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `tx=${encodeURIComponent(signedXdr)}`,
  });

  const data = await response.json() as {
    successful?: boolean;
    hash?: string;
    ledger?: number;
    result_xdr?: string;
    extras?: { result_codes?: unknown };
  };

  if (!response.ok) {
    const errorMessage = data.extras?.result_codes
      ? JSON.stringify(data.extras.result_codes)
      : 'Transaction failed';
    throw new Error(errorMessage);
  }

  return {
    success: data.successful ?? true,
    hash: data.hash ?? '',
    ledger: data.ledger,
    resultXdr: data.result_xdr,
  };
}

/**
 * Check if an account exists on the Stellar network
 */
export async function accountExists(
  address: string,
  network: Network = 'testnet'
): Promise<boolean> {
  const horizonUrl = HORIZON_URLS[network];

  try {
    const response = await fetch(`${horizonUrl}/accounts/${address}`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get account balances
 */
export async function getAccountBalances(
  address: string,
  network: Network = 'testnet'
): Promise<Array<{ asset: string; balance: string }>> {
  const horizonUrl = HORIZON_URLS[network];

  const response = await fetch(`${horizonUrl}/accounts/${address}`);

  if (!response.ok) {
    throw new Error('Account not found');
  }

  const data = await response.json() as {
    balances: Array<{
      asset_type: string;
      asset_code?: string;
      asset_issuer?: string;
      balance: string;
    }>;
  };

  return data.balances.map((b) => ({
    asset: b.asset_type === 'native' ? 'XLM' : `${b.asset_code}:${b.asset_issuer}`,
    balance: b.balance,
  }));
}
