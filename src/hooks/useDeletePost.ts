import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client.ts";
import { toast } from "react-toastify";

interface DeletePostData {
  postId: number;
  imageUrl?: string | null;
}

const deletePost = async ({ postId, imageUrl }: DeletePostData) => {
  try {
    const { data: postCheck, error: checkError } = await supabase
      .from("posts")
      .select("id, user_id")
      .eq("id", postId)
      .single();

    if (checkError) {
      throw new Error(`投稿が見つかりません: ${checkError.message}`);
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("ユーザー認証に失敗しました");
    }

    if (postCheck.user_id !== user.id) {
      throw new Error("この投稿を削除する権限がありません");
    }

    // point_transactionsを削除（CASCADE対象外のため）
    await supabase
      .from("point_transactions")
      .delete()
      .eq("reference_id", postId)
      .eq("reference_table", "posts");

    // 投稿を削除（CASCADE DELETEにより関連データも自動削除）
    const { error: deleteError, count } = await supabase
      .from("posts")
      .delete({ count: "exact" })
      .eq("id", postId)
      .eq("user_id", user.id);

    if (deleteError || count === 0) {
      // RPC関数を試行
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        "delete_user_post",
        {
          post_id: postId,
          user_id: user.id,
        },
      );

      if (rpcError) {
        throw new Error(`投稿の削除に失敗しました: ${rpcError.message}`);
      }

      if (!rpcResult?.success) {
        throw new Error(
          `投稿の削除に失敗しました: ${rpcResult?.error || "削除処理が失敗しました"}`,
        );
      }
    }

    // 投稿削除後、ユーザーの共感ポイントを再計算
    try {
      await supabase.rpc("calculate_empathy_points", {
        target_user_id: user.id,
      });
    } catch (empathyError) {
      console.warn("共感ポイント再計算に失敗しました:", empathyError);
      // エラーがあっても処理を続行（削除は成功しているため）
    }

    // 画像を削除
    if (imageUrl) {
      const urlParts = imageUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const filePath = fileName.split("?")[0];

      if (filePath) {
        await supabase.storage.from("post-images").remove([filePath]);
      }
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`投稿の削除に失敗しました: ${String(error)}`);
  }
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePost,
    onSuccess: (_, variables) => {
      // 投稿一覧キャッシュから削除された投稿を除去
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            Array.isArray(query.queryKey) && query.queryKey[0] === "posts",
        },
        (oldData: unknown) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;
          return oldData.filter(
            (post: { id: number; parent_post_id?: number }) =>
              post.id !== variables.postId &&
              post.parent_post_id !== variables.postId,
          );
        },
      );

      // 関連クエリを無効化
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          if (!Array.isArray(queryKey)) return false;
          return (
            queryKey[0] === "posts" ||
            queryKey[0] === "post" ||
            queryKey[0] === "popular-posts" ||
            queryKey[0] === "completed-posts" ||
            queryKey[0] === "nestedPosts" ||
            queryKey[0] === "bookmarks" ||
            queryKey[0] === "notifications" ||
            queryKey[0] === "unread-notifications-count" ||
            queryKey[0] === "user-ranking" ||
            queryKey[0] === "user-empathy-points" ||
            queryKey[0] === "user-quality-scores"
          );
        },
      });

      // 特定の投稿詳細クエリを削除
      queryClient.removeQueries({
        queryKey: ["post", variables.postId],
      });

      queryClient.removeQueries({
        queryKey: ["nestedPosts", variables.postId],
      });

      toast.success("投稿を削除しました");
    },
    onError: (error: Error) => {
      toast.error(`投稿の削除に失敗しました: ${error.message}`);
    },
  });
};
