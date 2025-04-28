import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import PostItem from "./PostItem";

export interface PostType {
  id: number;
  title: string;
  content: string;
  created_at: string;
  image_url: string;
  avatar_url?: string;
  vote_count?: number;
  comment_count?: number;
}

const fetchPosts = async (): Promise<PostType[]> => {
  const { data, error } = await supabase.rpc("get_posts_with_counts");

  if (error) throw new Error(error.message);
  return data as PostType[];
};

const PostList = () => {
  const { data, isPending, error } = useQuery<PostType[], Error>({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });
  console.log("data", data);

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
