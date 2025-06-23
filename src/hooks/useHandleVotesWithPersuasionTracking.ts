import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useState } from "react";
import { useAuth } from "./useAuth";

export interface Vote {
  id: number;
  post_id: number;
  user_id: string;
  vote: number;
  persuasion_vote_changed?: boolean;
  original_vote?: number;
  changed_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface VoteResult {
  action: "deleted" | "updated" | "inserted";
  data: Vote | Vote[] | null;
  persuasionChanged?: boolean;
}

// 説得タイムかどうかを判定するヘルパー関数
const isPersuasionTime = (voteDeadline: string | null): boolean => {
  if (!voteDeadline) return false;
  const deadline = new Date(voteDeadline);
  const now = new Date();
  const oneHourBeforeDeadline = new Date(deadline.getTime() - 60 * 60 * 1000);
  return now >= oneHourBeforeDeadline && now < deadline;
};

const getVotes = async (postId: number): Promise<Vote[]> => {
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("post_id", postId);

  if (error) throw new Error(error.message);
  return data as Vote[];
};

// 説得タイム中の投票変更統計を取得
const getPersuasionStats = async (postId: number) => {
  const { data, error } = await supabase.rpc("get_persuasion_vote_stats", {
    p_post_id: postId,
  });

  if (error) throw new Error(error.message);
  return data[0] || { total_votes: 0, changed_votes: 0, change_rate: 0 };
};

export const useHandleVotesWithPersuasionTracking = (
  postId: number,
  voteDeadline?: string | null,
) => {
  const [isVoting, setIsVoting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: votes,
    isPending,
    error,
  } = useQuery<Vote[], Error>({
    queryKey: ["votes", postId],
    queryFn: () => getVotes(postId),
    refetchInterval: false,
    staleTime: 1000 * 60 * 5, // 5分間はデータを新鮮として扱う
  });

  // 説得タイム統計を取得
  const { data: persuasionStats, isPending: isStatsLoading } = useQuery({
    queryKey: ["persuasion-stats", postId],
    queryFn: () => getPersuasionStats(postId),
    enabled: !!voteDeadline,
    refetchInterval: 30000, // 30秒ごとに更新
  });

  // 説得タイム中の投票変更を考慮したvote関数
  const vote = async (
    voteValue: number,
    postId: number,
    userId: string,
  ): Promise<VoteResult> => {
    const { data: existingVote } = await supabase
      .from("votes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    let result: VoteResult;
    const isCurrentlyPersuasionTime = isPersuasionTime(voteDeadline || null);

    // すでに投票していた場合
    if (existingVote) {
      // 同じ投票については取り消し
      if (existingVote.vote === voteValue) {
        const { data, error } = await supabase
          .from("votes")
          .delete()
          .eq("id", existingVote.id)
          .select();

        if (error) throw new Error(error.message);
        result = { action: "deleted", data };
      } else {
        // 異なる投票については更新
        // 説得タイム中の場合は専用関数を使用
        if (isCurrentlyPersuasionTime) {
          const { data: trackingResult, error: trackingError } =
            await supabase.rpc("track_persuasion_vote_change", {
              p_post_id: postId,
              p_user_id: userId,
              p_new_vote: voteValue,
            });

          if (trackingError) throw new Error(trackingError.message);

          // 更新された投票データを取得
          const { data: updatedVote, error: fetchError } = await supabase
            .from("votes")
            .select("*")
            .eq("id", existingVote.id)
            .single();

          if (fetchError) throw new Error(fetchError.message);

          result = {
            action: "updated",
            data: updatedVote,
            persuasionChanged: trackingResult,
          };
        } else {
          // 通常の投票更新
          const { data, error } = await supabase
            .from("votes")
            .update({ vote: voteValue })
            .eq("id", existingVote.id)
            .select();

          if (error) throw new Error(error.message);
          result = { action: "updated", data };
        }
      }
    } else {
      const { data, error } = await supabase
        .from("votes")
        .insert({ post_id: postId, user_id: userId, vote: voteValue })
        .select();
      if (error) throw new Error(error.message);
      result = { action: "inserted", data };
    }

    return result;
  };

  const { mutate } = useMutation({
    mutationFn: async (voteValue: number) => {
      if (!user) throw new Error("ユーザーが存在しません");
      setIsVoting(true);
      const result = await vote(voteValue, postId, user.id);
      setIsVoting(false);
      return result;
    },
    onMutate: async (voteValue) => {
      if (!user) return;

      await queryClient.cancelQueries({ queryKey: ["votes", postId] });

      const previousVotes = queryClient.getQueryData<Vote[]>(["votes", postId]);
      if (!previousVotes) return { previousVotes: undefined };

      const newVotes = [...previousVotes];
      const userVoteIndex = previousVotes.findIndex(
        (v) => v.user_id === user.id,
      );

      if (userVoteIndex === -1) {
        newVotes.push({
          id: Date.now(),
          post_id: postId,
          user_id: user.id,
          vote: voteValue,
        });
      } else if (newVotes[userVoteIndex].vote === voteValue) {
        newVotes.splice(userVoteIndex, 1);
      } else {
        newVotes[userVoteIndex] = {
          ...newVotes[userVoteIndex],
          vote: voteValue,
        };
      }

      queryClient.setQueryData(["votes", postId], newVotes);
      return { previousVotes };
    },
    onError: (err, _, context) => {
      if (context?.previousVotes) {
        queryClient.setQueryData(["votes", postId], context.previousVotes);
      }
      console.error(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["votes", postId] });
      queryClient.invalidateQueries({ queryKey: ["persuasion-stats", postId] });
    },
  });

  const upVotes = votes?.filter((item) => item.vote === 1).length || 0;
  const downVotes = votes?.filter((item) => item.vote === -1).length || 0;
  const totalVotes = upVotes + downVotes;
  const userVote = votes?.find((item) => item.user_id === user?.id);

  // 説得タイム中に投票を変更したかどうか
  const userChangedVoteDuringPersuasion =
    userVote?.persuasion_vote_changed || false;

  const hasUserVoted = userVote !== undefined;
  const persuasionTimeActive = isPersuasionTime(voteDeadline || null);

  const upVotePercentage = totalVotes > 0 ? (upVotes / totalVotes) * 100 : 0;
  const downVotePercentage =
    totalVotes > 0 ? (downVotes / totalVotes) * 100 : 0;

  return {
    mutate,
    isVoting,
    hasUserVoted,
    upVotePercentage,
    downVotePercentage,
    userVote: userVote?.vote,
    upVotes,
    downVotes,
    totalVotes,
    isPending,
    error,
    // 説得タイム関連の新しい情報
    persuasionTimeActive,
    userChangedVoteDuringPersuasion,
    persuasionStats,
    isStatsLoading,
    getVotes,
  };
};
