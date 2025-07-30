import { routeProtection } from "@/config/RouteProtection";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  try {
    // httpOnlyクッキーからトークンを取得
    const accessToken = request.cookies.get("sb_access_token")?.value;
    const isAuthenticated = !!accessToken;

    // セキュアなルート保護クラスを使用
    const accessResult = routeProtection.validateAccess(path, isAuthenticated);

    // パブリックルートの処理
    if (accessResult.action === "allow") {
      // 保護されたルートの場合、トークンが存在すれば検証を実行
      if (routeProtection.isProtectedRoute(path) && accessToken) {
        return await validateTokenAndProceed(request, accessToken);
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
      return await validateTokenAndProceed(request, accessToken);
    }

    // パブリックルートまたは認証不要な場合は続行
    if (routeProtection.isPublicRoute(path)) {
      return NextResponse.next();
    }

    // デフォルトで未認証の保護されたルートのみ拒否
    if (routeProtection.isProtectedRoute(path) && !isAuthenticated) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    return NextResponse.next();
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
): Promise<NextResponse> {
  try {
    // 基本的なトークン存在チェックのみ（より高速）
    if (!accessToken || accessToken.length < 10) {
      const response = NextResponse.redirect(
        new URL("/auth/login", request.url),
      );
      response.cookies.set("sb_access_token", "", { maxAge: 0 });
      response.cookies.set("sb_refresh_token", "", { maxAge: 0 });
      return response;
    }

    // トークンが存在すれば続行（詳細な検証はクライアントサイドに委譲）
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
     * - api routes (let them handle auth internally)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
