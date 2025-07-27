import { useState } from "react";
import type { Comment } from "./CommentSection.tsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronsUp, ChevronsUpDown, MessageSquare, Send } from "lucide-react";
import CommentVotes from "./CommentVotes.tsx";
import { supabase } from "../../supabase-client.ts";
import { useAuth } from "../../hooks/useAuth.ts";
import { Button } from "../ui/button.tsx";

interface CommentItemProps {
  comment: Comment & {
    children: Comment[];
  };
  postId: number;
  voteDeadline?: string | null;
}
const createReply = async (
  reply: string,
  postId: number,
  parentCommentId: number,
  userId?: string,
  author?: string,
) => {
  if (!userId || !author) {
    throw new Error("コメントするにはログインが必要です");
  }

  const { data, error } = await supabase.rpc("create_comment_secure", {
    p_post_id: postId,
    p_content: reply,
    p_parent_comment_id: parentCommentId || null,
    p_author: author,
    p_user_id: userId,
  });

  if (error) throw new Error(error.message);
  return data;
};

const CommentItem = ({ comment, postId, voteDeadline }: CommentItemProps) => {
  const [showReply, setShowReply] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const [isFocused, setIsFocused] = useState(false);
  const [newReplytText, setNewReplyText] = useState<string>("");
  const queryClient = useQueryClient();

  // 投票期限が過ぎているかチェックする関数
  const isDeadlinePassed = () => {
    if (!voteDeadline) return false;
    return new Date() > new Date(voteDeadline);
  };

  const { mutate, isError, isPending } = useMutation({
    mutationFn: (reply: string) => {
      const effectiveUserName =
        user?.user_metadata?.user_name ||
        user?.email?.split("@")[0] ||
        "匿名ユーザー";

      return createReply(
        reply,
        postId,
        comment.id,
        user?.id,
        effectiveUserName,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      setNewReplyText("");
      setShowReply(false);
    },
  });

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplytText) return;
    mutate(newReplytText);
    setNewReplyText("");
  };

  // 日付フォーマット関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="mt-4 pl-4 border-l-2 border-gray-300 dark:border-gray-700">
      <div className="mb-3 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        {/* コメントヘッダー */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-600 dark:bg-green-700 flex items-center justify-center text-white font-medium">
                {comment.author.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {comment.author}
              </span>
            </div>
            {/* コメント本文 */}
            <p className="text-gray-700 dark:text-gray-200 my-2 whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(comment.created_at)}
            </span>
            <CommentVotes
              commentId={comment.id}
              postId={postId}
              authorId={comment.user_id}
            />
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex justify-between items-center mt-2">
          {!isDeadlinePassed() ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowReply((prev) => !prev)}
              className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-transparent border-none p-0 h-auto"
            >
              <MessageSquare size={16} className="mr-1" />
              <span>{showReply ? "キャンセル" : "返信する"}</span>
            </Button>
          ) : (
            <span className="text-sm text-gray-600 dark:text-gray-500">
              投票期限終了
            </span>
          )}

          {comment.children && comment.children.length > 0 && (
            <Button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              title={isCollapsed ? "返信を隠す" : "返信を見る"}
              className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-transparent border-none p-0 h-auto"
            >
              {isCollapsed ? (
                <ChevronsUpDown size={18} />
              ) : (
                <ChevronsUp size={18} />
              )}
              <span className="ml-1">{comment.children.length}件の返信</span>
            </Button>
          )}
        </div>
      </div>

      {/* 返信フォーム */}
      {showReply && user && (
        <div className="ml-4 mb-4">
          <form onSubmit={handleReplySubmit} className="space-y-3">
            <div
              className={`relative border ${isFocused ? "border-green-500" : "border-gray-300 dark:border-gray-600"} rounded-lg transition-all duration-200`}
            >
              <textarea
                value={newReplytText}
                rows={2}
                placeholder="返信を入力..."
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  const value = (
                    e.target as HTMLTextAreaElement & { value: string }
                  ).value;
                  setNewReplyText(value);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg resize-none outline-none placeholder-gray-500 dark:placeholder-gray-400 text-sm border-none"
              />

              <div className="absolute bottom-2 right-3 text-xs text-gray-500 dark:text-gray-400">
                {newReplytText.length}/500
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!newReplytText.trim() || isPending}
                className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center
                ${
                  !newReplytText.trim() || isPending
                    ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {isPending ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <title>loading</title>
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>送信中...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} className="" />
                    <span>返信する</span>
                  </>
                )}
              </Button>
            </div>

            {isError && (
              <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md text-red-700 dark:text-red-400 text-sm">
                コメント登録中にエラーが発生しました。再度お試しください。
              </div>
            )}
          </form>
        </div>
      )}

      {/* 子コメント - 元のisCollapsed状態を維持 */}
      {comment.children && comment.children.length > 0 && (
        <div>
          {!isCollapsed && (
            <div className="ml-2 space-y-1">
              {comment.children.map((child) => (
                <CommentItem
                  key={child.id}
                  comment={child as Comment & { children: Comment[] }}
                  postId={postId}
                  voteDeadline={voteDeadline}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
