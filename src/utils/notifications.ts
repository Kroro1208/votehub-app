import { supabase } from "../supabase-client.ts";
import { NotificationCreateParams } from "../types/notification.ts";
import { isPersuasionTime } from "./formatTime.tsx";

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
      .eq("vote", targetVoteChoice);

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

/**
 * 説得タイム開始時に投票参加者に通知を送信
 */
export const notifyPersuasionTimeStarted = async (
  postId: number,
  postTitle: string,
) => {
  try {
    // データベース関数を使用して効率的に通知を作成
    const { data, error } = await supabase.rpc(
      "create_persuasion_notifications",
      {
        p_post_id: postId,
        p_post_title: postTitle,
      },
    );

    if (error) {
      throw new Error(
        `説得タイム開始通知の作成に失敗しました: ${error.message}`,
      );
    }

    const notificationCount = data || 0;
    if (notificationCount > 0) {
      console.log(
        `${notificationCount}人のユーザーに説得タイム開始通知を送信しました`,
      );
    } else {
      console.log("説得タイム開始通知: 対象者なしまたは既に送信済み");
    }
  } catch (error) {
    console.error("説得タイム開始通知の送信に失敗:", error);
    throw error;
  }
};

/**
 * 投票期限終了時に投票参加者に通知を送信
 */
export const notifyVoteDeadlineEnded = async (
  postId: number,
  postTitle: string,
) => {
  try {
    // データベース関数を使用して効率的に通知を作成
    const { data, error } = await supabase.rpc(
      "create_deadline_notifications",
      {
        p_post_id: postId,
        p_post_title: postTitle,
      },
    );

    if (error) {
      throw new Error(`投票期限終了通知の作成に失敗しました: ${error.message}`);
    }

    const notificationCount = data || 0;
    if (notificationCount > 0) {
      console.log(
        `${notificationCount}人のユーザーに投票期限終了通知を送信しました`,
      );
    } else {
      console.log("投票期限終了通知: 対象者なしまたは既に送信済み");
    }
  } catch (error) {
    console.error("投票期限終了通知の送信に失敗:", error);
    throw error;
  }
};

/**
 * 説得タイム開始の検出と通知送信
 * 投票時に呼び出して、初回説得タイム検出時に通知を送信
 */
export const checkAndNotifyPersuasionTimeStarted = async (
  postId: number,
  postTitle: string,
  voteDeadline: string | null,
) => {
  try {
    // 通知試行をログ記録
    await logNotificationAttempt(
      postId,
      "persuasion_time_started",
      "useHandleVotes-onSettled",
    );

    // セッション内で既に送信済みかチェック
    const sessionKey = getSessionKey(postId, "persuasion_time_started");
    if (sessionNotificationsSent.has(sessionKey)) {
      console.log(
        `[PERSUASION_SESSION_ALREADY_SENT] セッション内で既に送信済み: postId=${postId}`,
      );
      return false;
    }

    // 説得タイムかどうかを確認
    if (!isPersuasionTime(voteDeadline)) {
      console.log(
        `[PERSUASION_CHECK] 説得タイムではありません: postId=${postId}`,
      );
      return false; // 説得タイムではない
    }

    // データベース関数を使用して通知未送信かチェック
    const { data: notSent, error: checkError } = await supabase.rpc(
      "check_persuasion_notification_not_sent",
      { p_post_id: postId },
    );

    if (checkError) {
      console.error("通知送信状況チェックに失敗:", checkError);
      return false;
    }

    // 既に通知済みの場合は送信しない
    if (!notSent) {
      console.log(
        `[PERSUASION_ALREADY_SENT] 説得タイム通知は既に送信済み: postId=${postId}`,
      );
      return false;
    }

    // 説得タイム開始通知を送信
    console.log(`[PERSUASION_SEND] 説得タイム開始通知を送信: postId=${postId}`);
    await notifyPersuasionTimeStarted(postId, postTitle);

    // セッション内送信済みマークに追加
    sessionNotificationsSent.add(sessionKey);

    console.log(
      `[PERSUASION_SENT] 説得タイム開始通知を送信完了: postId=${postId}`,
    );
    return true; // 通知送信成功
  } catch (error) {
    console.error("説得タイム開始検出・通知に失敗:", error);
    return false;
  }
};

// 進行中の通知チェックを追跡するためのマップ
const pendingDeadlineChecks = new Map<number, Promise<boolean>>();

// セッション中に送信済みの通知を追跡（重複防止）
const sessionNotificationsSent = new Set<string>();

// セッションキーを生成する関数
const getSessionKey = (postId: number, type: string) => `${postId}-${type}`;

// 通知作成試行をログ記録するヘルパー関数
const logNotificationAttempt = async (
  postId: number,
  type: string,
  source: string = "client-js",
) => {
  try {
    await supabase.rpc("log_notification_attempt", {
      p_post_id: postId,
      p_notification_type: type,
      p_source: source,
    });
  } catch (error) {
    console.warn("通知試行ログの記録に失敗:", error);
  }
};

/**
 * 投票期限終了の検出と通知送信
 * 定期的に呼び出して期限終了を検出し通知を送信
 */
export const checkAndNotifyVoteDeadlineEnded = async (
  postId: number,
  postTitle: string,
  voteDeadline: string | null,
  postCreatedAt?: string,
) => {
  // 通知試行をログ記録
  await logNotificationAttempt(
    postId,
    "vote_deadline_ended",
    "PostDetail-useEffect",
  );

  // セッション内で既に送信済みかチェック
  const sessionKey = getSessionKey(postId, "vote_deadline_ended");
  if (sessionNotificationsSent.has(sessionKey)) {
    console.log(
      `[SESSION_ALREADY_SENT] セッション内で既に送信済み: postId=${postId}`,
    );
    return false;
  }

  // 既に同じpostIdで処理中の場合は既存のPromiseを返す
  if (pendingDeadlineChecks.has(postId)) {
    console.log(
      `[DUPLICATE_PREVENTION] 既に処理中のため待機: postId=${postId}`,
    );
    return pendingDeadlineChecks.get(postId)!;
  }

  const checkPromise = (async (): Promise<boolean> => {
    try {
      if (!voteDeadline) {
        return false; // 期限が設定されていない
      }

      const now = new Date();
      const deadline = new Date(voteDeadline);

      // まだ期限前の場合
      if (now < deadline) {
        return false;
      }

      // 投稿作成時刻をチェック - 新しく作成された投稿（特にネスト投稿）の場合は通知を控える
      if (postCreatedAt) {
        const createdAt = new Date(postCreatedAt);
        const timeSinceCreation = now.getTime() - createdAt.getTime();
        const minWaitTime = 60000; // 1分

        if (timeSinceCreation < minWaitTime) {
          console.log(
            `[NEW_POST_PROTECTION] 投稿が新しすぎるため期限終了通知をスキップ: postId=${postId}, 作成からの経過時間=${Math.floor(timeSinceCreation / 1000)}秒`,
          );
          return false;
        }
      }

      // データベース関数を使用して通知未送信かチェック
      const { data: notSent, error: checkError } = await supabase.rpc(
        "check_deadline_notification_not_sent",
        { p_post_id: postId },
      );

      if (checkError) {
        console.error("通知送信状況チェックに失敗:", checkError);
        return false;
      }

      // 既に通知済みの場合は送信しない
      if (!notSent) {
        console.log(`[ALREADY_SENT] 既に通知送信済み: postId=${postId}`);
        return false;
      }

      // 投票期限終了通知を送信
      console.log(
        `[NOTIFICATION_SEND] 投票期限終了通知を送信開始: postId=${postId}`,
      );
      await notifyVoteDeadlineEnded(postId, postTitle);

      // セッション内送信済みマークに追加
      sessionNotificationsSent.add(sessionKey);

      console.log(
        `[NOTIFICATION_SENT] 投票期限終了通知を送信完了: postId=${postId}`,
      );
      return true; // 通知送信成功
    } catch (error) {
      console.error("投票期限終了検出・通知に失敗:", error);
      return false;
    } finally {
      // 処理完了後にマップから削除
      pendingDeadlineChecks.delete(postId);
    }
  })();

  // 進行中の処理としてマップに追加
  pendingDeadlineChecks.set(postId, checkPromise);

  return checkPromise;
};
