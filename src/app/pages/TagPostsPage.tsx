"use client";
import { supabase } from "../../supabase-client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Tag } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import PostItem from "../components/Post/PostItem";
import { PostType } from "../components/Post/PostList";
import { Button } from "../components/ui/button";

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
  const params = useParams();
  const tagId = params?.["id"] as string;
  const router = useRouter();
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-red-500 dark:text-red-400">
          タグIDが指定されていません
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="戻る"
            >
              <ArrowLeft
                size={20}
                className="text-gray-600 dark:text-gray-300"
              />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
                <Tag className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
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
            <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>{posts.length}件の投稿</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>
                  {posts.reduce((sum, post) => sum + (post.vote_count || 0), 0)}
                  票
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>
                  {posts.reduce(
                    (sum, post) => sum + (post.comment_count || 0),
                    0,
                  )}
                  コメント
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ソートオプション */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-4 mb-6">
          <div className="flex gap-2">
            <Button
              onClick={() => setSortBy("newest")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                sortBy === "newest"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              新着順
            </Button>
            <Button
              onClick={() => setSortBy("popular")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                sortBy === "popular"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              人気順
            </Button>
            <Button
              onClick={() => setSortBy("deadline")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                sortBy === "deadline"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              期限順
            </Button>
          </div>
        </div>

        {/* 投稿一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isPostsLoading ? (
            <div className="col-span-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-8 text-center">
              <div className="animate-pulse flex justify-center mb-4">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                投稿を読み込み中...
              </p>
            </div>
          ) : postsError ? (
            <div className="col-span-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-8 text-center">
              <p className="text-red-500 dark:text-red-400">
                投稿の取得に失敗しました
              </p>
            </div>
          ) : sortedPosts.length === 0 ? (
            <div className="col-span-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-8 text-center">
              <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Tag className="text-white" size={32} />
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-2 font-medium">
                このタグの投稿はまだありません
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
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
