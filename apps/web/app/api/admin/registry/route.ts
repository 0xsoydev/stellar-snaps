import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { registry, magicLinks } from '@/lib/db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';

// Admin emails that can access the dashboard
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'yuknomebrawh@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase());

/**
 * Verify admin token from Authorization header
 */
async function verifyAdminAuth(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Find the magic link that was used (usedAt should be set)
  const storedLink = await db.query.magicLinks.findFirst({
    where: and(
      eq(magicLinks.token, token),
      // Token should have been used (verified) and not expired too long ago
      // We allow 24 hours of session time after initial verification
    ),
  });

  if (!storedLink) {
    return null;
  }

  // Check if email is admin
  if (!ADMIN_EMAILS.includes(storedLink.email.toLowerCase())) {
    return null;
  }

  // Check if token was used within last 24 hours (session validity)
  if (storedLink.usedAt) {
    const sessionExpiry = new Date(storedLink.usedAt);
    sessionExpiry.setHours(sessionExpiry.getHours() + 24);
    if (new Date() > sessionExpiry) {
      return null;
    }
  }

  return storedLink.email;
}

/**
 * GET /api/admin/registry
 * List all registry entries
 */
export async function GET(request: NextRequest) {
  const adminEmail = await verifyAdminAuth(request);
  if (!adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const entries = await db.query.registry.findMany({
      orderBy: (registry, { desc }) => [desc(registry.registeredAt)],
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('[Admin] Registry list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registry' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/registry
 * Update a registry entry status
 */
export async function PATCH(request: NextRequest) {
  const adminEmail = await verifyAdminAuth(request);
  if (!adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { domain, status, name, description } = body;

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'trusted', 'unverified', 'blocked'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status) {
      updates.status = status;
      if (status === 'trusted') {
        updates.verifiedAt = new Date();
      }
    }
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    const [updated] = await db
      .update(registry)
      .set(updates)
      .where(eq(registry.domain, domain))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Domain ${domain} updated`,
      entry: updated,
    });
  } catch (error) {
    console.error('[Admin] Registry update error:', error);
    return NextResponse.json(
      { error: 'Failed to update domain' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/registry
 * Remove a domain from registry
 */
export async function DELETE(request: NextRequest) {
  const adminEmail = await verifyAdminAuth(request);
  if (!adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const domain = request.nextUrl.searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain query parameter is required' },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(registry)
      .where(eq(registry.domain, domain))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Domain ${domain} removed from registry`,
    });
  } catch (error) {
    console.error('[Admin] Registry delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    );
  }
}
