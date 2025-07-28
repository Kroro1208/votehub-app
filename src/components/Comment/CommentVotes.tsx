import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { supabase } from "../../supabase-client.ts";
import { useAuth } from "../../hooks/useAuth.ts";
import {
  commentVotesAtomFamily,
  mostVotedCommentAtomFamily,
  updateCommentVotes,
} from "../../stores/CommentVoteAtom.ts";
import { Button } from "../ui/button.tsx";
import { FaRegArrowAltCircleDown, FaRegArrowAltCircleUp } from "react-icons/fa";

interface VoteProps {
  commentId: number;
  postId: number; // 追加: どのポストに属するコメントかを識別するため
  authorId?: string; // コメント作者のID（共感ポイント表示用）
}

interface CommentVote {
  id: number;
  comment_id: number;
  user_id: string;
  vote: number;
}

// コメントに対しての投票取得（RPC関数使用）
const getCommentVotes = async (commentId: number): Promise<CommentVote[]> => {
  const { data, error } = await supabase.rpc("get_comment_votes", {
    p_comment_id: commentId,
  });

  if (error) throw new Error(error.message);
  return data as CommentVote[];
};

const CommentVotes = ({ commentId, postId, authorId }: VoteProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isVoting, setIsVoting] = useState(false);
  const [, setVotesState] = useAtom(commentVotesAtomFamily); // コメントごとのリアクションを管理するsetter
  const [, setMostVotedState] = useAtom(mostVotedCommentAtomFamily); // postに紐づくコメントの最も多いリアクションのsetter

  const {
    data: votes,
    isPending,
    error,
  } = useQuery<CommentVote[], Error>({
    queryKey: ["comment_votes", commentId],
    queryFn: () => getCommentVotes(commentId),
    // リアルタイム更新のため短いstaleTimeに設定
    staleTime: 1000 * 10, // 10秒間はデータを新鮮として扱う
    refetchInterval: false,
  });

  // リアルタイム更新のため
  useEffect(() => {
    const channel = supabase
      .channel(`comment_votes_${commentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comment_votes",
          filter: `comment_id=eq.${commentId}`,
        },
        () => {
          // comment_votesテーブルに変更があった場合、クエリを無効化してリフェッチ
          queryClient.invalidateQueries({
            queryKey: ["comment_votes", commentId],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [commentId, queryClient]);

  const upVotes = votes?.filter((item) => item.vote === 1).length || 0;
  const downVotes = votes?.filter((item) => item.vote === -1).length || 0;
  const totalReactions = upVotes + downVotes;

  // 共感ポイント計算（自分の投票は除外）
  const otherUserVotes =
    votes?.filter((item) => item.user_id !== authorId) || [];
  const otherUserReactions = otherUserVotes.length;
  const empathyPoints = otherUserReactions * 0.5;

  // totalVotesが変更されたらJotaiのstateも更新
  useEffect(() => {
    if (votes) {
      updateCommentVotes(
        commentId,
        postId,
        upVotes,
        downVotes,
        setVotesState,
        setMostVotedState,
      );
    }
  }, [
    votes,
    commentId,
    postId,
    upVotes,
    downVotes,
    setVotesState,
    setMostVotedState,
  ]);

  const userVote = votes?.find((item) => item.user_id === user?.id)?.vote;

  // vote関数をRPC関数で置き換え
  const vote = async (voteValue: number, commentId: number, userId: string) => {
    const { data, error } = await supabase.rpc("handle_comment_vote", {
      p_comment_id: commentId,
      p_user_id: userId,
      p_vote_value: voteValue,
    });

    if (error) throw new Error(error.message);

    if (!data) {
      throw new Error("投票処理に失敗しました");
    }

    return {
      action: data.action as "deleted" | "updated" | "inserted",
      data: data.data,
    };
  };

  const { mutate } = useMutation({
    mutationFn: async (voteValue: number) => {
      if (!user) throw new Error("ユーザーが存在しません");
      setIsVoting(true);
      const result = await vote(voteValue, commentId, user.id);
      setIsVoting(false);
      return result;
    },
    // 楽観的更新（APIを待たずにUIを先に更新）
    onMutate: async (voteValue) => {
      if (!user) return;

      // 現在のクエリデータをキャンセル
      await queryClient.cancelQueries({
        queryKey: ["comment_votes", commentId],
      });

      // 以前のデータをスナップショットに保持
      const previousVotes = queryClient.getQueryData<CommentVote[]>([
        "comment_votes",
        commentId,
      ]);
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
          comment_id: commentId,
          user_id: user.id,
          vote: voteValue,
        });
      }
      // ケース2: 同じ種類の投票がある場合、削除
      else if (newVotes[userVoteIndex].vote === voteValue) {
        newVotes.splice(userVoteIndex, 1);
      }
      // ケース3: 異なる種類の投票がある場合、更新
      else {
        newVotes[userVoteIndex] = {
          ...newVotes[userVoteIndex],
          vote: voteValue,
        };
      }

      // 楽観的に更新
      queryClient.setQueryData(["comment_votes", commentId], newVotes);

      // Jotaiの状態も楽観的に更新
      const newUpVotes = newVotes.filter((v) => v.vote === 1).length;
      const newDownVotes = newVotes.filter((v) => v.vote === -1).length;
      updateCommentVotes(
        commentId,
        postId,
        newUpVotes,
        newDownVotes,
        setVotesState,
        setMostVotedState,
      );

      return { previousVotes };
    },
    onError: (err, _, context) => {
      // エラー時に元のデータに戻す
      if (context?.previousVotes) {
        queryClient.setQueryData(
          ["comment_votes", commentId],
          context.previousVotes,
        );

        // Jotaiの状態も元に戻す
        const prevUpVotes = context.previousVotes.filter(
          (v) => v.vote === 1,
        ).length;
        const prevDownVotes = context.previousVotes.filter(
          (v) => v.vote === -1,
        ).length;
        updateCommentVotes(
          commentId,
          postId,
          prevUpVotes,
          prevDownVotes,
          setVotesState,
          setMostVotedState,
        );
      }
      console.error(err);
    },
    onSettled: () => {
      // ユーザーポイントも更新
      queryClient.invalidateQueries({
        queryKey: ["userEmpathyPoints", authorId],
      });
      // 処理完了後にデータを再検証（必要な場合のみ）
      queryClient.invalidateQueries({ queryKey: ["comment_votes", commentId] });
    },
  });

  if (isPending) return <div>読み込み中...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className="relative">
      <div className="flex gap-3 items-center">
        <Button
          type="button"
          variant="outline"
          disabled={isVoting || !user}
          onClick={() => mutate(1)}
          className={`cursor-pointer px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 relative
              ${isVoting ? "opacity-50" : ""}
              ${!user ? "cursor-not-allowed opacity-50" : ""}
              ${
                userVote === 1
                  ? "bg-green-500 dark:bg-green-500 text-white shadow-lg scale-105 border-green-500"
                  : "text-gray-700 dark:text-gray-300 hover:bg-green-600 hover:text-white border-gray-300 dark:border-gray-600"
              }`}
          title={!user ? "ログインが必要です" : "共感を示す"}
        >
          <FaRegArrowAltCircleUp />
          <span className="font-medium">{upVotes}</span>
        </Button>

        <Button
          variant="outline"
          type="button"
          disabled={isVoting || !user}
          onClick={() => mutate(-1)}
          className={`cursor-pointer px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2
              ${isVoting ? "opacity-50" : ""}
              ${!user ? "cursor-not-allowed opacity-50" : ""}
              ${
                userVote === -1
                  ? "bg-red-600 dark:bg-red-500 text-white shadow-lg scale-105 border-red-600"
                  : "text-gray-700 dark:text-gray-300 hover:bg-red-600 hover:text-white border-gray-300 dark:border-gray-600"
              }`}
          title={!user ? "ログインが必要です" : "反対意見を示す"}
        >
          <FaRegArrowAltCircleDown />
          <span className="font-medium">{downVotes}</span>
        </Button>

        {/* 共感ポイント表示 - コメント主のみに表示 */}
        {totalReactions > 0 && authorId === user?.id && (
          <div className="px-2 py-1 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
            +{empathyPoints}pt
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentVotes;
