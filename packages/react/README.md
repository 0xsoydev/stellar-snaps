# @stellar-snaps/react

React hooks and components for [Stellar Snaps](https://stellar-snaps.vercel.app) - shareable payment links for the Stellar blockchain.

## Installation

```bash
npm install @stellar-snaps/react @stellar-snaps/core
# or
pnpm add @stellar-snaps/react @stellar-snaps/core
```

## Quick Start

```tsx
import { StellarSnapsProvider, PayButton } from '@stellar-snaps/react';
import '@stellar-snaps/react/styles.css';

function App() {
  return (
    <StellarSnapsProvider network="testnet">
      <PayButton
        destination="GXXXXX..."
        amount="10"
        asset="USDC"
        onSuccess={(txHash) => console.log('Paid!', txHash)}
      />
    </StellarSnapsProvider>
  );
}
```

## Components

### PayButton

Simple payment button that handles wallet connection and payment.

```tsx
<PayButton
  destination="GXXXXX..."
  amount="5"
  asset="XLM"
  memo="order-123"
  onSuccess={(txHash) => console.log('Success:', txHash)}
  onError={(error) => console.error('Error:', error)}
/>
```

### PaymentCard

Inline payment card with full payment UI.

```tsx
<PaymentCard
  destination="GXXXXX..."
  amount="25"
  asset="USDC"
  title="Premium Plan"
  description="Monthly subscription"
/>
```

### PaymentModal

Modal dialog for payments.

```tsx
const [isOpen, setIsOpen] = useState(false);

<PaymentModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  destination="GXXXXX..."
  amount="100"
  asset="USDC"
  title="Purchase"
/>
```

### DonationWidget

Preset donation amounts with custom option.

```tsx
<DonationWidget
  destination="GXXXXX..."
  asset="XLM"
  presetAmounts={['5', '10', '25', '50']}
  title="Support Us"
/>
```

### ConnectButton

Wallet connection button.

```tsx
<ConnectButton />
```

## Hooks

### useFreighter

Wallet connection and signing.

```tsx
const { 
  address,
  isConnected,
  isConnecting,
  connect,
  disconnect,
  signTransaction 
} = useFreighter();
```

### usePayment

Full payment flow management.

```tsx
const {
  status,      // 'idle' | 'building' | 'signing' | 'submitting' | 'success' | 'error'
  txHash,
  error,
  pay,
  reset,
} = usePayment({
  destination: 'GXXXXX...',
  amount: '10',
  asset: 'XLM',
  onSuccess: (txHash) => console.log('Paid!'),
});

// Trigger payment
await pay();
```

## Provider Options

```tsx
<StellarSnapsProvider
  network="testnet"  // 'testnet' | 'public'
  theme="dark"       // 'light' | 'dark'
>
  {children}
</StellarSnapsProvider>
```

## Styling

Import the default styles:

```tsx
import '@stellar-snaps/react/styles.css';
```

Or use your own styles - components use CSS custom properties:

```css
:root {
  --stellar-snaps-primary: #fe330a;
  --stellar-snaps-background: #000000;
  --stellar-snaps-text: #ffffff;
  /* ... see styles.css for all variables */
}
```

## Headless Mode

Use components without default styling:

```tsx
<PayButton
  headless
  render={({ onClick, isLoading, status }) => (
    <button onClick={onClick} disabled={isLoading}>
      {status === 'success' ? 'Paid!' : 'Pay Now'}
    </button>
  )}
  destination="GXXXXX..."
  amount="10"
/>
```

## Requirements

- React 17+
- [Freighter Wallet](https://freighter.app) browser extension

## License

MIT
