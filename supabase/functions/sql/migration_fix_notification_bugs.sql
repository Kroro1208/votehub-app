-- Fix notification bugs (GitHub issue #35)
-- This migration addresses two notification issues:
-- 1. Type mismatch in nested post notification trigger
-- 2. Missing deadline notification mechanism

-- Apply the fixed nested post notification system
\i fix_nested_post_notification_system.sql

-- Add a cron job helper function that can be called by external schedulers
CREATE OR REPLACE FUNCTION process_expired_vote_deadlines()
RETURNS JSON AS $$
DECLARE
    expired_posts RECORD;
    processed_count INTEGER := 0;
    total_notifications INTEGER := 0;
    notification_result INTEGER;
    result_json JSON;
BEGIN
    -- Process posts with expired deadlines
    FOR expired_posts IN 
        SELECT id, title, vote_deadline, created_at
        FROM posts 
        WHERE vote_deadline IS NOT NULL 
        AND vote_deadline < NOW()
        AND id NOT IN (
            SELECT DISTINCT post_id 
            FROM notifications 
            WHERE type = 'vote_deadline_ended' 
            AND post_id IS NOT NULL
        )
        ORDER BY vote_deadline DESC
        LIMIT 50
    LOOP
        -- Create deadline notifications for this post
        SELECT create_deadline_notifications(expired_posts.id, expired_posts.title) 
        INTO notification_result;
        
        IF notification_result > 0 THEN
            processed_count := processed_count + 1;
            total_notifications := total_notifications + notification_result;
        END IF;
    END LOOP;
    
    -- Return JSON result
    result_json := json_build_object(
        'processed_posts', processed_count,
        'total_notifications', total_notifications,
        'timestamp', NOW()
    );
    
    RETURN result_json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for Edge Function)
GRANT EXECUTE ON FUNCTION process_expired_vote_deadlines() TO authenticated;
GRANT EXECUTE ON FUNCTION create_deadline_notifications(INTEGER, TEXT) TO authenticated;

-- Add a function to manually trigger deadline notifications for testing
CREATE OR REPLACE FUNCTION trigger_deadline_notifications_for_post(p_post_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    post_info RECORD;
    notification_count INTEGER;
BEGIN
    -- Get post information
    SELECT id, title, vote_deadline INTO post_info
    FROM posts 
    WHERE id = p_post_id;
    
    IF post_info IS NULL THEN
        RAISE EXCEPTION 'Post with id % not found', p_post_id;
    END IF;
    
    -- Create notifications
    SELECT create_deadline_notifications(post_info.id, post_info.title) 
    INTO notification_count;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION trigger_deadline_notifications_for_post(INTEGER) TO authenticated;

-- Add logging for notification attempts
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id),
    notification_type TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT NULL,
    error_message TEXT DEFAULT NULL
);

-- Enable RLS on notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for notification_logs
DROP POLICY IF EXISTS "Users can view their own notification logs" ON notification_logs;
CREATE POLICY "Users can view their own notification logs" ON notification_logs
    FOR SELECT USING (
        post_id IN (
            SELECT id FROM posts WHERE user_id = auth.uid()
        )
    );

-- Function to log notification attempts
CREATE OR REPLACE FUNCTION log_notification_attempt(
    p_post_id INTEGER,
    p_notification_type TEXT,
    p_source TEXT DEFAULT 'unknown'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO notification_logs (post_id, notification_type, source)
    VALUES (p_post_id, p_notification_type, p_source);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_notification_attempt(INTEGER, TEXT, TEXT) TO authenticated;

-- Update notification statistics
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
    type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN read = true THEN 1 END) as read_count,
    COUNT(CASE WHEN read = false THEN 1 END) as unread_count,
    MAX(created_at) as latest_notification
FROM notifications
GROUP BY type;

-- Grant access to the view
GRANT SELECT ON notification_stats TO authenticated;