-- Fix tags table to have auto-incrementing ID
-- This migration fixes the tags table ID column to be properly auto-incrementing

-- First, find the current maximum ID to set the sequence properly
SELECT setval('tags_id_seq', COALESCE((SELECT MAX(id) FROM tags), 1));

-- If the sequence doesn't exist, create it
DO $$
BEGIN
    -- Check if sequence exists, if not create it and set the default
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'tags_id_seq') THEN
        -- Create sequence
        CREATE SEQUENCE tags_id_seq;
        
        -- Set the sequence value to current max + 1
        PERFORM setval('tags_id_seq', COALESCE((SELECT MAX(id) FROM tags), 0) + 1);
        
        -- Alter the table to use the sequence as default
        ALTER TABLE tags ALTER COLUMN id SET DEFAULT nextval('tags_id_seq');
        
        -- Make sure the sequence is owned by the column
        ALTER SEQUENCE tags_id_seq OWNED BY tags.id;
    END IF;
END $$;

-- Verify the fix by testing an insert (this should work now)
-- The following is just for testing and will be removed
-- INSERT INTO tags (name, community_id) VALUES ('テスト自動ID', 7);

-- Show current table structure
\d tags;