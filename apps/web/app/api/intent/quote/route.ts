import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { intents, snaps } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  ONECLICK_API_URL,
  SUPPORTED_CHAINS,
  STELLAR_DECIMALS,
  getStellarAssetId,
  getSourceAsset,
  generateIntentId,
  toBaseUnits,
  type ChainId,
} from '../../../../lib/intents';

const NEAR_INTENTS_API_KEY = process.env.NEAR_INTENTS_API_KEY;

interface QuoteRequestBody {
  snapId: string;
  sourceChain: ChainId;
  sourceAsset: string; // "ETH", "USDC", etc.
  refundAddress: string;
  dry?: boolean;
}

/**
 * POST /api/intent/quote
 * 
 * Get a quote for cross-chain payment to a snap
 * Creates an intent record and returns deposit instructions
 */
export async function POST(request: NextRequest) {
  try {
    const body: QuoteRequestBody = await request.json();
    const { snapId, sourceChain, sourceAsset, refundAddress, dry = false } = body;

    // Validate required fields
    if (!snapId || !sourceChain || !sourceAsset || !refundAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: snapId, sourceChain, sourceAsset, refundAddress' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get snap details
    const [snap] = await db.select().from(snaps).where(eq(snaps.id, snapId));
    if (!snap) {
      return NextResponse.json(
        { error: 'Snap not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Only allow cross-chain for mainnet snaps
    if (snap.network !== 'public') {
      return NextResponse.json(
        { error: 'Cross-chain payments only available for mainnet snaps' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate source chain and asset
    const chain = SUPPORTED_CHAINS[sourceChain];
    if (!chain) {
      return NextResponse.json(
        { error: `Unsupported chain: ${sourceChain}` },
        { status: 400, headers: corsHeaders }
      );
    }

    const sourceAssetInfo = getSourceAsset(sourceChain, sourceAsset);
    if (!sourceAssetInfo) {
      return NextResponse.json(
        { error: `Unsupported asset ${sourceAsset} on ${sourceChain}` },
        { status: 400, headers: corsHeaders }
      );
    }

    // Calculate amount out in Stellar base units (7 decimals)
    const stellarAssetCode = snap.assetCode || 'XLM';
    const amountOut = snap.amount 
      ? toBaseUnits(snap.amount, STELLAR_DECIMALS)
      : null;

    if (!amountOut) {
      return NextResponse.json(
        { error: 'Snap must have a fixed amount for cross-chain payments' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Build 1Click quote request with NEW schema
    const deadline = new Date(Date.now() + 30 * 60 * 1000); // 30 min from now
    
    const quotePayload = {
      dry,
      swapType: 'EXACT_OUTPUT',
      slippageTolerance: 100, // 1%
      originAsset: sourceAssetInfo.assetId,
      depositType: 'ORIGIN_CHAIN',
      destinationAsset: getStellarAssetId(stellarAssetCode),
      amount: amountOut,
      refundTo: refundAddress,
      refundType: 'ORIGIN_CHAIN',
      recipient: snap.destination,
      recipientType: 'DESTINATION_CHAIN',
      deadline: deadline.toISOString(),
    };

    // Call 1Click API
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (NEAR_INTENTS_API_KEY) {
      headers['Authorization'] = `Bearer ${NEAR_INTENTS_API_KEY}`;
    }

    console.log('[Intent Quote] Calling 1Click with:', JSON.stringify(quotePayload, null, 2));

    const quoteResponse = await fetch(`${ONECLICK_API_URL}/v0/quote`, {
      method: 'POST',
      headers,
      body: JSON.stringify(quotePayload),
    });

    if (!quoteResponse.ok) {
      const errorText = await quoteResponse.text();
      console.error('[Intent Quote] 1Click error:', quoteResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to get quote from solver network', details: errorText },
        { status: 502, headers: corsHeaders }
      );
    }

    const quoteData = await quoteResponse.json();
    const quote = quoteData.quote;

    // If dry run, just return the quote preview
    if (dry) {
      return NextResponse.json({
        dry: true,
        amountIn: quote.amountIn,
        amountInFormatted: quote.amountInFormatted,
        amountOut: quote.amountOut,
        amountOutFormatted: quote.amountOutFormatted,
        timeEstimate: quote.timeEstimate || 60,
        sourceChain,
        sourceAsset,
        destinationAsset: stellarAssetCode,
      }, { headers: corsHeaders });
    }

    // Create intent record
    const intentId = generateIntentId();
    const expiresAt = quote.deadline 
      ? new Date(quote.deadline) 
      : deadline;

    await db.insert(intents).values({
      id: intentId,
      snapId: snap.id,
      depositAddress: quote.depositAddress,
      depositMemo: quote.depositMemo,
      sourceChain,
      sourceAsset,
      sourceAssetId: sourceAssetInfo.assetId,
      amountIn: quote.amountIn,
      amountInFormatted: quote.amountInFormatted,
      destinationAddress: snap.destination,
      destinationAsset: stellarAssetCode,
      amountOut: quote.amountOut,
      amountOutFormatted: quote.amountOutFormatted,
      refundAddress,
      status: 'PENDING_DEPOSIT',
      quoteExpiresAt: expiresAt,
    });

    return NextResponse.json({
      intentId,
      depositAddress: quote.depositAddress,
      depositMemo: quote.depositMemo,
      amountIn: quote.amountIn,
      amountInFormatted: quote.amountInFormatted,
      amountOut: quote.amountOut,
      amountOutFormatted: quote.amountOutFormatted,
      expiresAt: expiresAt.toISOString(),
      estimatedTime: quote.timeEstimate || 60,
      sourceChain,
      sourceAsset,
      sourceAssetId: sourceAssetInfo.assetId,
      destinationAsset: stellarAssetCode,
      destinationAddress: snap.destination,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[Intent Quote] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}
