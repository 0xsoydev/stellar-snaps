import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys, developers } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { hashApiKey } from './utils';

export interface AuthenticatedRequest {
  developer: {
    id: string;
    walletAddress: string;
  };
  apiKey: {
    id: string;
    name: string | null;
  };
}

export type AuthResult = 
  | { success: true; auth: AuthenticatedRequest }
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
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
      },
    }
  );
}
