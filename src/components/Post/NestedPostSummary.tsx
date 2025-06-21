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
      className={`${level > 0 ? styles.indent : ""} ${level > 0 ? "border-l-2 pl-4" : ""} ${level > 0 ? styles.borderColor : ""}`}
    >
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 mb-3">
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

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Header with level indicator */}
              <div className="flex items-center mb-2">
                {level > 0 && (
                  <div className="flex items-center text-slate-400 mr-2">
                    {Array.from({ length: level }).map((_, i) => (
                      <ChevronRight key={i} size={12} />
                    ))}
                    <span className="text-xs ml-1">Lv.{level}</span>
                  </div>
                )}

                {/* Target vote choice badge */}
                {post.target_vote_choice !== null && (
                  <span
                    className={`text-xs px-2 py-1 rounded-full mr-2 flex items-center gap-1 ${
                      post.target_vote_choice === 1
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {post.target_vote_choice === 1 ? (
                      <>
                        <FaArrowAltCircleUp size={10} />
                        <span>賛成者向け</span>
                      </>
                    ) : (
                      <>
                        <FaArrowAltCircleDown size={10} />
                        <span>反対者向け</span>
                      </>
                    )}
                  </span>
                )}

                {/* Voted badge */}
                {hasUserVoted && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle size={10} />
                    <span>投票済み</span>
                  </span>
                )}
              </div>

              {/* Title - clickable link */}
              <Link
                to={`/post/${post.id}`}
                className="group flex items-start gap-2 hover:text-violet-600 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 line-clamp-2 group-hover:text-violet-600">
                    {post.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-slate-600 text-sm mt-1 line-clamp-2">
                    {getSummary(post.content)}
                  </p>
                </div>
                <ExternalLink
                  size={16}
                  className="text-slate-400 group-hover:text-violet-500 mt-1 flex-shrink-0"
                />
              </Link>

              {/* Stats */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-slate-600">
                    <Users size={14} />
                    <span className="text-sm">{totalVotes ?? 0}</span>
                    <span className="text-xs">投票</span>
                  </div>

                  <div className="flex items-center space-x-1 text-slate-600">
                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                    <span className="text-sm">{post.comment_count ?? 0}</span>
                    <span className="text-xs">コメント</span>
                  </div>
                </div>

                {/* Status and time */}
                <div className="flex items-center space-x-2">
                  <div
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
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

                  <div className="flex flex-col items-end">
                    {votingExpired ? (
                      <FaRegCalendarTimes
                        size={16}
                        className="text-slate-400"
                      />
                    ) : showPersuasionButton ? (
                      <AlertTriangle size={16} className="text-orange-500" />
                    ) : (
                      <Clock size={16} className="text-violet-500" />
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NestedPostSummary;
