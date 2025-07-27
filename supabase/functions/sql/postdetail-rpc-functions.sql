-- PostDetail.tsx 用のセキュアなRPC関数
-- セキュリティ脆弱性修正のための追加RPC関数群

-- 既存関数の削除（競合回避）
DROP FUNCTION IF EXISTS get_post_by_id(INTEGER);
DROP FUNCTION IF EXISTS get_user_vote_for_post(INTEGER, TEXT);
DROP FUNCTION IF EXISTS get_comment_by_id(INTEGER);
DROP FUNCTION IF EXISTS create_persuasion_comment_safe(INTEGER, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_persuasion_comment_safe(INTEGER, TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS log_notification_attempt(INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_persuasion_notifications(INTEGER, TEXT);

-- 1. 投稿を安全に取得する関数
CREATE FUNCTION get_post_by_id(
    p_post_id INTEGER
)
RETURNS TABLE(
    id BIGINT,
    title TEXT,
    content TEXT,
    created_at TIMESTAMPTZ,
    image_url TEXT,
    avatar_url TEXT,
    vote_deadline TIMESTAMPTZ,
    community_id BIGINT,
    user_id TEXT,
    parent_post_id BIGINT,
    nest_level INTEGER,
    target_vote_choice INTEGER
) AS $$
BEGIN
    -- 入力値検証
    IF p_post_id IS NULL OR p_post_id <= 0 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.content,
        p.created_at,
        p.image_url,
        p.avatar_url,
        p.vote_deadline,
        p.community_id,
        p.user_id,
        p.parent_post_id,
        COALESCE(p.nest_level, 0) as nest_level,
        p.target_vote_choice
    FROM posts p
    WHERE p.id = p_post_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ユーザーの投票状況を安全に取得する関数
CREATE FUNCTION get_user_vote_for_post(
    p_post_id INTEGER,
    p_user_id TEXT
)
RETURNS TABLE(
    vote_type INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    -- 入力値検証
    IF p_post_id IS NULL OR p_post_id <= 0 THEN
        RETURN;
    END IF;
    
    IF p_user_id IS NULL OR TRIM(p_user_id) = '' THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        v.vote as vote_type,
        v.created_at
    FROM votes v
    WHERE v.post_id = p_post_id 
        AND v.user_id = p_user_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. コメントを安全に取得する関数
CREATE FUNCTION get_comment_by_id(
    p_comment_id INTEGER
)
RETURNS TABLE(
    id BIGINT,
    post_id BIGINT,
    user_id TEXT,
    content TEXT,
    created_at TIMESTAMPTZ,
    author TEXT,
    is_persuasion_comment BOOLEAN
) AS $$
BEGIN
    -- 入力値検証
    IF p_comment_id IS NULL OR p_comment_id <= 0 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.created_at,
        c.author,
        COALESCE(c.is_persuasion_comment, false) as is_persuasion_comment
    FROM comments c
    WHERE c.id = p_comment_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 説得コメントを安全に作成する関数
CREATE FUNCTION create_persuasion_comment_safe(
    p_post_id INTEGER,
    p_content TEXT,
    p_user_id TEXT,
    p_author TEXT
)
RETURNS TABLE(
    comment_id BIGINT,
    comment_post_id BIGINT,
    comment_user_id TEXT,
    comment_content TEXT,
    comment_created_at TIMESTAMPTZ,
    comment_author TEXT,
    comment_is_persuasion BOOLEAN
) AS $$
DECLARE
    new_comment_id BIGINT;
BEGIN
    -- 入力値検証
    IF p_post_id IS NULL OR p_post_id <= 0 THEN
        RAISE EXCEPTION 'Invalid post_id provided';
    END IF;
    
    IF p_content IS NULL OR TRIM(p_content) = '' THEN
        RAISE EXCEPTION 'Content cannot be empty';
    END IF;
    
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required';
    END IF;
    
    IF p_author IS NULL OR TRIM(p_author) = '' THEN
        RAISE EXCEPTION 'Author name is required';
    END IF;

    -- 投稿が存在するかチェック
    IF NOT EXISTS (SELECT 1 FROM posts WHERE id = p_post_id) THEN
        RAISE EXCEPTION 'Post not found';
    END IF;

    -- コメント作成
    INSERT INTO comments (
        post_id,
        content,
        user_id,
        author,
        is_persuasion_comment,
        created_at
    ) VALUES (
        p_post_id,
        TRIM(p_content),
        p_user_id,
        TRIM(p_author),
        true,
        NOW()
    ) RETURNING id INTO new_comment_id;

    -- 作成されたコメントを返す
    RETURN QUERY
    SELECT 
        c.id as comment_id,
        c.post_id as comment_post_id,
        c.user_id as comment_user_id,
        c.content as comment_content,
        c.created_at as comment_created_at,
        c.author as comment_author,
        c.is_persuasion_comment as comment_is_persuasion
    FROM comments c
    WHERE c.id = new_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 権限の付与
GRANT EXECUTE ON FUNCTION get_post_by_id(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_vote_for_post(INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_comment_by_id(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_persuasion_comment_safe(INTEGER, TEXT, TEXT, TEXT) TO authenticated;

-- 説得タイム中の投票変更制限チェック関数
CREATE OR REPLACE FUNCTION check_persuasion_vote_restriction(
    p_post_id BIGINT,
    p_user_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    existing_vote RECORD;
    is_persuasion_time BOOLEAN;
    post_deadline TIMESTAMPTZ;
BEGIN
    -- 投稿の期限を取得
    SELECT vote_deadline INTO post_deadline 
    FROM posts 
    WHERE id = p_post_id;
    
    IF post_deadline IS NULL THEN
        RETURN TRUE; -- 期限がない場合は制限なし
    END IF;
    
    -- 説得タイム（期限の1時間前）かどうかをチェック
    is_persuasion_time := (
        NOW() AT TIME ZONE 'UTC' >= (post_deadline AT TIME ZONE 'UTC' - INTERVAL '1 hour') 
        AND NOW() AT TIME ZONE 'UTC' < post_deadline AT TIME ZONE 'UTC'
    );
    
    -- 説得タイムでない場合は制限なし
    IF NOT is_persuasion_time THEN
        RETURN TRUE;
    END IF;
    
    -- 既存の投票を取得
    SELECT * INTO existing_vote 
    FROM votes 
    WHERE post_id = p_post_id AND user_id = p_user_id;
    
    -- 投票が存在しない場合は制限なし
    IF existing_vote IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- 既に説得タイム中に投票を変更している場合は制限
    RETURN NOT COALESCE(existing_vote.persuasion_vote_changed, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 説得タイム中の投票変更を強制的に実行する関数（制限チェック済み前提）
CREATE OR REPLACE FUNCTION force_persuasion_vote_change(
    p_post_id BIGINT,
    p_user_id TEXT,
    p_new_vote INTEGER
) RETURNS jsonb AS $$
DECLARE
    existing_vote RECORD;
BEGIN
    -- 既存の投票を取得
    SELECT * INTO existing_vote 
    FROM votes 
    WHERE post_id = p_post_id AND user_id = p_user_id;
    
    -- 投票が存在しない場合はエラー
    IF existing_vote IS NULL THEN
        RAISE EXCEPTION '投票が存在しません';
    END IF;
    
    -- 既に説得タイム中に投票を変更している場合はエラー
    IF existing_vote.persuasion_vote_changed = TRUE THEN
        RAISE EXCEPTION '説得タイム中の投票変更は1回までです';
    END IF;
    
    -- 投票を更新し、変更を追跡
    UPDATE votes 
    SET 
        vote = p_new_vote,
        persuasion_vote_changed = TRUE,
        original_vote = COALESCE(original_vote, existing_vote.vote),
        changed_at = NOW()
    WHERE id = existing_vote.id;
    
    RETURN jsonb_build_object(
        'action', 'persuasion_change',
        'data', jsonb_build_object(
            'id', existing_vote.id,
            'post_id', p_post_id,
            'user_id', p_user_id,
            'vote', p_new_vote,
            'persuasion_vote_changed', TRUE,
            'original_vote', COALESCE(existing_vote.original_vote, existing_vote.vote),
            'changed_at', NOW()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 通知試行をログに記録する関数
CREATE OR REPLACE FUNCTION log_notification_attempt(
  p_post_id INTEGER,
  p_notification_type TEXT,
  p_source TEXT DEFAULT 'client-js'
)
RETURNS VOID AS $$
BEGIN
  -- 通知試行のログをデバッグ目的で記録
  RAISE NOTICE '[%] 通知試行: postId=%, type=%, source=%', 
    NOW(), p_post_id, p_notification_type, p_source;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 説得タイム開始通知を作成する関数（修正版）
CREATE OR REPLACE FUNCTION create_persuasion_notifications(
  p_post_id INTEGER,
  p_post_title TEXT
)
RETURNS INTEGER AS $$
DECLARE
  notification_count INTEGER := 0;
BEGIN
  -- 重複チェック
  IF EXISTS (
    SELECT 1 FROM notifications 
    WHERE post_id = p_post_id 
    AND type = 'persuasion_time_started'
    LIMIT 1
  ) THEN
    RAISE NOTICE '説得タイム開始通知は既に送信済み (postId: %)', p_post_id;
    RETURN 0;
  END IF;

  -- 通知を作成（投票者のみに送信）
  INSERT INTO notifications (user_id, type, title, message, post_id, nested_post_id, read)
  SELECT DISTINCT
    votes.user_id::UUID,
    'persuasion_time_started',
    '参加した投票が説得タイムに入りました',
    '「' || p_post_title || '」の投票が説得タイムに入りました。期限前に投票を変更できます。',
    p_post_id,
    NULL::BIGINT,
    false
  FROM votes
  WHERE votes.post_id = p_post_id
  -- 重複を防ぐため、既に同じ通知を受け取っていないユーザーのみに送信
  AND NOT EXISTS (
    SELECT 1 
    FROM notifications n 
    WHERE n.user_id::TEXT = votes.user_id 
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 権限の付与
GRANT EXECUTE ON FUNCTION check_persuasion_vote_restriction(BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION force_persuasion_vote_change(BIGINT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION log_notification_attempt(INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_persuasion_notifications(INTEGER, TEXT) TO authenticated;

-- 成功メッセージ
SELECT 'PostDetail RPC functions created successfully!' as status;