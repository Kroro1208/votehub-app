import { Calendar, Clock, MessageCircle } from "lucide-react";
import {
  getTimeRemainingObject,
  isVotingExpired,
} from "../../utils/formatTime";
import { PostType } from "./PostList";
import { Button } from "../ui/button";

type VoteDeadlineProps = {
  data: PostType;
  showPersuasionButton: boolean;
  handlePersuasionModal: () => void;
};

const VoteDeadline = ({
  data,
  showPersuasionButton,
  handlePersuasionModal,
}: VoteDeadlineProps) => {
  const timeRemaining = getTimeRemainingObject(data.vote_deadline);
  const votingExpired = isVotingExpired(data.vote_deadline);
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
          <div className="flex items-center justify-between">
            {/* 左側：時計アイコンとタイトル */}
            <div className="flex items-center gap-4">
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
                    {new Date(data.vote_deadline).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* 右側：カウントダウン */}
            {!votingExpired && timeRemaining && !timeRemaining.expired && (
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div
                    className={`text-3xl font-bold ${showPersuasionButton ? "text-orange-600" : "text-blue-600"} bg-white rounded-lg px-3 py-2 shadow-sm min-w-[60px]`}
                  >
                    {timeRemaining.days || 0}
                  </div>
                  <div className="text-xs font-medium text-gray-600 mt-1">
                    日
                  </div>
                </div>
                <div
                  className={`text-2xl font-bold ${showPersuasionButton ? "text-orange-600" : "text-blue-600"}`}
                >
                  :
                </div>
                <div className="text-center">
                  <div
                    className={`text-3xl font-bold ${showPersuasionButton ? "text-orange-600" : "text-blue-600"} bg-white rounded-lg px-3 py-2 shadow-sm min-w-[60px]`}
                  >
                    {timeRemaining.hours}
                  </div>
                  <div className="text-xs font-medium text-gray-600 mt-1">
                    時間
                  </div>
                </div>
                <div
                  className={`text-2xl font-bold ${showPersuasionButton ? "text-orange-600" : "text-blue-600"}`}
                >
                  :
                </div>
                <div className="text-center">
                  <div
                    className={`text-3xl font-bold ${showPersuasionButton ? "text-orange-600" : "text-blue-600"} bg-white rounded-lg px-3 py-2 shadow-sm min-w-[60px]`}
                  >
                    {timeRemaining.minutes}
                  </div>
                  <div className="text-xs font-medium text-gray-600 mt-1">
                    分
                  </div>
                </div>
              </div>
            )}

            {/* 期限切れの場合 */}
            {votingExpired && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 bg-white rounded-lg px-5 py-2 shadow-sm">
                  期限終了
                </div>
                <div className="text-xs font-medium text-gray-600 mt-1">
                  投票を締め切りました
                </div>
              </div>
            )}
          </div>

          {/* 説得コメントボタン */}
          {showPersuasionButton && (
            <div className="mt-4 pt-4 border-t border-orange-300">
              <Button
                onClick={handlePersuasionModal}
                className="flex items-center gap-3 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
              >
                <MessageCircle size={20} />
                <span>説得コメントを投稿</span>
              </Button>
              <p className="text-sm text-orange-700 mt-2">
                投票期限まで残り1時間を切りました。投票者への最後のメッセージを送信できます。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoteDeadline;
