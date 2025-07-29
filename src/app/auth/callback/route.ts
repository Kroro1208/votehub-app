import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  // エラーパラメータがある場合（OAuth認証が拒否された等）
  if (error) {
    console.error("Auth callback: OAuth error:", error);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=oauth_error&message=${error}`,
    );
  }

  // PKCEフローではcodeパラメータが必要
  if (code) {
    const supabase = createClient(
      process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
      process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
    );

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth callback error:", error);
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/login?error=callback_failed`,
        );
      }
      
      // 成功時はホームページにリダイレクト
      return NextResponse.redirect(`${requestUrl.origin}/`);
    } catch (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=callback_failed`,
      );
    }
  }

  // codeがない場合はSupabaseの自動検出に任せる
  // detectSessionInUrl: true設定により自動的にフラグメントを処理
  return NextResponse.redirect(`${requestUrl.origin}/`);
}
