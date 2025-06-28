import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "../supabase-client";
import { NotificationType } from "../types/notification";
import { useAuth } from "./useAuth";

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
          // 通知データが変更されたらキャッシュを無効化
          queryClient.invalidateQueries({
            queryKey: ["notifications", user.id],
          });
          queryClient.invalidateQueries({
            queryKey: ["unread-notifications-count", user.id],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

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

      const { data, error } = await supabase.rpc(
        "get_unread_notification_count",
        {
          p_user_id: user.id,
        },
      );

      if (error) throw error;
      return data || 0;
    },
    enabled: !!user?.id,
  });

  // 通知を既読にする
  const markAsRead = async (notificationId: number) => {
    if (!user?.id) return false;

    const { data, error } = await supabase.rpc("mark_notification_as_read", {
      p_notification_id: notificationId,
      p_user_id: user.id,
    });

    if (error) throw error;

    // キャッシュを更新
    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    queryClient.invalidateQueries({
      queryKey: ["unread-notifications-count", user.id],
    });

    return data;
  };

  // 全ての通知を既読にする
  const markAllAsRead = async () => {
    if (!user?.id) return 0;

    const { data, error } = await supabase.rpc(
      "mark_all_notifications_as_read",
      {
        p_user_id: user.id,
      },
    );

    if (error) throw error;

    // キャッシュを更新
    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    queryClient.invalidateQueries({
      queryKey: ["unread-notifications-count", user.id],
    });

    return data;
  };

  // 手動でキャッシュを更新する
  const refetch = () => {
    if (!user?.id) return;

    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    queryClient.invalidateQueries({
      queryKey: ["unread-notifications-count", user.id],
    });
  };

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
