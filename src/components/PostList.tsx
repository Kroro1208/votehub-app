import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import PostItem from "./PostItem";

export interface PostType {
  id: number;
  title: string;
  content: string;
  created_at: string;
  image_url: string;
}

const fetchPosts = async (): Promise<PostType[]> => {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as PostType[];
};

const PostList = () => {
  const { data, isPending, error } = useQuery<PostType[], Error>({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  console.log("取得データ", data);

  return (
    <div className="flex flex-wrap gap-6 justify-center">
      {data.map((item) => (
        <PostItem key={item.id} post={item} />
      ))}
    </div>
  );
};

export default PostList;
