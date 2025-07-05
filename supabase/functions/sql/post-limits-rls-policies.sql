-- 🔒 投稿制限機能 - RLSポリシー設定
-- ⚠️  このファイルをSupabase SQL Editorで実行してください

-- 1. user_memberships テーブルのRLS有効化とポリシー設定
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の会員情報のみ参照可能
CREATE POLICY "Users can view own membership" ON user_memberships
    FOR SELECT USING (auth.uid()::text = user_id);

-- ユーザーは自分の会員情報のみ更新可能（管理者権限は別途設定）
CREATE POLICY "Users can update own membership" ON user_memberships
    FOR UPDATE USING (auth.uid()::text = user_id);

-- システムが新規ユーザーの会員情報を自動作成可能
CREATE POLICY "System can insert membership" ON user_memberships
    FOR INSERT WITH CHECK (true);

-- 2. daily_post_counts テーブルのRLS有効化とポリシー設定
ALTER TABLE daily_post_counts ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の投稿数のみ参照可能
CREATE POLICY "Users can view own post counts" ON daily_post_counts
    FOR SELECT USING (auth.uid()::text = user_id);

-- システムが投稿数を記録・更新可能
CREATE POLICY "System can manage post counts" ON daily_post_counts
    FOR ALL WITH CHECK (true);

-- 3. post_limit_removals テーブルのRLS有効化とポリシー設定
ALTER TABLE post_limit_removals ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の制限解除履歴のみ参照可能
CREATE POLICY "Users can view own limit removals" ON post_limit_removals
    FOR SELECT USING (auth.uid()::text = user_id);

-- システムが制限解除履歴を記録可能
CREATE POLICY "System can insert limit removals" ON post_limit_removals
    FOR INSERT WITH CHECK (true);

-- ✅ RLS設定完了
-- 次のステップ:
-- 1. 管理者権限が必要な場合は別途ポリシーを追加
-- 2. アプリケーションでのセキュリティテストを実施