/**
 * GET /api/recruiter/me
 *
 * Returns the recruiter identified by the Authorization bearer token
 * (the Supabase access token issued at login/register).
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';

  if (!token) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data?.user) {
    return NextResponse.json({ detail: 'Invalid or expired token' }, { status: 401 });
  }

  const { data: profile } = await getSupabaseAdmin()
    .from('hr_profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  const meta = data.user.user_metadata ?? {};

  return NextResponse.json({
    id: data.user.id,
    full_name: (profile as any)?.full_name ?? (profile as any)?.name ?? meta.full_name ?? '',
    email: (profile as any)?.email ?? data.user.email ?? '',
    company_name: (profile as any)?.company_name ?? meta.company_name ?? '',
    phone: (profile as any)?.phone ?? null,
    created_at: (profile as any)?.created_at ?? data.user.created_at,
  });
}
