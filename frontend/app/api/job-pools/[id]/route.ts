import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const admin = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  const { id } = await params;
  const { data, error } = await admin.from('job_pools').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  const { id } = await params;
  const body = await req.json();
  const { data, error } = await admin.from('job_pools').update(body).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  const { id } = await params;
  const { error } = await admin.from('job_pools').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
