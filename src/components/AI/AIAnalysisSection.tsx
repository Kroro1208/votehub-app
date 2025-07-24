import { Button } from "../ui/button";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import {
  useAIAnalysis,
  useGenerateAIAnalysis,
  useCanGenerateAIAnalysis,
} from "../../hooks/useAIAnalysis";
import {
  Brain,
  TrendingUp,
  Heart,
  MessageSquare,
  Target,
  Star,
} from "lucide-react";
import { toast } from "react-toastify";

interface AIAnalysisSectionProps {
  postId: number;
}

export const AIAnalysisSection = ({ postId }: AIAnalysisSectionProps) => {
  const { data: analysisData, isLoading: isLoadingAnalysis } =
    useAIAnalysis(postId);
  const { data: canGenerate, isLoading: isCheckingPermission } =
    useCanGenerateAIAnalysis(postId);

  const generateAnalysis = useGenerateAIAnalysis();

  const handleGenerateAnalysis = async () => {
    try {
      await generateAnalysis.mutateAsync(postId);
      toast.success("AI分析が完了しました！");
    } catch (error) {
      toast.error("AI分析の実行に失敗しました");
      console.error("AI分析エラー:", error);
    }
  };

  // 権限チェック中
  if (isCheckingPermission) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            AI投票分析
          </h3>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  // AI分析が利用できない場合
  if (!canGenerate) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">
            AI投票分析
          </h3>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          投票期限終了後にAI分析が利用可能になります
        </p>
      </div>
    );
  }

  // 分析結果が存在しない場合
  if (!analysisData && !isLoadingAnalysis) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            AI投票分析
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Gemini AIによる高度な投票パターン・議論分析を実行できます
        </p>
        <Button
          onClick={handleGenerateAnalysis}
          disabled={generateAnalysis.isPending}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        >
          {generateAnalysis.isPending ? (
            <>
              <LoadingSpinner size="sm" />
              分析中...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              AI分析を実行
            </>
          )}
        </Button>
      </div>
    );
  }

  // 分析結果表示
  if (analysisData) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              AI投票分析結果
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              信頼度: {analysisData.confidence_score}/10
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* トレンド分析 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                投票トレンド
              </h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {analysisData.trend_analysis}
            </p>
          </div>

          {/* 感情分析 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-red-600 dark:text-red-400" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                感情・論調
              </h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {analysisData.sentiment_analysis}
            </p>
          </div>

          {/* 議論品質 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                議論品質
              </h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {analysisData.discussion_quality}
            </p>
          </div>

          {/* 説得効果 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                説得効果
              </h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {analysisData.persuasion_effectiveness}
            </p>
          </div>
        </div>

        {/* 総合評価 */}
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            総合評価
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {analysisData.overall_assessment}
          </p>
        </div>

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          分析実行日時:{" "}
          {new Date(analysisData.analyzed_at).toLocaleString("ja-JP")}
        </div>
      </div>
    );
  }

  // ロード中
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
      <div className="flex items-center gap-3 mb-4">
        <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          AI投票分析
        </h3>
      </div>
      <LoadingSpinner />
    </div>
  );
};
