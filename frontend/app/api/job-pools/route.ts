import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const admin = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

export async function GET(req: NextRequest) {
  if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';

  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: userData, error: authError } = await admin.auth.getUser(token);
  if (authError || !userData?.user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const hrId = userData.user.id;

  const { data, error } = await admin
    .from('job_pools')
    .select('*')
    .eq('hr_id', hrId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';

  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: userData, error: authError } = await admin.auth.getUser(token);
  if (authError || !userData?.user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const hrId = userData.user.id;
  const userMetadata = userData.user.user_metadata || {};
  const email = userData.user.email;
  const full_name = userMetadata.full_name || 'Recruiter';
  const company_name = userMetadata.company_name || '';
  const phone = userMetadata.phone || null;

  // Make sure a profile exists in hr_profiles first.
  const { error: profileError } = await admin.from('hr_profiles').upsert(
    { id: hrId, full_name, email, company_name, phone },
    { onConflict: 'id' }
  );

  if (profileError) {
    return NextResponse.json(
      { error: `Failed to create hr profile: ${profileError.message}` },
      { status: 500 }
    );
  }

  const body = await req.json();
  // Override hr_id with the authenticated user's ID
  body.hr_id = hrId;

  const { data, error } = await admin.from('job_pools').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    await fetch(`${BACKEND_URL}/api/v1/pools/gemini-store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pool_id: data.id,
        pool_title: data.title,
        recruiter_id: data.hr_id,
      }),
    });
  } catch (err) {
    console.warn('Gemini store creation skipped:', err);
  }

  return NextResponse.json(data, { status: 201 });
}
