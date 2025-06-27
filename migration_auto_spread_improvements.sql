-- 自動拡散機能の改善マイグレーション
-- 既存のトリガー関数を更新し、Edge Function用の改善を追加

-- 投票トリガー関数は既に migration_add_user_points_final.sql で更新済み
-- このマイグレーションは既存機能の改善と追加設定用

-- 自動拡散チェック用インデックスの追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_votes_post_id_count ON votes(post_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_auto_spread ON point_transactions(transaction_type, reference_id) WHERE transaction_type = 'auto_spread';

-- 自動拡散達成のログ用ビュー（統計表示用）
CREATE OR REPLACE VIEW auto_spread_achievements AS
SELECT 
    pt.user_id,
    pt.reference_id as post_id,
    pt.points,
    pt.description,
    pt.created_at,
    p.title as post_title,
    p.user_id as post_author_id
FROM point_transactions pt
JOIN posts p ON pt.reference_id = p.id
WHERE pt.transaction_type = 'auto_spread'
ORDER BY pt.created_at DESC;

-- 自動拡散統計情報を取得する関数
CREATE OR REPLACE FUNCTION get_auto_spread_stats()
RETURNS TABLE (
    total_auto_spreads bigint,
    total_points_awarded numeric,
    posts_with_100_plus_votes bigint,
    auto_spread_rate numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(pt.id) as total_auto_spreads,
        COALESCE(SUM(pt.points), 0) as total_points_awarded,
        (SELECT COUNT(DISTINCT p.id) 
         FROM posts p 
         LEFT JOIN votes v ON p.id = v.post_id 
         GROUP BY p.id 
         HAVING COUNT(v.id) >= 100) as posts_with_100_plus_votes,
        CASE 
            WHEN (SELECT COUNT(DISTINCT p.id) 
                  FROM posts p 
                  LEFT JOIN votes v ON p.id = v.post_id 
                  GROUP BY p.id 
                  HAVING COUNT(v.id) >= 100) > 0
            THEN ROUND(
                (COUNT(pt.id)::numeric / 
                 (SELECT COUNT(DISTINCT p.id) 
                  FROM posts p 
                  LEFT JOIN votes v ON p.id = v.post_id 
                  GROUP BY p.id 
                  HAVING COUNT(v.id) >= 100)::numeric) * 100, 2
            )
            ELSE 0
        END as auto_spread_rate
    FROM point_transactions pt
    WHERE pt.transaction_type = 'auto_spread';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 特定の投稿の自動拡散状況をチェックする関数
CREATE OR REPLACE FUNCTION check_post_auto_spread_status(p_post_id bigint)
RETURNS TABLE (
    post_id bigint,
    current_vote_count bigint,
    has_auto_spread_reward boolean,
    eligible_for_auto_spread boolean,
    vote_count_needed_for_auto_spread integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_post_id as post_id,
        COALESCE(vote_count.count, 0) as current_vote_count,
        COALESCE(reward_status.has_reward, false) as has_auto_spread_reward,
        (COALESCE(vote_count.count, 0) >= 100 AND NOT COALESCE(reward_status.has_reward, false)) as eligible_for_auto_spread,
        GREATEST(0, 100 - COALESCE(vote_count.count, 0)::integer) as vote_count_needed_for_auto_spread
    FROM (
        SELECT COUNT(*) as count
        FROM votes 
        WHERE post_id = p_post_id
    ) vote_count
    CROSS JOIN (
        SELECT EXISTS(
            SELECT 1 
            FROM point_transactions pt
            WHERE pt.transaction_type = 'auto_spread' 
            AND pt.reference_id = p_post_id
        ) as has_reward
    ) reward_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Edge Function用のヘルスチェック関数
CREATE OR REPLACE FUNCTION auto_spread_health_check()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'status', 'healthy',
        'timestamp', now(),
        'function_exists', EXISTS(
            SELECT 1 FROM pg_proc 
            WHERE proname = 'check_and_reward_auto_spread'
        ),
        'trigger_exists', EXISTS(
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'trigger_vote_points'
        ),
        'tables_exist', json_build_object(
            'point_transactions', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'point_transactions'),
            'votes', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'votes'),
            'posts', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'posts')
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS ポリシーの確認と設定
-- 自動拡散ビューは全ユーザーが読み取り可能にする
GRANT SELECT ON auto_spread_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION get_auto_spread_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION check_post_auto_spread_status(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_spread_health_check() TO authenticated;