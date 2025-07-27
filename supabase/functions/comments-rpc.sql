-- コメント関連のRPC関数

-- コメント作成関数
CREATE OR REPLACE FUNCTION create_comment_secure(
    p_post_id integer,
    p_content text,
    p_parent_comment_id integer,
    p_author text,
    p_user_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_comment_id integer;
BEGIN
    -- 認証チェック
    IF auth.uid()::text != p_user_id::text THEN
        RAISE EXCEPTION 'Unauthorized: You can only create comments as yourself';
    END IF;

    -- 入力値の検証
    IF LENGTH(TRIM(p_content)) = 0 THEN
        RAISE EXCEPTION 'Comment content cannot be empty';
    END IF;

    IF LENGTH(TRIM(p_author)) = 0 THEN
        RAISE EXCEPTION 'Author name cannot be empty';
    END IF;

    -- コメントを作成
    INSERT INTO comments (
        post_id,
        content,
        parent_comment_id,
        author,
        user_id,
        created_at
    ) VALUES (
        p_post_id,
        TRIM(p_content),
        p_parent_comment_id,
        TRIM(p_author),
        p_user_id::UUID,
        NOW()
    ) RETURNING id INTO new_comment_id;

    RETURN jsonb_build_object(
        'id', new_comment_id,
        'success', true
    );
END;
$$;

-- 投稿のコメント取得関数
CREATE OR REPLACE FUNCTION get_comments_for_post(p_post_id integer)
RETURNS SETOF comments
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM comments c
    WHERE c.post_id = p_post_id
    ORDER BY c.created_at ASC;
END;
$$;

-- 関数の権限設定
GRANT EXECUTE ON FUNCTION create_comment_secure(integer, text, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_comments_for_post(integer) TO authenticated;