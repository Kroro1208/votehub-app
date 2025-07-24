-- AI分析テーブルの修正
-- 406エラーの原因を修正

-- テーブル存在確認とRLSポリシー修正
-- まずRLSポリシーを削除して再作成
DROP POLICY IF EXISTS "AI分析結果は全ユーザーが閲覧可能" ON ai_vote_analysis;
DROP POLICY IF EXISTS "AI分析結果の作成・更新はシステムのみ" ON ai_vote_analysis;

-- RLSを一時的に無効化
ALTER TABLE ai_vote_analysis DISABLE ROW LEVEL SECURITY;

-- 新しいポリシーを作成
ALTER TABLE ai_vote_analysis ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能
CREATE POLICY "ai_analysis_select_policy" ON ai_vote_analysis
    FOR SELECT USING (true);

-- システム（service_role）のみが書き込み可能
CREATE POLICY "ai_analysis_insert_policy" ON ai_vote_analysis
    FOR INSERT WITH CHECK (true);

CREATE POLICY "ai_analysis_update_policy" ON ai_vote_analysis
    FOR UPDATE USING (true);

-- テーブル権限の確認と設定
GRANT SELECT ON ai_vote_analysis TO anon, authenticated;
GRANT ALL ON ai_vote_analysis TO service_role;