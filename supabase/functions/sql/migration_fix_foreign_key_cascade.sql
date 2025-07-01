-- 投稿削除時の外部キー制約問題を修正するマイグレーション
-- 実行日: 2025-06-30

-- 既存の外部キー制約を削除して、CASCADE DELETEを含む新しい制約を追加

-- 1. posts.parent_post_id の外部キー制約を修正
-- まず既存の制約を削除
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_parent_post_id_fkey;

-- CASCADE DELETEを含む新しい制約を追加
ALTER TABLE posts 
ADD CONSTRAINT posts_parent_post_id_fkey 
FOREIGN KEY (parent_post_id) REFERENCES posts(id) ON DELETE CASCADE;

-- 2. votes.post_id の外部キー制約を追加（もし存在しない場合）
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_post_id_fkey;
ALTER TABLE votes 
ADD CONSTRAINT votes_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

-- 3. comments.post_id の外部キー制約を追加（もし存在しない場合）
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;
ALTER TABLE comments 
ADD CONSTRAINT comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

-- 4. 既存のdelete_user_post関数を更新して、より確実な削除を実行
CREATE OR REPLACE FUNCTION delete_user_post(
    post_id BIGINT,
    user_id TEXT
) RETURNS JSON AS $$
DECLARE
    result JSON;
    deleted_count INTEGER;
BEGIN
    -- ユーザー認証チェック
    IF NOT EXISTS (
        SELECT 1 FROM posts 
        WHERE id = post_id AND posts.user_id = delete_user_post.user_id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'この投稿を削除する権限がありません'
        );
    END IF;

    -- CASCADE DELETEが設定されているため、単純に親投稿を削除するだけで
    -- 子投稿、孫投稿、関連データがすべて自動的に削除される
    DELETE FROM posts 
    WHERE id = post_id AND posts.user_id = delete_user_post.user_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', '投稿が見つからないか、削除権限がありません'
        );
    ELSE
        RETURN json_build_object(
            'success', true,
            'message', '投稿が正常に削除されました'
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- マイグレーション完了
-- この修正により：
-- 1. 親投稿を削除すると、子投稿が自動的に削除される
-- 2. 投稿を削除すると、関連する投票とコメントが自動的に削除される
-- 3. アプリケーション側での手動削除が不要になる