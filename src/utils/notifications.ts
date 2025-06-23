import { supabase } from "../supabase-client";
import { NotificationCreateParams } from "../types/notification";

/**
 * 通知を作成する関数
 */
export const createNotification = async (params: NotificationCreateParams) => {
  const { error } = await supabase.from("notifications").insert({
    user_id: params.user_id,
    type: params.type,
    title: params.title,
    message: params.message,
    post_id: params.post_id || null,
    nested_post_id: params.nested_post_id || null,
    read: false,
  });

  if (error) {
    throw new Error(`通知の作成に失敗しました: ${error.message}`);
  }
};

/**
 * 派生質問作成時に該当する投票者に通知を送信
 */
export const notifyNestedPostTargets = async (
  parentPostId: number,
  nestedPostId: number,
  nestedPostTitle: string,
  targetVoteChoice: number,
  creatorUserId: string,
) => {
  try {
    // 親投稿で該当する投票をしたユーザーを取得
    const { data: voters, error: votersError } = await supabase
      .from("votes")
      .select("user_id")
      .eq("post_id", parentPostId)
      .eq("vote_choice", targetVoteChoice);

    if (votersError) {
      throw new Error(`投票者の取得に失敗しました: ${votersError.message}`);
    }

    if (!voters || voters.length === 0) {
      console.log("該当する投票者がいません");
      return;
    }

    // 作成者自身を除外
    const targetUsers = voters.filter(
      (voter) => voter.user_id !== creatorUserId,
    );

    if (targetUsers.length === 0) {
      console.log("通知対象者がいません");
      return;
    }

    // 各ユーザーに通知を作成
    const notifications = targetUsers.map((voter) => ({
      user_id: voter.user_id,
      type: "nested_post_created" as const,
      title: "あなたが参加した投票に派生質問が作成されました",
      message: `「${nestedPostTitle}」という派生質問があなた宛に作成されました。`,
      post_id: parentPostId,
      nested_post_id: nestedPostId,
      read: false,
    }));

    // 一括で通知を作成
    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (insertError) {
      throw new Error(`通知の一括作成に失敗しました: ${insertError.message}`);
    }

    console.log(`${targetUsers.length}人のユーザーに通知を送信しました`);
  } catch (error) {
    console.error("派生質問通知の送信に失敗:", error);
    throw error;
  }
};
