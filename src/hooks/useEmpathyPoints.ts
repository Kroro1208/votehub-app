import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client.ts";

interface EmpathyScore {
  user_id: string;
  total_empathy_points: number;
  total_reactions: number;
  rank_position: number;
}

interface UserEmpathyPoints {
  total_points: number;
  empathy_points: number;
  empathy_rank: number | null;
}

// ユーザーの共感ポイントを取得
export const useUserEmpathyPoints = (userId?: string) => {
  return useQuery<UserEmpathyPoints, Error>({
    queryKey: ["userEmpathyPoints", userId],
    queryFn: async () => {
      if (!userId) throw new Error("ユーザーIDが必要です");

      try {
        // 総ポイントを取得
        const { data: userPoints, error: pointsError } = await supabase
          .from("user_points")
          .select("total_points")
          .eq("user_id", userId)
          .single();

        if (pointsError) {
          console.error("ユーザーポイント取得エラー:", pointsError);
        }

        // 共感ポイントの合計を取得
        const { data: empathyTransactions, error: empathyError } =
          await supabase
            .from("point_transactions")
            .select("points")
            .eq("user_id", userId)
            .eq("transaction_type", "empathy");

        if (empathyError) {
          console.error("共感ポイント取得エラー:", empathyError);
        }

        const empathyPoints =
          empathyTransactions?.reduce(
            (total: number, transaction: { points: number }) =>
              total + transaction.points,
            0,
          ) || 0;

        // 共感ランキングを取得
        const { data: rankings, error: rankError } = await supabase.rpc(
          "get_empathy_rankings",
          {
            p_community_id: null, // 全体ランキング
            p_limit: 100,
          },
        );
        console.log("ランキングデータ:", rankings);

        if (rankError) {
          console.error("ランキング取得エラー:", rankError);
        }

        const userRank =
          rankings?.find((r: EmpathyScore) => r.user_id === userId)
            ?.rank_position || null;

        return {
          total_points: userPoints?.total_points || 0,
          empathy_points: empathyPoints,
          empathy_rank: userRank,
        };
      } catch (error) {
        console.error("Error in useUserEmpathyPoints:", error);
        return {
          total_points: 0,
          empathy_points: 0,
          empathy_rank: null,
        };
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5分間キャッシュ
    retry: 1, // リトライ回数を制限
  });
};

// コミュニティ別共感ポイントランキングを取得
export const useEmpathyRankings = (
  communityId?: number,
  limit: number = 10,
) => {
  return useQuery<EmpathyScore[], Error>({
    queryKey: ["empathyRankings", communityId, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_empathy_rankings", {
        p_community_id: communityId || null,
        p_limit: limit,
      });

      if (error) throw new Error(error.message);
      return data as EmpathyScore[];
    },
    staleTime: 1000 * 60 * 2, // 2分間キャッシュ
  });
};

// ユーザーの共感統計を取得
export const useUserEmpathyStats = (userId?: string, communityId?: number) => {
  return useQuery({
    queryKey: ["userEmpathyStats", userId, communityId],
    queryFn: async () => {
      if (!userId) throw new Error("ユーザーIDが必要です");

      const { data, error } = await supabase
        .from("empathy_scores")
        .select("*")
        .eq("user_id", userId)
        .eq("community_id", communityId || 0)
        .single();

      if (error && error.code !== "PGRST116") {
        // データが見つからない場合以外のエラー
        throw new Error(error.message);
      }

      return (
        data || {
          total_empathy_points: 0,
          positive_reactions: 0,
          negative_reactions: 0,
          net_empathy_score: 0,
        }
      );
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};
