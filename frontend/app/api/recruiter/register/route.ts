/**
 * POST /api/recruiter/register
 *
 * Registers a recruiter through Supabase Auth (server-side, service-role key):
 *   1. Create the auth user (email + password), pre-confirmed.
 *   2. Store the profile in hr_profiles (id = auth user id).
 *   3. Sign in to return an access token for immediate login.
 *
 * Response shape matches the frontend's TokenResponse:
 *   { access_token, token_type, recruiter }
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid request body.' }, { status: 400 });
  }

  const { full_name, email, password, company_name, phone } = body ?? {};
  if (!full_name || !email || !password || !company_name) {
    return NextResponse.json(
      { detail: 'full_name, email, password and company_name are required.' },
      { status: 400 },
    );
  }

  // 1. Create the auth user (email_confirm so they can log in right away).
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, company_name, phone: phone ?? null },
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

  // 2. Store the recruiter profile. upsert is idempotent if a DB trigger
  //    already created the row on signup.
  const { error: profileErr } = await supabaseAdmin
    .from('hr_profiles')
    .upsert({ id: user.id, full_name, company_name, email, phone: phone ?? null });

  if (profileErr) {
    // Roll back the auth user so the email can be reused after a failure.
    await supabaseAdmin.auth.admin.deleteUser(user.id);
    return NextResponse.json(
      { detail: `Profile creation failed: ${profileErr.message}` },
      { status: 500 },
    );
  }

  // 3. Sign in to mint a session token for the new account.
  const { data: session, error: signErr } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (signErr || !session?.session) {
    return NextResponse.json(
      { detail: 'Account created, but automatic sign-in failed. Please log in.' },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      access_token: session.session.access_token,
      token_type: 'bearer',
      recruiter: {
        id: user.id,
        full_name,
        email,
        company_name,
        phone: phone ?? null,
        created_at: user.created_at,
      },
    },
    { status: 201 },
  );
}
