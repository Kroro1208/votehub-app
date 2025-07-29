"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthContext } from "./AuthContext";
import { supabase } from "../supabase-client";
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => void;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
          // Clear any corrupted session data
          await supabase.auth.signOut();
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.email);

      // 最初の初期化完了後はloadingをfalseに設定する必要はない
      if (loading) {
        setLoading(false);
      }

      // すべてのイベントで同じ処理を実行するので統一
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo,
          // queryParamsを完全に削除してデフォルトの動作にする
          // これによりGoogleのアカウント選択画面がよりスムーズになる
        },
      });

      if (error) {
        console.error("Google sign in error:", error);
      }
    } catch (error) {
      console.error("Sign in error:", error);
    }
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          console.error("Email sign in error:", error);
          return { error: error.message };
        }
        return {};
      } catch (error) {
        console.error("Sign in error:", error);
        return { error: "サインインエラーが発生しました" };
      }
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          console.error("Email sign up error:", error);
          return { error: error.message };
        }
        return {};
      } catch (error) {
        console.error("Sign up error:", error);
        return { error: "サインアップエラーが発生しました" };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
      }
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [
      user,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
