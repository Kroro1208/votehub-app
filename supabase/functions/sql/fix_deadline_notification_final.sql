-- Final fix for deadline notification issue
-- This creates a simplified, working version of deadline notifications

-- Create a simple function to get voters for a post (recreate to ensure it exists)
CREATE OR REPLACE FUNCTION get_post_voters(p_post_id INTEGER)
RETURNS TABLE(user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT votes.user_id::UUID
  FROM votes
  WHERE votes.post_id = p_post_id;
END;
$$ LANGUAGE plpgsql;

-- Simplified deadline notification function that works independently
CREATE OR REPLACE FUNCTION trigger_deadline_notifications_for_post(p_post_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    post_info RECORD;
    notification_count INTEGER := 0;
    voter_id UUID;
BEGIN
    -- Get post information
    SELECT id, title, vote_deadline INTO post_info
    FROM posts 
    WHERE id = p_post_id;
    
    IF post_info IS NULL THEN
        RAISE EXCEPTION 'Post with id % not found', p_post_id;
    END IF;
    
    -- Check if notifications already sent
    IF EXISTS (
        SELECT 1 FROM notifications 
        WHERE post_id = p_post_id 
        AND type = 'vote_deadline_ended'
    ) THEN
        RETURN 0; -- Already sent
    END IF;
    
    -- Create notifications directly without using other functions
    FOR voter_id IN 
        SELECT DISTINCT votes.user_id::UUID
        FROM votes
        WHERE votes.post_id = p_post_id
    LOOP
        INSERT INTO notifications (user_id, type, title, message, post_id, nested_post_id, read)
        VALUES (
            voter_id,
            'vote_deadline_ended',
            '参加した投票の期限が終了しました',
            '「' || post_info.title || '」の投票期限が終了しました。結果をご確認ください。',
            p_post_id,
            NULL,
            false
        );
        notification_count := notification_count + 1;
    END LOOP;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_post_voters(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_deadline_notifications_for_post(INTEGER) TO authenticated;

-- Test the function (commented out for safety)
-- SELECT trigger_deadline_notifications_for_post(95);