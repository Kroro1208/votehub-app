import { routeProtection } from "@/lib/RouteProtection";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  try {
    // httpOnlyクッキーからトークンを取得
    const accessToken = request.cookies.get("sb_access_token")?.value;
    const refreshToken = request.cookies.get("sb_refresh_token")?.value;
    const isAuthenticated = !!accessToken;

    // セキュアなルート保護クラスを使用
    const accessResult = routeProtection.validateAccess(path, isAuthenticated);

    // パブリックルートの処理
    if (accessResult.action === "allow") {
      // 保護されたルートの場合、トークンが存在すれば検証を実行
      if (routeProtection.isProtectedRoute(path) && accessToken) {
        return await validateTokenAndProceed(
          request,
          accessToken,
          refreshToken,
        );
      }
      return NextResponse.next();
    }

    // リダイレクトアクションの処理
    if (accessResult.action === "redirect_login" && accessResult.redirect) {
      return NextResponse.redirect(new URL(accessResult.redirect, request.url));
    }

    if (accessResult.action === "redirect_home" && accessResult.redirect) {
      return NextResponse.redirect(new URL(accessResult.redirect, request.url));
    }

    // 認証済みルートのトークン検証処理
    if (accessToken && routeProtection.isProtectedRoute(path)) {
      return await validateTokenAndProceed(request, accessToken, refreshToken);
    }

    // デフォルトで拒否
    return NextResponse.redirect(new URL("/auth/login", request.url));
  } catch (error) {
    console.error("ミドルウェアセキュリティエラー:", error);

    // セキュリティ違反 - ログインにリダイレクトしてクッキーをクリア
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    response.cookies.set("sb_access_token", "", { maxAge: 0 });
    response.cookies.set("sb_refresh_token", "", { maxAge: 0 });
    return response;
  }
}

async function validateTokenAndProceed(
  request: NextRequest,
  accessToken: string,
  refreshToken?: string,
): Promise<NextResponse> {
  try {
    // サーバーサイド検証用のSupabaseクライアントを作成
    const supabase = createClient(
      process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
      process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
      {
        auth: {
          storage: {
            getItem: (key: string) => {
              if (key === "sb-access-token") return accessToken ?? null;
              if (key === "sb-refresh-token") return refreshToken ?? null;
              return null;
            },
            setItem: () => {},
            removeItem: () => {},
          },
        },
      },
    );

    // ユーザーを取得してトークンを検証
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      // トークンが無効な場合、クッキーをクリアしてログインにリダイレクト
      const response = NextResponse.redirect(
        new URL("/auth/login", request.url),
      );
      response.cookies.set("sb_access_token", "", { maxAge: 0 });
      response.cookies.set("sb_refresh_token", "", { maxAge: 0 });
      return response;
    }

    // トークンが有効な場合、続行
    return NextResponse.next();
  } catch (error) {
    console.error("トークン検証エラー:", error);

    // エラー時はクッキーをクリアしてログインにリダイレクト
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    response.cookies.set("sb_access_token", "", { maxAge: 0 });
    response.cookies.set("sb_refresh_token", "", { maxAge: 0 });
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
