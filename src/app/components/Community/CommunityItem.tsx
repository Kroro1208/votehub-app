"use client";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/supabase-client";
import { TrendingUp, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import ErrorMessage from "../ErrorMessage";
import Loading from "../Loading";
import { PostType } from "../Post/PostList";
import { Button } from "../ui/button";
import IndexItem from "./IndexItem";
import PopularItem from "./PopularItem";

interface Props {
  communityId: number;
}

export interface CommunityItemType extends PostType {
  communities?: { id: number; name: string };
}

const getCommunitityItem = async (
  communityId: number
): Promise<CommunityItemType[]> => {
  // get_posts_with_counts関数を使用して投票数とコメント数を取得
  const { data, error } = await supabase
    .rpc("get_posts_with_counts")
    .eq("community_id", communityId);

  if (error) throw new Error(error.message);

  // コミュニティ名を一度だけ取得（同じcommunity_idなので）
  const { data: communityData } = await supabase
    .from("communities")
    .select("id, name")
    .eq("id", communityId)
    .single();

  // 全ての投稿に同じコミュニティ情報を追加
  const postsWithCommunity = data.map((post: PostType) => ({
    ...post,
    communities: communityData
      ? { id: communityData.id, name: communityData.name }
      : undefined,
  }));

  return postsWithCommunity as CommunityItemType[];
};

// ユーザーの投票済み投稿IDを取得する関数
// [{post_id: 1}, {post_id: 3}, {post_id: 5}]）
const getUserVotedPostIds = async (userId?: string): Promise<Set<number>> => {
  if (!userId) return new Set();

  const { data, error } = await supabase
    .from("votes")
    .select("post_id")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return new Set(data.map((vote) => vote.post_id));
};

const CommunityItem = ({ communityId }: Props) => {
  const { user } = useAuth();
  const router = useRouter();

  const {
    data: communityItemData,
    isPending,
    error,
  } = useQuery<CommunityItemType[], Error>({
    queryKey: ["communitiyPost", communityId],
    queryFn: () => getCommunitityItem(communityId),
  });

  // ユーザーの投票済み投稿IDを取得（投票済みかどうかを表示するのに使用）
  const { data: votedPostIds } = useQuery({
    queryKey: ["userVotedPosts", user?.id],
    queryFn: () => getUserVotedPostIds(user?.id),
    enabled: !!user?.id,
  });

  if (isPending) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-700 p-8 relative overflow-hidden">
            {/* 背景装飾 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-400/20 dark:to-purple-400/20 rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/10 to-teal-500/10 dark:from-blue-400/20 dark:to-teal-400/20 rounded-full translate-y-12 -translate-x-12" />

            <div className="relative">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl">
                  {(communityItemData?.[0]?.communities?.name ?? "C")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 dark:from-violet-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                    {communityItemData?.[0]?.communities?.name ??
                      "このコミュニティ"}
                  </h1>
                  <p className="text-slate-600 dark:text-gray-300 text-lg mt-1">
                    投稿一覧
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 rounded-xl">
                    <TrendingUp
                      size={18}
                      className="text-violet-600 dark:text-violet-400"
                    />
                    <span className="text-violet-700 dark:text-violet-300 font-semibold">
                      {communityItemData?.length || 0}件の投稿
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-teal-100 dark:from-blue-900/50 dark:to-teal-900/50 rounded-xl">
                    <Users
                      size={18}
                      className="text-blue-600 dark:text-blue-400"
                    />
                    <span className="text-blue-700 dark:text-blue-300 font-semibold">
                      活発な議論中
                    </span>
                  </div>
                </div>
                {/* 投稿作成ボタン - 投稿がある場合のみ表示 */}
                {communityItemData && communityItemData.length > 0 && (
                  <div className="text-center">
                    <Button
                      onClick={() =>
                        router.push(`/post/create?community_id=${communityId}`)
                      }
                      className="dark:bg-amber-100 dark:text-black items-center text-white shadow-xl hover:shadow-xl cursor-pointer transform hover:scale-105"
                    >
                      <span>このスペースに投稿する</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 人気投稿セクション */}
        <PopularItem
          communityItemData={communityItemData}
          votedPostIds={votedPostIds}
        />
        {/* 投稿一覧 - 3列グリッド */}
        <IndexItem
          communityItemData={communityItemData}
          votedPostIds={votedPostIds}
        />
        {/* 空の状態 */}
        {communityItemData?.length === 0 && (
          <div className="text-center py-24">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-700 p-16 relative overflow-hidden">
              {/* 背景装飾 */}
              <div className="absolute top-0 left-1/2 w-40 h-40 bg-gradient-to-br from-violet-500/5 to-purple-500/5 dark:from-violet-400/10 dark:to-purple-400/10 rounded-full -translate-x-1/2 -translate-y-20" />

              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                  <Users
                    size={48}
                    className="text-slate-400 dark:text-gray-300"
                  />
                </div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-gray-200 mb-4">
                  まだ投稿がありません
                </h3>
                <p className="text-slate-500 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
                  このコミュニティで最初の投稿をしてみませんか？きっと素晴らしい議論が始まるはずです。
                </p>
                <Button
                  variant="default"
                  onClick={() =>
                    router.push(`/post/create?community_id=${communityId}`)
                  }
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-700 text-white font-bold rounded hover:from-violet-600 hover:to-purple-700 dark:hover:from-violet-700 dark:hover:to-purple-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  <span className="text-lg">最初の投稿を作成</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityItem;
