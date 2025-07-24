// Setup type definitions for built-in Supabase Runtime APIs

// @ts-expect-error Deno Edge Function環境での型定義不備
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-expect-error Deno Edge Function環境での型定義不備
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.2.1";

// Deno グローバル宣言
declare const Deno: {
  serve: (handler: (request: Request) => Response | Promise<Response>) => void;
  env: {
    get(key: string): string | undefined;
  };
};

console.log("Gemini AI投票分析 Edge Function 開始");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface VoteAnalysisRequest {
  postId: number;
}

interface VoteData {
  vote: number;
  created_at: string;
}

interface CommentData {
  content: string;
  created_at: string;
  author: string;
  is_persuasion_comment: boolean;
  upvotes: number;
  downvotes: number;
  id: number;
}

interface CommentVoteData {
  comment_id: number;
  vote: number;
}

interface AnalysisResult {
  trendAnalysis: string;
  sentimentAnalysis: string;
  discussionQuality: string;
  persuasionEffectiveness: string;
  overallAssessment: string;
  confidenceScore: number;
}

Deno.serve(async (req: Request) => {
  console.log("リクエスト受信:", req.method);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("環境変数確認...");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("Supabase URL:", supabaseUrl ? "設定済み" : "未設定");
    console.log("Service Key:", supabaseServiceKey ? "設定済み" : "未設定");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase環境変数が設定されていません");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize Gemini AI
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    console.log("Gemini API Key:", geminiApiKey ? "設定済み" : "未設定");

    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY環境変数が設定されていません");
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    console.log("リクエストボディ解析...");
    const { postId }: VoteAnalysisRequest = await req.json();
    console.log("PostID:", postId);

    // 投票データを取得
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select("vote, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (votesError) {
      throw new Error(`投票データ取得エラー: ${votesError.message}`);
    }

    // コメントデータを取得（Upvote/Downvote数も含む）
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select(
        `
        content,
        created_at,
        author,
        is_persuasion_comment,
        id
      `,
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (commentsError) {
      throw new Error(`コメントデータ取得エラー: ${commentsError.message}`);
    }

    // コメント投票数を一括取得（高速化）
    const commentIds = comments.map((c: CommentData) => c.id);
    const { data: allCommentVotes } = await supabase
      .from("comment_votes")
      .select("comment_id, vote")
      .in("comment_id", commentIds);

    // コメントごとの投票数を計算
    const commentsWithVotes = comments.map((comment: CommentData) => {
      const commentVotes =
        allCommentVotes?.filter(
          (v: CommentVoteData) => v.comment_id === comment.id,
        ) || [];
      const upvotes = commentVotes.filter(
        (v: CommentVoteData) => v.vote === 1,
      ).length;
      const downvotes = commentVotes.filter(
        (v: CommentVoteData) => v.vote === -1,
      ).length;

      return {
        ...comment,
        upvotes,
        downvotes,
      };
    });

    // 投稿情報を取得
    const { data: post } = await supabase
      .from("posts")
      .select("title, content, vote_deadline, created_at")
      .eq("id", postId)
      .single();

    // 分析データを準備
    const analysisData = {
      post: {
        title: post?.title || "",
        content: post?.content || "",
        created_at: post?.created_at || "",
        vote_deadline: post?.vote_deadline || "",
      },
      votes: votes as VoteData[],
      comments: commentsWithVotes as CommentData[],
      totalVotes: votes?.length || 0,
      agreeVotes: votes?.filter((v: VoteData) => v.vote === 1).length || 0,
      disagreeVotes: votes?.filter((v: VoteData) => v.vote === -1).length || 0,
    };

    // Gemini AIに送信するプロンプトを作成
    const prompt = `
あなたは投票・議論プラットフォームの分析専門AIです。以下の投票データを分析し、日本語で詳細な分析結果を提供してください。

## 投稿情報
タイトル: ${analysisData.post.title}
内容: ${analysisData.post.content}
投票期間: ${analysisData.post.created_at} から ${analysisData.post.vote_deadline}

## 投票データ
総投票数: ${analysisData.totalVotes}
賛成票: ${analysisData.agreeVotes}
反対票: ${analysisData.disagreeVotes}

投票時系列データ:
${analysisData.votes.map((v: VoteData) => `${v.created_at}: ${v.vote === 1 ? "賛成" : "反対"}`).join("\n")}

## コメントデータ
${analysisData.comments
  .map(
    (c: CommentData) =>
      `作成者: ${c.author}, 時間: ${c.created_at}, 説得コメント: ${c.is_persuasion_comment ? "はい" : "いいえ"}, Upvotes: ${c.upvotes}, Downvotes: ${c.downvotes}
内容: ${c.content}
---`,
  )
  .join("\n")}

以下の観点で分析してください：

1. **投票トレンド分析**: 時間経過による投票傾向の変化パターン
2. **感情・論調分析**: コメントの感情傾向と議論の建設性
3. **議論品質評価**: 議論の深さ、多様性、建設性の評価
4. **説得効果分析**: 説得コメントの影響度と効果
5. **総合評価**: 投票の信頼性と議論の質の総合判定

各項目について2-3文で具体的に分析し、最後に1-10の信頼度スコアを付けてください。
結果はJSONフォーマットで以下の構造で返してください：

{
  "trendAnalysis": "投票トレンド分析結果",
  "sentimentAnalysis": "感情・論調分析結果", 
  "discussionQuality": "議論品質評価結果",
  "persuasionEffectiveness": "説得効果分析結果",
  "overallAssessment": "総合評価結果",
  "confidenceScore": 信頼度スコア(1-10)
}
`;

    // Gemini AIで分析実行
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    // JSONレスポンスを抽出
    let analysisResult: AnalysisResult;
    try {
      // JSONブロックを抽出（```json と ``` の間）
      const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[1]);
      } else {
        // JSONブロックがない場合、全体をJSONとして解析を試行
        analysisResult = JSON.parse(analysisText);
      }
    } catch {
      // JSON解析に失敗した場合のフォールバック
      analysisResult = {
        trendAnalysis: "分析結果の解析に失敗しました",
        sentimentAnalysis: "分析結果の解析に失敗しました",
        discussionQuality: "分析結果の解析に失敗しました",
        persuasionEffectiveness: "分析結果の解析に失敗しました",
        overallAssessment: "分析結果の解析に失敗しました",
        confidenceScore: 1,
      };
    }

    // 分析結果をデータベースに保存
    const { error: insertError } = await supabase
      .from("ai_vote_analysis")
      .upsert({
        post_id: postId,
        trend_analysis: analysisResult.trendAnalysis,
        sentiment_analysis: analysisResult.sentimentAnalysis,
        discussion_quality: analysisResult.discussionQuality,
        persuasion_effectiveness: analysisResult.persuasionEffectiveness,
        overall_assessment: analysisResult.overallAssessment,
        confidence_score: analysisResult.confidenceScore,
        analyzed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("分析結果保存エラー:", insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Gemini分析エラー:", error);
    console.error("エラースタック:", error.stack);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "AI分析処理中にエラーが発生しました",
        details: error.stack || "スタック情報なし",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
