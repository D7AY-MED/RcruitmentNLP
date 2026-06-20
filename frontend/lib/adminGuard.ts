/**
 * Server-side admin authorization helper (used by /api/admin/* route handlers).
 *
 * A request is authorized only when BOTH hold:
 *   1. The bearer token is a valid Supabase access token, AND
 *   2. The token's user id exists in the `admin_profiles` table.
 *
 * Being any authenticated Supabase user is NOT enough — only users explicitly
 * provisioned as admins (a row in admin_profiles) pass.
 */

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export type AdminAuthResult =
  | { ok: true; admin: AdminProfile }
  | { ok: false; status: number; detail: string };

/** Extract a bearer token from an Authorization header (or ''). */
function bearer(req: Request): string {
  const header = req.headers.get('authorization') ?? '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
}

/**
 * Verify the request comes from an administrator. Returns a discriminated
 * result so callers can branch without try/catch.
 */
export async function requireAdmin(req: Request): Promise<AdminAuthResult> {
  const token = bearer(req);
  if (!token) return { ok: false, status: 401, detail: 'Not authenticated' };

  const admin = getSupabaseAdmin();

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) {
    return { ok: false, status: 401, detail: 'Invalid or expired token' };
  }

  const { data: profile } = await admin
    .from('admin_profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (!profile) {
    return { ok: false, status: 403, detail: 'Not an administrator' };
  }

  return { ok: true, admin: profile as unknown as AdminProfile };
}
