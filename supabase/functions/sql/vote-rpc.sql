-- 投票処理用のRPC関数

-- 投票取得関数
CREATE OR REPLACE FUNCTION get_votes_for_post(p_post_id integer)
RETURNS SETOF votes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM votes v
    WHERE v.post_id = p_post_id;
END;
$$;

-- 投票処理関数（挿入・更新・削除を統合）
CREATE OR REPLACE FUNCTION handle_vote_secure(
    p_post_id integer,
    p_user_id text,
    p_vote_value integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_vote record;
    result_data jsonb;
    action_type text;
    new_vote_id integer;
BEGIN
    -- 認証チェック
    IF auth.uid()::text != p_user_id::text THEN
        RAISE EXCEPTION 'Unauthorized: You can only vote as yourself';
    END IF;

    -- 投票値の検証
    IF p_vote_value NOT IN (1, -1) THEN
        RAISE EXCEPTION 'Invalid vote value. Must be 1 or -1';
    END IF;

    -- 既存の投票を確認
    SELECT * INTO existing_vote
    FROM votes
    WHERE post_id = p_post_id AND user_id::text = p_user_id::text;

    -- 既存の投票がない場合は新規挿入
    IF NOT FOUND THEN
        INSERT INTO votes (post_id, user_id, vote)
        VALUES (p_post_id, p_user_id::UUID, p_vote_value)
        RETURNING id INTO new_vote_id;
        
        action_type := 'inserted';
        result_data := jsonb_build_object(
            'id', new_vote_id,
            'post_id', p_post_id,
            'user_id', p_user_id,
            'vote', p_vote_value
        );
    ELSE
        -- 既存の投票がある場合は更新
        UPDATE votes
        SET vote = p_vote_value
        WHERE id = existing_vote.id;
        
        action_type := 'updated';
        result_data := jsonb_build_object(
            'id', existing_vote.id,
            'post_id', p_post_id,
            'user_id', p_user_id,
            'vote', p_vote_value
        );
    END IF;

    RETURN jsonb_build_object(
        'action', action_type,
        'data', result_data
    );
END;
$$;

-- 関数の権限設定
GRANT EXECUTE ON FUNCTION get_votes_for_post(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_vote_secure(integer, text, integer) TO authenticated;