import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TbArrowBigUpLine } from "react-icons/tb";
import { TbArrowBigDownLine } from "react-icons/tb";
import { supabase } from "../supabase-client";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";

interface PostProps {
  postId: number;
}
interface Vote {
  id: number;
  post_id: number;
  user_id: string;
  vote: number;
}

interface VoteResult {
  action: "deleted" | "updated" | "inserted";
  data: Vote | Vote[] | null;
}

// useQuery用
const getVotes = async (postId: number): Promise<Vote[]> => {
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("post_id", postId);

  if (error) throw new Error(error.message);
  return data as Vote[];
};

const VoteButton = ({ postId }: PostProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isVoting, setIsVoting] = useState(false);

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

  // vote関数を最適化: 処理結果を返す(useMutation用)
  const vote = async (voteValue: number, postId: number, userId: string) => {
    const { data: existingVote } = await supabase
      .from("votes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    // 処理結果を保持する変数
    let result: VoteResult;

    // すでに投票していた場合
    if (existingVote) {
      // 同じ投票(upかdownか)については取り消し
      if (existingVote.vote === voteValue) {
        const { data, error } = await supabase
          .from("votes")
          .delete()
          .eq("id", existingVote.id)
          .select();

        if (error) throw new Error(error.message);
        result = { action: "deleted", data };
      } else {
        // 異なる投票(upかdownか)については更新
        const { data, error } = await supabase
          .from("votes")
          .update({ vote: voteValue })
          .eq("id", existingVote.id)
          .select();
        if (error) throw new Error(error.message);
        result = { action: "updated", data };
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
    // 楽観的更新（APIを待たずにUIを先に更新）
    onMutate: async (voteValue) => {
      if (!user) return;

      // 現在のクエリデータをキャンセル
      await queryClient.cancelQueries({ queryKey: ["votes", postId] });

      // 以前のデータをスナップショットに保持
      const previousVotes = queryClient.getQueryData<Vote[]>(["votes", postId]);
      if (!previousVotes) return { previousVotes: undefined };

      // 新しい投票データを作成
      const newVotes = [...previousVotes];
      const userVoteIndex = previousVotes.findIndex(
        (v) => v.user_id === user.id
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
      // ["votes", postId]というキーに対応するキャッシュにnewVotesという値がセットして内部で更新
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
    onSettled: () => {
      // 処理完了後にデータを再検証（必要な場合のみ）
      queryClient.invalidateQueries({ queryKey: ["votes", postId] });
    },
  });

  const upVotes = votes?.filter((item) => item.vote === 1).length || 0;
  const downVotes = votes?.filter((item) => item.vote === -1).length || 0;
  const totalVotes = upVotes + downVotes;
  const userVote = votes?.find((item) => item.user_id === user?.id)?.vote;

  // 投票の割合を計算（0票の場合は0%として表示）
  const upVotePercentage = totalVotes > 0 ? (upVotes / totalVotes) * 100 : 0;
  const downVotePercentage =
    totalVotes > 0 ? (downVotes / totalVotes) * 100 : 0;

  if (isPending) return <div>読み込み中...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div>
      <div className="flex items-center space-x-4 my-4">
        {/* 賛成 */}
        <button
          type="button"
          onClick={() => mutate(1)}
          disabled={isVoting}
          className={`cursor-pointer px-3 py-1 rounded transition-colors duration-150
            ${isVoting ? "opacity-50" : ""}
            ${userVote === 1 ? "bg-green-500 text-white" : "bg-gray-200 text-black"}`}
        >
          賛成
          <TbArrowBigUpLine size={30} />
          {upVotes}
        </button>
        {/* 反対 */}
        <button
          type="button"
          onClick={() => mutate(-1)}
          disabled={isVoting}
          className={`cursor-pointer px-3 py-1 rounded transition-colors duration-150
            ${isVoting ? "opacity-50" : ""}
            ${userVote === -1 ? "bg-red-500 text-white" : "bg-gray-200 text-black"}`}
        >
          反対
          <TbArrowBigDownLine size={30} />
          {downVotes}
        </button>
      </div>

      {/* 賛成反対の集計を反映させた棒グラフを表示 */}
      <div className="mt-4">
        <div className="text-sm mb-3">
          投票結果: {totalVotes}票 (賛成: {upVotes}票 / 反対: {downVotes}票)
        </div>

        {/* グラフコンテナ */}
        <div className="w-full h-8 bg-gray-200 rounded-md overflow-hidden flex">
          {/* 賛成バー */}
          <div
            className="h-full bg-green-500 flex items-center justify-center text-white text-xs font-bold"
            style={{ width: `${upVotePercentage}%` }}
          >
            {upVotePercentage > 10 ? `${Math.round(upVotePercentage)}%` : ""}
          </div>

          {/* 反対バー */}
          <div
            className="h-full bg-red-500 flex items-center justify-center text-white text-xs font-bold"
            style={{ width: `${downVotePercentage}%` }}
          >
            {downVotePercentage > 10
              ? `${Math.round(downVotePercentage)}%`
              : ""}
          </div>
        </div>

        {/* パーセント表示 */}
        <div className="flex justify-between text-sm text-gray-600 mt-3">
          <div>賛成: {Math.round(upVotePercentage)}%</div>
          <div>反対: {Math.round(downVotePercentage)}%</div>
        </div>
      </div>
    </div>
  );
};

export default VoteButton;
