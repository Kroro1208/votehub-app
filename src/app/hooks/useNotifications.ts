import { supabase } from "../../supabase-client";
import { NotificationType } from "../../types/notification";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // デバウンス用のタイマー管理
  const invalidationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // キャッシュ無効化をデバウンス処理
  const debouncedInvalidateCache = useCallback(() => {
    // 既存のタイマーをクリア
    if (invalidationTimerRef.current) {
      clearTimeout(invalidationTimerRef.current);
    }

    // 500ms後に実行（複数の変更が短時間に発生した場合は最後の1回のみ実行）
    invalidationTimerRef.current = setTimeout(() => {
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: ["notifications", user.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["unread-notifications-count", user.id],
        });
      }
    }, 500);
  }, [user?.id, queryClient]);

  // リアルタイム通知更新
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // デバウンス処理されたキャッシュ無効化を実行
          debouncedInvalidateCache();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // クリーンアップ時にタイマーもクリア
      if (invalidationTimerRef.current) {
        clearTimeout(invalidationTimerRef.current);
      }
    };
  }, [user?.id, debouncedInvalidateCache]);

  // 通知一覧を取得
  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async (): Promise<NotificationType[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as NotificationType[];
    },
    enabled: !!user?.id,
  });

  // 未読通知数を取得
  const { data: unreadCount } = useQuery({
    queryKey: ["unread-notifications-count", user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;

      // まずは直接クエリで未読通知数を取得
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) {
        console.error("Error fetching unread count:", error);
        throw error;
      }

      return count || 0;
    },
    enabled: !!user?.id,
  });

  // 通知を既読にする（楽観的更新 + デバウンス処理）
  const markAsRead = useCallback(
    async (notificationId: number) => {
      if (!user?.id) return false;

      // 楽観的更新：UIを即座に更新
      queryClient.setQueryData(
        ["notifications", user.id],
        (oldData: NotificationType[] | undefined) =>
          oldData?.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification,
          ) || [],
      );

      // 未読数も楽観的に更新
      queryClient.setQueryData(
        ["unread-notifications-count", user.id],
        (oldCount: number | undefined) => Math.max(0, (oldCount || 0) - 1),
      );

      try {
        const { data, error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", notificationId)
          .eq("user_id", user.id);

        if (error) throw error;
        return data;
      } catch (error) {
        // エラー時はキャッシュをリセット
        debouncedInvalidateCache();
        throw error;
      }
    },
    [user?.id, queryClient, debouncedInvalidateCache],
  );

  // 全ての通知を既読にする（楽観的更新）
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return 0;

    // 楽観的更新：全通知を既読状態に更新
    queryClient.setQueryData(
      ["notifications", user.id],
      (oldData: NotificationType[] | undefined) =>
        oldData?.map((notification) => ({ ...notification, read: true })) || [],
    );

    // 未読数を0に更新
    queryClient.setQueryData(["unread-notifications-count", user.id], 0);

    try {
      const { data, error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;
      return data;
    } catch (error) {
      // エラー時はキャッシュをリセット
      debouncedInvalidateCache();
      throw error;
    }
  }, [user?.id, queryClient, debouncedInvalidateCache]);

  // 手動でキャッシュを更新する（デバウンス処理済み）
  const refetch = useCallback(() => {
    debouncedInvalidateCache();
  }, [debouncedInvalidateCache]);

  return {
    notifications: notifications || [],
    unreadCount: unreadCount || 0,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetch,
  };
};
