import PostList from "../components/PostList";
import { Clock, TrendingUp, Users } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import Sidebar from "../components/SideBar";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Sidebar />
      {/* Main Content */}
      <div className="ml-64 min-h-screen">
        {/* Header with stats */}
        <div className="bg-blue-100 border-b border-slate-200 px-6 py-4">
          <div className="max-w-4xl mx-auto xl:mr-80">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">
              アクティブな投票
            </h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-4 text-white">
                <div className="flex items-center space-x-3">
                  <Clock className="w-6 h-6" />
                  <div>
                    <p className="text-sm opacity-80">投票中</p>
                    <p className="text-xl font-bold">24</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-6 h-6" />
                  <div>
                    <p className="text-sm opacity-80">今日の参加</p>
                    <p className="text-xl font-bold">1,247</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white">
                <div className="flex items-center space-x-3">
                  <Users className="w-6 h-6" />
                  <div>
                    <p className="text-sm opacity-80">アクティブユーザー</p>
                    <p className="text-xl font-bold">892</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="border-b mt-5 border-slate-200">
          <div className="max-w-4xl mx-auto px-6 xl:mr-80">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-100">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-violet-500 data-[state=active]:text-white"
                >
                  すべて
                </TabsTrigger>
                <TabsTrigger
                  value="urgent"
                  className="data-[state=active]:bg-violet-500 data-[state=active]:text-white"
                >
                  期限間近
                </TabsTrigger>
                <TabsTrigger
                  value="popular"
                  className="data-[state=active]:bg-violet-500 data-[state=active]:text-white"
                >
                  人気
                </TabsTrigger>
                <TabsTrigger
                  value="recent"
                  className="data-[state=active]:bg-violet-500 data-[state=active]:text-white"
                >
                  新着
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

        {/* Right Panel - Quick Stats */}
        <div className="fixed right-6 top-32 w-72 hidden xl:block">
          <div className="bg-yellow-100 rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
            <h3 className="font-semibold text-slate-800 mb-3">
              🔥 トレンドトピック
            </h3>
            <div className="space-y-3">
              {["環境問題", "テクノロジー", "スポーツ"].map((topic, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">#{topic}</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                    {Math.floor(Math.random() * 50 + 10)}票
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-100 rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-800 mb-3">⏰ 終了間近</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-sm">
                  <p className="text-slate-800 font-medium">投票タイトル{i}</p>
                  <p className="text-orange-600 text-xs">残り {i * 2}時間</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
