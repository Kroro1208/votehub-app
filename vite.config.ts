import { defineConfig, ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { IncomingMessage, ServerResponse } from "http";
import type { NextFunction } from "connect";

// セキュリティヘッダーを追加するプラグイン
const securityHeadersPlugin = () => {
  return {
    name: "security-headers",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        (_req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
          // Content Security Policy
          res.setHeader(
            "Content-Security-Policy",
            "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://www.gstatic.com; " +
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
              "font-src 'self' https://fonts.gstatic.com; " +
              "img-src 'self' data: https: blob:; " +
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com; " +
              "frame-src 'self' https://accounts.google.com;",
          );

          // X-Frame-Options - クリックジャッキング攻撃を防ぐ
          res.setHeader("X-Frame-Options", "DENY");

          // X-Content-Type-Options - MIMEタイプスニッフィングを防ぐ
          res.setHeader("X-Content-Type-Options", "nosniff");

          // Referrer Policy - リファラー情報の漏洩を制限
          res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

          // Permissions Policy - ブラウザ機能への不正アクセスを制限
          res.setHeader(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=()",
          );

          // Strict-Transport-Security - HTTPS強制（本番環境用）
          if (process.env.NODE_ENV === "production") {
            res.setHeader(
              "Strict-Transport-Security",
              "max-age=31536000; includeSubDomains; preload",
            );
          }

          // X-XSS-Protection - XSS攻撃の検出と防止
          res.setHeader("X-XSS-Protection", "1; mode=block");

          next();
        },
      );
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
    }),
    tailwindcss(),
    securityHeadersPlugin(),
  ],
  server: {
    host: "0.0.0.0", // Dockerで外部からアクセス可能にする
    port: 5173,
    watch: {
      usePolling: true, // Dockerでのファイル監視を有効にする
    },
  },
  build: {
    // 本番ビルド時のセキュリティ強化
    rollupOptions: {
      output: {
        // ファイル名のランダム化でキャッシュポイズニング攻撃を防ぐ
        entryFileNames: "[name]-[hash].js",
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: "[name]-[hash].[ext]",
      },
    },
  },
});
