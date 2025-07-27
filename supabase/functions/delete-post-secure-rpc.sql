-- =====================================================
-- 投稿削除関連のセキュアなRPC関数
-- =====================================================

-- 1. 投稿削除権限チェック（セキュア）
CREATE OR REPLACE FUNCTION check_post_delete_permission_secure(
  p_post_id INTEGER,
  p_user_id UUID
)
RETURNS TABLE(
  post_id INTEGER,
  post_user_id UUID,
  can_delete BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_user_id UUID;
  v_post_exists BOOLEAN := FALSE;
BEGIN
  -- ユーザー認証チェック
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT 
      p_post_id, 
      NULL::UUID, 
      FALSE, 
      'Unauthorized access - user not authenticated';
    RETURN;
  END IF;

  -- 認証ユーザーと実行ユーザーが一致するかチェック
  IF auth.uid() != p_user_id THEN
    RETURN QUERY SELECT 
      p_post_id, 
      NULL::UUID, 
      FALSE, 
      'Access denied - can only delete own posts';
    RETURN;
  END IF;

  -- 投稿の存在と所有者を確認
  SELECT user_id INTO v_post_user_id
  FROM posts 
  WHERE id = p_post_id;
  
  IF v_post_user_id IS NULL THEN
    RETURN QUERY SELECT 
      p_post_id, 
      NULL::UUID, 
      FALSE, 
      'Post not found';
    RETURN;
  END IF;

  -- 所有者チェック（テキスト型として比較）
  IF v_post_user_id::text != p_user_id::text THEN
    RETURN QUERY SELECT 
      p_post_id, 
      v_post_user_id, 
      FALSE, 
      'Permission denied - not the post owner';
    RETURN;
  END IF;

  -- 権限確認成功
  RETURN QUERY SELECT 
    p_post_id, 
    v_post_user_id, 
    TRUE, 
    'Permission granted'::TEXT;
END;
$$;

-- 2. 投稿削除処理（セキュア・トランザクション対応）
CREATE OR REPLACE FUNCTION delete_post_secure(
  p_post_id INTEGER,
  p_user_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  deleted_post_id INTEGER,
  error_message TEXT,
  affected_rows INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_permission_check RECORD;
  v_deleted_count INTEGER := 0;
  v_point_transactions_deleted INTEGER := 0;
  v_image_url TEXT;
BEGIN
  -- 権限チェック
  SELECT * INTO v_permission_check 
  FROM check_post_delete_permission_secure(p_post_id, p_user_id);
  
  IF NOT v_permission_check.can_delete THEN
    RETURN QUERY SELECT 
      FALSE, 
      p_post_id, 
      v_permission_check.error_message, 
      0;
    RETURN;
  END IF;

  -- トランザクション開始（関数内では自動的にトランザクション）
  BEGIN
    -- 投稿の画像URLを取得（削除後のストレージクリーンアップ用）
    SELECT image_url INTO v_image_url
    FROM posts 
    WHERE id = p_post_id AND user_id = p_user_id::text;

    -- 1. ポイント取引削除（CASCADE対象外のため先に削除）
    DELETE FROM point_transactions 
    WHERE reference_id = p_post_id 
      AND reference_table = 'posts';
    
    GET DIAGNOSTICS v_point_transactions_deleted = ROW_COUNT;

    -- 2. 投稿削除（CASCADE DELETEにより関連データも自動削除）
    DELETE FROM posts 
    WHERE id = p_post_id 
      AND user_id = p_user_id::text;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    -- 削除数チェック
    IF v_deleted_count = 0 THEN
      RAISE EXCEPTION 'Post deletion failed - no rows affected';
    END IF;

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
        'DELETE_POST',
        'posts',
        p_post_id::text,
        jsonb_build_object(
          'post_id', p_post_id,
          'point_transactions_deleted', v_point_transactions_deleted,
          'image_url', v_image_url,
          'deletion_time', NOW()
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

    -- 成功レスポンス
    RETURN QUERY SELECT 
      TRUE, 
      p_post_id, 
      'Post deleted successfully'::TEXT, 
      v_deleted_count;

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
        'DELETE_POST_FAILED',
        'posts',
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

    -- エラーレスポンス
    RETURN QUERY SELECT 
      FALSE, 
      p_post_id, 
      ('Post deletion failed: ' || SQLERRM)::TEXT, 
      0;
  END;
END;
$$;

-- 3. 投稿削除用の統合RPC関数（権限チェック + 削除を一括実行）
CREATE OR REPLACE FUNCTION delete_user_post_secure(
  p_post_id INTEGER,
  p_user_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  post_id INTEGER,
  image_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delete_result RECORD;
  v_image_url TEXT;
BEGIN
  -- ユーザー認証チェック
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT 
      FALSE, 
      'Unauthorized access - user not authenticated'::TEXT, 
      p_post_id, 
      NULL::TEXT;
    RETURN;
  END IF;

  -- 認証ユーザーと実行ユーザーが一致するかチェック
  IF auth.uid() != p_user_id THEN
    RETURN QUERY SELECT 
      FALSE, 
      'Access denied - authentication mismatch'::TEXT, 
      p_post_id, 
      NULL::TEXT;
    RETURN;
  END IF;

  -- 投稿削除の実行
  SELECT * INTO v_delete_result 
  FROM delete_post_secure(p_post_id, p_user_id);
  
  -- 削除された投稿の画像URLを取得（削除前に取得）
  IF v_delete_result.success THEN
    -- 削除された投稿の画像URLを取得（ログテーブルから）
    BEGIN
      SELECT jsonb_extract_path_text(details, 'image_url') INTO v_image_url
      FROM security_audit_logs 
      WHERE action = 'DELETE_POST' 
        AND resource_id = p_post_id::text 
        AND user_id = p_user_id
      ORDER BY created_at DESC 
      LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      -- ログテーブルが存在しない場合は無視
      v_image_url := NULL;
    END;
  END IF;

  RETURN QUERY SELECT 
    v_delete_result.success, 
    v_delete_result.error_message, 
    v_delete_result.deleted_post_id, 
    v_image_url;
END;
$$;

-- RPC関数の権限設定
GRANT EXECUTE ON FUNCTION check_post_delete_permission_secure(INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_post_secure(INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_post_secure(INTEGER, UUID) TO authenticated;

-- セキュリティ強化：anon（匿名ユーザー）からのアクセスは拒否
REVOKE EXECUTE ON FUNCTION check_post_delete_permission_secure(INTEGER, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION delete_post_secure(INTEGER, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION delete_user_post_secure(INTEGER, UUID) FROM anon;