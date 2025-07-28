# 議論投票プラットフォーム開発プロジェクト

## プロジェクト概要

![デモ動画](public/demo.MP4)

開発状況に関しては[こちら](.claude/Claude.md)を参照

ユーザーがスペースを作成し、2択の投票形式で議論を行うリアルタイム投票プラットフォーム。説得タイム機能とポイントシステムを備えた次世代型議論アプリ。

## 技術スタック

- **フレームワーク**: React19 + TypeScript
- **スタイリング**: Tailwind CSS + shadcn/ui
- **バックエンド**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **ORM**: Supabase クライアント + TypeScript型生成
- **リアルタイム**: Supabase Realtime
- **認証**: Supabase Auth
- **ファイルストレージ**: Supabase Storage
- **デプロイ**: Vercel

## AI開発支援ツール設定

### GitHub Copilot 活用指針

1. **コード補完**: 関数名やコメントを日本語で書いてから英語コードを生成
2. **テンプレート生成**: `// TODO: ユーザー認証コンポーネントを作成`のようなコメントを活用
3. **デバッグ支援**: エラーメッセージをコメントに書いてCopilotに解決策を提案させる

### Claude Sonnet 4 活用指針

1. **設計相談**: 複雑な機能の実装方針を相談
2. **コードレビュー**: 書いたコードの改善点を相談
3. **テストケース作成**: 機能ごとのテストケースを生成依頼
4. **ドキュメント生成**: API仕様書やコンポーネント仕様書を生成依頼

## 機能仕様詳細

### 1. 基本機能

#### スペース・投稿システム

- ユーザーはジャンル別にスペースを作成可能
- ポストは2択投票形式（賛成/反対、A/B選択など）
- 最大3段階のネスト投稿対応
- 投票参加にはスペース参加が必須

#### 投票ルール

- 初回投票 + 説得タイム中の1回変更（計2回まで）
- 説得タイムは投票締切6時間前から開始
- 投票履歴と変更理由の可視化機能

### 2. コメント・評価システム

- ポストへのコメント投稿機能
- Upvote/Downvote による評価システム
- 高評価コメントの優先表示
- 共感ポイント・説得力スコアの算出

### 3. リアルタイム機能

- 盛り上がり投票のランキング表示
- リアルタイム棒グラフによる投票状況可視化
- 「急上昇」「説得タイム中」バッジ表示

### 4. ポイント・会員システム

#### ポイント獲得

- 他人の投稿に投票: +1ポイント
- 他人の投稿にコメント: +0.5ポイント
- 投稿の自動拡散達成: +10ポイント

#### ポイント消費

- 投稿の優先表示: -50ポイント
- 投稿制限解除: -30ポイント
- スペース作成（2つ目以降）: -100ポイント

#### 会員グレード

| グレード     | 月額    | 1日投稿数 | 優先表示チケット | 説得力スコア倍率 |
| ------------ | ------- | --------- | ---------------- | ---------------- |
| 無料         | 0円     | 2投稿     | なし             | 1.0倍            |
| スタンダード | 500円   | 5投稿     | 月3枚            | 1.05倍           |
| プラチナ     | 1,200円 | 15投稿    | 月10枚           | 1.10倍           |
| ダイヤモンド | 2,500円 | 無制限    | 月30枚           | 1.20倍           |

## AI開発指示書

### Phase 1: プロジェクト設定（GitHub Copilot使用）

```bash
# プロジェクト初期化
npx create-next-app@latest debate-platform --typescript --tailwind --eslint --app
cd debate-platform
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install -D @types/node
npx shadcn-ui@latest init
```

**Copilot向けコメント例:**

```typescript
// TODO: Next.js 14 App Router + TypeScript + Tailwind CSSの基本セットアップ
// TODO: Supabaseクライアント設定
// TODO: 環境変数設定（.env.local）
// TODO: フォルダ構造の作成（app, components, lib, hooks, types）
```

### Phase 2: Supabase設定・認証システム（Claude相談推奨）

**Claude への相談例:**

```
「Next.js 14 App Router + Supabaseで議論プラットフォームの認証システムを実装したいです。
- Supabase Authを使用したユーザー登録・ログイン
- Row Level Security (RLS) ポリシーの設計
- 会員グレード管理
- middleware.tsでの認証チェック
- Server ComponentとClient Componentでの認証状態管理
上記を含めた実装方針を教えてください。」
```

**Supabase設定手順:**

```typescript
// TODO: Supabaseプロジェクト作成・設定
// TODO: 環境変数設定（NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY）
// TODO: lib/supabase.tsでクライアント設定
// TODO: middleware.tsで認証ミドルウェア設定
// TODO: app/auth配下にログイン・登録ページ作成
```

### Phase 3: データベース設計（Claude + Copilot併用）

**Claude への設計相談:**

```
「Supabase PostgreSQLで以下のテーブル設計とRLSポリシーを作成してください:
- users（ユーザー情報・会員グレード）
- spaces（スペース情報）
- posts（投稿・ネスト構造対応）
- votes（投票履歴・変更追跡）
- comments（コメント・評価）
- points（ポイント履歴）
- user_space_memberships（スペース参加管理）

RLSポリシーで適切なアクセス制御も含めて設計してください。」
```

**Copilot向けコメント:**

```sql
-- TODO: Supabase SQLエディタでテーブル作成
-- TODO: RLS（Row Level Security）ポリシー設定
-- TODO: TypeScript型定義の自動生成設定
-- TODO: リアルタイム購読の有効化設定
```

### Phase 4: フロントエンド開発（Copilot主導）

#### Server Components & Client Components

```typescript
// TODO: app/spaces/page.tsx - スペース一覧（Server Component）
// TODO: app/spaces/[id]/page.tsx - スペース詳細（Server Component）
// TODO: components/ui/post-card.tsx - 投稿カード（Server Component）
// TODO: components/voting/vote-button.tsx - 投票ボタン（Client Component）
// TODO: components/realtime/live-chart.tsx - リアルタイム棒グラフ（Client Component）
// TODO: components/comments/comment-form.tsx - コメント投稿（Client Component）
```

#### 状態管理・リアルタイム更新

```typescript
// TODO: hooks/useRealtimeVotes.ts - Supabase Realtimeで投票状況購読
// TODO: hooks/useAuth.ts - 認証状態管理
// TODO: lib/supabase-browser.ts - クライアントサイド用Supabaseクライアント
// TODO: lib/supabase-server.ts - サーバーサイド用Supabaseクライアント
```

### Phase 5: API Routes開発（Claude設計 + Copilot実装）

**Claude への相談:**

```
React router + Supabaseで以下のAPI Routesを実装します。
- 投票の作成・取得・更新
- ポイントシステムの処理
- 説得タイム機能の実装
- 会員グレード制限のチェック
- リアルタイム通知の処理
```

**Copilot向けAPI実装コメント:**

```typescript
// TODO: app/api/spaces/route.ts - スペースCRUD API
// TODO: app/api/posts/[id]/vote/route.ts - 投票API
// TODO: actions/voting.ts - 投票用Server Actions
// TODO: actions/points.ts - ポイント管理Server Actions
// TODO: lib/cron.ts - 説得タイム開始の定期処理（Vercel Cron）
```

### Phase 6: 特殊機能実装（Claude設計必須）

#### ポイントシステム

**Claude への相談:**

```
「ポイントシステムのロジックを実装したいです。
- ポイント獲得・消費のタイミング
- 会員グレード別の制限チェック
- 説得力スコアの計算アルゴリズム
具体的な実装方針を教えてください。」
```

#### リアルタイム更新

**Claude への相談:**

```
「Supabase Realtimeを使ったリアルタイム機能で以下を実装したいです:
- 投票状況のリアルタイム更新
- コメント投稿の即座反映
- 説得タイム開始の全ユーザー通知
- Next.js 14のServer ComponentsとClient Componentsでの最適な実装方法
パフォーマンスとSEOを考慮した設計を提案してください。」
```

## 開発フロー

### 1. 機能単位の開発サイクル

1. **Claude**: 機能設計・実装方針の相談
2. **Copilot**: コード実装・テスト作成
3. **Claude**: コードレビュー・改善提案
4. **Copilot**: リファクタリング・最適化

### 2. デバッグ・トラブルシューティング

1. **Copilot**: エラーの自動修正提案
2. **Claude**: 複雑なバグの原因分析・解決策相談
3. **Copilot**: 修正コードの実装

### 3. テスト戦略

```typescript
// TODO: vitest+ React Testing LibraryでServer/Client Componentsテスト
// TODO: Playwright でE2Eテスト
// TODO: Supabase Realtimeのテスト
// TODO: Server Actionsのテスト
```

## プロジェクト管理

### Git管理

```bash
# 機能ブランチ戦略
git checkout -b feature/supabase-setup
git checkout -b feature/voting-system
git checkout -b feature/realtime-updates
git checkout -b feature/point-system
```

### 開発順序推奨

1. **Week 1-2**: Supabase設定・認証・基本CRUD機能
2. **Week 3-4**: 投票システム・Realtime購読機能
3. **Week 5-6**: ポイントシステム・会員機能
4. **Week 7-8**: 説得タイム・高度な機能
5. **Week 9-10**: テスト・Vercelデプロイ・最適化

### コード品質チェックリスト

- [ ] TypeScript型定義の完備
- [ ] エラーハンドリングの実装
- [ ] セキュリティ対策（XSS、CSRF等）
- [ ] パフォーマンス最適化
- [ ] レスポンシブデザイン対応
- [ ] アクセシビリティ対応

## 参考資料・学習リソース

- [React19 公式ドキュメント](https://ja.react.dev/blog/2024/12/05/react-19)
- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [shadcn/ui コンポーネント](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 注意事項

- 個人情報の適切な取り扱い
- 著作権・プライバシーポリシーの整備
- サーバー負荷対策の実装
- モバイル対応の考慮

---

**開発開始前に必ず行うこと:**

1. Supabaseプロジェクトの作成・設定
2. Claude に全体的な実装方針を相談
3. GitHub Copilot の設定確認4.　React19 + Supabase開発環境のセットアップ確認
4. このREADMEの内容を基にした詳細な実装計画の作成
