-- PooLink Supabase Schema Backup (Local Reconstruction)
-- Generated on: 2026-06-23T12:30:41.581249
-- This schema represents public tables, indexes, constraints, and RLS policies.

-- Table Structure: public.candidate_profiles
CREATE TABLE IF NOT EXISTS public.candidate_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.candidate_profiles FOR SELECT USING (auth.uid() = id);
------------------------------------------------------------

-- Table Structure: public.hr_profiles
CREATE TABLE IF NOT EXISTS public.hr_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    email text NOT NULL,
    company_name text NOT NULL,
    phone text NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_profiles ENABLE ROW LEVEL SECURITY;
------------------------------------------------------------

-- Table Structure: public.admin_profiles
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    email text NOT NULL,
    password text NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read own profile" ON public.admin_profiles FOR SELECT USING (auth.uid() = id);
------------------------------------------------------------

-- Table Structure: public.job_pools
CREATE TABLE IF NOT EXISTS public.job_pools (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hr_id uuid REFERENCES public.hr_profiles(id) ON DELETE CASCADE NOT NULL,
    public_token text UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
    title text NOT NULL,
    company_name text NULL,
    status boolean NOT NULL DEFAULT true,
    main_mission text NULL,
    description text NULL,
    location text NULL,
    contract_type text NULL,
    experience_level text NULL,
    education_level text NULL,
    language text NULL,
    salary_range text NULL,
    deadline timestamptz NULL,
    required_skills text[] NULL,
    nice_to_have_skills text[] NULL,
    soft_skills text[] NULL,
    deal_breakers text[] NULL,
    responsibilities text[] NULL,
    notes text NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.job_pools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recruiters can read own pools" ON public.job_pools FOR SELECT USING (auth.uid() = hr_id);
CREATE POLICY "Recruiters can insert own pools" ON public.job_pools FOR INSERT WITH CHECK (auth.uid() = hr_id);
CREATE POLICY "Recruiters can update own pools" ON public.job_pools FOR UPDATE USING (auth.uid() = hr_id);
CREATE POLICY "Recruiters can delete own pools" ON public.job_pools FOR DELETE USING (auth.uid() = hr_id);
------------------------------------------------------------

-- Table Structure: public.interview_sessions
CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id serial PRIMARY KEY,
    candidate_id character varying NOT NULL,
    name character varying NOT NULL,
    question text NOT NULL,
    answer text NULL,
    sequence integer NOT NULL,
    timestamp timestamp without time zone NULL DEFAULT now(),
    session_status character varying NULL DEFAULT 'active',
    phone text NULL,
    openai_session_id text NULL,
    session_id uuid NULL,
    pool_id text NULL
);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_openai_session_id ON public.interview_sessions (openai_session_id);
CREATE INDEX IF NOT EXISTS idx_user_sequence ON public.interview_sessions (candidate_id, sequence);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_session_seq ON public.interview_sessions (candidate_id, session_id, sequence DESC);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate_pool ON public.interview_sessions (candidate_id, pool_id);
------------------------------------------------------------

-- Table Structure: public.recruiters (FastAPI Local SQLite/PG Table)
CREATE TABLE IF NOT EXISTS public.recruiters (
    id uuid PRIMARY KEY,
    full_name varchar(255) NOT NULL,
    email varchar(255) UNIQUE NOT NULL,
    password_hash varchar(255) NOT NULL,
    company_name varchar(255) NOT NULL,
    phone varchar(50) NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_recruiters_email ON public.recruiters (email);
------------------------------------------------------------
