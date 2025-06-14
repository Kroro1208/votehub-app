import { useQuery } from "@tanstack/react-query";
import ErrorMessage from "./ErrorMessage";
import Loading from "./Loading";
import type { PostType } from "./PostList";
import { supabase } from "../supabase-client";
import { Link } from "react-router";
import {
  Clock,
  MessageCircle,
  TrendingUp,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

interface Props {
  communityId: number;
}

interface CommunityItemType extends PostType {
  communities?: { name: string };
}

const getCommunitityItem = async (
  communityId: number,
): Promise<CommunityItemType[]> => {
  // get_posts_with_counts関数を使用して投票数とコメント数を取得
  const { data, error } = await supabase
    .rpc("get_posts_with_counts")
    .eq("community_id", communityId);

  if (error) throw new Error(error.message);

  // コミュニティ名を追加で取得
  const postsWithCommunity = await Promise.all(
    data.map(async (post: PostType) => {
      const { data: communityData } = await supabase
        .from("communities")
        .select("name")
        .eq("id", post.community_id)
        .single();

      return {
        ...post,
        communities: communityData ? { name: communityData.name } : undefined,
      };
    }),
  );

  return postsWithCommunity as CommunityItemType[];
};

// ユーザーの投票済み投稿IDを取得する関数
const getUserVotedPostIds = async (userId?: string): Promise<Set<number>> => {
  if (!userId) return new Set();

  const { data, error } = await supabase
    .from("votes")
    .select("post_id")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return new Set(data.map((vote) => vote.post_id));
};

const CommunityItem = ({ communityId }: Props) => {
  const { user } = useAuth();

  const {
    data: communityItemData,
    isPending,
    error,
  } = useQuery<CommunityItemType[], Error>({
    queryKey: ["communitiyPost", communityId],
    queryFn: () => getCommunitityItem(communityId),
  });

  // ユーザーの投票済み投稿IDを取得
  const { data: votedPostIds } = useQuery({
    queryKey: ["userVotedPosts", user?.id],
    queryFn: () => getUserVotedPostIds(user?.id),
    enabled: !!user?.id,
  });

  // 投票期限をチェックする関数
  const isVotingExpired = (voteDeadline?: string | null) => {
    if (!voteDeadline) return false;
    return new Date() > new Date(voteDeadline);
  };

  // 投票期限を日本語で表示する関数
  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) return "期限終了";
    if (diffDays === 0) return "今日まで";
    if (diffDays === 1) return "明日まで";
    return `${diffDays}日後まで`;
  };

  if (isPending) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="bg-blue-100 rounded-2xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {communityItemData?.[0]?.communities?.name ?? "このコミュニティ"}
            </h1>
            <p className="text-gray-600 mt-2">の投稿一覧</p>
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
              <TrendingUp size={16} />
              <span>{communityItemData?.length || 0}件の投稿</span>
            </div>
          </div>
        </div>

        {/* 投稿一覧 */}
        <div className="grid gap-6">
          {communityItemData?.map((item) => {
            const votingExpired = isVotingExpired(item.vote_deadline);
            // 投票済みかどうかを判定
            const hasUserVoted = votedPostIds?.has(item.id) ?? false;

            return (
              <Link key={item.id} to={`/post/${item.id}`}>
                <article className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden">
                  <div className="p-6">
                    {/* ヘッダー部分 */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative">
                        <img
                          src={item.avatar_url}
                          alt="ユーザーアバター"
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {item.title}
                        </h2>

                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <time>
                              {new Date(item.created_at).toLocaleDateString(
                                "ja-JP",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </time>
                          </div>

                          {/* 投票期限バッジ */}
                          {item.vote_deadline && (
                            <div
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                votingExpired
                                  ? "bg-red-100 text-red-600"
                                  : "bg-blue-100 text-blue-600"
                              }`}
                            >
                              <Clock size={12} />
                              <span>{formatDeadline(item.vote_deadline)}</span>
                            </div>
                          )}

                          {/* 投票済みバッジ */}
                          {hasUserVoted && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                              <CheckCircle size={12} />
                              <span>投票済み</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* コンテンツ */}
                    <p className="text-gray-700 mb-4 line-clamp-3 leading-relaxed">
                      {item.content}
                    </p>

                    {/* 画像 */}
                    {item.image_url && (
                      <div className="relative mb-4 overflow-hidden rounded-xl">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    )}

                    {/* フッター統計 */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <TrendingUp size={16} />
                          <span>{item.vote_count || 0} 票</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle size={16} />
                          <span>{item.comment_count || 0} コメント</span>
                        </div>
                      </div>

                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          votingExpired
                            ? "bg-gray-100 text-gray-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {votingExpired ? "投票終了" : "投票中"}
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        {/* 空の状態 */}
        {communityItemData?.length === 0 && (
          <div className="text-center py-16">
            <div className="rounded-2xl shadow-sm border border-gray-200 p-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                まだ投稿がありません
              </h3>
              <p className="text-gray-500">
                このコミュニティで最初の投稿をしてみませんか？
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityItem;
