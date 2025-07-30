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

-- 既存の関数を削除
DROP FUNCTION IF EXISTS create_community_secure(text, text, text);

-- コミュニティ作成関数（修正版）
CREATE OR REPLACE FUNCTION create_community_secure(
    p_name text,
    p_description text,
    p_icon text
)
RETURNS TABLE (
    id bigint,
    name text,
    description text,
    icon text,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_community_id bigint;
BEGIN
    -- 認証チェック（ログインユーザーのみコミュニティ作成可能）
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'ログインが必要です';
    END IF;

    -- 入力値の検証
    IF LENGTH(TRIM(p_name)) = 0 THEN
        RAISE EXCEPTION 'スペース名を入力してください';
    END IF;

    IF LENGTH(TRIM(p_description)) = 0 THEN
        RAISE EXCEPTION 'スペースの説明を入力してください';
    END IF;

    IF LENGTH(TRIM(p_icon)) = 0 THEN
        RAISE EXCEPTION 'アイコンを選択してください';
    END IF;

    -- 名前の重複チェック
    IF EXISTS (SELECT 1 FROM communities c WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(p_name))) THEN
        RAISE EXCEPTION 'このスペース名は既に使用されています';
    END IF;

    -- コミュニティを作成
    BEGIN
        INSERT INTO communities (
            name,
            description,
            icon,
            created_at,
            updated_at
        ) VALUES (
            TRIM(p_name),
            TRIM(p_description),
            TRIM(p_icon),
            NOW(),
            NOW()
        ) RETURNING communities.id INTO new_community_id;
    EXCEPTION
        WHEN unique_violation THEN
            RAISE EXCEPTION 'このスペース名は既に使用されています';
        WHEN OTHERS THEN
            RAISE EXCEPTION 'スペース作成中にエラーが発生しました: %', SQLERRM;
    END;

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