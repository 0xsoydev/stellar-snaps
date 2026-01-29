import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { registry } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Admin API for managing registry entries
 * 
 * TODO: Add proper authentication (API key, wallet signature, etc.)
 * For now, protected by a simple admin secret in env
 */

const ADMIN_SECRET = process.env.REGISTRY_ADMIN_SECRET || 'dev-admin-secret';

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  
  const token = authHeader.replace('Bearer ', '');
  return token === ADMIN_SECRET;
}

// PATCH /api/registry/admin - Update domain status
export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const { domain, status, name, description, icon } = body;
    
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
    if (icon !== undefined) updates.icon = icon;
    
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
    console.error('Registry admin PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update domain' },
      { status: 500 }
    );
  }
}

// DELETE /api/registry/admin - Remove domain from registry
export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
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
    console.error('Registry admin DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    );
  }
}

// POST /api/registry/admin - Bulk operations (seed initial data)
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const { action, entries } = body;
    
    if (action === 'seed') {
      // Seed initial domains
      const defaultEntries = [
        {
          domain: 'stellar-snaps.vercel.app',
          status: 'trusted' as const,
          name: 'Stellar Snaps',
          description: 'Official Stellar Snaps service',
        },
        {
          domain: 'localhost:3000',
          status: 'trusted' as const,
          name: 'Local Development',
          description: 'Local development server',
        },
        {
          domain: 'localhost:3002',
          status: 'trusted' as const,
          name: 'Merchant Demo',
          description: 'Demo merchant store',
        },
      ];
      
      const toInsert = entries || defaultEntries;
      
      // Upsert each entry
      const results = [];
      for (const entry of toInsert) {
        const [result] = await db
          .insert(registry)
          .values({
            domain: entry.domain,
            status: entry.status || 'pending',
            name: entry.name || entry.domain,
            description: entry.description,
            icon: entry.icon,
            verifiedAt: entry.status === 'trusted' ? new Date() : null,
          })
          .onConflictDoUpdate({
            target: registry.domain,
            set: {
              status: entry.status || 'pending',
              name: entry.name,
              description: entry.description,
              updatedAt: new Date(),
            },
          })
          .returning();
        results.push(result);
      }
      
      return NextResponse.json({
        message: `Seeded ${results.length} domains`,
        entries: results,
      });
    }
    
    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Registry admin POST error:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}
