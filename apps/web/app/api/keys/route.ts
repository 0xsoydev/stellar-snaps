import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { withApiKey, authError } from '@/lib/auth/middleware';
import { generateId, generateApiKey } from '@/lib/auth/utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

/**
 * GET /api/keys
 * 
 * List all API keys for the authenticated developer.
 * Returns key metadata only (not the actual keys).
 */
export async function GET(request: NextRequest) {
  const auth = await withApiKey(request);
  if (!auth.success) {
    return authError(auth.error, auth.status);
  }

  const keys = await db.query.apiKeys.findMany({
    where: and(
      eq(apiKeys.developerId, auth.auth.developer.id),
      isNull(apiKeys.revokedAt)
    ),
    columns: {
      id: true,
      keyPrefix: true,
      name: true,
      createdAt: true,
      lastUsedAt: true,
    },
    orderBy: (apiKeys, { desc }) => [desc(apiKeys.createdAt)],
  });

  return NextResponse.json(
    { keys },
    { headers: corsHeaders }
  );
}

/**
 * POST /api/keys
 * 
 * Create a new API key for the authenticated developer.
 * 
 * Body: { name?: string }
 * Response: { key: {...}, apiKey: string } (key only shown once!)
 */
export async function POST(request: NextRequest) {
  const auth = await withApiKey(request);
  if (!auth.success) {
    return authError(auth.error, auth.status);
  }

  let name = 'Default';
  try {
    const body = await request.json();
    if (body.name && typeof body.name === 'string') {
      name = body.name.slice(0, 50); // Limit name length
    }
  } catch {
    // Empty body is fine
  }

  // Generate new API key
  const { key, hash, prefix } = generateApiKey();
  const keyId = generateId();

  await db.insert(apiKeys).values({
    id: keyId,
    developerId: auth.auth.developer.id,
    keyHash: hash,
    keyPrefix: prefix,
    name,
  });

  return NextResponse.json(
    {
      key: {
        id: keyId,
        keyPrefix: prefix,
        name,
        createdAt: new Date().toISOString(),
      },
      apiKey: key, // Only shown once!
      message: 'Save this API key securely. It will not be shown again.',
    },
    { headers: corsHeaders }
  );
}
