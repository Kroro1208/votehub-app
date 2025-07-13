import { AlertTriangle, Crown, Sparkles, Users } from "lucide-react";
import { Card, CardContent } from "../ui/card.tsx";
import { PostLimitStatus } from "../../hooks/usePostLimits.ts";
import { Button } from "../ui/button.tsx";

type Props = {
  postLimitStatus: PostLimitStatus | null;
  handleRemovePostLimit: () => Promise<void>;
};

const getMembershipDisplay = (membership_type: string) => {
  switch (membership_type) {
    case "free":
      return { name: "無料会員", icon: Users, color: "text-gray-600" };
    case "standard":
      return { name: "スタンダード", icon: Sparkles, color: "text-blue-600" };
    case "platinum":
      return { name: "プラチナ", icon: Crown, color: "text-purple-600" };
    case "diamond":
      return { name: "ダイヤモンド", icon: Crown, color: "text-yellow-600" };
    default:
      return { name: "無料会員", icon: Users, color: "text-gray-600" };
  }
};

const GradePanel = ({ postLimitStatus, handleRemovePostLimit }: Props) => {
  return (
    <div>
      {postLimitStatus && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {(() => {
                  const membershipDisplay = getMembershipDisplay(
                    postLimitStatus.membership_type,
                  );
                  const IconComponent = membershipDisplay.icon;
                  return (
                    <>
                      <div
                        className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm`}
                      >
                        <IconComponent
                          className={`h-5 w-5 ${membershipDisplay.color}`}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {membershipDisplay.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          本日の投稿: {postLimitStatus.current_count}/
                          {postLimitStatus.daily_limit}
                          {postLimitStatus.remaining_posts > 0
                            ? ` (残り${postLimitStatus.remaining_posts}回)`
                            : " (制限到達)"}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {!postLimitStatus.can_post && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">投稿制限到達</span>
                  </div>
                  <Button
                    type="button"
                    onClick={handleRemovePostLimit}
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-none hover:from-orange-600 hover:to-red-600"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    30ポイントで解除
                  </Button>
                </div>
              )}
            </div>

            {/* 投稿制限の詳細情報 */}
            <div className="mt-4 p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    今日の投稿数:
                  </span>
                  <span className="ml-2 text-blue-600 dark:text-blue-400 font-semibold">
                    {postLimitStatus.current_count}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    制限数:
                  </span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {postLimitStatus.daily_limit}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    残り投稿:
                  </span>
                  <span
                    className={`ml-2 font-semibold ${postLimitStatus.remaining_posts > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {postLimitStatus.remaining_posts}回
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GradePanel;
