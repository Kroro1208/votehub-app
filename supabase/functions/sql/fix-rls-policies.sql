-- RLSポリシー修正用SQLスクリプト
-- Supabase SQL Editorで実行してください

-- 1. user_membershipsテーブルのRLSポリシーを設定
-- まず既存のポリシーを確認・削除
DROP POLICY IF EXISTS "Users can view own membership" ON user_memberships;
DROP POLICY IF EXISTS "Users can insert own membership" ON user_memberships;
DROP POLICY IF EXISTS "Users can update own membership" ON user_memberships;

-- 自分のデータのみアクセス可能なポリシーを作成
CREATE POLICY "Users can view own membership" ON user_memberships
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own membership" ON user_memberships
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own membership" ON user_memberships
    FOR UPDATE USING (auth.uid()::text = user_id);

-- 2. daily_post_countsテーブルのRLSポリシーを設定
DROP POLICY IF EXISTS "Users can view own post counts" ON daily_post_counts;
DROP POLICY IF EXISTS "Users can insert own post counts" ON daily_post_counts;
DROP POLICY IF EXISTS "Users can update own post counts" ON daily_post_counts;

CREATE POLICY "Users can view own post counts" ON daily_post_counts
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own post counts" ON daily_post_counts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own post counts" ON daily_post_counts
    FOR UPDATE USING (auth.uid()::text = user_id);

-- 3. post_limit_removalsテーブルのRLSポリシーを設定
DROP POLICY IF EXISTS "Users can view own limit removals" ON post_limit_removals;
DROP POLICY IF EXISTS "Users can insert own limit removals" ON post_limit_removals;

CREATE POLICY "Users can view own limit removals" ON post_limit_removals
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own limit removals" ON post_limit_removals
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 4. RLSを有効化
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_post_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_limit_removals ENABLE ROW LEVEL SECURITY;

-- 確認用クエリ
SELECT tablename, schemaname, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('user_memberships', 'daily_post_counts', 'post_limit_removals');