import { useQuery } from "@tanstack/react-query";
import ErrorMessage from "../ErrorMessage";
import Loading from "../Loading";
import type { PostType } from "../Post/PostList";
import { supabase } from "../../supabase-client";
import { Users, TrendingUp } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import PopularItem from "./PopularItem";
import IndexItem from "./IndexItem";

interface Props {
  communityId: number;
}

export interface CommunityItemType extends PostType {
  communities?: { id: number; name: string };
}

const getCommunitityItem = async (
  communityId: number,
): Promise<CommunityItemType[]> => {
  // get_posts_with_counts関数を使用して投票数とコメント数を取得
  const { data, error } = await supabase
    .rpc("get_posts_with_counts")
    .eq("community_id", communityId);

  if (error) throw new Error(error.message);

  // コミュニティ名を追加で取得
  const postsWithCommunity = await Promise.all(
    data.map(async (post: PostType) => {
      const { data: communityData } = await supabase
        .from("communities")
        .select("id, name")
        .eq("id", post.community_id)
        .single();

      return {
        ...post,
        communities: communityData
          ? { id: communityData.id, name: communityData.name }
          : undefined,
      };
    }),
  );

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
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="rounded-2xl shadow-sm  border-gray-200">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-purple-500 bg-clip-text text-transparent">
              {communityItemData?.[0]?.communities?.name ?? "このコミュニティ"}
              の投稿一覧
            </h1>
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
              <TrendingUp size={16} />
              <span>{communityItemData?.length || 0}件の投稿</span>
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
          <div className="text-center py-16">
            <div className="rounded-2xl shadow-sm border border-gray-200 p-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                まだ投稿がありません
              </h3>
              <p className="text-gray-500">
                このコミュニティで最初の投稿をしてみませんか？
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityItem;
