# Conversation Guidelines

- 常に日本語で会話する

# 投票・議論プラットフォーム開発プロジェクト

## プロジェクト概要

ユーザーがジャンル別の「スペース」を作成し、2択投票で意見を募り議論できるプラットフォーム。リアルタイムの投票結果表示、説得機能、ポイント制度を含む高機能な投票・議論システム。

### 🎯 現在のプロジェクト状況 (2025年6月)

**✅ 開発進捗: フェーズ1-2完了 + ユーザー機能追加 (コア機能実装済み)**

- **認証・投稿・投票・コメント機能**: 完全実装
- **リアルタイム投票・説得タイム**: 実装済み
- **プロフィールページ機能**: 新規実装完了 (2025-06-17)
- **UI/UX・レスポンシブデザイン**: 完成
- **Supabaseフル統合**: 完了
- **モダンな技術スタック**: React 19 + TypeScript + Tailwind CSS

**🚀 次のステップ: フェーズ3開始準備**

- リアルタイム通知システム
- ポイント・スコアシステム
- プロフィール編集・ユーザーバッジ機能

## 技術スタック

### フロントエンド

- **React 19.0.0** (最新版、並行レンダリング)
- **TypeScript** (型安全性)
- **Vite 6.3.1** (高速ビルドツール)
- **React Router 7.5.1** (ナビゲーション)

### スタイリング・UI

- **Tailwind CSS 4.1.4** (ユーティリティファースト)
- **Radix UI** (アクセシブルなプリミティブ)
- **Lucide React** + **React Icons** (アイコン)
- **React Toastify** (通知システム)

### 状態管理・データフェッチ

- **TanStack Query 5.74.4** (サーバー状態管理)
- **Jotai 2.12.5** (原子的クライアント状態管理)

### フォーム・バリデーション

- **React Hook Form 7.57.0** (フォーム管理)
- **Zod 3.25.64** (スキーマバリデーション)
- **Hookform Resolvers** (統合ライブラリ)

### バックエンド・データベース

- **Supabase 2.49.4** (BaaS: PostgreSQL + Auth + Storage + Real-time)
- **Row Level Security (RLS)** (データアクセス制御)
- **Supabase Storage** (画像アップロード)

### 開発ツール

- **ESLint 9.22.0** + **TypeScript ESLint** (コード品質)
- **Prettier 3.5.3** (コードフォーマット)
- **Vite Plugin React 4.3.4** (React最適化)

## システム要件・機能仕様

### 1. 認証・ユーザー管理

- Supabase Auth による認証システム
- ユーザープロフィール（ユーザー名、アバター、統計情報）
- 会員グレード管理（無料/スタンダード/プラチナ/ダイヤモンド）

### 2. コミュニティ・投稿システム

- **コミュニティ**: 既存の `communities` テーブルを活用（ジャンル別スペース）
- **ポスト投稿**: 2択投票（賛成/反対、A/B等）を含む議題投稿
- **ネスト構造**: 最大3段階までの投稿ネスト対応（parent_post_id使用）
- **メディア対応**: テキスト・画像のみ（image_url, avatar_url活用）

### 3. 投票・説得システム

- **投票ルール**:
  - 初回投票 + 説得タイム中の1回変更（合計2回まで）
  - 説得タイムは投票締切1時間前から開始
- **説得機能**: 投稿主が説得タイム中に追加意見投稿可能
- **リアルタイム結果表示**: 投票結果の即座反映・棒グラフ表示

### 4. コメント・評価システム

- ポストへのコメント機能（既存 `comments` テーブル活用）
- コメントのUpvote/Downvote（既存 `comment_votes` テーブル活用）
- コメントのネスト構造（parent_comment_id使用）
- リアクション数によるコメント優先表示
- 共感ポイント・説得力スコアの算出

### 5. ポイント・スコアシステム

#### ポイント獲得

- 他人の投稿に投票: +1ポイント
- 他人の投稿にコメント: +0.5ポイント
- ポストの自動拡散達成: +10ポイント

#### ポイント消費

- 投稿の優先表示: -50ポイント
- 1日投稿制限解除: -30ポイント
- スペース作成（2つ目以降）: -100ポイント

#### スコアシステム

- **説得力スコア**: 説得により他ユーザーの投票変更を促した数・割合
- **共感ポイント**: 投稿・コメントのUpvote/Downvote、投票参加数
- コミュニティごとの独立管理（community_id使用）
- ランキング・バッジシステム

### 6. 会員制度・収益化

| グレード     | 月額料金 | 1日投稿数 | 優先表示チケット | 説得力スコア倍率 | その他特典               |
| ------------ | -------- | --------- | ---------------- | ---------------- | ------------------------ |
| 無料会員     | 0円      | 2投稿     | なし             | 1.0倍            | -                        |
| スタンダード | 500円    | 5投稿     | 月3枚            | 1.05倍           | スコアバッジ             |
| プラチナ     | 1,200円  | 15投稿    | 月10枚           | 1.10倍           | スコアバッジ             |
| ダイヤモンド | 2,500円  | 無制限    | 月30枚           | 1.20倍           | 限定バッジ・優先サポート |

### 7. フィード・発見機能

- **リアルタイム投票フィード**: 盛り上がっている投票のランキング表示
- **自動拡散システム**: 一定投票数を超えたポストのみ自動拡散
- **トレンド表示**: スペース別・全体の人気投票

## データベース設計（Supabase）

### 現在のテーブル構造

```sql
-- 既存テーブル（現在の構造）
communities (
  id int8 primary key,
  created_at timestamptz,
  name text,
  description text
)

posts (
  id int8 primary key,
  created_at timestamptz,
  title text,
  content text,
  image_url text,
  avatar_url text,
  community_id int8 references communities(id)
)

votes (
  id int8 primary key,
  created_at timestamptz,
  post_id int8 references posts(id),
  user_id text,
  vote int4
)

comments (
  id int8 primary key,
  created_at timestamptz,
  post_id int8 references posts(id),
  content text,
  user_id text,
  author text,
  parent_comment_id int8 references comments(id) -- ネスト構造
)

comment_votes (
  id int8 primary key,
  created_at timestamptz,
  user_id text,
  vote int4,
  comment_id int8 references comments(id)
)
```

### 必要な追加テーブル・カラム

```sql
-- ユーザー管理テーブル（新規作成必要）
users (
  id text primary key, -- 既存のuser_idと統合
  email text,
  username text unique,
  avatar_url text,
  membership_tier text default 'free',
  points integer default 0,
  daily_posts_count integer default 0,
  daily_posts_reset_date date default current_date,
  created_at timestamptz default now()
)

-- postsテーブルに追加必要なカラム
ALTER TABLE posts ADD COLUMN author_id text references users(id);
ALTER TABLE posts ADD COLUMN parent_post_id int8 references posts(id); -- ネスト構造
ALTER TABLE posts ADD COLUMN option_a text;
ALTER TABLE posts ADD COLUMN option_b text;
ALTER TABLE posts ADD COLUMN voting_deadline timestamptz;
ALTER TABLE posts ADD COLUMN persuasion_start_time timestamptz;
ALTER TABLE posts ADD COLUMN is_priority boolean default false;
ALTER TABLE posts ADD COLUMN auto_shared boolean default false;

-- votesテーブルの修正
ALTER TABLE votes ALTER COLUMN user_id TYPE text;
ALTER TABLE votes ADD COLUMN choice text; -- 'A' or 'B' or 'for' or 'against'
ALTER TABLE votes ADD COLUMN is_changed boolean default false;
ALTER TABLE votes ADD COLUMN original_vote_time timestamptz;

-- commentsテーブルの修正
ALTER TABLE comments ADD COLUMN upvotes integer default 0;
ALTER TABLE comments ADD COLUMN downvotes integer default 0;

-- 新規テーブル
user_scores (
  id bigserial primary key,
  user_id text references users(id),
  community_id int8 references communities(id),
  persuasion_score integer default 0,
  empathy_points integer default 0,
  updated_at timestamptz default now()
)

user_achievements (
  id bigserial primary key,
  user_id text references users(id),
  achievement_type text,
  achievement_data jsonb,
  earned_at timestamptz default now()
)

priority_display_tickets (
  id bigserial primary key,
  user_id text references users(id),
  remaining_tickets integer default 0,
  monthly_reset_date date default date_trunc('month', current_date),
  created_at timestamptz default now()
)
```

### リアルタイム機能設定

- 投票結果の即座反映
- コメント・リアクションの即座反映
- フィードの動的更新

## フロントエンド構成

### 主要コンポーネント構造

```
src/
├── components/
│   ├── auth/
│   ├── communities/
│   ├── posts/
│   ├── voting/
│   ├── comments/
│   ├── feed/
│   └── common/
├── pages/
├── hooks/
├── utils/
├── types/
└── lib/
    └── supabase.ts
```

### 主要機能コンポーネント

- **SpaceCommunityList**: コミュニティ一覧・作成
- **PostEditor**: 投稿作成・編集
- **VotingInterface**: 投票UI・結果表示
- **CommentSection**: コメント表示・投稿（ネスト対応）
- **RealtimeFeed**: リアルタイム投票フィード
- **UserDashboard**: ユーザー統計・スコア表示

## 開発状況・実装済み機能

### ✅ 完全実装済み (フェーズ1-2: コア機能完了)

#### 認証・ユーザー管理システム

- **Google OAuth認証** (Supabase Auth 完全統合)
- **ユーザー状態管理** (AuthProvider + useAuth カスタムフック)
- **自動ログイン/ログアウト機能**
- **認証状態に基づくUI制御**
- **プロフィールページ機能** (ProfilePage.tsx - ユーザー情報・統計・投稿一覧表示)

#### 投稿・コミュニティシステム

- **投稿作成・表示・詳細機能** (CreatePost, PostList, PostItem, PostDetail)
- **コミュニティ/スペース完全機能** (CommunityList, CommunityItem, CreateCommunity)
- **画像アップロード機能** (Supabase Storage: post-images バケット)
- **投稿フィルタリング** (すべて/期限間近/人気/新着タブ)
- **フォームバリデーション** (React Hook Form + Zod)

#### 投票システム (コア機能)

- **リアルタイム投票機能** (賛成/反対投票)
- **楽観的UI更新** (TanStack Query による最適化)
- **投票期限管理** (vote_deadline 完全実装)
- **説得タイム機能** (期限1時間前から投稿者コメント可能)
- **投票結果視覚化** (VoteGageBar による棒グラフ表示)
- **投票統計リアルタイム更新**

#### コメント・評価システム

- **コメント投稿・表示機能** (CommentSection 完全実装)
- **ネスト構造対応** (親子関係コメント: parent_comment_id)
- **コメント投票機能** (CommentVotes: Upvote/Downvote)
- **説得コメント機能** (投稿者専用コメント: is_persuasion_comment)
- **コメント数リアルタイム更新**

#### UI/UXシステム

- **Radix UI コンポーネント統合** (アクセシビリティ対応)
- **Tailwind CSS 4.1.4** (完全レスポンシブデザイン)
- **モダンナビゲーション** (Navbar, SideBar, RightPanel)
- **プロフィールページナビゲーション** (Navbar アバターからプロフィールページへのリンク)
- **アニメーション効果** (スムーズなトランジション)
- **ダークモード対応** (部分実装)

#### 状態管理・データフェッチ (完全最適化)

- **Jotai 原子的状態管理** (PostAtom, CommentVoteAtom)
- **TanStack Query 5.74.4** (サーバー状態・キャッシュ・楽観的更新)
- **カスタムフック** (useHandlePost, useHandleVotes 完全実装)
- **エラーハンドリング** (ErrorMessage, Loading コンポーネント)

#### データベース・バックエンド

- **Supabase完全統合** (PostgreSQL + Auth + Storage + Real-time)
- **テーブル構造完成** (posts, votes, comments, communities, comment_votes)
- **SQLファンクション** (get_posts_with_counts: 投票数・コメント数集計)
- **Row Level Security (RLS)** 基本実装済み

### ⚠️ 部分実装・改善対象

#### フィルタリング・検索機能

- **基本フィルタリング実装済み** (タブ機能)
- **高度な検索機能**: 全文検索・詳細フィルター未実装
- **ソート機能**: 人気度・新着以外の詳細ソート未実装

#### ユーザー機能

- **プロフィール表示機能**: 完全実装済み
  - 自分のプロフィール(/profile)・他ユーザープロフィール(/profile/:userId)対応
  - ユーザー統計情報表示（投稿数、投票数、コメント数、参加日）
  - ユーザー別投稿一覧表示
- **プロフィール編集**: 未実装

### ❌ 未実装機能

#### 投稿ネスト機能

- **投稿の3段階ネスト構造**: 投稿は最大3段階までネスト可能（例：本ポスト→賛成と答えた人に派生質問→さらに深掘り質問）
- parent_post_id を活用した階層構造表示
- ネストレベルに応じたUI表示調整
- 派生投稿作成機能

#### リアルタイム通知システム

- Supabase Real-time 通知機能
- 投票・コメント通知
- 説得タイム開始通知

#### ポイント・スコアシステム

- ユーザーポイント管理
- 説得力スコア算出
- 共感ポイント機能
- ランキングシステム

#### 会員制度・収益化

- 会員グレード管理
- 投稿制限機能
- 優先表示チケット
- 決済システム統合

#### 管理・モデレーション機能

- 投稿削除・編集機能
- 不適切コンテンツ管理
- ユーザー管理機能

#### パフォーマンス最適化

- ページネーション実装
- 画像最適化・CDN設定
- SEO最適化
- PWA対応

### 📋 今後の開発優先順位

#### 🚀 **フェーズ3: 高度な機能拡張** (優先度: 高)

1. **リアルタイム通知システム**

   - Supabase Real-time 通知機能
   - 投票・コメント・説得タイム開始通知
   - プッシュ通知連携

2. **ポイント・スコアシステム**

   - usersテーブル作成・統合
   - ポイント獲得・消費システム
   - 説得力スコア・共感ポイント算出
   - ランキング・バッジシステム

3. **ユーザー機能強化**
   - プロフィール編集機能
   - ユーザー統計・スコア詳細表示
   - ユーザーバッジ・実績システム

#### 🔧 **フェーズ4: パフォーマンス・UX改善** (優先度: 中)

1. **パフォーマンス最適化**

   - ページネーション実装
   - 無限スクロール
   - 画像最適化・CDN設定
   - SEO最適化

2. **検索・フィルタリング強化**

   - 全文検索機能
   - 詳細フィルター
   - ソート機能拡張

3. **PWA・モバイル対応**
   - Service Worker実装
   - オフライン対応
   - モバイル専用UI改善

#### 💎 **フェーズ5: 会員制度・収益化** (優先度: 中)

1. **会員グレードシステム**

   - 会員グレード管理
   - 投稿制限・優先表示機能
   - 決済システム統合 (Stripe)

2. **プレミアム機能**
   - 優先表示チケット
   - 高度な統計・分析
   - 限定バッジ・特典

#### 🛠️ **フェーズ6: 管理・運用システム** (優先度: 低)

1. **管理・モデレーション機能**

   - 投稿削除・編集機能
   - 不適切コンテンツ管理
   - ユーザー管理・制裁システム

2. **運用・監視システム**

   - 監視・分析システム
   - エラートラッキング
   - パフォーマンス監視

3. **API・外部連携**
   - REST API公開
   - 外部SNS連携
   - Webhook統合

## 既存テーブルとの統合ポイント

- `communities` テーブルを「スペース」として活用
- `votes.vote` (int4) を選択肢管理に拡張（A/B, 賛成/反対）
- `comments` のネスト構造（parent_comment_id）を活用
- `comment_votes` でコメント評価システムを構築
- 新規 `users` テーブルで既存の `user_id` (text) を統合

## セキュリティ・パフォーマンス要件

- Row Level Security (RLS) によるデータアクセス制御
- 投稿・投票の制限・レート制限
- 画像アップロードの制限・検証
- リアルタイム機能の最適化
- 大量データでのパフォーマンス考慮

## デプロイ・運用

- Vercel/Netlify でのフロントエンドデプロイ
- Supabase での自動スケーリング
- 監視・分析システムの実装

## 開発時の注意点

- TypeScript の型安全性を重視
- Supabase の制限・課金体系を考慮
- リアルタイム機能のコネクション管理
- モバイル対応の responsive design
- アクセシビリティの確保
