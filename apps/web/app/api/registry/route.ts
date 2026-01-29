import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { registry } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Registry API - Database-backed domain registry
 * 
 * Domains must be registered and verified before being marked as "trusted".
 * The extension uses this to determine trust badges for payment cards.
 * 
 * Status levels:
 * - pending: Newly registered, awaiting review
 * - trusted: Verified and approved
 * - unverified: Registered but not yet verified (still works, shows warning)
 * - blocked: Explicitly blocked (won't render cards)
 */

// CORS headers for extension access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
};

// GET /api/registry - List all domains or get specific domain
export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get('domain');
  
  try {
    if (domain) {
      // Get specific domain
      const [entry] = await db
        .select()
        .from(registry)
        .where(eq(registry.domain, domain));
      
      if (!entry) {
        return NextResponse.json(
          { error: 'Domain not found', domain },
          { status: 404, headers: corsHeaders }
        );
      }
      
      return NextResponse.json(entry, { headers: corsHeaders });
    }
    
    // List all domains (excluding blocked by default)
    const showBlocked = request.nextUrl.searchParams.get('showBlocked') === 'true';
    
    const entries = await db.select().from(registry);
    
    const filtered = showBlocked 
      ? entries 
      : entries.filter(e => e.status !== 'blocked');
    
    return NextResponse.json(
      { domains: filtered },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Registry GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registry' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/registry - Register a new domain
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, name, description, icon, ownerWallet, contactEmail } = body;
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Normalize domain (lowercase, no protocol/trailing slash)
    const normalizedDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    
    // Check if already registered
    const [existing] = await db
      .select()
      .from(registry)
      .where(eq(registry.domain, normalizedDomain));
    
    if (existing) {
      return NextResponse.json(
        { error: 'Domain already registered', entry: existing },
        { status: 409, headers: corsHeaders }
      );
    }
    
    // Insert new domain (starts as 'pending')
    const [newEntry] = await db
      .insert(registry)
      .values({
        domain: normalizedDomain,
        name: name || normalizedDomain,
        description,
        icon,
        ownerWallet,
        contactEmail,
        status: 'pending',
      })
      .returning();
    
    return NextResponse.json(
      { 
        message: 'Domain registered successfully',
        entry: newEntry,
        note: 'Domain is pending review. It will work but show as unverified until approved.',
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Registry POST error:', error);
    return NextResponse.json(
      { error: 'Failed to register domain' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}
