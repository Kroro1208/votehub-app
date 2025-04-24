import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import type { PostType } from "./PostList";

interface Props {
  postId: number;
}
const fetchPostById = async (id: number): Promise<PostType> => {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id) // 受け取ったidとpostsテーブルのidが一致するものを取得
    .single();

  if (error) throw new Error(error.message);
  return data as PostType;
};

const PostDetail = ({ postId }: Props) => {
  const { data, error, isPending } = useQuery<PostType, Error>({
    queryKey: ["post"],
    queryFn: () => fetchPostById(postId),
  });

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;
  return (
    <div className="space-y-6">
      <h2 className="text-6xl font-bold text-center bg-gradient-to-r from-green-600 to-green-200 bg-clip-text text-transparent">
        {data.title}
      </h2>
      <img
        src={data.image_url}
        alt={data.title}
        className="mt-4 rounded object-cover w-full h-64"
      />
      <p className="text-gray-400">{data?.content}</p>
      <p className="text-gray-500 text-sm">
        {new Date(data?.created_at).toLocaleDateString()}
      </p>
    </div>
  );
};

export default PostDetail;
