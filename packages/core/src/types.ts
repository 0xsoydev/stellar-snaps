/**
 * Core types for Stellar Snaps SDK
 */

// ============ NETWORK TYPES ============

export type Network = 'public' | 'testnet';
export type MemoType = 'MEMO_TEXT' | 'MEMO_ID' | 'MEMO_HASH' | 'MEMO_RETURN';

// ============ SNAP TYPES ============

export interface Snap {
  id: string;
  title: string;
  description?: string;
  destination: string;
  amount?: string;
  assetCode: string;
  assetIssuer?: string;
  memo?: string;
  memoType?: MemoType;
  network: Network;
  createdAt: string;
  creatorWallet?: string;
}

export interface CreateSnapOptions {
  /** Title displayed on the payment card */
  title: string;
  /** Optional description */
  description?: string;
  /** Stellar destination address (G...) */
  destination: string;
  /** Fixed amount (optional - if not set, payer enters amount) */
  amount?: string;
  /** Asset code (default: 'XLM') */
  assetCode?: string;
  /** Asset issuer (required for non-XLM assets) */
  assetIssuer?: string;
  /** Payment memo */
  memo?: string;
  /** Memo type (default: 'MEMO_TEXT') */
  memoType?: MemoType;
  /** Network (default: 'testnet') */
  network?: Network;
}

export interface SnapResponse {
  snap: Snap;
  url: string;
  shortUrl?: string;
}

// ============ DISCOVERY TYPES ============

export interface DiscoveryRule {
  /** URL path pattern with wildcards, e.g., '/pay/*' */
  pathPattern: string;
  /** API path to fetch snap metadata, e.g., '/api/snap/*' */
  apiPath: string;
}

export interface DiscoveryFile {
  /** Display name for your service */
  name: string;
  /** Optional description */
  description?: string;
  /** Optional icon URL */
  icon?: string;
  /** URL matching rules */
  rules: DiscoveryRule[];
}

// ============ TRANSACTION TYPES ============

export interface PaymentTxOptions {
  /** Source account public key */
  source: string;
  /** Destination account public key */
  destination: string;
  /** Amount to send */
  amount: string;
  /** Asset code (default: 'XLM') */
  assetCode?: string;
  /** Asset issuer (required for non-XLM) */
  assetIssuer?: string;
  /** Payment memo */
  memo?: string;
  /** Memo type */
  memoType?: MemoType;
  /** Network */
  network?: Network;
}

export interface TransactionResult {
  hash: string;
  success: boolean;
  ledger?: number;
  resultXdr?: string;
}

export interface SignedTransaction {
  signedXdr: string;
  networkPassphrase: string;
}

// ============ CLIENT TYPES ============

export interface StellarSnapsConfig {
  /** API base URL (default: 'https://stellar-snaps.vercel.app') */
  baseUrl?: string;
  /** Optional API key for authenticated requests */
  apiKey?: string;
}

export interface ListSnapsOptions {
  /** Filter by creator wallet */
  wallet?: string;
  /** Filter by network */
  network?: Network;
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
}

// ============ METADATA TYPES ============

export interface SnapMetadata {
  id: string;
  title: string;
  description?: string;
  destination: string;
  amount?: string;
  assetCode: string;
  assetIssuer?: string;
  memo?: string;
  memoType?: MemoType;
  network: Network;
}
