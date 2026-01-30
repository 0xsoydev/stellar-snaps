import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { snaps } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/snap/[id] - combined resolve + metadata endpoint
// Also accepts ?url=t.co/xxx to resolve and fetch in one request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tcoUrl = request.nextUrl.searchParams.get('resolve');

  let snapId = id;

  // If 'resolve' param provided, resolve the t.co URL first
  if (tcoUrl) {
    try {
      const response = await fetch(tcoUrl, {
        method: 'HEAD',
        redirect: 'follow',
      });
      const finalUrl = response.url;
      
      // Extract snap ID from resolved URL
      const match = finalUrl.match(/\/s\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        snapId = match[1];
      } else {
        return NextResponse.json(
          { error: 'Not a valid snap URL' },
          { status: 400, headers: corsHeaders }
        );
      }
    } catch (err) {
      return NextResponse.json(
        { error: 'Failed to resolve URL' },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // Fetch snap metadata
  const [snap] = await db.select().from(snaps).where(eq(snaps.id, snapId));

  if (!snap) {
    return NextResponse.json(
      { error: 'Snap not found' },
      { status: 404, headers: corsHeaders }
    );
  }

  return NextResponse.json({
    id: snap.id,
    title: snap.title,
    description: snap.description,
    destination: snap.destination,
    amount: snap.amount,
    assetCode: snap.assetCode,
    assetIssuer: snap.assetIssuer,
    memo: snap.memo,
    memoType: snap.memoType,
    network: snap.network,
  }, { headers: corsHeaders });
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}
