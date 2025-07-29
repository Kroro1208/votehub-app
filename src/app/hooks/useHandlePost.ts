import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../supabase-client";
import { useAuth } from "./useAuth";
import { PostType } from "../components/Post/PostList";
import {
  getTimeRemaining,
  isVotingExpired as isVotingExpiredUtil,
  isPersuasionTime as isPersuasionTimeUtil,
} from "../../utils/formatTime";

const getUserVoteForPost = async (postId: number, userId?: string) => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("votes")
    .select("*")
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
    return isVotingExpiredUtil(post.vote_deadline);
  };

  // 説得タイム（期限の1時間前）かどうかをチェック
  const isPersuasionTime = () => {
    return isPersuasionTimeUtil(post.vote_deadline);
  };

  // 投票期限に対する残り時間を計算
  const getTimeRemainingString = () => {
    const timeString = getTimeRemaining(post.vote_deadline);
    return timeString || "終了";
  };

  return {
    userVote,
    isPersuasionTime,
    isVotingExpired,
    getTimeRemaining: getTimeRemainingString,
  };
};
