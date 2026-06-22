-- Run this in Supabase SQL Editor
-- Adds pool_id to interview_sessions so sessions can be linked to job pools
-- Enables "resume interview" and "already applied" detection

ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS pool_id TEXT;

-- Index for efficient lookups by candidate + pool
CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate_pool
  ON interview_sessions (candidate_id, pool_id);
