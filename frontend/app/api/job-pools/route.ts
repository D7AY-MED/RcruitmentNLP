import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const admin = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

const STATIC_HR_ID = '00000000-0000-0000-0000-000000000001';

export async function GET() {
  if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  const { data, error } = await admin.from('job_pools').select('*').eq('hr_id', STATIC_HR_ID).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  const body = await req.json();

  await admin.from('hr_profiles').upsert(
    { id: STATIC_HR_ID, user_id: STATIC_HR_ID, name: 'Test HR', email: 'test@example.com' },
    { onConflict: 'id' }
  );

  const { data, error } = await admin.from('job_pools').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
