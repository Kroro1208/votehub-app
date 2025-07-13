import React from "react";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client.ts";
import { useAuth } from "../hooks/useAuth.ts";
import { Flame, Trophy, TrendingUp, Clock } from "lucide-react";

import Loading from "../components/Loading.tsx";
import ErrorMessage from "../components/ErrorMessage.tsx";
import RankingList from "../components/Vote/RankingList.tsx";
import { PopularPost } from "../types/post.ts";

// リアルタイム人気投稿データを取得する関数
const fetchPopularPosts = async (limit = 20): Promise<PopularPost[]> => {
  const { data, error } = await supabase.rpc(
    "get_popular_posts_active_with_communities",
    {
      p_limit: limit,
    },
  );

  if (error) throw new Error(error.message);
  return data as PopularPost[];
};

// ユーザーの投票済み投稿IDを取得
const fetchUserVotedPosts = async (userId: string): Promise<Set<number>> => {
  const { data, error } = await supabase
    .from("votes")
    .select("post_id")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return new Set(data.map((vote) => vote.post_id));
};

const PopularVotesPage = () => {
  const { user } = useAuth();

  // 人気投稿データを取得
  const {
    data: popularPosts,
    isLoading: postsLoading,
    error: postsError,
  } = useQuery<PopularPost[], Error>({
    queryKey: ["popular-posts"],
    queryFn: () => fetchPopularPosts(20),
    refetchInterval: 600000, // 60秒ごとに更新
  });

  // ユーザーの投票済み投稿を取得
  const {
    data: votedPostIds,
    isLoading: votesLoading,
    error: votesError,
  } = useQuery<Set<number>, Error>({
    queryKey: ["user-voted-posts", user?.id],
    queryFn: () => fetchUserVotedPosts(user!.id),
    enabled: !!user?.id,
  });

  if (postsLoading || votesLoading) return <Loading />;
  if (postsError || votesError)
    return <ErrorMessage error={postsError ?? votesError} />;
  if (!popularPosts || popularPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <TrendingUp size={64} className="text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">
          人気の投票がありません
        </h2>
        <p className="text-gray-500">
          投票が増えると、ここに人気の投票が表示されます。
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
              <Flame size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              人気の投票ランキング
            </h1>
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
              <Trophy size={32} className="text-white" />
            </div>
          </div>
          <p className="text-gray-600 text-lg">
            全スペースから最も人気の高いリアルタイム投票をランキング形式で表示
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
            <Clock size={16} />
            <span>1分ごとに自動更新</span>
          </div>
        </div>

        {/* ランキングリスト */}
        <RankingList
          posts={popularPosts}
          votedPostIds={votedPostIds}
          mode="active"
        />
      </div>
    </div>
  );
};

export default PopularVotesPage;
