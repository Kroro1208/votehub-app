import { Link } from "react-router";
import type { PostType } from "./PostList";
import { Clock, Users, CheckCircle, AlertTriangle, Trash2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useHandleVotes } from "../../hooks/useHandleVotes";
import { useHandlePost } from "../../hooks/useHandlePost";
import { useDeletePost } from "../../hooks/useDeletePost";
import { FaRegCalendarTimes } from "react-icons/fa";
import BookmarkButton from "./BookmarkButton";
import { useState } from "react";

interface PostItemType {
  post: PostType;
}

const PostItem = ({ post }: PostItemType) => {
  const { user } = useAuth();
  const { totalVotes } = useHandleVotes(
    post.id,
    post.vote_deadline,
    post.title,
  );
  const { userVote, isPersuasionTime, isVotingExpired, getTimeRemaining } =
    useHandlePost(post);
  const { mutate: deletePost, isPending: isDeleting } = useDeletePost();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasUserVoted = userVote !== null && userVote !== undefined;

  const isPostOwner = user?.id === post.user_id; // 投稿者本人か
  const votingExpired = isVotingExpired(); // 投票期限を過ぎているかどうか
  const showPersuasionButton = isPostOwner && isPersuasionTime(); // 投稿者本人で説得タイム中かどうか
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
            <div className="flex flex-col items-end space-y-1 min-w-0">
              {votingExpired ? (
                <FaRegCalendarTimes size={20} className="text-slate-400" />
              ) : showPersuasionButton ? (
                <AlertTriangle size={20} className="text-orange-500" />
              ) : (
                <Clock size={20} className="text-violet-500" />
              )}

              {timeRemaining && (
                <span
                  className={`text-xs font-medium whitespace-nowrap ${
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
                <span className="text-sm font-medium">{totalVotes ?? 0}</span>
                <span className="text-xs">投票</span>
              </div>

              <div className="flex items-center space-x-2 text-slate-600">
                <div className="w-4 h-4 rounded-full bg-slate-300" />
                <span className="text-sm">{post.comment_count ?? 0}</span>
                <span className="text-xs">コメント</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* ブックマークボタン追加 */}
              <BookmarkButton postId={post.id} size="sm" />

              {/* 削除ボタン（投稿者のみ表示） */}
              {isPostOwner && (
                <div className="relative">
                  {!showDeleteConfirm ? (
                    <button
                      onClick={handleDeleteClick}
                      disabled={isDeleting}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                      title="投稿を削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1 bg-white border border-red-200 rounded-lg p-1">
                      <button
                        onClick={handleDeleteConfirm}
                        disabled={isDeleting}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                      >
                        {isDeleting ? "削除中..." : "削除"}
                      </button>
                      <button
                        onClick={handleDeleteCancel}
                        disabled={isDeleting}
                        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 rounded"
                      >
                        キャンセル
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 既存のstatus badge */}
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
      </div>
    </Link>
  );
};

export default PostItem;
