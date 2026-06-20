import { createClient } from '@supabase/supabase-js';

let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase admin client is misconfigured: set NEXT_PUBLIC_SUPABASE_URL and ' +
        'SUPABASE_SERVICE_ROLE_KEY in frontend/.env',
    );
  }

  client = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return client;
}
