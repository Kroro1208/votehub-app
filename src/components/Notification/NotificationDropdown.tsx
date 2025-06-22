import { useState } from "react";
import { VscBell, VscBellDot } from "react-icons/vsc";
import { useNotifications } from "../../hooks/useNotifications";
import { Button } from "../ui/button";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Link } from "react-router";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  const handleNotificationClick = async (
    notificationId: number,
    postId: number | null,
  ) => {
    await markAsRead(notificationId);
    setIsOpen(false);

    // 投稿ページにリダイレクト（必要に応じて実装）
    if (postId) {
      // TODO: navigate to post detail page
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="relative">
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
        <>
          {/* 背景クリックで閉じる */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 通知リスト */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
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
            <div className="max-h-80 overflow-y-auto">
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
                    onClick={() =>
                      handleNotificationClick(
                        notification.id,
                        notification.post_id,
                      )
                    }
                  >
                    <div className="flex items-start space-x-3">
                      {/* 未読インジケーター */}
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white mb-1">
                          {notification.title}
                        </h4>
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
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-700 text-center">
                <Link
                  to="/notifications"
                  className="text-sm text-blue-400 hover:text-blue-300"
                  onClick={() => setIsOpen(false)}
                >
                  すべての通知を見る
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
