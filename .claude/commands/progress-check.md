---
name: "progress-check"
description: "開発の完成度を%で計算し、次に取り組むべき工程を特定"
---

# Development Progress Check

このコマンドは現在の開発進捗を定量的に分析し、完成までの道筋を明確にします。
必ず日本語で会話すること。

## 実行内容

1. プロジェクトの全体進捗を%で算出
2. 各機能・モジュール別の完成度分析
3. 次に優先すべき工程の特定
4. 完成までの残り工数見積もり
5. マイルストーン達成状況の確認

## 分析対象

- 機能実装の完成度
- テストカバレッジ
- ドキュメント整備状況
- UI/UXの完成度
- パフォーマンス最適化
- セキュリティ対策
- デプロイ準備状況

## 使用方法

```bash
claude-code progress-check
claude-code progress-check --detailed  # 詳細分析
claude-code progress-check --milestone v1.0  # 特定マイルストーン
```
