import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";

export interface EmpathyPointsData {
  id: number;
  user_id: string;
  post_evaluation_score: number;
  comment_evaluation_score: number;
  participation_continuity_score: number;
  community_contribution_score: number;
  interaction_score: number;
  total_empathy_points: number;
  empathy_rank:
    | "legend"
    | "master"
    | "expert"
    | "active"
    | "contributor"
    | "participant"
    | "new";
  badge_icon: string;
  empathy_ranking_position: number;
  created_at: string;
  updated_at: string;
}

export interface EmpathyRankInfo {
  rank:
    | "legend"
    | "master"
    | "expert"
    | "active"
    | "contributor"
    | "participant"
    | "new";
  badge_icon: string;
  min_points: number;
  color: string;
  description: string;
}

const EMPATHY_RANKS: EmpathyRankInfo[] = [
  {
    rank: "legend",
    badge_icon: "🏆",
    min_points: 10000,
    color: "text-yellow-500",
    description: "レジェンド",
  },
  {
    rank: "master",
    badge_icon: "💎",
    min_points: 5000,
    color: "text-blue-500",
    description: "マスター",
  },
  {
    rank: "expert",
    badge_icon: "🌟",
    min_points: 2000,
    color: "text-purple-500",
    description: "エキスパート",
  },
  {
    rank: "active",
    badge_icon: "⚡",
    min_points: 1000,
    color: "text-orange-500",
    description: "アクティブ",
  },
  {
    rank: "contributor",
    badge_icon: "🔥",
    min_points: 500,
    color: "text-red-500",
    description: "コントリビューター",
  },
  {
    rank: "participant",
    badge_icon: "🌱",
    min_points: 100,
    color: "text-green-500",
    description: "パーティシパント",
  },
  {
    rank: "new",
    badge_icon: "👶",
    min_points: 0,
    color: "text-gray-500",
    description: "ニューカマー",
  },
];

const getUserEmpathyPoints = async (
  userId: string,
): Promise<EmpathyPointsData | null> => {
  if (!userId) return null;

  // 既存のデータを取得
  const { data: existingData, error: fetchError } = await supabase
    .from("user_empathy_points")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error fetching empathy points:", fetchError);
    return null;
  }

  // データが存在しない場合は初期化
  if (!existingData) {
    try {
      const { error: initError } = await supabase.rpc(
        "initialize_user_empathy_points",
        {
          input_user_id: userId,
        },
      );

      if (initError) {
        console.error("Error initializing empathy points:", initError);
        return null;
      }

      // 初期化後に再度データを取得
      const { data: newData, error: refetchError } = await supabase
        .from("user_empathy_points")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (refetchError) {
        console.error("Error refetching empathy points:", refetchError);
        return null;
      }

      return newData;
    } catch (error) {
      console.error("Error in empathy points initialization:", error);
      return null;
    }
  }

  return existingData;
};

const getEmpathyRanking = async (
  userId: string,
): Promise<{ position: number; totalUsers: number } | null> => {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from("user_empathy_points")
      .select("user_id, total_empathy_points, empathy_ranking_position")
      .order("total_empathy_points", { ascending: false });

    if (error) {
      console.error("Error fetching empathy ranking:", error);
      return null;
    }

    const userIndex = data.findIndex((user) => user.user_id === userId);
    if (userIndex === -1) return null;

    return {
      position: userIndex + 1,
      totalUsers: data.length,
    };
  } catch (error) {
    console.error("Error in empathy ranking:", error);
    return null;
  }
};

export const useUserEmpathyScore = (userId: string | null | undefined) => {
  return useQuery<EmpathyPointsData | null, Error>({
    queryKey: ["userEmpathyScore", userId],
    queryFn: () => getUserEmpathyPoints(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間キャッシュ保持
  });
};

export const useEmpathyRanking = (userId: string | null | undefined) => {
  return useQuery<{ position: number; totalUsers: number } | null, Error>({
    queryKey: ["empathyRanking", userId],
    queryFn: () => getEmpathyRanking(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10分間キャッシュ
    gcTime: 15 * 60 * 1000, // 15分間キャッシュ保持
  });
};

// 共感ポイント計算を実行する関数
export const calculateUserEmpathyPoints = async (
  userId: string,
): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc("calculate_empathy_points", {
      input_user_id: userId,
    });

    if (error) {
      console.error("Error calculating empathy points:", error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error("Error calculating empathy points:", error);
    return 0;
  }
};

// ランキング更新を実行する関数
export const updateEmpathyRankings = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc("update_empathy_rankings");

    if (error) {
      console.error("Error updating empathy rankings:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating empathy rankings:", error);
    return false;
  }
};

// ランク情報を取得するユーティリティ関数
export const getEmpathyRankInfo = (rank: string): EmpathyRankInfo => {
  const rankInfo = EMPATHY_RANKS.find((r) => r.rank === rank);
  return rankInfo || EMPATHY_RANKS[EMPATHY_RANKS.length - 1]; // デフォルトは'new'
};

// 次のランクまでのポイントを計算するユーティリティ関数
export const getPointsToNextRank = (
  currentPoints: number,
  currentRank: string,
): { nextRank: EmpathyRankInfo | null; pointsNeeded: number } => {
  const currentRankIndex = EMPATHY_RANKS.findIndex(
    (r) => r.rank === currentRank,
  );

  if (currentRankIndex === -1 || currentRankIndex === 0) {
    return { nextRank: null, pointsNeeded: 0 };
  }

  const nextRank = EMPATHY_RANKS[currentRankIndex - 1];
  const pointsNeeded = nextRank.min_points - currentPoints;

  return {
    nextRank: pointsNeeded > 0 ? nextRank : null,
    pointsNeeded: Math.max(0, pointsNeeded),
  };
};
