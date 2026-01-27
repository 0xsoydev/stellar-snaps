'use client';

import { useState, useEffect } from 'react';
import * as freighterApi from '@stellar/freighter-api';
import CreateSnapForm from './create-snap-form';
import SnapsList from './snaps-list';

export default function DashboardPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

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
    }
  };

  const connect = async () => {
    setIsConnecting(true);
    setError('');

    try {
      // requestAccess will prompt the user to connect if not already connected
      // This works even if isConnected() returns false
      const accessResult = await freighterApi.requestAccess();
      
      if (accessResult.error) {
        setError(accessResult.error);
        setIsConnecting(false);
        return;
      }

      const { address } = await freighterApi.getAddress();
      if (address) {
        setAddress(address);
      } else {
        setError('Failed to get address. Please unlock your wallet and try again.');
      }
    } catch (err: any) {
      console.error('Connect failed:', err);
      // Check if Freighter is not installed at all
      if (err?.message?.includes('Freighter') || err?.message?.includes('Extension')) {
        setError('Freighter wallet not found. Please install it from freighter.app');
      } else {
        setError(err instanceof Error ? err.message : 'Connection failed');
      }
    }

    setIsConnecting(false);
  };

  const disconnect = () => {
    setAddress(null);
  };

  const handleSnapCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <span className="text-4xl mb-4 block">✦</span>
          <h1 className="text-2xl font-bold text-white mb-2">Stellar Snaps</h1>
          <p className="text-gray-400 mb-6">Connect your wallet to create shareable payment links</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={connect}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isConnecting ? 'Connecting...' : 'Connect Freighter'}
          </button>

          <p className="text-gray-500 text-xs mt-4">
            Don't have Freighter?{' '}
            <a href="https://freighter.app" target="_blank" rel="noopener" className="text-purple-400 hover:underline">
              Get it here
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl text-purple-500">✦</span>
            <h1 className="text-xl font-bold text-white">Stellar Snaps</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm font-mono">
              {address.slice(0, 4)}...{address.slice(-4)}
            </span>
            <button
              onClick={disconnect}
              className="text-gray-400 hover:text-white text-sm"
            >
              Disconnect
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create Form */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Create New Snap</h2>
            <CreateSnapForm creator={address} onCreated={handleSnapCreated} />
          </div>

          {/* Snaps List */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Your Snaps</h2>
            <SnapsList creator={address} refreshKey={refreshKey} />
          </div>
        </div>
      </div>
    </div>
  );
}
