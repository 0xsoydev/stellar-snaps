import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { snaps } from '@/lib/db/schema';
import { nanoid } from 'nanoid';
import { eq, and } from 'drizzle-orm';
import { withApiKey, authError } from '@/lib/auth/middleware';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

/**
 * GET /api/snaps
 * 
 * List all snaps created by the authenticated developer.
 * Requires X-API-Key header.
 */
export async function GET(request: NextRequest) {
  const auth = await withApiKey(request);
  if (!auth.success) {
    return authError(auth.error, auth.status);
  }

  const results = await db
    .select()
    .from(snaps)
    .where(eq(snaps.creator, auth.auth.developer.walletAddress))
    .orderBy(snaps.createdAt);

  return NextResponse.json({ snaps: results }, { headers: corsHeaders });
}

/**
 * POST /api/snaps
 * 
 * Create a new snap. Creator is set to the authenticated developer's wallet.
 * Requires X-API-Key header.
 * 
 * Body: { title, description?, destination, amount?, assetCode?, assetIssuer?, memo?, memoType?, network?, imageUrl? }
 */
export async function POST(request: NextRequest) {
  const auth = await withApiKey(request);
  if (!auth.success) {
    return authError(auth.error, auth.status);
  }

  try {
    const body = await request.json();
    const { title, description, destination, amount, assetCode, assetIssuer, memo, memoType, network, imageUrl } = body;

    if (!title || !destination) {
      return NextResponse.json(
        { error: 'title and destination are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate destination
    if (destination.length !== 56 || !destination.startsWith('G')) {
      return NextResponse.json(
        { error: 'Invalid Stellar destination address' },
        { status: 400, headers: corsHeaders }
      );
    }

    const id = nanoid(8);

    const [newSnap] = await db.insert(snaps).values({
      id,
      creator: auth.auth.developer.walletAddress,
      title,
      description: description || null,
      destination,
      amount: amount || null,
      assetCode: assetCode || 'XLM',
      assetIssuer: assetIssuer || null,
      memo: memo || null,
      memoType: memoType || 'MEMO_TEXT',
      network: network || 'testnet',
      imageUrl: imageUrl || null,
    }).returning();

    return NextResponse.json({ snap: newSnap }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Error creating snap:', error);
    return NextResponse.json(
      { error: 'Failed to create snap' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * DELETE /api/snaps?id=xxx
 * 
 * Delete a snap. Only the creator can delete their own snaps.
 * Requires X-API-Key header.
 */
export async function DELETE(request: NextRequest) {
  const auth = await withApiKey(request);
  if (!auth.success) {
    return authError(auth.error, auth.status);
  }

  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'id param required' },
      { status: 400, headers: corsHeaders }
    );
  }

  // Find the snap and verify ownership
  const [snap] = await db
    .select()
    .from(snaps)
    .where(and(
      eq(snaps.id, id),
      eq(snaps.creator, auth.auth.developer.walletAddress)
    ));

  if (!snap) {
    return NextResponse.json(
      { error: 'Snap not found or not owned by you' },
      { status: 404, headers: corsHeaders }
    );
  }

  await db.delete(snaps).where(eq(snaps.id, id));

  return NextResponse.json(
    { success: true, message: 'Snap deleted' },
    { headers: corsHeaders }
  );
}
