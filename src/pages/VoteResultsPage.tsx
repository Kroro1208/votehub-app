import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client.ts";
import { useAuth } from "../hooks/useAuth.ts";
import { Trophy, Clock, CalendarX, BarChart3 } from "lucide-react";
import Loading from "../components/Loading.tsx";
import ErrorMessage from "../components/ErrorMessage.tsx";
import RankingList from "../components/Vote/RankingList.tsx";
import { CompletedPost } from "../types/post.ts";
import RightPanel from "../components/Vote/RightPanel.tsx";

// 期限終了投稿データを取得する関数
const fetchCompletedPosts = async (limit = 20): Promise<CompletedPost[]> => {
  const { data, error } = await supabase.rpc(
    "get_popular_posts_completed_with_communities",
    {
      p_limit: limit,
    },
  );

  if (error) throw new Error(error.message);
  return data as CompletedPost[];
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

const VoteResultsPage = () => {
  const { user } = useAuth();

  // 期限終了投稿データを取得
  const {
    data: completedPosts,
    isLoading: postsLoading,
    error: postsError,
  } = useQuery<CompletedPost[], Error>({
    queryKey: ["completed-posts"],
    queryFn: () => fetchCompletedPosts(20),
    refetchInterval: 300000, // 5分ごとに更新
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
  if (!completedPosts || completedPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <CalendarX size={64} className="text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">
          終了した投票がありません
        </h2>
        <p className="text-gray-500">
          投票期限が終了した投票がある場合、ここに結果が表示されます。
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full">
              <Trophy size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              投票結果ランキング
            </h1>
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
              <BarChart3 size={32} className="text-white" />
            </div>
          </div>
          <p className="text-gray-600 text-lg">
            期限が終了した投票の結果を人気順でランキング表示
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
            <Clock size={16} />
            <span>5分ごとに自動更新</span>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex gap-8">
          {/* ランキングリスト */}
          <div className="flex-1">
            <RankingList
              posts={completedPosts}
              votedPostIds={votedPostIds}
              mode="completed"
            />
          </div>

          {/* サイドパネル - スコア説明 */}
          <RightPanel />
        </div>
      </div>
    </div>
  );
};

export default VoteResultsPage;
