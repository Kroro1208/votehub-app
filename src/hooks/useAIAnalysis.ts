import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import type { AIAnalysisResult } from "../types/ai";

// AI分析結果を取得するフック
export const useAIAnalysis = (postId: number) => {
  return useQuery({
    queryKey: ["ai-analysis", postId],
    queryFn: async (): Promise<AIAnalysisResult | null> => {
      console.log("AI分析結果を取得中:", { postId });

      // まずLocalStorageから確認（モック結果の場合）
      try {
        const localData = localStorage.getItem(`ai-analysis-${postId}`);
        if (localData) {
          const parsed = JSON.parse(localData);
          console.log("LocalStorageから分析結果を取得:", parsed);
          return parsed;
        }
      } catch (error) {
        console.error("LocalStorage読み込みエラー:", error);
      }

      // データベースから取得
      const { data, error } = await supabase
        .from("ai_vote_analysis")
        .select("*")
        .eq("post_id", postId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // レコードが見つからない場合はnullを返す
          console.log("データベースに分析結果なし:", { postId });
          return null;
        }
        throw new Error(`AI分析結果の取得に失敗しました: ${error.message}`);
      }

      console.log("データベースから分析結果を取得:", data);
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1時間キャッシュ（長期保持）
    gcTime: 1000 * 60 * 60 * 24, // 24時間ガベージコレクション防止
  });
};

// AI分析を実行するフック
export const useGenerateAIAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number): Promise<AIAnalysisResult> => {
      console.log("AI分析開始:", { postId });

      try {
        // Supabase Edge Functionを呼び出し
        const { data, error } = await supabase.functions.invoke(
          "gemini-vote-analysis",
          {
            body: { postId },
          },
        );

        console.log("Edge Function レスポンス:", { data, error });

        if (error) {
          console.error("Edge Function エラー:", error);
          throw new Error(`AI分析の実行に失敗しました: ${error.message}`);
        }

        if (!data?.success) {
          console.error("AI分析処理エラー:", data);
          throw new Error(data?.error || "AI分析処理中にエラーが発生しました");
        }

        console.log("AI分析完了:", data.analysis);
        return data.analysis;
      } catch (err) {
        console.error("AI分析実行エラー:", err);
        throw err;
      }
    },
    onSuccess: (data, postId) => {
      console.log("AI分析結果をキャッシュに保存:", { postId, data });

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

// AI分析が利用可能かチェックするフック
export const useCanGenerateAIAnalysis = (postId: number) => {
  return useQuery({
    queryKey: ["can-generate-ai-analysis", postId],
    queryFn: async (): Promise<boolean> => {
      // 投稿の投票期限が終了しているかチェック
      const { data: post, error } = await supabase
        .from("posts")
        .select("vote_deadline")
        .eq("id", postId)
        .single();

      if (error) {
        return false;
      }

      if (!post.vote_deadline) {
        return false;
      }

      const deadline = new Date(post.vote_deadline);
      const now = new Date();

      // 投票期限が終了している場合のみAI分析可能
      return now > deadline;
    },
    staleTime: 1000 * 60 * 5, // 5分間キャッシュ
  });
};
