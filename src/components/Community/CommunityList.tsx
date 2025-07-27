/* eslint-disable react-refresh/only-export-components */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../supabase-client.ts";
import { Link } from "react-router";
import { useState } from "react";
import {
  Search,
  Calendar,
  ArrowRight,
  Vote,
  TrendingUp,
  Flame,
} from "lucide-react";
import Error from "../Error.tsx";
import { Input } from "../ui/input.tsx";

export interface Community {
  id: number;
  name: string;
  description: string;
  created_at: string;
  icon?: string;
}

export interface CommunityWithStats extends Community {
  post_count?: number;
}

export const getCommunitites = async (): Promise<CommunityWithStats[]> => {
  // コミュニティの基本情報を取得
  const { data: communities, error: communitiesError } = await supabase
    .from("communities")
    .select("id, name, description, created_at, icon")
    .order("created_at", { ascending: true });

  if (communitiesError) throw new globalThis.Error(communitiesError.message);

  // 各コミュニティの統計情報を並行取得
  const communitiesWithStats = await Promise.all(
    communities.map(async (community: Community) => {
      // 投稿数を取得
      const { count: postCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("community_id", community.id);

      return {
        ...community,
        post_count: postCount || 0,
      };
    }),
  );

  return communitiesWithStats as CommunityWithStats[];
};

const CommunityList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data, isPending, error } = useQuery({
    queryKey: ["communities"],
    queryFn: getCommunitites,
  });

  // 人気のスペースを取得（投稿数でソート）
  const popularSpaces = data
    ? [...data]
        .sort((a, b) => (b.post_count || 0) - (a.post_count || 0))
        .slice(0, 3)
    : [];

  // 人気のスペースのIDセットを作成
  const popularSpaceIds = new Set(popularSpaces.map((space) => space.id));

  // フィルタリングされたコミュニティのリスト（人気のスペースを除外）
  const filteredCommunities = data?.filter(
    (community) =>
      !popularSpaceIds.has(community.id) && // 人気のスペースは除外
      (community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (isPending)
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );

  if (error) {
    return <Error error={error} />;
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* 検索バー - Zennスタイル */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <Input
            type="text"
            placeholder="スペースを検索"
            className="w-full pl-10 pr-4 py-2 text-black border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = (e.target as HTMLInputElement & { value: string })
                .value;
              setSearchTerm(value);
            }}
          />
        </div>
      </div>

      {/* 人気のスペースセクション */}
      {popularSpaces.length > 0 && (
        <div className="mb-12">
          <div className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 rounded-2xl border border-orange-100 overflow-hidden">
            {/* ヘッダー */}
            <div className="p-6 pb-4 border-b border-orange-100/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                  <Flame size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    人気のスペース
                  </h2>
                  <p className="text-sm text-orange-700/80">
                    最もアクティブな議論が行われているスペース
                  </p>
                </div>
              </div>
            </div>

            {/* 人気スペース一覧 */}
            <div className="p-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularSpaces.map((space, index) => (
                  <Link
                    key={space.id}
                    to={`/space/${space.id}`}
                    className="group relative bg-white rounded-xl border border-orange-200/50 p-4 hover:border-orange-300 hover:shadow-lg transition-all duration-300"
                  >
                    {/* ランクバッジ */}
                    <div className="absolute -top-2 -left-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ${
                          index === 0
                            ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                            : index === 1
                              ? "bg-gradient-to-br from-gray-300 to-gray-500"
                              : index === 2
                                ? "bg-gradient-to-br from-orange-300 to-orange-600"
                                : "bg-gradient-to-br from-pink-400 to-red-500"
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      {/* アバター */}
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-br from-orange-400 to-red-500">
                        <span className="text-2xl">
                          {space.icon || space.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* コンテンツ */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                            {space.name}
                          </h3>
                          <ArrowRight
                            size={16}
                            className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
                          />
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                          {space.description}
                        </p>

                        {/* 統計情報 */}
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1 text-xs">
                            <TrendingUp size={12} className="text-orange-500" />
                            <span className="font-medium text-orange-700">
                              {space.post_count || 0}件の投稿
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-gray-500">アクティブ</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ホバー効果 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* コミュニティグリッド - Zenn風だけど見やすく */}
      {filteredCommunities?.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-gray-500 mb-4">
            スペースが見つかりませんでした
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities?.map((community) => (
            <Link
              key={community.id}
              to={`/space/${community.id}`}
              className="group block relative"
            >
              {/* 投票ブース風カード */}
              <div className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md border border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500 hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* 投票所バナー */}
                <div className="h-2 bg-gradient-to-r from-slate-400 to-slate-600 dark:from-slate-600 dark:to-slate-500"></div>

                {/* ヘッダー：投票所看板風 */}
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-xs font-medium uppercase tracking-wide">
                        投票スペース
                      </span>
                    </div>
                    <div className="text-xs bg-white/15 px-2 py-1 rounded">
                      OPEN
                    </div>
                  </div>

                  {/* スペース名 */}
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 backdrop-blur-sm">
                      <span className="text-lg">
                        {community.icon ||
                          community.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-base group-hover:text-slate-200 transition-colors line-clamp-1">
                      {community.name}
                    </h3>
                  </div>
                </div>

                {/* メインコンテンツ */}
                <div className="p-4">
                  {/* 説明文 */}
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 leading-relaxed">
                    {community.description}
                  </p>

                  {/* 投票活動状況 */}
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 mb-4">
                    <div className="text-center mb-2">
                      <div className="text-xl font-bold text-gray-800 dark:text-white">
                        {community.post_count || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        進行中の議論
                      </div>
                    </div>

                    {/* 活動レベル表示 */}
                    <div className="flex justify-center">
                      <div className="flex items-center space-x-1 text-xs">
                        {community.post_count === 0 ? (
                          <>
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="text-gray-500">静寂</span>
                          </>
                        ) : community.post_count &&
                          community.post_count >= 10 ? (
                          <>
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            <span className="text-red-600">白熱中</span>
                          </>
                        ) : community.post_count &&
                          community.post_count >= 5 ? (
                          <>
                            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                            <span className="text-orange-600">活発</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            <span className="text-emerald-600">穏やか</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 参加を促すCTA */}
                  <div className="text-center mb-3">
                    <div className="inline-flex items-center space-x-2 text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200">
                      <Vote size={12} />
                      <span>議論に参加</span>
                      <ArrowRight
                        size={12}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </div>

                  {/* フッター情報 */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar size={12} />
                      <span>
                        {new Date(community.created_at).toLocaleDateString(
                          "ja-JP",
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="font-medium">ACTIVE</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* フッター情報 */}
      {data && data.length > 0 && (
        <div className="mt-8 text-sm text-gray-500 text-center">
          {data.length}個のスペース
        </div>
      )}
    </div>
  );
};

export default CommunityList;
