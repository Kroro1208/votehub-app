import { Heart, Trophy, Users, TrendingUp, Star, Crown } from "lucide-react";
import {
  EmpathyPointsData,
  getEmpathyRankInfo,
  getPointsToNextRank,
} from "../../hooks/useEmpathyScore.ts";
import { useLanguage } from "../../hooks/useLanguage.ts";

interface EmpathyPointsDisplayProps {
  empathyData: EmpathyPointsData | null;
  rankingData: { position: number; totalUsers: number } | null;
  isLoading: boolean;
  isRankingLoading: boolean;
}

const EmpathyPointsDisplay = ({
  empathyData,
  rankingData,
  isLoading,
  isRankingLoading,
}: EmpathyPointsDisplayProps) => {
  const { t, language } = useLanguage();
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl border border-pink-100 p-6 animate-pulse">
        <div className="h-6 bg-pink-200 rounded mb-4"></div>
        <div className="h-20 bg-pink-200 rounded"></div>
      </div>
    );
  }

  if (!empathyData) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Heart size={20} className="text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t("empathy.points.title")}
          </h3>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <Heart size={32} className="mx-auto" />
          </div>
          <p className="text-gray-500">{t("empathy.points.loading")}</p>
        </div>
      </div>
    );
  }

  const rankInfo = getEmpathyRankInfo(empathyData.empathy_rank, language);
  const { nextRank, pointsNeeded } = getPointsToNextRank(
    empathyData.total_empathy_points,
    empathyData.empathy_rank,
    language,
  );

  const getScoreBreakdown = () => {
    return [
      {
        label: t("empathy.points.post.evaluation"),
        value: empathyData.post_evaluation_score,
        icon: TrendingUp,
        color: "text-blue-500",
      },
      {
        label: t("empathy.points.comment.evaluation"),
        value: empathyData.comment_evaluation_score,
        icon: Heart,
        color: "text-pink-500",
      },
      {
        label: t("empathy.points.participation.continuity"),
        value: empathyData.participation_continuity_score,
        icon: Users,
        color: "text-green-500",
      },
      {
        label: t("empathy.points.community.contribution"),
        value: empathyData.community_contribution_score,
        icon: Crown,
        color: "text-purple-500",
      },
      {
        label: t("empathy.points.interaction"),
        value: empathyData.interaction_score,
        icon: Star,
        color: "text-orange-500",
      },
    ];
  };

  const scoreBreakdown = getScoreBreakdown();

  return (
    <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl border border-pink-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-pink-100 rounded-lg">
          <Heart size={20} className="text-pink-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          {t("empathy.points.title")}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 総合ポイントとランク */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-3xl">{empathyData.badge_icon}</span>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {empathyData.total_empathy_points.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                {t("empathy.points.points")}
              </div>
            </div>
          </div>
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${rankInfo.color} bg-white border`}
          >
            <Trophy size={14} />
            <span>{rankInfo.description}</span>
          </div>
        </div>

        {/* ランキング情報 */}
        <div className="space-y-3">
          {!isRankingLoading && rankingData && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {t("empathy.points.ranking")}
              </span>
              <span className="font-semibold">
                {rankingData.position}
                {t("empathy.rank.position")} / {rankingData.totalUsers}
                {t("empathy.rank.people")}
              </span>
            </div>
          )}

          {nextRank && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {t("empathy.points.next.rank")}
              </span>
              <span className="font-semibold">
                {pointsNeeded.toLocaleString()}pt
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {t("empathy.points.current.rank")}
            </span>
            <span className="font-semibold">{empathyData.empathy_rank}</span>
          </div>
        </div>
      </div>

      {/* 進捗バー（次のランクがある場合） */}
      {nextRank && (
        <div className="mt-6 pt-6 border-t border-pink-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              {t("empathy.points.next.rank.progress")}
            </span>
            <span className="text-sm font-medium">
              {pointsNeeded.toLocaleString()}pt {t("empathy.rank.to")}{" "}
              {nextRank.description}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-pink-500 to-red-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (empathyData.total_empathy_points / nextRank.min_points) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* スコア内訳 */}
      <div className="mt-6 pt-6 border-t border-pink-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          {t("empathy.points.score.breakdown")}
        </h4>
        <div className="space-y-2">
          {scoreBreakdown.map((item) => (
            <div
              key={item.label}
              className="flex items-center text-slate-500 gap-3 p-2 bg-white rounded-lg"
            >
              <div className={`p-1 rounded ${item.color}`}>
                <item.icon size={16} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="font-semibold">
                    {item.value.toLocaleString()}pt
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 最終更新日 */}
      <div className="mt-6 pt-6 border-t border-pink-200">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{t("empathy.points.last.updated")}</span>
          <span>
            {new Date(empathyData.updated_at).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EmpathyPointsDisplay;
