# コードベース構造

## ディレクトリ構造

```
src/
├── app/                     # Next.js App Router
│   ├── components/          # コンポーネント（機能別）
│   │   ├── ui/             # 基本UIコンポーネント（shadcn/ui）
│   │   ├── Post/           # 投稿関連コンポーネント
│   │   ├── Vote/           # 投票関連コンポーネント
│   │   ├── Comment/        # コメント関連コンポーネント
│   │   ├── Community/      # コミュニティ関連
│   │   ├── Profile/        # プロフィール関連
│   │   └── ...
│   ├── hooks/              # カスタムフック
│   ├── pages/              # ページコンポーネント
│   ├── api/                # API Routes
│   ├── stores/             # 状態管理（Jotai atoms）
│   └── utils/              # ユーティリティ関数
├── context/                # React Context
├── lib/                    # ライブラリ設定・ヘルパー
├── utils/                  # 汎用ユーティリティ
├── types/                  # 型定義
└── config/                 # 設定ファイル
```

## 主要ファイル

- `layout.tsx`: ルートレイアウト（認証、ナビゲーション）
- `supabase-client.ts`: Supabaseクライアント設定
- `middleware.ts`: 認証ミドルウェア
- `types.ts`: 共通型定義

## 特徴的な構造

- App Router使用（Next.js 13+）
- コンポーネントは機能別にグループ化
- カスタムフックで業務ロジック分離
- shadcn/ui コンポーネントライブラリ活用
