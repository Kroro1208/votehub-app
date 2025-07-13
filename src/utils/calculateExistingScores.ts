import { supabase } from "../supabase-client.ts";

// 既存の全投稿に対して品質度スコアを計算
export const calculateAllExistingQualityScores = async () => {
  try {
    // 全投稿を取得
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id, user_id")
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      return { success: false, error: postsError.message };
    }

    if (!posts || posts.length === 0) {
      return { success: true, message: "計算する投稿がありません" };
    }

    console.log(`${posts.length}件の投稿の品質度スコアを計算中...`);

    let successCount = 0;
    let errorCount = 0;

    // 各投稿の品質度スコアを計算
    for (const post of posts) {
      try {
        const { error } = await supabase.rpc("calculate_quality_score", {
          input_post_id: post.id,
          input_user_id: post.user_id,
        });

        if (error) {
          console.error(`Post ${post.id} calculation error:`, error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`Post ${post.id} calculation failed:`, error);
        errorCount++;
      }
    }

    return {
      success: true,
      message: `品質度スコア計算完了: 成功 ${successCount}件, エラー ${errorCount}件`,
    };
  } catch (error) {
    console.error("Error in calculateAllExistingQualityScores:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

// 既存の全ユーザーに対して共感ポイントを計算
export const calculateAllExistingEmpathyPoints = async () => {
  try {
    // 全ユーザーを取得（投稿がある users のみ）
    const { data: users, error: usersError } = await supabase
      .from("posts")
      .select("user_id")
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return { success: false, error: usersError.message };
    }

    if (!users || users.length === 0) {
      return { success: true, message: "計算するユーザーがありません" };
    }

    // 重複を除去
    const uniqueUsers = [...new Set(users.map((u) => u.user_id))];
    console.log(`${uniqueUsers.length}人のユーザーの共感ポイントを計算中...`);

    let successCount = 0;
    let errorCount = 0;

    // 各ユーザーの共感ポイントを計算
    for (const userId of uniqueUsers) {
      try {
        const { error } = await supabase.rpc("calculate_empathy_points", {
          input_user_id: userId,
        });

        if (error) {
          console.error(`User ${userId} calculation error:`, error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`User ${userId} calculation failed:`, error);
        errorCount++;
      }
    }

    // ランキング更新
    const { error: rankingError } = await supabase.rpc(
      "update_empathy_rankings",
    );
    if (rankingError) {
      console.error("Ranking update error:", rankingError);
    }

    return {
      success: true,
      message: `共感ポイント計算完了: 成功 ${successCount}件, エラー ${errorCount}件`,
    };
  } catch (error) {
    console.error("Error in calculateAllExistingEmpathyPoints:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

// 両方を実行
export const calculateAllExistingScores = async () => {
  console.log("既存スコア計算を開始...");

  const qualityResult = await calculateAllExistingQualityScores();
  console.log("品質度スコア計算結果:", qualityResult);

  const empathyResult = await calculateAllExistingEmpathyPoints();
  console.log("共感ポイント計算結果:", empathyResult);

  return {
    qualityResult,
    empathyResult,
  };
};
