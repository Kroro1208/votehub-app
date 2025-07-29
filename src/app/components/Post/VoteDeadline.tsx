"use client";
import { Calendar, Clock, Megaphone, MessageCircle } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Button } from "../ui/button";
import { PostType } from "./PostList";
import { supabase } from "@/supabase-client";
import { getTimeRemainingObject, isVotingExpired } from "@/utils/formatTime";

interface Comment {
  id: number;
  post_id: number;
  content: string;
  user_id: string;
  created_at: string;
  author: string;
  is_persuasion_comment?: boolean;
}

type VoteDeadlineProps = {
  data: PostType;
  showPersuasionButton: boolean;
  handlePersuasionModal: () => void;
  postId: number;
};

const VoteDeadline = ({
  data,
  showPersuasionButton,
  handlePersuasionModal,
  postId,
}: VoteDeadlineProps) => {
  const [timeRemaining, setTimeRemaining] = useState(
    getTimeRemainingObject(data.vote_deadline),
  );
  const [votingExpired, setVotingExpired] = useState(
    isVotingExpired(data.vote_deadline),
  );

  // 説得コメントを取得
  const { data: persuasionComments } = useQuery<Comment[]>({
    queryKey: ["persuasionComments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .eq("is_persuasion_comment", true)
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);
      return data as Comment[];
    },
  });

  // 動的インターバル：残り時間に応じて更新頻度を調整
  useEffect(() => {
    if (!data.vote_deadline || votingExpired) return;

    const updateTime = () => {
      const newTimeRemaining = getTimeRemainingObject(data.vote_deadline);
      const newVotingExpired = isVotingExpired(data.vote_deadline);

      setTimeRemaining(newTimeRemaining);
      setVotingExpired(newVotingExpired);

      return { newTimeRemaining, newVotingExpired };
    };

    // 初回更新
    const { newVotingExpired } = updateTime();

    if (newVotingExpired) return;

    let intervalId: NodeJS.Timeout;

    const scheduleNextUpdate = () => {
      const current = getTimeRemainingObject(data.vote_deadline);

      // null チェック
      if (!current) return;

      // 動的インターバル設定
      let updateInterval: number;

      if (current.days > 0) {
        // 1日以上：10分間隔
        updateInterval = 10 * 60 * 1000;
      } else if (current.hours > 1) {
        // 1時間以上：5分間隔
        updateInterval = 5 * 60 * 1000;
      } else if (current.minutes > 10) {
        // 10分以上：1分間隔
        updateInterval = 60 * 1000;
      } else if (current.minutes > 1) {
        // 1分以上：30秒間隔
        updateInterval = 30 * 1000;
      } else {
        // 1分未満：1秒間隔（最も重要な時間帯のみ）
        updateInterval = 1000;
      }

      intervalId = setTimeout(() => {
        const { newVotingExpired } = updateTime();

        if (!newVotingExpired) {
          scheduleNextUpdate(); // 再帰的にスケジュール
        }
      }, updateInterval);
    };

    scheduleNextUpdate();

    return () => {
      if (intervalId) {
        clearTimeout(intervalId);
      }
    };
  }, [data.vote_deadline, votingExpired]);
  return (
    <div>
      {data.vote_deadline && (
        <div
          className={`relative p-6 rounded-xl shadow-lg ${
            votingExpired
              ? "bg-gradient-to-r from-red-100 to-red-200 border-l-4 border-red-500"
              : showPersuasionButton
                ? "bg-gradient-to-r from-orange-100 to-orange-200 border-l-4 border-orange-500"
                : "bg-gradient-to-r from-blue-100 to-blue-200 border-l-4 border-blue-500"
          }`}
        >
          <div className="flex justify-between items-start">
            {/* 左側：投票状態と説得ボタン */}
            <div className="w-64">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`p-3 rounded-full shadow-md ${
                    votingExpired
                      ? "bg-red-500"
                      : showPersuasionButton
                        ? "bg-orange-500"
                        : "bg-blue-500"
                  }`}
                >
                  <Clock size={28} className="text-white" />
                </div>
                <div>
                  <h3
                    className={`text-xl font-bold ${
                      votingExpired
                        ? "text-red-800"
                        : showPersuasionButton
                          ? "text-orange-800"
                          : "text-blue-800"
                    }`}
                  >
                    {votingExpired
                      ? "投票終了"
                      : showPersuasionButton
                        ? "説得タイム!"
                        : "投票受付中"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar size={16} className="text-gray-600" />
                    <span className="text-sm text-gray-600">
                      {new Date(data.vote_deadline).toLocaleDateString(
                        "ja-JP",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* 説得コメントボタン（小さく） */}
              {showPersuasionButton && (
                <div className="mt-4">
                  <Button
                    onClick={handlePersuasionModal}
                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded shadow transition-all duration-200"
                  >
                    <MessageCircle size={14} />
                    <span>説得メッセージを投稿する</span>
                  </Button>
                </div>
              )}
            </div>

            {/* 中央：説得コメント表示（幅広く） */}
            <div className="flex-1 mx-8">
              {persuasionComments && persuasionComments.length > 0 ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Megaphone className="text-orange-600" size={20} />
                    <h4 className="text-lg font-bold text-orange-800">
                      投稿者からの説得メッセージ
                    </h4>
                  </div>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {persuasionComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="border-l-4 border-orange-500 pl-4 py-2"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-orange-600">
                            {new Date(comment.created_at).toLocaleDateString(
                              "ja-JP",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                        <p className="text-gray-800 text-2xl leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 text-gray-400">
                  <div className="text-center">
                    <Megaphone className="mx-auto mb-2 opacity-50" size={24} />
                    <p className="text-sm">
                      投稿者の説得メッセージがあれば、ここに表示されます
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 右端：カウントダウン */}
            {!votingExpired && timeRemaining && !timeRemaining.expired && (
              <div className="flex items-center gap-2">
                <div
                  className={`text-sm font-medium ${showPersuasionButton ? "text-orange-700" : "text-blue-700"}`}
                >
                  🕐 残り時間:
                </div>

                {/* 1分以上残っている場合の通常表示 */}
                {(timeRemaining.days > 0 ||
                  timeRemaining.hours > 0 ||
                  timeRemaining.minutes > 0) && (
                  <>
                    {timeRemaining.days > 0 && (
                      <>
                        <div className="flex items-center gap-1">
                          <div
                            className={`text-xl font-bold ${showPersuasionButton ? "text-orange-600" : "text-blue-600"} bg-white rounded px-3 py-1 shadow-sm border ${showPersuasionButton ? "border-orange-200" : "border-blue-200"} min-w-[40px] text-center`}
                          >
                            {timeRemaining.days}
                          </div>
                          <div className="text-sm text-gray-600">日</div>
                        </div>
                        <div
                          className={`text-xl font-bold ${showPersuasionButton ? "text-orange-600" : "text-blue-600"}`}
                        >
                          :
                        </div>
                      </>
                    )}
                    {(timeRemaining.days > 0 || timeRemaining.hours > 0) && (
                      <>
                        <div className="flex items-center gap-1">
                          <div
                            className={`text-xl font-bold ${showPersuasionButton ? "text-orange-600" : "text-blue-600"} bg-white rounded px-3 py-1 shadow-sm border ${showPersuasionButton ? "border-orange-200" : "border-blue-200"} min-w-[40px] text-center`}
                          >
                            {timeRemaining.hours}
                          </div>
                          <div className="text-sm text-gray-600">時間</div>
                        </div>
                        <div
                          className={`text-xl font-bold ${showPersuasionButton ? "text-orange-600" : "text-blue-600"}`}
                        >
                          :
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-1">
                      <div
                        className={`text-xl font-bold ${showPersuasionButton ? "text-orange-600" : "text-blue-600"} bg-white rounded px-3 py-1 shadow-sm border ${showPersuasionButton ? "border-orange-200" : "border-blue-200"} min-w-[40px] text-center`}
                      >
                        {timeRemaining.minutes}
                      </div>
                      <div className="text-sm text-gray-600">分</div>
                    </div>
                  </>
                )}

                {/* 1分を切った場合の特別表示 */}
                {timeRemaining.days === 0 &&
                  timeRemaining.hours === 0 &&
                  timeRemaining.minutes === 0 && (
                    <>
                      <div className="flex items-center gap-1">
                        <div className="text-xl font-bold text-red-600 bg-white rounded px-3 py-1 shadow-sm border-2 border-red-200 animate-pulse min-w-[40px] text-center">
                          {timeRemaining.seconds}
                        </div>
                        <div className="text-sm text-red-500">秒</div>
                      </div>
                      <div className="text-red-600">⚠️</div>
                    </>
                  )}
              </div>
            )}

            {/* 期限切れの場合 */}
            {votingExpired && (
              <div className="flex flex-col items-end">
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-600 bg-white rounded-lg px-5 py-2 shadow-sm">
                    期限終了
                  </div>
                  <div className="text-xs font-medium text-gray-600 mt-1">
                    投票を締め切りました
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoteDeadline;
