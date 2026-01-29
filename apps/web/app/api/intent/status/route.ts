import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { intents } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { getTransferStatus, ALLBRIDGE_API_URL } from '../../../../lib/allbridge';

// Status types matching our schema
type IntentStatus = 
  | 'PENDING_DEPOSIT'
  | 'PROCESSING' 
  | 'SUCCESS'
  | 'INCOMPLETE_DEPOSIT'
  | 'REFUNDED'
  | 'FAILED';

/**
 * GET /api/intent/status?intentId=xxx
 * or
 * GET /api/intent/status?chainSymbol=BAS&txHash=0x...
 * 
 * Check the status of a cross-chain payment intent using Allbridge
 */
export async function GET(request: NextRequest) {
  try {
    const intentId = request.nextUrl.searchParams.get('intentId');
    const chainSymbol = request.nextUrl.searchParams.get('chainSymbol');
    const txHash = request.nextUrl.searchParams.get('txHash');

    // Method 1: Lookup by intentId (our internal tracking)
    if (intentId) {
      const [intent] = await db.select().from(intents).where(eq(intents.id, intentId));

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
          provider: 'allbridge',
          sourceChain: intent.sourceChain,
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

      // If we have a deposit tx hash, query Allbridge for status
      if (intent.depositTxHash && intent.sourceChain) {
        try {
          const allbridgeStatus = await getTransferStatus(intent.sourceChain, intent.depositTxHash);
          const newStatus = mapAllbridgeStatus(allbridgeStatus.status);

          // Update our database if status changed
          if (newStatus !== intent.status) {
            const updateData: Record<string, unknown> = {
              status: newStatus,
              updatedAt: new Date(),
            };

            if (allbridgeStatus.receiveTransactionHash) {
              updateData.settlementTxHash = allbridgeStatus.receiveTransactionHash;
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
            provider: 'allbridge',
            sourceChain: intent.sourceChain,
            amountIn: intent.amountIn,
            amountInFormatted: intent.amountInFormatted,
            amountOut: intent.amountOut,
            amountOutFormatted: intent.amountOutFormatted,
            depositTxHash: intent.depositTxHash,
            settlementTxHash: allbridgeStatus.receiveTransactionHash || intent.settlementTxHash,
            amountReceived: allbridgeStatus.sendAmount,
            amountDelivered: allbridgeStatus.receiveAmount,
          }, { headers: corsHeaders });
        } catch (error) {
          // Allbridge might not have indexed the tx yet
          console.log('[Intent Status] Allbridge lookup failed, returning pending:', error);
        }
      }

      // Still pending - no deposit tx yet
      return NextResponse.json({
        intentId: intent.id,
        status: 'PENDING_DEPOSIT',
        provider: 'allbridge',
        sourceChain: intent.sourceChain,
        amountIn: intent.amountIn,
        amountInFormatted: intent.amountInFormatted,
        amountOut: intent.amountOut,
        amountOutFormatted: intent.amountOutFormatted,
        expiresAt: intent.quoteExpiresAt?.toISOString(),
      }, { headers: corsHeaders });
    }

    // Method 2: Direct Allbridge lookup by chainSymbol + txHash
    if (chainSymbol && txHash) {
      try {
        const allbridgeStatus = await getTransferStatus(chainSymbol, txHash);
        
        return NextResponse.json({
          status: mapAllbridgeStatus(allbridgeStatus.status),
          provider: 'allbridge',
          sourceChain: allbridgeStatus.sourceChainSymbol,
          destinationChain: allbridgeStatus.destinationChainSymbol,
          sender: allbridgeStatus.sender,
          recipient: allbridgeStatus.recipient,
          sendAmount: allbridgeStatus.sendAmount,
          receiveAmount: allbridgeStatus.receiveAmount,
          sendTxHash: allbridgeStatus.sendTransactionHash,
          receiveTxHash: allbridgeStatus.receiveTransactionHash,
        }, { headers: corsHeaders });
      } catch (error) {
        return NextResponse.json(
          { error: 'Transfer not found or not yet indexed' },
          { status: 404, headers: corsHeaders }
        );
      }
    }

    return NextResponse.json(
      { error: 'Missing intentId or chainSymbol+txHash parameters' },
      { status: 400, headers: corsHeaders }
    );

  } catch (error) {
    console.error('[Intent Status] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/intent/status
 * 
 * Update intent with deposit transaction hash
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intentId, depositTxHash } = body;

    if (!intentId || !depositTxHash) {
      return NextResponse.json(
        { error: 'Missing intentId or depositTxHash' },
        { status: 400, headers: corsHeaders }
      );
    }

    const [intent] = await db.select().from(intents).where(eq(intents.id, intentId));
    
    if (!intent) {
      return NextResponse.json(
        { error: 'Intent not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Update with deposit tx hash
    await db.update(intents)
      .set({
        depositTxHash,
        status: 'PROCESSING',
        updatedAt: new Date(),
      })
      .where(eq(intents.id, intentId));

    return NextResponse.json({
      intentId,
      status: 'PROCESSING',
      depositTxHash,
      message: 'Deposit recorded. Bridge transfer in progress.',
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[Intent Status] POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Map Allbridge status to our status enum
 */
function mapAllbridgeStatus(allbridgeStatus: string): IntentStatus {
  switch (allbridgeStatus) {
    case 'Pending':
      return 'PROCESSING';
    case 'InProgress':
      return 'PROCESSING';
    case 'Complete':
      return 'SUCCESS';
    case 'Failed':
      return 'FAILED';
    default:
      return 'PENDING_DEPOSIT';
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}
