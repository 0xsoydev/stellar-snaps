'use client';

import { useState } from 'react';

type Props = {
  creator: string;
  onCreated: () => void;
};

export default function CreateSnapForm({ creator, onCreated }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    destination: '',
    amount: '',
    assetCode: 'XLM',
    memo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess(null);

    try {
      const res = await fetch('/api/snaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator,
          title: form.title,
          description: form.description || undefined,
          destination: form.destination,
          amount: form.amount || undefined,
          assetCode: form.assetCode,
          memo: form.memo || undefined,
          network: 'testnet',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create snap');
      }

      const snap = await res.json();
      const url = `${window.location.origin}/s/${snap.id}`;
      setSuccess(url);

      // Reset form
      setForm({
        title: '',
        description: '',
        destination: '',
        amount: '',
        assetCode: 'XLM',
        memo: '',
      });

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create snap');
    }

    setIsSubmitting(false);
  };

  const copyLink = () => {
    if (success) {
      navigator.clipboard.writeText(success);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      {/* Title */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm mb-1 block">Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Buy me a coffee"
          required
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm mb-1 block">Description</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Support my open source work"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Destination */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm mb-1 block">Destination Address *</label>
        <input
          type="text"
          value={form.destination}
          onChange={(e) => setForm({ ...form, destination: e.target.value })}
          placeholder="GABC..."
          required
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
        />
        <button
          type="button"
          onClick={() => setForm({ ...form, destination: creator })}
          className="text-purple-400 text-xs mt-1 hover:underline"
        >
          Use my address
        </button>
      </div>

      {/* Amount */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm mb-1 block">Amount (leave empty for open amount)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="10"
            step="any"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
          />
          <select
            value={form.assetCode}
            onChange={(e) => setForm({ ...form, assetCode: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="XLM">XLM</option>
            <option value="USDC">USDC</option>
          </select>
        </div>
      </div>

      {/* Memo */}
      <div className="mb-6">
        <label className="text-gray-400 text-sm mb-1 block">Memo</label>
        <input
          type="text"
          value={form.memo}
          onChange={(e) => setForm({ ...form, memo: e.target.value })}
          placeholder="Optional memo"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-400 text-sm mb-2">Snap created!</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={success}
              readOnly
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs font-mono"
            />
            <button
              type="button"
              onClick={copyLink}
              className="text-purple-400 text-xs hover:underline"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isSubmitting ? 'Creating...' : 'Create Snap'}
      </button>
    </form>
  );
}
