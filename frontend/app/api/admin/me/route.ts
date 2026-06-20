/**
 * GET /api/admin/me
 *
 * Returns the administrator identified by the Authorization bearer token.
 * Delegates to requireAdmin, which validates the token AND admin_profiles
 * membership, so a non-admin token receives 403 (not the profile).
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ detail: auth.detail }, { status: auth.status });
  }
  return NextResponse.json(auth.admin);
}
