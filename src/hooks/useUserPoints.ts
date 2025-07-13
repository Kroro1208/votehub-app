import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth.ts";
import { supabase } from "../supabase-client.ts";

interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  created_at: string;
  updated_at: string;
}

interface PointTransaction {
  id: string;
  user_id: string;
  points: number;
  transaction_type: string;
  reference_id?: string;
  reference_table?: string;
  description?: string;
  created_at: string;
}

// ユーザーのポイントを取得する関数
const getUserPoints = async (userId: string): Promise<number> => {
  if (!userId) return 0;

  try {
    const { data, error } = await supabase.rpc("get_user_points", {
      target_user_id: userId,
    });

    if (error) {
      console.error("Error fetching user points:", error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error("Error in getUserPoints:", error);
    return 0;
  }
};

// ユーザーのポイント履歴を取得する関数
const getUserPointTransactions = async (
  userId: string,
): Promise<PointTransaction[]> => {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from("point_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching point transactions:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getUserPointTransactions:", error);
    return [];
  }
};

// ポイント詳細情報を取得する関数
const getUserPointsDetail = async (
  userId: string,
): Promise<UserPoints | null> => {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from("user_points")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 は "not found" エラー
      console.error("Error fetching user points detail:", error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error("Error in getUserPointsDetail:", error);
    return null;
  }
};

// ユーザーポイントを取得するカスタムフック
export const useUserPoints = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const {
    data: points,
    isLoading,
    error,
    refetch,
  } = useQuery<number, Error>({
    queryKey: ["userPoints", userId],
    queryFn: () => getUserPoints(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5分間キャッシュ
    gcTime: 1000 * 60 * 10, // 10分間ガベージコレクション対象外
  });

  return {
    points: points || 0,
    isLoading,
    error,
    refetch,
  };
};

// ユーザーポイント履歴を取得するカスタムフック
export const useUserPointTransactions = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const {
    data: transactions,
    isLoading,
    error,
    refetch,
  } = useQuery<PointTransaction[], Error>({
    queryKey: ["userPointTransactions", userId],
    queryFn: () => getUserPointTransactions(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2分間キャッシュ
  });

  return {
    transactions: transactions || [],
    isLoading,
    error,
    refetch,
  };
};

// ユーザーポイント詳細を取得するカスタムフック
export const useUserPointsDetail = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const {
    data: pointsDetail,
    isLoading,
    error,
    refetch,
  } = useQuery<UserPoints | null, Error>({
    queryKey: ["userPointsDetail", userId],
    queryFn: () => getUserPointsDetail(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5分間キャッシュ
  });

  return {
    pointsDetail,
    isLoading,
    error,
    refetch,
  };
};

// ポイント更新用のユーティリティ関数
export const usePointsUtils = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // ポイントキャッシュを無効化して再取得
  const invalidatePoints = () => {
    if (user?.id) {
      queryClient.invalidateQueries({
        queryKey: ["userPoints", user.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["userPointTransactions", user.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["userPointsDetail", user.id],
      });
    }
  };

  // 楽観的更新でポイントを即座に更新
  const optimisticUpdatePoints = (pointsToAdd: number) => {
    if (user?.id) {
      queryClient.setQueryData(
        ["userPoints", user.id],
        (oldPoints: number = 0) => {
          return Math.max(0, oldPoints + pointsToAdd);
        },
      );
    }
  };

  return {
    invalidatePoints,
    optimisticUpdatePoints,
  };
};

// ポイント種別の表示名を取得するユーティリティ
export const getPointTransactionDisplayName = (
  transactionType: string,
): string => {
  const displayNames: Record<string, string> = {
    vote: "投票",
    comment: "コメント",
    auto_spread: "自動拡散達成",
    priority_display: "優先表示",
    daily_limit_remove: "投稿制限解除",
    space_creation: "スペース作成",
  };

  return displayNames[transactionType] || transactionType;
};

// ポイント種別の色を取得するユーティリティ
export const getPointTransactionColor = (transactionType: string): string => {
  const colors: Record<string, string> = {
    vote: "text-blue-600",
    comment: "text-green-600",
    auto_spread: "text-purple-600",
    priority_display: "text-red-600",
    daily_limit_remove: "text-orange-600",
    space_creation: "text-indigo-600",
  };

  return colors[transactionType] || "text-gray-600";
};
