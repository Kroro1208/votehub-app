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
}

const fetchPosts = async (): Promise<PostType[]> => {
  const { data, error } = await supabase.rpc("get_posts_with_counts");

  if (error) throw new Error(error.message);
  return data as PostType[];
};

const PostList = () => {
  const [, setPosts] = useAtom(postsAtom);

  const { data, isPending, error } = useQuery<PostType[], Error>({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  useEffect(() => {
    if (data) {
      setPosts(data);
    }
  }, [data, setPosts]);

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className="flex flex-wrap gap-6 justify-center">
      {data.map((item) => (
        <PostItem key={item.id} post={item} />
      ))}
    </div>
  );
};

export default PostList;
