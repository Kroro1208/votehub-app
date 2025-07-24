# Gemini AI投票分析機能セットアップガイド

## 🔧 セットアップ手順

### 1. データベーステーブル作成

Supabaseダッシュボードの「SQL Editor」で以下を実行：

```sql
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
```

### 2. Supabase Edge Function デプロイ

```bash
# Supabase CLIでEdge Functionをデプロイ
supabase functions deploy gemini-vote-analysis

# または手動でSupabaseダッシュボードからアップロード
```

### 3. 環境変数設定

Supabaseダッシュボードの「Settings > Edge Functions」で以下の環境変数を設定：

- `GEMINI_API_KEY`: [Google AI StudioでAPIキーを取得してください]

## 🧪 テスト方法

### 1. データベーステーブル確認

```sql
-- テーブルが作成されているか確認
SELECT table_name FROM information_schema.tables
WHERE table_name = 'ai_vote_analysis';

-- カラム構造確認
\d ai_vote_analysis;
```

### 2. Edge Function テスト

```bash
# Edge Function のテスト呼び出し
curl -X POST 'https://rvgsxdggkipvjevphjzb.supabase.co/functions/v1/gemini-vote-analysis' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"postId": 1}'
```

## 🔍 トラブルシューティング

### エラー: "Edge Function not found"

- Edge Functionが正しくデプロイされていない
- `supabase functions deploy gemini-vote-analysis` を実行

### エラー: "Table does not exist"

- `ai_vote_analysis` テーブルが作成されていない
- 上記のSQLを実行してテーブルを作成

### エラー: "Gemini API key invalid"

- Gemini APIキーの設定を確認
- Supabase Edge Functions環境変数で `GEMINI_API_KEY` を設定

### エラー: "Permission denied"

- RLSポリシーの設定を確認
- Edge FunctionからのアクセスにはService Role Keyが必要

## 📊 動作確認

1. 投票期限が終了した投稿にアクセス
2. 「AI分析を実行」ボタンをクリック
3. 分析結果が表示されることを確認

## 🎯 機能概要

- **投票トレンド分析**: 時系列での投票パターン分析
- **感情・論調分析**: コメント内容の感情解析
- **議論品質評価**: 議論の建設性・多様性評価
- **説得効果分析**: 説得タイム中の変化測定
- **総合評価**: AI信頼度スコア(1-10)付き
