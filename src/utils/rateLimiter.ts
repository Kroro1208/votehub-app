/**
 * レート制限ユーティリティ
 * API呼び出し、投稿作成、投票などの頻度制限を管理
 */

interface RateLimitConfig {
  windowMs: number; // 時間窓（ミリ秒）
  maxRequests: number; // 最大リクエスト数
  identifier: string; // 識別子（ユーザーID、IPアドレスなど）
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private storage = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isCleanupRunning = false;

  constructor() {
    this.startCleanup();
  }

  /**
   * クリーンアップタイマーを開始
   */
  startCleanup(): void {
    if (this.isCleanupRunning) return;

    this.isCleanupRunning = true;
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    ); // 5分ごと
  }

  /**
   * クリーンアップタイマーを停止（メモリリーク防止）
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      this.isCleanupRunning = false;
    }
  }

  /**
   * インスタンス破棄時のクリーンアップ
   */
  destroy(): void {
    this.stopCleanup();
    this.storage.clear();
  }

  /**
   * レート制限チェック
   */
  checkRateLimit(config: RateLimitConfig): {
    allowed: boolean;
    resetTime?: number;
    remaining?: number;
  } {
    const key = `${config.identifier}_${config.windowMs}`;
    const now = Date.now();
    const entry = this.storage.get(key);

    // エントリが存在しない、またはリセット時間を過ぎている場合
    if (!entry || now >= entry.resetTime) {
      this.storage.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
      };
    }

    // 制限に達している場合
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        resetTime: entry.resetTime,
        remaining: 0,
      };
    }

    // カウントを増加
    entry.count += 1;
    this.storage.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * 特定のキーの制限をリセット
   */
  resetLimit(identifier: string, windowMs: number): void {
    const key = `${identifier}_${windowMs}`;
    this.storage.delete(key);
  }

  /**
   * 期限切れのエントリをクリーンアップ
   */
  cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.storage.entries());
    for (const [key, entry] of entries) {
      if (now >= entry.resetTime) {
        this.storage.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// ブラウザ環境でのページアンロード時のクリーンアップ
if (typeof window !== "undefined") {
  const handleBeforeUnload = () => {
    rateLimiter.stopCleanup();
  };

  const handleUnload = () => {
    rateLimiter.destroy();
  };

  // ページアンロード時にクリーンアップ
  window.addEventListener("beforeunload", handleBeforeUnload);
  window.addEventListener("unload", handleUnload);

  // ページが非表示になった時もクリーンアップ（モバイル対応）
  if ("visibilitychange" in document) {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        rateLimiter.stopCleanup();
      } else if (document.visibilityState === "visible") {
        rateLimiter.startCleanup();
      }
    });
  }
}

/**
 * レート制限設定
 */
export const RATE_LIMITS = {
  // 投稿作成: 1時間に5回まで
  POST_CREATE: {
    windowMs: 60 * 60 * 1000, // 1時間
    maxRequests: 5,
  },

  // 投票: 1分間に10回まで
  VOTE: {
    windowMs: 60 * 1000, // 1分
    maxRequests: 10,
  },

  // コメント作成: 1分間に5回まで
  COMMENT_CREATE: {
    windowMs: 60 * 1000, // 1分
    maxRequests: 5,
  },

  // API呼び出し: 1分間に100回まで
  API_REQUEST: {
    windowMs: 60 * 1000, // 1分
    maxRequests: 100,
  },

  // ログイン試行: 5分間に5回まで
  LOGIN_ATTEMPT: {
    windowMs: 5 * 60 * 1000, // 5分
    maxRequests: 5,
  },

  // パスワードリセット: 1時間に3回まで
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1時間
    maxRequests: 3,
  },
} as const;

/**
 * レート制限エラー
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public resetTime: number,
    public remaining: number = 0,
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * レート制限チェック用のヘルパー関数
 */
export function checkRateLimit(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS,
): void {
  const config = {
    ...RATE_LIMITS[limitType],
    identifier,
  };

  const result = rateLimiter.checkRateLimit(config);

  if (!result.allowed) {
    const resetIn = Math.ceil((result.resetTime! - Date.now()) / 1000 / 60); // 分単位
    throw new RateLimitError(
      `レート制限に達しました。${resetIn}分後に再試行してください。`,
      result.resetTime!,
      result.remaining,
    );
  }
}
