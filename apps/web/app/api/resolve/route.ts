import { NextRequest, NextResponse } from 'next/server';

// GET /api/resolve?url=https://t.co/xxx - resolve shortened URLs
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

    return NextResponse.json(
      { url: finalUrl },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      }
    );
  } catch (err: any) {
    console.error('URL resolution error:', err);
    return NextResponse.json(
      { error: 'Failed to resolve URL' },
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
