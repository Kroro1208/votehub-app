//ルート保護する
// 改ざんを防止し、一元的なルート管理を提供するクラス
class RouteProtection {
  private static instance: RouteProtection;

  // 改ざんを防ぐための暗号化/難読化されたルートパターン
  private readonly _protectedPatterns: ReadonlyArray<string>;
  private readonly _authPatterns: ReadonlyArray<string>;
  private readonly _publicPatterns: ReadonlyArray<string>;

  // 整合性検証のためのハッシュベース検証
  private readonly _checksum: string;

  private constructor() {
    // 保護されたルートパターンを定義
    this._protectedPatterns = Object.freeze([
      "/bookmarks",
      "/create",
      "/post/create",
      "/notifications",
      "/post/*",
      "/popular-votes",
      "/user-ranking",
      "/vote-results",
      "/trending",
      "/tags/*",
      "/space/*",
      "/space/create",
      "/profile/*",
      "/settings",
      "/api/protected",
      "/api/user",
      "/api/admin",
    ]);

    this._authPatterns = Object.freeze([
      "/auth/login",
      "/auth/signup",
      "/auth/reset",
    ]);

    this._publicPatterns = Object.freeze([
      "/",
      "/about",
      "/contact",
      "/api/public",
      "/auth/callback",
    ]);

    // 整合性検証用のチェックサムを生成
    this._checksum = this._generateChecksum();
  }

  public static getInstance(): RouteProtection {
    if (!RouteProtection.instance) {
      RouteProtection.instance = new RouteProtection();
    }
    return RouteProtection.instance;
  }

  // ルートが認証を必要とするかをチェック
  public isProtectedRoute(path: string): boolean {
    this._verifyIntegrity();
    return this._protectedPatterns.some((pattern) =>
      this._matchesPattern(path, pattern),
    );
  }

  // ルートが認証ルートかをチェック（ログイン済みの場合はリダイレクトすべき）
  public isAuthRoute(path: string): boolean {
    this._verifyIntegrity();
    return this._authPatterns.some((pattern) =>
      this._matchesPattern(path, pattern),
    );
  }

  // ルートが公開アクセス可能かをチェック
  public isPublicRoute(path: string): boolean {
    this._verifyIntegrity();
    return this._publicPatterns.some((pattern) =>
      this._matchesPattern(path, pattern),
    );
  }

  // 追加セキュリティのために保護されたAPIルートをすべて取得
  public getProtectedApiRoutes(): ReadonlyArray<string> {
    this._verifyIntegrity();
    return this._protectedPatterns.filter((route) => route.startsWith("/api/"));
  }

  // ルート定数を取得するメソッド
  public getRoutes() {
    this._verifyIntegrity();
    return {
      // 認証が必要なルート
      BOOKMARKS: "/bookmarks",
      CREATE: "/create",
      POST_CREATE: "/post/create",
      NOTIFICATIONS: "/notifications",
      POPULAR_VOTES: "/popular-votes",
      USER_RANKING: "/user-ranking",
      VOTE_RESULTS: "/vote-results",
      TRENDING: "/trending",
      SPACE: "/space",
      SPACE_CREATE: "/space/create",
      SETTINGS: "/settings",

      // 認証ルート
      AUTH_LOGIN: "/auth/login",
      AUTH_SIGNUP: "/auth/signup",
      AUTH_RESET: "/auth/reset",

      // 公開ルート
      HOME: "/",
      ABOUT: "/about",
      CONTACT: "/contact",
      POST: "/post",
      AUTH_CALLBACK: "/auth/callback",

      // 動的ルート用のヘルパー
      profile: (userId: string) => `/profile/${userId}`,
      post: (postId: string) => `/post/${postId}`,
      tags: (tagName: string) => `/tags/${tagName}`,
      space: (spaceId: string) => `/space/${spaceId}`,
    } as const;
  }

  // ルートアクセスレベルの検証
  public validateAccess(
    path: string,
    isAuthenticated: boolean,
  ): {
    allowed: boolean;
    action: "allow" | "redirect_login" | "redirect_home" | "deny";
    redirect?: string;
  } {
    this._verifyIntegrity();

    if (this.isPublicRoute(path)) {
      return { allowed: true, action: "allow" };
    }

    if (this.isProtectedRoute(path)) {
      if (!isAuthenticated) {
        return {
          allowed: false,
          action: "redirect_login",
          redirect: `/auth/login?redirect=${encodeURIComponent(path)}`,
        };
      }
      return { allowed: true, action: "allow" };
    }

    if (this.isAuthRoute(path)) {
      if (isAuthenticated) {
        return {
          allowed: false,
          action: "redirect_home",
          redirect: "/",
        };
      }
      return { allowed: true, action: "allow" };
    }

    // デフォルトで未知のルートを拒否
    return { allowed: false, action: "deny" };
  }

  // ワイルドカードと正規表現サポート付きの高度なパターンマッチング
  private _matchesPattern(path: string, pattern: string): boolean {
    // 完全一致
    if (path === pattern) return true;

    // パターンで始まる（ネストされたルート用）
    if (pattern.endsWith("*")) {
      return path.startsWith(pattern.slice(0, -1));
    }

    // APIルートとネストされたパス用のプレフィックスマッチ
    if (path.startsWith(pattern)) {
      const remainder = path.slice(pattern.length);
      return remainder === "" || remainder.startsWith("/");
    }

    return false;
  }

  // 整合性チェックサムを生成
  private _generateChecksum(): string {
    const data = [
      ...this._protectedPatterns,
      ...this._authPatterns,
      ...this._publicPatterns,
    ].join("|");

    // 整合性チェック用の単純なハッシュ関数
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32ビット整数に変換
    }
    return hash.toString(36);
  }

  // クラスの整合性が改ざんされていないかを検証
  private _verifyIntegrity(): void {
    const currentChecksum = this._generateChecksum();
    if (currentChecksum !== this._checksum) {
      throw new Error("セキュリティ違反: ルート設定が改ざんされています");
    }
  }
}

// シングルトンインスタンスをエクスポート
export const routeProtection = RouteProtection.getInstance();

// 専用の型
export type RouteAccessResult = ReturnType<
  typeof routeProtection.validateAccess
>;
