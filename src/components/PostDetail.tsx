import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import type { PostType } from "./PostList";
import VoteButton from "./VoteButton";
import CommentSection from "./CommentSection";
import { useAtomValue } from "jotai";
import { mostVotedCommentAtomFamily } from "../stores/CommentVoteAtom";
import { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";

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

const PostDetail = ({ postId }: Props) => {
  const { data, error, isPending } = useQuery<PostType, Error>({
    queryKey: ["post", postId],
    queryFn: () => fetchPostById(postId),
  });

  // 投票期限をチェックする
  const isVotingExpired = () => {
    if (!data?.vote_deadline) return false;
    return new Date() > new Date(data.vote_deadline);
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
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
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

  // 最も投票の多いコメント情報を取得
  const mostVotedInfo = useAtomValue(mostVotedCommentAtomFamily)[postId] || {
    commentId: null,
    votes: 0,
  };

  // 最もリアクションの多いコメントを管理する
  const [mostVotedComment, setMostVotedComment] = useState<Comment | null>(
    null
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
              : "bg-gradient-to-r from-blue-100 to-blue-200 border-l-4 border-blue-500"
          }`}
        >
          <div className="flex items-center justify-between">
            {/* 左側：時計アイコンとタイトル */}
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-full shadow-md ${
                  votingExpired ? "bg-red-500" : "bg-blue-500"
                }`}
              >
                <Clock size={28} className="text-white" />
              </div>
              <div>
                <h3
                  className={`text-xl font-bold ${
                    votingExpired ? "text-red-800" : "text-blue-800"
                  }`}
                >
                  {votingExpired ? "投票終了" : "投票受付中"}
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
                  <div className="text-3xl font-bold text-blue-600 bg-white rounded-lg px-3 py-2 shadow-sm min-w-[60px]">
                    {timeRemaining.days || 0}
                  </div>
                  <div className="text-xs font-medium text-gray-600 mt-1">
                    日
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">:</div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 bg-white rounded-lg px-3 py-2 shadow-sm min-w-[60px]">
                    {timeRemaining.hours}
                  </div>
                  <div className="text-xs font-medium text-gray-600 mt-1">
                    時間
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">:</div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 bg-white rounded-lg px-3 py-2 shadow-sm min-w-[60px]">
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
    </div>
  );
};

export default PostDetail;
