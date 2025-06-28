-- 説得コメント通知機能のためのマイグレーション
-- 実行日: 2025-06-28
-- Issue #30: 投稿主が説得コメントしたら通知が来るようにする

-- 既存のデータを確認
-- SELECT DISTINCT type FROM notifications;

-- 問題のある通知タイプがある場合は、まず確認してから制約を更新
-- 通知タイプに新しいタイプを追加（既存データに配慮）
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 既存のすべての通知タイプを含む制約を作成
ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('nested_post_created', 'persuasion_time_started', 'vote_deadline_ended', 'persuasion_comment_posted', 'vote_received'));

-- 説得コメント投稿時の通知作成関数
CREATE OR REPLACE FUNCTION notify_persuasion_comment_posted()
RETURNS TRIGGER AS $$
BEGIN
    -- 説得コメントの場合、投票したユーザーに直接通知を送信
    IF NEW.is_persuasion_comment = true THEN
        INSERT INTO notifications (user_id, type, title, message, post_id, read, created_at)
        SELECT 
            votes.user_id::UUID,
            'persuasion_comment_posted',
            '投稿者から説得コメントが投稿されました',
            format('「%s」の投稿者から新しい説得コメントが投稿されました。', posts.title),
            NEW.post_id,
            false,
            NOW()
        FROM votes
        JOIN posts ON votes.post_id = posts.id
        WHERE votes.post_id = NEW.post_id 
        AND votes.user_id != NEW.user_id
        AND NEW.user_id = posts.user_id;  -- 投稿者本人の場合のみ
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 説得コメント投稿時のトリガーを作成（既存トリガーがある場合は削除してから作成）
DROP TRIGGER IF EXISTS trigger_notify_persuasion_comment_posted ON comments;
CREATE TRIGGER trigger_notify_persuasion_comment_posted
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_persuasion_comment_posted();