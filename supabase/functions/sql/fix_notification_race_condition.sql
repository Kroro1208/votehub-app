-- Fix race condition in notification functions by using proper locking and atomic operations

-- Drop existing functions to recreate them with race condition protection
DROP FUNCTION IF EXISTS check_deadline_notification_not_sent(INTEGER);
DROP FUNCTION IF EXISTS create_deadline_notifications(INTEGER, TEXT);
DROP FUNCTION IF EXISTS check_persuasion_notification_not_sent(INTEGER);
DROP FUNCTION IF EXISTS create_persuasion_notifications(INTEGER, TEXT);

-- 投票期限終了通知が未送信かどうかをチェックする関数（行レベルロック付き）
CREATE OR REPLACE FUNCTION check_deadline_notification_not_sent(p_post_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  -- 行レベルロックを使用して競合状態を防ぐ
  PERFORM 1 
  FROM posts 
  WHERE id = p_post_id 
  FOR UPDATE;
  
  RETURN NOT EXISTS (
    SELECT 1 
    FROM notifications 
    WHERE post_id = p_post_id 
    AND type = 'vote_deadline_ended'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- 説得タイム開始通知が未送信かどうかをチェックする関数（行レベルロック付き）
CREATE OR REPLACE FUNCTION check_persuasion_notification_not_sent(p_post_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  -- 行レベルロックを使用して競合状態を防ぐ
  PERFORM 1 
  FROM posts 
  WHERE id = p_post_id 
  FOR UPDATE;
  
  RETURN NOT EXISTS (
    SELECT 1 
    FROM notifications 
    WHERE post_id = p_post_id 
    AND type = 'persuasion_time_started'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- 投票期限終了通知を一括作成する関数（トランザクション内でアトミックに実行）
CREATE OR REPLACE FUNCTION create_deadline_notifications(
  p_post_id INTEGER,
  p_post_title TEXT
)
RETURNS INTEGER AS $$
DECLARE
  notification_count INTEGER := 0;
  existing_count INTEGER := 0;
BEGIN
  -- トランザクション開始時点での既存通知をチェック（ロック付き）
  SELECT COUNT(*)
  INTO existing_count
  FROM notifications 
  WHERE post_id = p_post_id 
  AND type = 'vote_deadline_ended'
  FOR UPDATE;
  
  -- 既に通知が存在する場合は処理を中止
  IF existing_count > 0 THEN
    RETURN 0;
  END IF;

  -- 通知を一括作成（投票者のみに送信）
  INSERT INTO notifications (user_id, type, title, message, post_id, nested_post_id, read)
  SELECT DISTINCT
    votes.user_id::UUID,
    'vote_deadline_ended',
    '参加した投票の期限が終了しました',
    '「' || p_post_title || '」の投票期限が終了しました。結果をご確認ください。',
    p_post_id,
    NULL,
    false
  FROM votes
  WHERE votes.post_id = p_post_id
  -- 重複を防ぐため、既に同じ通知を受け取っていないユーザーのみに送信
  AND NOT EXISTS (
    SELECT 1 
    FROM notifications n 
    WHERE n.user_id = votes.user_id::UUID 
    AND n.post_id = p_post_id 
    AND n.type = 'vote_deadline_ended'
  );

  GET DIAGNOSTICS notification_count = ROW_COUNT;
  
  -- ログ出力
  IF notification_count > 0 THEN
    RAISE NOTICE '投票期限終了通知を%人に送信しました (postId: %)', notification_count, p_post_id;
  ELSE
    RAISE NOTICE '投票期限終了通知: 対象者なしまたは既に送信済み (postId: %)', p_post_id;
  END IF;
  
  RETURN notification_count;
END;
$$ LANGUAGE plpgsql;

-- 説得タイム開始通知を一括作成する関数（トランザクション内でアトミックに実行）
CREATE OR REPLACE FUNCTION create_persuasion_notifications(
  p_post_id INTEGER,
  p_post_title TEXT
)
RETURNS INTEGER AS $$
DECLARE
  notification_count INTEGER := 0;
  existing_count INTEGER := 0;
BEGIN
  -- トランザクション開始時点での既存通知をチェック（ロック付き）
  SELECT COUNT(*)
  INTO existing_count
  FROM notifications 
  WHERE post_id = p_post_id 
  AND type = 'persuasion_time_started'
  FOR UPDATE;
  
  -- 既に通知が存在する場合は処理を中止
  IF existing_count > 0 THEN
    RETURN 0;
  END IF;

  -- 通知を一括作成（投票者のみに送信）
  INSERT INTO notifications (user_id, type, title, message, post_id, nested_post_id, read)
  SELECT DISTINCT
    votes.user_id::UUID,
    'persuasion_time_started',
    '参加した投票が説得タイムに入りました',
    '「' || p_post_title || '」の投票が説得タイムに入りました。期限前に投票を変更できます。',
    p_post_id,
    NULL,
    false
  FROM votes
  WHERE votes.post_id = p_post_id
  -- 重複を防ぐため、既に同じ通知を受け取っていないユーザーのみに送信
  AND NOT EXISTS (
    SELECT 1 
    FROM notifications n 
    WHERE n.user_id = votes.user_id::UUID 
    AND n.post_id = p_post_id 
    AND n.type = 'persuasion_time_started'
  );

  GET DIAGNOSTICS notification_count = ROW_COUNT;
  
  -- ログ出力
  IF notification_count > 0 THEN
    RAISE NOTICE '説得タイム開始通知を%人に送信しました (postId: %)', notification_count, p_post_id;
  ELSE
    RAISE NOTICE '説得タイム開始通知: 対象者なしまたは既に送信済み (postId: %)', p_post_id;
  END IF;
  
  RETURN notification_count;
END;
$$ LANGUAGE plpgsql;

-- 既存の重複通知をクリーンアップする関数（オプション）
CREATE OR REPLACE FUNCTION cleanup_duplicate_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- 同じpost_id、type、user_idの通知で重複しているものを削除
  WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY post_id, type, user_id 
             ORDER BY created_at
           ) as rn
    FROM notifications
    WHERE type IN ('vote_deadline_ended', 'persuasion_time_started')
  )
  DELETE FROM notifications 
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE '重複通知を%件削除しました', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;