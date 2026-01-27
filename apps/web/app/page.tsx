import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <span className="text-6xl mb-6 block">✦</span>
        <h1 className="text-4xl font-bold text-white mb-4">Stellar Snaps</h1>
        <p className="text-xl text-gray-400 mb-8">
          Shareable magic links that let anyone send money, donate, or trigger Stellar actions with just one click.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/dashboard"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-8 rounded-xl hover:opacity-90 transition-opacity"
          >
            Create a Snap
          </Link>
          <a
            href="https://github.com/example/stellar-snaps"
            target="_blank"
            rel="noopener"
            className="text-gray-400 hover:text-white py-3 px-8"
          >
            View on GitHub →
          </a>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 text-left">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="text-2xl mb-3">🔗</div>
            <h3 className="text-white font-semibold mb-2">Share Links</h3>
            <p className="text-gray-400 text-sm">Create payment links and share them on X, Discord, or anywhere.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="text-2xl mb-3">💳</div>
            <h3 className="text-white font-semibold mb-2">One-Click Pay</h3>
            <p className="text-gray-400 text-sm">Recipients click and pay instantly with their Stellar wallet.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="text-white font-semibold mb-2">Instant Settlement</h3>
            <p className="text-gray-400 text-sm">Transactions settle in seconds on the Stellar network.</p>
          </div>
        </div>

        <p className="text-gray-500 text-sm mt-12">
          Built with SEP-0007 • Testnet
        </p>
      </div>
    </div>
  );
}
