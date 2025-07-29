# Next.js 15用のDockerfile
FROM node:20-alpine AS base

# 依存関係インストール用ステージ
FROM base AS deps
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./
# 依存関係をインストール
RUN npm ci

# ビルド用ステージ
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 環境変数を設定
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Next.jsアプリケーションをビルド
RUN npm run build

# 実行用ステージ  
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# 実行時に必要な最小限のファイルをコピー
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# ポート3000を公開
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Next.jsサーバーを起動
CMD ["node", "server.js"]