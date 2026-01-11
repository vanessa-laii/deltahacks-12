-- Safe fix for RLS policy for sessions table (no DROP statements)
-- Run this SQL in your Supabase SQL Editor

-- First, check if the policies exist and what they are
-- You can run this to see current policies:
-- SELECT * FROM pg_policies WHERE tablename = 'sessions';

-- Option 1: If policies don't exist yet, create them with the correct permissions
CREATE POLICY IF NOT EXISTS "Users can insert their own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY IF NOT EXISTS "Users can view their own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Option 2: If policies already exist, you'll need to drop and recreate them
-- (This is what triggers the warning, but it's safe)
-- Uncomment the lines below if Option 1 doesn't work:

-- DROP POLICY IF EXISTS "Users can insert their own sessions" ON sessions;
-- CREATE POLICY "Users can insert their own sessions"
--   ON sessions FOR INSERT
--   WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
--
-- DROP POLICY IF EXISTS "Users can view their own sessions" ON sessions;
-- CREATE POLICY "Users can view their own sessions"
--   ON sessions FOR SELECT
--   USING (auth.uid() = user_id OR user_id IS NULL);
