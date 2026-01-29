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
  refreshKey: number;
};

export default function SnapsList({ creator, refreshKey }: Props) {
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSnaps();
  }, [creator, refreshKey]);

  const fetchSnaps = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/snaps?creator=${encodeURIComponent(creator)}`);
      if (res.ok) {
        const data = await res.json();
        setSnaps(data);
      }
    } catch (err) {
      console.error('Failed to fetch snaps:', err);
    }
    setLoading(false);
  };

  const deleteSnap = async (id: string) => {
    if (!confirm('Delete this snap?')) return;

    try {
      const res = await fetch(`/api/snaps?id=${id}&creator=${encodeURIComponent(creator)}`, {
        method: 'DELETE',
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

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <p className="font-inter-italic text-gray-400 text-center">Loading...</p>
      </div>
    );
  }

  if (snaps.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <p className="text-gray-400 text-center">No snaps yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {snaps.map((snap) => (
        <div key={snap.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium truncate">{snap.title}</h3>
              <p className="font-inter-italic text-gray-500 text-sm">
                {snap.amount ? `${snap.amount} ${snap.assetCode || 'XLM'}` : 'Open amount'}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => copyLink(snap.id)}
                className="font-bricolage text-purple-400 hover:text-purple-300 text-sm"
              >
                Copy
              </button>
              <a
                href={`/s/${snap.id}`}
                target="_blank"
                rel="noopener"
                className="font-bricolage text-gray-400 hover:text-white text-sm"
              >
                View
              </a>
              <button
                onClick={() => deleteSnap(snap.id)}
                className="font-bricolage text-red-400 hover:text-red-300 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
