-- AI投票分析結果テーブルの作成
CREATE TABLE IF NOT EXISTS ai_vote_analysis (
    id bigserial PRIMARY KEY,
    post_id int8 NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    trend_analysis text NOT NULL,
    sentiment_analysis text NOT NULL,
    discussion_quality text NOT NULL,
    persuasion_effectiveness text NOT NULL,
    overall_assessment text NOT NULL,
    confidence_score integer NOT NULL CHECK (confidence_score >= 1 AND confidence_score <= 10),
    analyzed_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    UNIQUE(post_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_ai_vote_analysis_post_id ON ai_vote_analysis(post_id);
CREATE INDEX IF NOT EXISTS idx_ai_vote_analysis_analyzed_at ON ai_vote_analysis(analyzed_at);

-- RLSポリシー設定
ALTER TABLE ai_vote_analysis ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能（AI分析結果は公開情報）
CREATE POLICY "AI分析結果は全ユーザーが閲覧可能" ON ai_vote_analysis
    FOR SELECT USING (true);

-- システムのみが書き込み可能
CREATE POLICY "AI分析結果の作成・更新はシステムのみ" ON ai_vote_analysis
    FOR ALL USING (false);