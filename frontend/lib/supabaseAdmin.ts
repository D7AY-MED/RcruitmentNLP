/**
 * Server-only Supabase client (service-role key).
 *
 * NEVER import this from a client component — the service-role key bypasses
 * Row Level Security and must stay on the server. It is read from
 * SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix), so Next.js keeps it
 * out of the browser bundle. Used by the /api/recruiter/* route handlers.
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    'Supabase admin client is misconfigured: set NEXT_PUBLIC_SUPABASE_URL and ' +
      'SUPABASE_SERVICE_ROLE_KEY in frontend/.env',
  );
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
