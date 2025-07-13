import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
    }),
    tailwindcss(),
  ],
  server: {
    host: "0.0.0.0", // Dockerで外部からアクセス可能にする
    port: 5173,
    watch: {
      usePolling: true, // Dockerでのファイル監視を有効にする
    },
  },
});
