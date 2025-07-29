# 通知機能バグ修正レポート (GitHub Issue #35)

## 修正概要

GitHub Issue #35「通知機能のバグ修正」で報告された以下2つの問題を修正しました：

1. **期限終了時に投票者に通知が来ない**
2. **派生質問作成時、派生質問対象者への通知が来ない**

## 修正内容

### 1. 派生質問通知の型の問題修正

**問題**: データベーストリガー内でUUID型の比較に型の不一致があった

**修正ファイル**: `fix_nested_post_notification_system.sql`

```sql
-- 修正前
AND user_id != NEW.user_id

-- 修正後
AND user_id::UUID != NEW.user_id::UUID
```

### 2. 投票期限終了通知の定期実行メカニズム実装

**問題**: 通知関数は存在していたが、定期的に実行するメカニズムが欠けていた

**解決策**: Supabase Edge Functionを使用したバックグラウンド処理の実装

#### 新規作成ファイル:

1. **`supabase/functions/deadline-checker/index.ts`**
   - 期限切れ投稿を検出し通知を送信するEdge Function
   - 定期的にcronで実行される想定

2. **`supabase/functions/deadline-checker/deno.json`**
   - Edge Functionの依存関係設定

3. **`migration_fix_notification_bugs.sql`**
   - 修正内容をまとめたマイグレーションファイル
   - 通知ログ機能を追加
   - 手動テスト用の関数を追加

#### 修正ファイル:

1. **`src/components/Post/PostDetail.tsx`**
   - 通知チェックの説明を更新（Edge Functionに処理を移行）

## 実装詳細

### Edge Function (deadline-checker)

```typescript
// 期限切れ投稿を検出
const { data: expiredPosts } = await supabase
  .from("posts")
  .select("id, title, vote_deadline, created_at")
  .not("vote_deadline", "is", null)
  .lt("vote_deadline", new Date().toISOString());

// 各投稿に対して通知を作成
const { data: result } = await supabase.rpc("create_deadline_notifications", {
  p_post_id: post.id,
  p_post_title: post.title,
});
```

### データベース関数

```sql
-- 期限切れ投稿の処理
CREATE OR REPLACE FUNCTION process_expired_vote_deadlines()
RETURNS JSON AS $$
-- 期限切れ投稿を検出し、通知を作成
-- 処理結果をJSONで返す
$$ LANGUAGE plpgsql;

-- テスト用関数
CREATE OR REPLACE FUNCTION trigger_deadline_notifications_for_post(p_post_id INTEGER)
RETURNS INTEGER AS $$
-- 特定の投稿に対して手動で期限通知をトリガー
$$ LANGUAGE plpgsql;
```

## 使用方法

### 1. マイグレーションの適用

```sql
-- Supabase SQLエディタで実行
\i migration_fix_notification_bugs.sql
```

### 2. Edge Functionのデプロイ

```bash
# Supabase CLIでEdge Functionをデプロイ
supabase functions deploy deadline-checker
```

### 3. 定期実行の設定

Edge Functionを定期的に実行するために、以下のいずれかを設定：

- **Supabase Cron**: Supabaseの組み込みcron機能を使用
- **外部cron**: GitHub ActionsやVercel Cronを使用
- **手動実行**: 管理画面から手動で実行

### 4. テスト方法

#### 派生質問通知のテスト:

1. 投稿に対して投票
2. 派生質問を作成
3. 投票した人に通知が届くことを確認

#### 期限終了通知のテスト:

```sql
-- 手動で期限通知をテスト
SELECT trigger_deadline_notifications_for_post(投稿ID);
```

## 追加機能

### 通知ログ機能

- 通知の送信試行を記録
- デバッグとモニタリングに活用

### 統計ビュー

- 通知タイプ別の統計情報
- 既読/未読の集計

## 注意事項

1. **Edge Functionの定期実行**: 適切なcron設定が必要
2. **データベース権限**: 新しい関数には適切な権限設定済み
3. **パフォーマンス**: 一度に処理する投稿数を50件に制限

## 影響範囲

- **派生質問通知**: 即座に修正される
- **期限終了通知**: Edge Functionのデプロイと定期実行設定後に有効
- **既存機能**: 影響なし

## 今後の改善点

1. Edge Functionの実行頻度の最適化
2. 通知の重複防止機能の強化
3. リアルタイム通知（WebSocket）の検討

---

**修正完了日**: 2025-07-01  
**修正者**: Claude Code  
**関連Issue**: #35 - 通知機能のバグ修正
