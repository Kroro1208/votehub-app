-- すべての関連関数を削除
DROP FUNCTION IF EXISTS get_user_empathy_points(UUID);
DROP FUNCTION IF EXISTS get_user_empathy_points(TEXT);
DROP FUNCTION IF EXISTS initialize_user_empathy_points(UUID);
DROP FUNCTION IF EXISTS initialize_user_empathy_points(TEXT);
DROP FUNCTION IF EXISTS get_empathy_rankings(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_empathy_rankings(TEXT, INTEGER);

-- ユーザーの共感ポイント取得関数
CREATE OR REPLACE FUNCTION get_user_empathy_points(target_user_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_points_val INTEGER := 0;
    empathy_points_val INTEGER := 0;
    user_rank_val INTEGER := NULL;
BEGIN
    -- 総ポイントを取得（UUID型で比較）
    SELECT COALESCE(up.total_points, 0)
    INTO total_points_val
    FROM user_points up
    WHERE up.user_id = target_user_id;

    -- 共感ポイントを取得（UUID型で比較）
    SELECT COALESCE(es.total_empathy_points, 0)
    INTO empathy_points_val
    FROM empathy_scores es
    WHERE es.user_id = target_user_id;

    -- ランキングを取得
    WITH ranked_users AS (
        SELECT 
            user_id,
            ROW_NUMBER() OVER (ORDER BY total_empathy_points DESC) as rank_position
        FROM empathy_scores
        WHERE total_empathy_points > 0
    )
    SELECT rank_position::INTEGER
    INTO user_rank_val
    FROM ranked_users
    WHERE user_id = target_user_id;

    -- JSON形式で結果を返す
    RETURN json_build_object(
        'total_points', total_points_val,
        'empathy_points', empathy_points_val,
        'empathy_rank', user_rank_val
    );
END;
$$;

-- ユーザーの共感データ初期化関数
CREATE OR REPLACE FUNCTION initialize_user_empathy_points(input_user_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- user_pointsテーブルに初期データを挿入（存在しない場合のみ）
    INSERT INTO user_points (user_id, total_points, created_at, updated_at)
    VALUES (input_user_id, 0, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;

    -- empathy_scoresテーブルに初期データを挿入（存在しない場合のみ）
    INSERT INTO empathy_scores (user_id, total_empathy_points, created_at, updated_at)
    VALUES (input_user_id, 0, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- 共感ポイントランキング取得関数
CREATE OR REPLACE FUNCTION get_empathy_rankings(
    p_community_id TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    user_id TEXT,
    total_empathy_points INTEGER,
    rank_position BIGINT,
    username TEXT,
    display_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH ranked_users AS (
        SELECT 
            es.user_id,
            es.total_empathy_points,
            ROW_NUMBER() OVER (ORDER BY es.total_empathy_points DESC) as rank_position
        FROM empathy_scores es
        WHERE es.total_empathy_points > 0
        ORDER BY es.total_empathy_points DESC
        LIMIT p_limit
    )
    SELECT 
        ru.user_id,
        ru.total_empathy_points,
        ru.rank_position,
        p.username,
        p.display_name
    FROM ranked_users ru
    LEFT JOIN profiles p ON ru.user_id = p.id
    ORDER BY ru.rank_position;
END;
$$;

-- 関数の権限設定
GRANT EXECUTE ON FUNCTION get_user_empathy_points(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_user_empathy_points(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_empathy_rankings(TEXT, INTEGER) TO authenticated;