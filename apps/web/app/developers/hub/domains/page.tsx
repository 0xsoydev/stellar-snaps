'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEmailAuth } from '@/lib/hooks/use-email-auth';

interface Domain {
  domain: string;
  status: 'pending' | 'trusted' | 'unverified' | 'blocked';
  name: string | null;
  description: string | null;
  registeredAt: string;
  verifiedAt: string | null;
}

function DomainsContent() {
  const searchParams = useSearchParams();
  
  const {
    email,
    apiKey,
    isAuthenticated,
    isLoading,
    isSendingLink,
    error,
    sendMagicLink,
    setAuthFromUrl,
    logout,
  } = useEmailAuth();

  const [emailInput, setEmailInput] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Domain state
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Check URL params for magic link callback
  useEffect(() => {
    const newKey = searchParams.get('newKey');
    const emailParam = searchParams.get('email');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setUrlError(errorParam);
      window.history.replaceState({}, '', '/developers/hub/domains');
    }

    if (newKey && emailParam) {
      setAuthFromUrl(newKey, emailParam);
      window.history.replaceState({}, '', '/developers/hub/domains');
    }
  }, [searchParams, setAuthFromUrl]);

  const fetchDomains = useCallback(async () => {
    if (!apiKey) return;
    
    setIsLoadingDomains(true);
    try {
      const res = await fetch('/api/domains', {
        headers: { 'X-API-Key': apiKey },
      });
      
      if (res.ok) {
        const data = await res.json();
        setDomains(data.domains || []);
      }
    } catch (err) {
      console.error('Failed to fetch domains:', err);
    } finally {
      setIsLoadingDomains(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (isAuthenticated && apiKey) {
      fetchDomains();
    }
  }, [isAuthenticated, apiKey, fetchDomains]);

  const handleSendLink = async () => {
    const success = await sendMagicLink(emailInput);
    if (success) {
      setLinkSent(true);
    }
  };

  const handleRegister = async () => {
    if (!domainInput.trim()) return;
    
    setIsRegistering(true);
    setRegisterError(null);
    setRegisterSuccess(null);

    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey!,
        },
        body: JSON.stringify({
          domain: domainInput.trim(),
          name: nameInput.trim() || undefined,
          description: descInput.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setRegisterSuccess(`Domain "${domainInput}" registered and pending review`);
        setDomainInput('');
        setNameInput('');
        setDescInput('');
        fetchDomains();
      } else {
        setRegisterError(data.error || 'Failed to register domain');
      }
    } catch {
      setRegisterError('Failed to register domain');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDelete = async (domain: string) => {
    if (!confirm(`Remove ${domain} from registry?`)) return;
    
    setDeleting(domain);
    try {
      const res = await fetch(`/api/domains?domain=${encodeURIComponent(domain)}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': apiKey! },
      });

      if (res.ok) {
        fetchDomains();
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeleting(null);
    }
  };

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

  // Not authenticated - show email input
  if (!isAuthenticated) {
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
                We sent a sign-in link to <span className="text-white">{emailInput}</span>
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
              <h1 className="text-2xl font-bold mb-2">Sign in</h1>
              <p className="text-gray-400 mb-6">
                Enter your email to manage your domains.
              </p>
              {(error || urlError) && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error || urlError}
                </div>
              )}
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe330a]/50 mb-4"
                onKeyDown={(e) => e.key === 'Enter' && handleSendLink()}
              />
              <button
                onClick={handleSendLink}
                disabled={isSendingLink || !emailInput}
                className="w-full bg-[#fe330a] hover:bg-[#d92b08] text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
              >
                {isSendingLink ? 'Sending...' : 'Send Sign-in Link'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Authenticated - show domains management
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden p-4 md:p-8">
      {background}
      
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link href="/developers/hub">
              <span className="text-gray-500 hover:text-white transition-colors">&larr;</span>
            </Link>
            <h1 className="text-xl font-bold">Domain Registry</h1>
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

        {/* Register new domain */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="font-semibold mb-4">Register a Domain</h2>
          <p className="text-sm text-gray-400 mb-4">
            Register your domain to be displayed as trusted in the Stellar Snaps extension.
            Domains are reviewed by our team before being approved.
          </p>
          
          {registerError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {registerError}
            </div>
          )}
          {registerSuccess && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
              {registerSuccess}
            </div>
          )}

          <div className="space-y-3">
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="yourdomain.com"
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe330a]/50"
            />
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Display name (optional)"
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe330a]/50"
            />
            <textarea
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              placeholder="Short description (optional)"
              rows={2}
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe330a]/50 resize-none"
            />
            <button
              onClick={handleRegister}
              disabled={isRegistering || !domainInput.trim()}
              className="bg-[#fe330a] hover:bg-[#d92b08] text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {isRegistering ? 'Registering...' : 'Register Domain'}
            </button>
          </div>
        </div>

        {/* Domains list */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold">Your Domains</h2>
            <button
              onClick={fetchDomains}
              disabled={isLoadingDomains}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {isLoadingDomains ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          
          {isLoadingDomains && domains.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Loading domains...</div>
          ) : domains.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No domains registered yet. Register one above.
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {domains.map((domain) => (
                <div key={domain.domain} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{domain.domain}</span>
                      <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                        domain.status === 'trusted'
                          ? 'bg-green-500/20 text-green-400'
                          : domain.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : domain.status === 'blocked'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {domain.status}
                      </span>
                    </div>
                    {domain.name && domain.name !== domain.domain && (
                      <div className="text-sm text-gray-500">{domain.name}</div>
                    )}
                    <div className="text-xs text-gray-600 mt-1">
                      Registered {new Date(domain.registeredAt).toLocaleDateString()}
                      {domain.verifiedAt && (
                        <> &middot; Verified {new Date(domain.verifiedAt).toLocaleDateString()}</>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(domain.domain)}
                    disabled={deleting === domain.domain}
                    className="text-sm text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {deleting === domain.domain ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-gray-900/30 border border-gray-800 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">Domain Verification</h3>
          <p className="text-gray-500 text-sm">
            Once your domain is approved, it will show as <span className="text-green-400">trusted</span> in 
            the Stellar Snaps browser extension, helping users identify legitimate payment requests.
          </p>
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

export default function DomainsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DomainsContent />
    </Suspense>
  );
}
