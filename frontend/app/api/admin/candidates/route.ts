/**
 * /api/admin/candidates
 *
 *   GET  -> list every candidate (candidate_profiles), newest first.
 *   POST -> create a candidate account (Supabase auth user + candidate_profiles row).
 *
 * Both actions are admin-only (requireAdmin). POST reuses the same provisioning
 * flow as /api/candidate/register but is initiated by an administrator.
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminGuard';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ detail: auth.detail }, { status: auth.status });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('candidate_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ detail: auth.detail }, { status: auth.status });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid request body.' }, { status: 400 });
  }

  const { full_name, email, password, phone } = body ?? {};
  if (!full_name || !email || !password || !phone) {
    return NextResponse.json(
      { detail: 'full_name, email, password and phone are required.' },
      { status: 400 },
    );
  }

  // 1. Create the auth user (pre-confirmed so they can log in right away).
  const { data: created, error: createErr } = await getSupabaseAdmin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, phone: phone ?? null },
  });

  if (createErr || !created?.user) {
    const msg = createErr?.message ?? 'Could not create account.';
    const isDuplicate = /already|exist|registered/i.test(msg);
    return NextResponse.json(
      { detail: isDuplicate ? 'An account with this email already exists.' : msg },
      { status: isDuplicate ? 409 : 400 },
    );
  }

  const user = created.user;

  // 2. Store the candidate profile.
  const { data: profile, error: profileErr } = await getSupabaseAdmin()
    .from('candidate_profiles' as any)
    .upsert({ id: user.id, full_name, email, phone } as any)
    .select()
    .single();

  if (profileErr) {
    // Roll back the auth user so the email can be reused after a failure.
    await getSupabaseAdmin().auth.admin.deleteUser(user.id);
    return NextResponse.json(
      { detail: `Profile creation failed: ${profileErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json(profile, { status: 201 });
}
