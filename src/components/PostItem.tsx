import { Link } from "react-router";
import type { PostType } from "./PostList";
import { Clock, Users, CheckCircle, AlertTriangle, Trophy } from "lucide-react";
import { supabase } from "../supabase-client";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface PostItemType {
  post: PostType;
}

// 投稿の投票状況を取得する関数
const getUserVoteForPost = async (postId: number, userId?: string) => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("votes")
    .select("vote")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? data?.vote : null;
};

const PostItem = ({ post }: PostItemType) => {
  const { user } = useAuth();

  // ユーザーの投票状況を取得
  const { data: userVote } = useQuery({
    queryKey: ["userVote", post.id, user?.id],
    queryFn: () => getUserVoteForPost(post.id, user?.id),
    enabled: !!user?.id,
  });

  const hasUserVoted = userVote !== null && userVote !== undefined;

  // 投稿者かどうかをチェック
  const isPostOwner = user?.id === post.user_id;

  // 投票期限をチェックする関数
  const isVotingExpired = () => {
    if (!post.vote_deadline) return false;
    return new Date() > new Date(post.vote_deadline);
  };

  // 説得タイム（期限の1時間前）かどうかをチェック
  const isPersuasionTime = () => {
    if (!post.vote_deadline) return false;
    const deadline = new Date(post.vote_deadline);
    const now = new Date();
    const oneHourBeforeDeadline = new Date(deadline.getTime() - 60 * 60 * 1000);
    return now >= oneHourBeforeDeadline && now < deadline;
  };

  const votingExpired = isVotingExpired();
  const showPersuasionButton = isPostOwner && isPersuasionTime();

  // 残り時間を計算
  const getTimeRemaining = () => {
    if (!post.vote_deadline) return null;
    const now = new Date();
    const deadline = new Date(post.vote_deadline);
    const diff = deadline.getTime() - now.getTime();

    if (diff <= 0) return "終了";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}日`;
    } else if (hours > 0) {
      return `${hours}時間`;
    } else {
      return `${minutes}分`;
    }
  };

  const timeRemaining = getTimeRemaining();

  return (
    <Link to={`/post/${post.id}`} className="block group">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 group-hover:scale-[1.02]">
        {/* Status Banner */}
        <div
          className={`h-1 ${
            votingExpired
              ? "bg-slate-400"
              : showPersuasionButton
                ? "bg-orange-500"
                : "bg-gradient-to-r from-violet-500 to-purple-600"
          }`}
        />

        {/* Header */}
        <div className="p-4 pb-2">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              {post?.avatar_url ? (
                <img
                  src={post.avatar_url}
                  alt="UserAvatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tl from-violet-500 to-purple-500" />
              )}
              <div>
                <h3 className="font-semibold text-slate-800 line-clamp-1">
                  {post.title}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">
                    {post.communities?.name}
                  </span>
                  {hasUserVoted && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center space-x-1">
                      <CheckCircle size={10} />
                      <span>投票済み</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status Icon */}
            <div className="flex flex-col items-end space-y-1">
              {votingExpired ? (
                <Trophy size={20} className="text-slate-400" />
              ) : showPersuasionButton ? (
                <AlertTriangle size={20} className="text-orange-500" />
              ) : (
                <Clock size={20} className="text-violet-500" />
              )}

              {timeRemaining && (
                <span
                  className={`text-xs font-medium ${
                    votingExpired
                      ? "text-slate-500"
                      : showPersuasionButton
                        ? "text-orange-600"
                        : "text-violet-600"
                  }`}
                >
                  {votingExpired ? "終了" : `残り${timeRemaining}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Image */}
        {post.image_url && (
          <div className="px-4">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Stats */}
        <div className="p-4 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-slate-600">
                <Users size={16} />
                <span className="text-sm font-medium">
                  {post.vote_count ?? 0}
                </span>
                <span className="text-xs">投票</span>
              </div>

              <div className="flex items-center space-x-2 text-slate-600">
                <div className="w-4 h-4 rounded-full bg-slate-300" />
                <span className="text-sm">{post.comment_count ?? 0}</span>
                <span className="text-xs">コメント</span>
              </div>
            </div>

            <div
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                votingExpired
                  ? "bg-slate-100 text-slate-600"
                  : showPersuasionButton
                    ? "bg-orange-100 text-orange-700"
                    : "bg-violet-100 text-violet-700"
              }`}
            >
              {votingExpired
                ? "結果発表"
                : showPersuasionButton
                  ? "説得タイム"
                  : "投票受付中"}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostItem;
