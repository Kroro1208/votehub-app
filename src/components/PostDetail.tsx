import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import type { PostType } from "./PostList";
import VoteButton from "./VoteButton";
import CommentSection from "./CommentSection";
import { useAtomValue } from "jotai";
import { mostVotedCommentAtomFamily } from "../stores/CommentVoteAtom";
import { useState, useEffect } from "react";

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

  // 最も投票の多いコメント情報を取得
  const mostVotedInfo = useAtomValue(mostVotedCommentAtomFamily)[postId] || {
    commentId: null,
    votes: 0,
  };
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
      <img
        src={data.image_url}
        alt={data.title}
        className="mt-4 rounded object-cover w-full h-64"
      />
      <p className="text-gray-400">{data?.content}</p>
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

      <VoteButton postId={postId} />
      <CommentSection postId={postId} />
    </div>
  );
};

export default PostDetail;
