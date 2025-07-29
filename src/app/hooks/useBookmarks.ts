import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "react-toastify";
import type { BookmarkedPost } from "../../types/post";
import { supabase } from "../../supabase-client";
import { useAuth } from "./useAuth";

// RPC関数の戻り値型定義
interface BookmarkIdResult {
  post_id: number;
}

interface PostWithCounts {
  id: number;
  title: string;
  content: string;
  created_at: string;
  image_url: string | null;
  avatar_url: string | null;
  community_id: number | null;
  vote_deadline: string | null;
  user_id: string;
  parent_post_id: number | null;
  nest_level: number | null;
  target_vote_choice: number | null;
  vote_count: number | null;
  comment_count: number | null;
}

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

      // ブックマークした投稿IDを取得
      const { data: bookmarkIds, error: bookmarkError } = await supabase.rpc(
        "get_user_bookmark_post_ids",
        {
          p_user_id: user.id,
        },
      );

      if (bookmarkError) throw new Error(bookmarkError.message);

      if (!bookmarkIds || bookmarkIds.length === 0) {
        return [];
      }

      // 投稿の詳細情報を取得
      const postIds = bookmarkIds.map((item: BookmarkIdResult) => item.post_id);
      const { data: posts, error: postsError } = await supabase.rpc(
        "get_posts_with_counts",
      );

      if (postsError) throw new Error(postsError.message);

      // ブックマークした投稿のみをフィルタリング
      const bookmarkedPosts =
        posts
          ?.filter((post: PostWithCounts) => postIds.includes(post.id))
          .map((post: PostWithCounts) => ({
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
            nest_level: post.nest_level || 0,
            target_vote_choice: post.target_vote_choice,
            vote_count: post.vote_count || 0,
            bookmark_created_at: new Date().toISOString(), // 簡略化
            comment_count: post.comment_count || 0,
            popularity_score: 0,
            communities: null,
          })) || [];

      // ブックマーク順序を保持（投稿ID順でソート）
      return bookmarkedPosts.sort(
        (a: BookmarkedPost, b: BookmarkedPost) =>
          postIds.indexOf(a.id) - postIds.indexOf(b.id),
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
        // シンプルなRPC関数でブックマーク削除
        const { error } = await supabase.rpc("remove_bookmark_simple", {
          p_user_id: user.id,
          p_post_id: postId,
        });

        if (error) throw new Error(error.message);

        return { action: "removed", postId };
      } else {
        // シンプルなRPC関数でブックマーク追加
        const { error } = await supabase.rpc("add_bookmark_simple", {
          p_user_id: user.id,
          p_post_id: postId,
        });

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
