-- RPC functions for getting posts by tag ID

-- 1. Get posts by tag ID with counts
CREATE OR REPLACE FUNCTION get_posts_by_tag(p_tag_id INTEGER)
RETURNS TABLE (
    id BIGINT,
    title TEXT,
    content TEXT,
    created_at TIMESTAMPTZ,
    image_url TEXT,
    avatar_url TEXT,
    vote_deadline TIMESTAMPTZ,
    community_id BIGINT,
    user_id TEXT,
    parent_post_id BIGINT,
    nest_level INTEGER,
    target_vote_choice INTEGER,
    post_tags INTEGER[],
    vote_count BIGINT,
    comment_count BIGINT,
    community_name TEXT
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
        p.nest_level,
        p.target_vote_choice,
        COALESCE(p.post_tags, '{}') as post_tags,
        COALESCE(v.vote_count, 0) as vote_count,
        COALESCE(c.comment_count, 0) as comment_count,
        COALESCE(cm.name, '') as community_name
    FROM posts p
    LEFT JOIN communities cm ON p.community_id = cm.id
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
    WHERE 
        -- Check tag_id column first (primary storage), then fall back to post_tags array
        p.tag_id = p_tag_id
        OR (
            EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'posts' AND column_name = 'post_tags'
            ) 
            AND p.post_tags IS NOT NULL 
            AND p_tag_id = ANY(p.post_tags)
        )
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get tag info by ID
CREATE OR REPLACE FUNCTION get_tag_info(p_tag_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    name TEXT,
    community_id BIGINT,
    created_at TIMESTAMPTZ,
    community_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name::TEXT,
        t.community_id::BIGINT,
        t.created_at,
        COALESCE(c.name::TEXT, '') as community_name
    FROM tags t
    LEFT JOIN communities c ON t.community_id = c.id
    WHERE t.id = p_tag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Debug function to check post_tags column and data
CREATE OR REPLACE FUNCTION debug_post_tags()
RETURNS TABLE (
    column_exists BOOLEAN,
    total_posts_count BIGINT,
    posts_with_tags_count BIGINT,
    sample_post_tags TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'posts' AND column_name = 'post_tags'
        ) as column_exists,
        (SELECT COUNT(*) FROM posts) as total_posts_count,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'posts' AND column_name = 'post_tags'
            ) THEN (
                SELECT COUNT(*) FROM posts 
                WHERE post_tags IS NOT NULL AND array_length(post_tags, 1) > 0
            )
            ELSE 0
        END as posts_with_tags_count,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'posts' AND column_name = 'post_tags'
            ) THEN (
                SELECT COALESCE(array_to_string(post_tags, ','), 'no tags') 
                FROM posts 
                WHERE post_tags IS NOT NULL AND array_length(post_tags, 1) > 0 
                LIMIT 1
            )
            ELSE 'column not found'
        END as sample_post_tags;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_posts_by_tag(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tag_info(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION debug_post_tags() TO authenticated;

-- Success message
SELECT 'Tag-related RPC functions created successfully!' as status;