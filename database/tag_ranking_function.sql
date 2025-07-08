-- タグランキング取得用のSupabase関数
CREATE OR REPLACE FUNCTION get_tag_ranking(ranking_limit INTEGER DEFAULT 5)
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    post_count BIGINT,
    vote_count BIGINT,
    popularity_score BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        COALESCE(COUNT(DISTINCT p.id), 0) as post_count,
        COALESCE(COUNT(v.id), 0) as vote_count,
        (COALESCE(COUNT(DISTINCT p.id), 0) * 2 + COALESCE(COUNT(v.id), 0)) as popularity_score
    FROM tags t
    LEFT JOIN posts p ON t.id = p.tag_id
    LEFT JOIN votes v ON p.id = v.post_id
    GROUP BY t.id, t.name
    HAVING COUNT(DISTINCT p.id) > 0  -- 投稿があるタグのみ
    ORDER BY popularity_score DESC
    LIMIT ranking_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;