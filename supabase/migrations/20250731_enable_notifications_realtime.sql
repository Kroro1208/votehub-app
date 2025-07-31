-- Migration: Enable real-time functionality for notifications table
-- Issue #78: 通知のお知らせがリアルタイムでこないことがある
-- Date: 2025-07-31

-- Step 1: Enable replica identity for notifications table
-- This allows Supabase to track changes for real-time subscriptions
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Step 2: Add notifications table to real-time publication
-- This enables real-time subscriptions for the notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Step 3: Verify real-time configuration
-- Check that the table is now included in real-time publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'notifications';

-- Step 4: Add comment for documentation
COMMENT ON TABLE notifications IS 'Notifications table with real-time functionality enabled for immediate delivery';

-- Optional: Also ensure related tables have proper real-time configuration
-- (These should already be enabled, but double-checking)

-- Check if votes table has real-time enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'votes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE votes;
    END IF;
END
$$;

-- Check if comments table has real-time enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'comments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE comments;
    END IF;
END
$$;

-- Check if user_points table has real-time enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'user_points'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE user_points;
    END IF;
END
$$;

-- Verification query to confirm all important tables are in real-time publication
SELECT 
    schemaname, 
    tablename,
    'Real-time enabled' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('notifications', 'votes', 'comments', 'user_points', 'posts')
ORDER BY tablename;