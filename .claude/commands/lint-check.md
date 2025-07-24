---
name: "lint-check"
description: "ファイル修正後に警告やエラーがないか包括的にチェック"
---

# Lint & Error Check

このコマンドはファイル修正後に各種警告やエラーが発生していないかを確認します。
必ず日本語で会話すること。

## 実行内容

1. TypeScript/JavaScript の型エラーチェック
2. ESLint による構文・スタイルチェック
3. Prettier によるフォーマットチェック
4. Next.js/React の警告チェック
5. 依存関係の問題チェック
6. テストの実行状況確認

## チェック項目

- TypeScript コンパイルエラー
- ESLint の警告・エラー
- Prettier フォーマット違反
- Next.js ビルドエラー
- パッケージの脆弱性
- 未使用インポート
- デッドコード

## 使用方法

```bash
claude-code lint-check
claude-code lint-check --file src/components/Button.tsx
claude-code lint-check --fix  # 自動修正可能な問題を修正
```
