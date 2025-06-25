import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "./useAuth";
import { toast } from "react-toastify";
import type { BookmarkedPost } from "../types/post";

export const useBookmarks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ユーザーのブックマーク一覧を取得
  const {
    data: bookmarkedPosts,
    isPending: isBookmarksLoading,
    error: bookmarksError,
  } = useQuery<BookmarkedPost[], Error>({
    queryKey: ["bookmarks", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("ユーザーが存在しません");

      const { data, error } = await supabase.rpc("get_bookmarked_posts");

      if (error) throw new Error(error.message);

      // 型安全のため、dataが配列であることを保証
      if (!Array.isArray(data)) {
        throw new Error("取得したデータが配列ではありません");
      }

      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5分間キャッシュ
  });

  // 特定の投稿がブックマークされているかチェック
  const isBookmarked = (postId: number): boolean => {
    return bookmarkedPosts?.some((post) => post.id === postId) || false;
  };

  // ブックマークの追加/削除
  const toggleBookmark = useMutation({
    mutationFn: async (postId: number) => {
      if (!user) throw new Error("ユーザーが存在しません");

      const isCurrentlyBookmarked = isBookmarked(postId);

      if (isCurrentlyBookmarked) {
        // ブックマーク削除
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", postId);

        if (error) throw new Error(error.message);
        return { action: "removed", postId };
      } else {
        // ブックマーク追加
        const { error } = await supabase
          .from("bookmarks")
          .insert({ user_id: user.id, post_id: postId });

        if (error) throw new Error(error.message);
        return { action: "added", postId };
      }
    },
    onSuccess: (result) => {
      // ブックマーク一覧を再取得
      queryClient.invalidateQueries({ queryKey: ["bookmarks", user?.id] });

      // トースト通知
      if (result.action === "added") {
        toast.success("ブックマークに追加しました");
      } else {
        toast.success("ブックマークから削除しました");
      }
    },
    onError: (error) => {
      toast.error(`ブックマーク操作に失敗しました: ${error.message}`);
    },
  });

  return {
    bookmarkedPosts,
    isBookmarksLoading,
    bookmarksError,
    isBookmarked,
    toggleBookmark: toggleBookmark.mutate,
    isToggling: toggleBookmark.isPending,
  };
};
