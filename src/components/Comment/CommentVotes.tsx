import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { supabase } from "../../supabase-client";
import { useAuth } from "../../hooks/useAuth";
import {
  commentVotesAtomFamily,
  mostVotedCommentAtomFamily,
  updateCommentVotes,
} from "../../stores/CommentVoteAtom";
import { Heart, Skull } from "lucide-react";

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

interface VoteResult {
  action: "deleted" | "updated" | "inserted";
  data: CommentVote | CommentVote[] | null;
}

// コメントに対しての投票取得
const getCommentVotes = async (commentId: number): Promise<CommentVote[]> => {
  const { data, error } = await supabase
    .from("comment_votes")
    .select("*")
    .eq("comment_id", commentId);

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

  // リアルタイム更新のためのSubscription
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
  const totalReactions = upVotes + downVotes; // ❤️と💀の合計
  const empathyPoints = totalReactions * 0.5; // 共感ポイント計算（両方とも加算）

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
    // 処理結果を保持する変数
    let result: VoteResult;

    // まず削除を試みる（既存投票がある場合）
    const { data: deletedData, error: deleteError } = await supabase
      .from("comment_votes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userId)
      .eq("vote", voteValue)
      .select();

    // 削除エラーが404以外の場合のみエラーとして処理
    if (deleteError && deleteError.code !== "PGRST116") {
      throw new Error(deleteError.message);
    }

    // 削除が成功した場合（同じボタンを2回押した = 取り消し）
    if (deletedData && deletedData.length > 0) {
      result = { action: "deleted", data: deletedData };
      return result;
    }

    // 削除されなかった場合、他の投票があるかチェック
    const { data: existingVote } = await supabase
      .from("comment_votes")
      .select("*")
      .eq("comment_id", commentId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingVote) {
      // 異なる投票があった場合は更新
      const { data, error } = await supabase
        .from("comment_votes")
        .update({ vote: voteValue })
        .eq("id", existingVote.id)
        .select();
      if (error) throw new Error(error.message);
      result = { action: "updated", data };
    } else {
      // 投票がない場合は新規作成
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
        <button
          type="button"
          disabled={isVoting || !user}
          onClick={() => mutate(1)}
          className={`cursor-pointer px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 relative
              ${isVoting ? "opacity-50" : ""}
              ${!user ? "cursor-not-allowed opacity-50" : ""}
              ${
                userVote === 1
                  ? "bg-red-500 text-white shadow-lg scale-105"
                  : "bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white"
              }`}
          title={!user ? "ログインが必要です" : "共感を示す"}
        >
          <Heart size={16} className={userVote === 1 ? "fill-current" : ""} />
          <span className="font-medium">{upVotes}</span>
        </button>

        <button
          type="button"
          disabled={isVoting || !user}
          onClick={() => mutate(-1)}
          className={`cursor-pointer px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2
              ${isVoting ? "opacity-50" : ""}
              ${!user ? "cursor-not-allowed opacity-50" : ""}
              ${
                userVote === -1
                  ? "bg-gray-600 text-white shadow-lg scale-105"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
              }`}
          title={!user ? "ログインが必要です" : "反対意見を示す"}
        >
          <Skull size={16} className={userVote === -1 ? "fill-current" : ""} />
          <span className="font-medium">{downVotes}</span>
        </button>

        {/* 共感ポイント表示 - コメント主のみに表示 */}
        {totalReactions > 0 && authorId === user?.id && (
          <div className="px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
            +{empathyPoints}pt
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentVotes;
