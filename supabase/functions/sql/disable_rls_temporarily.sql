-- comment_votesテーブルのRLSを一時的に無効化
ALTER TABLE comment_votes DISABLE ROW LEVEL SECURITY;

-- 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "comment_votes_select_policy" ON comment_votes;
DROP POLICY IF EXISTS "comment_votes_insert_policy" ON comment_votes;
DROP POLICY IF EXISTS "comment_votes_update_policy" ON comment_votes;
DROP POLICY IF EXISTS "comment_votes_delete_policy" ON comment_votes;

-- デバッグ用: テーブル構造を確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'comment_votes';