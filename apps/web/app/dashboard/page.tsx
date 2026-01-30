'use client';

import { useState } from 'react';
import { useWalletAuth } from './use-wallet-auth';
import { ConnectWalletView } from './connect-wallet-view';
import { DashboardHeader } from './dashboard-header';
import { DisconnectModal } from './disconnect-modal';
import CreateSnapForm from './create-snap-form';
import SnapsList from './snaps-list';

export default function DashboardPage() {
  const {
    address,
    session,
    isAuthenticated,
    isConnecting,
    isSigning,
    error,
    connect,
    signIn,
    disconnect,
  } = useWalletAuth();
  
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDisconnectConfirm = () => {
    disconnect();
    setShowDisconnectModal(false);
  };

  const handleSnapCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  // Not connected
  if (!address) {
    return (
      <ConnectWalletView
        onConnect={connect}
        isConnecting={isConnecting}
        error={error}
      />
    );
  }

  // Connected but not signed in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dashboard-dots flex items-center justify-center px-4">
        <div className="bg-[#3e3d3f] rounded-2xl shadow-sm border border-[#4e4d4f] p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-[#e8e7e9] mb-2">Sign In</h1>
          <p className="text-[#b5b4b6] text-sm mb-6">
            Sign a message to prove you own this wallet. This doesn&apos;t cost any gas.
          </p>
          <p className="text-[#8a898b] text-xs font-mono mb-6 break-all">
            {address}
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-[#2a292b] border border-[#4e4d4f] rounded-xl">
              <p className="text-[#b5b4b6] text-sm">{error}</p>
            </div>
          )}
          
          <button
            onClick={signIn}
            disabled={isSigning}
            className="w-full bg-[#525152] text-[#e8e7e9] font-semibold py-3 px-4 rounded-xl hover:bg-[#6b6a6c] transition-colors disabled:opacity-50 border border-[#4e4d4f]"
          >
            {isSigning ? 'Waiting for signature...' : 'Sign Message'}
          </button>
          
          <button
            onClick={disconnect}
            className="mt-4 text-[#8a898b] text-sm hover:text-[#b5b4b6] transition-colors"
          >
            Use a different wallet
          </button>
        </div>
      </div>
    );
  }

  // Fully authenticated
  return (
    <div className="min-h-screen bg-dashboard-dots px-4 pt-5 pb-12 md:px-8 md:pt-6">
      <div className="max-w-5xl mx-auto">
        <DashboardHeader
          address={address}
          onDisconnectClick={() => setShowDisconnectModal(true)}
        />

        <DisconnectModal
          open={showDisconnectModal}
          onClose={() => setShowDisconnectModal(false)}
          onConfirm={handleDisconnectConfirm}
        />

        <div className="grid md:grid-cols-2 gap-8 md:gap-10">
          <CreateSnapForm
            creator={address}
            sessionToken={session?.token}
            onCreated={handleSnapCreated}
          />
          <SnapsList
            creator={address}
            sessionToken={session?.token}
            refreshKey={refreshKey}
          />
        </div>
      </div>
    </div>
  );
}
