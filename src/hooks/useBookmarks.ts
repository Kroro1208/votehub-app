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

      const { data, error } = await supabase
        .from("bookmarks")
        .select(
          `
          post_id,
          created_at,
          posts (
            id,
            created_at,
            title,
            content,
            image_url,
            avatar_url,
            community_id,
            vote_deadline,
            user_id,
            vote_count,
            tag_id,
            parent_post_id,
            nest_level,
            target_vote_choice
          )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      // データを適切な形式に変換
      return (
        data?.map((bookmark) => {
          const post = Array.isArray(bookmark.posts)
            ? bookmark.posts[0]
            : bookmark.posts;
          return {
            id: post.id,
            title: post.title,
            content: post.content,
            created_at: post.created_at,
            image_url: post.image_url,
            avatar_url: post.avatar_url,
            vote_deadline: post.vote_deadline,
            community_id: post.community_id,
            user_id: post.user_id,
            parent_post_id: post.parent_post_id,
            nest_level: post.nest_level,
            target_vote_choice: post.target_vote_choice,
            vote_count: post.vote_count,
            bookmark_created_at: bookmark.created_at,
            comment_count: 0,
            popularity_score: 0,
            communities: null,
          };
        }) || []
      );
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5分間キャッシュ
  });

  // 特定の投稿がブックマークされているかチェック
  const isBookmarked = (postId: number): boolean => {
    return (
      bookmarkedPosts?.some((post: BookmarkedPost) => post.id === postId) ||
      false
    );
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
