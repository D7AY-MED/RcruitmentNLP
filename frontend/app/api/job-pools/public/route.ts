import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const admin = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

export async function GET(req: NextRequest) {
  if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  
  const { data, error } = await admin
    .from('job_pools')
    .select('*, hr_profiles(*)')
    .eq('public_token', token)
    .eq('status', true)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}
