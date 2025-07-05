-- 📊 管理者ダッシュボード用SQL関数
-- ⚠️  このファイルをSupabase SQL Editorで実行してください

-- 1. 日次統計取得関数
CREATE OR REPLACE FUNCTION get_daily_post_limit_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_users INTEGER,
    active_users_today INTEGER,
    total_posts_today INTEGER,
    limit_removals_today INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM user_memberships) as total_users,
        (SELECT COUNT(DISTINCT user_id)::INTEGER FROM daily_post_counts WHERE post_date = p_date) as active_users_today,
        (SELECT COALESCE(SUM(post_count), 0)::INTEGER FROM daily_post_counts WHERE post_date = p_date) as total_posts_today,
        (SELECT COALESCE(SUM(limit_removed_count), 0)::INTEGER FROM daily_post_counts WHERE post_date = p_date) as limit_removals_today;
END;
$$ LANGUAGE plpgsql;

-- 2. ユーザー別投稿統計取得関数
CREATE OR REPLACE FUNCTION get_user_post_statistics(p_user_id TEXT, p_days INTEGER DEFAULT 7)
RETURNS TABLE (
    post_date DATE,
    post_count INTEGER,
    limit_removed_count INTEGER,
    daily_limit INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dpc.post_date,
        COALESCE(dpc.post_count, 0)::INTEGER,
        COALESCE(dpc.limit_removed_count, 0)::INTEGER,
        COALESCE(um.daily_post_limit, 3)::INTEGER
    FROM generate_series(
        CURRENT_DATE - INTERVAL '1 day' * (p_days - 1),
        CURRENT_DATE,
        INTERVAL '1 day'
    ) as series_date(post_date)
    LEFT JOIN daily_post_counts dpc ON dpc.post_date = post_date AND dpc.user_id = p_user_id
    LEFT JOIN user_memberships um ON um.user_id = p_user_id
    ORDER BY post_date DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. 会員タイプ別統計取得関数
CREATE OR REPLACE FUNCTION get_membership_type_stats()
RETURNS TABLE (
    membership_type TEXT,
    user_count INTEGER,
    avg_daily_posts NUMERIC,
    total_limit_removals INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        um.membership_type,
        COUNT(um.user_id)::INTEGER as user_count,
        COALESCE(AVG(dpc.post_count), 0) as avg_daily_posts,
        COALESCE(SUM(dpc.limit_removed_count), 0)::INTEGER as total_limit_removals
    FROM user_memberships um
    LEFT JOIN daily_post_counts dpc ON dpc.user_id = um.user_id AND dpc.post_date = CURRENT_DATE
    GROUP BY um.membership_type
    ORDER BY 
        CASE um.membership_type 
            WHEN 'diamond' THEN 1
            WHEN 'platinum' THEN 2
            WHEN 'standard' THEN 3
            WHEN 'free' THEN 4
            ELSE 5
        END;
END;
$$ LANGUAGE plpgsql;

-- 4. 投稿制限違反者取得関数
CREATE OR REPLACE FUNCTION get_limit_violators(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    user_id TEXT,
    membership_type TEXT,
    daily_limit INTEGER,
    actual_posts INTEGER,
    excess_posts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dpc.user_id,
        um.membership_type,
        um.daily_post_limit + COALESCE(dpc.limit_removed_count, 0) as daily_limit,
        dpc.post_count as actual_posts,
        dpc.post_count - (um.daily_post_limit + COALESCE(dpc.limit_removed_count, 0)) as excess_posts
    FROM daily_post_counts dpc
    JOIN user_memberships um ON um.user_id = dpc.user_id
    WHERE dpc.post_date = p_date
    AND dpc.post_count > (um.daily_post_limit + COALESCE(dpc.limit_removed_count, 0))
    ORDER BY excess_posts DESC;
END;
$$ LANGUAGE plpgsql;

-- 5. 月次レポート生成関数
CREATE OR REPLACE FUNCTION generate_monthly_report(p_year INTEGER, p_month INTEGER)
RETURNS TABLE (
    report_date DATE,
    total_posts INTEGER,
    unique_users INTEGER,
    limit_removals INTEGER,
    revenue_from_removals NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dpc.post_date as report_date,
        SUM(dpc.post_count)::INTEGER as total_posts,
        COUNT(DISTINCT dpc.user_id)::INTEGER as unique_users,
        SUM(dpc.limit_removed_count)::INTEGER as limit_removals,
        (SUM(dpc.limit_removed_count) * 30)::NUMERIC as revenue_from_removals
    FROM daily_post_counts dpc
    WHERE EXTRACT(YEAR FROM dpc.post_date) = p_year
    AND EXTRACT(MONTH FROM dpc.post_date) = p_month
    GROUP BY dpc.post_date
    ORDER BY dpc.post_date;
END;
$$ LANGUAGE plpgsql;

-- ✅ 管理者用関数設定完了
-- 次のステップ:
-- 1. フロントエンドで管理者ダッシュボードを実装
-- 2. 管理者権限の適切な設定
-- 3. セキュリティテストの実施