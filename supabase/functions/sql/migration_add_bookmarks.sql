-- ブックマーク機能のためのマイグレーション
-- 実行日: 2025-06-25

-- bookmarksテーブルの作成
CREATE TABLE bookmarks (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- インデックスの追加（パフォーマンス最適化）
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_post_id ON bookmarks(post_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- RLS (Row Level Security) ポリシーの設定
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のブックマークのみアクセス可能
CREATE POLICY "Users can view own bookmarks" ON bookmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks" ON bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- 既存の関数を削除（戻り値の型が変更される場合のため）
DROP FUNCTION IF EXISTS get_bookmarked_posts(UUID);

-- ブックマーク付き投稿を取得する関数
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
        -- コミュニティ情報をJSONB形式で返す
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