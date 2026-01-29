import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Registry status enum
export const registryStatusEnum = pgEnum('registry_status', ['pending', 'trusted', 'unverified', 'blocked']);

// ============ SNAPS TABLE ============

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

// ============ REGISTRY TABLE ============

export const registry = pgTable('registry', {
  // Domain as primary key (e.g., 'stellar-snaps.vercel.app', 'mystore.com')
  domain: text('domain').primaryKey(),
  
  // Status: pending (awaiting review), trusted, unverified, blocked
  status: registryStatusEnum('status').default('pending').notNull(),
  
  // Display info
  name: text('name'),
  description: text('description'),
  icon: text('icon'),
  
  // Contact/ownership
  ownerWallet: text('owner_wallet'),
  contactEmail: text('contact_email'),
  
  // Timestamps
  registeredAt: timestamp('registered_at').defaultNow(),
  verifiedAt: timestamp('verified_at'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type RegistryEntry = typeof registry.$inferSelect;
export type NewRegistryEntry = typeof registry.$inferInsert;
