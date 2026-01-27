import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { snaps } from '../../../lib/db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

// GET /api/snaps - list snaps for a creator
export async function GET(request: NextRequest) {
  const creator = request.nextUrl.searchParams.get('creator');

  if (!creator) {
    return NextResponse.json({ error: 'creator param required' }, { status: 400 });
  }

  const results = await db.select().from(snaps).where(eq(snaps.creator, creator));
  return NextResponse.json(results);
}

// POST /api/snaps - create a new snap
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { creator, title, description, destination, amount, assetCode, assetIssuer, memo, memoType, network, imageUrl } = body;

    if (!creator || !title || !destination) {
      return NextResponse.json({ error: 'creator, title, and destination are required' }, { status: 400 });
    }

    // Validate destination
    if (destination.length !== 56 || !destination.startsWith('G')) {
      return NextResponse.json({ error: 'Invalid Stellar destination address' }, { status: 400 });
    }

    const id = nanoid(8);

    const [newSnap] = await db.insert(snaps).values({
      id,
      creator,
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

    return NextResponse.json(newSnap, { status: 201 });
  } catch (error) {
    console.error('Error creating snap:', error);
    return NextResponse.json({ error: 'Failed to create snap' }, { status: 500 });
  }
}

// DELETE /api/snaps - delete a snap
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  const creator = request.nextUrl.searchParams.get('creator');

  if (!id || !creator) {
    return NextResponse.json({ error: 'id and creator params required' }, { status: 400 });
  }

  // First check ownership
  const [snap] = await db.select().from(snaps).where(eq(snaps.id, id));

  if (!snap) {
    return NextResponse.json({ error: 'Snap not found' }, { status: 404 });
  }

  if (snap.creator !== creator) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Now delete
  await db.delete(snaps).where(eq(snaps.id, id));

  return NextResponse.json({ success: true });
}
