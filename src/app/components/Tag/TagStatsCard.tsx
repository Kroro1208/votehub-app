import { useLanguage } from "../../hooks/useLanguage";
import { useTagStatsById } from "../../hooks/useTagStats";
import {
  Hash,
  MessageSquare,
  Users,
  Calendar,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

interface TagStatsCardProps {
  tagId: number;
  showCommunity?: boolean;
  compact?: boolean;
}

export const TagStatsCard: React.FC<TagStatsCardProps> = ({
  tagId,
  showCommunity = true,
  compact = false,
}) => {
  const { data: tagStats, isLoading, error } = useTagStatsById(tagId);
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <Card className={`${compact ? "w-64" : "w-full"}`}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !tagStats) {
    return (
      <Card className={`${compact ? "w-64" : "w-full"}`}>
        <CardContent className="p-4">
          <p className="text-red-500 text-sm">{t("common.error.occurred")}</p>
        </CardContent>
      </Card>
    );
  }

  const getPopularityBadgeColor = (score: number) => {
    if (score >= 100) return "bg-red-500";
    if (score >= 50) return "bg-orange-500";
    if (score >= 20) return "bg-yellow-500";
    if (score >= 5) return "bg-green-500";
    return "bg-gray-500";
  };

  const getPopularityLabel = (score: number) => {
    if (score >= 100) return t("tag.stats.popularity.very.high");
    if (score >= 50) return t("tag.stats.popularity.high");
    if (score >= 20) return t("tag.stats.popularity.medium");
    if (score >= 5) return t("tag.stats.popularity.low");
    return t("tag.stats.popularity.very.low");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getEngagementRate = () => {
    if (tagStats.post_count === 0) return 0;
    return Math.round((tagStats.vote_count / tagStats.post_count) * 100) / 100;
  };

  if (compact) {
    return (
      <Card className="w-64 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-sm">{tagStats.name}</span>
            </div>
            <Badge
              className={`text-white text-xs ${getPopularityBadgeColor(tagStats.popularity_score)}`}
            >
              {getPopularityLabel(tagStats.popularity_score)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3 text-gray-500" />
              <span>{tagStats.post_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-gray-500" />
              <span>{tagStats.vote_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3 text-blue-600" />
              <span>{tagStats.popularity_score}pt</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span>{getEngagementRate()}</span>
            </div>
          </div>

          {showCommunity && tagStats.community && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-600">
                {tagStats.community.name}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-blue-600" />
          {tagStats.name}
          <Badge
            className={`text-white ml-2 ${getPopularityBadgeColor(tagStats.popularity_score)}`}
          >
            {getPopularityLabel(tagStats.popularity_score)}
          </Badge>
        </CardTitle>
        {showCommunity && tagStats.community && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {tagStats.community.name}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium">{t("tag.stats.post.count")}</p>
              <p className="text-lg font-bold text-blue-600">
                {tagStats.post_count}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Users className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium">{t("tag.stats.vote.count")}</p>
              <p className="text-lg font-bold text-green-600">
                {tagStats.vote_count}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium">{t("tag.stats.popularity")}</p>
              <p className="text-lg font-bold text-purple-600">
                {tagStats.popularity_score}pt
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium">
                {t("tag.stats.reaction.rate")}
              </p>
              <p className="text-lg font-bold text-orange-600">
                {getEngagementRate()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="h-4 w-4" />
          <span>
            {t("common.created.date")}: {formatDate(tagStats.created_at)}
          </span>
        </div>

        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t("common.statistics")}
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>
              • {t("tag.stats.avg.votes.per.post")}:{" "}
              {tagStats.post_count > 0
                ? Math.round(
                    (tagStats.vote_count / tagStats.post_count) * 100,
                  ) / 100
                : 0}
            </p>
            <p>
              • {t("tag.stats.popularity.score.formula")}:{" "}
              {t("tag.stats.post.count")} × 2 + {t("tag.stats.vote.count")} ={" "}
              {tagStats.popularity_score}
            </p>
            <p>
              • {t("tag.stats.activity.level")}:{" "}
              {tagStats.popularity_score >= 50
                ? t("common.high")
                : tagStats.popularity_score >= 20
                  ? t("common.medium")
                  : t("common.low")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TagStatsCard;
