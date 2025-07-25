-- 2FA (Two-Factor Authentication) システムのセットアップ
-- ユーザーの2FA設定とOTPシークレットを管理

-- 2FA設定テーブル
CREATE TABLE IF NOT EXISTS user_2fa_settings (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    is_enabled boolean DEFAULT false,
    secret_key text, -- TOTP用のシークレットキー（暗号化推奨）
    backup_codes text[], -- バックアップコード（暗号化推奨）
    last_used_at timestamptz,
    enabled_at timestamptz,
    disabled_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2FA認証ログテーブル
CREATE TABLE IF NOT EXISTS user_2fa_attempts (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    attempt_type text NOT NULL CHECK (attempt_type IN ('totp', 'backup_code', 'recovery')),
    success boolean DEFAULT false,
    ip_address inet,
    user_agent text,
    attempted_at timestamptz DEFAULT now()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_user_2fa_settings_user_id ON user_2fa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_settings_enabled ON user_2fa_settings(user_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_user_2fa_attempts_user_id ON user_2fa_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_attempts_time ON user_2fa_attempts(attempted_at);

-- RLSポリシーの設定
ALTER TABLE user_2fa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_2fa_attempts ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の2FA設定のみアクセス可能
CREATE POLICY "Users can view own 2FA settings" ON user_2fa_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own 2FA settings" ON user_2fa_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2FA settings" ON user_2fa_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の2FA試行ログのみ参照可能（セキュリティ確認用）
CREATE POLICY "Users can view own 2FA attempts" ON user_2fa_attempts
    FOR SELECT USING (auth.uid() = user_id);

-- システムからの挿入は許可
CREATE POLICY "System can insert 2FA attempts" ON user_2fa_attempts
    FOR INSERT WITH CHECK (true);

-- 2FA設定の有効化関数
CREATE OR REPLACE FUNCTION enable_user_2fa(
    p_user_id uuid,
    p_secret_key text,
    p_backup_codes text[]
) RETURNS boolean AS $$
BEGIN
    -- 既存の設定を確認
    INSERT INTO user_2fa_settings (user_id, secret_key, backup_codes, is_enabled, enabled_at)
    VALUES (p_user_id, p_secret_key, p_backup_codes, true, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        secret_key = EXCLUDED.secret_key,
        backup_codes = EXCLUDED.backup_codes,
        is_enabled = true,
        enabled_at = now(),
        updated_at = now();
    
    RETURN true;
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2FA設定の無効化関数
CREATE OR REPLACE FUNCTION disable_user_2fa(p_user_id uuid) RETURNS boolean AS $$
BEGIN
    UPDATE user_2fa_settings 
    SET 
        is_enabled = false,
        disabled_at = now(),
        updated_at = now()
    WHERE user_id = p_user_id;
    
    RETURN FOUND;
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2FA試行ログの記録関数
CREATE OR REPLACE FUNCTION log_2fa_attempt(
    p_user_id uuid,
    p_attempt_type text,
    p_success boolean,
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL
) RETURNS boolean AS $$
BEGIN
    INSERT INTO user_2fa_attempts (user_id, attempt_type, success, ip_address, user_agent)
    VALUES (p_user_id, p_attempt_type, p_success, p_ip_address, p_user_agent);
    
    -- 成功した場合は最後の使用時間を更新
    IF p_success THEN
        UPDATE user_2fa_settings 
        SET last_used_at = now(), updated_at = now()
        WHERE user_id = p_user_id AND is_enabled = true;
    END IF;
    
    RETURN true;
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- バックアップコードを使用済みにマークする関数
CREATE OR REPLACE FUNCTION use_backup_code(
    p_user_id uuid,
    p_backup_code text
) RETURNS boolean AS $$
DECLARE
    current_codes text[];
    new_codes text[];
BEGIN
    -- 現在のバックアップコードを取得
    SELECT backup_codes INTO current_codes
    FROM user_2fa_settings
    WHERE user_id = p_user_id AND is_enabled = true;
    
    -- バックアップコードが存在するかチェック
    IF p_backup_code = ANY(current_codes) THEN
        -- 使用したコードを配列から削除
        SELECT array_agg(code) INTO new_codes
        FROM unnest(current_codes) AS code
        WHERE code != p_backup_code;
        
        -- バックアップコードを更新
        UPDATE user_2fa_settings
        SET backup_codes = new_codes, updated_at = now()
        WHERE user_id = p_user_id;
        
        RETURN true;
    END IF;
    
    RETURN false;
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2FA設定状況の取得関数
CREATE OR REPLACE FUNCTION get_user_2fa_status(p_user_id uuid) 
RETURNS TABLE (
    is_enabled boolean,
    has_backup_codes boolean,
    backup_codes_count integer,
    last_used_at timestamptz,
    enabled_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(s.is_enabled, false) as is_enabled,
        COALESCE(array_length(s.backup_codes, 1) > 0, false) as has_backup_codes,
        COALESCE(array_length(s.backup_codes, 1), 0) as backup_codes_count,
        s.last_used_at,
        s.enabled_at
    FROM user_2fa_settings s
    WHERE s.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 定期クリーンアップ: 古い2FA試行ログを削除（30日以上前）
CREATE OR REPLACE FUNCTION cleanup_old_2fa_attempts() RETURNS void AS $$
BEGIN
    DELETE FROM user_2fa_attempts 
    WHERE attempted_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;

-- 2FA統計情報の取得（管理者用）
CREATE OR REPLACE FUNCTION get_2fa_statistics() 
RETURNS TABLE (
    total_users bigint,
    enabled_2fa_users bigint,
    recent_attempts bigint,
    success_rate numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT count(*) FROM auth.users) as total_users,
        (SELECT count(*) FROM user_2fa_settings WHERE is_enabled = true) as enabled_2fa_users,
        (SELECT count(*) FROM user_2fa_attempts WHERE attempted_at > now() - interval '24 hours') as recent_attempts,
        (SELECT 
            CASE 
                WHEN count(*) = 0 THEN 0 
                ELSE round((count(*) FILTER (WHERE success = true) * 100.0 / count(*)), 2)
            END
         FROM user_2fa_attempts 
         WHERE attempted_at > now() - interval '24 hours'
        ) as success_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;