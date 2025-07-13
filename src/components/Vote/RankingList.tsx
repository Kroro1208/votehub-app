import { Link } from "react-router";
import { BasePost } from "../../types/post.ts";
import { getTimeRemaining, isVotingExpired } from "../../utils/formatTime.tsx";
import { getRankStyling } from "../../utils/getStyle.ts";
import { CheckCircle, TrendingUp, Trophy, Users } from "lucide-react";

type DisplayMode = "active" | "completed";

type RankingListProps = {
  posts: BasePost[];
  votedPostIds?: Set<number>;
  mode?: DisplayMode;
};

const RankingList = ({
  posts,
  votedPostIds,
  mode = "active",
}: RankingListProps) => {
  return (
    <div className="space-y-4">
      {posts.map((post, index) => {
        const votingExpired = isVotingExpired(post.vote_deadline);
        const hasUserVoted = votedPostIds?.has(post.id) ?? false;
        const timeRemaining = getTimeRemaining(post.vote_deadline);

        const styling = getRankStyling(index);

        return (
          <Link key={post.id} to={`/post/${post.id}`} className="block group">
            <div
              className={`relative rounded-xl border transition-all duration-300 hover:shadow-xl group-hover:scale-[1.005] overflow-hidden ${styling.container}`}
            >
              {/* ランク装飾 */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-2 ${styling.leftBorder}`}
              />

              <div className="flex items-center p-6 pl-8">
                {/* 順位バッジ */}
                <div className="flex-shrink-0 mr-6">
                  <div className="relative">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg ${styling.badge}`}
                    >
                      {index + 1}
                      {styling.crown && (
                        <div className="absolute -top-2 -right-2">
                          <div className="w-6 h-6 bg-yellow-300 rounded-full flex items-center justify-center">
                            <Trophy size={14} className="text-yellow-600" />
                          </div>
                        </div>
                      )}
                    </div>
                    {index < 3 && (
                      <div
                        className={`absolute -bottom-1 -right-1 text-white text-xs px-2 py-1 rounded-full font-semibold ${
                          mode === "completed" ? "bg-blue-500" : "bg-orange-500"
                        }`}
                      >
                        TOP {index + 1}
                      </div>
                    )}
                    {mode === "completed" && (
                      <div className="absolute -top-1 -left-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                        終了
                      </div>
                    )}
                  </div>
                </div>

                {/* コンテンツエリア */}
                <div className="flex-1 min-w-0 mr-6">
                  {/* コミュニティタグ */}
                  <div className="flex items-center space-x-2 mb-2">
                    {post.avatar_url ? (
                      <img
                        src={post.avatar_url}
                        alt="UserAvatar"
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tl from-orange-500 to-red-500" />
                    )}
                    <span className="text-sm text-gray-600 font-medium">
                      {post.communities?.name || "未分類"}
                    </span>
                    <div className="h-1 w-1 bg-gray-400 rounded-full" />
                    <span className="text-xs text-gray-500">
                      {mode === "completed" && post.vote_deadline
                        ? `${new Date(post.vote_deadline).toLocaleDateString()} 終了`
                        : new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* タイトル */}
                  <h3
                    className={`text-xl font-bold text-gray-900 mb-2 line-clamp-2 transition-colors ${
                      mode === "completed"
                        ? "group-hover:text-blue-600"
                        : "group-hover:text-orange-600"
                    }`}
                  >
                    {post.title}
                  </h3>

                  {/* スタッツとバッジ */}
                  <div className="flex items-center gap-4">
                    {hasUserVoted && (
                      <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center space-x-1 font-medium">
                        <CheckCircle size={14} />
                        <span>
                          {mode === "completed" ? "参加済" : "投票済"}
                        </span>
                      </span>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Users size={16} />
                        <span className="font-semibold">{post.vote_count}</span>
                        <span>票</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                        <span>{post.comment_count} コメント</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp
                          size={16}
                          className={
                            mode === "completed"
                              ? "text-blue-500"
                              : "text-orange-500"
                          }
                        />
                        <span
                          className={`font-semibold ${mode === "completed" ? "text-blue-600" : "text-orange-600"}`}
                        >
                          {post.popularity_score.toFixed(1)} pt
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 右側エリア */}
                <div className="flex-shrink-0 flex items-center space-x-4">
                  {/* タイマー - アクティブモードのみ表示 */}
                  {mode === "active" && timeRemaining && (
                    <div
                      className={`text-sm font-medium px-3 py-2 rounded-lg ${
                        votingExpired
                          ? "bg-gray-100 text-gray-500"
                          : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      {votingExpired ? "終了" : `残り${timeRemaining}`}
                    </div>
                  )}

                  {/* 画像 */}
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-20 h-20 object-cover rounded-lg shadow-md"
                    />
                  )}
                </div>
              </div>

              {/* ホバー効果 */}
              <div
                className={`absolute inset-0 bg-gradient-to-r from-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                  mode === "completed" ? "to-blue-500/5" : "to-orange-500/5"
                }`}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default RankingList;
