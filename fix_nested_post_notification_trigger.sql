-- Fix for nested post notification trigger
-- Issue: The notification trigger was failing due to logic issues

-- 派生質問作成時の通知作成関数（修正版）
CREATE OR REPLACE FUNCTION notify_nested_post_created()
RETURNS TRIGGER AS $$
DECLARE
    parent_post RECORD;
    target_users RECORD;
    notification_title TEXT;
    notification_message TEXT;
    vote_target_name TEXT;
BEGIN
    -- デバッグ用ログ
    RAISE NOTICE 'trigger fired: nest_level=%, parent_post_id=%, target_vote_choice=%', 
        NEW.nest_level, NEW.parent_post_id, NEW.target_vote_choice;
    
    -- 派生質問（nest_level > 0かつparent_post_idがNULLでない）の場合のみ処理
    IF NEW.nest_level > 0 AND NEW.parent_post_id IS NOT NULL THEN
        -- 親投稿の情報を取得
        SELECT * INTO parent_post FROM posts WHERE id = NEW.parent_post_id;
        
        IF parent_post IS NOT NULL THEN
            -- target_vote_choiceが有効な値でない場合はスキップ
            IF NEW.target_vote_choice IS NULL OR (NEW.target_vote_choice != 1 AND NEW.target_vote_choice != -1) THEN
                RAISE NOTICE 'Skipping notification: invalid target_vote_choice=%', NEW.target_vote_choice;
                RETURN NEW;
            END IF;
            
            -- 通知メッセージの作成
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
            
            RAISE NOTICE 'Creating notifications for % voters of post %', vote_target_name, NEW.parent_post_id;
            
            -- 対象となる投票者に通知を送信
            FOR target_users IN 
                SELECT DISTINCT user_id::UUID
                FROM votes 
                WHERE post_id = NEW.parent_post_id 
                AND vote = NEW.target_vote_choice
                AND user_id != NEW.user_id
            LOOP
                RAISE NOTICE 'Creating notification for user: %', target_users.user_id;
                
                PERFORM create_notification(
                    target_users.user_id,
                    'nested_post_created',
                    notification_title,
                    notification_message,
                    NEW.parent_post_id,
                    NEW.id
                );
            END LOOP;
            
            RAISE NOTICE 'Finished creating notifications for nested post %', NEW.id;
        ELSE
            RAISE NOTICE 'Parent post not found: %', NEW.parent_post_id;
        END IF;
    ELSE
        RAISE NOTICE 'Not a nested post: nest_level=%, parent_post_id=%', NEW.nest_level, NEW.parent_post_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーを再作成（既存のを削除してから作成）
DROP TRIGGER IF EXISTS trigger_notify_nested_post_created ON posts;
CREATE TRIGGER trigger_notify_nested_post_created
    AFTER INSERT ON posts
    FOR EACH ROW
    EXECUTE FUNCTION notify_nested_post_created();

-- テスト用の確認クエリ（実際の運用では不要）
-- SELECT 'Trigger updated successfully' as status;