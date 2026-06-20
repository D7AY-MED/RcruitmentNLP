import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';

  if (!token) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return NextResponse.json({ detail: 'Invalid or expired token' }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from('candidate_profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return NextResponse.json(
    profile ?? {
      id: data.user.id,
      full_name: '',
      email: data.user.email,
      phone: null,
      created_at: data.user.created_at,
    },
  );
}
