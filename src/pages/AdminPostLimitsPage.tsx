import { useState, useEffect } from "react";
import { supabase } from "../supabase-client";
import { useAuth } from "../hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import {
  Users,
  TrendingUp,
  Settings,
  RefreshCw,
  Crown,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";

interface UserMembership {
  id: number;
  user_id: string;
  membership_type: string;
  daily_post_limit: number;
  priority_tickets: number;
  created_at: string;
  updated_at: string;
}

interface DailyStats {
  total_users: number;
  active_users_today: number;
  total_posts_today: number;
  limit_removals_today: number;
}

interface PostLimitStats {
  user_id: string;
  membership_type: string;
  daily_limit: number;
  current_count: number;
  limit_removed_count: number;
  remaining_posts: number;
}

const AdminPostLimitsPage = () => {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<UserMembership[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [postLimitStats, setPostLimitStats] = useState<PostLimitStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchUserId, setSearchUserId] = useState("");
  const [selectedMembershipType, setSelectedMembershipType] = useState("");

  // 管理者権限チェック（実装に応じて調整）
  const isAdmin = user?.email === "admin@example.com"; // 実際の管理者判定ロジックに置き換え

  // データ取得
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 会員情報取得
      const { data: membershipData, error: membershipError } = await supabase
        .from("user_memberships")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(100);

      if (membershipError) throw membershipError;
      setMemberships(membershipData || []);

      // 日次統計取得
      const today = new Date().toISOString().split("T")[0];

      const { data: statsData, error: statsError } = await supabase.rpc(
        "get_daily_post_limit_stats",
        { p_date: today },
      );

      if (!statsError && statsData) {
        setDailyStats(statsData[0]);
      }

      // アクティブユーザーの投稿制限状況取得
      const { data: limitStatsData, error: limitStatsError } = await supabase
        .from("daily_post_counts")
        .select(
          `
          user_id,
          post_count,
          limit_removed_count,
          user_memberships!inner(membership_type, daily_post_limit)
        `,
        )
        .eq("post_date", today)
        .order("post_count", { ascending: false })
        .limit(50);

      if (!limitStatsError && limitStatsData) {
        const formattedStats: PostLimitStats[] = limitStatsData.map(
          (item: any) => ({
            user_id: item.user_id,
            membership_type: item.user_memberships.membership_type,
            daily_limit:
              item.user_memberships.daily_post_limit + item.limit_removed_count,
            current_count: item.post_count,
            limit_removed_count: item.limit_removed_count,
            remaining_posts: Math.max(
              0,
              item.user_memberships.daily_post_limit +
                item.limit_removed_count -
                item.post_count,
            ),
          }),
        );
        setPostLimitStats(formattedStats);
      }
    } catch (error) {
      console.error("データ取得エラー:", error);
      toast.error("データの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  // 会員タイプ更新
  const updateMembershipType = async (userId: string, newType: string) => {
    try {
      const limits = {
        free: 3,
        standard: 5,
        platinum: 15,
        diamond: 999999,
      };

      const tickets = {
        free: 0,
        standard: 3,
        platinum: 10,
        diamond: 30,
      };

      const { error } = await supabase
        .from("user_memberships")
        .update({
          membership_type: newType,
          daily_post_limit: limits[newType as keyof typeof limits],
          priority_tickets: tickets[newType as keyof typeof tickets],
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("会員タイプを更新しました");
      await fetchData();
    } catch (error) {
      console.error("更新エラー:", error);
      toast.error("更新に失敗しました");
    }
  };

  // 投稿数リセット
  const resetUserPostCount = async (userId: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { error } = await supabase
        .from("daily_post_counts")
        .delete()
        .eq("user_id", userId)
        .eq("post_date", today);

      if (error) throw error;

      toast.success("投稿数をリセットしました");
      await fetchData();
    } catch (error) {
      console.error("リセットエラー:", error);
      toast.error("リセットに失敗しました");
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              アクセス権限がありません
            </h2>
            <p className="text-gray-600">
              管理者のみアクセス可能なページです。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getMembershipDisplay = (type: string) => {
    switch (type) {
      case "free":
        return {
          name: "無料",
          color: "bg-gray-100 text-gray-800",
          icon: Users,
        };
      case "standard":
        return {
          name: "スタンダード",
          color: "bg-blue-100 text-blue-800",
          icon: Sparkles,
        };
      case "platinum":
        return {
          name: "プラチナ",
          color: "bg-purple-100 text-purple-800",
          icon: Crown,
        };
      case "diamond":
        return {
          name: "ダイヤモンド",
          color: "bg-yellow-100 text-yellow-800",
          icon: Crown,
        };
      default:
        return { name: type, color: "bg-gray-100 text-gray-800", icon: Users };
    }
  };

  const filteredMemberships = memberships.filter((m) => {
    const matchesSearch =
      !searchUserId ||
      m.user_id.toLowerCase().includes(searchUserId.toLowerCase());
    const matchesType =
      !selectedMembershipType || m.membership_type === selectedMembershipType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Settings className="h-8 w-8 text-blue-600" />
                投稿制限管理ダッシュボード
              </h1>
              <p className="text-gray-600 mt-2">
                ユーザーの投稿制限状況と会員グレードを管理
              </p>
            </div>
            <Button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              更新
            </Button>
          </div>
        </div>

        {/* 統計カード */}
        {dailyStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      総ユーザー数
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {dailyStats.total_users}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      本日のアクティブユーザー
                    </p>
                    <p className="text-3xl font-bold text-blue-600">
                      {dailyStats.active_users_today}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      本日の総投稿数
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {dailyStats.total_posts_today}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      制限解除回数
                    </p>
                    <p className="text-3xl font-bold text-orange-600">
                      {dailyStats.limit_removals_today}
                    </p>
                  </div>
                  <Sparkles className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* フィルター */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="ユーザーIDで検索..."
                  value={searchUserId}
                  onChange={(e) => setSearchUserId(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <Select
                  value={selectedMembershipType}
                  onValueChange={setSelectedMembershipType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="会員タイプ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全て</SelectItem>
                    <SelectItem value="free">無料</SelectItem>
                    <SelectItem value="standard">スタンダード</SelectItem>
                    <SelectItem value="platinum">プラチナ</SelectItem>
                    <SelectItem value="diamond">ダイヤモンド</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 会員情報テーブル */}
        <Card>
          <CardHeader>
            <CardTitle>ユーザー会員情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">ユーザーID</th>
                    <th className="text-left p-4">会員タイプ</th>
                    <th className="text-left p-4">日次投稿制限</th>
                    <th className="text-left p-4">優先チケット</th>
                    <th className="text-left p-4">更新日時</th>
                    <th className="text-left p-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMemberships.map((membership) => {
                    const display = getMembershipDisplay(
                      membership.membership_type,
                    );
                    const IconComponent = display.icon;

                    return (
                      <tr
                        key={membership.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-4 font-mono text-sm">
                          {membership.user_id.substring(0, 8)}...
                        </td>
                        <td className="p-4">
                          <Badge
                            className={`${display.color} flex items-center gap-1 w-fit`}
                          >
                            <IconComponent className="h-3 w-3" />
                            {display.name}
                          </Badge>
                        </td>
                        <td className="p-4">{membership.daily_post_limit}</td>
                        <td className="p-4">{membership.priority_tickets}</td>
                        <td className="p-4 text-sm text-gray-600">
                          {new Date(membership.updated_at).toLocaleDateString(
                            "ja-JP",
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Select
                              value={membership.membership_type}
                              onValueChange={(value) =>
                                updateMembershipType(membership.user_id, value)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">無料</SelectItem>
                                <SelectItem value="standard">
                                  スタンダード
                                </SelectItem>
                                <SelectItem value="platinum">
                                  プラチナ
                                </SelectItem>
                                <SelectItem value="diamond">
                                  ダイヤモンド
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                resetUserPostCount(membership.user_id)
                              }
                            >
                              リセット
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPostLimitsPage;
