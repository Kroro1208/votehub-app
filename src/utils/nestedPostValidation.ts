/**
 * 派生質問制限のフロントエンド検証ユーティリティ
 * バックエンド制約と連携してセキュリティを強化
 */

import { supabase } from "../supabase-client";

export interface NestedPostValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    parentPostExists: boolean;
    nestLevelValid: boolean;
    userCanVote: boolean;
    targetVoteChoiceValid: boolean;
  };
}

/**
 * 派生質問作成の権限と制限をチェック
 */
export async function validateNestedPostCreation(
  userId: string,
  parentPostId: number,
  targetVoteChoice: number,
  currentNestLevel: number,
): Promise<NestedPostValidationResult> {
  try {
    // 1. 親投稿の存在確認とネストレベルチェック
    const { data: parentPost, error: parentError } = await supabase
      .from("posts")
      .select("id, nest_level, user_id")
      .eq("id", parentPostId)
      .single();

    if (parentError || !parentPost) {
      return {
        isValid: false,
        error: "親投稿が存在しません",
        details: {
          parentPostExists: false,
          nestLevelValid: false,
          userCanVote: false,
          targetVoteChoiceValid: false,
        },
      };
    }

    // 2. ネストレベル制限チェック（最大3階層）
    if (parentPost.nest_level >= 3) {
      return {
        isValid: false,
        error: "ネストレベルは最大3階層までです",
        details: {
          parentPostExists: true,
          nestLevelValid: false,
          userCanVote: false,
          targetVoteChoiceValid: false,
        },
      };
    }

    // 3. 期待されるネストレベルのチェック
    const expectedNestLevel = parentPost.nest_level + 1;
    if (currentNestLevel !== expectedNestLevel) {
      return {
        isValid: false,
        error: `ネストレベルが不正です。期待値: ${expectedNestLevel}`,
        details: {
          parentPostExists: true,
          nestLevelValid: false,
          userCanVote: false,
          targetVoteChoiceValid: false,
        },
      };
    }

    // 4. target_vote_choice値の検証
    if (![1, -1].includes(targetVoteChoice)) {
      return {
        isValid: false,
        error: "対象投票選択は賛成(1)または反対(-1)である必要があります",
        details: {
          parentPostExists: true,
          nestLevelValid: true,
          userCanVote: false,
          targetVoteChoiceValid: false,
        },
      };
    }

    // 5. 投稿主の場合は投票チェックを免除
    const isPostOwner = parentPost.user_id === userId;

    if (!isPostOwner) {
      // 投稿主でない場合のみ投票権限チェック
      const { data: userVote, error: voteError } = await supabase
        .from("votes")
        .select("vote")
        .eq("user_id", userId)
        .eq("post_id", parentPostId)
        .single();

      if (voteError || !userVote) {
        return {
          isValid: false,
          error: "親投稿に投票していないため、派生質問を作成できません",
          details: {
            parentPostExists: true,
            nestLevelValid: true,
            userCanVote: false,
            targetVoteChoiceValid: true,
          },
        };
      }

      // 6. 投票選択と対象の一致チェック
      if (userVote.vote !== targetVoteChoice) {
        const voteText = targetVoteChoice === 1 ? "賛成" : "反対";
        const userVoteText = userVote.vote === 1 ? "賛成" : "反対";
        return {
          isValid: false,
          error: `${voteText}者向けの質問ですが、あなたは${userVoteText}に投票しています`,
          details: {
            parentPostExists: true,
            nestLevelValid: true,
            userCanVote: false,
            targetVoteChoiceValid: true,
          },
        };
      }
    }

    return {
      isValid: true,
      details: {
        parentPostExists: true,
        nestLevelValid: true,
        userCanVote: true,
        targetVoteChoiceValid: true,
      },
    };
  } catch (error) {
    console.error("派生質問検証エラー:", error);
    return {
      isValid: false,
      error: "検証中にエラーが発生しました",
      details: {
        parentPostExists: false,
        nestLevelValid: false,
        userCanVote: false,
        targetVoteChoiceValid: false,
      },
    };
  }
}

/**
 * 派生質問への投票権限をチェック
 */
export async function validateNestedPostVote(
  userId: string,
  nestedPostId: number,
): Promise<NestedPostValidationResult> {
  try {
    // 1. ネスト投稿の情報を取得
    const { data: nestedPost, error: postError } = await supabase
      .from("posts")
      .select("parent_post_id, target_vote_choice, nest_level, user_id")
      .eq("id", nestedPostId)
      .single();

    if (postError || !nestedPost) {
      return {
        isValid: false,
        error: "投稿が存在しません",
      };
    }

    // 2. ルート投稿の場合は常に投票可能
    if (!nestedPost.parent_post_id) {
      return { isValid: true };
    }

    // 3. target_vote_choiceが設定されていない場合は全員投票可能
    if (!nestedPost.target_vote_choice) {
      return { isValid: true };
    }

    // 4. 投稿主の場合は投票チェックを免除
    if (nestedPost.user_id === userId) {
      return { isValid: true };
    }

    // 5. 親投稿の投稿主も確認が必要
    const { data: parentPost, error: parentError } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", nestedPost.parent_post_id)
      .single();

    // 親投稿の投稿主の場合も投票チェックを免除
    if (!parentError && parentPost && parentPost.user_id === userId) {
      return { isValid: true };
    }

    // 6. その他のユーザーは親投稿への投票を確認
    const { data: parentVote, error: voteError } = await supabase
      .from("votes")
      .select("vote")
      .eq("user_id", userId)
      .eq("post_id", nestedPost.parent_post_id)
      .single();

    if (voteError || !parentVote) {
      return {
        isValid: false,
        error: "親投稿に投票していないため、この質問に投票できません",
      };
    }

    // 7. 投票選択の一致チェック
    if (parentVote.vote !== nestedPost.target_vote_choice) {
      const requiredVote =
        nestedPost.target_vote_choice === 1 ? "賛成" : "反対";
      return {
        isValid: false,
        error: `この質問は${requiredVote}者向けです`,
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("投票権限検証エラー:", error);
    return {
      isValid: false,
      error: "検証中にエラーが発生しました",
    };
  }
}

/**
 * 派生質問の表示権限をチェック
 */
export async function validateNestedPostVisibility(
  userId: string | null,
  nestedPost: {
    parent_post_id: number | null;
    target_vote_choice: number | null;
  },
): Promise<boolean> {
  try {
    // ルート投稿は全員表示可能
    if (!nestedPost.parent_post_id) {
      return true;
    }

    // target_vote_choiceが設定されていない場合は全員表示可能
    if (!nestedPost.target_vote_choice) {
      return true;
    }

    // 未認証ユーザーは表示不可
    if (!userId) {
      return false;
    }

    // ユーザーの親投稿への投票を確認
    const { data: parentVote } = await supabase
      .from("votes")
      .select("vote")
      .eq("user_id", userId)
      .eq("post_id", nestedPost.parent_post_id)
      .single();

    // 親投稿に投票していない場合は表示不可
    if (!parentVote) {
      return false;
    }

    // target_vote_choiceと一致する場合のみ表示可能
    return parentVote.vote === nestedPost.target_vote_choice;
  } catch (error) {
    console.error("表示権限検証エラー:", error);
    return false;
  }
}

/**
 * ネストレベル制限のチェック
 */
export function validateNestLevel(currentLevel: number): boolean {
  return currentLevel >= 0 && currentLevel <= 3;
}

/**
 * target_vote_choice値の検証
 */
export function validateTargetVoteChoice(value: unknown): value is 1 | -1 {
  return value === 1 || value === -1;
}
