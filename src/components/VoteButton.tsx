import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TbArrowBigUpLine } from "react-icons/tb";
import { TbArrowBigDownLine } from "react-icons/tb";
import { supabase } from "../supabase-client";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import VoteGageBar from "./VoteGageBar";
import { CheckCircle } from "lucide-react";
import { Button } from "./ui/button";

interface PostProps {
  postId: number;
  voteDeadline?: string | null;
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

const VoteButton = ({ postId, voteDeadline }: PostProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isVoting, setIsVoting] = useState(false);

  const isVotingExpired = () => {
    if (!voteDeadline) return false;
    return new Date() > new Date(voteDeadline);
  };

  // 説得タイム（期限の1時間前）かどうかをチェック
  const isPersuasionTime = () => {
    if (!voteDeadline) return false;
    const deadline = new Date(voteDeadline);
    const now = new Date();
    const oneHourBeforeDeadline = new Date(deadline.getTime() - 60 * 60 * 1000);
    return now >= oneHourBeforeDeadline && now < deadline;
  };

  const votingExpired = isVotingExpired();
  const persuasionTime = isPersuasionTime();

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

  // 投票済みかどうか
  const hasUserVoted = userVote !== undefined;

  // 投票ボタンを無効にする条件を更新
  // 説得タイム中は投票済みでもボタンを有効にする
  const isVotingDisabled = isVoting || (hasUserVoted && !persuasionTime);

  // 投票の割合を計算（0票の場合は0%として表示）
  const upVotePercentage = totalVotes > 0 ? (upVotes / totalVotes) * 100 : 0;
  const downVotePercentage =
    totalVotes > 0 ? (downVotes / totalVotes) * 100 : 0;

  if (isPending) return <div>読み込み中...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className="flex flex-col gap-3">
      {/* 投票期限が過ぎている場合の表示 */}
      {votingExpired && (
        <div className="w-full text-center py-3 px-4 bg-gray-300 text-gray-600 rounded-lg">
          <span className="font-semibold">投票期限が終了しました</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* 投票期限内の場合の投票ボタン */}
        {!votingExpired && (
          <>
            {/* 賛成ボタン */}
            <Button
              type="button"
              onClick={() => mutate(1)}
              disabled={isVotingDisabled}
              className={`group relative flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 min-w-[140px] h-14 overflow-hidden ${
                userVote === 1
                  ? persuasionTime
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-green-500/25 scale-105 ring-2 ring-orange-300"
                    : "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-green-500/25 scale-105"
                  : "bg-gradient-to-r from-emerald-400 to-green-400 text-white hover:from-emerald-500 hover:to-green-500 hover:shadow-lg hover:shadow-green-500/25 hover:scale-105 active:scale-95"
              } ${
                isVotingDisabled
                  ? "opacity-50 cursor-not-allowed hover:scale-100"
                  : "shadow-md"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <TbArrowBigUpLine size={26} className="relative z-10" />
              <span className="relative z-10">賛成</span>
              <span className="relative z-10 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold">
                {upVotes}
              </span>
            </Button>

            {/* 反対ボタン */}
            <Button
              type="button"
              onClick={() => mutate(-1)}
              disabled={isVotingDisabled}
              className={`group relative flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 min-w-[140px] h-14 overflow-hidden ${
                userVote === -1
                  ? persuasionTime
                    ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25 scale-105 ring-2 ring-orange-300"
                    : "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25 scale-105"
                  : "bg-gradient-to-r from-red-400 to-rose-400 text-white hover:from-red-500 hover:to-rose-500 hover:shadow-lg hover:shadow-red-500/25 hover:scale-105 active:scale-95"
              } ${
                isVotingDisabled
                  ? "opacity-50 cursor-not-allowed hover:scale-100"
                  : "shadow-md"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <TbArrowBigDownLine size={26} className="relative z-10" />
              <span className="relative z-10">反対</span>
              <span className="relative z-10 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold">
                {downVotes}
              </span>
            </Button>
          </>
        )}

        {/* 投票済みバッジ */}
        {hasUserVoted && !persuasionTime && (
          <div className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-100 text-blue-700 rounded-lg border border-blue-200 font-medium h-12 min-w-[200px]">
            <CheckCircle size={20} />
            <span>投票済み（{userVote === 1 ? "賛成" : "反対"}）</span>
          </div>
        )}
        {/* 説得タイム中の通知 */}
        {persuasionTime && !votingExpired && (
          <div className="w-full text-center py-3 px-4 bg-orange-100 text-orange-700 rounded-lg border border-orange-200">
            <span className="font-semibold">
              説得タイム中！投票を変更できます
            </span>
          </div>
        )}
      </div>

      {/* 賛成反対の集計を反映させた棒グラフを表示（常に表示） */}
      <VoteGageBar
        totalVotes={totalVotes}
        upVotes={upVotes}
        downVotes={downVotes}
        upVotePercentage={upVotePercentage}
        downVotePercentage={downVotePercentage}
      />

      {/* 投票期限の表示 */}
      {voteDeadline && (
        <div className="text-sm text-gray-500 mt-2 text-center">
          投票期限:{" "}
          {new Date(voteDeadline).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}
    </div>
  );
};

export default VoteButton;
