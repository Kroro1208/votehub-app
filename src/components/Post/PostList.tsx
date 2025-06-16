import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../supabase-client";
import PostItem from "./PostItem";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { postsAtom } from "../../stores/PostAtom";

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
  communities?: {
    id: number;
    name: string;
  };
}

interface Community {
  id: number;
  name: string;
}

interface PostListProps {
  filter?: "urgent" | "popular" | "recent";
}

const PostList = ({ filter }: PostListProps) => {
  const [, setPosts] = useAtom(postsAtom);

  const getFilteredPosts = async (): Promise<PostType[]> => {
    // SQLファンクションを使用して投稿とカウントを取得
    const { data, error } = await supabase.rpc("get_posts_with_counts");

    if (error) throw new Error(error.message);

    const postsData = data as PostType[];

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
          };
        }
        return post;
      }),
    );

    // フィルタリング処理
    let filteredPosts = [...postsWithCommunities];

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
  } = useQuery<PostType[], Error>({
    queryKey: ["posts", filter],
    queryFn: getFilteredPosts,
  });

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
      {posts.map((item) => (
        <PostItem key={item.id} post={item} />
      ))}
    </div>
  );
};

export default PostList;
