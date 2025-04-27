import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "../supabase-client";

interface PostProps {
  postId: number;
}

interface NewComment {
  content: string;
  parent_comment_id: number | null;
}

const createComment = async (
  newComment: NewComment,
  postId: number,
  userId?: string,
  author?: string
) => {
  if (!userId || !author) {
    throw new Error("コメントするにはログインが必要です");
  }
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    content: newComment.content,
    parent_comment_id: newComment.parent_comment_id || null,
    author: author,
    user_id: userId,
  });
  if (error) throw new Error(error.message);
};

const CommentSection = ({ postId }: PostProps) => {
  const [newCommentText, setNewCommentText] = useState<string>("");
  const { user } = useAuth();
  const [isFocused, setIsFocused] = useState(false);

  const { mutate, isError, isPending } = useMutation({
    mutationFn: (newComment: NewComment) => {
      const effectiveUserName =
        user?.user_metadata?.user_name ||
        user?.email?.split("@")[0] ||
        "匿名ユーザー";

      return createComment(newComment, postId, user?.id, effectiveUserName);
    },
    onError: (error) => {
      console.log("ユーザー情報:", user);
      console.log("ユーザーID:", user?.id);
      console.log("ユーザー名:", user?.user_metadata?.user_name);
      console.log(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    mutate({ content: newCommentText, parent_comment_id: null });
    setNewCommentText("");
  };

  return (
    <div className="mt-8 bg-gray-800 rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-green-400">コメント</h3>

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div
            className={`relative border ${isFocused ? "border-green-500" : "border-gray-600"} rounded-lg transition-all duration-200`}
          >
            <textarea
              value={newCommentText}
              rows={3}
              placeholder="投票した理由や感想を入力してください..."
              onChange={(e) => setNewCommentText(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full bg-gray-700 text-white p-4 rounded-lg resize-none outline-none placeholder-gray-400"
            />

            {/* 残り文字数カウンター (オプション) */}
            <div className="absolute bottom-2 right-3 text-xs text-gray-400">
              {newCommentText.length}/500
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newCommentText.trim() || isPending}
              className={`px-5 py-2 rounded-md font-medium transition-all duration-200 flex items-center space-x-1
                ${
                  !newCommentText.trim() || isPending
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
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
                  <span>投稿中</span>
                </>
              ) : (
                <span>コメントを投稿</span>
              )}
            </button>
          </div>

          {isError && (
            <div className="mt-2 p-3 bg-red-900/30 border border-red-700 rounded-md text-red-400 text-sm">
              コメント登録中にエラーが発生しました。再度お試しください。
            </div>
          )}
        </form>
      ) : (
        <div className="py-6 px-4 bg-gray-700/50 rounded-lg border border-gray-600 text-center">
          <p className="text-gray-300">コメントするにはログインしてください</p>
          <button
            type="button"
            className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-sm transition-colors"
          >
            ログイン
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
