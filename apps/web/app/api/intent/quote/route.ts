import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { intents, snaps } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  getQuote as getAllbridgeQuote,
  getTokenInfo,
  SUPPORTED_CHAINS,
  parseAmount,
  type SupportedChainId,
} from '../../../../lib/allbridge';

interface QuoteRequestBody {
  snapId: string;
  sourceChain: SupportedChainId;
  refundAddress: string;
  dry?: boolean;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * POST /api/intent/quote
 * 
 * Get a quote for cross-chain payment to a snap using Allbridge Core
 * 
 * Allbridge supports USDC-to-USDC transfers:
 * - Base USDC -> Stellar USDC
 * - Ethereum USDC -> Stellar USDC
 * - etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body: QuoteRequestBody = await request.json();
    const { snapId, sourceChain, refundAddress, dry = false } = body;

    // Validate required fields
    if (!snapId || !sourceChain || !refundAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: snapId, sourceChain, refundAddress' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate source chain
    if (!(sourceChain in SUPPORTED_CHAINS)) {
      return NextResponse.json(
        { error: `Unsupported chain: ${sourceChain}. Supported: ${Object.keys(SUPPORTED_CHAINS).join(', ')}` },
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

    // For cross-chain, we only support USDC snaps
    // If the snap is for XLM, we can't do cross-chain (Allbridge only supports stablecoins)
    if (snap.assetCode !== 'USDC') {
      return NextResponse.json(
        { error: 'Cross-chain payments only available for USDC snaps. Allbridge Core only supports stablecoin bridges.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!snap.amount) {
      return NextResponse.json(
        { error: 'Snap must have a fixed amount for cross-chain payments' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Convert snap amount to Stellar USDC base units (7 decimals)
    const stellarDecimals = 7;
    const amountOutStellar = parseAmount(snap.amount, stellarDecimals);

    console.log('[Intent Quote] Getting Allbridge quote:', {
      sourceChain,
      amountOut: amountOutStellar,
      destination: snap.destination,
    });

    // Get quote from Allbridge
    const quote = await getAllbridgeQuote(sourceChain, amountOutStellar, snap.destination);

    // If dry run, just return the quote preview
    if (dry) {
      return NextResponse.json({
        dry: true,
        provider: 'allbridge',
        sourceChain,
        sourceAsset: 'USDC',
        destinationAsset: 'USDC',
        amountIn: quote.amountIn,
        amountInFormatted: quote.amountInFormatted,
        amountOut: quote.amountOut,
        amountOutFormatted: quote.amountOutFormatted,
        bridgeFee: quote.bridgeFee,
        bridgeFeeUsd: quote.bridgeFeeUsd,
        gasFee: quote.gasFee,
        gasFeeNative: quote.gasFeeNative,
        estimatedTime: Math.ceil(quote.estimatedTime / 1000), // Convert to seconds
      }, { headers: corsHeaders });
    }

    // Create intent record for tracking
    const intentId = generateIntentId();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await db.insert(intents).values({
      id: intentId,
      snapId: snap.id,
      // For Allbridge, no deposit address - user sends directly to bridge
      depositAddress: quote.bridgeAddress,
      depositMemo: null,
      sourceChain,
      sourceAsset: 'USDC',
      sourceAssetId: quote.sourceToken.tokenAddress,
      amountIn: quote.amountIn,
      amountInFormatted: quote.amountInFormatted,
      destinationAddress: snap.destination,
      destinationAsset: 'USDC',
      amountOut: quote.amountOut,
      amountOutFormatted: quote.amountOutFormatted,
      refundAddress,
      status: 'PENDING_DEPOSIT',
      quoteExpiresAt: expiresAt,
    });

    // Get chain info for frontend
    const chainInfo = SUPPORTED_CHAINS[sourceChain];

    return NextResponse.json({
      intentId,
      provider: 'allbridge',
      
      // Source chain info
      sourceChain,
      sourceChainName: chainInfo.name,
      sourceChainEvmId: chainInfo.evmChainId,
      sourceAsset: 'USDC',
      sourceTokenAddress: quote.sourceToken.tokenAddress,
      
      // Bridge info
      bridgeAddress: quote.bridgeAddress,
      messenger: quote.messenger,
      
      // Amounts
      amountIn: quote.amountIn,
      amountInFormatted: quote.amountInFormatted,
      amountOut: quote.amountOut,
      amountOutFormatted: quote.amountOutFormatted,
      
      // Fees
      bridgeFee: quote.bridgeFee,
      bridgeFeeUsd: quote.bridgeFeeUsd,
      gasFee: quote.gasFee,
      gasFeeNative: quote.gasFeeNative,
      
      // Destination
      destinationAsset: 'USDC',
      destinationAddress: snap.destination,
      
      // Timing
      expiresAt: expiresAt.toISOString(),
      estimatedTime: Math.ceil(quote.estimatedTime / 1000),
      
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[Intent Quote] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

function generateIntentId(): string {
  return `int_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
}
