"use client";

import { AuthProvider } from "../../context/AuthProvider";
import { LanguageProvider } from "../../context/LanguageProvider";
import { ThemeProvider } from "../../context/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { ReactNode, useState } from "react";
import { ToastContainer } from "react-toastify";

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 0, // Issue #73: リトライ無効化でパフォーマンス向上
            refetchOnWindowFocus: false,
            staleTime: 1 * 60 * 1000, // Issue #73: 1分に短縮（高速化）
            gcTime: 5 * 60 * 1000, // Issue #73: 5分に短縮（メモリ最適化）
            networkMode: "offlineFirst", // オフライン対応強化
          },
          mutations: {
            retry: 0, // ミューテーションでもリトライ無効化
            networkMode: "offlineFirst",
          },
        },
      }),
  );

  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </JotaiProvider>
  );
}
