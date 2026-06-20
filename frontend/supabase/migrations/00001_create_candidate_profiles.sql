-- Create candidate_profiles table (mirrors hr_profiles for recruiters)
create table if not exists public.candidate_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  phone       text,
  created_at  timestamptz not null default now()
);

-- Enable RLS
alter table public.candidate_profiles enable row level security;

-- Allow individual users to read their own profile
create policy "Users can read own profile"
  on public.candidate_profiles for select
  using (auth.uid() = id);

-- Allow the service role (server-side) to insert/update
-- (service key bypasses RLS, so no explicit policy needed for upsert)
