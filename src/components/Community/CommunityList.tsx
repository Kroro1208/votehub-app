/* eslint-disable react-refresh/only-export-components */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../supabase-client";
import { Link } from "react-router";
import { useState } from "react";
import {
  Search,
  Users,
  Calendar,
  ArrowRight,
  Sparkles,
  Plus,
} from "lucide-react";
import Error from "../Error";

export interface Community {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export const getCommunitites = async (): Promise<Community[]> => {
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new globalThis.Error(error.message);
  return data as Community[];
};

const CommunityList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data, isPending, error } = useQuery({
    queryKey: ["communities"],
    queryFn: getCommunitites,
  });

  // フィルタリングされたコミュニティのリスト
  const filteredCommunities = data?.filter(
    (community) =>
      community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isPending)
    return (
      <div className="flex justify-center items-center py-32">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-slate-200 border-t-violet-500 rounded-full animate-spin mx-auto"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-violet-500 w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            スペースを読み込み中...
          </h3>
          <p className="text-slate-600">
            素晴らしいコミュニティを準備しています
          </p>
        </div>
      </div>
    );

  if (error) {
    return <Error error={error} />;
  }

  return (
    <div className="space-y-12">
      {/* 検索セクション - Zennインスパイア */}
      <div className="max-w-2xl mx-auto">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
          <div className="relative">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-violet-500 transition-colors z-10" />
            <input
              type="text"
              placeholder="スペースを検索... 🔍"
              className="w-full pl-14 pr-6 py-4 bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all duration-300 shadow-lg hover:shadow-xl text-lg font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {searchTerm && (
          <div className="mt-4 text-center">
            <span className="inline-flex items-center px-4 py-2 bg-violet-100 text-violet-800 rounded-full text-sm font-medium">
              <Search className="w-4 h-4 mr-2" />
              {filteredCommunities?.length || 0}件のスペースが見つかりました
            </span>
          </div>
        )}
      </div>

      {/* 統計カード - Zennスタイル */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-violet-100">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                    <p className="text-violet-600 text-sm font-bold uppercase tracking-wide">
                      総スペース数
                    </p>
                  </div>
                  <p className="text-4xl font-black text-slate-900">
                    {data.length}
                  </p>
                  <p className="text-slate-600 text-sm">活発なコミュニティ</p>
                </div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 border-2 border-white rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-blue-600 text-sm font-bold uppercase tracking-wide">
                      検索結果
                    </p>
                  </div>
                  <p className="text-4xl font-black text-slate-900">
                    {filteredCommunities?.length || 0}
                  </p>
                  <p className="text-slate-600 text-sm">
                    {searchTerm ? "フィルター適用中" : "全て表示中"}
                  </p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <Search className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-emerald-100">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <p className="text-emerald-600 text-sm font-bold uppercase tracking-wide">
                      アクティブ
                    </p>
                  </div>
                  <p className="text-4xl font-black text-slate-900">
                    {data.length}
                  </p>
                  <p className="text-slate-600 text-sm">議論参加可能</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* コミュニティグリッド - Zennインスパイア */}
      {filteredCommunities?.length === 0 ? (
        <div className="text-center py-24">
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Search size={48} className="text-slate-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl">🔍</span>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-4">
            検索結果がありません
          </h3>
          <p className="text-xl text-slate-600 mb-8 max-w-md mx-auto">
            別のキーワードで検索してみるか、新しいスペースを作成してみませんか？
          </p>
          <Link
            to="/space/create"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-violet-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg"
          >
            <Plus size={24} />
            <span>新しいスペースを作成</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredCommunities?.map((community, index) => (
            <Link
              key={community.id}
              to={`/space/${community.id}`}
              className="group block"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: "fadeInUp 0.6s ease-out forwards",
              }}
            >
              <article className="h-full bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 overflow-hidden transform hover:-translate-y-2 hover:scale-[1.02] group-hover:border-violet-200">
                {/* Zennスタイルのヘッダー */}
                <div className="relative h-3 bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="p-8">
                  {/* アバターエリア - Zennスタイル */}
                  <div className="flex items-start space-x-5 mb-6">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                        {community.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-3 border-white rounded-full shadow-sm">
                        <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-bold text-slate-900 group-hover:text-violet-700 transition-colors duration-300 mb-2 line-clamp-2">
                        {community.name}
                      </h3>
                      <div className="flex items-center text-sm text-slate-500 space-x-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1.5" />
                          {new Date(community.created_at).toLocaleDateString(
                            "ja-JP",
                            { month: "short", day: "numeric" },
                          )}
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                          <span className="font-medium">アクティブ</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 説明文 - Zennスタイル */}
                  <div className="mb-8">
                    <p className="text-slate-700 text-base leading-relaxed line-clamp-3">
                      {community.description}
                    </p>
                  </div>

                  {/* フッターエリア - Zennスタイル */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 group-hover:border-violet-200 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-sm text-slate-500">
                        <Users className="w-4 h-4 mr-2" />
                        <span>コミュニティ</span>
                      </div>
                    </div>
                    <div className="flex items-center text-violet-600 font-semibold text-sm group-hover:text-violet-700 transition-colors">
                      <span>参加する</span>
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>

                {/* ホバーオーバーレイ */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl" />
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityList;
