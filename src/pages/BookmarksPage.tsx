import React from "react";

import { useBookmarks } from "../hooks/useBookmarks.ts";
import { useAuth } from "../hooks/useAuth.ts";
import Loading from "../components/Loading.tsx";
import ErrorMessage from "../components/ErrorMessage.tsx";
import PostItem from "../components/Post/PostItem.tsx";
import { Bookmark, BookmarkCheck } from "lucide-react";

const BookmarksPage = () => {
  const { user } = useAuth();
  const { bookmarkedPosts, isBookmarksLoading, bookmarksError } =
    useBookmarks();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ログインが必要です
          </h2>
          <p className="text-gray-500">
            ブックマークを表示するにはログインしてください
          </p>
        </div>
      </div>
    );
  }

  if (isBookmarksLoading) return <Loading />;
  if (bookmarksError) return <ErrorMessage error={bookmarksError} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <BookmarkCheck size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              お気に入りブックマーク
            </h1>
          </div>
          <p className="text-slate-600 ml-13">保存した投稿を確認できます</p>
        </div>

        {/* Content */}
        {Array.isArray(bookmarkedPosts) && bookmarkedPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {bookmarkedPosts.map((post) => {
              const { communities, ...rest } = post;
              const fixedCommunities = communities
                ? { id: communities.id, name: communities.name }
                : undefined;
              return (
                <PostItem
                  key={post.id}
                  post={{ ...rest, communities: fixedCommunities }}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bookmark size={40} className="text-yellow-500" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-3">
              ブックマークがありません
            </h3>
            <p className="text-slate-600 mb-6">
              気になる投稿を見つけたら、ブックマークボタンを押して保存しましょう！
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarksPage;
