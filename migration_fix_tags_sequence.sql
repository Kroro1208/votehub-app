-- Fix tags table ID sequence
-- This fixes the issue where the sequence gets out of sync with existing data

-- First, check current state
SELECT 'Current max ID:' as info, COALESCE(MAX(id), 0) as value FROM tags
UNION ALL
SELECT 'Current sequence value:', last_value FROM tags_id_seq;

-- Show existing tags
SELECT id, name, community_id FROM tags ORDER BY id;

-- Method 1: Reset sequence to max ID + 1
DO $$
DECLARE
    max_id INTEGER;
BEGIN
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM tags;
    PERFORM setval('tags_id_seq', max_id + 1, false);
    RAISE NOTICE 'Sequence reset to: %', max_id + 1;
END $$;

-- Test the sequence fix
SELECT nextval('tags_id_seq') as next_id_will_be;