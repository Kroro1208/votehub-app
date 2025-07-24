# AI分析機能 トラブルシューティングガイド

## 🔍 「AI分析の実行に失敗しました」エラーの解決方法

### 原因1: Edge Functionが未デプロイ

**症状**: "Function not found" または 404エラー

**解決方法**:

```bash
# Supabase CLIでデプロイ
supabase functions deploy gemini-vote-analysis

# または手動でSupabaseダッシュボードからアップロード
```

### 原因2: データベーステーブル未作成

**症状**: "Table does not exist" エラー

**解決方法**:
Supabaseダッシュボードの「SQL Editor」で実行：

```sql
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

ALTER TABLE ai_vote_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI分析結果は全ユーザーが閲覧可能" ON ai_vote_analysis
    FOR SELECT USING (true);
```

### 原因3: 投票期限チェックエラー

**症状**: AI分析ボタンが表示されない

**確認方法**:

- 投稿の`vote_deadline`が現在時刻より過去であることを確認

### 原因4: Gemini API接続エラー

**症状**: "API key invalid" または Gemini関連エラー

**解決方法**:

- Gemini APIキーが正しく設定されていることを確認
- Edge Function内のAPIキーを確認

## 🧪 手動テスト方法

### 1. データベース確認

```sql
-- テーブル存在確認
SELECT table_name FROM information_schema.tables
WHERE table_name = 'ai_vote_analysis';

-- 投稿の投票期限確認
SELECT id, title, vote_deadline,
       CASE WHEN vote_deadline < now() THEN 'expired' ELSE 'active' END as status
FROM posts
WHERE id = YOUR_POST_ID;
```

### 2. Edge Function直接テスト

```bash
curl -X POST 'https://rvgsxdggkipvjevphjzb.supabase.co/functions/v1/gemini-vote-analysis' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"postId": 1}'
```

### 3. ブラウザコンソール確認

1. 開発者ツールを開く (F12)
2. Consoleタブを確認
3. AI分析ボタンをクリック
4. エラーメッセージを確認

## 🔧 クイック修正

### Edge Functionなしでのテスト用モック

```typescript
// src/hooks/useAIAnalysis.ts に追加
const MOCK_ANALYSIS: AIAnalysisResult = {
  id: 1,
  post_id: 1,
  trend_analysis:
    "投票は序盤に賛成票が多く、後半に反対票が増加する傾向が見られました。",
  sentiment_analysis:
    "コメントは全体的に建設的で、感情的な発言は少なく理性的な議論が展開されています。",
  discussion_quality:
    "多様な観点からの意見交換が行われ、質の高い議論となっています。",
  persuasion_effectiveness:
    "説得タイム中に3件の投票変更があり、適度な説得効果が確認されました。",
  overall_assessment:
    "全体として信頼性の高い投票結果で、参加者の真剣な検討が伺えます。",
  confidence_score: 8,
  analyzed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

// テスト用にモックデータを返す
export const useGenerateAIAnalysisMock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number): Promise<AIAnalysisResult> => {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2秒待機
      return { ...MOCK_ANALYSIS, post_id: postId };
    },
    onSuccess: (data, postId) => {
      queryClient.setQueryData(["ai-analysis", postId], data);
    },
  });
};
```

## 📞 サポート

上記の解決方法で問題が解決しない場合：

1. ブラウザコンソールのエラーメッセージをコピー
2. Supabaseダッシュボードの「Logs」を確認
3. Edge Functionのログを確認

エラーメッセージに基づいて具体的な解決策を提供できます。
