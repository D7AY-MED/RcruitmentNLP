-- SQL Migration: Cleanup Legacy Authentication Artifacts
-- Run this in your Supabase SQL Editor manually to clean up legacy tables and columns

-- 1. Drop the legacy recruiters table (stored bcrypt password hashes and is no longer used)
DROP TABLE IF EXISTS recruiters CASCADE;

-- 2. Remove the password column from admin_profiles
-- NOTE: Please verify that no admin registration router logic references this column
-- prior to executing this statement. (Currently, the python backend admin router still has a reference).
-- ALTER TABLE admin_profiles DROP COLUMN IF EXISTS password;
