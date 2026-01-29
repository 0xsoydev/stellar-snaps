import { pgTable, text, timestamp, decimal } from 'drizzle-orm/pg-core';

export const snaps = pgTable('snaps', {
  id: text('id').primaryKey(),
  creator: text('creator').notNull(),

  // Display
  title: text('title').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),

  // Payment
  destination: text('destination').notNull(),
  assetCode: text('asset_code').default('XLM'),
  assetIssuer: text('asset_issuer'),
  amount: text('amount'),
  memo: text('memo'),
  memoType: text('memo_type').default('MEMO_TEXT'),

  // Config
  network: text('network').default('testnet'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Snap = typeof snaps.$inferSelect;
export type NewSnap = typeof snaps.$inferInsert;

/**
 * Cross-chain payment intents via NEAR Intents
 * Tracks the full lifecycle of a cross-chain payment
 */
export const intents = pgTable('intents', {
  id: text('id').primaryKey(), // UUID we generate
  snapId: text('snap_id').notNull().references(() => snaps.id),
  
  // 1Click quote response
  depositAddress: text('deposit_address').notNull(), // Where user sends funds
  depositMemo: text('deposit_memo'), // For chains that need memo (XRP, etc.)
  
  // Source (what user pays with)
  sourceChain: text('source_chain').notNull(), // "eth", "sol", "base", etc.
  sourceAsset: text('source_asset').notNull(), // "ETH", "USDC", etc.
  sourceAssetId: text('source_asset_id').notNull(), // Full 1Click asset ID
  amountIn: text('amount_in').notNull(), // Amount user needs to deposit
  amountInFormatted: text('amount_in_formatted'), // Human readable
  
  // Destination (what merchant receives on Stellar)
  destinationAddress: text('destination_address').notNull(), // Stellar address
  destinationAsset: text('destination_asset').notNull(), // "XLM" or "USDC"
  amountOut: text('amount_out').notNull(), // Amount merchant receives
  amountOutFormatted: text('amount_out_formatted'), // Human readable
  
  // Refund
  refundAddress: text('refund_address').notNull(), // User's source chain address
  
  // Status tracking
  status: text('status').notNull().default('PENDING_DEPOSIT'),
  // PENDING_DEPOSIT, PROCESSING, SUCCESS, INCOMPLETE_DEPOSIT, REFUNDED, FAILED
  
  // Transaction hashes
  depositTxHash: text('deposit_tx_hash'), // User's deposit tx on source chain
  settlementTxHash: text('settlement_tx_hash'), // Settlement tx on Stellar
  refundTxHash: text('refund_tx_hash'), // If refunded
  
  // Timestamps
  quoteExpiresAt: timestamp('quote_expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

export type Intent = typeof intents.$inferSelect;
export type NewIntent = typeof intents.$inferInsert;
