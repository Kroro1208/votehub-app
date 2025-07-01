-- Fix post deletion constraint issue
-- Remove foreign key constraint from notification_logs table to allow post deletion

-- Drop the foreign key constraint that prevents post deletion
ALTER TABLE notification_logs 
DROP CONSTRAINT notification_logs_post_id_fkey;

-- Add the constraint back with CASCADE DELETE
-- This will automatically delete notification logs when a post is deleted
ALTER TABLE notification_logs 
ADD CONSTRAINT notification_logs_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

-- Grant necessary permissions
GRANT DELETE ON notification_logs TO authenticated;