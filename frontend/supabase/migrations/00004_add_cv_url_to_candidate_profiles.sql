-- Add cv_url column to candidate_profiles table
ALTER TABLE public.candidate_profiles ADD COLUMN IF NOT EXISTS cv_url text;
