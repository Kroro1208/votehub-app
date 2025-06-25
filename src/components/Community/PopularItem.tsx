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
        <div className="mb-12">
          <div className="bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 rounded-3xl shadow-xl border border-orange-100 p-8 relative overflow-hidden">
            {/* 背景装飾 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-400/10 to-red-500/10 rounded-full translate-y-12 -translate-x-12" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                  <Flame size={20} className="text-white animate-pulse" />
                  <Trophy size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    人気の投稿
                  </h2>
                  <p className="text-orange-700 text-sm font-medium">
                    最も注目を集めている議論
                  </p>
                </div>
              </div>

              {/* ランキング表示 */}
              <div className="space-y-4">
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
                        className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-500 hover:shadow-2xl group-hover:scale-[1.02] overflow-hidden ${
                          index === 0
                            ? "border-yellow-400 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 ring-2 ring-yellow-400/20"
                            : index === 1
                              ? "border-slate-400 bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 ring-2 ring-slate-400/20"
                              : "border-orange-300 bg-gradient-to-br from-orange-50 to-red-50 ring-2 ring-orange-300/20"
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
                          <div className="flex-shrink-0 mr-4">
                            <div
                              className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-xl transform group-hover:scale-110 transition-transform duration-300 ${
                                index === 0
                                  ? "bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500"
                                  : index === 1
                                    ? "bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600"
                                    : "bg-gradient-to-br from-orange-500 via-red-500 to-red-600"
                              }`}
                            >
                              <span className="drop-shadow-lg">
                                {index + 1}
                              </span>
                              {index === 0 && (
                                <div className="absolute -top-1 -right-1">
                                  <div className="w-5 h-5 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                                    <Trophy
                                      size={10}
                                      className="text-yellow-700 animate-pulse"
                                    />
                                  </div>
                                </div>
                              )}
                              {index === 1 && (
                                <div className="absolute -top-1 -right-1">
                                  <div className="w-4 h-4 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full shadow-lg" />
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
        </div>
      )}
    </div>
  );
};

export default PopularItem;
