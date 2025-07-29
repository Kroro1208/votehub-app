import { supabase } from "../../supabase-client";
import { useQuery } from "@tanstack/react-query";

interface HomeStats {
  votingPosts: number;
  todayParticipation: number;
  activeUsers: number;
}

interface PostUser {
  user_id: string;
}

interface VoteUser {
  user_id: string;
}

interface CommentUser {
  user_id: string;
}

const getHomeStats = async (): Promise<HomeStats> => {
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  try {
    // 1. 投票中の投稿数（今日投票可能な投稿）
    const { count: votingPosts } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .gte("vote_deadline", new Date().toISOString())
      .order("created_at", { ascending: false });

    // 2. 今日の参加ユーザー数（投稿または投票したユーザー）
    // 今日投稿したユーザー
    const { data: todayPosters } = await supabase
      .from("posts")
      .select("user_id")
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd);

    // 今日投票したユーザー
    const { data: todayVoters } = await supabase
      .from("votes")
      .select("user_id")
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd);

    // 重複を除いた今日の参加ユーザー数
    const posterIds = new Set(
      (todayPosters as PostUser[])?.map((p) => p.user_id) || [],
    );
    const voterIds = new Set(
      (todayVoters as VoteUser[])?.map((v) => v.user_id) || [],
    );
    const allParticipants = new Set([
      ...Array.from(posterIds),
      ...Array.from(voterIds),
    ]);
    const todayParticipation = allParticipants.size;

    // 3. アクティブユーザー数（最近24時間以内に活動したユーザー）
    const last24Hours = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString();

    // 最近24時間の投稿ユーザー
    const { data: recentPosters } = await supabase
      .from("posts")
      .select("user_id")
      .gte("created_at", last24Hours);

    // 最近24時間の投票ユーザー
    const { data: recentVoters } = await supabase
      .from("votes")
      .select("user_id")
      .gte("created_at", last24Hours);

    // 最近24時間のコメントユーザー
    const { data: recentCommenters } = await supabase
      .from("comments")
      .select("user_id")
      .gte("created_at", last24Hours);

    // 重複を除いたアクティブユーザー数
    const recentPosterIds = new Set(
      (recentPosters as PostUser[])?.map((p) => p.user_id) || [],
    );
    const recentVoterIds = new Set(
      (recentVoters as VoteUser[])?.map((v) => v.user_id) || [],
    );
    const recentCommenterIds = new Set(
      (recentCommenters as CommentUser[])?.map((c) => c.user_id) || [],
    );
    const allActiveUsers = new Set([
      ...Array.from(recentPosterIds),
      ...Array.from(recentVoterIds),
      ...Array.from(recentCommenterIds),
    ]);
    const activeUsers = allActiveUsers.size;

    return {
      votingPosts: votingPosts || 0,
      todayParticipation,
      activeUsers,
    };
  } catch (error) {
    console.error("Error fetching home stats:", error);
    return {
      votingPosts: 0,
      todayParticipation: 0,
      activeUsers: 0,
    };
  }
};

export const useHomeStats = () => {
  return useQuery<HomeStats>({
    queryKey: ["homeStats"],
    queryFn: getHomeStats,
    staleTime: 1000 * 60 * 2, // 2分間キャッシュ
    refetchInterval: 1000 * 60 * 5, // 5分ごとに自動更新
    refetchOnWindowFocus: true, // ウィンドウフォーカス時に更新
  });
};
