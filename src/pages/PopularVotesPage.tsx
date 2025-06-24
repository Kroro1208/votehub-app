import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "../hooks/useAuth";
import {
  CheckCircle,
  Flame,
  Trophy,
  Users,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Link } from "react-router";
import { getTimeRemaining, isVotingExpired } from "../utils/formatTime";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

interface PopularPost {
  id: number;
  title: string;
  content: string;
  created_at: string;
  image_url: string | null;
  avatar_url: string | null;
  vote_deadline: string | null;
  community_id: number;
  user_id: string;
  parent_post_id: number | null;
  nest_level: number;
  target_vote_choice: number | null;
  vote_count: number;
  comment_count: number;
  popularity_score: number;
  communities: {
    id: number;
    name: string;
    description: string;
  } | null;
}

// 人気投稿データを取得する関数
const fetchPopularPosts = async (limit = 20): Promise<PopularPost[]> => {
  const { data, error } = await supabase.rpc(
    "get_popular_posts_with_communities",
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
            全スペースから最も人気の高い投票をランキング形式で表示
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
            <Clock size={16} />
            <span>1分ごとに自動更新</span>
          </div>
        </div>

        {/* ランキングリスト */}
        <div className="space-y-4">
          {popularPosts.map((post, index) => {
            const votingExpired = isVotingExpired(post.vote_deadline);
            const hasUserVoted = votedPostIds?.has(post.id) ?? false;
            const timeRemaining = getTimeRemaining(post.vote_deadline);

            // ランク別のスタイリング
            const getRankStyling = (rank: number) => {
              if (rank === 0) {
                return {
                  container:
                    "border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-xl",
                  leftBorder: "bg-gradient-to-b from-yellow-400 to-orange-500",
                  badge: "bg-gradient-to-br from-yellow-400 to-yellow-600",
                  crown: true,
                };
              } else if (rank === 1) {
                return {
                  container:
                    "border-gray-300 bg-gradient-to-r from-gray-50 to-slate-50 shadow-lg",
                  leftBorder: "bg-gradient-to-b from-gray-400 to-gray-500",
                  badge: "bg-gradient-to-br from-gray-400 to-gray-600",
                  crown: false,
                };
              } else if (rank === 2) {
                return {
                  container:
                    "border-orange-300 bg-gradient-to-r from-orange-50 to-red-50 shadow-lg",
                  leftBorder: "bg-gradient-to-b from-orange-400 to-red-500",
                  badge: "bg-gradient-to-br from-orange-500 to-red-600",
                  crown: false,
                };
              } else {
                return {
                  container: "border-gray-200 bg-white shadow-md",
                  leftBorder: "bg-gradient-to-b from-blue-400 to-purple-500",
                  badge: "bg-gradient-to-br from-blue-500 to-purple-600",
                  crown: false,
                };
              }
            };

            const styling = getRankStyling(index);

            return (
              <Link
                key={post.id}
                to={`/post/${post.id}`}
                className="block group"
              >
                <div
                  className={`relative rounded-xl border transition-all duration-300 hover:shadow-xl group-hover:scale-[1.005] overflow-hidden ${styling.container}`}
                >
                  {/* ランク装飾 */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-2 ${styling.leftBorder}`}
                  />

                  <div className="flex items-center p-6 pl-8">
                    {/* 順位バッジ */}
                    <div className="flex-shrink-0 mr-6">
                      <div className="relative">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg ${styling.badge}`}
                        >
                          {index + 1}
                          {styling.crown && (
                            <div className="absolute -top-2 -right-2">
                              <div className="w-6 h-6 bg-yellow-300 rounded-full flex items-center justify-center">
                                <Trophy size={14} className="text-yellow-600" />
                              </div>
                            </div>
                          )}
                        </div>
                        {index < 3 && (
                          <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                            TOP {index + 1}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* コンテンツエリア */}
                    <div className="flex-1 min-w-0 mr-6">
                      {/* コミュニティタグ */}
                      <div className="flex items-center space-x-2 mb-2">
                        {post.avatar_url ? (
                          <img
                            src={post.avatar_url}
                            alt="UserAvatar"
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tl from-orange-500 to-red-500" />
                        )}
                        <span className="text-sm text-gray-600 font-medium">
                          {post.communities?.name || "未分類"}
                        </span>
                        <div className="h-1 w-1 bg-gray-400 rounded-full" />
                        <span className="text-xs text-gray-500">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* タイトル */}
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                        {post.title}
                      </h3>

                      {/* スタッツとバッジ */}
                      <div className="flex items-center gap-4">
                        {hasUserVoted && (
                          <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center space-x-1 font-medium">
                            <CheckCircle size={14} />
                            <span>投票済</span>
                          </span>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Users size={16} />
                            <span className="font-semibold">
                              {post.vote_count}
                            </span>
                            <span>票</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 rounded-full bg-gray-400" />
                            <span>{post.comment_count} コメント</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp size={16} className="text-orange-500" />
                            <span className="font-semibold text-orange-600">
                              {post.popularity_score.toFixed(1)} pt
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 右側エリア */}
                    <div className="flex-shrink-0 flex items-center space-x-4">
                      {/* タイマー */}
                      {timeRemaining && (
                        <div
                          className={`text-sm font-medium px-3 py-2 rounded-lg ${
                            votingExpired
                              ? "bg-gray-100 text-gray-500"
                              : "bg-orange-100 text-orange-600"
                          }`}
                        >
                          {votingExpired ? "終了" : `残り${timeRemaining}`}
                        </div>
                      )}

                      {/* 画像 */}
                      {post.image_url && (
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-20 h-20 object-cover rounded-lg shadow-md"
                        />
                      )}
                    </div>
                  </div>

                  {/* ホバー効果 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* フッター */}
        <div className="text-center mt-12 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-600 mb-2">
            人気度スコア = 投票数 + コメント数 × 0.5 + 新規度ボーナス
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>• 24時間以内の投稿: 1.5倍ボーナス</p>
            <p>• 48時間以内の投稿: 1.2倍ボーナス</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopularVotesPage;
