import { createContext, useContext, useState, ReactNode } from "react";

type Language = "ja" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

// Translation dictionaries
const translations = {
  ja: {
    // Navigation
    "nav.home": "投票中",
    "nav.trending": "人気の投票",
    "nav.results": "結果発表",
    "nav.bookmarks": "ブックマーク",
    "nav.stats": "統計",
    "nav.space": "スペース",
    "nav.settings": "設定",
    "nav.notifications": "通知",
    "nav.create": "投票を作成",

    // Settings
    "settings.title": "設定",
    "settings.profile": "プロフィール設定",
    "settings.language": "言語設定",
    "settings.theme": "テーマ設定",
    "settings.payment": "支払い・サブスクリプション",
    "settings.account": "アカウント情報",
    "settings.profile.edit": "編集",
    "settings.profile.save": "保存",
    "settings.profile.cancel": "キャンセル",
    "settings.profile.name": "表示名",
    "settings.profile.bio": "自己紹介",
    "settings.profile.updating": "更新中...",
    "settings.language.description": "アプリの表示言語を選択してください",
    "settings.theme.light": "ライトモード",
    "settings.theme.dark": "ダークモード",
    "settings.theme.light.description": "明るいテーマで表示されています",
    "settings.theme.dark.description": "暗いテーマで表示されています",
    "settings.payment.current": "現在のプラン",
    "settings.payment.free": "無料プラン",
    "settings.payment.premium": "プレミアム機能",
    "settings.payment.coming": "近日公開",
    "settings.account.email": "メールアドレス",
    "settings.account.joined": "登録日",

    // Messages
    "message.profile.updated": "プロフィールを更新しました",
    "message.profile.update.failed": "プロフィールの更新に失敗しました",
    "message.image.uploaded": "画像をアップロードしました",
    "message.image.upload.failed": "画像のアップロードに失敗しました",
    "message.theme.light": "ライトモードに切り替えました",
    "message.theme.dark": "ダークモードに切り替えました",
    "message.language.ja": "言語を日本語に設定しました",
    "message.language.en": "Language set to English",

    // Common
    "common.back": "戻る",
    "common.edit": "編集",
    "common.save": "保存",
    "common.cancel": "キャンセル",
    "common.loading": "読み込み中...",
    "common.error": "エラー",
  },
  en: {
    // Navigation
    "nav.home": "Voting",
    "nav.trending": "Popular Votes",
    "nav.results": "Results",
    "nav.bookmarks": "Bookmarks",
    "nav.stats": "Statistics",
    "nav.space": "Spaces",
    "nav.settings": "Settings",
    "nav.notifications": "Notifications",
    "nav.create": "Create Vote",

    // Settings
    "settings.title": "Settings",
    "settings.profile": "Profile Settings",
    "settings.language": "Language Settings",
    "settings.theme": "Theme Settings",
    "settings.payment": "Payment & Subscription",
    "settings.account": "Account Information",
    "settings.profile.edit": "Edit",
    "settings.profile.save": "Save",
    "settings.profile.cancel": "Cancel",
    "settings.profile.name": "Display Name",
    "settings.profile.bio": "Bio",
    "settings.profile.updating": "Updating...",
    "settings.language.description":
      "Select your preferred language for the app",
    "settings.theme.light": "Light Mode",
    "settings.theme.dark": "Dark Mode",
    "settings.theme.light.description": "Using light theme",
    "settings.theme.dark.description": "Using dark theme",
    "settings.payment.current": "Current Plan",
    "settings.payment.free": "Free Plan",
    "settings.payment.premium": "Premium Features",
    "settings.payment.coming": "Coming Soon",
    "settings.account.email": "Email Address",
    "settings.account.joined": "Joined",

    // Messages
    "message.profile.updated": "Profile updated successfully",
    "message.profile.update.failed": "Failed to update profile",
    "message.image.uploaded": "Image uploaded successfully",
    "message.image.upload.failed": "Failed to upload image",
    "message.theme.light": "Switched to light mode",
    "message.theme.dark": "Switched to dark mode",
    "message.language.ja": "言語を日本語に設定しました",
    "message.language.en": "Language set to English",

    // Common
    "common.back": "Back",
    "common.edit": "Edit",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.loading": "Loading...",
    "common.error": "Error",
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check localStorage first, then browser language
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && (savedLanguage === "ja" || savedLanguage === "en")) {
      return savedLanguage;
    }

    // Check browser language
    const browserLanguage = navigator.language.toLowerCase();
    if (browserLanguage.startsWith("ja")) {
      return "ja";
    }

    return "en";
  });

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem("language", newLanguage);
  };

  const t = (key: string): string => {
    return (
      translations[language][
        key as keyof (typeof translations)[typeof language]
      ] || key
    );
  };

  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
