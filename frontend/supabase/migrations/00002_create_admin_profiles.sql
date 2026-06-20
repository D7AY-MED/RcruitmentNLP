-- Create admin_profiles table (mirrors hr_profiles / candidate_profiles).
--
-- Membership in this table is what makes an auth user an administrator: the
-- /api/admin/* routes only authorize a request whose user id exists here.
-- Being a Supabase Auth user is NOT enough — a row must exist in this table.
create table if not exists public.admin_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  -- Informational copy of the credential, stored as a bcrypt hash (never plaintext).
  -- NOTE: this column is NOT used for authentication. Login goes through Supabase
  -- Auth (signInWithPassword), which holds the real password in auth.users. Keep
  -- this nullable so the register/upsert flow that omits it still works, and be
  -- aware it can drift from the actual auth password unless kept in sync.
  password    text,
  created_at  timestamptz not null default now()
);

-- For pre-existing databases created before this column was added.
alter table public.admin_profiles add column if not exists password text;

-- Enable RLS. The server uses the service-role key (which bypasses RLS), so no
-- broad client policies are granted here — admins are managed server-side only.
alter table public.admin_profiles enable row level security;

-- Allow an admin to read their own profile (e.g. if ever queried with anon key).
create policy "Admins can read own profile"
  on public.admin_profiles for select
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Bootstrapping the FIRST administrator
-- ---------------------------------------------------------------------------
-- Two options:
--
-- 1) Guarded bootstrap endpoint (recommended for local/dev):
--    Set ADMIN_SETUP_TOKEN in frontend/.env, then POST to
--    /api/admin/register with header  x-admin-setup-token: <that token>
--    and body { full_name, email, password }. The endpoint creates the auth
--    user AND inserts the admin_profiles row. It is disabled (403) whenever
--    ADMIN_SETUP_TOKEN is unset.
--
-- 2) Promote an existing auth user by hand (SQL):
--    Find the user id in Supabase Auth, then:
--
--    insert into public.admin_profiles (id, full_name, email)
--    values ('<auth-user-uuid>', 'Platform Admin', 'admin@example.com')
--    on conflict (id) do nothing;
