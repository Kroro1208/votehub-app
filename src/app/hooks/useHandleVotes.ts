import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import { toast } from "react-toastify";
import { useAuth } from "./useAuth";
import { isPersuasionTime } from "../../utils/formatTime";
import { supabase } from "../../supabase-client";
import { checkRateLimit, RateLimitError } from "../../utils/rateLimiter";
import { validateNestedPostVote } from "../../utils/nestedPostValidation";
import { checkAndNotifyPersuasionTimeStarted } from "../../utils/notifications";

export interface Vote {
  id: number;
  post_id: number;
  user_id: string;
  vote: number;
  persuasion_vote_changed?: boolean | undefined;
  original_vote?: number | undefined;
  changed_at?: string | undefined;
}

const getVotes = async (postId: number): Promise<Vote[]> => {
  const { data, error } = await supabase.rpc("get_votes_for_post", {
    p_post_id: postId,
  });

  if (error) throw new Error(error.message);
  return data as Vote[];
};

export const useHandleVotes = (
  postId: number,
  voteDeadline?: string | null,
  postTitle?: string,
  targetVoteChoice?: number | null,
  userVoteOnParent?: number | null,
) => {
  const [isVoting, setIsVoting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const persuasionTime = isPersuasionTime(voteDeadline ?? null);

  const {
    data: votes,
    isPending,
    error,
  } = useQuery<Vote[], Error>({
    queryKey: ["votes", postId],
    queryFn: () => getVotes(postId),
    // 不要な自動リフェッチを無効化（必要に応じて調整）
    refetchInterval: false,
    staleTime: 1000 * 60 * 5, // 5分間はデータを新鮮として扱う
  });

  // リアルタイム機能：この特定の投稿への投票変更を監視
  useEffect(() => {
    const votesChannel = supabase
      .channel(`votes-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          // この投稿への投票が変更されたらキャッシュを無効化
          queryClient.invalidateQueries({
            queryKey: ["votes", postId],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(votesChannel);
    };
  }, [postId, queryClient]);

  // 派生質問の投票権限チェック
  const canVoteOnDerivedQuestion = () => {
    // 派生質問でない場合（targetVoteChoiceがnullまたは未設定）は投票可能
    if (targetVoteChoice === null || targetVoteChoice === undefined) {
      return true;
    }

    // 親投稿に投票していない場合は投票不可
    if (userVoteOnParent === null || userVoteOnParent === undefined) {
      return false;
    }

    // ユーザーの親投稿への投票がtargetVoteChoiceと一致する場合のみ投票可能
    return userVoteOnParent === targetVoteChoice;
  };

  const vote = async (voteValue: number, postId: number, userId: string) => {
    // レート制限チェック
    try {
      checkRateLimit(userId, "VOTE");
    } catch (error) {
      if (error instanceof RateLimitError) {
        toast.error(error.message);
        throw error;
      }
      throw error;
    }

    // 強化された投票権限チェック
    const validationResult = await validateNestedPostVote(userId, postId);
    if (!validationResult.isValid) {
      throw new Error(validationResult.error || "投票権限がありません");
    }

    // 従来のチェックも維持（フォールバック）
    if (!canVoteOnDerivedQuestion()) {
      const targetText = targetVoteChoice === 1 ? "賛成" : "反対";
      throw new Error(`この派生質問は${targetText}者のみ投票できます`);
    }

    // 現在の投票データを取得してhasUserVotedを正しく判定
    const currentVotes = await getVotes(postId);
    const currentUserVote = currentVotes?.find(
      (item) => item.user_id === userId,
    );
    const currentHasUserVoted = currentUserVote !== undefined;

    // 説得タイム中の投票変更制限をチェック
    if (persuasionTime && currentHasUserVoted) {
      // サーバーサイドで制限チェック
      const { data: canVote, error: restrictionError } = await supabase.rpc(
        "check_persuasion_vote_restriction",
        {
          p_post_id: postId,
          p_user_id: userId,
        },
      );

      if (restrictionError) {
        console.error("制限チェックエラー:", restrictionError);
        throw new Error("投票制限チェックに失敗しました");
      }

      if (!canVote) {
        throw new Error("説得タイム中の投票変更は1回までです");
      }

      // 説得タイム中の投票変更処理を使用（制限チェック済み）
      const { data, error } = await supabase.rpc(
        "force_persuasion_vote_change",
        {
          p_post_id: postId,
          p_user_id: userId,
          p_new_vote: voteValue,
        },
      );

      if (error) {
        console.error("force_persuasion_vote_change エラー:", error);
        throw new Error(error.message);
      }

      return {
        action: "updated",
        data: data,
        persuasionChanged: true,
      };
    }

    // 通常の投票処理

    const { data, error } = await supabase.rpc("handle_vote_secure", {
      p_post_id: postId,
      p_user_id: userId,
      p_vote_value: voteValue,
    });

    if (error) throw new Error(error.message);

    if (!data) {
      throw new Error("投票処理に失敗しました");
    }
    return {
      action: data.action,
      data: data.data,
    };
  };

  const { mutate } = useMutation({
    mutationFn: async (voteValue: number) => {
      if (!user) throw new Error("ユーザーが存在しません");
      setIsVoting(true);
      const result = await vote(voteValue, postId, user.id);
      setIsVoting(false);
      return result;
    },
    // 楽観的更新（APIを待たずにUIを先に更新）
    onMutate: async (voteValue) => {
      if (!user) return;

      // 説得タイム中は楽観的更新をスキップ（制限チェックのため）
      if (persuasionTime) {
        const currentVotes = queryClient.getQueryData<Vote[]>([
          "votes",
          postId,
        ]);
        const userVote = currentVotes?.find((v) => v.user_id === user.id);

        // 説得タイム中で既に投票している場合は楽観的更新をスキップ
        if (userVote) {
          return { previousVotes: currentVotes, skipOptimistic: true };
        }
      }

      // 現在のクエリデータをキャンセル
      await queryClient.cancelQueries({ queryKey: ["votes", postId] });

      // 以前のデータをスナップショットに保持
      const previousVotes = queryClient.getQueryData<Vote[]>(["votes", postId]);
      if (!previousVotes) return { previousVotes: undefined };

      // 新しい投票データを作成
      const newVotes = [...previousVotes];
      const userVoteIndex = previousVotes.findIndex(
        (v) => v.user_id === user.id,
      );

      // ケース1: 既存の投票がない場合、新規追加
      if (userVoteIndex === -1) {
        newVotes.push({
          id: Date.now(), // 一時的なID
          post_id: postId,
          user_id: user.id,
          vote: voteValue,
        });
      }
      // ケース3: 異なる種類の投票がある場合、更新
      else {
        newVotes[userVoteIndex] = {
          ...newVotes[userVoteIndex],
          vote: voteValue,
        } as Vote;
      }

      // 楽観的に更新
      // ["votes", postId]というキーに対応するキャッシュにnewVotesという値をセットして内部で更新
      queryClient.setQueryData(["votes", postId], newVotes);

      return { previousVotes };
    },
    onError: (err, _, context) => {
      // エラー時に元のデータに戻す
      if (context?.previousVotes) {
        queryClient.setQueryData(["votes", postId], context.previousVotes);
      }
      console.error(err);
    },
    onSettled: async () => {
      // 処理完了後にデータを再検証（必要な場合のみ）
      queryClient.invalidateQueries({ queryKey: ["votes", postId] });

      // 説得タイム開始通知をチェック（バックグラウンドで実行）
      if (postTitle && voteDeadline) {
        try {
          await checkAndNotifyPersuasionTimeStarted(
            postId,
            postTitle,
            voteDeadline,
          );
        } catch (error) {
          console.error("説得タイム開始通知チェックに失敗:", error);
        }
      }

      // 自動拡散チェックを実行（バックグラウンドで実行）
      try {
        await supabase.rpc("check_and_reward_auto_spread");
      } catch (error) {
        console.error("自動拡散チェックに失敗:", error);
      }
    },
  });

  const upVotes = votes?.filter((item) => item.vote === 1).length || 0;
  const downVotes = votes?.filter((item) => item.vote === -1).length || 0;
  const totalVotes = upVotes + downVotes;
  const userVote = votes?.find((item) => item.user_id === user?.id);

  // 投票済みかどうか
  const hasUserVoted = userVote !== undefined;

  // 説得タイム中に既に投票変更済みかどうか
  const hasPersuasionVoteChanged = userVote?.persuasion_vote_changed || false;

  // 説得タイム中でも、既に投票変更済みの場合は無効にする
  const isVotingDisabled =
    hasUserVoted && (!persuasionTime || hasPersuasionVoteChanged);

  // 投票の割合を計算（0票の場合は0%として表示）
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
    getVotes,
    hasPersuasionVoteChanged,
    persuasionTime,
    isVotingDisabled,
    canVoteOnDerivedQuestion,
  };
};
