import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AIAnalysisResult } from "../types/ai";

// モックAI分析結果
const generateMockAnalysis = (postId: number): AIAnalysisResult => ({
  id: Math.floor(Math.random() * 1000),
  post_id: postId,
  trend_analysis:
    "投票は序盤に賛成票が集中し、中盤で反対票が増加、説得タイム中に若干の変動が見られました。全体的に安定した投票パターンを示しています。",
  sentiment_analysis:
    "コメントは建設的で理性的な議論が中心となっており、感情的な発言は少なく、相互尊重に基づいた対話が展開されています。",
  discussion_quality:
    "多様な観点からの意見が提示され、根拠に基づいた議論が行われています。参加者間の活発な意見交換により、質の高い議論空間が形成されています。",
  persuasion_effectiveness:
    "説得タイム中に適度な投票変更が観察され、投稿者の追加説明が一定の説得効果を発揮しています。バランスの取れた説得力を示しています。",
  overall_assessment:
    "高い参加度と建設的な議論により、信頼性の高い投票結果が得られています。コミュニティの成熟度と議論の質の両面で優秀な評価となります。",
  confidence_score: Math.floor(Math.random() * 3) + 7, // 7-9のランダム
  analyzed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
});

// モックAI分析実行フック
export const useGenerateAIAnalysisMock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number): Promise<AIAnalysisResult> => {
      console.log("モックAI分析開始:", { postId });

      // 2-4秒のランダムな待機時間でリアルな感じを演出
      const delay = Math.random() * 2000 + 2000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      const mockResult = generateMockAnalysis(postId);
      console.log("モックAI分析完了:", mockResult);

      return mockResult;
    },
    onSuccess: (data, postId) => {
      console.log("モック分析結果をキャッシュに保存:", { postId, data });

      // 成功時にキャッシュを更新（永続化）
      queryClient.setQueryData(["ai-analysis", postId], data);

      // LocalStorageにも保存して永続化
      try {
        localStorage.setItem(`ai-analysis-${postId}`, JSON.stringify(data));
      } catch (error) {
        console.error("LocalStorage保存エラー:", error);
      }

      // クエリを無効化して再フェッチを促す
      queryClient.invalidateQueries({ queryKey: ["ai-analysis", postId] });
    },
  });
};
