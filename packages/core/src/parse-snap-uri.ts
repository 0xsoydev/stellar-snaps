export interface ParsedSnap {
  type: 'pay' | 'tx';
  destination?: string;
  amount?: string;
  assetCode?: string;
  assetIssuer?: string;
  memo?: string;
  memoType?: string;
  message?: string;
  networkPassphrase?: string;
  callback?: string;
  xdr?: string;
}

export function parseSnapUri(uri: string): ParsedSnap {
  if (!uri.startsWith('web+stellar:')) {
    throw new Error('Invalid SEP-0007 URI: must start with web+stellar:');
  }

  const withoutScheme = uri.replace('web+stellar:', '');
  const [operation, queryString] = withoutScheme.split('?');

  if (operation !== 'pay' && operation !== 'tx') {
    throw new Error(`Invalid operation: ${operation}. Must be 'pay' or 'tx'`);
  }

  const params = new URLSearchParams(queryString);
  const parsed: ParsedSnap = { type: operation };

  if (operation === 'pay') {
    const destination = params.get('destination');
    if (!destination) {
      throw new Error('Missing required parameter: destination');
    }
    parsed.destination = destination;

    if (params.has('amount')) parsed.amount = params.get('amount')!;
    if (params.has('asset_code')) parsed.assetCode = params.get('asset_code')!;
    if (params.has('asset_issuer')) parsed.assetIssuer = params.get('asset_issuer')!;
    if (params.has('memo')) parsed.memo = params.get('memo')!;
    if (params.has('memo_type')) parsed.memoType = params.get('memo_type')!;
    if (params.has('msg')) parsed.message = params.get('msg')!;
    if (params.has('network_passphrase')) parsed.networkPassphrase = params.get('network_passphrase')!;
    if (params.has('callback')) {
      const cb = params.get('callback')!;
      parsed.callback = cb.startsWith('url:') ? cb.slice(4) : cb;
    }
  } else {
    const xdr = params.get('xdr');
    if (!xdr) {
      throw new Error('Missing required parameter: xdr');
    }
    parsed.xdr = xdr;
    if (params.has('msg')) parsed.message = params.get('msg')!;
    if (params.has('network_passphrase')) parsed.networkPassphrase = params.get('network_passphrase')!;
    if (params.has('callback')) {
      const cb = params.get('callback')!;
      parsed.callback = cb.startsWith('url:') ? cb.slice(4) : cb;
    }
  }

  return parsed;
}
