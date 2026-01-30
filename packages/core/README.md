# @stellar-snaps/core

Core SDK for [Stellar Snaps](https://stellar-snaps.vercel.app) - shareable payment links for the Stellar blockchain.

## Installation

```bash
npm install @stellar-snaps/core
# or
pnpm add @stellar-snaps/core
```

## Quick Start

```typescript
import { StellarSnapsClient } from '@stellar-snaps/core';

// Initialize client with your API key
const client = new StellarSnapsClient({
  apiKey: 'snaps_your_api_key',
  baseUrl: 'https://stellar-snaps.vercel.app', // optional
});

// Create a payment snap
const snap = await client.createSnap({
  title: 'Coffee Payment',
  description: 'Pay for your coffee',
  destination: 'GXXXXX...', // Stellar address
  amount: '5',
  asset: 'USDC',
});

console.log(snap.url); // https://stellar-snaps.vercel.app/s/abc123
```

## API Reference

### StellarSnapsClient

#### `createSnap(options)`
Create a new payment snap.

```typescript
const snap = await client.createSnap({
  title: 'Payment Title',
  description: 'Optional description',
  destination: 'GXXXXX...', // Required: Stellar address
  amount: '10.50',          // Optional: fixed amount
  asset: 'XLM',             // 'XLM' or 'USDC' (default: 'XLM')
  memo: 'order-123',        // Optional: memo
  memoType: 'text',         // 'text' | 'id' | 'hash'
});
```

#### `getSnap(id)`
Fetch a snap by ID.

```typescript
const snap = await client.getSnap('abc123');
```

#### `listSnaps()`
List all your snaps.

```typescript
const snaps = await client.listSnaps();
```

#### `deleteSnap(id)`
Delete a snap.

```typescript
await client.deleteSnap('abc123');
```

### Self-Hosting Discovery

If you want payment links on your domain to be detected by the Stellar Snaps extension:

```typescript
import { generateDiscoveryFile } from '@stellar-snaps/core';

// Generate .well-known/stellar-snap.json content
const discovery = generateDiscoveryFile({
  name: 'My Store',
  description: 'Accept payments for my store',
  pattern: '/pay/:id',
  endpoint: 'https://mystore.com/api/snap',
});

// Serve this at: https://mystore.com/.well-known/stellar-snap.json
```

## Types

```typescript
import type { 
  Snap,
  CreateSnapOptions,
  PaymentTransaction,
  DiscoveryFile 
} from '@stellar-snaps/core';
```

## Get API Key

1. Go to [stellar-snaps.vercel.app/developers/hub/api-keys](https://stellar-snaps.vercel.app/developers/hub/api-keys)
2. Sign in with your email
3. Create a new API key

## License

MIT
