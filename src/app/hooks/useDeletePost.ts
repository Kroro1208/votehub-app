import { supabase } from "../../supabase-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

interface DeletePostData {
  postId: number;
  imageUrl?: string | null | undefined;
}

const deletePost = async ({ postId, imageUrl }: DeletePostData) => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("ユーザー認証に失敗しました");
    }

    // セキュアなRPC関数で投稿削除を実行
    const { data: deleteResult, error: deleteError } = await supabase.rpc(
      "delete_user_post_secure",
      {
        p_post_id: postId,
        p_user_id: user.id,
      },
    );

    if (deleteError) {
      throw new Error(`投稿の削除に失敗しました: ${deleteError.message}`);
    }

    if (
      !deleteResult ||
      deleteResult.length === 0 ||
      !deleteResult[0].success
    ) {
      const errorMessage =
        deleteResult?.[0]?.message || "削除処理が失敗しました";
      throw new Error(`投稿の削除に失敗しました: ${errorMessage}`);
    }

    // RPC関数から返された画像URLを使用（imageUrlより正確）
    const resultImageUrl = deleteResult[0].image_url || imageUrl;

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
    if (resultImageUrl) {
      const urlParts = resultImageUrl.split("/");
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
