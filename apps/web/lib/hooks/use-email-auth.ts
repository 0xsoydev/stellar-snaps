'use client';

import { useState, useEffect, useCallback } from 'react';

const API_KEY_STORAGE_KEY = 'stellar-snaps-api-key';
const EMAIL_STORAGE_KEY = 'stellar-snaps-email';

interface ApiKey {
  id: string;
  keyPrefix: string;
  name: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

interface UseEmailAuthReturn {
  // Auth state
  email: string | null;
  apiKey: string | null;
  isAuthenticated: boolean;
  
  // Loading states
  isLoading: boolean;
  isSendingLink: boolean;
  
  // Error
  error: string | null;
  
  // Actions
  sendMagicLink: (email: string) => Promise<boolean>;
  setAuthFromUrl: (apiKey: string, email: string) => void;
  logout: () => void;
  
  // API key management
  keys: ApiKey[];
  isLoadingKeys: boolean;
  fetchKeys: () => Promise<void>;
  createKey: (name?: string) => Promise<string | null>;
  revokeKey: (id: string) => Promise<boolean>;
}

export function useEmailAuth(): UseEmailAuthReturn {
  const [email, setEmail] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  // Load stored values on mount
  useEffect(() => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    const storedEmail = localStorage.getItem(EMAIL_STORAGE_KEY);
    
    if (storedKey) setApiKey(storedKey);
    if (storedEmail) setEmail(storedEmail);
    
    setIsLoading(false);
  }, []);

  const sendMagicLink = useCallback(async (emailInput: string): Promise<boolean> => {
    setIsSendingLink(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send magic link');
      }

      return true;
    } catch (err) {
      console.error('Magic link failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
      return false;
    } finally {
      setIsSendingLink(false);
    }
  }, []);

  const setAuthFromUrl = useCallback((newApiKey: string, newEmail: string) => {
    setApiKey(newApiKey);
    setEmail(newEmail);
    localStorage.setItem(API_KEY_STORAGE_KEY, newApiKey);
    localStorage.setItem(EMAIL_STORAGE_KEY, newEmail);
  }, []);

  const logout = useCallback(() => {
    setApiKey(null);
    setEmail(null);
    setKeys([]);
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem(EMAIL_STORAGE_KEY);
  }, []);

  const fetchKeys = useCallback(async () => {
    if (!apiKey) return;

    setIsLoadingKeys(true);
    try {
      const res = await fetch('/api/keys', {
        headers: { 'X-API-Key': apiKey },
      });

      if (!res.ok) {
        if (res.status === 401) {
          // API key is invalid, clear it
          logout();
          return;
        }
        throw new Error('Failed to fetch keys');
      }

      const data = await res.json();
      setKeys(data.keys || []);
    } catch (err) {
      console.error('Fetch keys failed:', err);
    } finally {
      setIsLoadingKeys(false);
    }
  }, [apiKey, logout]);

  const createKey = useCallback(async (name?: string): Promise<string | null> => {
    if (!apiKey) return null;

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ name: name || 'New Key' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create key');
      }

      const data = await res.json();
      await fetchKeys(); // Refresh the list
      return data.apiKey; // Return the new key (only shown once!)
    } catch (err) {
      console.error('Create key failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to create key');
      return null;
    }
  }, [apiKey, fetchKeys]);

  const revokeKey = useCallback(async (id: string): Promise<boolean> => {
    if (!apiKey) return false;

    try {
      const res = await fetch(`/api/keys/${id}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': apiKey },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to revoke key');
      }

      await fetchKeys(); // Refresh the list
      return true;
    } catch (err) {
      console.error('Revoke key failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to revoke key');
      return false;
    }
  }, [apiKey, fetchKeys]);

  // Auto-fetch keys when API key is set
  useEffect(() => {
    if (apiKey) {
      fetchKeys();
    }
  }, [apiKey, fetchKeys]);

  return {
    email,
    apiKey,
    isAuthenticated: !!apiKey,
    isLoading,
    isSendingLink,
    error,
    sendMagicLink,
    setAuthFromUrl,
    logout,
    keys,
    isLoadingKeys,
    fetchKeys,
    createKey,
    revokeKey,
  };
}
