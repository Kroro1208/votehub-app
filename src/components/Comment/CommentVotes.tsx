import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAtom } from "jotai";
import {
  commentVotesAtomFamily,
  mostVotedCommentAtomFamily,
  updateCommentVotes,
} from "../stores/CommentVoteAtom";

interface VoteProps {
  commentId: number;
  postId: number; // 追加: どのポストに属するコメントかを識別するため
}

interface CommentVote {
  id: number;
  comment_id: number;
  user_id: string;
  vote: number;
}

interface VoteResult {
  action: "deleted" | "updated" | "inserted";
  data: CommentVote | CommentVote[] | null;
}

const getVotes = async (commentId: number): Promise<CommentVote[]> => {
  const { data, error } = await supabase
    .from("comment_votes")
    .select("*")
    .eq("comment_id", commentId);

  if (error) throw new Error(error.message);
  return data as CommentVote[];
};

const CommentVotes = ({ commentId, postId }: VoteProps) => {
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
    queryFn: () => getVotes(commentId),
    // 不要な自動リフェッチを無効化（必要に応じて調整）
    refetchInterval: false,
    staleTime: 1000 * 60 * 5, // 5分間はデータを新鮮として扱う
  });

  const upVotes = votes?.filter((item) => item.vote === 1).length || 0;
  const downVotes = votes?.filter((item) => item.vote === -1).length || 0;

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

  // vote関数を最適化: 処理結果を返す(useMutation用)
  const vote = async (voteValue: number, commentId: number, userId: string) => {
    const { data: existingVote } = await supabase
      .from("comment_votes")
      .select("*")
      .eq("comment_id", commentId)
      .eq("user_id", userId)
      .maybeSingle();

    // 処理結果を保持する変数
    let result: VoteResult;

    // すでに投票していた場合
    if (existingVote) {
      // 同じ投票(upかdownか)については取り消し
      if (existingVote.vote === voteValue) {
        const { data, error } = await supabase
          .from("comment_votes")
          .delete()
          .eq("id", existingVote.id)
          .select();

        if (error) throw new Error(error.message);
        result = { action: "deleted", data };
      } else {
        // 異なる投票(upかdownか)については更新
        const { data, error } = await supabase
          .from("comment_votes")
          .update({ vote: voteValue })
          .eq("id", existingVote.id)
          .select();
        if (error) throw new Error(error.message);
        result = { action: "updated", data };
      }
    } else {
      const { data, error } = await supabase
        .from("comment_votes")
        .insert({ comment_id: commentId, user_id: userId, vote: voteValue })
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
      // 処理完了後にデータを再検証（必要な場合のみ）
      queryClient.invalidateQueries({ queryKey: ["comment_votes", commentId] });
    },
  });

  if (isPending) return <div>読み込み中...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className="flex gap-5">
      <button
        type="button"
        disabled={isVoting}
        onClick={() => mutate(1)}
        className={`cursor-pointer px-3 py-1 rounded transition-colors duration-150 flex gap-2
            ${isVoting ? "opacity-50" : ""}
            ${userVote === 1 ? "bg-green-500 text-white" : "bg-gray-200 text-black"}`}
      >
        ❤️<p>{upVotes}</p>
      </button>
      <button
        type="button"
        disabled={isVoting}
        onClick={() => mutate(-1)}
        className={`cursor-pointer px-3 py-1 rounded transition-colors duration-150 flex gap-2
            ${isVoting ? "opacity-50" : ""}
            ${userVote === -1 ? "bg-red-500 text-white" : "bg-gray-200 text-black"}`}
      >
        ☠️
        <p>{downVotes}</p>
      </button>
    </div>
  );
};

export default CommentVotes;
