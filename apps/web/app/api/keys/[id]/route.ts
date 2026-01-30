import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { withApiKey, authError } from '@/lib/auth/middleware';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

/**
 * DELETE /api/keys/[id]
 * 
 * Revoke an API key. The key will no longer work for authentication.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withApiKey(request);
  if (!auth.success) {
    return authError(auth.error, auth.status);
  }

  const { id } = await params;

  // Find the key and verify ownership
  const key = await db.query.apiKeys.findFirst({
    where: and(
      eq(apiKeys.id, id),
      eq(apiKeys.developerId, auth.auth.developer.id),
      isNull(apiKeys.revokedAt)
    ),
  });

  if (!key) {
    return NextResponse.json(
      { error: 'API key not found' },
      { status: 404, headers: corsHeaders }
    );
  }

  // Prevent revoking the key being used to make this request
  if (key.id === auth.auth.apiKey.id) {
    return NextResponse.json(
      { error: 'Cannot revoke the API key currently in use' },
      { status: 400, headers: corsHeaders }
    );
  }

  // Soft delete by setting revokedAt
  await db.update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(eq(apiKeys.id, id));

  return NextResponse.json(
    { success: true, message: 'API key revoked' },
    { headers: corsHeaders }
  );
}
