-- Fix nested post notification system to prevent deadline notifications for new posts
-- This migration addresses the issue where nested posts trigger deadline ended notifications
-- instead of nested post created notifications

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

-- Improve the nested post notification trigger with better logging and validation
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
    FOR target_users IN 
        SELECT DISTINCT user_id::UUID
        FROM votes 
        WHERE post_id = NEW.parent_post_id 
        AND vote = NEW.target_vote_choice
        AND user_id != NEW.user_id
    LOOP
        PERFORM create_notification(
            target_users.user_id,
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
  INSERT INTO notifications (user_id, type, title, message, post_id, nested_post_id, read)
  SELECT 
    voters.user_id,
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