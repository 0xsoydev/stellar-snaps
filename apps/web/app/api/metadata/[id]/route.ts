import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { snaps } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/metadata/[id] - get snap metadata for extension
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [snap] = await db.select().from(snaps).where(eq(snaps.id, id));

  if (!snap) {
    return NextResponse.json({ error: 'Snap not found' }, { status: 404 });
  }

  // Return metadata for extension to render card
  return NextResponse.json({
    id: snap.id,
    title: snap.title,
    description: snap.description,
    imageUrl: snap.imageUrl,
    destination: snap.destination,
    amount: snap.amount,
    assetCode: snap.assetCode,
    assetIssuer: snap.assetIssuer,
    memo: snap.memo,
    memoType: snap.memoType,
    network: snap.network,
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
    },
  });
}
