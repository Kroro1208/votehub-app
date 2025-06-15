import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import PostItem from "./PostItem";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { postsAtom } from "../stores/PostAtom";

export interface PostType {
  id: number;
  title: string;
  content: string;
  created_at: string;
  image_url: string;
  avatar_url?: string;
  vote_count?: number;
  comment_count?: number;
  vote_deadline?: string | null;
  community_id?: number | null;
  user_id: string | null;
  communities?: {
    id: number;
    name: string;
  };
  comments?: { count: number }[];
}

interface PostListProps {
  filter?: "urgent" | "popular" | "recent";
}

const PostList = ({ filter }: PostListProps) => {
  const [, setPosts] = useAtom(postsAtom);

  const getFilteredQuery = () => {
    const query = supabase.from("posts").select(`
        *,
        communities (id, name),
        comments(count)
      `);

    switch (filter) {
      case "urgent": {
        // 期限間近（24時間以内）の投票
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return query
          .not("vote_deadline", "is", null)
          .lte("vote_deadline", tomorrow.toISOString())
          .gte("vote_deadline", new Date().toISOString())
          .order("vote_deadline", { ascending: true });
      }

      case "popular":
        // 投票数が多い順
        return query.order("vote_count", { ascending: false });

      case "recent":
        // 新着順
        return query.order("created_at", { ascending: false });

      default:
        // すべて（デフォルト）
        return query.order("created_at", { ascending: false });
    }
  };

  const {
    data: posts,
    isPending,
    error,
  } = useQuery<PostType[], Error>({
    queryKey: ["posts", filter],
    queryFn: async () => {
      const { data, error } = await getFilteredQuery();
      if (error) throw new Error(error.message);

      // コメント数を集計してpostに追加
      const postsWithCommentCount = data?.map((post) => ({
        ...post,
        comment_count: post.comments?.length || 0,
      }));

      return postsWithCommentCount as PostType[];
    },
  });

  useEffect(() => {
    if (posts) {
      setPosts(posts);
    }
  }, [posts, setPosts]);

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
      {posts?.map((item) => <PostItem key={item.id} post={item} />)}
    </div>
  );
};

export default PostList;
