import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { intents } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { ONECLICK_API_URL, type IntentStatus } from '../../../../lib/intents';

const NEAR_INTENTS_API_KEY = process.env.NEAR_INTENTS_API_KEY;

/**
 * GET /api/intent/status?intentId=xxx
 * 
 * Check the status of a cross-chain payment intent
 * Updates our database with latest status from 1Click
 */
export async function GET(request: NextRequest) {
  try {
    const intentId = request.nextUrl.searchParams.get('intentId');
    const depositAddress = request.nextUrl.searchParams.get('depositAddress');

    if (!intentId && !depositAddress) {
      return NextResponse.json(
        { error: 'Missing intentId or depositAddress parameter' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find intent in our database
    let intent;
    if (intentId) {
      [intent] = await db.select().from(intents).where(eq(intents.id, intentId));
    } else if (depositAddress) {
      [intent] = await db.select().from(intents).where(eq(intents.depositAddress, depositAddress));
    }

    if (!intent) {
      return NextResponse.json(
        { error: 'Intent not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // If already completed, return cached status
    if (['SUCCESS', 'REFUNDED', 'FAILED'].includes(intent.status)) {
      return NextResponse.json({
        intentId: intent.id,
        status: intent.status,
        depositAddress: intent.depositAddress,
        amountIn: intent.amountIn,
        amountInFormatted: intent.amountInFormatted,
        amountOut: intent.amountOut,
        amountOutFormatted: intent.amountOutFormatted,
        depositTxHash: intent.depositTxHash,
        settlementTxHash: intent.settlementTxHash,
        refundTxHash: intent.refundTxHash,
        completedAt: intent.completedAt?.toISOString(),
      }, { headers: corsHeaders });
    }

    // Query 1Click for latest status
    const headers: HeadersInit = {};
    if (NEAR_INTENTS_API_KEY) {
      headers['Authorization'] = `Bearer ${NEAR_INTENTS_API_KEY}`;
    }

    const statusUrl = new URL(`${ONECLICK_API_URL}/v0/status`);
    statusUrl.searchParams.set('depositAddress', intent.depositAddress);
    if (intent.depositMemo) {
      statusUrl.searchParams.set('depositMemo', intent.depositMemo);
    }

    const statusResponse = await fetch(statusUrl.toString(), { headers });

    if (!statusResponse.ok) {
      // If 1Click doesn't have this deposit yet, it's still pending
      if (statusResponse.status === 404) {
        return NextResponse.json({
          intentId: intent.id,
          status: 'PENDING_DEPOSIT',
          depositAddress: intent.depositAddress,
          depositMemo: intent.depositMemo,
          amountIn: intent.amountIn,
          amountInFormatted: intent.amountInFormatted,
          amountOut: intent.amountOut,
          amountOutFormatted: intent.amountOutFormatted,
          expiresAt: intent.quoteExpiresAt?.toISOString(),
        }, { headers: corsHeaders });
      }

      console.error('[Intent Status] 1Click error:', statusResponse.status);
      return NextResponse.json(
        { error: 'Failed to get status from solver network' },
        { status: 502, headers: corsHeaders }
      );
    }

    const statusData = await statusResponse.json();
    const newStatus = mapStatus(statusData.status);

    // Update our database if status changed
    if (newStatus !== intent.status) {
      const updateData: Partial<typeof intent> = {
        status: newStatus,
        updatedAt: new Date(),
      };

      if (statusData.depositHash) {
        updateData.depositTxHash = statusData.depositHash;
      }
      if (statusData.withdrawHash) {
        updateData.settlementTxHash = statusData.withdrawHash;
      }
      if (statusData.refundHash) {
        updateData.refundTxHash = statusData.refundHash;
      }
      if (['SUCCESS', 'REFUNDED', 'FAILED'].includes(newStatus)) {
        updateData.completedAt = new Date();
      }

      await db.update(intents)
        .set(updateData)
        .where(eq(intents.id, intent.id));
    }

    return NextResponse.json({
      intentId: intent.id,
      status: newStatus,
      depositAddress: intent.depositAddress,
      amountIn: intent.amountIn,
      amountInFormatted: intent.amountInFormatted,
      amountOut: intent.amountOut,
      amountOutFormatted: intent.amountOutFormatted,
      depositTxHash: statusData.depositHash || intent.depositTxHash,
      settlementTxHash: statusData.withdrawHash || intent.settlementTxHash,
      refundTxHash: statusData.refundHash || intent.refundTxHash,
      amountReceived: statusData.amountInFormatted,
      amountDelivered: statusData.amountOutFormatted,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[Intent Status] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Map 1Click status to our status enum
 */
function mapStatus(oneClickStatus: string): IntentStatus {
  switch (oneClickStatus) {
    case 'PENDING_DEPOSIT':
      return 'PENDING_DEPOSIT';
    case 'PROCESSING':
      return 'PROCESSING';
    case 'SUCCESS':
      return 'SUCCESS';
    case 'INCOMPLETE_DEPOSIT':
      return 'INCOMPLETE_DEPOSIT';
    case 'REFUNDED':
      return 'REFUNDED';
    case 'FAILED':
      return 'FAILED';
    default:
      return 'PENDING_DEPOSIT';
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}
