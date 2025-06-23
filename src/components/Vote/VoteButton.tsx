import { TbArrowBigUpLine } from "react-icons/tb";
import { TbArrowBigDownLine } from "react-icons/tb";

import { CheckCircle } from "lucide-react";
import { Button } from "../ui/button";
import { useHandleVotes } from "../../hooks/useHandleVotes";
import VoteGageBar from "./VoteGageBar";
import VoteConfirmModal from "./VoteConfirmModal";
import { useState } from "react";
import { toast } from "react-toastify";

interface PostProps {
  postId: number;
  voteDeadline?: string | null;
}

const VoteButton = ({ postId, voteDeadline }: PostProps) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingVote, setPendingVote] = useState<number | null>(null);

  const {
    mutate,
    hasUserVoted,
    upVotePercentage,
    downVotePercentage,
    userVote,
    upVotes,
    downVotes,
    totalVotes,
    isPending,
    error,
    hasPersuasionVoteChanged,
    persuasionTime,
    isVotingDisabled,
  } = useHandleVotes(postId, voteDeadline);

  const isVotingExpired = () => {
    if (!voteDeadline) return false;
    return new Date() > new Date(voteDeadline);
  };

  const votingExpired = isVotingExpired();

  // 投票ハンドラー
  const handleVoteClick = (voteValue: number) => {
    // 説得タイム中で既存投票と異なる場合は確認モーダルを表示
    if (
      persuasionTime &&
      hasUserVoted &&
      userVote !== voteValue &&
      !hasPersuasionVoteChanged
    ) {
      setPendingVote(voteValue);
      setShowConfirmModal(true);
      return;
    }

    // 通常の投票処理
    mutate(voteValue, {
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  // 確認モーダルでの投票実行
  const handleConfirmVote = () => {
    if (pendingVote !== null) {
      mutate(pendingVote, {
        onError: (error) => {
          toast.error(error.message);
        },
      });
    }
    setShowConfirmModal(false);
    setPendingVote(null);
  };

  // モーダルをキャンセル
  const handleCancelVote = () => {
    setShowConfirmModal(false);
    setPendingVote(null);
  };
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
              onClick={() => handleVoteClick(1)}
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
              onClick={() => handleVoteClick(-1)}
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
              {hasPersuasionVoteChanged
                ? "説得タイム中の投票変更完了"
                : "説得タイム中！投票を変更できます（1度限り）"}
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

      {/* 投票確認モーダル */}
      <VoteConfirmModal
        isOpen={showConfirmModal}
        onClose={handleCancelVote}
        onConfirm={handleConfirmVote}
        voteType={pendingVote === 1 ? "賛成" : "反対"}
        currentVote={userVote === 1 ? "賛成" : "反対"}
      />
    </div>
  );
};

export default VoteButton;
