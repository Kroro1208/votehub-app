import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client.ts";
import { useAuth } from "../hooks/useAuth.ts";
import { Trophy, Crown, Medal, Award, Star, TrendingUp } from "lucide-react";
import Loading from "../components/Loading.tsx";
import ErrorMessage from "../components/ErrorMessage.tsx";
import { Card } from "../components/ui/card.tsx";

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
            "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 shadow-lg",
          badge: "bg-gradient-to-r from-yellow-500 to-amber-500 text-white",
          text: "text-yellow-700",
        };
      case 2:
        return {
          container:
            "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 shadow-md",
          badge: "bg-gradient-to-r from-gray-500 to-slate-500 text-white",
          text: "text-gray-700",
        };
      case 3:
        return {
          container:
            "bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 shadow-md",
          badge: "bg-gradient-to-r from-orange-500 to-red-500 text-white",
          text: "text-orange-700",
        };
      default:
        return {
          container: "bg-white border-gray-200 hover:shadow-md",
          badge: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white",
          text: "text-gray-700",
        };
    }
  };

  const currentUserRank = rankings?.find((r) => r.user_id === user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full">
              <Trophy size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ユーザー総合ランキング
            </h1>
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              <Star size={32} className="text-white" />
            </div>
          </div>
          <p className="text-gray-600 text-lg">
            品質度スコア + 共感ポイントの総合評価ランキング
          </p>
        </div>

        {/* 自分の順位表示 */}
        {currentUserRank && (
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                  <TrendingUp size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-purple-700">
                    あなたの順位
                  </h3>
                  <p className="text-purple-600">現在の総合ランキング</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-700">
                  {currentUserRank.rank}位
                </div>
                <div className="text-sm text-purple-600">
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
                className={`relative rounded-xl border transition-all duration-300 ${styling.container} ${
                  isCurrentUser ? "ring-2 ring-blue-400 shadow-lg" : ""
                }`}
              >
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
                            {ranking.user_metadata?.full_name || "ユーザー"}
                          </h3>
                          {isCurrentUser && (
                            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex-shrink-0">
                              あなた
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>
                            {ranking.empathy_rank} {ranking.badge_icon}
                          </span>
                          <span>品質度: {ranking.quality_rank}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* スコア詳細 */}
                  <div className="text-right flex-shrink-0">
                    <div className={`text-xl font-bold ${styling.text}`}>
                      {ranking.total_score.toLocaleString()}pt
                    </div>
                    <div className="text-sm text-gray-500">
                      <div>
                        品質: {ranking.quality_score.toLocaleString()}pt
                      </div>
                      <div>
                        共感: {ranking.empathy_points.toLocaleString()}pt
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* 空状態 */}
        {!rankings ||
          (rankings.length === 0 && (
            <div className="text-center py-16">
              <Trophy size={64} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                ランキングデータがありません
              </h3>
              <p className="text-gray-500">
                投稿やコメントでポイントを獲得すると、ランキングに表示されます
              </p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default UserRankingPage;
