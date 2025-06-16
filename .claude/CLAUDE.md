# Conversation Guidelines

- 常に日本語で会話する

# 投票・議論プラットフォーム開発プロジェクト

## プロジェクト概要

ユーザーがジャンル別の「スペース」を作成し、2択投票で意見を募り議論できるプラットフォーム。リアルタイムの投票結果表示、説得機能、ポイント制度を含む高機能な投票・議論システム。

## 技術スタック

- **フロントエンド**: React 19, TypeScript
- **バックエンド**: Supabase (Database, Auth, Real-time)
- **UI/UX**: Modern responsive design
- **リアルタイム機能**: Supabase Real-time subscriptions

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

## 開発優先順位

1. **フェーズ1**: 既存構造の拡張・ユーザー管理・基本投票機能
2. **フェーズ2**: コメント評価・ポイントシステム・投稿制限
3. **フェーズ3**: 説得機能・スコアシステム・ランキング
4. **フェーズ4**: 会員制度・収益化・優先表示機能
5. **フェーズ5**: リアルタイムフィード・拡散システム

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
