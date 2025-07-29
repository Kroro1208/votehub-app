import { BarChart3, CalendarX, Trophy, Users } from "lucide-react";

export const RightPanel = () => {
  return (
    <div className="w-80 flex-shrink-0">
      <div className="sticky top-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
          {/* ヘッダー */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <BarChart3 size={20} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">スコア計算式</h3>
          </div>

          {/* メイン計算式 */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">人気度スコア</div>
              <div className="text-lg font-bold text-blue-700">
                投票数 + コメント数 × 0.5
              </div>
            </div>
          </div>

          {/* 説明リスト */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-gray-50/80 rounded-xl">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users size={12} className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-sm">
                  投票数
                </div>
                <div className="text-xs text-gray-600">
                  賛成・反対の総投票数
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50/80 rounded-xl">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-sm">
                  コメント数 × 0.5
                </div>
                <div className="text-xs text-gray-600">議論の活発さを評価</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50/80 rounded-xl">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CalendarX size={12} className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-sm">
                  期限終了
                </div>
                <div className="text-xs text-gray-600">
                  新規度ボーナスは適用されません
                </div>
              </div>
            </div>
          </div>

          {/* 注意事項 */}
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={16} className="text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">
                ランキング基準
              </span>
            </div>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• 投票期限が終了した投稿のみ</li>
              <li>• 人気度スコア順で表示</li>
              <li>• 参加した投票には「参加済」表示</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
