import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../supabase-client.ts";
import PostItem from "./PostItem.tsx";
import NestedPostItem from "./NestedPostItem.tsx";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { postsAtom } from "../../stores/PostAtom.ts";

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

interface Community {
  id: number;
  name: string;
}

interface PostListProps {
  filter?: "urgent" | "popular" | "recent";
  showNested?: boolean;
}

const PostList = ({ filter, showNested = false }: PostListProps) => {
  const [, setPosts] = useAtom(postsAtom);

  const getFilteredPosts = async (): Promise<PostType[]> => {
    // get_posts_with_counts関数の代わりに直接クエリを実行
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        id,
        title,
        content,
        created_at,
        image_url,
        avatar_url,
        vote_deadline,
        community_id,
        user_id,
        parent_post_id,
        nest_level,
        target_vote_choice
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    // 各投稿の投票数とコメント数を取得
    const postsWithCounts = await Promise.all(
      data.map(async (post) => {
        // 投票数を取得
        const { data: voteData } = await supabase
          .from("votes")
          .select("id", { count: "exact" })
          .eq("post_id", post.id);

        // コメント数を取得
        const { data: commentData } = await supabase
          .from("comments")
          .select("id", { count: "exact" })
          .eq("post_id", post.id);

        return {
          ...post,
          vote_count: voteData?.length || 0,
          comment_count: commentData?.length || 0,
          nest_level: post.nest_level || 0,
          parent_post_id: post.parent_post_id || null,
          target_vote_choice: post.target_vote_choice || null,
          children: [] as PostType[],
        } as PostType;
      }),
    );

    const postsData = postsWithCounts;

    // コミュニティ情報を追加
    const postsWithCommunities = await Promise.all(
      postsData.map(async (post: PostType) => {
        if (post.community_id) {
          const { data: community } = await supabase
            .from("communities")
            .select("id, name")
            .eq("id", post.community_id)
            .single();

          return {
            ...post,
            communities: community as Community,
            parent_post_id: post.parent_post_id || null,
            nest_level: post.nest_level || 0,
            target_vote_choice: post.target_vote_choice || null,
            children: [],
          };
        }
        return {
          ...post,
          parent_post_id: post.parent_post_id || null,
          nest_level: post.nest_level || 0,
          target_vote_choice: post.target_vote_choice || null,
          children: [],
        };
      }),
    );

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
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnWindowFocus: true, // Refetch when window gets focus
  });

  const handleNestedPostCreate = () => {
    refetch();
  };

  useEffect(() => {
    if (posts) {
      setPosts(posts);
    }
  }, [posts, setPosts]);

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
