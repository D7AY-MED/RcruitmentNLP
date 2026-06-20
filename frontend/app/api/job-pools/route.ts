import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function authenticate(req: NextRequest) {
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  if (!token) return null;
  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { data, error } = await getSupabaseAdmin()
    .from('job_pools')
    .select('*')
    .eq('hr_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  const db = getSupabaseAdmin();
  const userMetadata = user.user_metadata || {};
  const email = user.email;
  const full_name = userMetadata.full_name || 'Recruiter';
  const company_name = userMetadata.company_name || '';
  const phone = userMetadata.phone || null;

  const { error: profileError } = await db.from('hr_profiles').upsert(
    { id: user.id, full_name, email, company_name, phone },
    { onConflict: 'id' }
  );

  if (profileError) {
    return NextResponse.json(
      { error: `Failed to create hr profile: ${profileError.message}` },
      { status: 500 }
    );
  }

  const body = await req.json();
  body.hr_id = user.id;

  const { data, error } = await db.from('job_pools').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let geminiError: string | null = null;

  try {
    const geminiRes = await fetch(`${BACKEND_URL}/api/v1/pools/gemini-store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pool_id: data.id,
        pool_title: data.title,
        recruiter_id: data.hr_id,
      }),
    });

    if (!geminiRes.ok) {
      const geminiBody = await geminiRes.json().catch(() => ({}));
      geminiError = geminiBody.detail || geminiRes.statusText;
    }
  } catch (err: any) {
    geminiError = err?.message || 'Backend unreachable';
  }

  if (geminiError) {
    await db.from('job_pools').delete().eq('id', data.id);
    return NextResponse.json(
      { error: `Gemini store creation failed: ${geminiError}` },
      { status: 502 },
    );
  }

  return NextResponse.json(data, { status: 201 });
}
