import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

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

  const body = await req.json();
  body.hr_id = user.id;

  const { data, error } = await db.from('job_pools').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
