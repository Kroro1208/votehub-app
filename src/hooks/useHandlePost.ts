import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "./useAuth";
import { PostType } from "../components/Post/PostList";

const getUserVoteForPost = async (postId: number, userId?: string) => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("votes")
    .select("vote")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? data?.vote : null;
};

export const useHandlePost = (post: PostType) => {
  const { user } = useAuth();

  const { data: userVote } = useQuery({
    queryKey: ["userVote", post.id, user?.id],
    queryFn: () => getUserVoteForPost(post.id, user?.id),
    enabled: !!user?.id,
  });

  // 投票期限をチェックする関数
  const isVotingExpired = () => {
    if (!post.vote_deadline) return false;
    return new Date() > new Date(post.vote_deadline);
  };

  // 説得タイム（期限の1時間前）かどうかをチェック
  const isPersuasionTime = () => {
    if (!post.vote_deadline) return false;
    const deadline = new Date(post.vote_deadline);
    const now = new Date();
    const oneHourBeforeDeadline = new Date(deadline.getTime() - 60 * 60 * 1000);
    return now >= oneHourBeforeDeadline && now < deadline;
  };

  // 投票期限に対する残り時間を計算
  const getTimeRemaining = () => {
    if (!post.vote_deadline) return null;
    const now = new Date();
    const deadline = new Date(post.vote_deadline);
    const diff = deadline.getTime() - now.getTime();

    if (diff <= 0) return "終了";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}日`;
    } else if (hours > 0) {
      return `${hours}時間`;
    } else {
      return `${minutes}分`;
    }
  };

  return {
    userVote,
    isPersuasionTime,
    isVotingExpired,
    getTimeRemaining,
  };
};
