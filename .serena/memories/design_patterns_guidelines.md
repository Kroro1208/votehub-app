# 設計パターン＆ガイドライン

## アーキテクチャパターン

- **Feature-First Structure**: 機能ごとにコンポーネントをグループ化
- **Custom Hooks Pattern**: 業務ロジックをフックに分離
- **Compound Components**: 複雑なUIは複数コンポーネントで構成

## データフェッチパターン

- **TanStack Query**: サーバーステート管理
- **Supabase Realtime**: リアルタイム更新
- **Optimistic Updates**: UX向上のため楽観的更新

## 状態管理パターン

- **Local State**: useState, useReducer
- **Global State**: Jotai atoms for post/comment votes
- **Form State**: React Hook Form + Zod validation

## コンポーネント設計原則

- **Single Responsibility**: 1コンポーネント1責務
- **Props Drilling回避**: Context/状態管理ライブラリ活用
- **Composition over Inheritance**: コンポーネント合成

## エラーハンドリング

- **Error Boundaries**: クライアントサイドエラー処理
- **Form Validation**: Zod schema validation
- **API Error**: React Query error handling

## パフォーマンス最適化

- **Code Splitting**: 動的インポート
- **Memoization**: React.memo, useMemo, useCallback
- **Lazy Loading**: 画像・コンポーネントの遅延読み込み

## セキュリティガイドライン

- **Input Sanitization**: XSS防止
- **Authentication**: Supabase Auth + Row Level Security
- **CSRF Protection**: Next.js built-in protection
