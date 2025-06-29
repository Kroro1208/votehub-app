import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
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
      console.error("Post check error:", checkError);
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
      throw new Error(
        `この投稿を削除する権限がありません。投稿者: ${postCheck.user_id}, 現在のユーザー: ${user.id}`,
      );
    }

    // 関連レコードを削除してから本投稿の削除処理
    console.log("Starting deletion of related records...");

    // Step 1: 派生投稿の削除
    const { error: childPostsError, count: childCount } = await supabase
      .from("posts")
      .delete({ count: "exact" })
      .eq("parent_post_id", postId);

    if (childPostsError) {
      console.error("Child posts deletion error:", childPostsError, childCount);
      throw new Error(`子投稿の削除に失敗しました: ${childPostsError.message}`);
    }

    // Step 2: 投稿に関する投票の削除
    const { error: votesError, count: votesCount } = await supabase
      .from("votes")
      .delete({ count: "exact" })
      .eq("post_id", postId);

    if (votesError) {
      console.error("Votes deletion error:", votesError, votesCount);
      throw new Error(`投票の削除に失敗しました: ${votesError.message}`);
    }

    // Step 3: 投稿に関するコメントの削除
    const { error: commentsError, count: commentsCount } = await supabase
      .from("comments")
      .delete({ count: "exact" })
      .eq("post_id", postId);

    if (commentsError) {
      console.error("Comments deletion error:", commentsError, commentsCount);
      throw new Error(`コメントの削除に失敗しました: ${commentsError.message}`);
    }

    // Step 4: 投稿に関するポイントの削除
    const { error: pointsError, count: pointsCount } = await supabase
      .from("point_transactions")
      .delete({ count: "exact" })
      .eq("reference_id", postId)
      .eq("reference_table", "posts");

    if (pointsError) {
      console.error(
        "Point transactions deletion error:",
        pointsError,
        pointsCount,
      );
      throw new Error(
        `ポイントトランザクションの削除に失敗しました: ${pointsError.message}`,
      );
    }

    // Step 5: 投稿に関する画像の削除
    if (imageUrl) {
      // Extract the file path from the URL
      const urlParts = imageUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const filePath = fileName.split("?")[0]; // Remove query parameters if any

      if (filePath) {
        const { data: deletedFiles, error: storageError } =
          await supabase.storage.from("post-images").remove([filePath]);
        if (deletedFiles && deletedFiles.length === 0) {
          console.warn(
            "No files deleted from storage, file may not exist:",
            filePath,
          );
        }
        if (storageError) {
          console.error("Storage deletion error:", storageError);
          throw new Error(`画像の削除に失敗しました: ${storageError.message}`);
        }
      }
    }

    // Step 6: メイン投稿の削除
    const { error: deleteError, count } = await supabase
      .from("posts")
      .delete({ count: "exact" })
      .eq("id", postId)
      .eq("user_id", user.id);

    if (deleteError) {
      throw new Error(`投稿の削除に失敗しました: ${deleteError.message}`);
    }

    if (count === 0) {
      // RPC関数を試行
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        "delete_user_post",
        {
          post_id: postId,
          user_id: user.id,
        },
      );

      if (rpcError) {
        throw new Error(
          `投稿の削除に失敗しました。権限がないか、投稿が存在しません: ${rpcError.message}`,
        );
      }

      if (rpcResult && !rpcResult.success) {
        throw new Error(`投稿の削除に失敗しました: ${rpcResult.error}`);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Post deletion error:", error);
    if (error instanceof Error) {
      throw error; // 既にError型なのでそのまま投げる
    } else {
      throw new Error(`投稿の削除に失敗しました: ${String(error)}`);
    }
  }
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePost,
    onSuccess: (result, variables) => {
      setTimeout(() => {
        // 投稿が削除されたらキャッシュからすぐ削除
        queryClient.setQueriesData(
          {
            predicate: (query) =>
              Array.isArray(query.queryKey) && query.queryKey[0] === "posts",
          },
          (oldData: unknown) => {
            if (!oldData || !Array.isArray(oldData)) return oldData;
            // 配列から削除された投稿をフィルタリング
            const filtered = oldData.filter(
              (post: { id: number }) => post.id !== variables.postId,
            );
            return filtered;
          },
        );

        // Force refetch all post queries after a short delay
        setTimeout(() => {
          queryClient.refetchQueries({
            predicate: (query) => {
              const queryKey = query.queryKey;
              return Array.isArray(queryKey) && queryKey[0] === "posts";
            },
          });
        }, 500);

        // Also invalidate all related queries
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return (
              (Array.isArray(queryKey) && queryKey[0] === "posts") ||
              (Array.isArray(queryKey) && queryKey[0] === "post") ||
              (Array.isArray(queryKey) && queryKey[0] === "popular-posts") ||
              (Array.isArray(queryKey) && queryKey[0] === "community-posts") ||
              (Array.isArray(queryKey) && queryKey[0] === "nestedPosts")
            );
          },
        });
      }, 100);

      toast.success("投稿を削除しました");
    },
    onError: (error: Error) => {
      console.error("Post deletion error:", error);
      toast.error(`投稿の削除に失敗しました: ${error.message}`);
    },
  });
};
