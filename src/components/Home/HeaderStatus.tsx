import { Clock, TrendingUp, Users } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage.ts";
import { useHomeStats } from "../../hooks/useHomeStats.ts";

const HeaderStatus = () => {
  const { data: homeStats, isLoading: statsLoading } = useHomeStats();
  const { t } = useLanguage();

  return (
    <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4">
      <div className="mx-auto xl:mr-80">
        <h1 className="text-2xl font-bold text-slate-700 dark:text-dark-text mb-4">
          {t("home.title")}
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6" />
              <div>
                <p className="text-sm opacity-80">{t("home.stats.voting")}</p>
                <p className="text-xl font-bold">
                  {statsLoading ? "..." : homeStats?.votingPosts || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6" />
              <div>
                <p className="text-sm opacity-80">
                  {t("home.stats.today.participation")}
                </p>
                <p className="text-xl font-bold">
                  {statsLoading ? "..." : homeStats?.todayParticipation || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6" />
              <div>
                <p className="text-sm opacity-80">
                  {t("home.stats.active.users")}
                </p>
                <p className="text-xl font-bold">
                  {statsLoading ? "..." : homeStats?.activeUsers || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderStatus;
