import { AlertTriangle, Crown, Sparkles, Users } from "lucide-react";
import { Card, CardContent } from "../ui/card.tsx";
import { PostLimitStatus } from "../../hooks/usePostLimits.ts";
import { Button } from "../ui/button.tsx";
import { useLanguage } from "../../hooks/useLanguage.ts";

type Props = {
  postLimitStatus: PostLimitStatus | null;
  handleRemovePostLimit: () => Promise<void>;
};

const getMembershipDisplay = (
  membership_type: string,
  t: (key: string) => string,
) => {
  switch (membership_type) {
    case "free":
      return {
        name: t("grade.panel.membership.free"),
        icon: Users,
        color: "text-gray-600",
      };
    case "standard":
      return {
        name: t("grade.panel.membership.standard"),
        icon: Sparkles,
        color: "text-blue-600",
      };
    case "platinum":
      return {
        name: t("grade.panel.membership.platinum"),
        icon: Crown,
        color: "text-purple-600",
      };
    case "diamond":
      return {
        name: t("grade.panel.membership.diamond"),
        icon: Crown,
        color: "text-yellow-600",
      };
    default:
      return {
        name: t("grade.panel.membership.free"),
        icon: Users,
        color: "text-gray-600",
      };
  }
};

const GradePanel = ({ postLimitStatus, handleRemovePostLimit }: Props) => {
  const { t } = useLanguage();
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
                    t,
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
                          {t("grade.panel.daily.posts")}:{" "}
                          {postLimitStatus.current_count}/
                          {postLimitStatus.daily_limit}
                          {postLimitStatus.remaining_posts > 0
                            ? ` (${t("grade.panel.remaining")}${postLimitStatus.remaining_posts}${t("grade.panel.times")})`
                            : ` (${t("grade.panel.limit.reached")})`}
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
                    <span className="text-sm font-medium">
                      {t("grade.panel.post.limit.reached")}
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={handleRemovePostLimit}
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-none hover:from-orange-600 hover:to-red-600"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t("grade.panel.remove.with.points")}
                  </Button>
                </div>
              )}
            </div>

            {/* 投稿制限の詳細情報 */}
            <div className="mt-4 p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {t("grade.panel.today.posts")}:
                  </span>
                  <span className="ml-2 text-blue-600 dark:text-blue-400 font-semibold">
                    {postLimitStatus.current_count}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {t("grade.panel.limit.count")}:
                  </span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {postLimitStatus.daily_limit}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {t("grade.panel.remaining.posts")}:
                  </span>
                  <span
                    className={`ml-2 font-semibold ${postLimitStatus.remaining_posts > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {postLimitStatus.remaining_posts}
                    {t("grade.panel.times")}
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
