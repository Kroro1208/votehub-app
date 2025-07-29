"use client";
import { ReactNode, useState, useEffect } from "react";
import { Language, LanguageContext, translations } from "./LanguageContext";

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  // SSR時はデフォルト値を使用してHydrationエラーを防ぐ
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    
    // クライアントサイドでのみ実行
    if (typeof window !== "undefined") {
      // Check localStorage first, then browser language
      const savedLanguage = localStorage.getItem("language") as Language;
      if (savedLanguage && (savedLanguage === "ja" || savedLanguage === "en")) {
        setLanguageState(savedLanguage);
        return;
      }

      // Check browser language
      const browserLanguage = navigator.language.toLowerCase();
      if (browserLanguage.startsWith("ja")) {
        setLanguageState("ja");
      }
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    if (typeof window !== "undefined") {
      localStorage.setItem("language", newLanguage);
    }
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
