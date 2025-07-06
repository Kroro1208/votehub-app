-- 🔧 votes テーブル RLS ポリシー修正
-- 投票機能のRLS違反エラーを修正するためのスクリプト

-- 1. votes テーブルのRLSを有効化
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーがある場合は削除（念のため）
DROP POLICY IF EXISTS "Anyone can view votes" ON votes;
DROP POLICY IF EXISTS "Users can insert their own votes" ON votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON votes;
DROP POLICY IF EXISTS "No one can delete votes" ON votes;

-- 3. 投票テーブル用のRLSポリシーを作成

-- 誰でも投票結果を閲覧可能（投票数表示のため）
CREATE POLICY "Anyone can view votes" ON votes
    FOR SELECT USING (true);

-- 認証されたユーザーは自分の投票を挿入可能
CREATE POLICY "Users can insert their own votes" ON votes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- ユーザーは自分の投票のみ更新可能
CREATE POLICY "Users can update their own votes" ON votes
    FOR UPDATE USING (auth.uid()::text = user_id);

-- 投票の削除は禁止（データの整合性を保つため）
CREATE POLICY "No one can delete votes" ON votes
    FOR DELETE USING (false);

-- 4. 関連するポイント処理の関数もSECURITY DEFINERに修正（必要に応じて）
-- 既存の投票処理関数がある場合は、それらもSECURITY DEFINERに修正する必要があります

-- ✅ 修正完了
-- このスクリプトを実行後、投票機能のRLSエラーが解決されます