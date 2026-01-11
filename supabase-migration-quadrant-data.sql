-- Migration: Add quadrant_data column to sessions table
-- Run this SQL in your Supabase SQL Editor if you already have the sessions table

-- Add quadrant_data JSONB column to store 4-quadrant activity data
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS quadrant_data JSONB;

-- Add comment to document the column structure
COMMENT ON COLUMN sessions.quadrant_data IS '4-quadrant activity data: {topLeft, topRight, bottomLeft, bottomRight} as percentages (0-100)';
