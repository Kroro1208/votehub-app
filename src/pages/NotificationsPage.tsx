import React from "react";

import { useState } from "react";
import { useNavigate } from "react-router";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import {
  MessageSquare,
  Reply,
  Clock,
  TrendingUp,
  CheckCircle,
  ArrowLeft,
  Check,
} from "lucide-react";
import { VscBell } from "react-icons/vsc";
import { useNotifications } from "../hooks/useNotifications.ts";
import { Button } from "../components/ui/button.tsx";
import { Card, CardContent } from "../components/ui/card.tsx";
import type { NotificationType } from "../types/notification.ts";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  // Filter notifications based on selected filter
  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  // Apply pagination to visible notifications
  const visibleNotifications = filteredNotifications.slice(0, visibleCount);
  const hasMoreNotifications = filteredNotifications.length > visibleCount;

  const handleNotificationClick = async (
    notificationId: number,
    postId: number | null,
    isRead: boolean,
  ) => {
    // Mark as read if not already read
    if (!isRead) {
      await markAsRead(notificationId);
    }

    // Navigate to post if postId exists
    if (postId) {
      navigate(`/post/${postId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true);
    try {
      await markAllAsRead();
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 20);
  };

  const getNotificationIcon = (type: NotificationType["type"]) => {
    switch (type) {
      case "comment_posted":
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case "comment_reply_posted":
        return <Reply className="w-5 h-5 text-green-400" />;
      case "persuasion_comment_posted":
        return <MessageSquare className="w-5 h-5 text-orange-400" />;
      case "nested_post_created":
        return <TrendingUp className="w-5 h-5 text-purple-400" />;
      case "vote_deadline_ended":
      case "persuasion_time_started":
        return <Clock className="w-5 h-5 text-yellow-400" />;
      default:
        return <VscBell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getNotificationTypeText = (type: NotificationType["type"]) => {
    switch (type) {
      case "comment_posted":
        return "コメント";
      case "comment_reply_posted":
        return "返信";
      case "persuasion_comment_posted":
        return "説得コメント";
      case "nested_post_created":
        return "派生質問";
      case "vote_deadline_ended":
        return "投票終了";
      case "persuasion_time_started":
        return "説得タイム";
      default:
        return "通知";
    }
  };

  return (
    <div className="min-h-screen bg-slate-300">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Top row - Title and back button */}
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate(-1)}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-slate-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                通知
              </h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>

            {/* Bottom row - Controls */}
            <div className="flex items-center justify-between sm:justify-end space-x-2">
              {/* Filter buttons */}
              <div className="flex bg-slate-100 rounded-lg p-1">
                <Button
                  onClick={() => setFilter("all")}
                  variant={filter === "all" ? "default" : "ghost"}
                  size="sm"
                  className="text-xs px-3 py-1"
                >
                  すべて
                </Button>
                <Button
                  onClick={() => setFilter("unread")}
                  variant={filter === "unread" ? "default" : "ghost"}
                  size="sm"
                  className="text-xs px-3 py-1"
                >
                  未読のみ
                </Button>
              </div>

              {/* Mark all as read button */}
              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAllRead}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isMarkingAllRead ? (
                    <span className="hidden sm:inline">処理中...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">すべて既読</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {filteredNotifications.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <VscBell className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">
                {filter === "unread"
                  ? "未読の通知がありません"
                  : "通知がありません"}
              </h3>
              <p className="text-slate-500">
                {filter === "unread"
                  ? "すべての通知を既読にしています。"
                  : "新しい通知が届くとここに表示されます。"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {visibleNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  !notification.read
                    ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
                    : "bg-white hover:bg-slate-50"
                }`}
                onClick={() =>
                  handleNotificationClick(
                    notification.id,
                    notification.post_id,
                    notification.read,
                  )
                }
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start space-x-3">
                    {/* Notification icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Notification content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 pr-2">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                              {getNotificationTypeText(notification.type)}
                            </span>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-slate-800 mb-1 leading-5">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                            {notification.message}
                          </p>
                        </div>

                        {/* Read status */}
                        {notification.read && (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                      </div>

                      {/* Timestamp and action */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(
                            new Date(notification.created_at),
                            {
                              addSuffix: true,
                              locale: ja,
                            },
                          )}
                        </span>

                        {notification.post_id && (
                          <span className="text-xs text-blue-500 hover:text-blue-600 font-medium">
                            投稿を見る →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Load more button */}
            {hasMoreNotifications && (
              <div className="text-center mt-6">
                <Button
                  onClick={handleLoadMore}
                  variant="outline"
                  className="bg-white hover:bg-slate-50"
                >
                  さらに読み込む ({filteredNotifications.length - visibleCount}{" "}
                  件)
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        {filteredNotifications.length > 0 && (
          <div className="text-center mt-8 py-4">
            <p className="text-sm text-slate-500">
              {filter === "all"
                ? `全 ${notifications.length} 件の通知を表示中`
                : `未読 ${filteredNotifications.length} 件の通知を表示中`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
