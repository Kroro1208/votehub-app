"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function TokenCleanup() {
  const pathname = usePathname();

  useEffect(() => {
    // callback-clientページでは処理しない（専用の処理があるため）
    if (pathname === "/auth/callback-client") {
      return;
    }

    // クライアントサイドでのみ実行
    if (typeof window !== "undefined") {
      // URLフラグメントにトークンが含まれている場合のみクリーンアップ
      if (
        window.location.hash &&
        window.location.hash.includes("access_token")
      ) {
        // URLフラグメントをクリーンアップ
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }
    }
  }, [pathname]);

  return null;
}
