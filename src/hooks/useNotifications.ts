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

      console.log("Unread count from direct query:", count);
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // 通知を既読にする
  const markAsRead = async (notificationId: number) => {
    if (!user?.id) return false;

    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", user.id);

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

    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

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
