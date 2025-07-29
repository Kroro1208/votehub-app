"use client";
import { TbArrowBigUpLine } from "react-icons/tb";
import { TbArrowBigDownLine } from "react-icons/tb";

import { CheckCircle, LogIn } from "lucide-react";

import { useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { useHandleVotes } from "../../hooks/useHandleVotes";
import { Button } from "../ui/button";
import VoteConfirmModal from "./VoteConfirmModal";
import VoteGageBar from "./VoteGageBar";

interface PostProps {
  postId: number;
  voteDeadline?: string | null | undefined;
  postTitle?: string | undefined;
  targetVoteChoice?: number | null | undefined;
  userVoteOnParent?: number | null | undefined;
}

const VoteButton = ({
  postId,
  voteDeadline,
  postTitle,
  targetVoteChoice,
  userVoteOnParent,
}: PostProps) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingVote, setPendingVote] = useState<number | null>(null);
  const { user, signInWithGoogle } = useAuth();
  const { t } = useLanguage();

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
  } = useHandleVotes(
    postId,
    voteDeadline,
    postTitle,
    targetVoteChoice,
    userVoteOnParent,
  );

  const isVotingExpired = () => {
    if (!voteDeadline) return false;
    return new Date() > new Date(voteDeadline);
  };

  const votingExpired = isVotingExpired();

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

  const hasVotingPermission = canVoteOnDerivedQuestion();

  // ログインハンドラー
  const handleLogin = () => {
    try {
      signInWithGoogle();
    } catch {
      toast.error(t("common.login.failed"));
    }
  };

  // 投票ハンドラー
  const handleVoteClick = (voteValue: number) => {
    // ユーザーがログインしていない場合
    if (!user) {
      toast.error(t("vote.button.login.required"));
      return;
    }

    // 派生質問の投票権限チェック
    if (!hasVotingPermission) {
      const targetText =
        targetVoteChoice === 1
          ? t("vote.button.agree")
          : t("vote.button.disagree");
      toast.error(
        t("vote.button.derived.permission").replace("{targetText}", targetText),
      );
      return;
    }

    // 説得タイム中で既存投票がある場合は確認モーダルを表示
    if (persuasionTime && hasUserVoted && !hasPersuasionVoteChanged) {
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
  if (isPending) return <div>{t("common.loading")}</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className="flex flex-col gap-3">
      {/* ログインしていない場合のログインボタン表示 */}
      {!user && !votingExpired && (
        <div className="w-full text-center py-6 px-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 mb-3 font-medium">
            {t("vote.button.login.required")}
          </p>
          <Button
            onClick={handleLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
          >
            <LogIn size={18} />
            <span>{t("common.login")}</span>
          </Button>
        </div>
      )}

      {/* 派生質問の投票権限がない場合の表示 */}
      {user &&
        !votingExpired &&
        !hasVotingPermission &&
        targetVoteChoice !== null && (
          <div className="w-full text-center py-6 px-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 mb-2 font-medium">
              {t("vote.button.derived.permission").replace(
                "{targetText}",
                targetVoteChoice === 1
                  ? t("vote.button.agree")
                  : t("vote.button.disagree"),
              )}
            </p>
            <p className="text-yellow-600 text-sm">
              元の投稿に
              {targetVoteChoice === 1
                ? t("vote.button.agree")
                : t("vote.button.disagree")}
              投票すると投票権限が得られます
            </p>
          </div>
        )}

      <div className="flex items-center gap-3">
        {/* 投票期限内かつログイン済みかつ投票権限ありの場合の投票ボタン */}
        {!votingExpired && user && hasVotingPermission && (
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
              <span className="relative z-10">{t("vote.button.agree")}</span>
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
              <span className="relative z-10">{t("vote.button.disagree")}</span>
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
            <span>
              {userVote === 1
                ? t("vote.button.voted.agree")
                : t("vote.button.voted.disagree")}
            </span>
          </div>
        )}
        {/* 説得タイム中の通知 */}
        {persuasionTime && !votingExpired && (
          <div className="w-full text-center py-3 px-4 bg-orange-100 text-orange-700 rounded-lg border border-orange-200">
            <span className="font-semibold">
              {hasPersuasionVoteChanged
                ? t("vote.button.persuasion.completed")
                : t("vote.button.persuasion.time")}
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
          {t("vote.button.deadline")}:{" "}
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
        voteType={
          (pendingVote === 1
            ? t("vote.button.agree")
            : t("vote.button.disagree")) as "賛成" | "反対"
        }
        currentVote={
          (userVote === 1
            ? t("vote.button.agree")
            : t("vote.button.disagree")) as "賛成" | "反対"
        }
      />
    </div>
  );
};

export default VoteButton;
