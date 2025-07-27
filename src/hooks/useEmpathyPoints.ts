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

// 既存のRPC関数を使用
export const useUserEmpathyPoints = (userId?: string) => {
  return useQuery<UserEmpathyPoints, Error>({
    queryKey: ["userEmpathyPoints", userId],
    queryFn: async () => {
      if (!userId) throw new Error("ユーザーIDが必要です");

      // 既存のRPC関数を使用
      const { data, error } = await supabase.rpc("get_user_empathy_points", {
        target_user_id: userId as string,
      });

      if (error) {
        console.error("共感ポイント取得エラー:", error);
        return {
          total_points: 0,
          empathy_points: 0,
          empathy_rank: null,
        };
      }

      return {
        total_points: data?.total_points || 0,
        empathy_points: data?.empathy_points || 0,
        empathy_rank: data?.empathy_rank || null,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};

// 既存のRPC関数を使用
export const useEmpathyRankings = (
  communityId?: number,
  limit: number = 10,
) => {
  return useQuery<EmpathyScore[], Error>({
    queryKey: ["empathyRankings", communityId, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_leaderboard", {
        limit_count: limit,
      });

      if (error) throw new Error(error.message);
      return data as EmpathyScore[];
    },
    staleTime: 1000 * 60 * 2,
  });
};

// 既存のRPC関数を使用
export const useUserEmpathyStats = (userId?: string, communityId?: number) => {
  return useQuery({
    queryKey: ["userEmpathyStats", userId, communityId],
    queryFn: async () => {
      if (!userId) throw new Error("ユーザーIDが必要です");

      // 既存のRPC関数を使用
      const { data, error } = await supabase.rpc("get_user_empathy_points", {
        target_user_id: userId as string,
      });

      if (error) {
        console.error("共感統計取得エラー:", error);
        return {
          total_empathy_points: 0,
          positive_reactions: 0,
          negative_reactions: 0,
          net_empathy_score: 0,
        };
      }

      return {
        total_empathy_points: data?.empathy_points || 0,
        positive_reactions: 0,
        negative_reactions: 0,
        net_empathy_score: data?.empathy_points || 0,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};
