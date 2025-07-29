"use client";
import { Clock, MessageSquare, Reply, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { VscBell, VscBellDot } from "react-icons/vsc";

import { NotificationType } from "@/types/notification";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNotifications } from "../../hooks/useNotifications";
import { Button } from "../ui/button";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  const handleNotificationClick = async (notification: NotificationType) => {
    await markAsRead(notification.id);
    setIsOpen(false);

    // 通知タイプに基づいて遷移先を決定
    if (
      notification.type === "nested_post_created" &&
      notification.nested_post_id
    ) {
      // 派生質問の通知の場合は派生質問のページに遷移
      router.push(`/post/${notification.nested_post_id}`);
    } else if (notification.post_id) {
      // その他の通知の場合は元の投稿ページに遷移
      router.push(`/post/${notification.post_id}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  // 外側クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationIcon = (type: NotificationType["type"]) => {
    switch (type) {
      case "comment_posted":
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case "comment_reply_posted":
        return <Reply className="w-4 h-4 text-green-400" />;
      case "persuasion_comment_posted":
        return <MessageSquare className="w-4 h-4 text-orange-400" />;
      case "nested_post_created":
        return <TrendingUp className="w-4 h-4 text-purple-400" />;
      case "vote_deadline_ended":
      case "persuasion_time_started":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <VscBell className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 通知ベルアイコン */}
      <Button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-transparent hover:bg-gray-700 transition-colors relative"
      >
        {unreadCount > 0 ? (
          <>
            <VscBellDot
              style={{ width: "25px", height: "25px" }}
              className="text-yellow-400"
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </>
        ) : (
          <VscBell
            style={{ width: "25px", height: "25px" }}
            className="text-gray-300"
          />
        )}
      </Button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-[9999] max-h-[500px] overflow-visible">
          {/* ヘッダー */}
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-white font-semibold">通知</h3>
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-400 hover:text-blue-300 bg-transparent p-1"
              >
                すべて既読
              </Button>
            )}
          </div>

          {/* 通知リスト */}
          <div className="max-h-60 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                通知はありません
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors ${
                    !notification.read ? "bg-gray-850" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    {/* 通知タイプアイコン */}
                    <div className="mt-1 flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* 未読インジケーター */}
                      <div className="flex items-center gap-2 mb-1">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                        <h4 className="text-sm font-medium text-white">
                          {notification.title}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(
                          new Date(notification.created_at),
                          {
                            addSuffix: true,
                            locale: ja,
                          },
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* フッター */}
          <div className="p-3 border-t border-gray-700 text-center">
            <Link
              href="/notifications"
              className="text-sm text-blue-400 hover:text-blue-300"
              onClick={() => setIsOpen(false)}
            >
              すべての通知を見る
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
