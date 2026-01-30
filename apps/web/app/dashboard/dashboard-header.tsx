'use client';

import { useState } from 'react';

type DashboardHeaderProps = {
  address: string;
  onDisconnectClick: () => void;
};

export function DashboardHeader({ address, onDisconnectClick }: DashboardHeaderProps) {
  const [addressCopied, setAddressCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setAddressCopied(true);
    setTimeout(() => setAddressCopied(false), 2000);
  };

  return (
    <header className="mb-8 md:mb-10">
      <div className="bg-[#3e3d3f] rounded-2xl shadow-sm border border-[#4e4d4f] px-5 py-3 md:px-6 md:py-3.5 h-14 md:h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl text-[#b5b4b6]" aria-hidden>
            ✦
          </span>
          <h1 className="text-base md:text-lg font-bold text-[#e8e7e9] tracking-tight">
            Stellar Snaps
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyAddress}
            className="bg-[#525152] text-[#e8e7e9] text-xs font-mono px-3 py-1.5 rounded-full hover:bg-[#6b6a6c] transition-colors cursor-pointer border border-[#e8e7e9]/30"
            title="Click to copy address"
          >
            {addressCopied ? 'Copied!' : `${address.slice(0, 4)}...${address.slice(-4)}`}
          </button>
          <button
            type="button"
            onClick={onDisconnectClick}
            className="bg-[#525152] border border-[#e8e7e9]/30 text-[#e8e7e9] text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#6b6a6c] transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    </header>
  );
}
