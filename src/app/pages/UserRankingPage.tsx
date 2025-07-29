"use client";
import { supabase } from "@/supabase-client";
import { useQuery } from "@tanstack/react-query";
import { Award, Crown, Medal, Star, TrendingUp, Trophy } from "lucide-react";
import Link from "next/link";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import { Card } from "../components/ui/card";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";

interface UserRankingData {
  user_id: string;
  total_score: number;
  quality_score: number;
  empathy_points: number;
  rank: number;
  quality_rank: string;
  empathy_rank: string;
  badge_icon: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    email?: string;
    bio?: string;
  };
}

// 総合ランキングデータを取得
const fetchUserRanking = async (): Promise<UserRankingData[]> => {
  const { data, error } = await supabase.rpc("get_user_total_ranking");

  if (error) throw new Error(error.message);

  return data as UserRankingData[];
};

const UserRankingPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const {
    data: rankings,
    isLoading,
    error,
  } = useQuery<UserRankingData[], Error>({
    queryKey: ["user-ranking"],
    queryFn: fetchUserRanking,
    refetchInterval: 60000, // 1分ごとに更新
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown size={24} className="text-yellow-500" />;
      case 2:
        return <Medal size={24} className="text-gray-400" />;
      case 3:
        return <Award size={24} className="text-orange-500" />;
      default:
        return <Trophy size={20} className="text-blue-500" />;
    }
  };

  const getRankStyling = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          container:
            "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-200 dark:border-yellow-700 shadow-lg",
          badge: "bg-gradient-to-r from-yellow-500 to-amber-500 text-white",
          text: "text-yellow-700 dark:text-yellow-300",
        };
      case 2:
        return {
          container:
            "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/30 dark:to-slate-800/30 border-gray-200 dark:border-gray-600 shadow-md",
          badge: "bg-gradient-to-r from-gray-500 to-slate-500 text-white",
          text: "text-gray-700 dark:text-gray-300",
        };
      case 3:
        return {
          container:
            "bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 border-orange-200 dark:border-orange-700 shadow-md",
          badge: "bg-gradient-to-r from-orange-500 to-red-500 text-white",
          text: "text-orange-700 dark:text-orange-300",
        };
      default:
        return {
          container:
            "bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 hover:shadow-md",
          badge: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white",
          text: "text-gray-700 dark:text-gray-300",
        };
    }
  };

  const currentUserRank = rankings?.find((r) => r.user_id === user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-black py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full">
              <Trophy size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t("ranking.title")}
            </h1>
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              <Star size={32} className="text-white" />
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {t("ranking.description")}
          </p>
        </div>

        {/* 自分の順位表示 */}
        {currentUserRank && (
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl border border-purple-200 dark:border-purple-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                  <TrendingUp size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-purple-700 dark:text-purple-300">
                    {t("ranking.your.rank")}
                  </h3>
                  <p className="text-purple-600 dark:text-purple-400">
                    {t("ranking.description")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {currentUserRank.rank}位
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  {currentUserRank.total_score.toLocaleString()}pt
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ランキングリスト */}
        <div className="space-y-2">
          {rankings?.map((ranking) => {
            const styling = getRankStyling(ranking.rank);
            const isCurrentUser = ranking.user_id === user?.id;

            return (
              <Card
                key={ranking.user_id}
                className={`relative rounded-xl border transition-all duration-300 cursor-pointer hover:scale-[1.02] ${styling.container} ${
                  isCurrentUser ? "ring-2 ring-blue-400 shadow-lg" : ""
                }`}
              >
                <Link href={`/profile/${ranking.user_id}`} className="block">
                  <div className="flex items-center px-4">
                    {/* 順位バッジ */}
                    <div className="flex-shrink-0 mr-4">
                      <div className="relative">
                        <div
                          className={`size-15 rounded-full flex items-center justify-center text-xl font-bold shadow-lg ${styling.badge}`}
                        >
                          {ranking.rank}
                        </div>
                        {ranking.rank <= 3 && (
                          <div className="absolute -top-2 -right-2">
                            {getRankIcon(ranking.rank)}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* ユーザー情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        {ranking.user_metadata?.avatar_url ? (
                          <img
                            src={ranking.user_metadata.avatar_url}
                            alt="Avatar"
                            className="size-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="size-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                            {ranking.user_metadata?.full_name?.charAt(0) || "U"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3
                              className={`text-lg font-semibold ${styling.text} truncate`}
                            >
                              {ranking.user_metadata?.full_name ||
                                t("ranking.user.fallback")}
                            </h3>
                            {isCurrentUser && (
                              <span className="text-sm bg-green-500 px-2 items-center rounded-md text-center flex-shrink-0">
                                you
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <span>
                              {ranking.empathy_rank} {ranking.badge_icon}
                            </span>
                            <span>
                              {t("ranking.quality.score")}:{" "}
                              {ranking.quality_rank}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* 自己紹介文 */}
                    <div className="flex-1 min-w-0 mx-4">
                      {ranking.user_metadata?.bio && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap line-clamp-2">
                          {ranking.user_metadata.bio}
                        </p>
                      )}
                    </div>
                    {/* スコア詳細 */}
                    <div className="text-right flex-shrink-0">
                      <div className={`text-xl font-bold ${styling.text}`}>
                        {ranking.total_score.toLocaleString()}pt
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          {t("ranking.quality.score")}:{" "}
                          {ranking.quality_score.toLocaleString()}pt
                        </div>
                        <div>
                          {t("ranking.empathy.points")}:{" "}
                          {ranking.empathy_points.toLocaleString()}pt
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>

        {/* 空状態 */}
        {!rankings ||
          (rankings.length === 0 && (
            <div className="text-center py-16">
              <Trophy
                size={64}
                className="text-gray-400 dark:text-gray-500 mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                {t("ranking.empty.title")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t("ranking.empty.description")}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default UserRankingPage;
