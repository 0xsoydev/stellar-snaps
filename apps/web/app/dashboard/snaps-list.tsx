'use client';

import { useState, useEffect } from 'react';

type Snap = {
  id: string;
  title: string;
  destination: string;
  amount: string | null;
  assetCode: string | null;
  createdAt: string;
};

type Props = {
  creator: string;
  sessionToken?: string;
  refreshKey: number;
};

export default function SnapsList({ creator, sessionToken, refreshKey }: Props) {
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSnaps();
  }, [creator, sessionToken, refreshKey]);

  const fetchSnaps = async () => {
    if (!sessionToken) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/snaps', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSnaps(data.snaps || []);
      }
    } catch (err) {
      console.error('Failed to fetch snaps:', err);
    }
    setLoading(false);
  };

  const deleteSnap = async (id: string) => {
    if (!confirm('Delete this snap?')) return;
    if (!sessionToken) return;

    try {
      const res = await fetch(`/api/snaps?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
      if (res.ok) {
        setSnaps(snaps.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete snap:', err);
    }
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/s/${id}`;
    navigator.clipboard.writeText(url);
  };

  const cardBase =
    'bg-[#3e3d3f] rounded-2xl shadow-sm border border-[#4e4d4f] p-6 md:p-8';

  if (loading) {
    return (
      <div className={cardBase}>
        <h2 className="text-lg font-bold text-[#e8e7e9] mb-6">Your Snaps</h2>
        <p className="text-[#b5b4b6] text-center text-sm">Loading...</p>
      </div>
    );
  }

  if (snaps.length === 0) {
    return (
      <div className={cardBase}>
        <h2 className="text-lg font-bold text-[#e8e7e9] mb-6">Your Snaps</h2>
        <p className="text-[#b5b4b6] text-center text-sm">No snaps yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className={cardBase}>
      <h2 className="text-lg font-bold text-[#e8e7e9] mb-6">Your Snaps</h2>
      <div className="space-y-3">
        {snaps.map((snap) => (
          <div
            key={snap.id}
            className="bg-[#525152] rounded-xl border border-[#4e4d4f] p-4 flex items-start justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-[#e8e7e9] font-semibold truncate text-base">{snap.title}</h3>
              <p className="text-[#b5b4b6] text-sm mt-1">
                {snap.amount ? `${snap.amount} ${snap.assetCode || 'XLM'}` : 'Open amount'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => copyLink(snap.id)}
                className="text-[#b5b4b6] hover:text-[#e8e7e9] text-sm font-medium transition-colors"
              >
                Copy
              </button>
              <a
                href={`/s/${snap.id}`}
                target="_blank"
                rel="noopener"
                className="text-[#b5b4b6] hover:text-[#e8e7e9] text-sm font-medium transition-colors"
              >
                View
              </a>
              <button
                onClick={() => deleteSnap(snap.id)}
                className="text-[#8a898b] hover:text-[#e8e7e9] text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
