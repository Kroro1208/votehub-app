import { Link } from "react-router";
import type { PostType } from "./PostList";
import {
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useHandleVotes } from "../../hooks/useHandleVotes";
import { useHandlePost } from "../../hooks/useHandlePost";
import { FaRegCalendarTimes } from "react-icons/fa";
import { FaArrowAltCircleUp, FaArrowAltCircleDown } from "react-icons/fa";

interface NestedPostSummaryProps {
  post: PostType;
  level?: number;
}

const NestedPostSummary = ({ post, level = 0 }: NestedPostSummaryProps) => {
  const { user } = useAuth();
  const { totalVotes } = useHandleVotes(post.id);
  const { userVote, isPersuasionTime, isVotingExpired, getTimeRemaining } =
    useHandlePost(post);

  const hasUserVoted = userVote !== null && userVote !== undefined;
  const isPostOwner = user?.id === post.user_id;
  const votingExpired = isVotingExpired();
  const showPersuasionButton = isPostOwner && isPersuasionTime();
  const timeRemaining = getTimeRemaining();

  // コンテンツから概要を抽出（最初の100文字程度）
  const getSummary = (content: string) => {
    // 改行を取り除き、最初の100文字を取得
    const cleanContent = content.replace(/\n/g, " ");
    return cleanContent.length > 100
      ? cleanContent.substring(0, 100) + "..."
      : cleanContent;
  };

  // ネストレベルに応じたスタイリング
  const getNestedStyles = (nestLevel: number) => {
    const indentClasses = ["ml-0", "ml-4", "ml-8", "ml-12"];
    const borderColors = [
      "border-l-violet-300",
      "border-l-blue-300",
      "border-l-green-300",
      "border-l-orange-300",
    ];

    return {
      indent: indentClasses[Math.min(nestLevel, 3)],
      borderColor: borderColors[nestLevel] || "border-l-slate-300",
    };
  };

  const styles = getNestedStyles(level);

  return (
    <div
      className={`${level > 0 ? styles.indent : ""} ${level > 0 ? "border-l-4 pl-6" : ""} ${level > 0 ? styles.borderColor : ""}`}
    >
      <div className="relative bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 mb-4 group">
        {/* Gradient Status Banner */}
        <div
          className={`h-2 ${
            votingExpired
              ? "bg-gradient-to-r from-slate-400 to-slate-500"
              : showPersuasionButton
                ? "bg-gradient-to-r from-orange-400 to-red-500"
                : "bg-gradient-to-r from-violet-500 to-purple-600"
          }`}
        />

        {/* Content */}
        <div className="p-6">
          {/* Header with badges */}
          <div className="flex items-center flex-wrap gap-2 mb-4">
            {level > 0 && (
              <div className="flex items-center bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">
                {Array.from({ length: level }).map((_, i) => (
                  <ChevronRight key={i} size={14} />
                ))}
                <span className="ml-1">Level {level}</span>
              </div>
            )}

            {/* Target vote choice badge */}
            {post.target_vote_choice !== null && (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm shadow-sm ${
                  post.target_vote_choice === 1
                    ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200"
                    : "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200"
                }`}
              >
                {post.target_vote_choice === 1 ? (
                  <>
                    <FaArrowAltCircleUp size={16} />
                    <span>賛成者限定</span>
                  </>
                ) : (
                  <>
                    <FaArrowAltCircleDown size={16} />
                    <span>反対者限定</span>
                  </>
                )}
              </div>
            )}

            {/* Voted badge */}
            {hasUserVoted && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-sm border border-blue-200 shadow-sm">
                <CheckCircle size={16} />
                <span>投票済み</span>
              </div>
            )}
          </div>

          {/* Title and Content */}
          <Link to={`/post/${post.id}`} className="block group/link">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover/link:text-violet-600 transition-colors duration-200 leading-tight">
                  {post.title}
                </h3>

                {/* Summary */}
                <p className="text-slate-600 text-base leading-relaxed mb-4 line-clamp-3">
                  {getSummary(post.content)}
                </p>
              </div>

              <div className="flex-shrink-0 p-2 rounded-full bg-slate-100 group-hover/link:bg-violet-100 transition-all duration-200">
                <ExternalLink
                  size={20}
                  className="text-slate-500 group-hover/link:text-violet-600 transition-colors duration-200"
                />
              </div>
            </div>
          </Link>

          {/* Stats and Status Row */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
            {/* Left: Stats */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">
                <Users size={18} />
                <span className="font-semibold text-base">
                  {totalVotes ?? 0}
                </span>
                <span className="text-sm font-medium">投票</span>
              </div>

              <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">
                <div className="w-4 h-4 rounded-full bg-slate-400" />
                <span className="font-semibold text-base">
                  {post.comment_count ?? 0}
                </span>
                <span className="text-sm font-medium">コメント</span>
              </div>
            </div>

            {/* Right: Status and Timer */}
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm shadow-sm ${
                  votingExpired
                    ? "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700"
                    : showPersuasionButton
                      ? "bg-gradient-to-r from-orange-100 to-red-100 text-orange-800"
                      : "bg-gradient-to-r from-violet-100 to-purple-100 text-violet-800"
                }`}
              >
                {votingExpired ? (
                  <FaRegCalendarTimes size={18} />
                ) : showPersuasionButton ? (
                  <AlertTriangle size={18} />
                ) : (
                  <Clock size={18} />
                )}
                <span>
                  {votingExpired
                    ? "結果発表"
                    : showPersuasionButton
                      ? "説得タイム"
                      : "投票受付中"}
                </span>
              </div>

              {timeRemaining && (
                <div className="text-right">
                  <div
                    className={`text-lg font-bold ${
                      votingExpired
                        ? "text-slate-600"
                        : showPersuasionButton
                          ? "text-orange-700"
                          : "text-violet-700"
                    }`}
                  >
                    {votingExpired ? "終了" : `残り${timeRemaining}`}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NestedPostSummary;
