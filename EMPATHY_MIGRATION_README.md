# 共感ポイント機能 マイグレーション手順

## 📁 最新のマイグレーションファイル

**使用するファイル:**

```
supabase/functions/sql/migration_empathy_safe.sql
```

**⚠️ 注意: これが唯一の正しいマイグレーションファイルです**
**✅ 特徴: 既存のポリシーやトリガーとの競合を自動回避**

## 🚀 適用手順

1. Supabaseダッシュボードにログイン
2. SQL Editorを開く
3. `migration_add_empathy_points_correct.sql`の内容をコピー&ペースト
4. 実行

## 🔧 フロントエンドエラーの解決

もし `empathyScore is not defined` エラーが出た場合:

1. **開発サーバーを再起動**

   ```bash
   npm run dev
   ```

2. **ブラウザのキャッシュをクリア**
   - Hard Refresh: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
   - または開発者ツール → Application → Storage → Clear storage

## ✅ 実装内容

- ❤️と💀の両方が +0.5ポイント（差し引きではない）
- コメント作者にポイント付与
- リアルタイムフィードバック
- プロフィールページに共感ポイント表示

## 📊 動作例

- ❤️ 3個 + 💀 2個 = 5リアクション × 0.5 = **2.5ポイント**
