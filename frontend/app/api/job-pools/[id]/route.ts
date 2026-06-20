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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticate(_req);
  if (!user) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  const { id } = await params;
  const { data, error } = await getSupabaseAdmin().from('job_pools').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { data, error } = await getSupabaseAdmin().from('job_pools').update(body).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticate(_req);
  if (!user) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  const { id } = await params;
  const { error } = await getSupabaseAdmin().from('job_pools').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
