export interface PaymentSnapOptions {
  destination: string;
  amount?: string;
  assetCode?: string;
  assetIssuer?: string;
  memo?: string;
  memoType?: 'MEMO_TEXT' | 'MEMO_ID' | 'MEMO_HASH' | 'MEMO_RETURN';
  message?: string;
  network?: 'public' | 'testnet';
  callback?: string;
}

export interface PaymentSnapResult {
  uri: string;
  params: Record<string, string>;
}

const NETWORK_PASSPHRASES = {
  public: 'Public Global Stellar Network ; September 2015',
  testnet: 'Test SDF Network ; September 2015',
} as const;

export function createPaymentSnap(options: PaymentSnapOptions): PaymentSnapResult {
  const {
    destination,
    amount,
    assetCode,
    assetIssuer,
    memo,
    memoType = 'MEMO_TEXT',
    message,
    network,
    callback,
  } = options;

  if (!destination || destination.length !== 56 || !destination.startsWith('G')) {
    throw new Error('Invalid destination address');
  }

  const params: Record<string, string> = { destination };

  if (amount) {
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new Error('Invalid amount');
    }
    params.amount = amount;
  }

  if (assetCode && assetCode !== 'XLM') {
    params.asset_code = assetCode;
    if (!assetIssuer) {
      throw new Error('asset_issuer required for non-XLM assets');
    }
    params.asset_issuer = assetIssuer;
  }

  if (memo) {
    params.memo = memo;
    params.memo_type = memoType;
  }

  if (message) {
    if (message.length > 300) {
      throw new Error('Message cannot exceed 300 characters');
    }
    params.msg = message;
  }

  if (network && network !== 'public') {
    params.network_passphrase = NETWORK_PASSPHRASES[network];
  }

  if (callback) {
    params.callback = `url:${callback}`;
  }

  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  return { uri: `web+stellar:pay?${queryString}`, params };
}
