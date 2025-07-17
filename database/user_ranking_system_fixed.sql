-- 修正版: ユーザー総合ランキングシステム
-- 品質度スコア + 共感ポイントの総合評価

-- 1. 既存の関数を削除
DROP FUNCTION IF EXISTS get_user_total_ranking();

-- 2. 新しいランキング関数を作成
CREATE OR REPLACE FUNCTION get_user_total_ranking()
RETURNS TABLE (
    user_id text,
    total_score numeric,
    quality_score numeric,
    empathy_points numeric,
    rank bigint,
    quality_rank text,
    empathy_rank text,
    badge_icon text,
    user_metadata jsonb
) AS $$
BEGIN
    RETURN QUERY
    WITH user_scores AS (
        -- 品質度スコアの平均を取得
        SELECT 
            uqs.user_id,
            COALESCE(AVG(uqs.total_quality_score), 0) as avg_quality_score
        FROM user_quality_scores uqs
        GROUP BY uqs.user_id
    ),
    user_empathy AS (
        -- 共感ポイントを取得
        SELECT 
            uep.user_id,
            COALESCE(uep.total_empathy_points, 0) as empathy_points,
            COALESCE(uep.empathy_rank, 'new') as empathy_rank,
            COALESCE(uep.badge_icon, '👶') as badge_icon
        FROM user_empathy_points uep
    ),
    combined_scores AS (
        -- 品質度スコアと共感ポイントを結合
        SELECT 
            COALESCE(us.user_id, ue.user_id) as user_id,
            COALESCE(us.avg_quality_score, 0) as quality_score,
            COALESCE(ue.empathy_points, 0) as empathy_points,
            COALESCE(us.avg_quality_score, 0) + COALESCE(ue.empathy_points, 0) as total_score,
            COALESCE(ue.empathy_rank, 'new') as empathy_rank,
            COALESCE(ue.badge_icon, '👶') as badge_icon
        FROM user_scores us
        FULL OUTER JOIN user_empathy ue ON us.user_id = ue.user_id
        WHERE COALESCE(us.avg_quality_score, 0) + COALESCE(ue.empathy_points, 0) > 0
    ),
    ranked_users AS (
        -- ランキングを計算
        SELECT 
            cs.*,
            ROW_NUMBER() OVER (ORDER BY cs.total_score DESC) as rank
        FROM combined_scores cs
    ),
    quality_ranks AS (
        -- 品質度ランクを取得
        SELECT 
            avg_scores.user_id,
            CASE 
                WHEN avg_scores.avg_quality_score >= 90 THEN 'S'
                WHEN avg_scores.avg_quality_score >= 80 THEN 'A'
                WHEN avg_scores.avg_quality_score >= 70 THEN 'B'
                WHEN avg_scores.avg_quality_score >= 60 THEN 'C'
                WHEN avg_scores.avg_quality_score >= 50 THEN 'D'
                ELSE 'F'
            END as quality_rank
        FROM (
            SELECT 
                uqs.user_id,
                AVG(uqs.total_quality_score) as avg_quality_score
            FROM user_quality_scores uqs
            GROUP BY uqs.user_id
        ) avg_scores
    )
    SELECT 
        ru.user_id,
        ru.total_score,
        ru.quality_score,
        ru.empathy_points,
        ru.rank,
        COALESCE(qr.quality_rank, 'F') as quality_rank,
        ru.empathy_rank,
        ru.badge_icon,
        '{}'::jsonb as user_metadata
    FROM ranked_users ru
    LEFT JOIN quality_ranks qr ON ru.user_id = qr.user_id
    ORDER BY ru.rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 関数の権限を設定
GRANT EXECUTE ON FUNCTION get_user_total_ranking() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_total_ranking() TO anon;
GRANT EXECUTE ON FUNCTION get_user_total_ranking() TO public;

-- 4. 確認用のテストクエリ
-- SELECT * FROM get_user_total_ranking() LIMIT 10;