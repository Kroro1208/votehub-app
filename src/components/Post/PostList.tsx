import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "../../supabase-client.ts";
import PostItem from "./PostItem.tsx";
import NestedPostItem from "./NestedPostItem.tsx";

export interface PostType {
  id: number;
  title: string;
  content: string;
  created_at: string;
  image_url: string | null;
  avatar_url: string | null;
  vote_count: number;
  comment_count: number;
  vote_deadline: string | null;
  community_id: number | null;
  user_id: string;
  parent_post_id: number | null;
  nest_level: number;
  target_vote_choice: number | null; // -1: 反対した人向け, 1: 賛成した人向け, null: 全員向け
  communities?: {
    id: number;
    name: string;
  };
  children?: PostType[];
}

interface PostListProps {
  filter?: "urgent" | "popular" | "recent";
  showNested?: boolean;
}

const PostList = ({ filter, showNested = false }: PostListProps) => {
  const queryClient = useQueryClient();
  const getFilteredPosts = async (): Promise<PostType[]> => {
    // get_posts_with_counts RPC関数で投票数とコメント数を含むデータを一括取得
    const { data, error } = await supabase.rpc("get_posts_with_counts");

    if (error) throw new Error(error.message);

    // コミュニティ情報を一括取得（N+1クエリ問題を解決）
    const communityIds = [
      ...new Set(
        data.map((post: PostType) => post.community_id).filter(Boolean),
      ),
    ];
    const { data: communities } = await supabase.rpc("get_communities_by_ids", {
      p_community_ids: communityIds,
    });

    const communityMap = new Map(
      communities?.map((c: { id: number; name: string }) => [c.id, c]) || [],
    );

    // データを統合（N+1クエリを使わず一括処理）
    const postsWithCommunities: PostType[] = data.map((post: PostType) => ({
      ...post,
      communities: post.community_id
        ? communityMap.get(post.community_id)
        : null,
      nest_level: post.nest_level || 0,
      parent_post_id: post.parent_post_id || null,
      target_vote_choice: post.target_vote_choice || null,
      children: [] as PostType[],
    }));

    // showNestedがtrueの場合のみネスト構造を構築
    let filteredPosts: PostType[];

    if (showNested) {
      // ネスト構造を構築
      const buildNestedStructure = (posts: PostType[]): PostType[] => {
        const postMap = new Map<number, PostType>();
        const rootPosts: PostType[] = [];

        // 全ての投稿をMapに追加
        posts.forEach((post) => {
          postMap.set(post.id, { ...post, children: [] });
        });

        // 親子関係を構築
        posts.forEach((post) => {
          const currentPost = postMap.get(post.id)!;

          if (post.parent_post_id && postMap.has(post.parent_post_id)) {
            const parentPost = postMap.get(post.parent_post_id)!;
            parentPost.children = parentPost.children || [];
            parentPost.children.push(currentPost);
          } else {
            // 親がないか見つからない場合はルート投稿
            rootPosts.push(currentPost);
          }
        });

        return rootPosts;
      };

      filteredPosts = buildNestedStructure(postsWithCommunities);
    } else {
      // ネスト表示しない場合は、ルート投稿のみ表示（parent_post_idがnullの投稿のみ）
      filteredPosts = postsWithCommunities.filter(
        (post) => post.parent_post_id === null,
      );
    }

    switch (filter) {
      case "urgent": {
        // 期限間近（24時間以内）の投票
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const now = new Date();

        filteredPosts = filteredPosts
          .filter(
            (post) =>
              post.vote_deadline &&
              new Date(post.vote_deadline) <= tomorrow &&
              new Date(post.vote_deadline) >= now,
          )
          .sort(
            (a, b) =>
              new Date(a.vote_deadline!).getTime() -
              new Date(b.vote_deadline!).getTime(),
          );
        break;
      }

      case "popular":
        // 投票数が多い順
        filteredPosts.sort((a, b) => b.vote_count - a.vote_count);
        break;

      case "recent":
      default:
        // 新着順（デフォルト）
        filteredPosts.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
    }

    return filteredPosts as PostType[];
  };

  const {
    data: posts,
    isPending,
    error,
    refetch,
  } = useQuery<PostType[], Error>({
    queryKey: ["posts", filter, showNested],
    queryFn: getFilteredPosts,
    staleTime: 1000 * 60 * 5, // 5分間キャッシュを有効とみなす
    gcTime: 1000 * 60 * 10, // 10分間キャッシュを保持
    refetchOnWindowFocus: false, // フォーカス時の自動リフェッチを無効化
  });

  // リアルタイム機能：投稿・投票・コメントの変更を監視
  useEffect(() => {
    // 投稿のリアルタイム更新を監視
    const postsChannel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        () => {
          // 投稿が変更されたらキャッシュを無効化
          queryClient.invalidateQueries({
            queryKey: ["posts", filter, showNested],
          });
        },
      )
      .subscribe();

    // 投票のリアルタイム更新を監視
    const votesChannel = supabase
      .channel("votes-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
        },
        () => {
          // 投票が変更されたらキャッシュを無効化
          queryClient.invalidateQueries({
            queryKey: ["posts", filter, showNested],
          });
        },
      )
      .subscribe();

    // コメントのリアルタイム更新を監視
    const commentsChannel = supabase
      .channel("comments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
        },
        () => {
          // コメントが変更されたらキャッシュを無効化
          queryClient.invalidateQueries({
            queryKey: ["posts", filter, showNested],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [filter, showNested, queryClient]);

  const handleNestedPostCreate = () => {
    refetch();
  };

  if (isPending) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium text-lg">
            投稿を読み込み中...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">エラーが発生しました: {error.message}</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-600">投稿がありません</p>
      </div>
    );
  }

  return (
    <div
      className={
        showNested ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"
      }
    >
      {posts.map((item) =>
        showNested ? (
          <NestedPostItem
            key={item.id}
            post={item}
            level={0}
            onNestedPostCreate={handleNestedPostCreate}
          />
        ) : (
          <PostItem key={item.id} post={item} />
        ),
      )}
    </div>
  );
};

export default PostList;
