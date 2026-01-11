-- Fix RLS policy for sessions table to allow inserts with null user_id
-- Run this SQL in your Supabase SQL Editor

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can insert their own sessions" ON sessions;

-- Create a new policy that allows inserts when user_id matches auth.uid() OR when user_id is NULL
CREATE POLICY "Users can insert their own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Also update the SELECT policy to allow viewing sessions with null user_id
DROP POLICY IF EXISTS "Users can view their own sessions" ON sessions;

CREATE POLICY "Users can view their own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);
