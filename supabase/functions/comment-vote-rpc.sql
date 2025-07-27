-- CommentVotes.tsx用のRPC関数

-- 既存の関数を削除
DROP FUNCTION IF EXISTS get_comment_votes(integer);
DROP FUNCTION IF EXISTS handle_comment_vote(integer, text, integer);

-- 1. コメント投票取得関数
CREATE OR REPLACE FUNCTION get_comment_votes(p_comment_id integer)
RETURNS SETOF comment_votes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM comment_votes cv
    WHERE cv.comment_id = p_comment_id;
END;
$$;

-- 2. コメント投票処理関数（削除、更新、挿入を一つの関数で処理）
CREATE OR REPLACE FUNCTION handle_comment_vote(
    p_comment_id integer,
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

    -- 既存の投票を確認
    SELECT * INTO existing_vote
    FROM comment_votes
    WHERE comment_id = p_comment_id AND user_id::text = p_user_id::text;

    -- 既存の投票がある場合
    IF FOUND THEN
        -- 同じ投票値の場合は削除（取り消し）
        IF existing_vote.vote = p_vote_value THEN
            DELETE FROM comment_votes
            WHERE id = existing_vote.id;
            
            action_type := 'deleted';
            result_data := jsonb_build_object(
                'id', existing_vote.id,
                'comment_id', existing_vote.comment_id,
                'user_id', existing_vote.user_id,
                'vote', existing_vote.vote
            );
        ELSE
            -- 異なる投票値の場合は更新
            UPDATE comment_votes
            SET vote = p_vote_value
            WHERE id = existing_vote.id;
            
            action_type := 'updated';
            result_data := jsonb_build_object(
                'id', existing_vote.id,
                'comment_id', p_comment_id,
                'user_id', p_user_id,
                'vote', p_vote_value
            );
        END IF;
    ELSE
        -- 既存の投票がない場合は新規挿入
        INSERT INTO comment_votes (comment_id, user_id, vote)
        VALUES (p_comment_id, p_user_id::UUID, p_vote_value)
        RETURNING id INTO new_vote_id;
        
        action_type := 'inserted';
        result_data := jsonb_build_object(
            'id', new_vote_id,
            'comment_id', p_comment_id,
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
GRANT EXECUTE ON FUNCTION get_comment_votes(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_comment_vote(integer, text, integer) TO authenticated;