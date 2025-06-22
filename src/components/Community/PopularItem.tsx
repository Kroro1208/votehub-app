import { CheckCircle, Flame, Trophy, Users } from "lucide-react";
import { CommunityItemType } from "./CommunityItem";
import { Link } from "react-router";
import { getTimeRemaining, isVotingExpired } from "../../utils/formatTime";

interface PopularItemProps {
  communityItemData: CommunityItemType[];
  votedPostIds?: Set<number>;
}

// 人気度計算: 投票数 + コメント数 * 0.5 + 新規度ボーナス
const getPopularityScore = (post: CommunityItemType) => {
  const voteCount = post.vote_count || 0;
  const commentCount = post.comment_count || 0;
  const createdAt = new Date(post.created_at);
  const now = new Date();
  const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  // 新規度ボーナス: 24時間以内は1.5倍、48時間以内は1.2倍
  let recencyBonus = 1;
  if (hoursOld <= 24) recencyBonus = 1.5;
  else if (hoursOld <= 48) recencyBonus = 1.2;

  return (voteCount + commentCount * 0.5) * recencyBonus;
};

const PopularItem = ({ communityItemData, votedPostIds }: PopularItemProps) => {
  // 人気投稿を計算する関数
  const getPopularPosts = (posts: CommunityItemType[], limit = 5) => {
    if (!posts || posts.length === 0) return [];

    return [...posts]
      .sort((a, b) => {
        return getPopularityScore(b) - getPopularityScore(a);
      })
      .slice(0, limit);
  };

  const popularPosts = getPopularPosts(communityItemData || []);

  return (
    <div>
      {popularPosts.length > 0 && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-yellow-100 to-orange-300 rounded-2xl shadow-sm border border-orange-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Flame size={18} className="text-orange-500" />
              <h2 className="text-lg font-bold text-gray-800">人気の投稿</h2>
              <Trophy size={18} className="text-yellow-500" />
            </div>

            {/* ランキング表示 */}
            <div className="space-y-2">
              {popularPosts.map((post, index) => {
                const votingExpired = isVotingExpired(post.vote_deadline);
                const hasUserVoted = votedPostIds?.has(post.id) ?? false;
                const timeRemaining = getTimeRemaining(post.vote_deadline);

                return (
                  <Link
                    key={post.id}
                    to={`/post/${post.id}`}
                    className="block group"
                  >
                    <div
                      className={`relative bg-white rounded-lg shadow-sm border transition-all duration-300 hover:shadow-md group-hover:scale-[1.005] overflow-hidden ${
                        index === 0
                          ? "border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50"
                          : index === 1
                            ? "border-gray-300 bg-gradient-to-r from-gray-50 to-slate-50"
                            : "border-orange-200"
                      }`}
                    >
                      {/* ランク装飾 */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                          index === 0
                            ? "bg-gradient-to-b from-yellow-400 to-orange-500"
                            : index === 1
                              ? "bg-gradient-to-b from-gray-400 to-gray-500"
                              : "bg-gradient-to-b from-orange-400 to-red-500"
                        }`}
                      />

                      <div className="flex items-center p-3 pl-4">
                        {/* 順位バッジ */}
                        <div className="flex-shrink-0 mr-3">
                          <div
                            className={`relative w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md ${
                              index === 0
                                ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                                : index === 1
                                  ? "bg-gradient-to-br from-gray-400 to-gray-600"
                                  : "bg-gradient-to-br from-orange-500 to-red-600"
                            }`}
                          >
                            {index + 1}
                            {index === 0 && (
                              <div className="absolute -top-0.5 -right-0.5">
                                <div className="w-3 h-3 bg-yellow-300 rounded-full flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* コンテンツエリア */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 mr-3">
                              {/* タイトルとコミュニティ */}
                              <div className="flex items-center space-x-2 mb-1">
                                {post.avatar_url ? (
                                  <img
                                    src={post.avatar_url}
                                    alt="UserAvatar"
                                    className="w-5 h-5 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-tl from-orange-500 to-red-500" />
                                )}
                                <span className="text-xs text-gray-500 truncate">
                                  {post.communities?.name}
                                </span>
                              </div>

                              <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
                                {post.title}
                              </h3>

                              {/* バッジとスタッツ */}
                              <div className="flex items-center gap-2">
                                {hasUserVoted && (
                                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center space-x-1">
                                    <CheckCircle size={8} />
                                    <span>投票済</span>
                                  </span>
                                )}

                                <div className="flex items-center space-x-2 text-xs text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <Users size={12} />
                                    <span className="font-medium">
                                      {post.vote_count ?? 0}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                                    <span>{post.comment_count ?? 0}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 画像とタイマー */}
                            <div className="flex-shrink-0 flex items-center space-x-2">
                              {timeRemaining && (
                                <div
                                  className={`text-xs font-medium px-2 py-1 rounded ${
                                    votingExpired
                                      ? "bg-gray-100 text-gray-500"
                                      : "bg-orange-100 text-orange-600"
                                  }`}
                                >
                                  {votingExpired
                                    ? "終了"
                                    : `残り${timeRemaining}`}
                                </div>
                              )}

                              {post.image_url && (
                                <img
                                  src={post.image_url}
                                  alt={post.title}
                                  className="w-12 h-12 object-cover rounded shadow-sm"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ホバー効果 */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-orange-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PopularItem;
