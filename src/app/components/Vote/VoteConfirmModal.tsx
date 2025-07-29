"use client";
import { AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";

interface VoteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  voteType: "賛成" | "反対";
  currentVote: "賛成" | "反対";
}

const VoteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  voteType,
  currentVote,
}: VoteConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* モーダルコンテンツ */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">最終投票確認</h2>
              <p className="text-sm opacity-90">これが最後の投票変更です</p>
            </div>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-4">
          <div className="text-center space-y-3">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-gray-700 font-medium">
                現在の投票:{" "}
                <span className="font-bold text-orange-700">{currentVote}</span>
              </p>
              <p className="text-gray-700 font-medium mt-1">
                {voteType === currentVote ? "確定投票" : "変更先"}:{" "}
                <span className="font-bold text-orange-700">{voteType}</span>
              </p>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-red-700 font-semibold text-sm mb-2">
                ⚠️ 重要な注意事項
              </p>
              <ul className="text-red-600 text-sm space-y-1 text-left">
                <li>• 説得タイム中の投票変更は1度限りです</li>
                <li>• この操作は取り消すことができません</li>
                <li>• 投票期限まで再度変更はできません</li>
              </ul>
            </div>

            <p className="text-gray-600 text-sm">
              {voteType === currentVote ? (
                <>
                  本当に<strong className="text-orange-600">{voteType}</strong>
                  で確定しますか？
                </>
              ) : (
                <>
                  本当に<strong className="text-orange-600">{voteType}</strong>
                  に変更しますか？
                </>
              )}
            </p>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 h-12 text-black font-medium border-gray-300 hover:bg-gray-100"
          >
            キャンセル
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-12 font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
          >
            {voteType === currentVote ? "投票を確定する" : "投票を変更する"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoteConfirmModal;
