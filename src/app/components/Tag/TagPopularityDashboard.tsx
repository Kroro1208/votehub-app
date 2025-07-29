"use client";
import { useState } from "react";

import {
  BarChart3,
  Hash,
  MessageSquare,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { TagStats, useTagStats } from "../../hooks/useTagStats";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  PopularityCalculationType,
  getTopTagsByPopularity,
} from "@/lib/tagUtils";

interface TagPopularityDashboardProps {
  communityId?: number;
  limit?: number;
}

export const TagPopularityDashboard: React.FC<TagPopularityDashboardProps> = ({
  communityId,
  limit = 10,
}) => {
  const [sortBy, setSortBy] = useState<
    "post_count" | "vote_count" | "popularity_score"
  >("popularity_score");
  const [calculationType, setCalculationType] =
    useState<PopularityCalculationType>(PopularityCalculationType.SIMPLE);

  const {
    data: tagStats,
    isLoading,
    error,
    refetch,
  } = useTagStats({
    communityId,
    limit,
    sortBy,
    sortOrder: "desc",
  });

  const handleRefresh = () => {
    refetch();
  };

  const getPopularityBadgeColor = (score: number) => {
    if (score >= 100) return "bg-red-500";
    if (score >= 50) return "bg-orange-500";
    if (score >= 20) return "bg-yellow-500";
    if (score >= 5) return "bg-green-500";
    return "bg-gray-500";
  };

  const getPopularityLabel = (score: number) => {
    if (score >= 100) return "非常に人気";
    if (score >= 50) return "人気";
    if (score >= 20) return "普通";
    if (score >= 5) return "少し人気";
    return "活動少";
  };

  const getTrendIcon = (postCount: number, voteCount: number) => {
    const ratio = postCount > 0 ? voteCount / postCount : 0;
    if (ratio >= 5) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (ratio >= 2) return <TrendingUp className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            タグ人気度ダッシュボード
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            タグ人気度ダッシュボード
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">データの取得に失敗しました</p>
            <Button onClick={handleRefresh} variant="outline">
              再読み込み
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topTags = tagStats
    ? getTopTagsByPopularity(tagStats, limit, calculationType)
    : [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          タグ人気度ダッシュボード
        </CardTitle>
        <div className="flex gap-4 mt-4">
          <Select
            value={sortBy}
            onValueChange={(
              value: "post_count" | "vote_count" | "popularity_score",
            ) => setSortBy(value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="並び順を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity_score">人気度スコア</SelectItem>
              <SelectItem value="post_count">投稿数</SelectItem>
              <SelectItem value="vote_count">投票数</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={calculationType}
            onValueChange={(value: PopularityCalculationType) =>
              setCalculationType(value)
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="計算方法を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PopularityCalculationType.SIMPLE}>
                シンプル
              </SelectItem>
              <SelectItem value={PopularityCalculationType.WEIGHTED}>
                重み付き
              </SelectItem>
              <SelectItem value={PopularityCalculationType.TIME_DECAY}>
                時間減衰
              </SelectItem>
              <SelectItem value={PopularityCalculationType.ENGAGEMENT}>
                エンゲージメント
              </SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleRefresh} variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            更新
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {topTags.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">タグが見つかりませんでした</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topTags.map((tag: TagStats, index: number) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        #{tag.name}
                      </span>
                      <Badge
                        className={`text-white ${getPopularityBadgeColor(tag.popularity_score)}`}
                      >
                        {getPopularityLabel(tag.popularity_score)}
                      </Badge>
                      {getTrendIcon(tag.post_count, tag.vote_count)}
                    </div>

                    {tag.community && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {tag.community.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <MessageSquare className="h-4 w-4" />
                    <span>{tag.post_count}件</span>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>{tag.vote_count}票</span>
                  </div>

                  <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400">
                    <BarChart3 className="h-4 w-4" />
                    <span>{tag.popularity_score}pt</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {topTags.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              人気度スコアについて
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p>
                • <strong>シンプル:</strong> 投稿数 × 2 + 投票数
              </p>
              <p>
                • <strong>重み付き:</strong> 投稿数 × 3 + 投票数 × 2 +
                コメント数 × 0.5
              </p>
              <p>
                • <strong>時間減衰:</strong> 作成時期が古いほど人気度が減少
              </p>
              <p>
                • <strong>エンゲージメント:</strong> 投稿あたりの反応率を考慮
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TagPopularityDashboard;
