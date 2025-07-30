-- Fix communities table for proper ID generation
-- This addresses the issue with space creation failing

-- Drop the existing table if it exists and recreate with proper ID generation
DROP TABLE IF EXISTS communities CASCADE;

-- Create communities table with proper auto-incrementing ID
CREATE TABLE communities (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT DEFAULT '🏛️',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add unique constraint on name to prevent duplicate spaces
ALTER TABLE communities ADD CONSTRAINT communities_name_unique UNIQUE (name);

-- Create index for performance
CREATE INDEX idx_communities_created_at ON communities(created_at DESC);
CREATE INDEX idx_communities_name ON communities(name);

-- Enable Row Level Security
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Communities are viewable by everyone" ON communities
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create communities" ON communities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own communities" ON communities
    FOR UPDATE USING (auth.uid()::text IN (
        SELECT user_id FROM posts WHERE community_id = communities.id
    ));

-- Grant permissions
GRANT ALL ON communities TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE communities_id_seq TO authenticated;