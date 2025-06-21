# Node.js 20 Alpine imageを使用
FROM node:20-alpine AS builder

WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production && npm cache clean --force

# ソースコードをコピー
COPY . .

# アプリケーションをビルド
RUN npm run build

# Production stage
FROM nginx:alpine

# ビルドされたファイルをnginxにコピー
COPY --from=builder /app/dist /usr/share/nginx/html

# カスタムnginx設定をコピー（SPA用）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ポート80を公開
EXPOSE 80

# nginxを起動
CMD ["nginx", "-g", "daemon off;"]