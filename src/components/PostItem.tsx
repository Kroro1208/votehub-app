import { Link } from "react-router";
import type { PostType } from "./PostList";
import { MessagesSquare, Speech, CheckCircle } from "lucide-react";
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

  return (
    <div className="relative group">
      <div className="absolute -inset-1 rounded-[20px] bg-gradient-to-r from-pink-600 to-purple-600 blur-sm opacity-0 group-hover:opacity-50 transition duration-300 pointer-events-none" />
      <Link to={`/post/${post.id}`} className="block relative z-10">
        <div className="w-80 h-76 bg-[rgb(24,27,32)] border border-[rgb(84,90,106)] rounded-[20px] text-white flex flex-col p-5 overflow-hidden transition-colors duration-300 group-hover:bg-gray-800">
          {/* Header: Avatar and Title */}
          <div className="flex items-center space-x-2">
            {post?.avatar_url ? (
              <img
                src={post.avatar_url}
                alt="UserAvatar"
                className="w-[35px] h-[35px] rounded-full object-cover"
              />
            ) : (
              <div className="w-[35px] h-[35px] rounded-full bg-gradient-to-tl from-[#0ce73b] to-[#63c087]" />
            )}
            <div className="flex flex-1 items-center gap-3">
              <div className="text-[20px] leading-[22px] font-semibold mt-2">
                {post.title}
              </div>
              {/* 投票期限表示 */}
              {post.vote_deadline && (
                <div
                  className={`flex items-center gap-1 text-xs mt-1 justify-center mx-auto ${
                    votingExpired
                      ? "text-red-400"
                      : showPersuasionButton
                        ? "text-orange-400"
                        : "text-yellow-400"
                  }`}
                ></div>
              )}
            </div>
          </div>

          {/* 投票済みバッジ */}
          {hasUserVoted && (
            <div className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded mt-2 w-fit">
              <CheckCircle size={12} />
              <span>投票済み</span>
            </div>
          )}

          {/* Image Banner */}
          <div className="mt-2 flex-1">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full rounded-[20px] object-cover max-h-[150px] mx-auto"
            />
          </div>

          {/* Stats and Vote Status */}
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <span className="flex gap-2">
                <Speech />
                {post.vote_count ?? 0}
              </span>
              <span className="flex gap-2">
                <MessagesSquare />
                {post.comment_count ?? 0}
              </span>
            </div>

            {/* 投票状況表示 */}
            {post.vote_deadline && (
              <div
                className={`text-xs px-2 py-1 rounded ${
                  votingExpired
                    ? "bg-red-500/20 text-red-300"
                    : showPersuasionButton
                      ? "bg-orange-500/20 text-orange-300"
                      : "bg-green-500/20 text-green-300"
                }`}
              >
                {votingExpired
                  ? "投票終了"
                  : showPersuasionButton
                    ? "説得タイム"
                    : "投票中"}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default PostItem;
