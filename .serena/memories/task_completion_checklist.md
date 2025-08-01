# タスク完了時のチェックリスト

## 必須実行コマンド

タスク完了後は以下を順番に実行：

### 1. コード品質チェック

```bash
# リント実行（構文・スタイルチェック）
npm run lint

# コード整形
npm run format

# 型チェック（TypeScript）
npx tsc --noEmit
```

### 2. テスト実行

```bash
# ユニットテスト実行
npm test
```

### 3. ビルド確認

```bash
# プロダクションビルド確認
npm run build
```

## チェックポイント

- [ ] TypeScriptエラーなし
- [ ] ESLintエラーなし
- [ ] コード整形済み
- [ ] テスト通過
- [ ] ビルド成功
- [ ] 機能動作確認

## 注意事項

- **git commit前**: 必ず上記チェック完了
- **型エラー**: 厳格なTypeScript設定のため型定義必須
- **リアルタイム機能**: Supabase接続確認必要
- **多言語対応**: 新しいテキストは`useLanguage`フック使用
