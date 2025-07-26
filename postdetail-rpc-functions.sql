-- PostDetail.tsx 用のセキュアなRPC関数
-- セキュリティ脆弱性修正のための追加RPC関数群

-- 既存関数の削除（競合回避）
DROP FUNCTION IF EXISTS get_post_by_id(INTEGER);
DROP FUNCTION IF EXISTS get_user_vote_for_post(INTEGER, TEXT);
DROP FUNCTION IF EXISTS get_comment_by_id(INTEGER);
DROP FUNCTION IF EXISTS create_persuasion_comment_safe(INTEGER, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_persuasion_comment_safe(INTEGER, TEXT, UUID, TEXT);

-- 1. 投稿を安全に取得する関数
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
    -- 入力値検証
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

-- 2. ユーザーの投票状況を安全に取得する関数
CREATE FUNCTION get_user_vote_for_post(
    p_post_id INTEGER,
    p_user_id TEXT
)
RETURNS TABLE(
    vote_type INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    -- 入力値検証
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

-- 3. コメントを安全に取得する関数
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
    -- 入力値検証
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

-- 4. 説得コメントを安全に作成する関数
CREATE FUNCTION create_persuasion_comment_safe(
    p_post_id INTEGER,
    p_content TEXT,
    p_user_id TEXT,
    p_author TEXT
)
RETURNS TABLE(
    comment_id BIGINT,
    comment_post_id BIGINT,
    comment_user_id TEXT,
    comment_content TEXT,
    comment_created_at TIMESTAMPTZ,
    comment_author TEXT,
    comment_is_persuasion BOOLEAN
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
    
    IF p_user_id IS NULL THEN
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
    ) RETURNING id INTO new_comment_id;

    -- 作成されたコメントを返す
    RETURN QUERY
    SELECT 
        c.id as comment_id,
        c.post_id as comment_post_id,
        c.user_id as comment_user_id,
        c.content as comment_content,
        c.created_at as comment_created_at,
        c.author as comment_author,
        c.is_persuasion_comment as comment_is_persuasion
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
SELECT 'PostDetail RPC functions created successfully!' as status;