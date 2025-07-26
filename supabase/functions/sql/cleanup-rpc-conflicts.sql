-- RPC関数の競合を完全に解決するスクリプト
-- すべてのバリエーションを削除してから再作成

-- 1. 全バリエーションの削除
DROP FUNCTION IF EXISTS get_post_by_id(INTEGER);
DROP FUNCTION IF EXISTS get_post_by_id(BIGINT);

DROP FUNCTION IF EXISTS get_user_vote_for_post(INTEGER, UUID);
DROP FUNCTION IF EXISTS get_user_vote_for_post(INTEGER, TEXT);
DROP FUNCTION IF EXISTS get_user_vote_for_post(BIGINT, UUID);
DROP FUNCTION IF EXISTS get_user_vote_for_post(BIGINT, TEXT);

DROP FUNCTION IF EXISTS get_comment_by_id(INTEGER);
DROP FUNCTION IF EXISTS get_comment_by_id(BIGINT);

DROP FUNCTION IF EXISTS create_persuasion_comment_safe(INTEGER, TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS create_persuasion_comment_safe(INTEGER, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_persuasion_comment_safe(BIGINT, TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS create_persuasion_comment_safe(BIGINT, TEXT, TEXT, TEXT);

-- 少し待機
SELECT pg_sleep(1);

-- 2. 完全にクリーンな状態で新しい関数を作成

-- 投稿取得関数
CREATE FUNCTION get_post_by_id(
    p_post_id INTEGER
)
RETURNS TABLE(
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
    target_vote_choice INTEGER
) AS $$
BEGIN
    IF p_post_id IS NULL OR p_post_id <= 0 THEN
        RETURN;
    END IF;

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
        p.target_vote_choice
    FROM posts p
    WHERE p.id = p_post_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザー投票取得関数
CREATE FUNCTION get_user_vote_for_post(
    p_post_id INTEGER,
    p_user_id TEXT
)
RETURNS TABLE(
    vote_type INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    IF p_post_id IS NULL OR p_post_id <= 0 THEN
        RETURN;
    END IF;
    
    IF p_user_id IS NULL OR TRIM(p_user_id) = '' THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        v.vote_type,
        v.created_at
    FROM votes v
    WHERE v.post_id = p_post_id 
        AND v.user_id = p_user_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- コメント取得関数
CREATE FUNCTION get_comment_by_id(
    p_comment_id INTEGER
)
RETURNS TABLE(
    id BIGINT,
    post_id BIGINT,
    user_id TEXT,
    content TEXT,
    created_at TIMESTAMPTZ,
    author TEXT,
    is_persuasion_comment BOOLEAN
) AS $$
BEGIN
    IF p_comment_id IS NULL OR p_comment_id <= 0 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.created_at,
        c.author,
        COALESCE(c.is_persuasion_comment, false) as is_persuasion_comment
    FROM comments c
    WHERE c.id = p_comment_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 説得コメント作成関数
CREATE FUNCTION create_persuasion_comment_safe(
    p_post_id INTEGER,
    p_content TEXT,
    p_user_id TEXT,
    p_author TEXT
)
RETURNS TABLE(
    id BIGINT,
    post_id BIGINT,
    user_id TEXT,
    content TEXT,
    created_at TIMESTAMPTZ,
    author TEXT,
    is_persuasion_comment BOOLEAN
) AS $$
DECLARE
    new_comment_id BIGINT;
BEGIN
    -- 入力値検証
    IF p_post_id IS NULL OR p_post_id <= 0 THEN
        RAISE EXCEPTION 'Invalid post_id provided';
    END IF;
    
    IF p_content IS NULL OR TRIM(p_content) = '' THEN
        RAISE EXCEPTION 'Content cannot be empty';
    END IF;
    
    IF p_user_id IS NULL OR TRIM(p_user_id) = '' THEN
        RAISE EXCEPTION 'User ID is required';
    END IF;
    
    IF p_author IS NULL OR TRIM(p_author) = '' THEN
        RAISE EXCEPTION 'Author name is required';
    END IF;

    -- 投稿が存在するかチェック
    IF NOT EXISTS (SELECT 1 FROM posts WHERE id = p_post_id) THEN
        RAISE EXCEPTION 'Post not found';
    END IF;

    -- コメント作成
    INSERT INTO comments (
        post_id,
        content,
        user_id,
        author,
        is_persuasion_comment,
        created_at
    ) VALUES (
        p_post_id,
        TRIM(p_content),
        p_user_id,
        TRIM(p_author),
        true,
        NOW()
    ) RETURNING comments.id INTO new_comment_id;

    -- 作成されたコメントを返す
    RETURN QUERY
    SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.created_at,
        c.author,
        c.is_persuasion_comment
    FROM comments c
    WHERE c.id = new_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 権限の付与
GRANT EXECUTE ON FUNCTION get_post_by_id(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_vote_for_post(INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_comment_by_id(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_persuasion_comment_safe(INTEGER, TEXT, TEXT, TEXT) TO authenticated;

-- 成功メッセージ
SELECT 'RPC function conflicts resolved successfully!' as status;