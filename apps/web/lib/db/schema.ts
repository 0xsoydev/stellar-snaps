import { pgTable, text, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';

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

// ============ DEVELOPERS TABLE ============

export const developers = pgTable('developers', {
  id: text('id').primaryKey(),
  walletAddress: text('wallet_address').notNull().unique(),
  name: text('name'),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Developer = typeof developers.$inferSelect;
export type NewDeveloper = typeof developers.$inferInsert;

// ============ API KEYS TABLE ============

export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  developerId: text('developer_id').notNull().references(() => developers.id, { onDelete: 'cascade' }),
  keyHash: text('key_hash').notNull().unique(),
  keyPrefix: text('key_prefix').notNull(), // First 8 chars for display: "sk_live_a1b2..."
  name: text('name').default('Default'),
  createdAt: timestamp('created_at').defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
  revokedAt: timestamp('revoked_at'),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

// ============ AUTH CHALLENGES TABLE ============

export const authChallenges = pgTable('auth_challenges', {
  id: text('id').primaryKey(),
  walletAddress: text('wallet_address').notNull(),
  challenge: text('challenge').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
