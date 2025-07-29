"use client";

import { useEffect, useState, ReactNode } from "react";

interface ClientBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * VS Code拡張機能やブラウザ拡張機能による
 * DOM変更からReactコンポーネントを保護する
 */
export default function ClientBoundary({
  children,
  fallback = null,
}: ClientBoundaryProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // 少し遅延してマウント状態を true にする
    // これによりブラウザ拡張機能の初期化を待つ
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  // サーバーサイドレンダリング時またはまだマウントされていない時
  if (!isMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
