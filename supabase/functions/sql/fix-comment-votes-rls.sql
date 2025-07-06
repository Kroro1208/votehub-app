-- 🔧 comment_votes テーブル RLS ポリシー修正
-- コメントリアクションのUI反映問題を修正するためのスクリプト

-- 1. comment_votes テーブルのRLSを有効化
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーがある場合は削除（念のため）
DROP POLICY IF EXISTS "comment_votes_select_policy" ON comment_votes;
DROP POLICY IF EXISTS "comment_votes_insert_policy" ON comment_votes;
DROP POLICY IF EXISTS "comment_votes_update_policy" ON comment_votes;
DROP POLICY IF EXISTS "comment_votes_delete_policy" ON comment_votes;
DROP POLICY IF EXISTS "Anyone can view comment votes" ON comment_votes;
DROP POLICY IF EXISTS "Users can insert their own comment votes" ON comment_votes;
DROP POLICY IF EXISTS "Users can update their own comment votes" ON comment_votes;
DROP POLICY IF EXISTS "Users can delete their own comment votes" ON comment_votes;

-- 3. コメント投票テーブル用のRLSポリシーを作成

-- 誰でもコメント投票結果を閲覧可能（リアクション数表示のため）
CREATE POLICY "Anyone can view comment votes" ON comment_votes
    FOR SELECT USING (true);

-- 認証されたユーザーは自分のコメント投票を挿入可能
CREATE POLICY "Users can insert their own comment votes" ON comment_votes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- ユーザーは自分のコメント投票のみ更新可能
CREATE POLICY "Users can update their own comment votes" ON comment_votes
    FOR UPDATE USING (auth.uid()::text = user_id);

-- ユーザーは自分のコメント投票のみ削除可能
CREATE POLICY "Users can delete their own comment votes" ON comment_votes
    FOR DELETE USING (auth.uid()::text = user_id);

-- 4. テーブル構造を確認（デバッグ用）
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'comment_votes'
ORDER BY ordinal_position;

-- ✅ 修正完了
-- このスクリプトを実行後、コメントリアクションのUI反映問題が解決されます