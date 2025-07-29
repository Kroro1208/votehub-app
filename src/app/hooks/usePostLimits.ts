import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "../../supabase-client";

export interface PostLimitStatus {
  can_post: boolean;
  current_count: number;
  daily_limit: number;
  remaining_posts: number;
  membership_type: string;
}

export interface PostLimitRemovalResult {
  success: boolean;
  message: string;
  newPostCount: number;
  newLimit: number;
}

export const usePostLimits = () => {
  const { user } = useAuth();
  const [postLimitStatus, setPostLimitStatus] =
    useState<PostLimitStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 投稿制限状況を取得
  const checkPostLimit = useCallback(
    async (
      userId?: string,
      forceRefresh?: boolean,
    ): Promise<PostLimitStatus | null> => {
      if (!userId && !user?.id) return null;

      setIsLoading(true);
      setError(null);

      try {
        const targetUserId = userId || user?.id;
        const currentDate = new Date().toISOString().split("T")[0];

        // 強制リフレッシュまたは日付が変わった場合の処理
        if (forceRefresh) {
          // 日次リセットを実行
          await supabase.rpc("ensure_daily_reset", {
            p_user_id: targetUserId,
            p_current_date: currentDate,
          });
        }

        const { data, error } = await supabase.rpc("check_user_post_limit", {
          p_user_id: targetUserId,
          p_post_date: currentDate,
        });

        if (error) {
          console.error("投稿制限チェックエラー:", error);
          setError(
            `投稿制限の確認に失敗しました: ${error.message || error.code || "Unknown error"}`,
          );
          return null;
        }

        if (data && data.length > 0) {
          const status = data[0] as PostLimitStatus;
          setPostLimitStatus(status);
          return status;
        }

        // データがない場合のデフォルト値
        const defaultStatus: PostLimitStatus = {
          can_post: true,
          current_count: 0,
          daily_limit: 10,
          remaining_posts: 10,
          membership_type: "free",
        };
        setPostLimitStatus(defaultStatus);
        return defaultStatus;
      } catch (err) {
        console.error("投稿制限チェック例外:", err);
        setError("投稿制限の確認中にエラーが発生しました");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id],
  );

  // 投稿数を増加（投稿作成時に呼び出す）
  const incrementPostCount = async (userId?: string): Promise<boolean> => {
    if (!userId && !user?.id) return false;

    setIsLoading(true);
    setError(null);

    try {
      const targetUserId = userId || user?.id;

      const { data, error } = await supabase.rpc("increment_user_post_count", {
        p_user_id: targetUserId,
        p_post_date: new Date().toISOString().split("T")[0],
      });

      if (error) {
        console.error("投稿数増加エラー:", error);
        setError("投稿数の更新に失敗しました");
        return false;
      }

      // 投稿制限状況を再取得
      await checkPostLimit(targetUserId);

      return data === true;
    } catch (err) {
      console.error("投稿数増加例外:", err);
      setError("投稿数の更新中にエラーが発生しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ポイントで投稿制限を解除
  const removePostLimitWithPoints = async (
    pointsCost: number = 30,
  ): Promise<PostLimitRemovalResult | null> => {
    if (!user?.id) return null;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc(
        "remove_post_limit_with_points",
        {
          p_user_id: user.id,
          p_points_cost: pointsCost,
        },
      );

      if (error) {
        console.error("投稿制限解除エラー:", error);
        setError("投稿制限の解除に失敗しました");
        return null;
      }

      if (data && data.length > 0) {
        const result = data[0] as PostLimitRemovalResult;

        // 成功した場合、投稿制限状況を再取得
        if (result.success) {
          await checkPostLimit();
        }

        return result;
      }

      return null;
    } catch (err) {
      console.error("投稿制限解除例外:", err);
      setError("投稿制限の解除中にエラーが発生しました");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // ユーザーの会員グレードを更新
  const updateMembershipType = async (
    membershipType: "free" | "standard" | "platinum" | "diamond",
  ): Promise<boolean> => {
    if (!user?.id) return false;

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.from("user_memberships").upsert({
        user_id: user.id,
        membership_type: membershipType,
        daily_post_limit:
          membershipType === "free"
            ? 10
            : membershipType === "standard"
              ? 5
              : membershipType === "platinum"
                ? 15
                : 999999,
        priority_tickets:
          membershipType === "free"
            ? 0
            : membershipType === "standard"
              ? 3
              : membershipType === "platinum"
                ? 10
                : 30,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("会員グレード更新エラー:", error);
        setError("会員グレードの更新に失敗しました");
        return false;
      }

      // 投稿制限状況を再取得
      await checkPostLimit();

      return true;
    } catch (err) {
      console.error("会員グレード更新例外:", err);
      setError("会員グレードの更新中にエラーが発生しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 投稿制限解除履歴を取得
  const getPostLimitRemovalHistory = async (limit: number = 10) => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from("post_limit_removals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("制限解除履歴取得エラー:", error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error("制限解除履歴取得例外:", err);
      return [];
    }
  };

  // 本日の投稿制限解除回数を取得
  const getTodayLimitRemovalCount = async (): Promise<number> => {
    if (!user?.id) return 0;

    try {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("daily_post_counts")
        .select("limit_removed_count")
        .eq("user_id", user.id)
        .eq("post_date", today)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("制限解除回数取得エラー:", error);
        return 0;
      }

      return data?.limit_removed_count || 0;
    } catch (err) {
      console.error("制限解除回数取得例外:", err);
      return 0;
    }
  };

  // ユーザーログイン時に投稿制限状況を自動取得
  useEffect(() => {
    if (user?.id) {
      checkPostLimit(user.id, true); // 初回は強制リフレッシュ
    }
  }, [user?.id, checkPostLimit]);

  // 日付変更検知用のInterval
  useEffect(() => {
    if (!user?.id) return;

    let lastCheckDate = new Date().toDateString();

    const intervalId = setInterval(() => {
      const currentDate = new Date().toDateString();
      if (currentDate !== lastCheckDate) {
        lastCheckDate = currentDate;
        checkPostLimit(user.id, true); // 日付変更時は強制リフレッシュ
      }
    }, 60000); // 1分ごとにチェック

    return () => clearInterval(intervalId);
  }, [user?.id, checkPostLimit]);

  return {
    postLimitStatus,
    isLoading,
    error,
    checkPostLimit,
    incrementPostCount,
    removePostLimitWithPoints,
    updateMembershipType,
    getPostLimitRemovalHistory,
    getTodayLimitRemovalCount,
  };
};
