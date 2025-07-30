"use client";
import { CheckCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import type { PostType } from "./PostList";

import { routeProtection } from "@/config/RouteProtection";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useDeletePost } from "../../hooks/useDeletePost";
import { useHandlePost } from "../../hooks/useHandlePost";
import { useHandleVotes } from "../../hooks/useHandleVotes";
import { Button } from "../ui/button";
import VoteTickets from "../Vote/VoteTickets";
import BookmarkButton from "./BookmarkButton";

interface PostItemType {
  post: PostType;
}

const PostItem = ({ post }: PostItemType) => {
  const { user } = useAuth();
  const routes = routeProtection.getRoutes();
  const { totalVotes, upVotes, downVotes } = useHandleVotes(
    post.id,
    post.vote_deadline,
    post.title,
  );
  const { userVote, isPersuasionTime, isVotingExpired, getTimeRemaining } =
    useHandlePost(post);
  const { mutate: deletePost, isPending: isDeleting } = useDeletePost();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const ownUserPost = user?.id === post.user_id; // 投稿者本人かどうか

  const hasUserVoted = userVote !== null && userVote !== undefined;

  const isPostOwner = user?.id === post.user_id; // 投稿者本人か
  const votingExpired = isVotingExpired(); // 投票期限を過ぎているかどうか
  const inPersuasionTime = isPersuasionTime(); // 説得タイム中かどうか
  const timeRemaining = getTimeRemaining(); // 残り時間を取得

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deletePost(
      {
        postId: post.id,
        imageUrl: post.image_url,
      },
      {
        onSuccess: () => {
          setShowDeleteConfirm(false);
        },
      },
    );
  };

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <Link href={routes.post(post.id.toString())} className="block group">
      <div className="bg-gradient-to-br from-white via-slate-50 to-indigo-50 dark:from-gray-800 dark:via-gray-900 dark:to-indigo-900 rounded-2xl shadow-xl border-2 border-slate-200 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 transform hover:shadow-2xl transition-all duration-300 overflow-hidden">
        {/* Urgent Vote Banner */}
        <div
          className={`h-3 bg-gradient-to-r ${
            votingExpired
              ? "from-gray-400 to-gray-500"
              : inPersuasionTime
                ? "from-orange-400 via-red-500 to-pink-600 animate-pulse"
                : "from-emerald-400 via-blue-500 to-purple-600 animate-pulse"
          }`}
        >
          <div className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>

        {/* Vote Status Header */}
        <div
          className={`p-3 ${
            votingExpired
              ? "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800"
              : inPersuasionTime
                ? "bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30"
                : "bg-gradient-to-r from-emerald-100 via-blue-100 to-purple-100 dark:from-emerald-900/30 dark:via-blue-900/30 dark:to-purple-900/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  votingExpired
                    ? "bg-gray-500"
                    : inPersuasionTime
                      ? "bg-orange-500 animate-bounce"
                      : "bg-green-500 animate-bounce"
                }`}
              ></div>
              <span
                className={`text-sm font-bold uppercase tracking-wider ${
                  votingExpired
                    ? "text-gray-700 dark:text-gray-300"
                    : inPersuasionTime
                      ? "text-orange-700 dark:text-orange-300"
                      : "text-emerald-700 dark:text-emerald-300"
                }`}
              >
                {votingExpired
                  ? "🏆 結果発表中"
                  : inPersuasionTime
                    ? "🔥 説得タイム"
                    : "🗳️ 投票募集中"}
              </span>
            </div>
            <div className="h-6 flex items-center justify-end">
              {timeRemaining && !votingExpired && (
                <div className="text-xs font-bold bg-red-500 text-white px-3 py-1 rounded-full animate-pulse">
                  ⏰ 残り{timeRemaining}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {post?.avatar_url ? (
                  <img
                    src={post.avatar_url}
                    alt="User"
                    className="w-6 h-6 rounded-full object-cover border-2 border-indigo-300"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 border-2 border-indigo-300" />
                )}
                <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full font-semibold">
                  📍 {post.communities?.name || "コミュニティ"}
                </span>
              </div>
              {hasUserVoted && (
                <div className="flex items-center space-x-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full font-bold">
                  <CheckCircle size={12} />
                  <span>✅ 投票完了</span>
                </div>
              )}
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2 line-clamp-2 leading-tight group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
              {post.title}
            </h3>
          </div>

          <div className="mb-4 h-32">
            {post.image_url && (
              <div className="relative h-full">
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full h-full object-cover rounded-xl border-2 border-gray-200 dark:border-gray-600"
                />
                {!hasUserVoted && !votingExpired && (
                  <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="text-white text-center">
                      <div className="text-lg font-bold">🗳️</div>
                      <div className="text-xs font-semibold">
                        クリックして投票
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-800 dark:via-gray-800 dark:to-indigo-900 rounded-xl p-2 mb-2 border border-slate-200 dark:border-gray-600 group-hover:shadow-inner transition-all duration-300">
            <div className="flex justify-center mt-2">
              <VoteTickets
                upVotes={upVotes ?? 0}
                downVotes={downVotes ?? 0}
                totalVotes={totalVotes ?? 0}
                size="sm"
                showLabels={true}
              />
            </div>

            <div className="text-center h-6 flex items-center justify-center">
              {!ownUserPost && !hasUserVoted && !votingExpired && (
                <div className="inline-flex items-center space-x-1 text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1 rounded-full font-bold animate-pulse">
                  <span>👆</span>
                  <span>あなたの意見を投票しよう！</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t-2 border-dashed border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium flex items-center space-x-1">
                <span>💬</span>
                <span>{post.comment_count ?? 0} コメント</span>
              </span>
              <span>•</span>
              <span>
                {new Date(post.created_at).toLocaleDateString("ja-JP")}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <BookmarkButton postId={post.id} size="sm" />

              {isPostOwner && (
                <div className="relative">
                  {!showDeleteConfirm ? (
                    <Button
                      variant="outline"
                      onClick={handleDeleteClick}
                      disabled={isDeleting}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    >
                      <Trash2 size={14} />
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-1 bg-red-50 dark:bg-red-900/20 rounded-lg p-1">
                      <Button
                        variant="outline"
                        onClick={handleDeleteConfirm}
                        disabled={isDeleting}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        削除
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDeleteCancel}
                        disabled={isDeleting}
                        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 rounded"
                      >
                        ×
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-1">
                <div
                  className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                    votingExpired
                      ? "bg-gray-400"
                      : inPersuasionTime
                        ? "bg-gradient-to-r from-orange-400 to-red-500 animate-pulse"
                        : "bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse"
                  }`}
                ></div>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                  {votingExpired ? "終了" : inPersuasionTime ? "HOT" : "LIVE"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostItem;
