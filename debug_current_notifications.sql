-- Debug script to check current notification state
-- Run this to understand the current situation before applying fixes

-- 1. Check for duplicate notifications
SELECT 
  'Duplicate Notifications' as check_type,
  post_id, 
  type, 
  user_id, 
  COUNT(*) as duplicate_count,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM notifications 
WHERE type IN ('vote_deadline_ended', 'persuasion_time_started')
GROUP BY post_id, type, user_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, post_id;

-- 2. Check recent notifications (last hour)
SELECT 
  'Recent Notifications' as check_type,
  n.id,
  n.type,
  n.title,
  n.post_id,
  p.title as post_title,
  n.created_at,
  p.vote_deadline,
  CASE 
    WHEN p.vote_deadline < NOW() THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END as deadline_status
FROM notifications n
LEFT JOIN posts p ON n.post_id = p.id
WHERE n.type IN ('vote_deadline_ended', 'persuasion_time_started')
AND n.created_at > NOW() - INTERVAL '1 hour'
ORDER BY n.created_at DESC;

-- 3. Check posts with expired deadlines that might need notifications
SELECT 
  'Posts with Expired Deadlines' as check_type,
  p.id as post_id,
  p.title,
  p.vote_deadline,
  p.created_at,
  (SELECT COUNT(*) FROM votes WHERE post_id = p.id) as voter_count,
  (SELECT COUNT(*) FROM notifications WHERE post_id = p.id AND type = 'vote_deadline_ended') as notification_count
FROM posts p
WHERE p.vote_deadline < NOW()
AND p.vote_deadline > NOW() - INTERVAL '24 hours' -- Only check recent deadlines
ORDER BY p.vote_deadline DESC;

-- 4. Check for posts with active intervals that might be causing issues
SELECT 
  'Active Posts with Deadlines' as check_type,
  p.id as post_id,
  p.title,
  p.vote_deadline,
  EXTRACT(EPOCH FROM (p.vote_deadline - NOW()))/60 as minutes_until_deadline,
  (SELECT COUNT(*) FROM votes WHERE post_id = p.id) as voter_count
FROM posts p
WHERE p.vote_deadline > NOW()
AND p.vote_deadline < NOW() + INTERVAL '24 hours' -- Posts expiring within 24 hours
ORDER BY p.vote_deadline ASC;

-- 5. Summary statistics
SELECT 
  'Summary' as check_type,
  type,
  COUNT(*) as total_notifications,
  COUNT(DISTINCT post_id) as unique_posts,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(created_at) as oldest_notification,
  MAX(created_at) as newest_notification
FROM notifications 
WHERE type IN ('vote_deadline_ended', 'persuasion_time_started')
GROUP BY type
ORDER BY type;