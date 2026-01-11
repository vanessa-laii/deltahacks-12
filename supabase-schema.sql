-- Supabase Database Schema for MindFill Gallery
-- Run this SQL in your Supabase SQL Editor

-- Create gallery_images table
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sessions table for cognitive tracking (Phase 3)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_id UUID REFERENCES gallery_images(id) ON DELETE SET NULL,
  completion_time INTEGER, -- in seconds
  neglect_ratio DECIMAL(5, 4), -- ratio of left vs right interactions (0-1)
  tremor_index DECIMAL(5, 4), -- measure of drawing stability
  ai_insight TEXT, -- Gemini-generated insights
  quadrant_data JSONB, -- 4-quadrant activity data: {topLeft, topRight, bottomLeft, bottomRight} as percentages
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_gallery_images_user_id ON gallery_images(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_images_created_at ON gallery_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for gallery_images
-- Allow users to see their own images
CREATE POLICY "Users can view their own images"
  ON gallery_images FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to insert their own images
CREATE POLICY "Users can insert their own images"
  ON gallery_images FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images"
  ON gallery_images FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Create policies for sessions
CREATE POLICY "Users can view their own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_gallery_images_updated_at
  BEFORE UPDATE ON gallery_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
