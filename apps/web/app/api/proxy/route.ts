import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint for resolving shortened URLs (t.co, bit.ly, etc.)
 * 
 * The extension cannot follow cross-origin redirects, so we do it server-side.
 * This is similar to Dialect's proxy.dial.to service.
 */

// GET /api/proxy?url=https://t.co/xxx
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    // Follow redirects to get final URL
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
    });

    const finalUrl = response.url;

    // Extract domain from final URL
    let domain: string | null = null;
    try {
      const parsed = new URL(finalUrl);
      domain = parsed.host;
    } catch {}

    return NextResponse.json(
      { 
        url: finalUrl,
        domain,
        originalUrl: url,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      }
    );
  } catch (err: any) {
    console.error('URL resolution error:', err);
    return NextResponse.json(
      { error: 'Failed to resolve URL', originalUrl: url },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
