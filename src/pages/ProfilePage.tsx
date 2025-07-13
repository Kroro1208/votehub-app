import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth.ts";
import { supabase } from "../supabase-client.ts";
import ErrorMessage from "../components/ErrorMessage.tsx";
import Loading from "../components/Loading.tsx";
import type { PostType } from "../components/Post/PostList.tsx";
import {
  Users,
  Calendar,
  TrendingUp,
  MessageCircle,
  Settings,
  Award,
} from "lucide-react";
import PostItem from "../components/Post/PostItem.tsx";
import { useUserEmpathyPoints } from "../hooks/useEmpathyPoints.ts";
import { useUserQualityScore } from "../hooks/useQualityScore.ts";
import {
  useUserEmpathyScore,
  useEmpathyRanking,
} from "../hooks/useEmpathyScore.ts";
import QualityScoreDisplay from "../components/Profile/QualityScoreDisplay.tsx";
import EmpathyPointsDisplay from "../components/Profile/EmpathyPointsDisplay.tsx";
import { calculateAllExistingScores } from "../utils/calculateExistingScores.ts";
import { Button } from "../components/ui/button.tsx";
import { RefreshCw } from "lucide-react";
import { toast } from "react-toastify";

interface UserStats {
  postCount: number;
  totalVotes: number;
  totalComments: number;
  joinDate: string;
}

const getUserPosts = async (userId: string): Promise<PostType[]> => {
  const { data, error } = await supabase
    .rpc("get_posts_with_counts")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

const getUserStats = async (userId: string): Promise<UserStats> => {
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id, created_at")
    .eq("user_id", userId);

  if (postsError) throw new Error(postsError.message);

  const { data: votes, error: votesError } = await supabase
    .from("votes")
    .select("id")
    .eq("user_id", userId);

  if (votesError) throw new Error(votesError.message);

  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select("id")
    .eq("user_id", userId);

  if (commentsError) throw new Error(commentsError.message);

  const joinDate =
    posts.length > 0
      ? new Date(
          Math.min(...posts.map((p) => new Date(p.created_at).getTime())),
        )
      : new Date();

  return {
    postCount: posts.length,
    totalVotes: votes.length,
    totalComments: comments.length,
    joinDate: joinDate.toISOString(),
  };
};

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();

  const targetUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  const {
    data: userPosts,
    isPending: postsLoading,
    error: postsError,
  } = useQuery<PostType[], Error>({
    queryKey: ["userPosts", targetUserId],
    queryFn: () => getUserPosts(targetUserId!),
    enabled: !!targetUserId,
  });

  const {
    data: userStats,
    isPending: statsLoading,
    error: statsError,
  } = useQuery<UserStats, Error>({
    queryKey: ["userStats", targetUserId],
    queryFn: () => getUserStats(targetUserId!),
    enabled: !!targetUserId,
  });

  // 共感ポイントを取得（既存）
  const { data: empathyData, isPending: empathyLoading } =
    useUserEmpathyPoints(targetUserId);

  // 品質度スコアを取得
  const { data: qualityData, isPending: qualityLoading } =
    useUserQualityScore(targetUserId);

  // 新しい共感ポイントシステムを取得
  const { data: empathyScoreData, isPending: empathyScoreLoading } =
    useUserEmpathyScore(targetUserId);

  // 共感ランキングを取得
  const { data: empathyRankingData, isPending: empathyRankingLoading } =
    useEmpathyRanking(targetUserId);

  // スコア計算の実行
  const handleCalculateScores = async () => {
    toast.info("スコア計算を開始しています...");

    try {
      const result = await calculateAllExistingScores();

      if (result.qualityResult.success && result.empathyResult.success) {
        toast.success("スコア計算が完了しました！ページを更新してください。");
      } else {
        toast.error("スコア計算中にエラーが発生しました。");
      }
    } catch (error) {
      console.error("Score calculation error:", error);
      toast.error("スコア計算に失敗しました。");
    }
  };

  if (!targetUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            プロフィールが見つかりません
          </h2>
          <p className="text-gray-500">
            ログインしてプロフィールを表示してください
          </p>
        </div>
      </div>
    );
  }

  if (
    postsLoading ||
    statsLoading ||
    empathyLoading ||
    qualityLoading ||
    empathyScoreLoading
  )
    return <Loading />;
  if (postsError) return <ErrorMessage error={postsError} />;
  if (statsError) return <ErrorMessage error={statsError} />;

  const profileUser = isOwnProfile ? user : null;
  const displayName =
    profileUser?.user_metadata?.full_name ||
    profileUser?.user_metadata?.user_name ||
    profileUser?.email ||
    "ユーザー";
  const avatarUrl = profileUser?.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* プロフィールヘッダー */}
        <div className="bg-yellow-100 rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start gap-6">
            {/* アバター */}
            <div className="flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* ユーザー情報 */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {displayName}
                {isOwnProfile && (
                  <span className="ml-2 text-lg font-normal text-gray-500">
                    (あなた)
                  </span>
                )}
              </h1>

              {profileUser?.email && (
                <p className="text-gray-600 mb-2">{profileUser.email}</p>
              )}

              {/* Settings Link for Own Profile */}
              {isOwnProfile && (
                <Link
                  to="/settings"
                  className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
                >
                  <Settings size={14} />
                  <span>プロフィールを編集</span>
                </Link>
              )}

              {/* 統計情報 */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-gray-100 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp size={16} className="text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {userStats?.postCount || 0}
                  </div>
                  <div className="text-sm text-gray-500">投稿</div>
                </div>

                <div className="text-center p-3 bg-gray-100 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Users size={16} className="text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {userStats?.totalVotes || 0}
                  </div>
                  <div className="text-sm text-gray-500">投票</div>
                </div>

                <div className="text-center p-3 bg-gray-100 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <MessageCircle size={16} className="text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {userStats?.totalComments || 0}
                  </div>
                  <div className="text-sm text-gray-500">コメント</div>
                </div>

                {/* 共感ランキング */}
                {empathyData?.empathy_rank && (
                  <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-100">
                    <div className="flex items-center justify-center mb-1">
                      <Award size={16} className="text-yellow-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      #{empathyData.empathy_rank}
                    </div>
                    <div className="text-sm text-gray-500">共感ランク</div>
                  </div>
                )}

                <div className="text-center p-3 bg-gray-100 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar size={16} className="text-gray-500" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {userStats?.joinDate
                      ? new Date(userStats.joinDate).toLocaleDateString(
                          "ja-JP",
                          {
                            year: "numeric",
                            month: "short",
                          },
                        )
                      : "---"}
                  </div>
                  <div className="text-sm text-gray-500">参加</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* スコア計算ボタン（管理者用） */}
        {isOwnProfile && (
          <div className="mb-6">
            <Button
              onClick={handleCalculateScores}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              <RefreshCw size={16} />
              既存投稿のスコア計算
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              ※ 過去の投稿の品質度スコアと共感ポイントを計算します
            </p>
          </div>
        )}

        {/* 品質度スコアと共感ポイント表示 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <QualityScoreDisplay
            qualityData={qualityData || null}
            isLoading={qualityLoading}
          />
          <EmpathyPointsDisplay
            empathyData={empathyScoreData || null}
            rankingData={empathyRankingData || null}
            isLoading={empathyScoreLoading}
            isRankingLoading={empathyRankingLoading}
          />
        </div>

        {/* 投稿一覧 */}
        <div className="bg-yellow-100 rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {isOwnProfile ? "あなたの投稿" : `${displayName}の投稿`}
          </h2>

          {userPosts && userPosts.length > 0 ? (
            <div className="space-y-4">
              {userPosts.map((post) => (
                <PostItem key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                まだ投稿がありません
              </h3>
              <p className="text-gray-500">
                {isOwnProfile
                  ? "最初の投稿を作成してみましょう！"
                  : "このユーザーはまだ投稿していません"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
