-- Migration: Add comment notifications for regular comments and replies

-- 1. Add new notification types to the existing constraint
DO $$
BEGIN
    -- Update the notification type constraint to include new comment notification types
    ALTER TABLE notifications 
    DROP CONSTRAINT IF EXISTS notifications_type_check;
    
    ALTER TABLE notifications 
    ADD CONSTRAINT notifications_type_check 
    CHECK (type IN (
        'nested_post_created', 
        'persuasion_time_started', 
        'vote_deadline_ended', 
        'persuasion_comment_posted', 
        'vote_received',
        'comment_posted',
        'comment_reply_posted'
    ));
END
$$;

-- 2. Create function to notify when someone comments on a post
CREATE OR REPLACE FUNCTION notify_comment_posted()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notifications for regular comments (not persuasion comments)
    IF NEW.is_persuasion_comment IS NOT TRUE THEN
        -- Case 1: Comment on a post (not a reply) - notify post author
        IF NEW.parent_comment_id IS NULL THEN
            INSERT INTO notifications (user_id, type, title, message, post_id, read, created_at)
            SELECT 
                posts.user_id::UUID,
                'comment_posted',
                'あなたの投稿にコメントが投稿されました',
                format('「%s」にコメントが投稿されました。', posts.title),
                NEW.post_id,
                false,
                NOW()
            FROM posts
            WHERE posts.id = NEW.post_id 
            AND posts.user_id != NEW.user_id;  -- Don't notify if commenting on own post
            
        -- Case 2: Reply to a comment - notify parent comment author
        ELSE
            INSERT INTO notifications (user_id, type, title, message, post_id, read, created_at)
            SELECT 
                parent_comments.user_id::UUID,
                'comment_reply_posted',
                'あなたのコメントに返信されました',
                format('「%s」での投稿であなたのコメントに返信されました。', posts.title),
                NEW.post_id,
                false,
                NOW()
            FROM comments AS parent_comments
            JOIN posts ON posts.id = NEW.post_id
            WHERE parent_comments.id = NEW.parent_comment_id 
            AND parent_comments.user_id != NEW.user_id;  -- Don't notify if replying to own comment
            
            -- Also notify post author if it's not the same person as comment author or replier
            INSERT INTO notifications (user_id, type, title, message, post_id, read, created_at)
            SELECT 
                posts.user_id::UUID,
                'comment_posted',
                'あなたの投稿にコメントが投稿されました',
                format('「%s」にコメントが投稿されました。', posts.title),
                NEW.post_id,
                false,
                NOW()
            FROM posts
            JOIN comments AS parent_comments ON parent_comments.id = NEW.parent_comment_id
            WHERE posts.id = NEW.post_id 
            AND posts.user_id != NEW.user_id  -- Don't notify if commenting on own post
            AND posts.user_id != parent_comments.user_id;  -- Don't duplicate if post author is same as parent comment author
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger for comment notifications
DROP TRIGGER IF EXISTS trigger_notify_comment_posted ON comments;
CREATE TRIGGER trigger_notify_comment_posted
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_comment_posted();

-- 4. Grant necessary permissions
GRANT EXECUTE ON FUNCTION notify_comment_posted() TO authenticated;