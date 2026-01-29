'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as freighterApi from '@stellar/freighter-api';

export default function DevelopersHubPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { isConnected } = await freighterApi.isConnected();
      if (isConnected) {
        const { address } = await freighterApi.getAddress();
        if (address) {
          setAddress(address);
        }
      }
    } catch (err) {
      console.error('Connection check failed:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
  };

  const walletBackground = (
    <>
      {/* Grid background with orange glow - same as waitlist */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(254, 51, 10, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(254, 51, 10, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            filter: 'blur(0.5px)',
            boxShadow: 'inset 0 0 300px rgba(254, 51, 10, 0.15)'
          }}
        />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `
              linear-gradient(rgba(249, 115, 22, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(249, 115, 22, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            filter: 'blur(0.3px)'
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle 2px at 0 0, rgba(254, 51, 10, 0.4) 0%, transparent 50%),
              radial-gradient(circle 2px at 80px 80px, rgba(254, 51, 10, 0.4) 0%, transparent 50%)
            `,
            backgroundSize: '80px 80px',
            backgroundPosition: '0 0, 40px 40px',
            filter: 'blur(1.5px)'
          }}
        />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `
              radial-gradient(circle 3px at 40px 40px, rgba(251, 191, 36, 0.3) 0%, transparent 70%)
            `,
            backgroundSize: '80px 80px',
            filter: 'blur(2px)'
          }}
        />
      </div>
      {/* Aurora glow from bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[60%] pointer-events-none z-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[400px] bg-gradient-to-t from-[#fe330a]/30 via-[#fe330a]/10 to-transparent blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-[20%] w-[40%] h-[300px] bg-gradient-to-t from-[#fe330a]/25 via-transparent to-transparent blur-[80px] rounded-full" style={{ transform: 'skewX(-15deg)' }} />
        <div className="absolute bottom-0 right-[20%] w-[40%] h-[300px] bg-gradient-to-t from-[#fe330a]/25 via-transparent to-transparent blur-[80px] rounded-full" style={{ transform: 'skewX(15deg)' }} />
        <div className="absolute bottom-[100px] left-[10%] w-[30%] h-[200px] bg-gradient-to-t from-[#f97316]/20 via-transparent to-transparent blur-[60px] rounded-full" />
        <div className="absolute bottom-[150px] right-[15%] w-[35%] h-[250px] bg-gradient-to-t from-[#fbbf24]/15 via-transparent to-transparent blur-[70px] rounded-full" />
      </div>
    </>
  );

  if (isChecking) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden flex items-center justify-center p-4">
        {walletBackground}
        <div className="relative z-10 text-gray-400 font-inter-italic">Checking wallet...</div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden flex items-center justify-center p-4">
        {walletBackground}
        <div className="relative z-10 w-full max-w-md">
          <div className="p-8 text-center">
            <h1 className="text-xl font-bold text-white mb-4">Wallet not connected</h1>
            <p className="font-inter-italic text-gray-400 mb-6">
              Please connect your wallet on the Developers page to access the hub.
            </p>
            <Link
              href="/developers"
              className="font-bricolage inline-block w-full py-3 px-4 bg-[#fe330a] hover:bg-[#d92b08] text-white font-semibold rounded-xl transition-colors text-center"
            >
              Connect wallet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const truncatedAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;

  /* Faded, more blurred grid for hub section only */
  const hubBackground = (
    <>
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
            boxShadow: 'inset 0 0 300px rgba(254, 51, 10, 0.08)'
          }}
        />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `
              linear-gradient(rgba(249, 115, 22, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(249, 115, 22, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            filter: 'blur(2px)'
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle 2px at 0 0, rgba(254, 51, 10, 0.25) 0%, transparent 50%),
              radial-gradient(circle 2px at 80px 80px, rgba(254, 51, 10, 0.25) 0%, transparent 50%)
            `,
            backgroundSize: '80px 80px',
            backgroundPosition: '0 0, 40px 40px',
            filter: 'blur(4px)'
          }}
        />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `
              radial-gradient(circle 3px at 40px 40px, rgba(251, 191, 36, 0.2) 0%, transparent 70%)
            `,
            backgroundSize: '80px 80px',
            filter: 'blur(5px)'
          }}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[60%] pointer-events-none z-0 opacity-50">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[400px] bg-gradient-to-t from-[#fe330a]/20 via-[#fe330a]/05 to-transparent blur-[140px] rounded-full" />
        <div className="absolute bottom-0 left-[20%] w-[40%] h-[300px] bg-gradient-to-t from-[#fe330a]/15 via-transparent to-transparent blur-[110px] rounded-full" style={{ transform: 'skewX(-15deg)' }} />
        <div className="absolute bottom-0 right-[20%] w-[40%] h-[300px] bg-gradient-to-t from-[#fe330a]/15 via-transparent to-transparent blur-[110px] rounded-full" style={{ transform: 'skewX(15deg)' }} />
        <div className="absolute bottom-[100px] left-[10%] w-[30%] h-[200px] bg-gradient-to-t from-[#f97316]/12 via-transparent to-transparent blur-[90px] rounded-full" />
        <div className="absolute bottom-[150px] right-[15%] w-[35%] h-[250px] bg-gradient-to-t from-[#fbbf24]/10 via-transparent to-transparent blur-[100px] rounded-full" />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden p-4 md:p-8">
      {hubBackground}
      <div className="relative z-10 max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img src="/stellar.png" alt="Stellar Snaps" className="h-8 w-auto" />
            </Link>
            <h1 className="text-xl font-bold">Developer Hub</h1>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-sm text-white px-4 py-2 rounded-xl border border-gray-600 bg-gray-900/50"
              title={address}
            >
              {truncatedAddress}
            </span>
            <button
              onClick={disconnect}
              className="font-bricolage text-sm font-semibold text-white px-4 py-2 rounded-xl bg-gradient-to-r from-[#fe330a] to-[#d92b08] hover:from-[#d92b08] hover:to-[#fe330a] transition-all shadow-[0_2px_10px_rgba(254,51,10,0.3)]"
            >
              Disconnect
            </button>
          </div>
        </header>

        <main className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Welcome, {truncatedAddress}</h2>
            <p className="font-inter-italic text-gray-400 max-w-2xl">
              Your wallet is connected. Use the Stellar Snaps API and SDK to build payment links,
              accept XLM/USDC, and integrate with the Stellar network.
            </p>
          </section>

          <section className="grid sm:grid-cols-2 gap-4">
            <Link
              href="/dashboard"
              className="block p-6 rounded-xl border border-gray-800 hover:border-[#fe330a]/50 bg-gray-900/50 transition-colors"
            >
              <h3 className="font-semibold text-white mb-2">Create Snaps</h3>
              <p className="font-inter-italic text-sm text-gray-400">
                Create and manage payment links from your dashboard.
              </p>
            </Link>
            <Link
              href="/developers/hub/api-keys"
              className="block p-6 rounded-xl border border-gray-800 hover:border-[#fe330a]/50 bg-gray-900/50 transition-colors"
            >
              <h3 className="font-semibold text-white mb-2">API Key Creation</h3>
              <p className="font-inter-italic text-sm text-gray-400">
                Create and manage API keys to integrate Stellar Snaps programmatically.
              </p>
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}
