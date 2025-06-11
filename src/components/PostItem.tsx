import { Link } from "react-router";
import type { PostType } from "./PostList";
import { MessagesSquare, Speech, Clock } from "lucide-react";

interface PostItemType {
  post: PostType;
}

const PostItem = ({ post }: PostItemType) => {
  // 投票期限をチェックする関数
  const isVotingExpired = () => {
    if (!post.vote_deadline) return false;
    return new Date() > new Date(post.vote_deadline);
  };

  // 投票期限を日本語で表示する関数
  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return "期限終了";
    } else if (diffDays === 0) {
      return "今日まで";
    } else if (diffDays === 1) {
      return "明日まで";
    } else {
      return `${diffDays}日後まで`;
    }
  };

  const votingExpired = isVotingExpired();

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
            <div className="flex flex-col flex-1">
              <div className="text-[20px] leading-[22px] font-semibold mt-2">
                {post.title}
              </div>
              {/* 投票期限表示 */}
              {post.vote_deadline && (
                <div
                  className={`flex items-center gap-1 text-xs mt-1 ${
                    votingExpired ? "text-red-400" : "text-yellow-400"
                  }`}
                >
                  <Clock size={12} />
                  <span>{formatDeadline(post.vote_deadline)}</span>
                </div>
              )}
            </div>
          </div>

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
                    : "bg-green-500/20 text-green-300"
                }`}
              >
                {votingExpired ? "投票終了" : "投票中"}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default PostItem;
