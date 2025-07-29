"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { FaGoogle } from "react-icons/fa";

// Zodスキーマ定義（多言語対応）
const createLoginSchema = (t: (key: string) => string) => z.object({
  email: z
    .string()
    .min(1, t("auth.validation.email.required"))
    .email(t("auth.validation.email.invalid")),
  password: z
    .string()
    .min(6, t("auth.validation.password.required"))
    .max(100, t("auth.validation.password.max")),
});

const createSignUpSchema = (t: (key: string) => string) => createLoginSchema(t).extend({
  confirmPassword: z.string().min(6, t("auth.validation.password.confirm.required")),
}).refine((data) => data.password === data.confirmPassword, {
  message: t("auth.validation.password.mismatch"),
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;
type SignUpFormData = z.infer<ReturnType<typeof createSignUpSchema>>;

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLパラメータからモードを取得して初期状態を設定
  const mode = searchParams.get("mode");
  const [isLogin, setIsLogin] = useState(mode !== "signup");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // React Hook Form設定
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(createLoginSchema(t)),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(createSignUpSchema(t)),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });


  // URLパラメータからエラーメッセージを取得
  const urlError = searchParams.get("error");
  const errorMessage = searchParams.get("message");

  // URLパラメータの変更を監視
  useEffect(() => {
    const currentMode = searchParams.get("mode");
    const shouldBeLogin = currentMode !== "signup";
    if (isLogin !== shouldBeLogin) {
      setIsLogin(shouldBeLogin);
      setError("");
      setMessage("");
      loginForm.reset();
      signUpForm.reset();
    }
  }, [searchParams, isLogin, loginForm, signUpForm]);
  
  const handleEmailAuth = async (data: LoginFormData | SignUpFormData) => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      let result;
      if (isLogin) {
        result = await signInWithEmail(data.email, data.password);
      } else {
        result = await signUpWithEmail(data.email, data.password);
      }

      if (result.error) {
        setError(result.error);
      } else {
        if (isLogin) {
          router.push("/");
        } else {
          setMessage(t("auth.signup.success"));
        }
      }
    } catch {
      setError(t("auth.error.unexpected"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setLoading(true);
    signInWithGoogle();
    setLoading(false);
  };

  const switchMode = () => {
    const newMode = !isLogin;
    setIsLogin(newMode);
    setError("");
    setMessage("");
    // フォームをリセット
    loginForm.reset();
    signUpForm.reset();
    
    // URLパラメータも更新
    const newUrl = `/auth/login?mode=${newMode ? "login" : "signup"}`;
    router.replace(newUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isLogin ? t("auth.login.title") : t("auth.signup.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isLogin ? t("auth.login.subtitle") : t("auth.signup.subtitle")}
          </p>
        </div>

        {/* エラーメッセージ表示 */}
        {(error || urlError) && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
            {error || (urlError === "callback_failed" ? t("auth.error.callback") : 
                       urlError === "no_code" ? t("auth.error.no_code") :
                       urlError === "oauth_error" ? `OAuth エラー: ${errorMessage || "不明なエラー"}` :
                       urlError)}
            {urlError && (
              <div className="mt-2 text-xs text-red-600">
                デバッグ情報: {urlError} {errorMessage && `| ${errorMessage}`}
              </div>
            )}
          </div>
        )}

        {/* 成功メッセージ表示 */}
        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-md">
            {message}
          </div>
        )}

        {/* Googleログインボタン */}
        <Button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full mb-4 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
        >
          <FaGoogle />
          {isLogin ? t("auth.google.login") : t("auth.google.signup")}
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">{t("auth.or")}</span>
          </div>
        </div>

        {/* メールログインフォーム */}
        <form onSubmit={isLogin ? loginForm.handleSubmit(handleEmailAuth) : signUpForm.handleSubmit(handleEmailAuth)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("auth.email")}
            </label>
            <Input
              type="email"
              {...(isLogin ? loginForm.register("email") : signUpForm.register("email"))}
              className="w-full"
              placeholder={t("auth.email.placeholder")}
            />
            {(isLogin ? loginForm.formState.errors.email : signUpForm.formState.errors.email) && (
              <p className="mt-1 text-sm text-red-600">
                {(isLogin ? loginForm.formState.errors.email : signUpForm.formState.errors.email)?.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("auth.password")}
            </label>
            <Input
              type="password"
              {...(isLogin ? loginForm.register("password") : signUpForm.register("password"))}
              className="w-full"
              placeholder={t("auth.password.placeholder")}
            />
            {(isLogin ? loginForm.formState.errors.password : signUpForm.formState.errors.password) && (
              <p className="mt-1 text-sm text-red-600">
                {(isLogin ? loginForm.formState.errors.password : signUpForm.formState.errors.password)?.message}
              </p>
            )}
          </div>

          {/* 新規登録時のパスワード確認フィールド */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("auth.password.confirm")}
              </label>
              <Input
                type="password"
                {...signUpForm.register("confirmPassword")}
                className="w-full"
                placeholder={t("auth.password.confirm.placeholder")}
              />
              {signUpForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {signUpForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !(isLogin ? loginForm.formState.isValid : signUpForm.formState.isValid)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {loading ? t("auth.processing") : (isLogin ? t("auth.login") : t("auth.sign.up"))}
          </Button>
        </form>

        {/* ログイン・新規登録切り替え */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {isLogin ? t("auth.switch.signup.text") : t("auth.switch.login.text")}
            <button
              onClick={switchMode}
              className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
            >
              {isLogin ? t("auth.switch.signup") : t("auth.switch.login")}
            </button>
          </p>
        </div>

        {/* ホームページへのリンク */}
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            {t("auth.back.home")}
          </Link>
        </div>
      </div>
    </div>
  );
}