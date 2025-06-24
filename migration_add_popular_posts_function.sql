-- 人気投稿を取得する関数（全スペース対象）
-- 人気度スコア: 投票数 + コメント数 * 0.5 + 新規度ボーナス
CREATE OR REPLACE FUNCTION get_popular_posts(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id int8,
    title text,
    content text,
    created_at timestamptz,
    image_url text,
    avatar_url text,
    vote_deadline timestamptz,
    community_id int8,
    user_id text,
    parent_post_id int8,
    nest_level integer,
    target_vote_choice integer,
    vote_count int8,
    comment_count int8,
    popularity_score numeric,
    community_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.content,
        p.created_at,
        p.image_url,
        p.avatar_url,
        p.vote_deadline,
        p.community_id,
        p.user_id,
        p.parent_post_id,
        COALESCE(p.nest_level, 0) as nest_level,
        p.target_vote_choice,
        COALESCE(v.vote_count, 0) as vote_count,
        COALESCE(c.comment_count, 0) as comment_count,
        -- 人気度スコア計算
        (COALESCE(v.vote_count, 0) + COALESCE(c.comment_count, 0) * 0.5) * 
        CASE 
            -- 24時間以内: 1.5倍ボーナス
            WHEN p.created_at > NOW() - INTERVAL '24 hours' THEN 1.5
            -- 48時間以内: 1.2倍ボーナス
            WHEN p.created_at > NOW() - INTERVAL '48 hours' THEN 1.2
            -- それ以外: ボーナスなし
            ELSE 1.0
        END as popularity_score,
        cm.name as community_name
    FROM posts p
    LEFT JOIN (
        SELECT post_id, COUNT(*) as vote_count
        FROM votes
        GROUP BY post_id
    ) v ON p.id = v.post_id
    LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count
        FROM comments
        GROUP BY post_id
    ) c ON p.id = c.post_id
    LEFT JOIN communities cm ON p.community_id = cm.id
    -- メインの投稿のみを対象（ネスト投稿は除外）
    WHERE p.parent_post_id IS NULL
    ORDER BY popularity_score DESC, p.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 人気投稿をコミュニティ情報付きで取得する関数（リアルタイム更新対応）
CREATE OR REPLACE FUNCTION get_popular_posts_with_communities(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id int8,
    title text,
    content text,
    created_at timestamptz,
    image_url text,
    avatar_url text,
    vote_deadline timestamptz,
    community_id int8,
    user_id text,
    parent_post_id int8,
    nest_level integer,
    target_vote_choice integer,
    vote_count int8,
    comment_count int8,
    popularity_score numeric,
    communities jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.content,
        p.created_at,
        p.image_url,
        p.avatar_url,
        p.vote_deadline,
        p.community_id,
        p.user_id,
        p.parent_post_id,
        COALESCE(p.nest_level, 0) as nest_level,
        p.target_vote_choice,
        COALESCE(v.vote_count, 0) as vote_count,
        COALESCE(c.comment_count, 0) as comment_count,
        -- 人気度スコア計算
        (COALESCE(v.vote_count, 0) + COALESCE(c.comment_count, 0) * 0.5) * 
        CASE 
            WHEN p.created_at > NOW() - INTERVAL '24 hours' THEN 1.5
            WHEN p.created_at > NOW() - INTERVAL '48 hours' THEN 1.2
            ELSE 1.0
        END as popularity_score,
        -- コミュニティ情報をJSONBで返す
        jsonb_build_object(
            'id', cm.id,
            'name', cm.name,
            'description', cm.description
        ) as communities
    FROM posts p
    LEFT JOIN (
        SELECT post_id, COUNT(*) as vote_count
        FROM votes
        GROUP BY post_id
    ) v ON p.id = v.post_id
    LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count
        FROM comments
        GROUP BY post_id
    ) c ON p.id = c.post_id
    LEFT JOIN communities cm ON p.community_id = cm.id
    WHERE p.parent_post_id IS NULL
    ORDER BY popularity_score DESC, p.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;