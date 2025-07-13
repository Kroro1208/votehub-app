import React from "react";

import { Link } from "react-router";
import { CommunityItemType } from "./CommunityItem.tsx";
import { AlertTriangle, CheckCircle, Clock, Users } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.ts";
import { getTimeRemaining, isPersuasionTime } from "../../utils/formatTime.tsx";
import { FaRegCalendarTimes } from "react-icons/fa";

interface IndexItemProps {
  communityItemData: CommunityItemType[];
  votedPostIds?: Set<number>;
}
const IndexItem = ({ communityItemData, votedPostIds }: IndexItemProps) => {
  const { user } = useAuth();

  // 投票期限をチェックする関数
  const isVotingExpired = (voteDeadline?: string | null) => {
    if (!voteDeadline) return false;
    return new Date() > new Date(voteDeadline);
  };

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            すべての投稿
          </h2>
        </div>
        <p className="text-slate-600 ml-7">
          このスペースのすべての議論を探索してみましょう
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {communityItemData?.map((item) => {
          const votingExpired = isVotingExpired(item.vote_deadline);
          const hasUserVoted = votedPostIds?.has(item.id) ?? false;
          const isPostOwner = user?.id === item.user_id;
          const showPersuasionButton =
            isPostOwner && isPersuasionTime(item.vote_deadline);
          const timeRemaining = getTimeRemaining(item.vote_deadline);

          return (
            <Link key={item.id} to={`/post/${item.id}`} className="block group">
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-500 group-hover:scale-[1.03] group-hover:-translate-y-2 h-full flex flex-col relative">
                {/* Status Banner */}
                <div
                  className={`h-2 ${
                    votingExpired
                      ? "bg-gradient-to-r from-slate-400 to-slate-500"
                      : showPersuasionButton
                        ? "bg-gradient-to-r from-orange-400 to-red-500"
                        : "bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500"
                  }`}
                />

                {/* 背景装飾 */}
                <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-violet-500/5 to-purple-500/5 rounded-full group-hover:scale-125 transition-transform duration-500" />

                {/* Header */}
                <div className="p-6 pb-4 flex-shrink-0 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {item?.avatar_url ? (
                        <img
                          src={item.avatar_url}
                          alt="UserAvatar"
                          className="w-12 h-12 rounded-2xl object-cover flex-shrink-0 shadow-lg ring-2 ring-white"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 flex-shrink-0 shadow-lg ring-2 ring-white" />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-800 text-lg line-clamp-2 leading-tight group-hover:text-violet-700 transition-colors duration-300">
                          {item.title}
                        </h3>
                      </div>
                    </div>

                    {/* Status Icon */}
                    <div className="flex flex-col items-end space-y-2 min-w-0">
                      <div
                        className={`p-2 rounded-xl shadow-lg ${
                          votingExpired
                            ? "bg-slate-100"
                            : showPersuasionButton
                              ? "bg-orange-100"
                              : "bg-violet-100"
                        }`}
                      >
                        {votingExpired ? (
                          <FaRegCalendarTimes
                            size={24}
                            className="text-slate-500"
                          />
                        ) : showPersuasionButton ? (
                          <AlertTriangle
                            size={24}
                            className="text-orange-600"
                          />
                        ) : (
                          <Clock size={24} className="text-violet-600" />
                        )}
                      </div>

                      {(timeRemaining || votingExpired) && (
                        <span
                          className={`text-sm font-bold whitespace-nowrap px-3 py-1 rounded-lg shadow-sm ${
                            votingExpired
                              ? "text-slate-600 bg-slate-100"
                              : showPersuasionButton
                                ? "text-orange-700 bg-orange-100"
                                : "text-violet-700 bg-violet-100"
                          }`}
                        >
                          {votingExpired ? "終了" : `残り${timeRemaining}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 px-4 py-2 rounded-xl font-semibold shadow-sm">
                      {item.communities?.name}
                    </span>
                    {hasUserVoted && (
                      <span className="text-sm bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-4 py-2 rounded-xl flex items-center space-x-2 font-semibold shadow-sm">
                        <CheckCircle size={14} />
                        <span>投票済</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Image */}
                {item.image_url && (
                  <div className="px-6 flex-shrink-0">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-48 object-cover rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}

                {/* Stats - Footer */}
                <div className="p-6 pt-4 mt-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                        <Users size={18} className="text-violet-600" />
                        <span className="text-sm font-bold text-slate-700">
                          {item.vote_count ?? 0}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-teal-500" />
                        <span className="text-sm font-bold text-slate-700">
                          {item.comment_count ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ホバー時のオーバーレイ効果 */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl" />
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
};

export default IndexItem;
