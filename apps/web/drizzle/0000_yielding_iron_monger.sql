CREATE TYPE "public"."registry_status" AS ENUM('pending', 'trusted', 'unverified', 'blocked');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"developer_id" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"name" text DEFAULT 'Default',
	"created_at" timestamp DEFAULT now(),
	"last_used_at" timestamp,
	"revoked_at" timestamp,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "auth_challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"challenge" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "auth_challenges_challenge_unique" UNIQUE("challenge")
);
--> statement-breakpoint
CREATE TABLE "developers" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"name" text,
	"email" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "developers_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "registry" (
	"domain" text PRIMARY KEY NOT NULL,
	"status" "registry_status" DEFAULT 'pending' NOT NULL,
	"name" text,
	"description" text,
	"icon" text,
	"owner_wallet" text,
	"contact_email" text,
	"registered_at" timestamp DEFAULT now(),
	"verified_at" timestamp,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "snaps" (
	"id" text PRIMARY KEY NOT NULL,
	"creator" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"destination" text NOT NULL,
	"asset_code" text DEFAULT 'XLM',
	"asset_issuer" text,
	"amount" text,
	"memo" text,
	"memo_type" text DEFAULT 'MEMO_TEXT',
	"network" text DEFAULT 'testnet',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_developer_id_developers_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."developers"("id") ON DELETE cascade ON UPDATE no action;