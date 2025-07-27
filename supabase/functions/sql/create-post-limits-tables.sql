-- 🎯 投稿制限機能 (Issue #34) - 実行用SQLスクリプト
-- ⚠️  このファイルをSupabase SQL Editorで実行してください
-- 📝 既存システムとの互換性のため、user_idはTEXT型を使用

-- 1. ユーザー会員グレード管理テーブル
CREATE TABLE user_memberships (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    membership_type TEXT DEFAULT 'free' CHECK (membership_type IN ('free', 'standard', 'platinum', 'diamond')),
    daily_post_limit INTEGER DEFAULT 3,
    priority_tickets INTEGER DEFAULT 0,
    monthly_ticket_reset_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 日次投稿制限追跡テーブル
CREATE TABLE daily_post_counts (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    post_date DATE DEFAULT CURRENT_DATE,
    post_count INTEGER DEFAULT 0,
    limit_removed_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_date)
);

-- 3. 投稿制限解除履歴テーブル
CREATE TABLE post_limit_removals (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    removal_date DATE DEFAULT CURRENT_DATE,
    points_cost INTEGER DEFAULT 30,
    post_limit_increased_by INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスを追加（パフォーマンス最適化）
CREATE INDEX idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX idx_daily_post_counts_user_date ON daily_post_counts(user_id, post_date);
CREATE INDEX idx_post_limit_removals_user_date ON post_limit_removals(user_id, removal_date);

-- 4. 投稿制限チェック関数
CREATE OR REPLACE FUNCTION check_user_post_limit(p_user_id TEXT, p_post_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    can_post BOOLEAN,
    current_count INTEGER,
    daily_limit INTEGER,
    remaining_posts INTEGER,
    membership_type TEXT
) AS $$
DECLARE
    v_membership_type TEXT;
    v_daily_limit INTEGER;
    v_current_count INTEGER;
    v_limit_removed_count INTEGER;
BEGIN
    -- p_user_idがnullでないことを確認
    IF p_user_id IS NULL OR p_user_id = '' THEN
        RAISE NOTICE 'Received user_id: %, auth.uid(): %', p_user_id, auth.uid();
        RAISE EXCEPTION 'user_id cannot be null or empty';
    END IF;
    
    -- ユーザーの会員情報を取得
    SELECT um.membership_type, um.daily_post_limit
    INTO v_membership_type, v_daily_limit
    FROM user_memberships um
    WHERE um.user_id = p_user_id;
    
    -- 会員情報が存在しない場合は無料会員として作成
    IF v_membership_type IS NULL THEN
        INSERT INTO user_memberships (user_id, membership_type, daily_post_limit)
        VALUES (p_user_id, 'free', 10)
        ON CONFLICT (user_id) DO UPDATE SET 
            membership_type = EXCLUDED.membership_type,
            daily_post_limit = EXCLUDED.daily_post_limit;
        
        v_membership_type := 'free';
        v_daily_limit := 10;
    END IF;
    
    -- 今日の投稿数を取得
    SELECT COALESCE(dpc.post_count, 0), COALESCE(dpc.limit_removed_count, 0)
    INTO v_current_count, v_limit_removed_count
    FROM daily_post_counts dpc
    WHERE dpc.user_id = p_user_id AND dpc.post_date = p_post_date;
    
    -- 投稿数が記録されていない場合は0とする
    IF v_current_count IS NULL THEN
        v_current_count := 0;
        v_limit_removed_count := 0;
    END IF;
    
    -- 制限解除回数分を追加
    v_daily_limit := v_daily_limit + v_limit_removed_count;
    
    -- 結果を返す
    RETURN QUERY SELECT
        v_current_count < v_daily_limit AS can_post,
        v_current_count,
        v_daily_limit,
        GREATEST(0, v_daily_limit - v_current_count) AS remaining_posts,
        v_membership_type;
END;
$$ LANGUAGE plpgsql;

-- 5. 投稿数増加関数
CREATE OR REPLACE FUNCTION increment_user_post_count(p_user_id TEXT, p_post_date DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN AS $$
DECLARE
    v_can_post BOOLEAN;
BEGIN
    -- 投稿可能かチェック
    SELECT can_post INTO v_can_post
    FROM check_user_post_limit(p_user_id, p_post_date);
    
    -- 投稿可能な場合のみ投稿数を増加
    IF v_can_post THEN
        INSERT INTO daily_post_counts (user_id, post_date, post_count)
        VALUES (p_user_id, p_post_date, 1)
        ON CONFLICT (user_id, post_date)
        DO UPDATE SET 
            post_count = daily_post_counts.post_count + 1,
            updated_at = NOW();
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 6. 投稿制限解除関数（ポイント消費）
CREATE OR REPLACE FUNCTION remove_post_limit_with_points(p_user_id TEXT, p_points_cost INTEGER DEFAULT 30)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    new_post_count INTEGER,
    new_limit INTEGER
) AS $$
DECLARE
    v_current_points INTEGER;
    v_current_date DATE := CURRENT_DATE;
    v_current_count INTEGER;
    v_limit_removed_count INTEGER;
    v_daily_limit INTEGER;
BEGIN
    -- ユーザーの現在のポイントを取得
    SELECT COALESCE(total_points, 0) INTO v_current_points
    FROM user_points
    WHERE user_id = p_user_id::UUID;
    
    -- ポイントが不足している場合
    IF v_current_points < p_points_cost THEN
        RETURN QUERY SELECT FALSE, 'ポイントが不足しています', 0, 0;
        RETURN;
    END IF;
    
    -- 今日の投稿数と制限解除回数を取得
    SELECT COALESCE(dpc.post_count, 0), COALESCE(dpc.limit_removed_count, 0)
    INTO v_current_count, v_limit_removed_count
    FROM daily_post_counts dpc
    WHERE dpc.user_id = p_user_id AND dpc.post_date = v_current_date;
    
    -- 基本制限を取得
    SELECT daily_post_limit INTO v_daily_limit
    FROM user_memberships
    WHERE user_id = p_user_id;
    
    -- 制限解除回数が上限（5回）に達している場合
    IF v_limit_removed_count >= 5 THEN
        RETURN QUERY SELECT FALSE, '1日の制限解除回数の上限に達しています', v_current_count, v_daily_limit + v_limit_removed_count;
        RETURN;
    END IF;
    
    -- ポイントを消費
    UPDATE user_points
    SET total_points = total_points - p_points_cost,
        updated_at = NOW()
    WHERE user_id = p_user_id::UUID;
    
    -- 制限解除回数を増加
    INSERT INTO daily_post_counts (user_id, post_date, post_count, limit_removed_count)
    VALUES (p_user_id, v_current_date, COALESCE(v_current_count, 0), v_limit_removed_count + 1)
    ON CONFLICT (user_id, post_date)
    DO UPDATE SET 
        limit_removed_count = daily_post_counts.limit_removed_count + 1,
        updated_at = NOW();
    
    -- 制限解除履歴を記録
    INSERT INTO post_limit_removals (user_id, removal_date, points_cost, post_limit_increased_by)
    VALUES (p_user_id, v_current_date, p_points_cost, 1);
    
    -- ポイント履歴を記録
    INSERT INTO point_transactions (user_id, points, transaction_type, created_at)
    VALUES (p_user_id::UUID, -p_points_cost, 'daily_limit_remove', NOW());
    
    RETURN QUERY SELECT TRUE, '制限解除が完了しました', v_current_count, v_daily_limit + v_limit_removed_count + 1;
END;
$$ LANGUAGE plpgsql;

-- 7. 会員グレード別制限設定関数
CREATE OR REPLACE FUNCTION update_membership_limits()
RETURNS VOID AS $$
BEGIN
    -- 既存の会員グレード設定を更新
    UPDATE user_memberships 
    SET daily_post_limit = CASE 
        WHEN membership_type = 'free' THEN 10
        WHEN membership_type = 'standard' THEN 5
        WHEN membership_type = 'platinum' THEN 15
        WHEN membership_type = 'diamond' THEN 999999
        ELSE 10
    END,
    priority_tickets = CASE 
        WHEN membership_type = 'free' THEN 0
        WHEN membership_type = 'standard' THEN 3
        WHEN membership_type = 'platinum' THEN 10
        WHEN membership_type = 'diamond' THEN 30
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql;

-- 8. 毎日のリセット関数（cron jobで実行）
CREATE OR REPLACE FUNCTION reset_daily_post_counts()
RETURNS VOID AS $$
BEGIN
    -- 過去30日以前のデータを削除（容量節約）
    DELETE FROM daily_post_counts 
    WHERE post_date < CURRENT_DATE - INTERVAL '30 days';
    
    -- 今日のデータは自動的に0から始まるので特別な処理は不要
END;
$$ LANGUAGE plpgsql;

-- 会員グレード別制限を適用
SELECT update_membership_limits();

-- ✅ セットアップ完了
-- 次のステップ:
-- 1. ブラウザで http://localhost:5173/test-post-limits にアクセス
-- 2. ログイン後、テスト機能を実行
-- 3. 投稿制限機能の動作を確認