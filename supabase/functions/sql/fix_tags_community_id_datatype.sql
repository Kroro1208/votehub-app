-- Fix tags table community_id data type mismatch
-- Issue: communities.id is BIGINT but tags.community_id is INTEGER
-- This prevents proper CASCADE DELETE functionality

-- 1. 既存の外部キー制約を削除
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_community_id_fkey;

-- 2. community_id の型を BIGINT に変更
ALTER TABLE tags ALTER COLUMN community_id TYPE BIGINT;

-- 3. 外部キー制約を再作成（CASCADE DELETE付き）
ALTER TABLE tags 
ADD CONSTRAINT tags_community_id_fkey 
FOREIGN KEY (community_id) 
REFERENCES communities(id) 
ON DELETE CASCADE;

-- 4. 既存の孤立したタグがないかチェックして削除
DELETE FROM tags 
WHERE community_id NOT IN (
    SELECT id FROM communities
);

-- 5. インデックスの再作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_tags_community_id ON tags(community_id);

-- 成功メッセージ
SELECT 'Tags table community_id data type fixed and CASCADE DELETE constraint restored!' as status;