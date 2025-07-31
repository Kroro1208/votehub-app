# 推奨コマンド

## 開発環境

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start
```

## 品質チェック

```bash
# リント実行
npm run lint

# コード整形
npm run format

# コード整形チェック（CI用）
npm run format:check

# テスト実行
npm test
```

## Git操作（Darwin環境）

```bash
# ステータス確認
git status

# 変更差分確認
git diff

# ファイル検索
find . -name "*.tsx" -type f

# 内容検索（ripgrep推奨）
rg "useAuth" --type tsx
```

## Supabase関連

```bash
# マイグレーション確認
ls supabase/migrations/

# ログ確認（ローカル開発時）
# Supabaseダッシュボードまたはログファイル参照
```

## システム固有（Darwin）

- ファイル操作: `ls`, `find`, `grep`/`rg`
- プロセス管理: `ps`, `kill`
- ネットワーク: `curl`, `wget`
