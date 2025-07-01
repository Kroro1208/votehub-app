-- ブックマーク付き投稿を取得する関数の修正版
-- 問題: TypeScriptの型定義に含まれるcommunitiesフィールドが関数の戻り値に含まれていない
-- 解決: communitiesフィールドをJSONB形式で追加

-- 既存の関数を削除（戻り値の型が変更される場合のため）
DROP FUNCTION IF EXISTS get_bookmarked_posts(UUID);

CREATE OR REPLACE FUNCTION get_bookmarked_posts(target_user_id UUID DEFAULT NULL)
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
    communities jsonb,
    bookmark_created_at timestamptz
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
        p.user_id::text,
        p.parent_post_id,
        COALESCE(p.nest_level, 0) as nest_level,
        p.target_vote_choice,
        COALESCE(v.vote_count, 0) as vote_count,
        COALESCE(c.comment_count, 0) as comment_count,
        COALESCE(v.vote_count, 0) + COALESCE(c.comment_count, 0) * 0.5 as popularity_score,
        -- コミュニティ情報をJSONB形式で返す（他の関数と同様の形式）
        CASE 
            WHEN cm.id IS NOT NULL THEN
                jsonb_build_object(
                    'id', cm.id,
                    'name', cm.name,
                    'description', cm.description
                )
            ELSE NULL
        END as communities,
        b.created_at as bookmark_created_at
    FROM bookmarks b
    JOIN posts p ON b.post_id = p.id
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
    WHERE b.user_id = COALESCE(target_user_id, auth.uid())
    ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;