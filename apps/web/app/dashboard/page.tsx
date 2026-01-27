'use client';

import { useState } from 'react';
import { useWalletConnection } from './use-wallet-connection';
import { ConnectWalletView } from './connect-wallet-view';
import { DashboardHeader } from './dashboard-header';
import { DisconnectModal } from './disconnect-modal';
import CreateSnapForm from './create-snap-form';
import SnapsList from './snaps-list';

export default function DashboardPage() {
  const { address, isConnecting, error, connect, disconnect } = useWalletConnection();
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDisconnectConfirm = () => {
    disconnect();
    setShowDisconnectModal(false);
  };

  const handleSnapCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  if (!address) {
    return (
      <ConnectWalletView
        onConnect={connect}
        isConnecting={isConnecting}
        error={error}
      />
    );
  }

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
          <CreateSnapForm creator={address} onCreated={handleSnapCreated} />
          <SnapsList creator={address} refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}
