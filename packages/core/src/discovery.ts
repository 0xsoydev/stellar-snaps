/**
 * Discovery File Utilities for Self-Hosting
 *
 * Generate and validate .well-known/stellar-snap.json files
 * for self-hosted Stellar Snaps integrations.
 */

import type { DiscoveryFile, DiscoveryRule, SnapMetadata, Network, MemoType } from './types';

export interface GenerateDiscoveryOptions {
  /** Display name for your service */
  name: string;
  /** Optional description */
  description?: string;
  /** Optional icon URL (absolute or relative) */
  icon?: string;
  /** URL matching rules */
  rules: DiscoveryRule[];
}

/**
 * Generate a discovery file for self-hosting
 *
 * The discovery file tells the Stellar Snaps extension how to find
 * payment metadata on your domain. Place it at:
 * /.well-known/stellar-snap.json
 *
 * @example
 * ```typescript
 * const discovery = generateDiscoveryFile({
 *   name: 'Coffee Shop',
 *   rules: [
 *     { pathPattern: '/pay/*', apiPath: '/api/payment/*' }
 *   ]
 * });
 * // Write to public/.well-known/stellar-snap.json
 * ```
 */
export function generateDiscoveryFile(options: GenerateDiscoveryOptions): DiscoveryFile {
  const { name, description, icon, rules } = options;

  if (!name || name.trim().length === 0) {
    throw new Error('Discovery file requires a name');
  }

  if (!rules || rules.length === 0) {
    throw new Error('Discovery file requires at least one rule');
  }

  // Validate rules
  for (const rule of rules) {
    if (!rule.pathPattern || !rule.apiPath) {
      throw new Error('Each rule must have pathPattern and apiPath');
    }

    // Count wildcards - they should match
    const pathWildcards = (rule.pathPattern.match(/\*/g) || []).length;
    const apiWildcards = (rule.apiPath.match(/\*/g) || []).length;

    if (pathWildcards !== apiWildcards) {
      throw new Error(
        'Wildcard mismatch in rule: pathPattern has ' + pathWildcards + ' wildcards, ' +
        'apiPath has ' + apiWildcards + '. They must match.'
      );
    }
  }

  return {
    name: name.trim(),
    description: description?.trim(),
    icon,
    rules,
  };
}

/**
 * Validate an existing discovery file
 */
export function validateDiscoveryFile(file: unknown): file is DiscoveryFile {
  if (!file || typeof file !== 'object') return false;

  const f = file as Record<string, unknown>;

  if (typeof f.name !== 'string' || f.name.trim().length === 0) return false;
  if (!Array.isArray(f.rules) || f.rules.length === 0) return false;

  for (const rule of f.rules) {
    if (!rule || typeof rule !== 'object') return false;
    if (typeof rule.pathPattern !== 'string') return false;
    if (typeof rule.apiPath !== 'string') return false;
  }

  return true;
}

export interface CreateSnapMetadataOptions {
  /** Unique identifier for this payment */
  id: string;
  /** Title displayed on the payment card */
  title: string;
  /** Optional description */
  description?: string;
  /** Stellar destination address (G...) */
  destination: string;
  /** Payment amount (optional for user-input amounts) */
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

/**
 * Create snap metadata for your API endpoint
 *
 * Use this in your API route to return properly formatted
 * metadata that the extension can render.
 *
 * @example
 * ```typescript
 * // In your API route: /api/payment/[id]/route.ts
 * import { createSnapMetadata } from '@stellar-snaps/core';
 *
 * export async function GET(req, { params }) {
 *   const order = await getOrder(params.id);
 *
 *   return Response.json(createSnapMetadata({
 *     id: order.id,
 *     title: `Order #${order.id}`,
 *     destination: MERCHANT_WALLET,
 *     amount: order.total.toString(),
 *     assetCode: 'USDC',
 *     memo: `order:${order.id}`,
 *     network: 'public',
 *   }));
 * }
 * ```
 */
export function createSnapMetadata(options: CreateSnapMetadataOptions): SnapMetadata {
  const {
    id,
    title,
    description,
    destination,
    amount,
    assetCode = 'XLM',
    assetIssuer,
    memo,
    memoType = 'MEMO_TEXT',
    network = 'testnet',
  } = options;

  if (!id || !title || !destination) {
    throw new Error('id, title, and destination are required');
  }

  // Basic validation for Stellar address
  if (!destination.startsWith('G') || destination.length !== 56) {
    throw new Error('Invalid Stellar destination address');
  }

  // Asset issuer required for non-XLM
  if (assetCode !== 'XLM' && !assetIssuer) {
    throw new Error('assetIssuer is required for non-XLM assets');
  }

  return {
    id,
    title,
    description,
    destination,
    amount,
    assetCode,
    assetIssuer,
    memo,
    memoType,
    network,
  };
}

/**
 * Example discovery file for reference
 */
export const EXAMPLE_DISCOVERY_FILE: DiscoveryFile = {
  name: 'Example Store',
  description: 'Accept Stellar payments for products',
  icon: '/logo.png',
  rules: [
    {
      pathPattern: '/pay/*',
      apiPath: '/api/snap/*',
    },
    {
      pathPattern: '/checkout/*',
      apiPath: '/api/checkout/*/payment',
    },
  ],
};
