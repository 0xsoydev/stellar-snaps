import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

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
