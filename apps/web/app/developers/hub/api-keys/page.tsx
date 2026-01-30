'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApiAuth } from '@/lib/hooks/use-api-auth';

export default function ApiKeysPage() {
  const {
    walletAddress,
    isWalletConnected,
    isAuthenticated,
    isLoading,
    isConnecting,
    isAuthenticating,
    error,
    connectWallet,
    authenticate,
    logout,
    keys,
    isLoadingKeys,
    createKey,
    revokeKey,
  } = useApiAuth();

  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const handleAuthenticate = async () => {
    const key = await authenticate();
    if (key) {
      setShowNewKey(key);
    }
  };

  const handleCreateKey = async () => {
    setIsCreating(true);
    const key = await createKey(newKeyName || 'New Key');
    if (key) {
      setShowNewKey(key);
      setNewKeyName('');
    }
    setIsCreating(false);
  };

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    await revokeKey(id);
    setRevoking(null);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeNewKeyModal = () => {
    setShowNewKey(null);
    setCopied(false);
  };

  const truncatedWallet = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : '';

  // Background component
  const background = (
    <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
      <div
        className="w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(rgba(254, 51, 10, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(254, 51, 10, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          filter: 'blur(3px)',
        }}
      />
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden flex items-center justify-center">
        {background}
        <div className="relative z-10 text-gray-400">Loading...</div>
      </div>
    );
  }

  // Not connected
  if (!isWalletConnected) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden flex items-center justify-center p-4">
        {background}
        <div className="relative z-10 w-full max-w-md text-center">
          <Link href="/" className="inline-block mb-6">
            <img src="/stellar.png" alt="Stellar Snaps" className="h-10 mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold mb-2">Connect Wallet</h1>
          <p className="text-gray-400 mb-6">
            Connect your Freighter wallet to manage API keys.
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full bg-[#fe330a] hover:bg-[#d92b08] text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            {isConnecting ? 'Connecting...' : 'Connect Freighter'}
          </button>
        </div>
      </div>
    );
  }

  // Connected but not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden flex items-center justify-center p-4">
        {background}
        <div className="relative z-10 w-full max-w-md text-center">
          <Link href="/" className="inline-block mb-6">
            <img src="/stellar.png" alt="Stellar Snaps" className="h-10 mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold mb-2">Sign to Authenticate</h1>
          <p className="text-gray-400 mb-2">
            Connected as <span className="text-white font-mono">{truncatedWallet}</span>
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Sign a message with your wallet to get your API key.
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleAuthenticate}
            disabled={isAuthenticating}
            className="w-full bg-[#fe330a] hover:bg-[#d92b08] text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            {isAuthenticating ? 'Signing...' : 'Sign & Get API Key'}
          </button>
          <button
            onClick={logout}
            className="mt-4 text-gray-500 hover:text-white text-sm transition-colors"
          >
            Use different wallet
          </button>
        </div>
      </div>
    );
  }

  // Authenticated - show API keys management
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden p-4 md:p-8">
      {background}
      
      {/* New Key Modal */}
      {showNewKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-2">API Key Created</h2>
            <p className="text-gray-400 text-sm mb-4">
              Copy this key now. You won&apos;t be able to see it again.
            </p>
            <div className="bg-black border border-gray-700 rounded-lg p-3 font-mono text-sm break-all mb-4">
              {showNewKey}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => copyToClipboard(showNewKey)}
                className="flex-1 bg-[#fe330a] hover:bg-[#d92b08] text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={closeNewKeyModal}
                className="px-4 py-2 border border-gray-700 hover:border-gray-600 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link href="/developers/hub">
              <span className="text-gray-500 hover:text-white transition-colors">&larr;</span>
            </Link>
            <h1 className="text-xl font-bold">API Keys</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-gray-400">{truncatedWallet}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Create new key */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="font-semibold mb-4">Create New Key</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (optional)"
              className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe330a]/50"
            />
            <button
              onClick={handleCreateKey}
              disabled={isCreating}
              className="bg-[#fe330a] hover:bg-[#d92b08] text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Key'}
            </button>
          </div>
        </div>

        {/* Keys list */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-semibold">Your API Keys</h2>
          </div>
          
          {isLoadingKeys ? (
            <div className="p-6 text-center text-gray-500">Loading keys...</div>
          ) : keys.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No API keys yet. Create one above.
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {keys.map((key) => (
                <div key={key.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-gray-300">{key.keyPrefix}...</span>
                      <span className="text-gray-500 text-sm">{key.name || 'Unnamed'}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Created {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsedAt && (
                        <> &middot; Last used {new Date(key.lastUsedAt).toLocaleDateString()}</>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevoke(key.id)}
                    disabled={revoking === key.id}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    {revoking === key.id ? 'Revoking...' : 'Revoke'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Usage hint */}
        <div className="mt-8 p-4 bg-gray-900/30 border border-gray-800 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">Using your API key</h3>
          <p className="text-gray-500 text-sm mb-3">
            Include your API key in the <code className="text-gray-300">X-API-Key</code> header:
          </p>
          <pre className="bg-black border border-gray-800 rounded-lg p-3 text-sm overflow-x-auto">
            <code className="text-gray-300">
{`curl https://stellar-snaps.vercel.app/api/snaps \\
  -H "X-API-Key: snaps_your_key_here"`}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
