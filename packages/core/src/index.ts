/**
 * @stellar-snaps/core
 *
 * Developer SDK for Stellar Snaps - shareable payment links for Stellar.
 *
 * ## Self-Hosting (Your Own Domain)
 *
 * Use these utilities to accept payments on your own domain:
 *
 * ```typescript
 * import {
 *   generateDiscoveryFile,
 *   createSnapMetadata,
 * } from '@stellar-snaps/core';
 *
 * // 1. Generate discovery file for your domain
 * const discovery = generateDiscoveryFile({
 *   name: 'My Store',
 *   rules: [{ pathPattern: '/pay/*', apiPath: '/api/payment/*' }]
 * });
 * // Write to public/.well-known/stellar-snap.json
 *
 * // 2. Create metadata endpoint
 * // In /api/payment/[id]/route.ts:
 * return Response.json(createSnapMetadata({
 *   id: order.id,
 *   title: `Order #${order.id}`,
 *   destination: MERCHANT_WALLET,
 *   amount: order.total,
 * }));
 * ```
 *
 * ## Hosted Snaps (stellar-snaps.vercel.app)
 *
 * Use the API client for hosted shareable URLs:
 *
 * ```typescript
 * import { StellarSnapsClient } from '@stellar-snaps/core';
 *
 * const client = new StellarSnapsClient();
 * const { snap, url } = await client.createSnap({
 *   title: 'Coffee Payment',
 *   destination: 'GABC...',
 *   amount: '5.00',
 * });
 * ```
 *
 * ## Transaction Building
 *
 * Build and submit Stellar payments:
 *
 * ```typescript
 * import {
 *   buildPaymentTx,
 *   signWithFreighter,
 *   submitTx,
 * } from '@stellar-snaps/core';
 *
 * const xdr = await buildPaymentTx({ source, destination, amount });
 * const signed = await signWithFreighter(xdr, 'public');
 * const result = await submitTx(signed.signedXdr, 'public');
 * ```
 */

// ============ TYPES ============
export type {
  Network,
  MemoType,
  Snap,
  CreateSnapOptions,
  SnapResponse,
  DiscoveryRule,
  DiscoveryFile,
  PaymentTxOptions,
  TransactionResult,
  SignedTransaction,
  StellarSnapsConfig,
  ListSnapsOptions,
  SnapMetadata,
} from './types';

// ============ DISCOVERY (Self-Hosting) ============
export {
  generateDiscoveryFile,
  validateDiscoveryFile,
  createSnapMetadata,
  EXAMPLE_DISCOVERY_FILE,
  type GenerateDiscoveryOptions,
  type CreateSnapMetadataOptions,
} from './discovery';

// ============ API CLIENT (Hosted Snaps) ============
export { StellarSnapsClient } from './client';

// ============ TRANSACTIONS ============
export {
  buildPaymentTx,
  submitTx,
  accountExists,
  getAccountBalances,
} from './transaction';

// ============ FREIGHTER WALLET ============
export {
  isFreighterInstalled,
  connectFreighter,
  getFreighterAddress,
  signWithFreighter,
  checkFreighterNetwork,
} from './freighter';

// ============ LEGACY EXPORTS ============
// Keep backwards compatibility with existing code
export {
  createPaymentSnap,
  type PaymentSnapOptions,
  type PaymentSnapResult,
} from './create-payment-snap';

export {
  parseSnapUri,
  type ParsedSnap,
} from './parse-snap-uri';
