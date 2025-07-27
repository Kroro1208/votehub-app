-- =====================================================
-- 2FA関連のセキュアなRPC関数
-- =====================================================

-- 1. 2FA設定の秘密キー取得（セキュア）
CREATE OR REPLACE FUNCTION get_2fa_secret_secure(
  p_user_id UUID
)
RETURNS TABLE(secret_key TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ユーザー認証チェック
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized access - user not authenticated';
  END IF;

  -- 自分の2FA設定のみアクセス可能
  IF auth.uid()::text != p_user_id::text THEN
    RAISE EXCEPTION 'Access denied - can only access own 2FA settings';
  END IF;

  -- 2FA設定の秘密キーを取得
  RETURN QUERY
  SELECT u2fa.secret_key
  FROM user_2fa_settings u2fa
  WHERE u2fa.user_id = p_user_id
    AND u2fa.is_enabled = true;
    
  -- 見つからない場合はエラー
  IF NOT FOUND THEN
    RAISE EXCEPTION '2FA settings not found or not enabled';
  END IF;
END;
$$;

-- 2. バックアップコード取得（セキュア）
CREATE OR REPLACE FUNCTION get_2fa_backup_codes_secure(
  p_user_id UUID
)
RETURNS TABLE(backup_codes TEXT[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ユーザー認証チェック
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized access - user not authenticated';
  END IF;

  -- 自分の2FA設定のみアクセス可能
  IF auth.uid()::text != p_user_id::text THEN
    RAISE EXCEPTION 'Access denied - can only access own 2FA settings';
  END IF;

  -- バックアップコードを取得
  RETURN QUERY
  SELECT u2fa.backup_codes
  FROM user_2fa_settings u2fa
  WHERE u2fa.user_id = p_user_id
    AND u2fa.is_enabled = true;
    
  -- 見つからない場合はエラー
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Backup codes not found or 2FA not enabled';
  END IF;
END;
$$;

-- 3. バックアップコード更新（セキュア）
CREATE OR REPLACE FUNCTION update_2fa_backup_codes_secure(
  p_user_id UUID,
  p_backup_codes TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- ユーザー認証チェック
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized access - user not authenticated';
  END IF;

  -- 自分の2FA設定のみ更新可能
  IF auth.uid()::text != p_user_id::text THEN
    RAISE EXCEPTION 'Access denied - can only update own 2FA settings';
  END IF;

  -- バックアップコードの妥当性チェック
  IF p_backup_codes IS NULL OR array_length(p_backup_codes, 1) IS NULL THEN
    RAISE EXCEPTION 'Invalid backup codes provided';
  END IF;

  -- バックアップコードを更新
  UPDATE user_2fa_settings
  SET 
    backup_codes = p_backup_codes,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND is_enabled = true;
    
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- 更新対象が見つからない場合はエラー
  IF v_updated_count = 0 THEN
    RAISE EXCEPTION '2FA settings not found or not enabled for this user';
  END IF;
  
  -- セキュリティログを記録
  INSERT INTO security_audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    p_user_id,
    'UPDATE_2FA_BACKUP_CODES',
    'user_2fa_settings',
    p_user_id::text,
    jsonb_build_object(
      'backup_codes_count', array_length(p_backup_codes, 1),
      'action_time', NOW()
    ),
    COALESCE(current_setting('request.headers', true)::jsonb->>'x-forwarded-for', 'unknown'),
    COALESCE(current_setting('request.headers', true)::jsonb->>'user-agent', 'unknown'),
    NOW()
  );

  RETURN TRUE;
END;
$$;

-- 4. 2FA認証試行ログ（既存のlog_2fa_attemptを改良）
CREATE OR REPLACE FUNCTION log_2fa_attempt_secure(
  p_user_id UUID,
  p_attempt_type TEXT,
  p_success BOOLEAN,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ユーザー認証チェック（ログインプロセスの場合はNULLの可能性もある）
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required for 2FA attempt logging';
  END IF;

  -- 2FA試行タイプの妥当性チェック
  IF p_attempt_type NOT IN ('totp', 'backup_code', 'setup', 'disable') THEN
    RAISE EXCEPTION 'Invalid 2FA attempt type: %', p_attempt_type;
  END IF;

  -- 2FA試行ログを挿入
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
    '2FA_ATTEMPT',
    'authentication',
    p_user_id::text,
    jsonb_build_object(
      'attempt_type', p_attempt_type,
      'success', p_success,
      'additional_details', p_details,
      'timestamp', NOW()
    ),
    COALESCE(current_setting('request.headers', true)::jsonb->>'x-forwarded-for', 'unknown'),
    COALESCE(current_setting('request.headers', true)::jsonb->>'user-agent', 'unknown'),
    NOW(),
    p_success
  );

  -- 失敗試行の場合、連続失敗回数をチェック
  IF NOT p_success THEN
    DECLARE
      v_recent_failures INTEGER;
    BEGIN
      -- 過去10分間の失敗回数を取得
      SELECT COUNT(*)
      INTO v_recent_failures
      FROM security_audit_logs
      WHERE user_id = p_user_id
        AND action = '2FA_ATTEMPT'
        AND success = false
        AND created_at > NOW() - INTERVAL '10 minutes';

      -- 失敗回数が多い場合は警告ログ
      IF v_recent_failures >= 5 THEN
        INSERT INTO security_audit_logs (
          user_id,
          action,
          resource_type,
          details,
          created_at,
          success
        ) VALUES (
          p_user_id,
          'SUSPICIOUS_2FA_ACTIVITY',
          'security_alert',
          jsonb_build_object(
            'alert_type', 'multiple_2fa_failures',
            'failure_count', v_recent_failures,
            'time_window', '10 minutes'
          ),
          NOW(),
          false
        );
      END IF;
    END;
  END IF;

  RETURN TRUE;
END;
$$;

-- RPC関数の権限設定
GRANT EXECUTE ON FUNCTION get_2fa_secret_secure(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_2fa_backup_codes_secure(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_2fa_backup_codes_secure(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION log_2fa_attempt_secure(UUID, TEXT, BOOLEAN, JSONB) TO authenticated;

-- セキュリティ強化：anon（匿名ユーザー）からのアクセスは拒否
REVOKE EXECUTE ON FUNCTION get_2fa_secret_secure(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION get_2fa_backup_codes_secure(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION update_2fa_backup_codes_secure(UUID, TEXT[]) FROM anon;
REVOKE EXECUTE ON FUNCTION log_2fa_attempt_secure(UUID, TEXT, BOOLEAN, JSONB) FROM anon;