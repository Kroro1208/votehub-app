-- 通知機能のためのマイグレーション（完全修正版）
-- 実行日: 2025-06-22
-- Issue #18: 派生質問作成時に該当者に通知する

-- 通知テーブルの作成
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('nested_post_created', 'persuasion_time_started', 'vote_deadline_ended')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
    nested_post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの追加（パフォーマンス最適化）
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(type);

-- RLS (Row Level Security) の有効化
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ポリシーの作成：ユーザーは自分の通知のみアクセス可能
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 通知作成用の関数
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_post_id BIGINT DEFAULT NULL,
    p_nested_post_id BIGINT DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
    notification_id BIGINT;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, post_id, nested_post_id)
    VALUES (p_user_id, p_type, p_title, p_message, p_post_id, p_nested_post_id)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 派生質問作成時の通知作成関数
CREATE OR REPLACE FUNCTION notify_nested_post_created()
RETURNS TRIGGER AS $$
DECLARE
    parent_post RECORD;
    target_users RECORD;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- 派生質問（nest_level > 0かつparent_post_idがNULLでない）の場合のみ処理
    IF NEW.nest_level > 0 AND NEW.parent_post_id IS NOT NULL THEN
        -- 親投稿の情報を取得
        SELECT * INTO parent_post FROM posts WHERE id = NEW.parent_post_id;
        
        IF parent_post IS NOT NULL THEN
            -- 通知メッセージの作成
            notification_title := '派生質問が作成されました';
            
            IF NEW.target_vote_choice = 1 THEN
                notification_message := format('「%s」に賛成したあなた宛に派生質問「%s」が作成されました。', 
                    parent_post.title, NEW.title);
            ELSIF NEW.target_vote_choice = -1 THEN
                notification_message := format('「%s」に反対したあなた宛に派生質問「%s」が作成されました。', 
                    parent_post.title, NEW.title);
            END IF;
            
            -- 対象となる投票者に通知を送信
            FOR target_users IN 
                SELECT DISTINCT user_id::UUID
                FROM votes 
                WHERE post_id = NEW.parent_post_id 
                AND vote = NEW.target_vote_choice
                AND user_id != NEW.user_id::TEXT
            LOOP
                PERFORM create_notification(
                    target_users.user_id,
                    'nested_post_created',
                    notification_title,
                    notification_message,
                    NEW.parent_post_id,
                    NEW.id
                );
            END LOOP;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの作成
CREATE TRIGGER trigger_notify_nested_post_created
    AFTER INSERT ON posts
    FOR EACH ROW
    EXECUTE FUNCTION notify_nested_post_created();

-- 未読通知数を取得する関数
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM notifications
    WHERE user_id = p_user_id AND read = FALSE;
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 通知を既読にする関数
CREATE OR REPLACE FUNCTION mark_notification_as_read(p_notification_id BIGINT, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications 
    SET read = TRUE 
    WHERE id = p_notification_id AND user_id = p_user_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 全ての通知を既読にする関数
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications 
    SET read = TRUE 
    WHERE user_id = p_user_id AND read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;