'use client';

import { useState } from 'react';
import * as freighterApi from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk';
import { type Snap } from '../../../lib/db/schema';

type Props = {
  snap: Snap;
};

const HORIZON_URLS = {
  testnet: 'https://horizon-testnet.stellar.org',
  public: 'https://horizon.stellar.org',
};

const NETWORK_PASSPHRASES = {
  testnet: StellarSdk.Networks.TESTNET,
  public: StellarSdk.Networks.PUBLIC,
};

export default function SnapPage({ snap }: Props) {
  const [amount, setAmount] = useState(snap.amount || '');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'signing' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  const handlePay = async () => {
    if (!amount) {
      setError('Please enter an amount');
      return;
    }

    setStatus('connecting');
    setError('');

    try {
      // Check if Freighter is connected
      const { isConnected } = await freighterApi.isConnected();
      
      if (!isConnected) {
        setError('Freighter wallet not found. Please install it from freighter.app');
        setStatus('error');
        return;
      }

      // Request access if needed
      const { isAllowed } = await freighterApi.isAllowed();
      if (!isAllowed) {
        await freighterApi.setAllowed();
      }

      // Get user's address and network
      const { address } = await freighterApi.getAddress();
      if (!address) {
        setError('Please connect your wallet');
        setStatus('error');
        return;
      }

      const { networkPassphrase } = await freighterApi.getNetwork();

      // Verify network matches
      const snapNetwork = snap.network || 'testnet';
      const expectedPassphrase = NETWORK_PASSPHRASES[snapNetwork as keyof typeof NETWORK_PASSPHRASES];
      
      if (networkPassphrase !== expectedPassphrase) {
        setError(`Please switch Freighter to ${snapNetwork}. Currently on wrong network.`);
        setStatus('error');
        return;
      }

      setStatus('signing');

      // Build transaction
      const horizonUrl = HORIZON_URLS[snapNetwork as keyof typeof HORIZON_URLS];
      const server = new StellarSdk.Horizon.Server(horizonUrl);

      // Load source account
      const sourceAccount = await server.loadAccount(address);

      // Build the transaction
      const transactionBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: expectedPassphrase,
      });

      // Add payment operation
      let asset: StellarSdk.Asset;
      if (snap.assetCode && snap.assetCode !== 'XLM' && snap.assetIssuer) {
        asset = new StellarSdk.Asset(snap.assetCode, snap.assetIssuer);
      } else {
        asset = StellarSdk.Asset.native();
      }

      transactionBuilder.addOperation(
        StellarSdk.Operation.payment({
          destination: snap.destination,
          asset: asset,
          amount: amount,
        })
      );

      // Add memo if present
      if (snap.memo) {
        if (snap.memoType === 'MEMO_ID') {
          transactionBuilder.addMemo(StellarSdk.Memo.id(snap.memo));
        } else {
          transactionBuilder.addMemo(StellarSdk.Memo.text(snap.memo));
        }
      }

      // Set timeout and build
      transactionBuilder.setTimeout(180);
      const transaction = transactionBuilder.build();

      // Sign with Freighter
      const { signedTxXdr } = await freighterApi.signTransaction(transaction.toXDR(), {
        networkPassphrase: expectedPassphrase,
      });

      setStatus('submitting');

      // Submit transaction
      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
        signedTxXdr,
        expectedPassphrase
      );

      const result = await server.submitTransaction(signedTransaction);
      
      setTxHash(result.hash);
      setStatus('success');

    } catch (err: any) {
      console.error('Payment error:', err);
      
      // Handle specific errors
      if (err?.message?.includes('User declined')) {
        setError('Transaction cancelled by user');
      } else if (err?.response?.data?.extras?.result_codes) {
        const codes = err.response.data.extras.result_codes;
        setError(`Transaction failed: ${JSON.stringify(codes)}`);
      } else {
        setError(err instanceof Error ? err.message : 'Payment failed');
      }
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl text-purple-500">✦</span>
          <h1 className="text-xl font-semibold text-white">{snap.title}</h1>
        </div>

        {/* Description */}
        {snap.description && (
          <p className="text-gray-400 text-sm mb-6">{snap.description}</p>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 font-medium mb-2">Payment successful!</p>
            <a
              href={`https://stellar.expert/explorer/${snap.network || 'testnet'}/tx/${txHash}`}
              target="_blank"
              rel="noopener"
              className="text-purple-400 text-sm hover:underline break-all"
            >
              View transaction →
            </a>
          </div>
        )}

        {/* Amount Input */}
        {status !== 'success' && (
          <>
            <div className="mb-6">
              <label className="text-gray-400 text-sm mb-2 block">Amount</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={!!snap.amount}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-purple-500 disabled:opacity-50"
                />
                <span className="text-gray-400 font-medium">{snap.assetCode || 'XLM'}</span>
              </div>
            </div>

            {/* Destination */}
            <div className="mb-6 p-3 bg-gray-800/50 rounded-lg">
              <p className="text-gray-500 text-xs mb-1">Sending to</p>
              <p className="text-gray-300 text-sm font-mono truncate">{snap.destination}</p>
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Pay Button */}
        {status !== 'success' && (
          <button
            onClick={handlePay}
            disabled={status === 'connecting' || status === 'signing' || status === 'submitting'}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {status === 'connecting' && 'Connecting...'}
            {status === 'signing' && 'Signing...'}
            {status === 'submitting' && 'Submitting...'}
            {status === 'idle' && 'Pay with Stellar'}
            {status === 'error' && 'Try Again'}
          </button>
        )}

        {/* Network Badge */}
        <div className="mt-4 text-center">
          <span className="text-xs text-gray-500 px-2 py-1 bg-gray-800 rounded">
            {snap.network === 'testnet' ? 'Testnet' : 'Mainnet'}
          </span>
        </div>
      </div>
    </div>
  );
}
