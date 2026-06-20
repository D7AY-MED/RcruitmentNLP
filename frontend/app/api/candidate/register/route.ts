import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
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

  const { error: profileErr } = await getSupabaseAdmin()
    .from('candidate_profiles' as any)
    .upsert({ id: user.id, full_name, email, phone } as any);

  if (profileErr) {
    await getSupabaseAdmin().auth.admin.deleteUser(user.id);
    return NextResponse.json(
      { detail: `Profile creation failed: ${profileErr.message}` },
      { status: 500 },
    );
  }

  const { data: session, error: signErr } = await getSupabaseAdmin().auth.signInWithPassword({
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
      candidate: {
        id: user.id,
        full_name,
        email,
        phone,
        created_at: user.created_at,
      },
    },
    { status: 201 },
  );
}
