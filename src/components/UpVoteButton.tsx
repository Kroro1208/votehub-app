import { useMutation, useQuery } from "@tanstack/react-query";
import { TbArrowBigUpLine } from "react-icons/tb";
import { TbArrowBigDownLine } from "react-icons/tb";
import { supabase } from "../supabase-client";
import { useAuth } from "../hooks/useAuth";

interface PostProps {
  postId: number;
}
interface Vote {
  id: number;
  post_id: number;
  user_id: string;
  vote: number;
}

const vote = async (voteValue: number, postId: number, userId: string) => {
  const { data: existingVote } = await supabase
    .from("votes")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  // すでに投票していた場合
  if (existingVote) {
    // 同じ投票(upかdownか)については取り消し
    if (existingVote.vote === voteValue) {
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("id", existingVote.id);

      if (error) throw new Error(error.message);
    } else {
      // 異なる投票(upかdownか)については更新
      const { error } = await supabase
        .from("votes")
        .update({ vote: voteValue })
        .eq("id", existingVote.id);
      if (error) throw new Error(error.message);
    }
  } else {
    const { error } = await supabase
      .from("votes")
      .insert({ post_id: postId, user_id: userId, vote: voteValue });
    if (error) throw new Error(error.message);
  }
};

const getVotes = async (postId: number): Promise<Vote[]> => {
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("post_id", postId);
  if (error) throw new Error(error.message);
  return data as Vote[];
};

const UpVoteButton = ({ postId }: PostProps) => {
  const { user } = useAuth();

  const {
    data: votes,
    isPending,
    error,
  } = useQuery<Vote[], Error>({
    queryKey: ["votes", postId],
    queryFn: () => getVotes(postId),
    refetchInterval: 5000,
  });

  const { mutate } = useMutation({
    mutationFn: (voteValue: number) => {
      if (!user) throw new Error("ユーザーが存在しません");
      return vote(voteValue, postId, user.id);
    },
  });

  const upVotes = votes?.filter((item) => item.vote === 1).length || 0;
  const downVotes = votes?.filter((item) => item.vote === -1).length || 0;

  if (isPending) return <div>投票中</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div>
      <button
        type="button"
        onClick={() => mutate(1)}
        className="cursor-pointer"
      >
        <TbArrowBigUpLine size={30} />
        {upVotes}
      </button>
      <button
        type="button"
        onClick={() => mutate(-1)}
        className="cursor-pointer"
      >
        <TbArrowBigDownLine size={30} />
        {downVotes}
      </button>
    </div>
  );
};

export default UpVoteButton;
