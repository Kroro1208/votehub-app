/**
 * Hydration エラーを制御するためのユーティリティ
 */

// 開発環境でのhydration警告を抑制（VS Code拡張機能対策）
export const suppressHydrationWarning = process.env.NODE_ENV === "development";

// VS Code Live Server等の開発ツールの影響を検知
export const isDevEnvironment = () => {
  if (typeof window === "undefined") return false;

  // VS Code拡張機能の検知
  const hasVSCodeExtension = document.body.className.includes("vsc-");

  // Live Server等の検知
  const hasLiveServer =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  return hasVSCodeExtension || hasLiveServer;
};

// ブラウザ拡張機能による DOM 変更の検知
export const hasBrowserExtensions = () => {
  if (typeof window === "undefined") return false;

  // 一般的なブラウザ拡張機能のclassName
  const extensionClasses = [
    "vsc-domain-",
    "extension-",
    "chrome-extension-",
    "firefox-extension-",
  ];

  return extensionClasses.some((className) =>
    document.body.className.includes(className),
  );
};
