import React from "react";

import { useAtomValue } from "jotai";
import { postsAtom } from "../stores/PostAtom.ts";
import { PostType } from "./Post/PostList.tsx";
import { useHandlePost } from "../hooks/useHandlePost.ts";
import { useTagRanking } from "../hooks/useTagRanking.ts";
import { Link } from "react-router";

const RightPanel = () => {
  const posts = useAtomValue(postsAtom);
  const {
    data: tagRanking,
    isPending: isTagLoading,
    error: tagError,
  } = useTagRanking(5);
  const urgentPost = posts
    .filter((post) => {
      if (!post.vote_deadline) return false;
      const deadline = new Date(post.vote_deadline);
      const now = new Date();
      const oneDayBeforeDeadline = new Date(
        deadline.getTime() - 24 * 60 * 60 * 1000,
      );
      return now >= oneDayBeforeDeadline && now < deadline;
    })
    .sort((a, b) => {
      const deadlineA = new Date(a.vote_deadline!).getTime();
      const deadlineB = new Date(b.vote_deadline!).getTime();
      return deadlineA - deadlineB;
    })
    .slice(0, 5); // 最大5件

  const UrgentPostItem = ({ post }: { post: PostType }) => {
    const { getTimeRemaining } = useHandlePost(post);
    const timeRemaining = getTimeRemaining();
    return (
      <Link to={`/post/${post.id}`} className="block group">
        <div className="text-sm">
          <p className="text-slate-800 font-medium">{post.title}</p>
          <p className="text-orange-600 text-xs">残り {timeRemaining}</p>
        </div>
      </Link>
    );
  };

  return (
    <div className="fixed right-6 top-32 w-72 hidden xl:block">
      <div className="bg-yellow-100 rounded-xl shadow-sm border border-slate-200 p-4 mb-2">
        <h3 className="font-semibold text-slate-800 mb-3">
          🔥 トレンドトピック
        </h3>
        <div>
          {isTagLoading ? (
            <p className="text-sm text-slate-500">読み込み中...</p>
          ) : tagError ? (
            <div className="text-sm text-red-500">
              <p>データ取得エラー</p>
              <p className="text-xs">{tagError.message}</p>
            </div>
          ) : tagRanking && tagRanking.length > 0 ? (
            tagRanking.map((tag) => (
              <Link
                key={tag.id}
                to={`/tags/${tag.id}/posts`}
                className="flex items-center justify-between hover:bg-slate-50 p-2 rounded-lg transition-colors group"
              >
                <span className="text-sm text-slate-600 group-hover:text-slate-800">
                  #{tag.name}
                </span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                  {tag.vote_count}票
                </span>
              </Link>
            ))
          ) : (
            <p className="text-sm text-slate-500">トレンドタグがありません</p>
          )}
        </div>
      </div>

      <div className="bg-yellow-100 rounded-xl shadow-sm border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-800 mb-3">⏰ 終了間近</h3>
        <div className="space-y-3">
          {urgentPost.length > 0 ? (
            urgentPost.map((post) => (
              <UrgentPostItem key={post.id} post={post} />
            ))
          ) : (
            <p className="text-sm text-slate-500">終了間近の投稿はありません</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
