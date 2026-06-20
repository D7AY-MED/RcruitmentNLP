create table if not exists public.job_pools (
  id                uuid primary key default gen_random_uuid(),
  hr_id             uuid references public.hr_profiles(id) on delete cascade not null,
  public_token      text unique default encode(gen_random_bytes(12), 'hex'),
  title             text not null,
  company_name      text,
  status            boolean not null default true,
  main_mission      text,
  description       text,
  location          text,
  contract_type     text,
  experience_level  text,
  education_level   text,
  language          text,
  salary_range      text,
  deadline          timestamptz,
  required_skills   text[],
  nice_to_have_skills text[],
  soft_skills       text[],
  deal_breakers     text[],
  responsibilities  text[],
  notes             text,
  created_at        timestamptz not null default now()
);

alter table public.job_pools enable row level security;

create policy "Recruiters can read own pools"
  on public.job_pools for select
  using (auth.uid() = hr_id);

create policy "Recruiters can insert own pools"
  on public.job_pools for insert
  with check (auth.uid() = hr_id);

create policy "Recruiters can update own pools"
  on public.job_pools for update
  using (auth.uid() = hr_id);

create policy "Recruiters can delete own pools"
  on public.job_pools for delete
  using (auth.uid() = hr_id);
