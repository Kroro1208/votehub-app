-- Tag Search RPC Functions
-- 安全なタグ検索のためのRPC関数群

-- 1. 安全なタグ検索関数
CREATE OR REPLACE FUNCTION search_tags_safe(
    p_search_term TEXT DEFAULT NULL,
    p_community_id INTEGER DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'created_at',
    p_sort_order TEXT DEFAULT 'desc',
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id INTEGER,
    name TEXT,
    community_id INTEGER,
    created_at TIMESTAMPTZ,
    community_name TEXT,
    post_count BIGINT
) AS $$
DECLARE
    search_pattern TEXT;
BEGIN
    -- 入力値のサニタイゼーション
    IF p_search_term IS NOT NULL THEN
        -- 危険な文字をエスケープして検索パターンを作成
        search_pattern := '%' || REPLACE(REPLACE(REPLACE(
            TRIM(p_search_term), 
            '%', '\%'), 
            '_', '\_'), 
            '\', '\\') || '%';
    END IF;
    
    -- バリデーション
    IF p_limit > 100 THEN
        p_limit := 100; -- 最大100件に制限
    END IF;
    
    IF p_limit < 1 THEN
        p_limit := 20; -- デフォルト値
    END IF;
    
    IF p_offset < 0 THEN
        p_offset := 0;
    END IF;
    
    -- 安全なクエリ実行
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.community_id,
        t.created_at,
        c.name as community_name,
        COALESCE(post_stats.post_count, 0) as post_count
    FROM tags t
    LEFT JOIN communities c ON t.community_id = c.id
    LEFT JOIN (
        SELECT 
            unnest(post_tags) as tag_id,
            COUNT(*) as post_count
        FROM posts 
        WHERE post_tags IS NOT NULL 
        GROUP BY unnest(post_tags)
    ) post_stats ON t.id = post_stats.tag_id
    WHERE 
        (p_search_term IS NULL OR t.name ILIKE search_pattern)
        AND (p_community_id IS NULL OR t.community_id = p_community_id)
    ORDER BY 
        CASE 
            WHEN p_sort_by = 'name' AND p_sort_order = 'asc' THEN t.name
            WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN t.name
            ELSE NULL
        END ASC,
        CASE 
            WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN t.name
            ELSE NULL
        END DESC,
        CASE 
            WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN t.created_at
            WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN t.created_at
            ELSE NULL
        END ASC,
        CASE 
            WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN t.created_at
            ELSE NULL
        END DESC,
        CASE 
            WHEN p_sort_by = 'post_count' AND p_sort_order = 'asc' THEN post_stats.post_count
            WHEN p_sort_by = 'post_count' AND p_sort_order = 'desc' THEN post_stats.post_count
            ELSE NULL
        END ASC,
        CASE 
            WHEN p_sort_by = 'post_count' AND p_sort_order = 'desc' THEN post_stats.post_count
            ELSE NULL
        END DESC,
        t.id -- フォールバック
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. タグの詳細統計を取得する関数
CREATE OR REPLACE FUNCTION get_tag_stats_with_posts(
    p_tag_ids INTEGER[]
)
RETURNS TABLE(
    tag_id INTEGER,
    tag_name TEXT,
    community_id INTEGER,
    post_count BIGINT,
    total_votes BIGINT,
    avg_votes_per_post NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as tag_id,
        t.name as tag_name,
        t.community_id,
        COALESCE(COUNT(p.id), 0) as post_count,
        COALESCE(SUM(vote_stats.vote_count), 0) as total_votes,
        CASE 
            WHEN COUNT(p.id) > 0 THEN 
                ROUND(COALESCE(SUM(vote_stats.vote_count), 0)::NUMERIC / COUNT(p.id), 2)
            ELSE 0
        END as avg_votes_per_post
    FROM tags t
    LEFT JOIN posts p ON t.id = ANY(p.post_tags)
    LEFT JOIN (
        SELECT 
            post_id,
            COUNT(*) as vote_count
        FROM votes 
        GROUP BY post_id
    ) vote_stats ON p.id = vote_stats.post_id
    WHERE t.id = ANY(p_tag_ids)
    GROUP BY t.id, t.name, t.community_id
    ORDER BY t.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. コミュニティ別タグ一覧取得関数
CREATE OR REPLACE FUNCTION get_community_tags_with_stats(
    p_community_id INTEGER
)
RETURNS TABLE(
    id INTEGER,
    name TEXT,
    created_at TIMESTAMPTZ,
    post_count BIGINT,
    total_votes BIGINT,
    popularity_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.created_at,
        COALESCE(COUNT(p.id), 0) as post_count,
        COALESCE(SUM(vote_stats.vote_count), 0) as total_votes,
        -- 人気度スコア = (投稿数 * 2) + (投票数 / 10)
        ROUND(
            (COALESCE(COUNT(p.id), 0) * 2.0 + 
             COALESCE(SUM(vote_stats.vote_count), 0) / 10.0), 2
        ) as popularity_score
    FROM tags t
    LEFT JOIN posts p ON t.id = ANY(p.post_tags) AND p.community_id = p_community_id
    LEFT JOIN (
        SELECT 
            post_id,
            COUNT(*) as vote_count
        FROM votes 
        GROUP BY post_id
    ) vote_stats ON p.id = vote_stats.post_id
    WHERE t.community_id = p_community_id
    GROUP BY t.id, t.name, t.created_at
    ORDER BY popularity_score DESC, t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 人気タグランキング取得関数
CREATE OR REPLACE FUNCTION get_popular_tags_ranking(
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    id INTEGER,
    name TEXT,
    community_id INTEGER,
    community_name TEXT,
    post_count BIGINT,
    total_votes BIGINT,
    popularity_score NUMERIC,
    rank_position BIGINT
) AS $$
BEGIN
    -- 最大100件に制限
    IF p_limit > 100 THEN
        p_limit := 100;
    END IF;
    
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.community_id,
        c.name as community_name,
        COALESCE(COUNT(p.id), 0) as post_count,
        COALESCE(SUM(vote_stats.vote_count), 0) as total_votes,
        ROUND(
            (COALESCE(COUNT(p.id), 0) * 2.0 + 
             COALESCE(SUM(vote_stats.vote_count), 0) / 10.0), 2
        ) as popularity_score,
        ROW_NUMBER() OVER (
            ORDER BY 
                COALESCE(COUNT(p.id), 0) * 2.0 + 
                COALESCE(SUM(vote_stats.vote_count), 0) / 10.0 DESC,
                t.created_at DESC
        ) as rank_position
    FROM tags t
    LEFT JOIN communities c ON t.community_id = c.id
    LEFT JOIN posts p ON t.id = ANY(p.post_tags)
    LEFT JOIN (
        SELECT 
            post_id,
            COUNT(*) as vote_count
        FROM votes 
        GROUP BY post_id
    ) vote_stats ON p.id = vote_stats.post_id
    GROUP BY t.id, t.name, t.community_id, c.name, t.created_at
    HAVING COALESCE(COUNT(p.id), 0) > 0  -- 投稿があるタグのみ
    ORDER BY popularity_score DESC, t.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 権限の付与
GRANT EXECUTE ON FUNCTION search_tags_safe(TEXT, INTEGER, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tag_stats_with_posts(INTEGER[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_community_tags_with_stats(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_tags_ranking(INTEGER) TO authenticated;

-- 成功メッセージ
SELECT 'Tag search RPC functions created successfully!' as status;