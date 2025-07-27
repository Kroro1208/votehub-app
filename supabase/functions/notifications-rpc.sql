-- 通知関連のRPC関数

-- 単一通知作成関数
CREATE OR REPLACE FUNCTION create_notification_secure(
    p_user_id text,
    p_type text,
    p_title text,
    p_message text,
    p_post_id integer,
    p_nested_post_id integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_notification_id integer;
BEGIN
    -- 入力値の検証
    IF LENGTH(TRIM(p_title)) = 0 THEN
        RAISE EXCEPTION 'Title cannot be empty';
    END IF;

    IF LENGTH(TRIM(p_message)) = 0 THEN
        RAISE EXCEPTION 'Message cannot be empty';
    END IF;

    -- 通知を作成
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        post_id,
        nested_post_id,
        read,
        created_at
    ) VALUES (
        p_user_id::UUID,
        p_type,
        TRIM(p_title),
        TRIM(p_message),
        p_post_id,
        p_nested_post_id,
        false,
        NOW()
    ) RETURNING id INTO new_notification_id;

    RETURN jsonb_build_object(
        'id', new_notification_id,
        'success', true
    );
END;
$$;

-- 特定投票者の取得関数
CREATE OR REPLACE FUNCTION get_voters_by_choice(
    p_post_id integer,
    p_vote_choice integer
)
RETURNS TABLE (user_id text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT v.user_id::text
    FROM votes v
    WHERE v.post_id = p_post_id 
    AND v.vote = p_vote_choice;
END;
$$;

-- 派生質問通知の一括作成関数
CREATE OR REPLACE FUNCTION create_nested_post_notifications(
    p_parent_post_id integer,
    p_nested_post_id integer,
    p_nested_post_title text,
    p_target_vote_choice integer,
    p_creator_user_id text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_count integer := 0;
    voter_record record;
BEGIN
    -- 入力値の検証
    IF LENGTH(TRIM(p_nested_post_title)) = 0 THEN
        RAISE EXCEPTION 'Nested post title cannot be empty';
    END IF;

    -- 親投稿で該当する投票をしたユーザーを取得し、作成者自身を除外
    FOR voter_record IN
        SELECT v.user_id::text as user_id
        FROM votes v
        WHERE v.post_id = p_parent_post_id 
        AND v.vote = p_target_vote_choice
        AND v.user_id::text != p_creator_user_id::text
    LOOP
        -- 各ユーザーに通知を作成
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            post_id,
            nested_post_id,
            read,
            created_at
        ) VALUES (
            voter_record.user_id::UUID,
            'nested_post_created',
            'あなたが参加した投票に派生質問が作成されました',
            '「' || p_nested_post_title || '」という派生質問があなた宛に作成されました。',
            p_parent_post_id,
            p_nested_post_id,
            false,
            NOW()
        );
        
        notification_count := notification_count + 1;
    END LOOP;

    RETURN notification_count;
END;
$$;

-- 関数の権限設定
GRANT EXECUTE ON FUNCTION create_notification_secure(text, text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_voters_by_choice(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION create_nested_post_notifications(integer, integer, text, integer, text) TO authenticated;