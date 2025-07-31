"use client";

import { usePageTransition } from "../../hooks/usePageTransitionHook";

export function PageTransitionOverlay() {
  const { isTransitioning } = usePageTransition();

  if (!isTransitioning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blur背景 */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-all duration-300" />

      {/* ローディングスピナー */}
      <div className="relative z-10 flex flex-col items-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white text-sm font-medium drop-shadow-lg">
          ページを読み込み中...
        </p>
      </div>
    </div>
  );
}
