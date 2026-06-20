/**
 * POST /api/admin/login
 *
 * Verifies email + password via Supabase Auth, then confirms the user is a
 * provisioned administrator (a row in admin_profiles). A valid Supabase login
 * that is NOT an admin is rejected with 403 so non-admins can't reach the
 * admin dashboard even with correct credentials.
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid request body.' }, { status: 400 });
  }

  const { email, password } = body ?? {};
  if (!email || !password) {
    return NextResponse.json({ detail: 'Email and password are required.' }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin().auth.signInWithPassword({ email, password });

  // Same message for unknown email or wrong password (don't leak which).
  if (error || !data?.session || !data.user) {
    return NextResponse.json({ detail: 'Invalid email or password.' }, { status: 401 });
  }

  // Gate on admin membership — a valid login is not sufficient.
  const { data: profile } = await getSupabaseAdmin()
    .from('admin_profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (!profile) {
    return NextResponse.json(
      { detail: 'This account is not an administrator.' },
      { status: 403 },
    );
  }

  return NextResponse.json({
    access_token: data.session.access_token,
    token_type: 'bearer',
    admin: profile,
  });
}
