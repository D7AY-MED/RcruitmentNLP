/**
 * GET /api/admin/stats
 *
 * Returns platform-wide counts for the admin dashboard overview cards:
 * total recruiters, total candidates, total job pools, and active pools.
 * Admin-only (requireAdmin).
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminGuard';

async function countRows(table: string, filter?: { col: string; val: string }) {
  let query = getSupabaseAdmin().from(table).select('*', { count: 'exact', head: true });
  if (filter) query = query.eq(filter.col, filter.val);
  const { count, error } = await query;
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ detail: auth.detail }, { status: auth.status });
  }

  try {
    const [recruiters, candidates, pools, activePools] = await Promise.all([
      countRows('hr_profiles'),
      countRows('candidate_profiles'),
      countRows('job_pools'),
      countRows('job_pools', { col: 'status', val: 'active' }),
    ]);

    return NextResponse.json({ recruiters, candidates, pools, activePools });
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Stats error — ${err?.message ?? 'unknown error'}` },
      { status: 500 },
    );
  }
}
