import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/supabase-client";
import { Clock, RefreshCw, TrendingUp, Users } from "lucide-react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface PersuasionStatsProps {
  postId: number;
  voteDeadline?: string | null;
}

interface PersuasionStats {
  total_votes: number;
  changed_votes: number;
  change_rate: number;
}

interface PersuasionReport {
  original_vote_value: number;
  new_vote_value: number;
  change_count: number;
}

// 説得タイムかどうかを判定
const isPersuasionTime = (voteDeadline: string | null): boolean => {
  if (!voteDeadline) return false;
  const deadline = new Date(voteDeadline);
  const now = new Date();
  const oneHourBeforeDeadline = new Date(deadline.getTime() - 60 * 60 * 1000);
  return now >= oneHourBeforeDeadline && now < deadline;
};

// 投票期限が過ぎているかを判定
const isVotingExpired = (voteDeadline: string | null): boolean => {
  if (!voteDeadline) return false;
  return new Date() > new Date(voteDeadline);
};

const PersuasionStatsDisplay = ({
  postId,
  voteDeadline,
}: PersuasionStatsProps) => {
  // 説得タイム統計を取得
  const { data: stats, isLoading: isStatsLoading } = useQuery<PersuasionStats>({
    queryKey: ["persuasion-stats", postId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_persuasion_vote_stats", {
        p_post_id: postId,
      });
      if (error) throw new Error(error.message);
      return data[0] || { total_votes: 0, changed_votes: 0, change_rate: 0 };
    },
    refetchInterval: 600000, //60秒ごとに更新
    enabled: !!voteDeadline,
  });

  // 説得効果レポートを取得
  const { data: report, isLoading: isReportLoading } = useQuery<
    PersuasionReport[]
  >({
    queryKey: ["persuasion-report", postId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_persuasion_effectiveness_report",
        {
          p_post_id: postId,
        },
      );
      if (error) throw new Error(error.message);
      return data || [];
    },
    refetchInterval: 30000,
    enabled: !!voteDeadline && isVotingExpired(voteDeadline), // 投票終了後のみ表示
  });

  const persuasionActive = isPersuasionTime(voteDeadline ?? null);
  const votingEnded = isVotingExpired(voteDeadline ?? null);

  if (!voteDeadline) return null;

  // ローディング中
  if (isStatsLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <RefreshCw className="animate-spin mr-2" size={16} />
            <span className="text-sm text-gray-500">統計を読み込み中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 説得タイム中の表示 */}
      {persuasionActive && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Clock size={20} />
              説得タイム進行中
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-700">投票変更可能</span>
              <Badge
                variant="outline"
                className="border-orange-300 text-orange-700"
              >
                残り時間:
                {Math.ceil(
                  (new Date(voteDeadline).getTime() - new Date().getTime()) /
                    (1000 * 60),
                )}
                分
              </Badge>
            </div>

            {stats && (
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-800">
                    {stats.total_votes}
                  </div>
                  <div className="text-xs text-orange-600">総投票数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-800">
                    {stats.changed_votes}
                  </div>
                  <div className="text-xs text-orange-600">変更済み</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-800">
                    {stats.change_rate}%
                  </div>
                  <div className="text-xs text-orange-600">変更率</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 投票終了後の説得効果レポート */}
      {votingEnded && stats && stats.changed_votes > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} />
              説得効果レポート
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 全体統計 */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  <Users className="inline mr-1" size={20} />
                  {stats.total_votes}
                </div>
                <div className="text-sm text-gray-600">総投票者数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  <RefreshCw className="inline mr-1" size={20} />
                  {stats.changed_votes}
                </div>
                <div className="text-sm text-gray-600">意見を変更</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.change_rate}%
                </div>
                <div className="text-sm text-gray-600">説得成功率</div>
              </div>
            </div>

            {/* 投票変更の詳細 */}
            {!isReportLoading && report && report.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">投票変更の内訳</h4>
                {report.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          item.original_vote_value === 1
                            ? "default"
                            : "destructive"
                        }
                      >
                        元: {item.original_vote_value === 1 ? "賛成" : "反対"}
                      </Badge>
                      <span className="text-gray-500">→</span>
                      <Badge
                        variant={
                          item.new_vote_value === 1 ? "default" : "destructive"
                        }
                      >
                        新: {item.new_vote_value === 1 ? "賛成" : "反対"}
                      </Badge>
                    </div>
                    <div className="font-semibold">{item.change_count}人</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PersuasionStatsDisplay;
