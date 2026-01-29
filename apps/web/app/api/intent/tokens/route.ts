import { NextResponse } from 'next/server';
import { SUPPORTED_CHAINS, STELLAR_ASSETS } from '../../../../lib/intents';

/**
 * GET /api/intent/tokens
 * 
 * Returns list of supported source chains/assets and destination assets
 * Cached heavily - this rarely changes
 */
export async function GET() {
  const sourceChains = Object.entries(SUPPORTED_CHAINS).map(([id, chain]) => ({
    id,
    name: chain.name,
    symbol: chain.symbol,
    icon: chain.icon,
    assets: chain.assets.map(a => ({
      symbol: a.symbol,
      decimals: a.decimals,
    })),
  }));

  const destinationAssets = [
    { symbol: 'XLM', name: 'Stellar Lumens', decimals: 7 },
    { symbol: 'USDC', name: 'USD Coin', decimals: 7 },
  ];

  return NextResponse.json({
    sourceChains,
    destinationAssets,
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
