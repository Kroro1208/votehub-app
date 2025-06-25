/* eslint-disable react-refresh/only-export-components */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../supabase-client";
import { Link } from "react-router";
import { useState } from "react";
import { Search, Calendar, ArrowRight, Vote } from "lucide-react";
import Error from "../Error";

export interface Community {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface CommunityWithStats extends Community {
  post_count?: number;
}

export const getCommunitites = async (): Promise<CommunityWithStats[]> => {
  // コミュニティの基本情報を取得
  const { data: communities, error: communitiesError } = await supabase
    .from("communities")
    .select("*")
    .order("created_at", { ascending: true });

  if (communitiesError) throw new globalThis.Error(communitiesError.message);

  // 各コミュニティの統計情報を並行取得
  const communitiesWithStats = await Promise.all(
    communities.map(async (community) => {
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

  // フィルタリングされたコミュニティのリスト
  const filteredCommunities = data?.filter(
    (community) =>
      community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.description.toLowerCase().includes(searchTerm.toLowerCase()),
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="スペースを検索"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* コミュニティグリッド - Zenn風だけど見やすく */}
      {filteredCommunities?.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-gray-500 mb-4">
            スペースが見つかりませんでした
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCommunities?.map((community) => (
            <Link
              key={community.id}
              to={`/space/${community.id}`}
              className="group block bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start space-x-4">
                {/* アバター - カラフル */}
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{
                    backgroundColor: `hsl(${(community.id * 137.508) % 360}, 70%, 50%)`,
                  }}
                >
                  {community.name.charAt(0).toUpperCase()}
                </div>

                {/* コンテンツ */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {community.name}
                    </h3>
                    <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                    {community.description}
                  </p>

                  <div className="flex items-center justify-end space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar size={15} />
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
                      <Vote size={15} />
                      <span>{community.post_count || 0}件の投稿</span>
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
