import { supabase } from "../../supabase-client";
import { useQuery } from "@tanstack/react-query";

export interface QualityScoreData {
  id: number;
  user_id: string;
  post_id: number;
  vote_efficiency_score: number;
  discussion_activity_score: number;
  persuasion_effectiveness_score: number;
  sustained_interest_score: number;
  total_quality_score: number;
  quality_rank: "S" | "A" | "B" | "C" | "D" | "F";
  calculated_at: string;
  updated_at: string;
}

export interface UserQualityScoreStats {
  user_id: string;
  total_posts: number;
  average_quality_score: number;
  highest_quality_score: number;
  quality_rank_distribution: {
    S: number;
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
  overall_quality_rank: "S" | "A" | "B" | "C" | "D" | "F";
  recent_scores: QualityScoreData[];
}

const getUserQualityScores = async (
  userId: string,
): Promise<UserQualityScoreStats | null> => {
  if (!userId) return null;

  // 全投稿の品質スコアを取得
  const { data: scores, error } = await supabase
    .from("user_quality_scores")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching quality scores:", error);
    return null;
  }

  if (!scores || scores.length === 0) {
    return {
      user_id: userId,
      total_posts: 0,
      average_quality_score: 0,
      highest_quality_score: 0,
      quality_rank_distribution: { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 },
      overall_quality_rank: "F",
      recent_scores: [],
    };
  }

  // 統計計算
  const totalPosts = scores.length;
  const averageScore =
    scores.reduce((sum, score) => sum + score.total_quality_score, 0) /
    totalPosts;
  const highestScore = Math.max(
    ...scores.map((score) => score.total_quality_score),
  );

  // ランク分布計算
  const rankDistribution = scores.reduce(
    (acc, score) => {
      acc[score.quality_rank] = (acc[score.quality_rank] || 0) + 1;
      return acc;
    },
    { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 },
  );

  // 総合ランク決定（平均スコアベース）
  let overallRank: "S" | "A" | "B" | "C" | "D" | "F";
  if (averageScore >= 90) overallRank = "S";
  else if (averageScore >= 80) overallRank = "A";
  else if (averageScore >= 70) overallRank = "B";
  else if (averageScore >= 60) overallRank = "C";
  else if (averageScore >= 50) overallRank = "D";
  else overallRank = "F";

  return {
    user_id: userId,
    total_posts: totalPosts,
    average_quality_score: Math.round(averageScore * 100) / 100,
    highest_quality_score: Math.round(highestScore * 100) / 100,
    quality_rank_distribution: rankDistribution,
    overall_quality_rank: overallRank,
    recent_scores: scores.slice(0, 5), // 最新5件
  };
};

export const useUserQualityScore = (userId: string | null | undefined) => {
  return useQuery<UserQualityScoreStats | null, Error>({
    queryKey: ["userQualityScore", userId],
    queryFn: () => getUserQualityScores(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間キャッシュ保持
  });
};

// 個別投稿の品質スコア計算を実行する関数
export const calculatePostQualityScore = async (
  postId: number,
  userId: string,
): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc("calculate_quality_score", {
      input_post_id: postId,
      input_user_id: userId,
    });

    if (error) {
      console.error("Error calculating quality score:", error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error("Error calculating quality score:", error);
    return 0;
  }
};
