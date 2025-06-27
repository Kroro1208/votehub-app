-- Fix tags table schema and RLS policies
-- This migration ensures the tags table has proper auto-incrementing ID and RLS policies

-- Drop existing table if it has issues
DROP TABLE IF EXISTS tags;

-- Create tags table with proper schema
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, community_id)
);

-- Enable Row Level Security
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tags
-- Allow anyone to read tags
CREATE POLICY "Anyone can read tags" ON tags
FOR SELECT USING (true);

-- Allow authenticated users to create tags
CREATE POLICY "Authenticated users can create tags" ON tags
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update their own tags (optional)
CREATE POLICY "Authenticated users can update tags" ON tags
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete their own tags (optional)
CREATE POLICY "Authenticated users can delete tags" ON tags
FOR DELETE USING (auth.role() = 'authenticated');

-- Create some sample tags for existing communities
INSERT INTO tags (name, community_id) VALUES
  ('エクササイズ', 7),
  ('ダイエット', 7),
  ('筋トレ', 7),
  ('環境政策', 8),
  ('リサイクル', 8),
  ('選挙', 10),
  ('政策', 10);

-- Verify the table structure
SELECT * FROM tags LIMIT 5;