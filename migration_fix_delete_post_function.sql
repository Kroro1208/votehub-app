-- Migration: Fix delete_user_post function by removing old versions and creating correct one

-- First, drop any existing versions of the function
DROP FUNCTION IF EXISTS delete_user_post(bigint, uuid);
DROP FUNCTION IF EXISTS delete_user_post(bigint, text);

-- Create the correct function with proper types
CREATE OR REPLACE FUNCTION delete_user_post(post_id bigint, user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_post posts%ROWTYPE;
    result json;
BEGIN
    -- Check if the post exists and belongs to the user
    SELECT * INTO deleted_post
    FROM posts
    WHERE id = post_id AND posts.user_id = delete_user_post.user_id;
    
    IF deleted_post.id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Post not found or access denied'
        );
    END IF;
    
    -- Delete related records (in order to avoid foreign key constraints)
    
    -- 1. Delete child posts (nested posts)
    DELETE FROM posts WHERE parent_post_id = post_id;
    
    -- 2. Delete votes
    DELETE FROM votes WHERE votes.post_id = delete_user_post.post_id;
    
    -- 3. Delete comments
    DELETE FROM comments WHERE comments.post_id = delete_user_post.post_id;
    
    -- 4. Delete point transactions
    DELETE FROM point_transactions 
    WHERE reference_id = post_id AND reference_table = 'posts';
    
    -- 5. Delete bookmarks (should cascade automatically, but explicit for safety)
    DELETE FROM bookmarks WHERE bookmarks.post_id = delete_user_post.post_id;
    
    -- 6. Delete notifications (should cascade automatically, but explicit for safety)
    DELETE FROM notifications 
    WHERE notifications.post_id = delete_user_post.post_id 
       OR notifications.nested_post_id = delete_user_post.post_id;
    
    -- 7. Finally delete the main post
    DELETE FROM posts WHERE id = post_id AND posts.user_id = delete_user_post.user_id;
    
    -- Return success
    RETURN json_build_object(
        'success', true,
        'deleted_post_id', post_id,
        'message', 'Post deleted successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_post(bigint, text) TO authenticated;