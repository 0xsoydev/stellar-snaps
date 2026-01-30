import { NextRequest, NextResponse } from 'next/server';
import * as StellarSdk from '@stellar/stellar-sdk';

const NETWORK_PASSPHRASES = {
  testnet: StellarSdk.Networks.TESTNET,
  public: StellarSdk.Networks.PUBLIC,
};

// POST /api/build-tx - build transaction XDR for extension
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      source,
      sequence,
      destination,
      amount,
      assetCode,
      assetIssuer,
      memo,
      memoType,
      network = 'testnet',
    } = body;

    // Validate required fields
    if (!source || !sequence || !destination || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: source, sequence, destination, amount' },
        { status: 400 }
      );
    }

    const networkPassphrase = NETWORK_PASSPHRASES[network as keyof typeof NETWORK_PASSPHRASES];
    if (!networkPassphrase) {
      return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
    }

    // Create a minimal account object for TransactionBuilder
    const sourceAccount = new StellarSdk.Account(source, sequence);

    // Build transaction
    const builder = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    });

    // Determine asset
    let asset: StellarSdk.Asset;
    if (assetCode && assetCode !== 'XLM' && assetIssuer) {
      asset = new StellarSdk.Asset(assetCode, assetIssuer);
    } else {
      asset = StellarSdk.Asset.native();
    }

    // Add payment operation
    builder.addOperation(
      StellarSdk.Operation.payment({
        destination,
        asset,
        amount: String(amount),
      })
    );

    // Add memo if present
    if (memo) {
      if (memoType === 'MEMO_ID') {
        builder.addMemo(StellarSdk.Memo.id(memo));
      } else if (memoType === 'MEMO_HASH') {
        builder.addMemo(StellarSdk.Memo.hash(memo));
      } else {
        builder.addMemo(StellarSdk.Memo.text(memo));
      }
    }

    // Set timeout and build
    builder.setTimeout(180);
    const transaction = builder.build();

    return NextResponse.json(
      { xdr: transaction.toXDR() },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (err: any) {
    console.error('Build transaction error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to build transaction' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
