import { Link } from "react-router";
import { CommunityItemType } from "./CommunityItem";
import { AlertTriangle, CheckCircle, Clock, Trophy, Users } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getTimeRemaining, isPersuasionTime } from "../../utils/formatTime";

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
      <div className="mb-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-300 to-purple-500 bg-clip-text text-transparent">
          すべての投稿
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communityItemData?.map((item) => {
          const votingExpired = isVotingExpired(item.vote_deadline);
          const hasUserVoted = votedPostIds?.has(item.id) ?? false;
          const isPostOwner = user?.id === item.user_id;
          const showPersuasionButton =
            isPostOwner && isPersuasionTime(item.vote_deadline);
          const timeRemaining = getTimeRemaining(item.vote_deadline);

          return (
            <Link key={item.id} to={`/post/${item.id}`} className="block group">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 group-hover:scale-[1.02] h-full flex flex-col">
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
                <div className="p-3 pb-2 flex-shrink-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      {item?.avatar_url ? (
                        <img
                          src={item.avatar_url}
                          alt="UserAvatar"
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tl from-violet-500 to-purple-500 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 leading-tight">
                          {item.title}
                        </h3>
                      </div>
                    </div>

                    {/* Status Icon */}
                    <div className="flex flex-col items-end ml-2 flex-shrink-0">
                      {votingExpired ? (
                        <Trophy size={16} className="text-slate-400" />
                      ) : showPersuasionButton ? (
                        <AlertTriangle size={16} className="text-orange-500" />
                      ) : (
                        <Clock size={16} className="text-violet-500" />
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">
                      {item.communities?.name}
                    </span>
                    {hasUserVoted && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center space-x-1">
                        <CheckCircle size={8} />
                        <span>投票済</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Image */}
                {item.image_url && (
                  <div className="px-3 flex-shrink-0">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Stats - Footer */}
                <div className="p-3 pt-2 mt-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 text-slate-600">
                        <Users size={14} />
                        <span className="text-xs font-medium">
                          {item.vote_count ?? 0}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 text-slate-600">
                        <div className="w-3 h-3 rounded-full bg-slate-300" />
                        <span className="text-xs">
                          {item.comment_count ?? 0}
                        </span>
                      </div>
                    </div>

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
            </Link>
          );
        })}
      </div>
    </>
  );
};

export default IndexItem;
