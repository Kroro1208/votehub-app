"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { usePageTransition } from "../../hooks/usePageTransitionHook";

export function useNavigateWithTransition() {
  const router = useRouter();
  const { startTransition, endTransition } = usePageTransition();

  const navigate = useCallback(
    (path: string) => {
      startTransition();

      // ページ遷移を開始
      router.push(path);

      // Next.js のルーティングが完了したら遷移終了
      setTimeout(() => {
        endTransition();
      }, 300);
    },
    [router, startTransition, endTransition],
  );

  const replace = useCallback(
    (path: string) => {
      startTransition();
      router.replace(path);
      setTimeout(() => {
        endTransition();
      }, 300);
    },
    [router, startTransition, endTransition],
  );

  return { navigate, replace };
}
