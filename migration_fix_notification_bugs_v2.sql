-- Fix notification bugs (GitHub issue #35) - Version 2
-- This migration addresses two notification issues:
-- 1. Type mismatch in nested post notification trigger 
-- 2. Missing deadline notification mechanism
-- 
-- Fixed: Proper handling of TEXT vs UUID type conversions

-- First, let's add better validation to prevent notifications on newly created posts
CREATE OR REPLACE FUNCTION check_deadline_notification_not_sent(p_post_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    post_created_at TIMESTAMPTZ;
    time_since_creation INTERVAL;
BEGIN
    -- Get post creation time
    SELECT created_at INTO post_created_at
    FROM posts 
    WHERE id = p_post_id;
    
    -- Don't send deadline notifications for posts created less than 1 minute ago
    -- This prevents immediate deadline notifications for newly created nested posts
    time_since_creation := NOW() - post_created_at;
    
    IF time_since_creation < INTERVAL '1 minute' THEN
        RETURN FALSE; -- Too new, don't send deadline notification
    END IF;
    
    -- Check if notification already sent
    RETURN NOT EXISTS (
        SELECT 1 
        FROM notifications 
        WHERE post_id = p_post_id 
        AND type = 'vote_deadline_ended'
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- Improve the nested post notification trigger with proper type handling
CREATE OR REPLACE FUNCTION notify_nested_post_created()
RETURNS TRIGGER AS $$
DECLARE
    parent_post RECORD;
    target_users RECORD;
    notification_title TEXT;
    notification_message TEXT;
    vote_target_name TEXT;
    user_count INTEGER := 0;
BEGIN
    -- Only process nested posts
    IF NEW.nest_level IS NULL OR NEW.nest_level = 0 OR NEW.parent_post_id IS NULL THEN
        RAISE NOTICE 'Not a nested post: nest_level=%, parent_post_id=%', NEW.nest_level, NEW.parent_post_id;
        RETURN NEW;
    END IF;
    
    -- Validate target_vote_choice
    IF NEW.target_vote_choice IS NULL OR (NEW.target_vote_choice != 1 AND NEW.target_vote_choice != -1) THEN
        RAISE NOTICE 'Invalid target_vote_choice for nested post %: %', NEW.id, NEW.target_vote_choice;
        RETURN NEW;
    END IF;
    
    -- Get parent post information
    SELECT * INTO parent_post FROM posts WHERE id = NEW.parent_post_id;
    
    IF parent_post IS NULL THEN
        RAISE NOTICE 'Parent post not found: %', NEW.parent_post_id;
        RETURN NEW;
    END IF;
    
    -- Create notification messages
    notification_title := '派生質問が作成されました';
    
    IF NEW.target_vote_choice = 1 THEN
        vote_target_name := '賛成';
        notification_message := format('「%s」に賛成したあなた宛に派生質問「%s」が作成されました。', 
            parent_post.title, NEW.title);
    ELSIF NEW.target_vote_choice = -1 THEN
        vote_target_name := '反対';
        notification_message := format('「%s」に反対したあなた宛に派生質問「%s」が作成されました。', 
            parent_post.title, NEW.title);
    END IF;
    
    -- Send notifications to target users
    -- votes.user_id is TEXT, NEW.user_id is TEXT, notifications.user_id is UUID
    FOR target_users IN 
        SELECT DISTINCT user_id::UUID as user_id
        FROM votes 
        WHERE post_id = NEW.parent_post_id 
        AND vote = NEW.target_vote_choice
        AND user_id != NEW.user_id  -- Both are TEXT, so direct comparison is OK
    LOOP
        PERFORM create_notification(
            target_users.user_id,  -- This is now UUID from the cast above
            'nested_post_created',
            notification_title,
            notification_message,
            NEW.parent_post_id,
            NEW.id
        );
        user_count := user_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Created % nested post notifications for post %', user_count, NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS trigger_notify_nested_post_created ON posts;
CREATE TRIGGER trigger_notify_nested_post_created
    AFTER INSERT ON posts
    FOR EACH ROW
    EXECUTE FUNCTION notify_nested_post_created();

-- Add a function to prevent deadline notifications for very new posts
CREATE OR REPLACE FUNCTION should_check_deadline_notification(p_post_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    post_created_at TIMESTAMPTZ;
    time_since_creation INTERVAL;
BEGIN
    -- Get post creation time
    SELECT created_at INTO post_created_at
    FROM posts 
    WHERE id = p_post_id;
    
    IF post_created_at IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Don't check deadline for very new posts (prevents race conditions)
    time_since_creation := NOW() - post_created_at;
    
    RETURN time_since_creation >= INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql;

-- Update the deadline notification function to use the new validation
CREATE OR REPLACE FUNCTION create_deadline_notifications(
  p_post_id INTEGER,
  p_post_title TEXT
)
RETURNS INTEGER AS $$
DECLARE
  notification_count INTEGER;
BEGIN
  -- Check if we should even process this post (prevents notifications for very new posts)
  IF NOT should_check_deadline_notification(p_post_id) THEN
    RETURN 0; -- Too new, skip
  END IF;

  -- Check if notification already sent
  IF NOT check_deadline_notification_not_sent(p_post_id) THEN
    RETURN 0; -- Already sent
  END IF;

  -- Create notifications
  -- votes.user_id is TEXT, notifications.user_id is UUID, so we need to cast
  INSERT INTO notifications (user_id, type, title, message, post_id, nested_post_id, read)
  SELECT 
    voters.user_id::UUID,  -- Cast TEXT to UUID
    'vote_deadline_ended',
    '参加した投票の期限が終了しました',
    '「' || p_post_title || '」の投票期限が終了しました。結果をご確認ください。',
    p_post_id,
    NULL,
    false
  FROM get_post_voters(p_post_id) AS voters;

  GET DIAGNOSTICS notification_count = ROW_COUNT;
  RETURN notification_count;
END;
$$ LANGUAGE plpgsql;

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
            SELECT id FROM posts WHERE user_id = auth.uid()::TEXT  -- Cast UUID to TEXT for comparison
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