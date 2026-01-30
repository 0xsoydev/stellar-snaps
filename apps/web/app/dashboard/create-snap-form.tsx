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

  const inputClass =
    'w-full bg-[#525152] border border-[#4e4d4f] rounded-xl px-4 py-3 text-[#e8e7e9] placeholder-[#8a898b] focus:outline-none focus:border-[#6b6a6c] focus:ring-1 focus:ring-[#6b6a6c]';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#3e3d3f] rounded-2xl shadow-sm border border-[#4e4d4f] p-6 md:p-8"
    >
      <h2 className="text-lg font-bold text-[#e8e7e9] mb-6">Create New Snap</h2>

      {/* Title */}
      <div className="mb-6">
        <label className="text-[#b5b4b6] text-sm font-medium mb-2 block">Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Buy me a coffee"
          required
          className={inputClass}
        />
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="text-[#b5b4b6] text-sm font-medium mb-2 block">Description</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Support my open source work"
          className={inputClass}
        />
      </div>

      {/* Destination */}
      <div className="mb-6">
        <label className="text-[#b5b4b6] text-sm font-medium mb-2 block">Destination Address *</label>
        <input
          type="text"
          value={form.destination}
          onChange={(e) => setForm({ ...form, destination: e.target.value })}
          placeholder="GABC..."
          required
          className={`${inputClass} font-mono text-sm`}
        />
        <button
          type="button"
          onClick={() => setForm({ ...form, destination: creator })}
          className="text-[#b5b4b6] text-sm mt-2 hover:text-[#e8e7e9] font-medium transition-colors"
        >
          Use my address
        </button>
      </div>

      {/* Amount */}
      <div className="mb-6">
        <label className="text-[#b5b4b6] text-sm font-medium mb-2 block">
          Amount (leave empty for open amount)
        </label>
        <div className="flex gap-3">
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="10"
            step="any"
            className={inputClass}
          />
          <select
            value={form.assetCode}
            onChange={(e) => setForm({ ...form, assetCode: e.target.value })}
            className="bg-[#525152] border border-[#4e4d4f] rounded-xl pl-3 pr-9 py-3 text-xs font-medium text-[#e8e7e9] focus:outline-none focus:border-[#6b6a6c] w-[6.5rem] min-w-[6.5rem]"
          >
            <option value="XLM">XLM</option>
            <option value="USDC">USDC</option>
          </select>
        </div>
      </div>

      {/* Memo */}
      <div className="mb-8">
        <label className="text-[#b5b4b6] text-sm font-medium mb-2 block">Memo</label>
        <input
          type="text"
          value={form.memo}
          onChange={(e) => setForm({ ...form, memo: e.target.value })}
          placeholder="Optional memo"
          className={inputClass}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-[#2a292b] border border-[#4e4d4f] rounded-xl">
          <p className="text-[#b5b4b6] text-sm">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mb-6 p-4 bg-[#525152] border border-[#4e4d4f] rounded-xl">
          <p className="text-[#e8e7e9] text-sm font-medium mb-2">Snap created!</p>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={success}
              readOnly
              className="flex-1 bg-[#3e3d3f] border border-[#4e4d4f] rounded-lg px-3 py-2 text-[#e8e7e9] text-xs font-mono"
            />
            <button
              type="button"
              onClick={copyLink}
              className="text-[#b5b4b6] text-sm font-medium hover:text-[#e8e7e9] shrink-0 transition-colors"
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
        className="w-full bg-[#525152] text-[#e8e7e9] font-semibold py-3.5 px-4 rounded-xl hover:bg-[#6b6a6c] transition-colors disabled:opacity-50 border border-[#4e4d4f]"
      >
        {isSubmitting ? 'Creating...' : 'Create Snap'}
      </button>
    </form>
  );
}
