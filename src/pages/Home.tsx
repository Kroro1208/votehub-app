import PostList from "../components/Post/PostList";
import { Clock, TrendingUp, Users } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import Sidebar from "../components/SideBar";
import RightPanel from "../components/RightPanel";
import { useLanguage } from "../context/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      <Sidebar />
      {/* Main Content */}
      <div className="ml-52 min-h-screen bg-slate-300 dark:bg-dark-bg transition-colors">
        {/* Header with stats */}
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
                    <p className="text-sm opacity-80">
                      {t("home.stats.voting")}
                    </p>
                    <p className="text-xl font-bold">24</p>
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
                    <p className="text-xl font-bold">1,247</p>
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
                    <p className="text-xl font-bold">892</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="border-b mt-5 border-slate-200 dark:border-slate-700">
          <div className="max-w-4xl mx-auto px-6 xl:mr-80">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-dark-surface">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-violet-500 data-[state=active]:text-white dark:text-dark-text"
                >
                  {t("home.tabs.all")}
                </TabsTrigger>
                <TabsTrigger
                  value="urgent"
                  className="data-[state=active]:bg-violet-500 data-[state=active]:text-white dark:text-dark-text"
                >
                  {t("home.tabs.urgent")}
                </TabsTrigger>
                <TabsTrigger
                  value="popular"
                  className="data-[state=active]:bg-violet-500 data-[state=active]:text-white dark:text-dark-text"
                >
                  {t("home.tabs.popular")}
                </TabsTrigger>
                <TabsTrigger
                  value="recent"
                  className="data-[state=active]:bg-violet-500 data-[state=active]:text-white dark:text-dark-text"
                >
                  {t("home.tabs.recent")}
                </TabsTrigger>
              </TabsList>

              {/* Vote Grid - Right Panelとの重複を避けるため左に寄せる */}
              <div className="p-6">
                <TabsContent value="all" className="mt-0">
                  <PostList />
                </TabsContent>

                <TabsContent value="urgent" className="mt-0">
                  <PostList filter="urgent" />
                </TabsContent>

                <TabsContent value="popular" className="mt-0">
                  <PostList filter="popular" />
                </TabsContent>

                <TabsContent value="recent" className="mt-0">
                  <PostList filter="recent" />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
        <RightPanel />
      </div>
    </div>
  );
}
