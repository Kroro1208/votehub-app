import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase-client.ts";
import type { PostType } from "./PostList.tsx";
import VoteButton from "../Vote/VoteButton.tsx";
import { useAtomValue } from "jotai";
import { mostVotedCommentAtomFamily } from "../../stores/CommentVoteAtom.ts";
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { useDeletePost } from "../../hooks/useDeletePost.ts";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { Link } from "react-router";

import CommentSection from "../Comment/CommentSection.tsx";
import PostContentDisplay from "./PostContentDisplay.tsx";
import CreateNestedPostDialog from "./CreateNestedPostDialog.tsx";
import CreatePersuasionDialog from "./CreatePersuasionDialog.tsx";
import NestedPostSection from "./NestedPostSection.tsx";
import VoteDeadline from "./VoteDeadline.tsx";
import BookmarkButton from "./BookmarkButton.tsx";
import { isPersuasionTime } from "../../utils/formatTime.tsx";
import { AIAnalysisSection } from "../AI/AIAnalysisSection.tsx";

interface Props {
  postId: number;
}

export interface CommentType {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
  // 必要に応じて他のフィールドを追加
}

const fetchPostById = async (id: number): Promise<PostType> => {
  const { data, error } = await supabase.rpc("get_post_by_id", {
    p_post_id: id,
  });

  if (error) throw new Error(error.message);

  if (!data || data.length === 0) {
    throw new Error("投稿が見つかりません");
  }

  return data[0] as PostType;
};

const fetchNestedPosts = async (parentId: number): Promise<PostType[]> => {
  const { data, error } = await supabase
    .rpc("get_posts_with_counts")
    .eq("parent_post_id", parentId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data.map((post: PostType) => ({
    ...post,
    nest_level: post.nest_level || 0,
    parent_post_id: post.parent_post_id || null,
    target_vote_choice: post.target_vote_choice || null,
    children: [] as PostType[],
  })) as PostType[];
};

// ユーザーが親投稿に投票したかどうか、どの選択肢に投票したかを取得（セキュアなRPC関数使用）
const fetchUserVoteForPost = async (
  postId: number,
  userId: string | undefined,
): Promise<number | null> => {
  if (!userId) return null;

  const { data, error } = await supabase.rpc("get_user_vote_for_post", {
    p_post_id: postId,
    p_user_id: userId,
  });

  if (error) {
    console.error("投票データ取得エラー:", error);
    return null;
  }

  return data && data.length > 0 ? data[0].vote_type : null;
};

const fetchCommentById = async (
  id: number | null,
): Promise<CommentType | null> => {
  if (id === null) return null;

  const { data, error } = await supabase.rpc("get_comment_by_id", {
    p_comment_id: id,
  });

  if (error) throw new Error(error.message);

  return data && data.length > 0 ? (data[0] as CommentType) : null;
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

  const { data, error } = await supabase.rpc("create_persuasion_comment_safe", {
    p_post_id: postId,
    p_content: content,
    p_user_id: userId,
    p_author: effectiveUserName,
  });

  if (error) throw new Error(error.message);

  if (!data || data.length === 0) {
    throw new Error("コメントの作成に失敗しました");
  }

  // RPC関数の戻り値をCommentType形式に変換
  const result = data[0];
  return {
    id: result.comment_id,
    post_id: result.comment_post_id,
    user_id: result.comment_user_id,
    content: result.comment_content,
    created_at: result.comment_created_at,
  } as CommentType;
};

const PostDetail = ({ postId }: Props) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showPersuasionModal, setShowPersuasionModal] = useState(false);
  const [persuasionContent, setPersuasionContent] = useState("");
  const [showCreateNested, setShowCreateNested] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { user } = useAuth();
  const { mutate: deletePost, isPending: isDeleting } = useDeletePost();

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

  // ユーザーの親投稿への投票状況を取得（派生質問の場合のみ）
  const { data: userVoteChoice } = useQuery<number | null, Error>({
    queryKey: ["userVote", data?.parent_post_id, user?.id],
    queryFn: () => {
      if (!data?.parent_post_id) return null;
      return fetchUserVoteForPost(data.parent_post_id, user?.id);
    },
    enabled: !!user?.id && !!data?.parent_post_id,
  });

  // 投稿者かどうかをチェック
  const isPostOwner = user?.id === data?.user_id;

  const persuasionCommentMutation = useMutation({
    mutationFn: ({ content }: { content: string }) =>
      createPersuasionComment(postId, content, user?.id || ""),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({
        queryKey: ["persuasionComments", postId],
      });
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

  const showPersuasionButton =
    isPostOwner && isPersuasionTime(data?.vote_deadline);

  // 最も投票の多いコメント情報を取得
  const mostVotedInfo = useAtomValue(mostVotedCommentAtomFamily)[postId] || {
    commentId: null,
    votes: 0,
  };

  // 最もリアクションの多いコメントを管理する
  const [mostVotedComment, setMostVotedComment] = useState<CommentType | null>(
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

  // 投票期限終了チェック（Edge Function使用）
  useEffect(() => {
    if (!data || !data.vote_deadline) {
      return;
    }

    // Edge Function (smooth-task) がサーバーサイドで期限チェックを行うため、
    // フロントエンドでのポーリングは不要。
    // 必要に応じて手動でEdge Functionを呼び出すことも可能
    const triggerDeadlineCheckIfNeeded = async () => {
      const deadline = new Date(data.vote_deadline!);
      const now = new Date();

      // 期限が過ぎている場合のみ、即座にEdge Functionを呼び出し
      if (now > deadline) {
        try {
          // Edge Function endpoint を直接呼び出し
          const response = await fetch(
            "https://rvgsxdggkipvjevphjzb.supabase.co/functions/v1/smooth-task",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                "Content-Type": "application/json",
              },
            },
          );

          if (!response.ok) {
            console.warn(
              `[EDGE_FUNCTION] smooth-task responded with status ${response.status}`,
            );
          } else {
            const result = await response.json();
            console.log(
              `[EDGE_FUNCTION] smooth-task processed ${result.processed} posts`,
            );
          }
        } catch (error) {
          console.error(`[EDGE_FUNCTION] Failed to call smooth-task:`, error);
        }
      }
    };

    // 初回チェックのみ実行（ポーリングなし）
    triggerDeadlineCheckIfNeeded();
  }, [postId, data?.vote_deadline, data]);

  // モーダルを閉じる
  const handleCloseModal = () => {
    setShowPersuasionModal(false);
    setPersuasionContent("");
  };

  const handleNestedPostCreate = () => {
    refetchNestedPosts();
    setShowCreateNested(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    deletePost(
      {
        postId: postId,
        imageUrl: data?.image_url,
      },
      {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          navigate("/");
        },
      },
    );
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const avatarUrl = data?.avatar_url;

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {data?.avatar_url && (
            <Link to={`/profile/${data.user_id}`}>
              <img
                height={48}
                width={48}
                src={avatarUrl || undefined}
                alt="投稿者のアバター"
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 hover:border-green-400 transition-colors cursor-pointer"
              />
            </Link>
          )}
          <h2 className="text-6xl font-bold bg-gradient-to-r from-green-600 to-green-200 bg-clip-text text-transparent">
            {data.title}
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          {/* 削除ボタン（投稿者のみ表示） */}
          {isPostOwner && (
            <div className="relative">
              {!showDeleteConfirm ? (
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 border border-red-200"
                  title="投稿を削除"
                >
                  <Trash2 size={20} />
                </button>
              ) : (
                <div className="flex items-center space-x-2 bg-white border border-red-200 rounded-lg p-2">
                  <span className="text-sm text-red-600">
                    投稿を削除しますか？
                  </span>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                  >
                    {isDeleting ? "削除中..." : "削除"}
                  </button>
                  <button
                    onClick={handleDeleteCancel}
                    disabled={isDeleting}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 rounded border border-gray-300"
                  >
                    キャンセル
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ブックマークボタン */}
          <BookmarkButton postId={postId} size="lg" />
        </div>
      </div>

      {/* 投票期限の時計表示 */}
      <VoteDeadline
        data={data}
        showPersuasionButton={showPersuasionButton}
        handlePersuasionModal={handlePersuasionModal}
        postId={postId}
      />

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

      <VoteButton
        postId={postId}
        voteDeadline={data.vote_deadline}
        postTitle={data.title}
        targetVoteChoice={data.target_vote_choice}
        userVoteOnParent={userVoteChoice}
      />
      <CommentSection postId={postId} voteDeadline={data.vote_deadline} />

      {/* AI分析セクション */}
      <AIAnalysisSection postId={postId} voteDeadline={data.vote_deadline} />

      {/* 派生質問セクション */}
      <NestedPostSection
        data={data}
        user={user}
        showCreateNested={showCreateNested}
        setShowCreateNested={setShowCreateNested}
        nestedPosts={nestedPosts}
        isPostOwner={isPostOwner}
        userVoteChoice={userVoteChoice}
      />

      {/* 派生質問作成ダイアログ */}
      <CreateNestedPostDialog
        open={showCreateNested}
        onOpenChange={setShowCreateNested}
        setShowCreateNested={setShowCreateNested}
        data={data}
        postId={postId}
        handleNestedPostCreate={handleNestedPostCreate}
      />

      {/* 説得コメントモーダル */}
      <CreatePersuasionDialog
        open={showPersuasionModal}
        onOpenChange={setShowPersuasionModal}
        persuasionContent={persuasionContent}
        setPersuasionContent={setPersuasionContent}
        handlePersuasionSubmit={handlePersuasionSubmit}
        handleCloseModal={handleCloseModal}
        showPersuasionModal={showPersuasionModal}
        persuasionCommentMutation={persuasionCommentMutation}
      />
    </div>
  );
};

export default PostDetail;
