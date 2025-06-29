-- Debug script to investigate the nested post notification issue
-- This script helps identify conflicts between triggers

-- Check existing triggers on the posts table
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_timing,
    t.action_statement,
    t.action_orientation
FROM information_schema.triggers t
WHERE t.event_object_table = 'posts'
AND t.trigger_schema = 'public'
ORDER BY t.trigger_name;

-- Check existing notification functions
SELECT 
    p.proname as function_name,
    p.prosrc as function_source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname LIKE '%notification%'
ORDER BY p.proname;

-- Check recent notifications to see what's being created
SELECT 
    n.id,
    n.type,
    n.title,
    n.message,
    n.post_id,
    n.nested_post_id,
    n.created_at,
    p.title as post_title,
    p.nest_level,
    p.parent_post_id,
    p.target_vote_choice,
    p.vote_deadline
FROM notifications n
LEFT JOIN posts p ON n.nested_post_id = p.id
WHERE n.created_at > NOW() - INTERVAL '1 day'
ORDER BY n.created_at DESC
LIMIT 20;

-- Check if there are any nested posts created recently
SELECT 
    p.id,
    p.title,
    p.nest_level,
    p.parent_post_id,
    p.target_vote_choice,
    p.vote_deadline,
    p.created_at,
    CASE 
        WHEN p.vote_deadline < NOW() THEN 'EXPIRED'
        ELSE 'ACTIVE'
    END as deadline_status
FROM posts p
WHERE p.nest_level > 0
AND p.created_at > NOW() - INTERVAL '1 day'
ORDER BY p.created_at DESC;