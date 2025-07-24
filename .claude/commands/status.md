---
name: "dev-status"
description: "現在の開発状況を確認するために.claude/Claude.mdとGitHub Issueを分析"
---

# Development Status Check

このコマンドは現在の開発状況を包括的に確認します。
必ず日本語で会話すること。

## 実行内容

1. `.claude/Claude.md` の内容を読み取り、プロジェクトの現在の状態を把握
2. GitHub Issues を確認して未解決のタスクや問題を特定
3. 開発の進捗状況と次に取り組むべき項目を整理
4. 確認後、必要であれば `.claude/Claude.md` とgithub issueを更新および追記する

## 分析項目

- プロジェクトの現在のフェーズ
- 完了したタスク
- 未完了のタスク
- 優先度の高いIssue
- ブロッカーとなっている問題
- 次のアクションアイテム

## 使用方法

```bash
claude-code dev-status
```
