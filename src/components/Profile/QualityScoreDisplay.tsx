import { Award, TrendingUp, BarChart3 } from "lucide-react";
import { UserQualityScoreStats } from "../../hooks/useQualityScore.ts";
import { useLanguage } from "../../hooks/useLanguage.ts";

interface QualityScoreDisplayProps {
  qualityData: UserQualityScoreStats | null;
  isLoading: boolean;
}

const QualityScoreDisplay = ({
  qualityData,
  isLoading,
}: QualityScoreDisplayProps) => {
  const { t } = useLanguage();
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6 animate-pulse">
        <div className="h-6 bg-blue-200 rounded mb-4"></div>
        <div className="h-20 bg-blue-200 rounded"></div>
      </div>
    );
  }

  if (!qualityData || qualityData.total_posts === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <BarChart3 size={20} className="text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t("quality.score.title")}
          </h3>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <TrendingUp size={32} className="mx-auto" />
          </div>
          <p className="text-gray-500">{t("quality.score.no.posts")}</p>
          <p className="text-sm text-gray-400 mt-1">
            {t("quality.score.no.posts.description")}
          </p>
        </div>
      </div>
    );
  }

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "S":
        return "text-yellow-500 bg-yellow-50 border-yellow-200";
      case "A":
        return "text-blue-500 bg-blue-50 border-blue-200";
      case "B":
        return "text-green-500 bg-green-50 border-green-200";
      case "C":
        return "text-orange-500 bg-orange-50 border-orange-200";
      case "D":
        return "text-red-500 bg-red-50 border-red-200";
      case "F":
        return "text-gray-500 bg-gray-50 border-gray-200";
      default:
        return "text-gray-500 bg-gray-50 border-gray-200";
    }
  };

  const getRankName = (rank: string) => {
    switch (rank) {
      case "S":
        return t("quality.score.rank.super");
      case "A":
        return t("quality.score.rank.excellent");
      case "B":
        return t("quality.score.rank.good");
      case "C":
        return t("quality.score.rank.average");
      case "D":
        return t("quality.score.rank.needs.work");
      case "F":
        return t("quality.score.rank.beginner");
      default:
        return t("quality.score.rank.unrated");
    }
  };

  const rankColorClass = getRankColor(qualityData.overall_quality_rank);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <BarChart3 size={20} className="text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">品質度スコア</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 総合ランク */}
        <div className="text-center">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${rankColorClass} mb-3`}
          >
            <Award size={18} />
            <span className="font-bold text-lg">
              {qualityData.overall_quality_rank}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {getRankName(qualityData.overall_quality_rank)}
          </p>
        </div>

        {/* 統計情報 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {t("quality.score.average")}
            </span>
            <span className="font-semibold">
              {qualityData.average_quality_score}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {t("quality.score.highest")}
            </span>
            <span className="font-semibold">
              {qualityData.highest_quality_score}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {t("quality.score.evaluated.posts")}
            </span>
            <span className="font-semibold">
              {qualityData.total_posts}
              {t("posts.count")}
            </span>
          </div>
        </div>
      </div>

      {/* ランク分布 */}
      <div className="mt-6 pt-6 border-t border-blue-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          {t("quality.score.rank.distribution")}
        </h4>
        <div className="grid grid-cols-6 gap-2">
          {(["S", "A", "B", "C", "D", "F"] as const).map((rank) => (
            <div key={rank} className="text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-1 ${getRankColor(rank)}`}
              >
                {rank}
              </div>
              <div className="text-xs text-gray-600">
                {qualityData.quality_rank_distribution[rank]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 最新のスコア */}
      {qualityData.recent_scores.length > 0 && (
        <div className="mt-6 pt-6 border-t border-blue-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            {t("quality.score.recent.scores")}
          </h4>
          <div className="space-y-2">
            {qualityData.recent_scores.slice(0, 3).map((score) => (
              <div
                key={score.id}
                className="flex items-center gap-3 p-2 bg-white rounded-lg"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getRankColor(score.quality_rank)}`}
                >
                  {score.quality_rank}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-black font-medium">
                      {score.total_quality_score.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(score.updated_at).toLocaleDateString("ja-JP", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityScoreDisplay;
