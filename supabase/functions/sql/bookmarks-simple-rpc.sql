-- =====================================================
-- ブックマーク関連のシンプルなRPC関数
-- =====================================================

-- 1. ユーザーのブックマーク投稿ID一覧取得（シンプル版）
CREATE OR REPLACE FUNCTION get_user_bookmark_post_ids(
  p_user_id UUID
)
RETURNS TABLE(post_id INTEGER)
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

  -- ブックマークした投稿IDのみを返す
  RETURN QUERY
  SELECT b.post_id::INTEGER
  FROM bookmarks b
  WHERE b.user_id = p_user_id::text
  ORDER BY b.created_at DESC;
END;
$$;

-- 2. ブックマーク追加（シンプル版）
CREATE OR REPLACE FUNCTION add_bookmark_simple(
  p_user_id UUID,
  p_post_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bookmark_exists BOOLEAN := FALSE;
BEGIN
  -- ユーザー認証チェック
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized access - user not authenticated';
  END IF;

  -- 自分のブックマークのみ操作可能
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied - can only manage own bookmarks';
  END IF;

  -- 投稿の存在確認
  IF NOT EXISTS(SELECT 1 FROM posts WHERE id = p_post_id) THEN
    RAISE EXCEPTION 'Post not found';
  END IF;

  -- 既存のブックマーク確認
  SELECT EXISTS(
    SELECT 1 FROM bookmarks 
    WHERE user_id = p_user_id::text AND post_id = p_post_id
  ) INTO v_bookmark_exists;
  
  IF v_bookmark_exists THEN
    RAISE EXCEPTION 'Post already bookmarked';
  END IF;

  -- ブックマーク追加
  INSERT INTO bookmarks (user_id, post_id)
  VALUES (p_user_id::text, p_post_id);

  RETURN TRUE;
END;
$$;

-- 3. ブックマーク削除（シンプル版）
CREATE OR REPLACE FUNCTION remove_bookmark_simple(
  p_user_id UUID,
  p_post_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER := 0;
BEGIN
  -- ユーザー認証チェック
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized access - user not authenticated';
  END IF;

  -- 自分のブックマークのみ操作可能
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied - can only manage own bookmarks';
  END IF;

  -- ブックマーク削除
  DELETE FROM bookmarks 
  WHERE user_id = p_user_id::text AND post_id = p_post_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  IF v_deleted_count = 0 THEN
    RAISE EXCEPTION 'Bookmark not found';
  END IF;

  RETURN TRUE;
END;
$$;

-- 4. ブックマーク状況確認（シンプル版）
CREATE OR REPLACE FUNCTION is_bookmarked_simple(
  p_user_id UUID,
  p_post_id INTEGER
)
RETURNS BOOLEAN
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
  RETURN EXISTS(
    SELECT 1 FROM bookmarks 
    WHERE user_id = p_user_id::text AND post_id = p_post_id
  );
END;
$$;

-- RPC関数の権限設定
GRANT EXECUTE ON FUNCTION get_user_bookmark_post_ids(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_bookmark_simple(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_bookmark_simple(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION is_bookmarked_simple(UUID, INTEGER) TO authenticated;

-- セキュリティ強化：anon（匿名ユーザー）からのアクセスは拒否
REVOKE EXECUTE ON FUNCTION get_user_bookmark_post_ids(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION add_bookmark_simple(UUID, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION remove_bookmark_simple(UUID, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION is_bookmarked_simple(UUID, INTEGER) FROM anon;