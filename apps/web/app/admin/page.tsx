'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface RegistryEntry {
  domain: string;
  status: 'pending' | 'trusted' | 'unverified' | 'blocked';
  name: string | null;
  description: string | null;
  icon: string | null;
  ownerWallet: string | null;
  contactEmail: string | null;
  registeredAt: string;
  verifiedAt: string | null;
  updatedAt: string;
}

function AdminContent() {
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Registry state
  const [entries, setEntries] = useState<RegistryEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'trusted' | 'blocked'>('all');

  // Check URL params for admin login callback
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const adminToken = searchParams.get('adminToken');

    if (emailParam && adminToken) {
      // Verify admin token
      verifyAdminToken(emailParam, adminToken);
      window.history.replaceState({}, '', '/admin');
    } else {
      // Check localStorage for existing session
      const storedEmail = localStorage.getItem('admin_email');
      const storedToken = localStorage.getItem('admin_token');
      if (storedEmail && storedToken) {
        verifyAdminToken(storedEmail, storedToken);
      } else {
        setIsLoading(false);
      }
    }
  }, [searchParams]);

  const verifyAdminToken = async (email: string, token: string) => {
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });

      if (res.ok) {
        localStorage.setItem('admin_email', email);
        localStorage.setItem('admin_token', token);
        setEmail(email);
        setIsAdmin(true);
      } else {
        localStorage.removeItem('admin_email');
        localStorage.removeItem('admin_token');
        setError('Invalid or expired admin session');
      }
    } catch {
      setError('Failed to verify admin session');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEntries = useCallback(async () => {
    if (!email) return;
    
    setIsLoadingEntries(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/admin/registry', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (err) {
      console.error('Failed to fetch entries:', err);
    } finally {
      setIsLoadingEntries(false);
    }
  }, [email]);

  useEffect(() => {
    if (isAdmin) {
      fetchEntries();
    }
  }, [isAdmin, fetchEntries]);

  const handleSendLink = async () => {
    setIsSendingLink(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      });

      const data = await res.json();

      if (res.ok) {
        setLinkSent(true);
      } else {
        setError(data.error || 'Failed to send login link');
      }
    } catch {
      setError('Failed to send login link');
    } finally {
      setIsSendingLink(false);
    }
  };

  const handleStatusChange = async (domain: string, newStatus: string) => {
    setActionLoading(domain);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/admin/registry', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ domain, status: newStatus }),
      });

      if (res.ok) {
        fetchEntries();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (domain: string) => {
    if (!confirm(`Delete ${domain} from registry?`)) return;
    
    setActionLoading(domain);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/registry?domain=${encodeURIComponent(domain)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        fetchEntries();
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_email');
    localStorage.removeItem('admin_token');
    setEmail(null);
    setIsAdmin(false);
    setEntries([]);
  };

  const filteredEntries = entries.filter(e => 
    filter === 'all' ? true : e.status === filter
  );

  const pendingCount = entries.filter(e => e.status === 'pending').length;

  // Background
  const background = (
    <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
      <div
        className="w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(rgba(254, 51, 10, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(254, 51, 10, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          filter: 'blur(3px)',
        }}
      />
    </div>
  );

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden flex items-center justify-center">
        {background}
        <div className="relative z-10 text-gray-400">Loading...</div>
      </div>
    );
  }

  // Not admin - show login
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden flex items-center justify-center p-4">
        {background}
        <div className="relative z-10 w-full max-w-md text-center">
          <Link href="/" className="inline-block mb-6">
            <img src="/stellar.png" alt="Stellar Snaps" className="h-10 mx-auto" />
          </Link>
          
          {linkSent ? (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#fe330a]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#fe330a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">Check your email</h1>
              <p className="text-gray-400 mb-6">
                We sent an admin login link to <span className="text-white">{emailInput}</span>
              </p>
              <button
                onClick={() => setLinkSent(false)}
                className="text-gray-500 hover:text-white text-sm transition-colors"
              >
                Use a different email
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2">Admin Login</h1>
              <p className="text-gray-400 mb-6">
                Enter your admin email to get a login link.
              </p>
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@example.com"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe330a]/50 mb-4"
                onKeyDown={(e) => e.key === 'Enter' && handleSendLink()}
              />
              <button
                onClick={handleSendLink}
                disabled={isSendingLink || !emailInput}
                className="w-full bg-[#fe330a] hover:bg-[#d92b08] text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
              >
                {isSendingLink ? 'Sending...' : 'Send Login Link'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden p-4 md:p-8">
      {background}
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img src="/stellar.png" alt="Stellar Snaps" className="h-8" />
            </Link>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            {pendingCount > 0 && (
              <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">
                {pendingCount} pending
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{email}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'trusted', 'blocked'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-[#fe330a] text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && pendingCount > 0 && (
                <span className="ml-2 bg-white/20 px-1.5 rounded">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Registry table */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold">Domain Registry</h2>
            <button
              onClick={fetchEntries}
              disabled={isLoadingEntries}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {isLoadingEntries ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {isLoadingEntries && entries.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Loading entries...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No {filter === 'all' ? '' : filter} domains found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                    <th className="px-6 py-3">Domain</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3">Registered</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.domain} className="hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{entry.domain}</div>
                          {entry.name && (
                            <div className="text-sm text-gray-500">{entry.name}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          entry.status === 'trusted'
                            ? 'bg-green-500/20 text-green-400'
                            : entry.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : entry.status === 'blocked'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {entry.contactEmail || entry.ownerWallet?.slice(0, 8) || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(entry.registeredAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {entry.status !== 'trusted' && (
                            <button
                              onClick={() => handleStatusChange(entry.domain, 'trusted')}
                              disabled={actionLoading === entry.domain}
                              className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors disabled:opacity-50"
                            >
                              Approve
                            </button>
                          )}
                          {entry.status !== 'blocked' && (
                            <button
                              onClick={() => handleStatusChange(entry.domain, 'blocked')}
                              disabled={actionLoading === entry.domain}
                              className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            >
                              Block
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(entry.domain)}
                            disabled={actionLoading === entry.domain}
                            className="text-xs px-2 py-1 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminContent />
    </Suspense>
  );
}
