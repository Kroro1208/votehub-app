import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase-client";
import type { PostType } from "./PostList";
import VoteButton from "../Vote/VoteButton";
import { useAtomValue } from "jotai";
import { mostVotedCommentAtomFamily } from "../../stores/CommentVoteAtom";
import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MessageCircle,
  MessageSquarePlus,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import CommentSection from "../Comment/CommentSection";
import PostContentDisplay from "./PostContentDisplay";
import CreateNestedPost from "./CreateNestedPost";
import NestedPostSummary from "./NestedPostSummary";

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

const fetchNestedPosts = async (parentId: number): Promise<PostType[]> => {
  // get_posts_with_counts 関数の代わりに直接クエリを実行
  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      id,
      title,
      content,
      created_at,
      image_url,
      avatar_url,
      vote_deadline,
      community_id,
      user_id,
      parent_post_id,
      nest_level,
      target_vote_choice
    `,
    )
    .eq("parent_post_id", parentId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  // 各投稿の投票数とコメント数を取得
  const postsWithCounts = await Promise.all(
    data.map(async (post) => {
      // 投票数を取得
      const { data: voteData } = await supabase
        .from("votes")
        .select("id", { count: "exact" })
        .eq("post_id", post.id);

      // コメント数を取得
      const { data: commentData } = await supabase
        .from("comments")
        .select("id", { count: "exact" })
        .eq("post_id", post.id);

      return {
        ...post,
        vote_count: voteData?.length || 0,
        comment_count: commentData?.length || 0,
        nest_level: post.nest_level || 0,
        parent_post_id: post.parent_post_id || null,
        target_vote_choice: post.target_vote_choice || null,
        children: [] as PostType[],
      } as PostType;
    }),
  );

  return postsWithCounts;
};

// ユーザーが親投稿に投票したかどうか、どの選択肢に投票したかを取得
const fetchUserVoteForPost = async (
  postId: number,
  userId: string | undefined,
): Promise<number | null> => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle(); // single() ではなく maybeSingle() を使用

  if (error) {
    console.error("投票データ取得エラー:", error);
    return null;
  }

  return data ? data.vote : null;
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
  const [showCreateNested, setShowCreateNested] = useState(false);

  const { user } = useAuth();

  const { data, error, isPending } = useQuery<PostType, Error>({
    queryKey: ["post", postId],
    queryFn: () => fetchPostById(postId),
  });

  // ネスト投稿を取得
  const { data: nestedPosts, refetch: refetchNestedPosts } = useQuery<
    PostType[],
    Error
  >({
    queryKey: ["nestedPosts", postId],
    queryFn: () => fetchNestedPosts(postId),
  });

  // ユーザーの親投稿への投票状況を取得
  const { data: userVoteChoice } = useQuery<number | null, Error>({
    queryKey: ["userVote", postId, user?.id],
    queryFn: () => fetchUserVoteForPost(postId, user?.id),
    enabled: !!user?.id,
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

  const handleNestedPostCreate = () => {
    refetchNestedPosts();
    setShowCreateNested(false);
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

      {/* 画像と投稿内容を横並びに配置 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 lg:items-center">
        {/* 左側：画像 */}
        <div className="h-fit">
          <img
            src={data.image_url ?? undefined}
            alt={data.title}
            className="rounded-lg object-contain w-full h-auto max-h-96 shadow-lg"
          />
        </div>

        {/* 右側：賛成・反対・詳細 */}
        <div className="h-fit">
          <PostContentDisplay content={data?.content} />
        </div>
      </div>
      <p className="text-gray-500 text-sm">
        {new Date(data?.created_at).toLocaleDateString()}
      </p>

      {/* 最も投票されたコメントがある場合は表示 */}
      {mostVotedComment && mostVotedInfo.votes > 0 && (
        <div className="mt-8 p-4 bg-orange-50 border border-green-200 rounded-lg">
          <h3 className="text-xl font-semibold text-orange-500 mb-2">
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

      {/* 派生質問セクション */}
      {data && (data.nest_level || 0) < 3 && (
        <div className="mt-8 border-t border-slate-200 pt-6">
          {/* 派生質問作成ボタン */}
          {user && (data.nest_level || 0) < 3 && !showCreateNested && (
            <div className="mb-6">
              <Button
                onClick={() => setShowCreateNested(true)}
                className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white"
              >
                <MessageSquarePlus size={18} />
                派生質問を作成
              </Button>
            </div>
          )}

          {/* 派生質問の表示（タイトルと概要のみ） */}
          {nestedPosts && nestedPosts.length > 0 ? (
            <div className="space-y-3 p-5">
              <h3 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
                <MessageSquarePlus size={20} className="text-violet-600" />
                派生質問
              </h3>
              {nestedPosts
                .filter((nestedPost) => {
                  // target_vote_choiceがnullの場合は全員に表示
                  if (nestedPost.target_vote_choice === null) return true;

                  // 投稿者の場合は投票の有無に関わらず全ての派生質問を表示
                  if (isPostOwner) return true;

                  // ユーザーが投票していない場合は対象外の質問は表示しない
                  if (userVoteChoice === null) return false;

                  // ユーザーの投票とターゲット投票選択が一致する場合のみ表示
                  return nestedPost.target_vote_choice === userVoteChoice;
                })
                .map((nestedPost) => (
                  <NestedPostSummary
                    key={nestedPost.id}
                    post={nestedPost}
                    level={1}
                  />
                ))}

              {/* 投票していないユーザー向けのメッセージ（投稿者は除外） */}
              {!isPostOwner &&
                userVoteChoice === null &&
                nestedPosts.some((p) => p.target_vote_choice !== null) && (
                  <div className="text-center py-6 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-700 font-bold">
                      投票者限定の派生質問があります
                    </p>
                    <p className="text-blue-600 text-sm mt-1">
                      この投票に参加された方はチェックしてください✅
                    </p>
                  </div>
                )}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <p>まだ派生質問はありません</p>
            </div>
          )}
        </div>
      )}

      {/* 派生質問作成ダイアログ */}
      <Dialog open={showCreateNested} onOpenChange={setShowCreateNested}>
        <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <MessageSquarePlus className="h-5 w-5" />
              派生投稿を作成
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              元の投稿から派生した新しい質問を作成します
            </DialogDescription>
          </DialogHeader>
          {data && (
            <CreateNestedPost
              parentPost={{
                id: postId,
                title: data.title,
                nest_level: data.nest_level || 0,
              }}
              onCancel={() => setShowCreateNested(false)}
              onSuccess={handleNestedPostCreate}
              isDialog={true}
            />
          )}
        </DialogContent>
      </Dialog>

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
