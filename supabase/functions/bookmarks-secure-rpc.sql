-- =====================================================
-- ブックマーク関連のセキュアなRPC関数
-- =====================================================

-- 1. ユーザーのブックマーク一覧取得（セキュア）
CREATE OR REPLACE FUNCTION get_user_bookmarks_secure(
  p_user_id UUID
)
RETURNS TABLE(
  post_id INTEGER,
  bookmark_created_at TIMESTAMPTZ,
  post_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ユーザー認証チェック
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized access - user not authenticated';
  END IF;

  -- 自分のブックマークのみアクセス可能
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied - can only access own bookmarks';
  END IF;

  -- ブックマーク一覧を取得（投稿の詳細情報含む）
  RETURN QUERY
  SELECT 
    b.post_id::INTEGER,
    b.created_at::TIMESTAMPTZ,
    jsonb_build_object(
      'id', p.id,
      'title', p.title,
      'content', p.content,
      'created_at', p.created_at,
      'image_url', p.image_url,
      'avatar_url', p.avatar_url,
      'community_id', p.community_id,
      'vote_deadline', p.vote_deadline,
      'user_id', p.user_id,
      'vote_count', COALESCE((
        SELECT COUNT(*) 
        FROM votes v 
        WHERE v.post_id = p.id
      ), 0),
      'tag_id', p.tag_id,
      'parent_post_id', p.parent_post_id,
      'nest_level', COALESCE(p.nest_level, 0),
      'target_vote_choice', p.target_vote_choice,
      'comment_count', COALESCE((
        SELECT COUNT(*) 
        FROM comments c 
        WHERE c.post_id = p.id
      ), 0)
    )::JSONB
  FROM bookmarks b
  INNER JOIN posts p ON b.post_id = p.id
  WHERE b.user_id = p_user_id::text
  ORDER BY b.created_at DESC;
END;
$$;

-- 2. ブックマーク追加（セキュア）
CREATE OR REPLACE FUNCTION add_bookmark_secure(
  p_user_id UUID,
  p_post_id INTEGER
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  bookmark_id INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_exists BOOLEAN := FALSE;
  v_bookmark_exists BOOLEAN := FALSE;
  v_new_bookmark_id INTEGER;
BEGIN
  -- ユーザー認証チェック
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized access - user not authenticated'::TEXT, NULL::INTEGER;
    RETURN;
  END IF;

  -- 自分のブックマークのみ操作可能
  IF auth.uid() != p_user_id THEN
    RETURN QUERY SELECT FALSE, 'Access denied - can only manage own bookmarks'::TEXT, NULL::INTEGER;
    RETURN;
  END IF;

  -- 投稿の存在確認
  SELECT EXISTS(SELECT 1 FROM posts WHERE id = p_post_id) INTO v_post_exists;
  
  IF NOT v_post_exists THEN
    RETURN QUERY SELECT FALSE, 'Post not found'::TEXT, NULL::INTEGER;
    RETURN;
  END IF;

  -- 既存のブックマーク確認
  SELECT EXISTS(
    SELECT 1 FROM bookmarks 
    WHERE user_id = p_user_id::text AND post_id = p_post_id
  ) INTO v_bookmark_exists;
  
  IF v_bookmark_exists THEN
    RETURN QUERY SELECT FALSE, 'Post already bookmarked'::TEXT, NULL::INTEGER;
    RETURN;
  END IF;

  -- ブックマーク追加
  BEGIN
    INSERT INTO bookmarks (user_id, post_id)
    VALUES (p_user_id::text, p_post_id)
    RETURNING id INTO v_new_bookmark_id;

    -- セキュリティ監査ログを記録（エラーがあっても処理を継続）
    BEGIN
      INSERT INTO security_audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at,
        success
      ) VALUES (
        p_user_id,
        'ADD_BOOKMARK',
        'bookmarks',
        v_new_bookmark_id::text,
        jsonb_build_object(
          'post_id', p_post_id,
          'bookmark_id', v_new_bookmark_id,
          'action_time', NOW()
        ),
        COALESCE(current_setting('request.headers', true)::jsonb->>'x-forwarded-for', 'unknown'),
        COALESCE(current_setting('request.headers', true)::jsonb->>'user-agent', 'unknown'),
        NOW(),
        TRUE
      );
    EXCEPTION WHEN OTHERS THEN
      -- ログ記録の失敗は無視（メイン処理は継続）
      NULL;
    END;

    RETURN QUERY SELECT TRUE, 'Bookmark added successfully'::TEXT, v_new_bookmark_id;

  EXCEPTION WHEN OTHERS THEN
    -- エラー時のセキュリティログ（エラーがあっても処理を継続）
    BEGIN
      INSERT INTO security_audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        created_at,
        success
      ) VALUES (
        p_user_id,
        'ADD_BOOKMARK_FAILED',
        'bookmarks',
        p_post_id::text,
        jsonb_build_object(
          'post_id', p_post_id,
          'error_message', SQLERRM,
          'error_time', NOW()
        ),
        NOW(),
        FALSE
      );
    EXCEPTION WHEN OTHERS THEN
      -- ログ記録の失敗は無視
      NULL;
    END;

    RETURN QUERY SELECT FALSE, ('Failed to add bookmark: ' || SQLERRM)::TEXT, NULL::INTEGER;
  END;
END;
$$;

-- 3. ブックマーク削除（セキュア）
CREATE OR REPLACE FUNCTION remove_bookmark_secure(
  p_user_id UUID,
  p_post_id INTEGER
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  deleted_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bookmark_exists BOOLEAN := FALSE;
  v_deleted_count INTEGER := 0;
  v_bookmark_id INTEGER;
BEGIN
  -- ユーザー認証チェック
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized access - user not authenticated'::TEXT, 0;
    RETURN;
  END IF;

  -- 自分のブックマークのみ操作可能
  IF auth.uid() != p_user_id THEN
    RETURN QUERY SELECT FALSE, 'Access denied - can only manage own bookmarks'::TEXT, 0;
    RETURN;
  END IF;

  -- 既存のブックマーク確認とID取得
  SELECT id INTO v_bookmark_id
  FROM bookmarks 
  WHERE user_id = p_user_id::text AND post_id = p_post_id;
  
  IF v_bookmark_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Bookmark not found'::TEXT, 0;
    RETURN;
  END IF;

  -- ブックマーク削除
  BEGIN
    DELETE FROM bookmarks 
    WHERE user_id = p_user_id::text AND post_id = p_post_id;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    -- セキュリティ監査ログを記録（エラーがあっても処理を継続）
    BEGIN
      INSERT INTO security_audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at,
        success
      ) VALUES (
        p_user_id,
        'REMOVE_BOOKMARK',
        'bookmarks',
        v_bookmark_id::text,
        jsonb_build_object(
          'post_id', p_post_id,
          'bookmark_id', v_bookmark_id,
          'deleted_count', v_deleted_count,
          'action_time', NOW()
        ),
        COALESCE(current_setting('request.headers', true)::jsonb->>'x-forwarded-for', 'unknown'),
        COALESCE(current_setting('request.headers', true)::jsonb->>'user-agent', 'unknown'),
        NOW(),
        TRUE
      );
    EXCEPTION WHEN OTHERS THEN
      -- ログ記録の失敗は無視（メイン処理は継続）
      NULL;
    END;

    RETURN QUERY SELECT TRUE, 'Bookmark removed successfully'::TEXT, v_deleted_count;

  EXCEPTION WHEN OTHERS THEN
    -- エラー時のセキュリティログ（エラーがあっても処理を継続）
    BEGIN
      INSERT INTO security_audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        created_at,
        success
      ) VALUES (
        p_user_id,
        'REMOVE_BOOKMARK_FAILED',
        'bookmarks',
        p_post_id::text,
        jsonb_build_object(
          'post_id', p_post_id,
          'error_message', SQLERRM,
          'error_time', NOW()
        ),
        NOW(),
        FALSE
      );
    EXCEPTION WHEN OTHERS THEN
      -- ログ記録の失敗は無視
      NULL;
    END;

    RETURN QUERY SELECT FALSE, ('Failed to remove bookmark: ' || SQLERRM)::TEXT, 0;
  END;
END;
$$;

-- 4. ブックマーク状況確認（セキュア）
CREATE OR REPLACE FUNCTION check_bookmark_status_secure(
  p_user_id UUID,
  p_post_id INTEGER
)
RETURNS TABLE(
  is_bookmarked BOOLEAN,
  bookmark_id INTEGER,
  bookmark_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ユーザー認証チェック
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized access - user not authenticated';
  END IF;

  -- 自分のブックマークのみアクセス可能
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied - can only check own bookmarks';
  END IF;

  -- ブックマーク状況を確認
  RETURN QUERY
  SELECT 
    CASE WHEN b.id IS NOT NULL THEN TRUE ELSE FALSE END,
    b.id,
    b.created_at
  FROM (SELECT p_post_id as post_id) p
  LEFT JOIN bookmarks b ON b.user_id = p_user_id::text AND b.post_id = p.post_id;
END;
$$;

-- RPC関数の権限設定
GRANT EXECUTE ON FUNCTION get_user_bookmarks_secure(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_bookmark_secure(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_bookmark_secure(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_bookmark_status_secure(UUID, INTEGER) TO authenticated;

-- セキュリティ強化：anon（匿名ユーザー）からのアクセスは拒否
REVOKE EXECUTE ON FUNCTION get_user_bookmarks_secure(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION add_bookmark_secure(UUID, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION remove_bookmark_secure(UUID, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION check_bookmark_status_secure(UUID, INTEGER) FROM anon;