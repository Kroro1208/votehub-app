import { Vote, BarChart3, Activity } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage.ts";
import { useHomeStats } from "../../hooks/useHomeStats.ts";

const HeaderStatus = () => {
  const { data: homeStats, isLoading: statsLoading } = useHomeStats();
  const { t } = useLanguage();

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 px-6 py-8 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-8 w-32 h-32 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-6 right-12 w-24 h-24 border border-white rounded-full"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 border border-white rounded-full"></div>
      </div>

      <div className="mx-auto xl:mr-80 relative z-10">
        <div className="flex items-center mb-6">
          <Vote className="w-8 h-8 text-white mr-3" />
          <h1 className="text-3xl font-bold text-white">
            {t("home.title")} - {t("home.header.title")}
          </h1>
        </div>

        {/* Voting Dashboard */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 text-white hover:bg-white/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <Vote className="w-7 h-7 text-blue-300" />
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {statsLoading ? "..." : homeStats?.votingPosts || 0}
                </p>
                <p className="text-xs text-blue-200 uppercase tracking-wide">
                  {t("home.stats.voting")}
                </p>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 mt-3">
              <div className="bg-blue-400 h-2 rounded-full w-3/4"></div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 text-white hover:bg-white/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-7 h-7 text-emerald-300" />
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {statsLoading ? "..." : homeStats?.todayParticipation || 0}
                </p>
                <p className="text-xs text-emerald-200 uppercase tracking-wide">
                  {t("home.stats.today.participation")}
                </p>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 mt-3">
              <div className="bg-emerald-400 h-2 rounded-full w-5/6"></div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 text-white hover:bg-white/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-7 h-7 text-orange-300" />
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {statsLoading ? "..." : homeStats?.activeUsers || 0}
                </p>
                <p className="text-xs text-orange-200 uppercase tracking-wide">
                  {t("home.stats.active.users")}
                </p>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 mt-3">
              <div className="bg-orange-400 h-2 rounded-full w-2/3"></div>
            </div>
          </div>

          {/* <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 text-white hover:bg-white/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-7 h-7 text-yellow-300" />
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {statsLoading ? "..." : "0"}
                </p>
                <p className="text-xs text-yellow-200 uppercase tracking-wide">
                  今週の決着
                </p>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 mt-3">
              <div className="bg-yellow-400 h-2 rounded-full w-4/5"></div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default HeaderStatus;
