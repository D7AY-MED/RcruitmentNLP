/**
 * POST /api/recruiter/login
 *
 * Verifies email + password via Supabase Auth and returns a session token
 * plus the recruiter's hr_profiles record.
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

  const { email, password } = body ?? {};
  if (!email || !password) {
    return NextResponse.json({ detail: 'Email and password are required.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

  // Same message for unknown email or wrong password (don't leak which).
  if (error || !data?.session || !data.user) {
    return NextResponse.json({ detail: 'Invalid email or password.' }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from('hr_profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return NextResponse.json({
    access_token: data.session.access_token,
    token_type: 'bearer',
    recruiter:
      profile ?? {
        id: data.user.id,
        full_name: '',
        email: data.user.email,
        company_name: '',
        phone: null,
        created_at: data.user.created_at,
      },
  });
}
