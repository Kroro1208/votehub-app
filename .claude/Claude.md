# Conversation Guidelines

- 常に日本語で会話する

## ユーザー発言の類型と対応方針

「〜ですか？」という質問に対して、「間違っていました」や「正します」という反応はせず、聞かれたことに回答してください。

ユーザーの発言には大きく次に示す類型があり、そのいずれかを判断の上でタスクを遂行してください。どれに当てはまるかわからない場合はそのままにせず、ユーザーにたずねてから回答やタスクの実行をしてください。

### 質問

- **ユーザーの意図**: 質問への回答を求めています。間違いをしていたり実装の修正を求めているわけではありません。
- **口調**: 「〜ですか？」「〜なの？」
- **対応**: 質問に対して適切な回答を提供する

### 依頼

- **ユーザーの意図**: 実装の修正やドキュメントの編集を依頼しています。
- **口調**: 「～してもらえますか？」「～はできますか？」「～は可能ですか？」
- **対応**:
  - コストやリスクの観点から問題がないという判断であれば依頼された内容を実行してください
  - 問題があると判断した場合、その内容と重要度をユーザーに伝えて判断を仰いでください

### 指示

- **ユーザーの意図**: 実装の修正やドキュメントの編集を指示しています。
- **口調**: 「～してください」「～しなさい」
- **対応**:
  - コストやリスクの観点から"重大な"問題がない限り、依頼された内容を遂行してください
  - 重大な問題があると判断した場合、その内容をユーザーに伝えて判断を仰いでください

### 命令

- **ユーザーの意図**: 怒っていて、今すぐ実装の修正を求めています。
- **口調**: 「～しろ」
- **対応**: 重大なリスクがない限り、即座に要求を実行する

# 投票・議論プラットフォーム開発プロジェクト

## プロジェクト概要

ユーザーがジャンル別の「スペース」を作成し、2択投票で意見を募り議論できるプラットフォーム。リアルタイムの投票結果表示、説得機能、ポイント制度を含む高機能な投票・議論システム。

### 🎯 現在のプロジェクト状況 (2025年7月)

**✅ 開発進捗: フェーズ2完了 + エンゲージメント機能実装完了 + 通知システム修正完了**

- **認証・投稿・投票・コメント機能**: 完全実装
- **ネスト投稿機能**: 完全実装（3階層対応）- GitHub Issue #12 95%完了
- **ポイントシステム**: **新規実装完了 (2025-06-28)** - 投票・コメント・自動拡散ポイント
- **通知システム**: **実装完了・バグ修正完了 (2025-07-01)** - 説得タイム・期限終了・説得コメント通知
- **ブックマーク機能**: **新規実装完了 (2025-06-25)**
- **タグ機能**: **バグ修正完了 (2025-06-28)**
- **説得コメント機能**: **通知機能追加完了 (2025-06-28)**
- **投稿削除機能**: **外部キー制約問題修正完了 (2025-07-01)**
- **UI/UX・レスポンシブデザイン**: 完成
- **Supabaseフル統合**: 完了（Edge Functions含む）
- **モダンな技術スタック**: React 19 + TypeScript + Tailwind CSS

**🔥 最新の重要修正 (2025-07-01)**

- **GitHub Issue #35 通知機能のバグ修正**: 完全解決
  - 期限終了時の投票者通知機能復旧
  - 派生質問作成時の通知機能復旧
  - データベース型不一致問題修正
  - 投稿削除時の外部キー制約問題修正

## 🏢 大手企業売却戦略・実装ロードマップ

### 📊 売却に向けた戦略概要

**目標**: 大手企業への技術資産・ユーザーベース売却
**タイムライン**:

- フェーズ3完了後 → 本格運用開始 (2025年8月)
- フェーズ4完了後 → エンタープライズ対応 (2025年10月)
- フェーズ5完了後 → 売却準備完了 (2025年12月)

### 🎯 売却価値の最大化戦略

#### 1. **技術的差別化要因**

- **独自の説得タイム機能**: 投票の質向上メカニズム
- **3階層ネスト投稿**: 深い議論を促進する構造
- **リアルタイムエンゲージメント**: Supabaseによる即座反映
- **AI統合による高度分析**: 投票パターン・議論品質の自動評価

#### 2. **ビジネス価値**

- **月間アクティブユーザー（MAU）目標**: 10万人以上
- **日次投票数目標**: 5万票以上
- **コミュニティ数目標**: 1,000スペース以上
- **収益化実績**: 月額サブスクリプション収益

#### 3. **エンタープライズ適用可能性**

- **企業内意思決定支援ツール**として展開可能
- **カスタマーフィードバック収集**プラットフォーム
- **従業員エンゲージメント**測定システム

### 🚀 フェーズ別実装計画

#### **フェーズ3: プロダクト完成・運用準備** (2025年7月-8月)

**目標**: 最低限運用可能な完成品

**必須実装項目**:

1. **セキュリティ強化** (GitHub Issue #101)

   - 派生質問投票制限ロジック完成
   - RLSポリシー完全実装
   - API攻撃対策

2. **管理機能** (GitHub Issue #102)

   - 管理者ダッシュボード
   - 不適切コンテンツ管理
   - ユーザー制裁システム

3. **パフォーマンス最適化** (GitHub Issue #103)

   - データベースインデックス最適化
   - 画像CDN統合
   - ページネーション実装

4. **監視・分析システム** (GitHub Issue #104)
   - エラートラッキング (Sentry)
   - ユーザー行動分析 (Google Analytics 4)
   - パフォーマンス監視

**リリース判定基準**:

- セキュリティペネトレーションテスト合格
- 負荷テスト: 1,000同時ユーザー対応
- バグゼロ状態での1週間連続運用

#### **フェーズ4: エンタープライズ対応** (2025年8月-10月)

**目標**: 大規模ユーザー獲得・企業利用対応

**実装項目**:

1. **スケーラビリティ強化** (GitHub Issue #105)

   - マルチリージョン対応
   - CDN統合 (Cloudflare)
   - データベース読み取りレプリカ

2. **プレミアム機能** (GitHub Issue #106)

   - 会員制度システム完全実装
   - Stripe決済統合
   - 企業向けカスタムスペース

3. **AI機能統合** (GitHub Issue #107)

   - GPT-4による投票分析
   - 自動コンテンツモデレーション
   - 議論品質スコア算出

4. **API公開・外部連携** (GitHub Issue #108)
   - REST API v1.0公開
   - Webhook統合
   - 外部SNS連携強化

#### **フェーズ5: 売却準備・価値最大化** (2025年10月-12月)

**目標**: 売却価値最大化・デューデリジェンス対応

**実装項目**:

1. **エンタープライズセキュリティ** (GitHub Issue #109)

   - SOC2 Type II対応
   - GDPR完全準拠
   - 企業SSO統合 (SAML, OAuth)

2. **高度分析・レポート機能** (GitHub Issue #110)

   - 管理者向け詳細分析ダッシュボード
   - カスタムレポート生成
   - データエクスポート機能

3. **技術文書・運用マニュアル** (GitHub Issue #111)

   - アーキテクチャ文書完備
   - API文書自動生成
   - 運用手順書作成

4. **事業継続性対応** (GitHub Issue #112)
   - 災害復旧計画 (DR)
   - 自動バックアップシステム
   - 冗長化構成

### 💰 収益化・KPI目標

#### **運用開始時点 (2025年8月)**

- **ユーザー数**: 1,000人
- **DAU**: 100人
- **投稿数**: 日次50投稿
- **投票数**: 日次500票

#### **売却準備時点 (2025年12月)**

- **ユーザー数**: 100,000人
- **MAU**: 50,000人
- **DAU**: 10,000人
- **月次投票数**: 1,000,000票
- **月次収益**: $50,000 (サブスクリプション + 企業利用)

### 🔒 売却時の技術的価値

#### **差別化技術**

- **説得タイム機能**: 特許出願可能な独自メカニズム
- **ネスト投票システム**: 競合にない深い議論構造
- **リアルタイム民主主義**: 瞬時フィードバックシステム

#### **スケーラブルアーキテクチャ**

- **Supabase基盤**: 月間100万ユーザー対応可能
- **React 19**: 最新技術スタックで将来性確保
- **TypeScript**: 大規模開発・保守性

#### **事業拡張可能性**

- **BtoB展開**: 企業内意思決定支援
- **政府・自治体**: 住民参加型民主主義
- **教育機関**: 学生議論・意見収集

### ⚠️ 売却前必須対応事項

#### **法務・コンプライアンス**

- **プライバシーポリシー**: 完全版作成
- **利用規約**: 企業利用条項追加
- **特許出願**: 説得タイム機能の知的財産保護

#### **技術監査対応**

- **セキュリティ監査**: 第三者ペネトレーションテスト
- **コード品質**: SonarQube品質スコア90%以上
- **テストカバレッジ**: 80%以上

#### **事業データ整備**

- **詳細ユーザー分析**: コホート分析・LTV算出
- **競合分析**: 市場ポジショニング明確化
- **財務データ**: P&L、CAC、チャーン率

この戦略により、技術的価値とビジネス価値を最大化し、大手企業にとって魅力的な買収対象となることを目指します。

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
- **Jotai 2.12.5** (グローバル状態管理)

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
- **ネスト構造**: **最大3段階までの投稿ネスト完全実装済み**（parent_post_id使用）
- **派生質問機能**: **投票者絞り込み対応済み**（賛成者向け/反対者向け/全員向け）
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

### 現在のテーブル構造（2025-06-28更新）

```sql
-- 現在実装済みテーブル構造
CREATE TABLE communities (
    id int8 PRIMARY KEY,
    name text NOT NULL,
    description text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE posts (
    id int8 PRIMARY KEY,
    title text NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    image_url text,
    avatar_url text,
    vote_deadline timestamptz,
    community_id int8 REFERENCES communities(id),
    user_id text NOT NULL,
    parent_post_id int8 REFERENCES posts(id), -- ネスト投稿の親ID
    nest_level integer DEFAULT 0 CHECK (nest_level >= 0 AND nest_level <= 3), -- ネストレベル
    target_vote_choice integer CHECK (target_vote_choice IN (-1, 1)) -- 派生質問のターゲット投票選択
);

CREATE TABLE votes (
    id int8 PRIMARY KEY,
    post_id int8 NOT NULL REFERENCES posts(id),
    user_id text NOT NULL,
    vote int4 NOT NULL CHECK (vote IN (1, -1)), -- 1:賛成, -1:反対
    created_at timestamptz DEFAULT now(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE comments (
    id int8 PRIMARY KEY,
    post_id int8 NOT NULL REFERENCES posts(id),
    parent_comment_id int8 REFERENCES comments(id), -- ネスト構造
    content text NOT NULL,
    user_id text NOT NULL,
    author text NOT NULL, -- 表示名
    created_at timestamptz DEFAULT now(),
    is_persuasion_comment boolean DEFAULT false -- 説得コメント識別
);

-- comment_votesテーブル（コメント評価システム - 実装済み）
CREATE TABLE comment_votes (
    id int8 PRIMARY KEY,
    comment_id int8 NOT NULL REFERENCES comments(id),
    user_id text NOT NULL,
    vote int4 NOT NULL CHECK (vote IN (1, -1)), -- 1:Upvote, -1:Downvote
    created_at timestamptz DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

-- ✅ 2025-06-28実装完了: 新規テーブル
-- tagsテーブル（タグ機能 - 修正完了）
CREATE TABLE tags (
    id bigserial PRIMARY KEY,
    name text NOT NULL,
    community_id int8 NOT NULL REFERENCES communities(id),
    created_at timestamptz DEFAULT now(),
    UNIQUE(name, community_id)
);

-- bookmarksテーブル（ブックマーク機能 - 新規実装）
CREATE TABLE bookmarks (
    id bigserial PRIMARY KEY,
    user_id text NOT NULL,
    post_id int8 NOT NULL REFERENCES posts(id),
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, post_id)
);

-- user_pointsテーブル（ユーザーポイント管理 - 新規実装）
CREATE TABLE user_points (
    id bigserial PRIMARY KEY,
    user_id text UNIQUE NOT NULL,
    points integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- point_transactionsテーブル（ポイント履歴管理 - 新規実装）
CREATE TABLE point_transactions (
    id bigserial PRIMARY KEY,
    user_id text NOT NULL,
    points_change integer NOT NULL,
    transaction_type text NOT NULL CHECK (transaction_type IN ('vote', 'comment', 'auto_spread')),
    related_post_id int8 REFERENCES posts(id),
    related_comment_id int8 REFERENCES comments(id),
    created_at timestamptz DEFAULT now()
);

-- notificationsテーブル（通知システム - 新規実装）
CREATE TABLE notifications (
    id bigserial PRIMARY KEY,
    user_id text NOT NULL,
    type text NOT NULL CHECK (type IN ('persuasion_time_start', 'vote_deadline_passed', 'persuasion_comment_added', 'auto_spread_achieved')),
    title text NOT NULL,
    message text NOT NULL,
    related_post_id int8 REFERENCES posts(id),
    related_comment_id int8 REFERENCES comments(id),
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- SQLファンクション: 投稿の統計情報取得（ネスト情報とターゲット投票選択を含む）
CREATE OR REPLACE FUNCTION get_posts_with_counts()
RETURNS TABLE (
    id int8,
    title text,
    content text,
    created_at timestamptz,
    image_url text,
    avatar_url text,
    vote_deadline timestamptz,
    community_id int8,
    user_id text,
    parent_post_id int8,
    nest_level integer,
    target_vote_choice integer,
    vote_count int8,
    comment_count int8
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.content,
        p.created_at,
        p.image_url,
        p.avatar_url,
        p.vote_deadline,
        p.community_id,
        p.user_id,
        p.parent_post_id,
        COALESCE(p.nest_level, 0) as nest_level,
        p.target_vote_choice,
        COALESCE(v.vote_count, 0) as vote_count,
        COALESCE(c.comment_count, 0) as comment_count
    FROM posts p
    LEFT JOIN (
        SELECT post_id, COUNT(*) as vote_count
        FROM votes
        GROUP BY post_id
    ) v ON p.id = v.post_id
    LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count
        FROM comments
        GROUP BY post_id
    ) c ON p.id = c.post_id
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- パフォーマンス最適化インデックス
CREATE INDEX idx_posts_community_id ON posts(community_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_votes_post_id ON votes(post_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);
```

### フェーズ3実装予定テーブル・カラム

```sql
-- 🚀 フェーズ3で実装予定: ユーザー管理システム（会員制度）
CREATE TABLE users (
    id text PRIMARY KEY, -- Supabase AuthのUUIDと統合
    email text UNIQUE NOT NULL,
    username text UNIQUE,
    avatar_url text,
    membership_tier text DEFAULT 'free' CHECK (membership_tier IN ('free', 'standard', 'platinum', 'diamond')),
    daily_posts_count integer DEFAULT 0,
    daily_posts_reset_date date DEFAULT current_date,
    created_at timestamptz DEFAULT now()
);

-- 🚀 フェーズ3で実装予定: コミュニティ別スコアシステム
CREATE TABLE user_scores (
    id bigserial PRIMARY KEY,
    user_id text REFERENCES users(id),
    community_id int8 REFERENCES communities(id),
    persuasion_score integer DEFAULT 0,
    empathy_points integer DEFAULT 0,
    total_votes_cast integer DEFAULT 0,
    total_votes_received integer DEFAULT 0,
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, community_id)
);

CREATE TABLE user_achievements (
    id bigserial PRIMARY KEY,
    user_id text REFERENCES users(id),
    achievement_type text NOT NULL,
    achievement_data jsonb,
    earned_at timestamptz DEFAULT now()
);

CREATE TABLE priority_display_tickets (
    id bigserial PRIMARY KEY,
    user_id text REFERENCES users(id),
    remaining_tickets integer DEFAULT 0,
    monthly_reset_date date DEFAULT date_trunc('month', current_date),
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- ✅ 2025-06-18実装完了: 投稿ネスト機能 (GitHub Issue #12 - 95%完了)
-- postsテーブルに追加済みカラム
-- ✅ parent_post_id int8 REFERENCES posts(id) - 実装済み
-- ✅ nest_level integer DEFAULT 0 CHECK (nest_level >= 0 AND nest_level <= 3) - 実装済み
-- ✅ target_vote_choice integer CHECK (target_vote_choice IN (-1, 1)) - 実装済み
-- ❌ 投票制限ロジック - 未実装（残作業）
--
-- 🔧 フェーズ4で実装予定: 追加投稿機能
-- ALTER TABLE posts ADD COLUMN option_a text;
-- ALTER TABLE posts ADD COLUMN option_b text;
-- ALTER TABLE posts ADD COLUMN is_priority boolean DEFAULT false;
-- ALTER TABLE posts ADD COLUMN auto_shared boolean DEFAULT false;

-- 🔧 フェーズ4で実装予定: 投票機能拡張
-- votesテーブルに追加予定カラム
-- ALTER TABLE votes ADD COLUMN choice text; -- 'A' or 'B' or 'for' or 'against'
-- ALTER TABLE votes ADD COLUMN is_changed boolean DEFAULT false;
-- ALTER TABLE votes ADD COLUMN original_vote_time timestamptz;
-- ALTER TABLE votes ADD COLUMN persuasion_change_time timestamptz;

-- ✅ 2025-06-28実装完了: Edge Functions
-- 自動拡散チェッカー（100票達成でポイント付与）
-- Supabaseファンクション: persuasion_time_notification_trigger（説得タイム開始通知）
-- Supabaseファンクション: vote_deadline_notification_trigger（投票期限終了通知）

-- インデックス追加（パフォーマンス最適化）
CREATE INDEX idx_tags_community_id ON tags(community_id);
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_post_id ON bookmarks(post_id);
CREATE INDEX idx_user_points_user_id ON user_points(user_id);
CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_type ON point_transactions(transaction_type);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- 将来実装予定インデックス
-- CREATE INDEX idx_users_email ON users(email);
-- CREATE INDEX idx_users_username ON users(username);
-- CREATE INDEX idx_user_scores_user_community ON user_scores(user_id, community_id);
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
│   │   ├── CreatePost.tsx          (既存)
│   │   ├── CreateNestedPost.tsx    (NEW - 2025-06-18)
│   │   ├── PostList.tsx            (既存 - ネスト機能追加)
│   │   ├── PostDetail.tsx          (既存 - ネスト機能追加)
│   │   ├── NestedPostItem.tsx      (NEW - 2025-06-18)
│   │   └── PostContentDisplay.tsx  (既存 - 強化)
│   ├── voting/
│   ├── comments/
│   ├── feed/
│   └── common/
├── pages/
├── hooks/
├── utils/
│   └── schema.tsx                  (既存 - ネスト機能追加)
├── types/
└── lib/
    └── supabase.ts
```

### 主要機能コンポーネント

- **SpaceCommunityList**: コミュニティ一覧・作成
- **CreatePost/CreateNestedPost**: 投稿作成・編集（**ネスト対応完了**）
- **PostList/NestedPostItem**: 投稿表示（**3階層ネスト完全対応**）
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
- **ネスト投稿システム完全実装** (CreateNestedPost, NestedPostItem - **2025-06-18新規追加**)
- **3階層ネスト構造対応** (parent_post_id, nest_level完全実装)
- **投票者ターゲット機能** (target_vote_choice: 賛成者向け/反対者向け/全員向け)
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

### ✅ 最新実装完了機能 (2025-07-17)

#### ポイントシステム (**GitHub Issue #13 - 実装完了**)

- **投票ポイント**: 初回投票で1ポイント付与（同一投稿1回限り）**✅完全実装済み**
- **コメントポイント**: 初回コメントで0.5ポイント付与（同一投稿1回限り）**✅完全実装済み**
- **自動拡散ポイント**: 100票達成で投稿者に10ポイント付与**✅完全実装済み**
- **ポイント履歴管理**: point_transactionsテーブルで詳細履歴管理**✅完全実装済み**
- **リアルタイム表示**: useUserPointsフックでポイント表示・更新**✅完全実装済み**
- **Edge Functions**: 自動拡散チェッカーで100票達成検出**✅完全実装済み**

#### 通知システム (**実装完了**)

- **説得タイム開始通知**: 投票者への一括通知機能**✅完全実装済み**
- **投票期限終了通知**: 参加者への結果確認通知**✅完全実装済み**
- **説得コメント通知**: 投稿者の説得コメント投稿時に投票者へ通知**✅完全実装済み**
- **通知UI**: NotificationDropdownで未読数表示・一覧表示**✅完全実装済み**
- **リアルタイム同期**: useNotificationsフックで状態管理**✅完全実装済み**

#### ブックマーク機能 (**実装完了**)

- **投稿ブックマーク**: BookmarkButtonでワンクリック追加・削除**✅完全実装済み**
- **ブックマーク一覧**: /bookmarksページで時系列表示**✅完全実装済み**
- **状態管理**: useBookmarksフックでリアルタイム同期**✅完全実装済み**

#### タグ機能 (**バグ修正完了**)

- **コミュニティ別タグ管理**: 重複チェック・ID自動生成**✅修正完了**
- **タグ作成UI**: CreateCommunityでタグ作成機能**✅実装済み**

#### ネスト投稿機能 (**GitHub Issue #12 - 100%実装完了**)

- **投稿の3段階ネスト構造**: 投稿は最大3段階までネスト可能**✅完全実装済み**
- **parent_post_id を活用した階層構造表示**: **✅完全実装済み**
- **ネストレベルに応じたUI表示調整**: **✅完全実装済み**
- **派生投稿作成機能**: **✅完全実装済み**
- **新規コンポーネント**: CreateNestedPost.tsx, NestedPostItem.tsx **✅完全実装済み**
- **投票者ターゲット機能**: 賛成者向け/反対者向け/全員向けの絞り込み**✅100%実装完了**
  - ✅ UI選択機能・データベーススキーマ実装済み
  - ✅ 投票制限ロジック完全実装済み（VoteButton.tsx, useHandleVotes.ts, PostDetail.tsx）
  - ✅ 派生質問の投票権限チェック機能実装済み
  - ✅ 投票実行時の権限チェック機能実装済み

#### ユーザー評価システム (**GitHub Issue #43 - 新規実装完了**)

- **品質度スコア**: 投稿の質を多角的に評価するシステム**✅完全実装済み**
  - 投票効率係数、議論活発係数、説得効果係数、継続関心係数
  - S/A/B/C/D/Fランク評価システム
- **共感ポイント**: ユーザーのコミュニティ貢献度を評価するシステム**✅完全実装済み**
  - 投稿評価係数、コメント評価係数、参加継続係数、コミュニティ貢献係数
  - レジェンド/マスター/エキスパート/アクティブ/貢献者/参加者/新規ランク
- **データベース設計**: user_quality_scores, user_empathy_points テーブル**✅完全実装済み**
- **ランキングシステム**: 品質度スコア + 共感ポイント総合ランキング**✅完全実装済み**
- **ランキングページ**: UserRankingPage.tsx で美しいUI実装**✅完全実装済み**

#### UI/UX改善 (**2025-07-17実装完了**)

- **プロフィールページUI改善**: グリッドレイアウトに変更**✅完全実装済み**
- **説得タイム投票確認**: 同じ投票でも確認モーダル表示**✅完全実装済み**
- **TagPostsページUI改善**: 3列グリッドレイアウト、統一デザイン**✅完全実装済み**
- **ダークモード対応**: 全ページ統一**✅完全実装済み**
  - HomePage, UserRankingPage, TagPostsPage, SettingsPage
  - TabSection, HeaderStatus のテキスト視認性改善
- **ユーザーランキングページ**: コンパクトなカードデザイン**✅完全実装済み**

### ❌ 未実装・次期開発対象

#### 高優先度（次期実装対象）

- **コメント共感・説得力スコア**: コメント評価システム（Issue #2）**❌未実装**
- **プロフィール編集機能**: ユーザー情報・アバター編集**❌未実装**

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

## 🎯 現在のGitHub Issue状況

### 📊 最新GitHub Issue状況 (2025-07-06更新)

#### ✅ 最近完了したIssue

#### **Issue #35**: "通知機能のバグ修正" (**2025-07-01完了**)

- **実装状況**: 100%完了
- **修正内容**:
  - 期限終了時の投票者通知機能復旧
  - 派生質問作成時の通知機能復旧
  - データベース型不一致問題修正（TEXT vs UUID）
  - 投稿削除時の外部キー制約問題修正
- **重要度**: 緊急 - システムの根幹機能修正

#### **Issue #13**: "ユーザーポイント機能" (**2025-06-28完了**)

- **実装状況**: 100%完了
- **実装内容**: 投票・コメント・自動拡散ポイント、履歴管理、リアルタイム表示
- **新規テーブル**: user_points, point_transactions

#### **Issue #30**: "説得コメント通知機能" (**2025-06-28完了**)

- **実装状況**: 100%完了
- **実装内容**: 説得コメント投稿時の投票者通知、通知UI改善

#### **Issue #19**: "ブックマーク機能" (**2025-06-25完了**)

- **実装状況**: 100%完了
- **実装内容**: 投稿ブックマーク追加・削除、ブックマーク一覧ページ

#### 🔄 現在オープンなIssue

#### **Issue #26**: "stripeを使用した決済機能の設定" (**未実装**)

- **実装状況**: 0%
- **内容**: 決済システム統合
- **優先度**: 低

#### **Issue #25**: "CSRとSSRの適切な使用" (**未実装**)

- **実装状況**: 0%
- **内容**: レンダリング最適化
- **優先度**: 低

#### **Issue #22**: "派生質問のボタン位置検討" (**未実装**)

- **実装状況**: 0%
- **内容**: UI/UX改善
- **優先度**: 低

#### **Issue #16**: "（保留）一番参考にされているコメントについて" (**保留**)

- **実装状況**: 0%
- **内容**: コメント評価システム
- **優先度**: 保留

#### **Issue #6**: "AIの導入" (**未実装**)

- **実装状況**: 0%
- **内容**: AI投票分析・コンテンツフィルタリング・統計
- **優先度**: 低

#### **Issue #2**: "コメントに対して「共感ポイント」「説得力スコア」機能実装" (**未実装**)

- **実装状況**: 0%
- **内容**: コメント評価システム
- **優先度**: 中

### 📋 今後の開発優先順位 (2025-07-06更新)

#### 🚀 **フェーズ3: 高度な評価・分析機能** (優先度: 中)

1. **コメント共感・説得力システム** (**GitHub Issue #2**)

   - 共感ポイント機能実装
   - 説得力スコア算出システム
   - ランキング・バッジシステム
   - コメント評価の可視化

2. **検索・フィルタリング強化**

   - 全文検索機能実装
   - 詳細フィルター（タグ、期間、スコア）
   - ソート機能拡張

3. **ユーザー機能強化**

   - プロフィール編集機能
   - ユーザー統計・スコア詳細表示
   - ユーザーバッジ・実績システム

4. **会員制度システム**
   - usersテーブル統合
   - 会員グレード管理機能
   - 投稿制限・優先表示機能

#### 🤖 **フェーズ4: AI統合** (優先度: 低)

5. **AI機能統合** (**GitHub Issue #6**)
   - AI投票分析・コンテンツ評価
   - 自動統計・トレンド分析
   - コンテンツフィルタリング

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
   - 決済システム統合 (Stripe) - GitHub Issue #26

2. **プレミアム機能**

   - 優先表示チケット
   - 高度な統計・分析
   - 限定バッジ・特典

3. **UI/UX改善**
   - 派生質問のボタン位置検討 (GitHub Issue #22)
   - CSRとSSRの適切な使用 (GitHub Issue #25)

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

## 🎯 ユーザー評価システム設計 (GitHub Issue #43)

### 📊 品質度スコア (Quality Score) システム

**設計理念**: 投稿の質と議論活性化能力を総合的に評価

#### 1. 基本計算式

```
品質度スコア = (投票効率係数 × 40%) + (議論活発係数 × 25%) + (説得効果係数 × 20%) + (継続関心係数 × 15%)
```

#### 2. 各係数の詳細計算

##### **投票効率係数 (40%)**

```javascript
投票効率係数 = (総投票数 / 投票期間日数) × 調整係数

// 調整係数
- 基本係数: 1.0
- 画像添付: +0.1
- 詳細な内容 (300文字以上): +0.1
- 派生質問生成: +0.2
- 自動拡散達成 (100票): +0.5
```

##### **議論活発係数 (25%)**

```javascript
議論活発係数 = (コメント数 × 1.0) + (返信数 × 1.5) + (ネスト投稿数 × 2.0)

// 重み付け理由
- 返信: より深い議論を促進
- ネスト投稿: 新たな論点を創出
```

##### **説得効果係数 (20%)**

```javascript
説得効果係数 = (説得タイム中の投票変更数 / 説得タイム前の投票数) × 10

// 説得タイム機能の価値を反映
- 投票変更を促した能力を評価
- 説得コメントの影響力を測定
```

##### **継続関心係数 (15%)**

```javascript
継続関心係数 = 投票期間全体での投票分布の均等性

// 計算方法
- 投票期間を4等分し、各期間の投票数の分散を計算
- 分散が小さいほど継続的な関心を維持
- 係数 = 10 - (投票分散 / 平均投票数)
```

#### 3. 品質度スコアの段階評価

| スコア範囲 | 評価ランク    | 説明               |
| ---------- | ------------- | ------------------ |
| 90-100     | S (Excellent) | 極めて高品質な投稿 |
| 80-89      | A (Great)     | 高品質な投稿       |
| 70-79      | B (Good)      | 良質な投稿         |
| 60-69      | C (Fair)      | 標準的な投稿       |
| 50-59      | D (Poor)      | 改善が必要な投稿   |
| 0-49       | F (Fail)      | 低品質な投稿       |

### 💝 共感ポイント (Empathy Points) システム

**設計理念**: コミュニティへの総合的な貢献度と他者との関係構築能力を評価

#### 1. 基本計算式

```
共感ポイント = (投稿評価係数 × 30%) + (コメント評価係数 × 25%) + (参加継続係数 × 20%) + (コミュニティ貢献係数 × 15%) + (相互作用係数 × 10%)
```

#### 2. 各係数の詳細計算

##### **投稿評価係数 (30%)**

```javascript
投稿評価係数 = Σ(各投稿の人気度スコア × 品質度重み)

// 人気度スコア計算
人気度スコア = (投票数 × 1.0) + (コメント数 × 0.7) + (ブックマーク数 × 0.5) + (派生質問数 × 1.5)

// 品質度重み
- 品質度スコア S: 2.0倍
- 品質度スコア A: 1.5倍
- 品質度スコア B: 1.2倍
- 品質度スコア C: 1.0倍
- 品質度スコア D: 0.8倍
- 品質度スコア F: 0.5倍
```

##### **コメント評価係数 (25%)**

```javascript
コメント評価係数 = Σ(各コメントのUpvote - Downvote) + 説得成功ボーナス

// 説得成功ボーナス
- 説得コメントにより投票変更を促した場合: +5ポイント
- 建設的な議論を促進した場合: +2ポイント
```

##### **参加継続係数 (20%)**

```javascript
参加継続係数 = (継続日数 × 0.1) + (投稿頻度安定性 × 0.3) + (投票参加率 × 0.6)

// 投稿頻度安定性
- 30日間の投稿頻度の分散を計算
- 安定した投稿頻度を高く評価

// 投票参加率
- 他者の投稿への投票参加割合
- コミュニティの活性化に貢献
```

##### **コミュニティ貢献係数 (15%)**

```javascript
コミュニティ貢献係数 = (新規ユーザー誘導数 × 2.0) + (コミュニティ作成数 × 5.0) + (モデレーション活動 × 1.5)

// モデレーション活動
- 建設的なコメントへのUpvote
- 不適切なコンテンツの報告
- 新規ユーザーへのサポート
```

##### **相互作用係数 (10%)**

```javascript
相互作用係数 = (返信を受けた数 × 0.5) + (返信した数 × 0.3) + (継続的な議論参加 × 0.7)

// 継続的な議論参加
- 同じ投稿で複数回のやり取り
- 建設的な議論の維持
```

#### 3. 共感ポイントの段階評価

| ポイント範囲 | 評価ランク   | バッジ | 説明                     |
| ------------ | ------------ | ------ | ------------------------ |
| 10000+       | レジェンド   | 🏆     | コミュニティの中心的存在 |
| 5000-9999    | マスター     | 💎     | 高い影響力を持つユーザー |
| 2000-4999    | エキスパート | 🌟     | 経験豊富なユーザー       |
| 1000-1999    | アクティブ   | ⚡     | 活発なユーザー           |
| 500-999      | 貢献者       | 🔥     | コミュニティに貢献       |
| 100-499      | 参加者       | 🌱     | 成長中のユーザー         |
| 0-99         | 新規         | 👶     | 新規ユーザー             |

### 🎯 実装上の考慮事項

#### 1. スコア更新頻度

- **品質度スコア**: 投稿作成時・投票期限終了時に算出
- **共感ポイント**: 日次バッチ処理で更新（リアルタイム性とパフォーマンスのバランス）

#### 2. 不正防止機能

- **自己投票防止**: 自分の投稿への投票は除外
- **スパム対策**: 短時間での大量投稿は減点
- **操作検知**: 異常な投票パターンの検知

#### 3. プライバシー保護

- **匿名化オプション**: ユーザーが希望すればスコア非表示
- **詳細情報制限**: 他ユーザーには総合スコアのみ表示

#### 4. 新規ユーザー支援

- **新規ユーザーボーナス**: 最初の30日間は係数を1.2倍
- **スターターガイド**: スコア向上のためのアドバイス表示

### 📊 データベース設計

#### 新規テーブル: user_quality_scores

```sql
CREATE TABLE user_quality_scores (
    id bigserial PRIMARY KEY,
    user_id text NOT NULL,
    post_id int8 NOT NULL REFERENCES posts(id),
    vote_efficiency_score numeric(5,2) DEFAULT 0,
    discussion_activity_score numeric(5,2) DEFAULT 0,
    persuasion_effectiveness_score numeric(5,2) DEFAULT 0,
    sustained_interest_score numeric(5,2) DEFAULT 0,
    total_quality_score numeric(5,2) DEFAULT 0,
    quality_rank text DEFAULT 'F',
    calculated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, post_id)
);
```

#### 新規テーブル: user_empathy_points

```sql
CREATE TABLE user_empathy_points (
    id bigserial PRIMARY KEY,
    user_id text UNIQUE NOT NULL,
    post_evaluation_score numeric(10,2) DEFAULT 0,
    comment_evaluation_score numeric(10,2) DEFAULT 0,
    participation_continuity_score numeric(10,2) DEFAULT 0,
    community_contribution_score numeric(10,2) DEFAULT 0,
    interaction_score numeric(10,2) DEFAULT 0,
    total_empathy_points numeric(10,2) DEFAULT 0,
    empathy_rank text DEFAULT 'new',
    badge_icon text DEFAULT '👶',
    updated_at timestamptz DEFAULT now()
);
```

### 🔧 技術実装アプローチ

#### 1. バックエンド (Supabase Functions)

```javascript
// 品質度スコア計算関数
create or replace function calculate_quality_score(post_id bigint)
returns numeric as $$
// 実装詳細
$$;

// 共感ポイント計算関数
create or replace function calculate_empathy_points(user_id text)
returns numeric as $$
// 実装詳細
$$;
```

#### 2. フロントエンド (React Hooks)

```typescript
// カスタムフック
export const useQualityScore = (postId: number) => { ... };
export const useEmpathyPoints = (userId: string) => { ... };
export const useUserRanking = () => { ... };
```

#### 3. UI コンポーネント

```typescript
// スコア表示コンポーネント
<QualityScoreDisplay score={score} rank={rank} />
<EmpathyPointsDisplay points={points} badge={badge} />
<UserRankingCard user={user} />
```

この設計により、単純な投票数・コメント数だけでなく、投稿の質、議論の活性化、コミュニティへの貢献度を総合的に評価できる包括的なシステムを構築できます。
