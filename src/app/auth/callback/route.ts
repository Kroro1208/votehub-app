import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  console.log("Auth callback - URL:", requestUrl.toString());
  console.log("Auth callback - Code:", code ? "present" : "missing");
  console.log("Auth callback - Error:", error);

  // エラーパラメータがある場合（OAuth認証が拒否された等）
  if (error) {
    console.error("Auth callback: OAuth error:", error);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=oauth_error&message=${error}`,
    );
  }

  if (!code) {
    console.error("Auth callback: No code parameter found");
    console.error(
      "Auth callback: All search params:",
      Object.fromEntries(requestUrl.searchParams.entries()),
    );
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=no_code`,
    );
  }

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
    } catch (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=callback_failed`,
      );
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/`);
}
