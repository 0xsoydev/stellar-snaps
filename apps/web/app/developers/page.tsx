'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as freighterApi from '@stellar/freighter-api';

export default function DevelopersPage() {
  const router = useRouter();
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (!address || !isRedirecting) return;
    const t = setTimeout(() => {
      router.push('/developers/hub');
    }, 1200);
    return () => clearTimeout(t);
  }, [address, isRedirecting, router]);

  const checkConnection = async () => {
    try {
      const { isConnected } = await freighterApi.isConnected();
      if (isConnected) {
        const res = await freighterApi.getAddress();
        if (res.address) {
          setAddress(res.address);
        }
      }
    } catch (err) {
      console.error('Connection check failed:', err);
    }
  };

  const connect = async (redirectAfterConnect = true) => {
    setIsConnecting(true);
    setError('');

    try {
      const { isConnected } = await freighterApi.isConnected();
      if (!isConnected) {
        setError('Freighter wallet not found. Please install it from freighter.app');
        setIsConnecting(false);
        return;
      }

      const res = await freighterApi.requestAccess();
      if (res.error) {
        setError(res.error);
      } else if (res.address) {
        setAddress(res.address);
        if (redirectAfterConnect) {
          setIsRedirecting(true);
        }
      } else {
        setError('Could not get address. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Connect failed:', err);
      if (err instanceof Error && err.message?.includes('Freighter is not connected')) {
        setError('Freighter wallet not found. Please install it from freighter.app');
      } else {
        setError(err instanceof Error ? err.message : 'Connection failed');
      }
    }

    setIsConnecting(false);
  };

  const changeWallet = () => {
    connect(false);
  };

  const continueToHub = () => {
    setIsRedirecting(true);
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

  if (!address) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden flex items-center justify-center p-4">
        {walletBackground}
        <div className="relative z-10 w-full max-w-md">
          <div className="p-8 text-center">
            <Link href="/" className="inline-block mb-6">
              <img src="/stellar.png" alt="Stellar Snaps" className="h-10 w-auto mx-auto" />
            </Link>
            <h1 className="text-2xl font-bold text-white mb-2">Developers</h1>
            <p className="font-inter-italic text-gray-400 mb-6">
              Connect your wallet to access the developer hub and build with Stellar Snaps.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="font-inter-italic text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={connect}
              disabled={isConnecting}
              className="font-bricolage w-full bg-[#fe330a] hover:bg-[#d92b08] text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect Freighter'}
            </button>

            <p className="font-inter-italic text-gray-500 text-xs mt-4">
              Don&apos;t have Freighter?{' '}
              <a
                href="https://freighter.app"
                target="_blank"
                rel="noopener"
                className="font-bricolage text-[#fe330a] hover:underline"
              >
                Get it here
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const truncatedAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden flex items-center justify-center p-4">
        {walletBackground}
        <div className="relative z-10 w-full max-w-md">
          <div className="p-8 text-center">
            <Link href="/" className="inline-block mb-6">
              <img src="/stellar.png" alt="Stellar Snaps" className="h-10 w-auto mx-auto" />
            </Link>
            <h1 className="text-2xl font-bold text-white mb-2">Wallet connected</h1>
            <p className="font-inter-italic text-gray-400 mb-6">
              Redirecting to Developer Hub...
            </p>
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#fe330a] animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-[#fe330a] animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-[#fe330a] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex items-center justify-center p-4">
      {walletBackground}
      <div className="relative z-10 w-full max-w-md">
        <div className="p-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <img src="/stellar.png" alt="Stellar Snaps" className="h-10 w-auto mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
          <p className="font-inter-italic text-gray-400 mb-6">
            Continue to the developer hub with your connected wallet.
          </p>
          <button
            onClick={continueToHub}
            className="font-bricolage w-full py-3 px-4 rounded-xl bg-[#fe330a] hover:bg-[#d92b08] text-white font-semibold transition-colors"
            title={address}
          >
            Continue with {truncatedAddress}
          </button>
          <p className="font-inter-italic text-sm text-gray-500 mt-4">
            Connected. Wrong wallet?{' '}
            <button
              type="button"
              onClick={changeWallet}
              disabled={isConnecting}
              className="font-bricolage text-[#fe330a] hover:underline disabled:opacity-50"
            >
              Change Wallet
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
