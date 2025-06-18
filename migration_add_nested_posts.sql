-- ネスト投稿機能のためのマイグレーション
-- 実行日: 2025-06-18

-- postsテーブルにネスト機能用のカラムを追加
ALTER TABLE posts 
ADD COLUMN parent_post_id int8 REFERENCES posts(id),
ADD COLUMN nest_level integer DEFAULT 0 CHECK (nest_level >= 0 AND nest_level <= 3),
ADD COLUMN target_vote_choice integer CHECK (target_vote_choice IN (-1, 1));

-- インデックスを追加（パフォーマンス最適化）
CREATE INDEX idx_posts_parent_id ON posts(parent_post_id);
CREATE INDEX idx_posts_nest_level ON posts(nest_level);

-- get_posts_with_counts関数を更新（ネスト情報とターゲット投票選択を含める）
CREATE OR REPLACE FUNCTION get_posts_with_counts()
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
    comment_count int8
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
        p.user_id,
        p.parent_post_id,
        COALESCE(p.nest_level, 0) as nest_level,
        p.target_vote_choice,
        COALESCE(v.vote_count, 0) as vote_count,
        COALESCE(c.comment_count, 0) as comment_count
    FROM posts p
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
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) ポリシーの確認と追加
-- ネスト投稿も既存のポリシーで適切に制御されることを確認

-- テストデータ（オプション - 開発環境でのみ実行）
-- INSERT INTO posts (title, content, user_id, community_id, vote_deadline, parent_post_id, nest_level) 
-- VALUES 
-- ('テスト親投稿', 'これは親投稿のテストです', 'test-user-id', 1, NOW() + INTERVAL '1 day', NULL, 0),
-- ('テスト子投稿', 'これは子投稿のテストです', 'test-user-id', NULL, NOW() + INTERVAL '1 day', 1, 1);

-- マイグレーション完了
-- このマイグレーションにより以下が可能になります：
-- 1. 投稿に親投稿ID (parent_post_id) を設定
-- 2. ネストレベル (nest_level) を管理（最大3段階）
-- 3. ネスト構造を含めた投稿データの取得
-- 4. パフォーマンス最適化のためのインデックス追加