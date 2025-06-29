-- 説得タイム開始通知が未送信かどうかをチェックする関数
CREATE OR REPLACE FUNCTION check_persuasion_notification_not_sent(p_post_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 
    FROM notifications 
    WHERE post_id = p_post_id 
    AND type = 'persuasion_time_started'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- 投票期限終了通知が未送信かどうかをチェックする関数
CREATE OR REPLACE FUNCTION check_deadline_notification_not_sent(p_post_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 
    FROM notifications 
    WHERE post_id = p_post_id 
    AND type = 'vote_deadline_ended'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- 投稿に参加したユーザーIDのリストを取得する関数
DROP FUNCTION IF EXISTS get_post_voters(INTEGER);
CREATE OR REPLACE FUNCTION get_post_voters(p_post_id INTEGER)
RETURNS TABLE(user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT votes.user_id::UUID
  FROM votes
  WHERE votes.post_id = p_post_id;
END;
$$ LANGUAGE plpgsql;

-- 説得タイム開始通知を一括作成する関数
CREATE OR REPLACE FUNCTION create_persuasion_notifications(
  p_post_id INTEGER,
  p_post_title TEXT
)
RETURNS INTEGER AS $$
DECLARE
  notification_count INTEGER;
BEGIN
  -- 既に通知が送信済みかチェック
  IF NOT check_persuasion_notification_not_sent(p_post_id) THEN
    RETURN 0; -- 既に送信済み
  END IF;

  -- 通知を一括作成
  INSERT INTO notifications (user_id, type, title, message, post_id, nested_post_id, read)
  SELECT 
    voters.user_id,
    'persuasion_time_started',
    '参加した投票が説得タイムに入りました',
    '「' || p_post_title || '」の投票が説得タイムに入りました。期限前に投票を変更できます。',
    p_post_id,
    NULL,
    false
  FROM get_post_voters(p_post_id) AS voters;

  GET DIAGNOSTICS notification_count = ROW_COUNT;
  RETURN notification_count;
END;
$$ LANGUAGE plpgsql;

-- 投票期限終了通知を一括作成する関数
CREATE OR REPLACE FUNCTION create_deadline_notifications(
  p_post_id INTEGER,
  p_post_title TEXT
)
RETURNS INTEGER AS $$
DECLARE
  notification_count INTEGER;
BEGIN
  -- 既に通知が送信済みかチェック
  IF NOT check_deadline_notification_not_sent(p_post_id) THEN
    RETURN 0; -- 既に送信済み
  END IF;

  -- 通知を一括作成
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