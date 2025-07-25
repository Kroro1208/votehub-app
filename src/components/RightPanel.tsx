import { useAtomValue } from "jotai";
import { postsAtom } from "../stores/PostAtom.ts";
import { PostType } from "./Post/PostList.tsx";
import { useHandlePost } from "../hooks/useHandlePost.ts";
import { useTagRanking } from "../hooks/useTagRanking.ts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client.ts";
import { Link } from "react-router";
import { Crown, Trophy, Medal, Award } from "lucide-react";

interface TopUserRankingData {
  user_id: string;
  total_score: number;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

// トップユーザーランキングデータを取得
const fetchTopUserRanking = async (): Promise<TopUserRankingData[]> => {
  const { data, error } = await supabase.rpc("get_user_total_ranking");
  if (error) throw new Error(error.message);
  return (data as TopUserRankingData[]).slice(0, 5); // トップ5を取得
};

const RightPanel = () => {
  const posts = useAtomValue(postsAtom);
  const {
    data: tagRanking,
    isPending: isTagLoading,
    error: tagError,
  } = useTagRanking(5);

  const {
    data: topUsers,
    isPending: isUserLoading,
    error: userError,
  } = useQuery<TopUserRankingData[], Error>({
    queryKey: ["top-user-ranking"],
    queryFn: fetchTopUserRanking,
    refetchInterval: 300000, // 5分ごとに更新
  });
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

      <div className="bg-yellow-100 rounded-xl shadow-sm border border-slate-200 p-4 mb-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Crown size={16} className="text-yellow-600" />
            トップユーザー
          </h3>
          <Link
            to="/user-ranking"
            className="text-xs text-slate-600 hover:text-slate-800 transition-colors"
          >
            全て見る →
          </Link>
        </div>
        <div className="space-y-2">
          {isUserLoading ? (
            <p className="text-sm text-slate-500">読み込み中...</p>
          ) : userError ? (
            <p className="text-sm text-red-500">エラーが発生しました</p>
          ) : topUsers && topUsers.length > 0 ? (
            topUsers.map((user: TopUserRankingData, index: number) => {
              const getRankDisplay = (rank: number) => {
                switch (rank) {
                  case 1:
                    return <Trophy size={16} className="text-yellow-500" />;
                  case 2:
                    return <Medal size={16} className="text-gray-400" />;
                  case 3:
                    return <Award size={16} className="text-orange-500" />;
                  default:
                    return (
                      <div className="w-4 h-4 flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-500">
                          {rank}
                        </span>
                      </div>
                    );
                }
              };

              return (
                <div
                  key={user.user_id}
                  className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  {/* ランク表示 - 固定幅で配置を揃える */}
                  <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                    {getRankDisplay(index + 1)}
                  </div>
                  {/* ユーザー情報 */}
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/profile/${user.user_id}`}
                          className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors truncate"
                        >
                          {user.user_metadata?.full_name || "ユーザー"}
                        </Link>
                        {/* 1-3位にはトロフィーも追加表示 */}
                        {index < 3 && (
                          <div className="flex-shrink-0">
                            {getRankDisplay(index + 1)}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {user.total_score.toLocaleString()}pt
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-500">
              ランキングデータがありません
            </p>
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
