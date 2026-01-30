'use client';

type ConnectWalletViewProps = {
  onConnect: () => void;
  isConnecting: boolean;
  error: string;
};

export function ConnectWalletView({
  onConnect,
  isConnecting,
  error,
}: ConnectWalletViewProps) {
  return (
    <div className="min-h-screen bg-dashboard-dots flex items-center justify-center p-6">
      <div className="bg-[#3e3d3f] rounded-2xl shadow-sm border border-[#4e4d4f] p-8 md:p-10 max-w-md w-full text-center">
        <span className="text-4xl mb-6 block text-[#b5b4b6]" aria-hidden>
          ✦
        </span>
        <h1 className="text-2xl md:text-3xl font-bold text-[#e8e7e9] mb-3">
          Stellar Snaps
        </h1>
        <p className="text-[#b5b4b6] mb-8 text-sm md:text-base">
          Connect your wallet to create shareable payment links
        </p>

        {error && (
          <div className="mb-6 p-4 bg-[#2a292b] border border-[#4e4d4f] rounded-xl">
            <p className="text-[#b5b4b6] text-sm">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={onConnect}
          disabled={isConnecting}
          className="w-full bg-[#525152] text-[#e8e7e9] font-semibold py-3.5 px-4 rounded-xl hover:bg-[#6b6a6c] transition-colors disabled:opacity-50 border border-[#4e4d4f]"
        >
          {isConnecting ? 'Connecting...' : 'Connect Freighter'}
        </button>

        <p className="text-[#8a898b] text-sm mt-6">
          Don&apos;t have Freighter?{' '}
          <a
            href="https://freighter.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#b5b4b6] hover:text-[#e8e7e9] font-medium transition-colors"
          >
            Get it here
          </a>
        </p>
      </div>
    </div>
  );
}
