# Docker Setup Guide

## Prerequisites

- Docker Desktop がインストールされていること
- Docker Compose がインストールされていること

## セットアップ手順

### 1. 環境変数の設定

`.env.example`を`.env`にコピーして、必要な環境変数を設定してください：

```bash
cp .env.example .env
```

`.env`ファイルを編集して、実際のSupabaseキーを設定：

```env
VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_supabase_service_role_key
```

### 2. Docker Composeでの起動

```bash
# すべてのサービスを起動
docker-compose up -d

# ログを確認
docker-compose logs -f

# サービスの状態を確認
docker-compose ps
```

### 3. アクセス

- **フロントエンドアプリ**: http://localhost:3000
- **Supabase Studio**: http://localhost:3001
- **Supabase API**: http://localhost:8000

### 4. 停止

```bash
# サービスを停止
docker-compose down

# ボリュームも削除する場合
docker-compose down -v
```

## トラブルシューティング

### ポートの競合

既に使用されているポートがある場合は、`docker-compose.yml`のポート設定を変更してください。

### データベースの初期化

データベースを初期化したい場合：

```bash
docker-compose down -v
docker-compose up -d
```

### Dockerイメージのリビルド

コードを変更した後：

```bash
docker-compose build --no-cache
docker-compose up -d
```
