/**
 * POST /api/admin/register  — guarded bootstrap endpoint.
 *
 * Creates the FIRST (or an additional) administrator. Because admins are
 * privileged, this endpoint is protected by a shared setup token instead of an
 * existing admin session, so it can be used to bootstrap the very first admin:
 *
 *   - Requires header  x-admin-setup-token: <ADMIN_SETUP_TOKEN>
 *   - Disabled (403) whenever ADMIN_SETUP_TOKEN is not set in the environment.
 *
 * Flow (service-role key, server-side):
 *   1. Create the Supabase auth user (pre-confirmed).
 *   2. Insert the admin_profiles row (this is what grants admin rights).
 *   3. Sign in to return an access token for immediate login.
 */

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  const setupToken = process.env.ADMIN_SETUP_TOKEN;
  if (!setupToken) {
    return NextResponse.json(
      { detail: 'Admin bootstrap is disabled. Set ADMIN_SETUP_TOKEN to enable it.' },
      { status: 403 },
    );
  }

  const provided = req.headers.get('x-admin-setup-token') ?? '';
  if (provided !== setupToken) {
    return NextResponse.json({ detail: 'Invalid setup token.' }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid request body.' }, { status: 400 });
  }

  const { full_name, email, password } = body ?? {};
  if (!full_name || !email || !password) {
    return NextResponse.json(
      { detail: 'full_name, email and password are required.' },
      { status: 400 },
    );
  }

  // 1. Create the auth user (email_confirm so they can log in right away).
  const { data: created, error: createErr } = await getSupabaseAdmin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: 'admin' },
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

  // 2. Grant admin rights by inserting the admin_profiles row.
  //    The `password` column stores a bcrypt hash for record-keeping ONLY — it is
  //    not used for authentication (login goes through Supabase Auth). We hash it
  //    rather than storing plaintext so the row is safe if the table ever leaks.
  const passwordHash = await bcrypt.hash(password, 10);
  const { error: profileErr } = await getSupabaseAdmin()
    .from('admin_profiles' as any)
    .upsert({ id: user.id, full_name, email, password: passwordHash } as any);

  if (profileErr) {
    // Roll back the auth user so the email can be reused after a failure.
    await getSupabaseAdmin().auth.admin.deleteUser(user.id);
    return NextResponse.json(
      { detail: `Admin profile creation failed: ${profileErr.message}` },
      { status: 500 },
    );
  }

  // 3. Sign in to mint a session token for the new admin.
  const { data: session, error: signErr } = await getSupabaseAdmin().auth.signInWithPassword({
    email,
    password,
  });

  if (signErr || !session?.session) {
    return NextResponse.json(
      { detail: 'Admin created, but automatic sign-in failed. Please log in.' },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      access_token: session.session.access_token,
      token_type: 'bearer',
      admin: {
        id: user.id,
        full_name,
        email,
        created_at: user.created_at,
      },
    },
    { status: 201 },
  );
}
