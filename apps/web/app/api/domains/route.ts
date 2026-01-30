import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { registry } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { withApiKey, authError } from '@/lib/auth/middleware';

/**
 * GET /api/domains
 * List domains registered by the authenticated developer
 */
export async function GET(request: NextRequest) {
  const auth = await withApiKey(request);
  if (!auth.success) {
    return authError(auth.error, auth.status);
  }

  try {
    const developerEmail = auth.auth.developer.email;

    const domains = await db.query.registry.findMany({
      where: eq(registry.contactEmail, developerEmail),
      orderBy: (registry, { desc }) => [desc(registry.registeredAt)],
    });

    return NextResponse.json({ domains });
  } catch (error) {
    console.error('[Domains] List error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/domains
 * Register a new domain for review
 */
export async function POST(request: NextRequest) {
  const auth = await withApiKey(request);
  if (!auth.success) {
    return authError(auth.error, auth.status);
  }

  try {
    const body = await request.json();
    const { domain, name, description } = body;

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Normalize domain (remove protocol, trailing slash, etc.)
    const normalizedDomain = normalizeDomain(domain);

    if (!isValidDomain(normalizedDomain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    // Check if domain already exists
    const existing = await db.query.registry.findFirst({
      where: eq(registry.domain, normalizedDomain),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Domain is already registered' },
        { status: 409 }
      );
    }

    // Insert new domain
    const [newDomain] = await db.insert(registry).values({
      domain: normalizedDomain,
      name: name || normalizedDomain,
      description: description || null,
      contactEmail: auth.auth.developer.email,
      status: 'pending',
    }).returning();

    return NextResponse.json({
      message: 'Domain registered and pending review',
      domain: newDomain,
    }, { status: 201 });
  } catch (error) {
    console.error('[Domains] Register error:', error);
    return NextResponse.json(
      { error: 'Failed to register domain' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/domains
 * Remove a domain (only if owned by the developer)
 */
export async function DELETE(request: NextRequest) {
  const auth = await withApiKey(request);
  if (!auth.success) {
    return authError(auth.error, auth.status);
  }

  try {
    const domain = request.nextUrl.searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain query parameter is required' },
        { status: 400 }
      );
    }

    // Check ownership
    const existing = await db.query.registry.findFirst({
      where: eq(registry.domain, domain),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    if (existing.contactEmail !== auth.auth.developer.email) {
      return NextResponse.json(
        { error: 'Not authorized to delete this domain' },
        { status: 403 }
      );
    }

    await db.delete(registry).where(eq(registry.domain, domain));

    return NextResponse.json({
      message: `Domain ${domain} removed`,
    });
  } catch (error) {
    console.error('[Domains] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    );
  }
}

function normalizeDomain(input: string): string {
  let domain = input.toLowerCase().trim();
  
  // Remove protocol
  domain = domain.replace(/^https?:\/\//, '');
  
  // Remove trailing slash and path
  const parts = domain.split('/');
  domain = parts[0] || domain;
  
  return domain;
}

function isValidDomain(domain: string): boolean {
  // Basic domain validation
  // Allows: example.com, sub.example.com, localhost:3000, etc.
  const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*(\:[0-9]+)?$/;
  return domainRegex.test(domain) && domain.length <= 253;
}
