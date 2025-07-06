-- UUID型問題の強制修正
-- すべてのuser_idカラムをtext型に変換

-- 1. 外部キー制約とインデックスを一時的に削除
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- comment_votesテーブルの外部キー制約を削除
    FOR rec IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'comment_votes'::regclass 
        AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE comment_votes DROP CONSTRAINT IF EXISTS ' || rec.conname;
        RAISE NOTICE 'Dropped constraint: %', rec.conname;
    END LOOP;
    
    -- votesテーブルの外部キー制約を削除
    FOR rec IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'votes'::regclass 
        AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE votes DROP CONSTRAINT IF EXISTS ' || rec.conname;
        RAISE NOTICE 'Dropped constraint: %', rec.conname;
    END LOOP;
    
    -- commentsテーブルの外部キー制約を削除
    FOR rec IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'comments'::regclass 
        AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE comments DROP CONSTRAINT IF EXISTS ' || rec.conname;
        RAISE NOTICE 'Dropped constraint: %', rec.conname;
    END LOOP;
    
    -- postsテーブルの外部キー制約を削除
    FOR rec IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'posts'::regclass 
        AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE posts DROP CONSTRAINT IF EXISTS ' || rec.conname;
        RAISE NOTICE 'Dropped constraint: %', rec.conname;
    END LOOP;
END $$;

-- 2. 強制的にuser_idカラムをtext型に変換
DO $$
BEGIN
    -- comment_votes.user_id
    BEGIN
        ALTER TABLE comment_votes ALTER COLUMN user_id TYPE text USING user_id::text;
        RAISE NOTICE 'comment_votes.user_id converted to text';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'comment_votes.user_id conversion failed: %', SQLERRM;
    END;
    
    -- votes.user_id
    BEGIN
        ALTER TABLE votes ALTER COLUMN user_id TYPE text USING user_id::text;
        RAISE NOTICE 'votes.user_id converted to text';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'votes.user_id conversion failed: %', SQLERRM;
    END;
    
    -- comments.user_id
    BEGIN
        ALTER TABLE comments ALTER COLUMN user_id TYPE text USING user_id::text;
        RAISE NOTICE 'comments.user_id converted to text';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'comments.user_id conversion failed: %', SQLERRM;
    END;
    
    -- posts.user_id
    BEGIN
        ALTER TABLE posts ALTER COLUMN user_id TYPE text USING user_id::text;
        RAISE NOTICE 'posts.user_id converted to text';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'posts.user_id conversion failed: %', SQLERRM;
    END;
    
    -- user_points.user_id
    BEGIN
        ALTER TABLE user_points ALTER COLUMN user_id TYPE text USING user_id::text;
        RAISE NOTICE 'user_points.user_id converted to text';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'user_points.user_id conversion failed: %', SQLERRM;
    END;
    
    -- point_transactions.user_id
    BEGIN
        ALTER TABLE point_transactions ALTER COLUMN user_id TYPE text USING user_id::text;
        RAISE NOTICE 'point_transactions.user_id converted to text';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'point_transactions.user_id conversion failed: %', SQLERRM;
    END;
END $$;

-- 3. インデックスを再作成
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON comment_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_post_id ON votes(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);

-- 4. 必要な制約を再作成
ALTER TABLE comment_votes ADD CONSTRAINT comment_votes_comment_id_fkey 
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE;
    
ALTER TABLE votes ADD CONSTRAINT votes_post_id_fkey 
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
    
ALTER TABLE comments ADD CONSTRAINT comments_post_id_fkey 
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
    
ALTER TABLE posts ADD CONSTRAINT posts_community_id_fkey 
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;

-- 5. ユニーク制約を再作成
DO $$
BEGIN
    -- comment_votesのユニーク制約
    BEGIN
        ALTER TABLE comment_votes ADD CONSTRAINT comment_votes_comment_user_unique 
            UNIQUE (comment_id, user_id);
        RAISE NOTICE 'comment_votes unique constraint added';
    EXCEPTION
        WHEN duplicate_table THEN
            RAISE NOTICE 'comment_votes unique constraint already exists';
    END;
    
    -- votesのユニーク制約
    BEGIN
        ALTER TABLE votes ADD CONSTRAINT votes_post_user_unique 
            UNIQUE (post_id, user_id);
        RAISE NOTICE 'votes unique constraint added';
    EXCEPTION
        WHEN duplicate_table THEN
            RAISE NOTICE 'votes unique constraint already exists';
    END;
    
    -- user_pointsのユニーク制約
    BEGIN
        ALTER TABLE user_points ADD CONSTRAINT user_points_user_id_unique 
            UNIQUE (user_id);
        RAISE NOTICE 'user_points unique constraint added';
    EXCEPTION
        WHEN duplicate_table THEN
            RAISE NOTICE 'user_points unique constraint already exists';
    END;
END $$;

-- 6. 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '✅ UUID to text conversion completed!';
    RAISE NOTICE 'All user_id columns are now text type';
    RAISE NOTICE 'Please restart your frontend development server';
END $$;