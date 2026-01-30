import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys, developers, walletSessions } from '@/lib/db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { hashApiKey } from './utils';

export interface AuthenticatedRequest {
  developer: {
    id: string;
    email: string;
    walletAddress?: string | null;
  };
  apiKey: {
    id: string;
    name: string | null;
  };
}

export interface WalletAuthenticatedRequest {
  walletAddress: string;
}

export type AuthResult = 
  | { success: true; auth: AuthenticatedRequest }
  | { success: false; error: string; status: number };

export type WalletAuthResult =
  | { success: true; auth: WalletAuthenticatedRequest }
  | { success: false; error: string; status: number };

export type FlexibleAuthResult =
  | { success: true; walletAddress: string; type: 'wallet' | 'apikey' }
  | { success: false; error: string; status: number };

/**
 * Validate an API key from request headers
 * 
 * Usage:
 * ```ts
 * const auth = await withApiKey(request);
 * if (!auth.success) {
 *   return NextResponse.json({ error: auth.error }, { status: auth.status });
 * }
 * const { developer, apiKey } = auth.auth;
 * ```
 */
export async function withApiKey(request: NextRequest): Promise<AuthResult> {
  const apiKeyHeader = request.headers.get('X-API-Key');

  if (!apiKeyHeader) {
    return {
      success: false,
      error: 'Missing X-API-Key header',
      status: 401,
    };
  }

  // Validate key format
  if (!apiKeyHeader.startsWith('snaps_')) {
    return {
      success: false,
      error: 'Invalid API key format',
      status: 401,
    };
  }

  // Hash the key to look it up
  const keyHash = hashApiKey(apiKeyHeader);

  // Find the key in database
  const key = await db.query.apiKeys.findFirst({
    where: and(
      eq(apiKeys.keyHash, keyHash),
      isNull(apiKeys.revokedAt)
    ),
  });

  if (!key) {
    return {
      success: false,
      error: 'Invalid or revoked API key',
      status: 401,
    };
  }

  // Get the developer
  const developer = await db.query.developers.findFirst({
    where: eq(developers.id, key.developerId),
  });

  if (!developer) {
    return {
      success: false,
      error: 'Developer account not found',
      status: 401,
    };
  }

  // Update last used timestamp (fire and forget)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, key.id))
    .catch(() => {}); // Ignore errors

  return {
    success: true,
    auth: {
      developer: {
        id: developer.id,
        email: developer.email,
        walletAddress: developer.walletAddress,
      },
      apiKey: {
        id: key.id,
        name: key.name,
      },
    },
  };
}

/**
 * Helper to create an error response with CORS headers
 */
export function authError(error: string, status: number): NextResponse {
  return NextResponse.json(
    { error },
    {
      status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
      },
    }
  );
}

/**
 * Validate a wallet session token from request headers
 * Expects: Authorization: Bearer <token>
 */
export async function withWalletSession(request: NextRequest): Promise<WalletAuthResult> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Missing or invalid Authorization header',
      status: 401,
    };
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  // Find valid session
  const [session] = await db
    .select()
    .from(walletSessions)
    .where(
      and(
        eq(walletSessions.token, token),
        gt(walletSessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!session) {
    return {
      success: false,
      error: 'Invalid or expired session',
      status: 401,
    };
  }

  return {
    success: true,
    auth: {
      walletAddress: session.walletAddress,
    },
  };
}

/**
 * Flexible auth that accepts either:
 * - X-API-Key header (for SDK/developer use)
 * - Authorization: Bearer <token> (for dashboard/wallet users)
 * 
 * Returns the wallet address in both cases for consistent access control
 */
export async function withFlexibleAuth(request: NextRequest): Promise<FlexibleAuthResult> {
  const apiKeyHeader = request.headers.get('X-API-Key');
  const authHeader = request.headers.get('Authorization');

  // Try API key first
  if (apiKeyHeader) {
    const result = await withApiKey(request);
    if (result.success) {
      // Use the developer's wallet address if set, otherwise use email as identifier
      const walletAddress = result.auth.developer.walletAddress;
      if (!walletAddress) {
        return {
          success: false,
          error: 'Developer account has no wallet address linked',
          status: 400,
        };
      }
      return {
        success: true,
        walletAddress,
        type: 'apikey',
      };
    }
    return result;
  }

  // Try wallet session
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const result = await withWalletSession(request);
    if (result.success) {
      return {
        success: true,
        walletAddress: result.auth.walletAddress,
        type: 'wallet',
      };
    }
    return result;
  }

  return {
    success: false,
    error: 'Missing authentication. Provide X-API-Key or Authorization header.',
    status: 401,
  };
}
