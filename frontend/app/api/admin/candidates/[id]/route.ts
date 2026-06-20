/**
 * DELETE /api/admin/candidates/[id]
 *
 * Removes a candidate: deletes the Supabase auth user (which cascades to the
 * candidate_profiles row via the FK on delete cascade) and best-effort removes
 * any leftover profile row. Admin-only (requireAdmin).
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminGuard';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ detail: auth.detail }, { status: auth.status });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ detail: 'Missing candidate id.' }, { status: 400 });
  }

  // Delete the profile row first (covers schemas without ON DELETE CASCADE).
  await getSupabaseAdmin().from('candidate_profiles').delete().eq('id', id);

  // Delete the auth user. Treat "not found" as success (idempotent delete).
  const { error } = await getSupabaseAdmin().auth.admin.deleteUser(id);
  if (error && !/not\s*found/i.test(error.message)) {
    return NextResponse.json(
      { detail: `Failed to delete candidate: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id });
}
