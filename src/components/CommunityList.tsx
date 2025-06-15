/* eslint-disable react-refresh/only-export-components */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { Link } from "react-router";
import { useState } from "react";
import { Search, Users, Calendar, ArrowRight, Sparkles } from "lucide-react";
import Error from "./Error";

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
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto mb-4"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-slate-500 w-6 h-6" />
          </div>
          <p className="text-slate-600 font-medium text-lg">
            スペースを読み込み中...
          </p>
        </div>
      </div>
    );

  if (error) {
    <Error error={error} />;
  }

  return (
    <div className="space-y-8">
      {/* 検索とフィルターセクション */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="スペース名や説明で検索..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-200 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 統計情報 */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-200 text-sm font-medium">
                  総スペース数
                </p>
                <p className="text-3xl font-bold">{data.length}</p>
              </div>
              <Users className="w-8 h-8 text-slate-300" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">検索結果</p>
                <p className="text-3xl font-bold">
                  {filteredCommunities?.length || 0}
                </p>
              </div>
              <Search className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">
                  アクティブ
                </p>
                <p className="text-3xl font-bold">{data.length}</p>
              </div>
              <Sparkles className="w-8 h-8 text-emerald-200" />
            </div>
          </div>
        </div>
      )}

      {/* コミュニティグリッド */}
      {filteredCommunities?.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-600 mb-2">
            検索結果がありません
          </h3>
          <p className="text-slate-500">別のキーワードで検索してみてください</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities?.map((community, index) => (
            <div
              key={community.id}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 overflow-hidden transform hover:-translate-y-1.2 hover:scale-[1.01]"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: "slideInUp 0.6s ease-out forwards",
              }}
            >
              {/* カードヘッダー */}
              <div className="h-2 bg-gradient-to-r from-slate-500 via-blue-500 to-teal-500" />

              <div className="p-6">
                {/* アバターとタイトル */}
                <div className="flex items-start space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {community.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-slate-700 transition-colors duration-200 mb-1">
                      {community.name}
                    </h3>
                    <div className="flex items-center text-sm text-slate-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(community.created_at).toLocaleDateString(
                        "ja-JP",
                      )}
                    </div>
                  </div>
                </div>

                {/* 説明 */}
                <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3">
                  {community.description}
                </p>

                {/* アクションボタン */}
                <Link
                  to={`/space/${community.id}`}
                  className="group/btn inline-flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <span>スペースに参加</span>
                  <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityList;
