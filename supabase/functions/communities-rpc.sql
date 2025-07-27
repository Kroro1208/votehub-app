-- コミュニティ関連のRPC関数

-- 複数のコミュニティIDでコミュニティ情報を取得する関数
CREATE OR REPLACE FUNCTION get_communities_by_ids(p_community_ids integer[])
RETURNS SETOF communities
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM communities c
    WHERE c.id = ANY(p_community_ids);
END;
$$;

-- コミュニティ作成関数
CREATE OR REPLACE FUNCTION create_community_secure(
    p_name text,
    p_description text,
    p_icon text
)
RETURNS TABLE (
    id integer,
    name text,
    description text,
    icon text,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_community_id integer;
BEGIN
    -- 認証チェック（ログインユーザーのみコミュニティ作成可能）
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Login required to create community';
    END IF;

    -- 入力値の検証
    IF LENGTH(TRIM(p_name)) = 0 THEN
        RAISE EXCEPTION 'Community name cannot be empty';
    END IF;

    IF LENGTH(TRIM(p_description)) = 0 THEN
        RAISE EXCEPTION 'Community description cannot be empty';
    END IF;

    IF LENGTH(TRIM(p_icon)) = 0 THEN
        RAISE EXCEPTION 'Community icon cannot be empty';
    END IF;

    -- コミュニティを作成
    INSERT INTO communities (
        name,
        description,
        icon,
        created_at
    ) VALUES (
        TRIM(p_name),
        TRIM(p_description),
        TRIM(p_icon),
        NOW()
    ) RETURNING communities.id INTO new_community_id;

    -- 作成されたコミュニティを返す
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.description,
        c.icon,
        c.created_at
    FROM communities c
    WHERE c.id = new_community_id;
END;
$$;

-- 関数の権限設定
GRANT EXECUTE ON FUNCTION get_communities_by_ids(integer[]) TO authenticated;
GRANT EXECUTE ON FUNCTION create_community_secure(text, text, text) TO authenticated;