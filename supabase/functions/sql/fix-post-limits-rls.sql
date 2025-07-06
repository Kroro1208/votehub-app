-- 🔧 投稿制限機能 RLSポリシー修正
-- 42501エラー（RLS違反）を修正するためのスクリプト

-- 1. 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view own post counts" ON daily_post_counts;
DROP POLICY IF EXISTS "System can manage post counts" ON daily_post_counts;

-- 2. 新しいポリシーを作成（より具体的な権限設定）
-- ユーザーは自分の投稿数のみ参照可能
CREATE POLICY "Users can view own post counts" ON daily_post_counts
    FOR SELECT USING (auth.uid()::text = user_id);

-- ユーザーは自分の投稿数のみ挿入可能
CREATE POLICY "Users can insert own post counts" ON daily_post_counts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- ユーザーは自分の投稿数のみ更新可能
CREATE POLICY "Users can update own post counts" ON daily_post_counts
    FOR UPDATE USING (auth.uid()::text = user_id);

-- 3. 関数実行のためのセキュリティ権限を適用
-- increment_user_post_count関数をSECURITY DEFINERで再作成
CREATE OR REPLACE FUNCTION increment_user_post_count(p_user_id TEXT, p_post_date DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
    v_can_post BOOLEAN;
    v_current_user_id TEXT;
BEGIN
    -- 現在のユーザーIDを取得
    v_current_user_id := auth.uid()::text;
    
    -- セキュリティチェック：呼び出し元が対象ユーザーと同じか確認
    IF v_current_user_id IS NULL OR v_current_user_id != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized access: user can only increment their own post count';
    END IF;
    
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

-- 4. check_user_post_limit関数もSECURITY DEFINERで再作成
CREATE OR REPLACE FUNCTION check_user_post_limit(p_user_id TEXT, p_post_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    can_post BOOLEAN,
    current_count INTEGER,
    daily_limit INTEGER,
    remaining_posts INTEGER,
    membership_type TEXT
)
SECURITY DEFINER
AS $$
DECLARE
    v_membership_type TEXT;
    v_daily_limit INTEGER;
    v_current_count INTEGER;
    v_limit_removed_count INTEGER;
    v_current_user_id TEXT;
BEGIN
    -- 現在のユーザーIDを取得
    v_current_user_id := auth.uid()::text;
    
    -- p_user_idがnullでないことを確認
    IF p_user_id IS NULL OR p_user_id = '' THEN
        RAISE EXCEPTION 'user_id cannot be null or empty';
    END IF;
    
    -- セキュリティチェック：呼び出し元が対象ユーザーと同じか確認
    IF v_current_user_id IS NULL OR v_current_user_id != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized access: user can only check their own post limit';
    END IF;
    
    -- ユーザーの会員情報を取得
    SELECT um.membership_type, um.daily_post_limit
    INTO v_membership_type, v_daily_limit
    FROM user_memberships um
    WHERE um.user_id = p_user_id;
    
    -- 会員情報が存在しない場合は無料会員として作成
    IF v_membership_type IS NULL THEN
        INSERT INTO user_memberships (user_id, membership_type, daily_post_limit)
        VALUES (p_user_id, 'free', 3)
        ON CONFLICT (user_id) DO UPDATE SET 
            membership_type = EXCLUDED.membership_type,
            daily_post_limit = EXCLUDED.daily_post_limit;
        
        v_membership_type := 'free';
        v_daily_limit := 3;
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

-- 5. remove_post_limit_with_points関数もSECURITY DEFINERで再作成
CREATE OR REPLACE FUNCTION remove_post_limit_with_points(p_user_id TEXT, p_points_cost INTEGER DEFAULT 30)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    new_post_count INTEGER,
    new_limit INTEGER
)
SECURITY DEFINER
AS $$
DECLARE
    v_current_points INTEGER;
    v_current_date DATE := CURRENT_DATE;
    v_current_count INTEGER;
    v_limit_removed_count INTEGER;
    v_daily_limit INTEGER;
    v_current_user_id TEXT;
BEGIN
    -- 現在のユーザーIDを取得
    v_current_user_id := auth.uid()::text;
    
    -- セキュリティチェック：呼び出し元が対象ユーザーと同じか確認
    IF v_current_user_id IS NULL OR v_current_user_id != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized access: user can only remove their own post limit';
    END IF;
    
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

-- ✅ 修正完了
-- このスクリプトを実行後、投稿制限エラーが解決されます