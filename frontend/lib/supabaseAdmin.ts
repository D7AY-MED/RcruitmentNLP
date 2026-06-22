import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Create a fresh Supabase admin client. We intentionally do NOT cache the
 * client because signInWithPassword() sets an in-memory session on the
 * client object. If the singleton were shared across requests, a prior
 * login/register call would leave a stale user session that subsequent
 * requests would unwittingly use for PostgREST calls, causing RLS policy
 * violations ("new row violates row-level security policy").
 *
 * Creating a new client each call is cheap (no network I/O) and guarantees
 * every request runs under the service-role key with no lingering session.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase admin client is misconfigured: set NEXT_PUBLIC_SUPABASE_URL and ' +
        'SUPABASE_SERVICE_ROLE_KEY in frontend/.env',
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
