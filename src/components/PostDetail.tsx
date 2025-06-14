import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import type { PostType } from "./PostList";
import VoteButton from "./VoteButton";
import CommentSection from "./CommentSection";
import { useAtomValue } from "jotai";
import { mostVotedCommentAtomFamily } from "../stores/CommentVoteAtom";
import { useState, useEffect } from "react";
import { Calendar, Clock, MessageCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface Props {
  postId: number;
}

interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
  // 必要に応じて他のフィールドを追加
}

const fetchPostById = async (id: number): Promise<PostType> => {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id) // 受け取ったidとpostsテーブルのidが一致するものを取得
    .single();

  if (error) throw new Error(error.message);
  return data as PostType;
};

const fetchCommentById = async (id: number | null): Promise<Comment | null> => {
  if (id === null) return null;

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as Comment;
};

const createPersuasionComment = async (
  postId: number,
  content: string,
  userId: string,
) => {
  // ユーザーの表示名を取得（CommentSectionと同じロジック）
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("ユーザー情報の取得に失敗しました");
  }

  const effectiveUserName =
    user.user_metadata?.user_name ||
    user.email?.split("@")[0] ||
    "匿名ユーザー";

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      content,
      user_id: userId,
      author: effectiveUserName, // authorフィールドを追加
      is_persuasion_comment: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Comment;
};

const PostDetail = ({ postId }: Props) => {
  const queryClient = useQueryClient();
  const [showPersuasionModal, setShowPersuasionModal] = useState(false);
  const [persuasionContent, setPersuasionContent] = useState("");

  const { user } = useAuth();

  const { data, error, isPending } = useQuery<PostType, Error>({
    queryKey: ["post", postId],
    queryFn: () => fetchPostById(postId),
  });

  // 投稿者かどうかをチェック
  const isPostOwner = user?.id === data?.user_id;

  // 投票期限をチェックする
  const isVotingExpired = () => {
    if (!data?.vote_deadline) return false;
    return new Date() > new Date(data.vote_deadline);
  };

  const persuasionCommentMutation = useMutation({
    mutationFn: ({ content }: { content: string }) =>
      createPersuasionComment(postId, content, user?.id || ""),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      setShowPersuasionModal(false);
      setPersuasionContent("");
    },
    onError: (error) => {
      console.error("説得コメントの投稿に失敗しました", error);
      alert("説得コメントの投稿に失敗しました。もう一度お試しください。");
    },
  });

  const handlePersuasionModal = () => {
    setShowPersuasionModal(true);
  };

  const handlePersuasionSubmit = () => {
    if (!persuasionContent.trim()) {
      alert("説得コメントを入力してください。");
      return;
    }
    persuasionCommentMutation.mutate({ content: persuasionContent });
  };

  // 説得タイム（期限の1時間前）かどうかをチェック
  const isPersuasionTime = () => {
    if (!data?.vote_deadline) return false;
    const deadline = new Date(data.vote_deadline);
    const now = new Date();
    const oneHourBeforeDeadline = new Date(deadline.getTime() - 60 * 60 * 1000);
    return now >= oneHourBeforeDeadline && now < deadline;
  };

  // 残り時間を計算
  const getTimeRemaining = () => {
    if (!data?.vote_deadline) return null;

    const deadline = new Date(data.vote_deadline);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();

    if (diffMs < 0) return { expired: true };

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      expired: false,
      days: diffDays,
      hours: diffHours,
      minutes: diffMinutes,
    };
  };

  const timeRemaining = getTimeRemaining();
  const votingExpired = isVotingExpired();
  const showPersuasionButton = isPostOwner && isPersuasionTime();

  // 最も投票の多いコメント情報を取得
  const mostVotedInfo = useAtomValue(mostVotedCommentAtomFamily)[postId] || {
    commentId: null,
    votes: 0,
  };

  // 最もリアクションの多いコメントを管理する
  const [mostVotedComment, setMostVotedComment] = useState<Comment | null>(
    null,
  );

  // 最も投票の多いコメントのIDが変わったらコメント情報を取得
  useEffect(() => {
    if (!mostVotedInfo.commentId) {
      setMostVotedComment(null);
      return;
    }

    const fetchComment = async () => {
      try {
        const comment = await fetchCommentById(mostVotedInfo.commentId);
        setMostVotedComment(comment);
      } catch (error) {
        console.error("コメント取得エラー:", error);
        setMostVotedComment(null);
      }
    };

    fetchComment();
  }, [mostVotedInfo.commentId]);

  // モーダルを閉じる
  const handleCloseModal = () => {
    setShowPersuasionModal(false);
    setPersuasionContent("");
  };

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-6xl font-bold text-center bg-gradient-to-r from-green-600 to-green-200 bg-clip-text text-transparent">
        {data.title}
      </h2>

      {/* 投票期限の時計表示 */}
      {data.vote_deadline && (
        <div
          className={`relative p-6 rounded-xl shadow-lg ${
            votingExpired
              ? "bg-gradient-to-r from-red-100 to-red-200 border-l-4 border-red-500"
              : showPersuasionButton
                ? "bg-gradient-to-r from-orange-100 to-orange-200 border-l-4 border-orange-500"
                : "bg-gradient-to-r from-blue-100 to-blue-200 border-l-4 border-blue-500"
          }`}
        >
          <div className="flex items-center justify-between">
            {/* 左側：時計アイコンとタイトル */}
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-full shadow-md ${
                  votingExpired
                    ? "bg-red-500"
                    : showPersuasionButton
                      ? "bg-orange-500"
                      : "bg-blue-500"
                }`}
              >
                <Clock size={28} className="text-white" />
              </div>
              <div>
                <h3
                  className={`text-xl font-bold ${
                    votingExpired
                      ? "text-red-800"
                      : showPersuasionButton
                        ? "text-orange-800"
                        : "text-blue-800"
                  }`}
                >
                  {votingExpired
                    ? "投票終了"
                    : showPersuasionButton
                      ? "説得タイム!"
                      : "投票受付中"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar size={16} className="text-gray-600" />
                  <span className="text-sm text-gray-600">
                    {new Date(data.vote_deadline).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* 右側：カウントダウン */}
            {!votingExpired && timeRemaining && !timeRemaining.expired && (
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div
                    className={`text-3xl font-bold ${showPersuasionButton ? "text-orange-600" : "text-blue-600"} bg-white rounded-lg px-3 py-2 shadow-sm min-w-[60px]`}
                  >
                    {timeRemaining.days || 0}
                  </div>
                  <div className="text-xs font-medium text-gray-600 mt-1">
                    日
                  </div>
                </div>
                <div
                  className={`text-2xl font-bold ${showPersuasionButton ? "text-orange-600" : "text-blue-600"}`}
                >
                  :
                </div>
                <div className="text-center">
                  <div
                    className={`text-3xl font-bold ${showPersuasionButton ? "text-orange-600" : "text-blue-600"} bg-white rounded-lg px-3 py-2 shadow-sm min-w-[60px]`}
                  >
                    {timeRemaining.hours}
                  </div>
                  <div className="text-xs font-medium text-gray-600 mt-1">
                    時間
                  </div>
                </div>
                <div
                  className={`text-2xl font-bold ${showPersuasionButton ? "text-orange-600" : "text-blue-600"}`}
                >
                  :
                </div>
                <div className="text-center">
                  <div
                    className={`text-3xl font-bold ${showPersuasionButton ? "text-orange-600" : "text-blue-600"} bg-white rounded-lg px-3 py-2 shadow-sm min-w-[60px]`}
                  >
                    {timeRemaining.minutes}
                  </div>
                  <div className="text-xs font-medium text-gray-600 mt-1">
                    分
                  </div>
                </div>
              </div>
            )}

            {/* 期限切れの場合 */}
            {votingExpired && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 bg-white rounded-lg px-6 py-3 shadow-sm">
                  期限終了
                </div>
                <div className="text-xs font-medium text-gray-600 mt-1">
                  投票を締め切りました
                </div>
              </div>
            )}
          </div>

          {/* 説得コメントボタン */}
          {showPersuasionButton && (
            <div className="mt-4 pt-4 border-t border-orange-300">
              <button
                onClick={handlePersuasionModal}
                className="flex items-center gap-3 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
              >
                <MessageCircle size={20} />
                <span>説得コメントを投稿</span>
              </button>
              <p className="text-sm text-orange-700 mt-2">
                投票期限まで残り1時間を切りました。投票者への最後のメッセージを送信できます。
              </p>
            </div>
          )}
        </div>
      )}

      <img
        src={data.image_url}
        alt={data.title}
        className="mt-4 rounded object-cover w-full h-64"
      />
      <h2 className="text-gray-400 text-xl">{data?.content}</h2>
      <p className="text-gray-500 text-sm">
        {new Date(data?.created_at).toLocaleDateString()}
      </p>

      {/* 最も投票されたコメントがある場合は表示 */}
      {mostVotedComment && mostVotedInfo.votes > 0 && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-xl font-semibold text-green-700 mb-2">
            一番参考にされているコメント
          </h3>
          <div className="bg-white p-3 rounded shadow-sm">
            <p className="text-gray-700">{mostVotedComment.content}</p>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-500">
                {new Date(mostVotedComment.created_at).toLocaleDateString()}
              </span>
              <span className="text-xs font-semibold text-green-600">
                {mostVotedInfo.votes} votes
              </span>
            </div>
          </div>
        </div>
      )}

      <VoteButton postId={postId} voteDeadline={data.vote_deadline} />
      <CommentSection postId={postId} />
      {/* 説得コメントモーダル */}
      <Dialog open={showPersuasionModal} onOpenChange={setShowPersuasionModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              説得コメント
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              投票期限まで残り僅かです。投票者への最後のメッセージを送信してください。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={persuasionContent}
              onChange={(e) => setPersuasionContent(e.target.value)}
              placeholder="投票者に向けたメッセージを入力してください..."
              className="min-h-[120px] resize-none text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-500 dark:text-gray-400">
              {persuasionContent.length}/500
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={persuasionCommentMutation.isPending}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              キャンセル
            </Button>
            <Button
              onClick={handlePersuasionSubmit}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={
                persuasionCommentMutation.isPending || !persuasionContent.trim()
              }
            >
              {persuasionCommentMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  投稿中...
                </>
              ) : (
                <>
                  <MessageCircle size={16} className="mr-2" />
                  投稿する
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostDetail;
