import { ReactNode, useEffect, useState } from "react";
import { ThemeContext } from "./ThemeContext";

type Theme = "light" | "dark";

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // SSR時はデフォルト値を使用してHydrationエラーを防ぐ
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    
    // クライアントサイドでのみ実行
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") as Theme;
      if (savedTheme) {
        setThemeState(savedTheme);
        return;
      }

      // Check system preference
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setThemeState("dark");
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Apply theme to document
      const root = document.documentElement;

      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      // Save to localStorage
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const value = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
