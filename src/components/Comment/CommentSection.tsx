import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import CommentItem from "./CommentItem.tsx";
import {
  MessageSquareText,
  Send,
  AlertCircle,
  Loader2,
  LogIn,
} from "lucide-react";
import { supabase } from "../../supabase-client.ts";
import { useAuth } from "../../hooks/useAuth.ts";

interface PostProps {
  postId: number;
  voteDeadline?: string | null;
}

interface NewComment {
  content: string;
  parent_comment_id: number | null;
}

export interface Comment {
  id: number;
  post_id: number;
  parent_comment_id: number | null;
  content: string;
  user_id: string;
  created_at: string;
  author: string;
  is_persuasion_comment?: boolean; // 説得コメントフラグを追加
}

const createComment = async (
  newComment: NewComment,
  postId: number,
  userId?: string,
  author?: string,
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

const getComment = async (postId: number): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data as Comment[];
};

const CommentSection = ({ postId, voteDeadline }: PostProps) => {
  const [newCommentText, setNewCommentText] = useState<string>("");
  const { user, signInWithGoogle } = useAuth();
  const [isFocused, setIsFocused] = useState(false);

  const queryClient = useQueryClient();

  // 投票期限が過ぎているかチェックする関数
  const isDeadlinePassed = () => {
    if (!voteDeadline) return false;
    return new Date() > new Date(voteDeadline);
  };

  const {
    data: comments,
    error,
    isPending: commentIsPending,
  } = useQuery<Comment[], Error>({
    queryKey: ["comments", postId],
    queryFn: () => getComment(postId),
  });

  // リアルタイム機能：この特定の投稿へのコメント変更を監視
  useEffect(() => {
    const commentsChannel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          // この投稿へのコメントが変更されたらキャッシュを無効化
          queryClient.invalidateQueries({
            queryKey: ["comments", postId],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, [postId, queryClient]);

  const { mutate, isError, isPending } = useMutation({
    mutationFn: (newComment: NewComment) => {
      const effectiveUserName =
        user?.user_metadata?.user_name ||
        user?.email?.split("@")[0] ||
        "匿名ユーザー";

      return createComment(newComment, postId, user?.id, effectiveUserName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      setNewCommentText("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    mutate({ content: newCommentText, parent_comment_id: null });
  };

  const createCommentTree = (
    flatComments: Comment[],
  ): (Comment & { children: Comment[] })[] => {
    // まずすべてのコメントをマップに追加しておく
    const map = new Map<number, Comment & { children: Comment[] }>();
    const roots: (Comment & { children: Comment[] })[] = [];

    // すべてのコメントをマップに格納し、childrenプロパティを初期化
    for (const comment of flatComments) {
      map.set(comment.id, { ...comment, children: [] });
    }

    // コメントを適切な場所（親のchildren配列か、rootsか）に振り分ける
    for (const comment of flatComments) {
      const commentWithChildren = map.get(comment.id);

      // mapに存在するはずなので、念のためチェック
      if (!commentWithChildren) continue;

      if (comment.parent_comment_id === null) {
        // 親コメントがない場合はルートに追加
        roots.push(commentWithChildren);
      } else {
        // 親コメントがある場合
        const parent = map.get(comment.parent_comment_id);
        if (parent) {
          // 親が見つかった場合、その子として追加
          parent.children.push(commentWithChildren);
        } else {
          // 親が見つからない場合は孤立コメントとしてルートに追加
          roots.push(commentWithChildren);
        }
      }
    }

    return roots;
  };

  // 通常のコメントのみ表示（説得コメントはVoteDeadlineコンポーネントで表示）
  const userComments =
    comments?.filter((comment) => !comment.is_persuasion_comment) || [];

  const commentTree = userComments ? createCommentTree(userComments) : [];
  const commentCount = userComments?.length || 0;

  return (
    <div className="mt-10 bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquareText className="text-green-400" size={24} />
        <h3 className="text-xl font-semibold text-green-400">
          コメント {commentCount > 0 && `(${commentCount})`}
        </h3>
      </div>

      {/* コメント入力セクション */}
      {user ? (
        <div className="mb-8">
          {isDeadlinePassed() ? (
            <div className="py-8 px-6 bg-gray-700/30 rounded-lg border border-gray-600 text-center">
              <MessageSquareText
                size={32}
                className="mx-auto mb-3 text-gray-500"
              />
              <p className="text-gray-300 mb-1">投票期限が終了しています</p>
              <p className="text-gray-400 text-sm">
                この投稿の期限が過ぎているため、新しいコメントを投稿することはできません。
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div
                className={`relative border ${
                  isFocused ? "border-green-500" : "border-gray-600"
                } rounded-lg transition-all duration-200 shadow-sm`}
              >
                <textarea
                  value={newCommentText}
                  rows={3}
                  placeholder="この投稿についてコメントを書く..."
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    const value = (
                      e.target as HTMLTextAreaElement & { value: string }
                    ).value;
                    setNewCommentText(value);
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="w-full bg-gray-700 text-white p-4 rounded-lg resize-none outline-none placeholder-gray-400"
                />

                <div className="absolute bottom-2 right-3 text-xs text-gray-400">
                  {newCommentText.length}/500
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-400">
                  <span className="text-green-400 font-medium">
                    {user.email?.split("@")[0] || "匿名ユーザー"}
                  </span>{" "}
                  として投稿します
                </div>

                <button
                  type="submit"
                  disabled={!newCommentText.trim() || isPending}
                  className={`px-5 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2
                    ${
                      !newCommentText.trim() || isPending
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>投稿中</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>コメントを投稿</span>
                    </>
                  )}
                </button>
              </div>

              {isError && (
                <div className="p-3 bg-red-900/30 border border-red-700 rounded-md text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>
                    コメント登録中にエラーが発生しました。再度お試しください。
                  </span>
                </div>
              )}
            </form>
          )}
        </div>
      ) : (
        <div className="py-8 px-6 bg-gray-700/30 rounded-lg border border-gray-600 text-center mb-8">
          <MessageSquareText size={32} className="mx-auto mb-3 text-gray-500" />
          <p className="text-gray-300 mb-3">
            コメントするにはログインしてください
          </p>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-sm transition-colors inline-flex items-center gap-2"
          >
            <LogIn size={16} />
            <span>ログイン</span>
          </button>
        </div>
      )}

      {/* コメント表示部分 */}
      <div className="space-y-2">
        {commentCount > 0 && (
          <div className="flex items-center gap-2 mb-4 pt-4 border-t border-gray-600">
            <MessageSquareText className="text-gray-400" size={20} />
            <h4 className="text-lg font-medium text-gray-300">
              ユーザーコメント ({commentCount})
            </h4>
          </div>
        )}

        {commentIsPending ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-green-400" size={32} />
            <span className="ml-3 text-gray-400">コメントを読み込み中...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-900/30 border border-red-700 rounded-md text-red-400 text-center">
            <AlertCircle size={24} className="mx-auto mb-2" />
            <p>{error.message}</p>
          </div>
        ) : commentTree.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageSquareText size={32} className="mx-auto mb-3 opacity-50" />
            <p>まだコメントはありません。最初のコメントを投稿しましょう！</p>
          </div>
        ) : (
          commentTree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              voteDeadline={voteDeadline}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
