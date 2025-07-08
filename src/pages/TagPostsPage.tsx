import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "../supabase-client";
import { PostType } from "../components/Post/PostList";
import PostItem from "../components/Post/PostItem";
import { ArrowLeft, Tag } from "lucide-react";

interface TagInfo {
  id: number;
  name: string;
}

interface SupabasePostData {
  id: number;
  title: string;
  content: string;
  created_at: string;
  image_url: string;
  avatar_url: string | null;
  vote_deadline: string | null;
  community_id: number | null;
  user_id: string;
  parent_post_id: number | null;
  nest_level: number;
  target_vote_choice: number | null;
  tag_id: number | null;
  communities: {
    id: number;
    name: string;
  } | null;
  votes: Array<{
    vote: number;
  }>;
  comments: Array<{
    id: number;
  }>;
}

// タグの詳細情報を取得
const getTagInfo = async (tagId: string): Promise<TagInfo> => {
  const { data, error } = await supabase
    .from("tags")
    .select("id, name")
    .eq("id", tagId)
    .single();

  if (error) throw new Error(`タグ情報の取得に失敗しました: ${error.message}`);
  return data;
};

// タグに関連する投稿を取得
const getTagPosts = async (tagId: string): Promise<PostType[]> => {
  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      communities(id, name),
      votes(vote),
      comments(id)
    `,
    )
    .eq("tag_id", tagId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`投稿の取得に失敗しました: ${error.message}`);

  // PostType形式に変換
  return (
    data?.map(
      (post: SupabasePostData): PostType => ({
        ...post,
        vote_count: post.votes?.length || 0,
        comment_count: post.comments?.length || 0,
        communities: post.communities || undefined,
      }),
    ) || []
  );
};

const TagPostsPage = () => {
  const { tagId } = useParams<{ tagId: string }>();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "deadline">(
    "newest",
  );

  const {
    data: tagInfo,
    isPending: isTagLoading,
    error: tagError,
  } = useQuery({
    queryKey: ["tagInfo", tagId],
    queryFn: () => getTagInfo(tagId!),
    enabled: !!tagId,
  });

  const {
    data: posts,
    isPending: isPostsLoading,
    error: postsError,
  } = useQuery({
    queryKey: ["tagPosts", tagId],
    queryFn: () => getTagPosts(tagId!),
    enabled: !!tagId,
  });

  // ソート処理
  const sortedPosts = posts
    ? [...posts].sort((a, b) => {
        switch (sortBy) {
          case "popular":
            return (b.vote_count || 0) - (a.vote_count || 0);
          case "deadline":
            if (!a.vote_deadline && !b.vote_deadline) return 0;
            if (!a.vote_deadline) return 1;
            if (!b.vote_deadline) return -1;
            return (
              new Date(a.vote_deadline).getTime() -
              new Date(b.vote_deadline).getTime()
            );
          case "newest":
          default:
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
        }
      })
    : [];

  if (!tagId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">タグIDが指定されていません</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="戻る"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <Tag className="text-orange-500" size={24} />
              <h1 className="text-2xl font-bold text-gray-800">
                {isTagLoading
                  ? "読み込み中..."
                  : tagError
                    ? "エラー"
                    : `#${tagInfo?.name}`}
              </h1>
            </div>
          </div>

          {/* 統計情報 */}
          {posts && (
            <div className="flex gap-4 text-sm text-gray-600">
              <span>{posts.length}件の投稿</span>
              <span>
                {posts.reduce((sum, post) => sum + (post.vote_count || 0), 0)}票
              </span>
              <span>
                {posts.reduce(
                  (sum, post) => sum + (post.comment_count || 0),
                  0,
                )}
                コメント
              </span>
            </div>
          )}
        </div>

        {/* ソートオプション */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy("newest")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === "newest"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              新着順
            </button>
            <button
              onClick={() => setSortBy("popular")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === "popular"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              人気順
            </button>
            <button
              onClick={() => setSortBy("deadline")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === "deadline"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              期限順
            </button>
          </div>
        </div>

        {/* 投稿一覧 */}
        <div className="space-y-4">
          {isPostsLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <p className="text-gray-500">投稿を読み込み中...</p>
            </div>
          ) : postsError ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <p className="text-red-500">投稿の取得に失敗しました</p>
            </div>
          ) : sortedPosts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <Tag className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-500 mb-2">
                このタグの投稿はまだありません
              </p>
              <p className="text-sm text-gray-400">
                #{tagInfo?.name} タグを使った最初の投稿を作成してみませんか？
              </p>
            </div>
          ) : (
            sortedPosts.map((post) => <PostItem key={post.id} post={post} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default TagPostsPage;
