"use client";
import Link from "next/link";
import type { PostType } from "./PostList";
import {
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  MessageSquarePlus,
  ChevronRight,
} from "lucide-react";

import { FaRegCalendarTimes } from "react-icons/fa";
import { useState } from "react";

import { FaArrowAltCircleUp } from "react-icons/fa";
import { FaArrowAltCircleDown } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { useHandleVotes } from "../../hooks/useHandleVotes";
import { useHandlePost } from "../../hooks/useHandlePost";
import { Button } from "../ui/button";
import CreateNestedPost from "./CreateNestedPost";

interface NestedPostItemProps {
  post: PostType;
  level?: number | undefined;
  onNestedPostCreate?: (() => void) | undefined;
}

const NestedPostItem = ({
  post,
  level = 0,
  onNestedPostCreate,
}: NestedPostItemProps) => {
  const { user } = useAuth();
  const { totalVotes } = useHandleVotes(post.id);
  const { userVote, isPersuasionTime, isVotingExpired, getTimeRemaining } =
    useHandlePost(post);
  const [showCreateNested, setShowCreateNested] = useState(false);

  const hasUserVoted = userVote !== null && userVote !== undefined;
  const isPostOwner = user?.id === post.user_id;
  const votingExpired = isVotingExpired();
  const showPersuasionButton = isPostOwner && isPersuasionTime();
  const timeRemaining = getTimeRemaining();
  const canCreateNested = level < 3 && user; // 最大3レベルまで

  // ネストレベルに応じたスタイリング
  const getNestedStyles = (nestLevel: number) => {
    const indentClasses = ["ml-0", "ml-4", "ml-8", "ml-12"];
    const borderColors = [
      "border-l-violet-300",
      "border-l-blue-300",
      "border-l-green-300",
      "border-l-orange-300",
    ];
    const bgColors = ["bg-white", "bg-slate-50", "bg-blue-50", "bg-green-50"];

    return {
      indent: indentClasses[Math.min(nestLevel, 3)],
      borderColor: borderColors[nestLevel] || "border-l-slate-300",
      bgColor: bgColors[nestLevel] || "bg-slate-50",
    };
  };

  const styles = getNestedStyles(level);

  const handleNestedPostSuccess = () => {
    setShowCreateNested(false);
    onNestedPostCreate?.();
  };

  return (
    <div
      className={`${level > 0 ? styles.indent : ""} ${level > 0 ? "border-l-2 pl-4" : ""} ${level > 0 ? styles.borderColor : ""}`}
    >
      <div
        className={`${styles.bgColor} rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 mb-4`}
      >
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
              {/* ネストレベル表示 */}
              {level > 0 && (
                <div className="flex items-center text-slate-400 mr-2">
                  {Array.from({ length: level }).map((_, i) => (
                    <ChevronRight key={i} size={12} />
                  ))}
                  <span className="text-xs ml-1">Lv.{level}</span>
                </div>
              )}

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
                <Link
                  href={`/post/${post.id}`}
                  className="hover:text-violet-600"
                >
                  <h3 className="font-semibold text-slate-800 line-clamp-2">
                    {post.title}
                  </h3>
                </Link>
                <div className="flex items-center space-x-2 mt-1">
                  {post.communities?.name && (
                    <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">
                      {post.communities.name}
                    </span>
                  )}
                  {post.target_vote_choice !== null && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full hover:text-black ${
                        post.target_vote_choice === 1
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {post.target_vote_choice === 1 ? (
                        <>
                          <FaArrowAltCircleUp className="text-green-500" />
                          <p>賛成者向け</p>
                        </>
                      ) : (
                        <>
                          <FaArrowAltCircleDown className="text-red-500" />
                          <p>反対者向け</p>
                        </>
                      )}
                    </span>
                  )}
                  {hasUserVoted && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center space-x-1">
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
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Content Preview */}
        <div className="px-4 pb-2">
          <p className="text-slate-600 text-sm line-clamp-2">{post.content}</p>
        </div>

        {/* Stats and Actions */}
        <div className="p-4 pt-2">
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

              {canCreateNested && !showCreateNested && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCreateNested(true)}
                  className="text-xs"
                >
                  <MessageSquarePlus size={14} className="mr-1" />
                  派生質問
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Nested Post Form */}
      {showCreateNested && (
        <div className="mb-4">
          <CreateNestedPost
            parentPost={{
              id: post.id,
              title: post.title,
              community_id: post.community_id ?? 0,
              nest_level: level,
            }}
            onCancel={() => setShowCreateNested(false)}
            onSuccess={handleNestedPostSuccess}
          />
        </div>
      )}

      {/* Render children posts */}
      {post.children && post.children.length > 0 && (
        <div className="ml-4">
          {post.children.map((childPost) => (
            <NestedPostItem
              key={childPost.id}
              post={childPost}
              level={level + 1}
              onNestedPostCreate={onNestedPostCreate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NestedPostItem;
