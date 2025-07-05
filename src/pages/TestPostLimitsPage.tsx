import React, { useState } from "react";
import { usePostLimits } from "../hooks/usePostLimits";
import { useAuth } from "../hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import {
  Users,
  Sparkles,
  Crown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

const TestPostLimitsPage: React.FC = () => {
  const { user } = useAuth();
  const {
    postLimitStatus,
    isLoading,
    error,
    checkPostLimit,
    incrementPostCount,
    removePostLimitWithPoints,
    updateMembershipType,
    getPostLimitRemovalHistory,
    getTodayLimitRemovalCount,
  } = usePostLimits();

  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ]);
  };

  const runTests = async () => {
    if (!user) {
      addTestResult("❌ ユーザーがログインしていません");
      return;
    }

    setIsRunningTests(true);
    setTestResults([]);

    try {
      // 1. 投稿制限状況をチェック
      addTestResult("🔍 投稿制限状況をチェック中...");
      const status = await checkPostLimit();
      if (status) {
        addTestResult(
          `✅ 制限チェック成功: ${status.currentCount}/${status.dailyLimit} (残り: ${status.remainingPosts})`,
        );
      } else {
        addTestResult("❌ 制限チェック失敗");
      }

      // 2. 投稿数を増加させるテスト
      if (status && status.canPost) {
        addTestResult("📝 投稿数増加テスト実行中...");
        const incrementResult = await incrementPostCount();
        if (incrementResult) {
          addTestResult("✅ 投稿数増加成功");
        } else {
          addTestResult("❌ 投稿数増加失敗");
        }

        // 再度制限をチェック
        const newStatus = await checkPostLimit();
        if (newStatus) {
          addTestResult(
            `✅ 更新後の制限: ${newStatus.currentCount}/${newStatus.dailyLimit} (残り: ${newStatus.remainingPosts})`,
          );
        }
      } else {
        addTestResult(
          "⚠️ 投稿制限に達しているため、投稿数増加テストをスキップ",
        );
      }

      // 3. 制限解除回数を取得
      const removalCount = await getTodayLimitRemovalCount();
      addTestResult(`📊 今日の制限解除回数: ${removalCount}`);

      // 4. 制限解除履歴を取得
      const history = await getPostLimitRemovalHistory(5);
      addTestResult(`📜 制限解除履歴: ${history.length}件`);
    } catch (error) {
      addTestResult(
        `❌ テスト中にエラーが発生: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsRunningTests(false);
    }
  };

  const testRemoveLimit = async () => {
    if (!user) return;

    addTestResult("💰 ポイントで制限解除をテスト中...");
    const result = await removePostLimitWithPoints(30);
    if (result) {
      if (result.success) {
        addTestResult(`✅ 制限解除成功: ${result.message}`);
      } else {
        addTestResult(`❌ 制限解除失敗: ${result.message}`);
      }
    } else {
      addTestResult("❌ 制限解除結果が取得できませんでした");
    }
  };

  const testMembershipUpdate = async (
    membershipType: "free" | "standard" | "platinum" | "diamond",
  ) => {
    addTestResult(`👑 会員グレードを${membershipType}に変更中...`);
    const success = await updateMembershipType(membershipType);
    if (success) {
      addTestResult(`✅ 会員グレード変更成功: ${membershipType}`);
    } else {
      addTestResult(`❌ 会員グレード変更失敗: ${membershipType}`);
    }
  };

  const getMembershipIcon = (membershipType: string) => {
    switch (membershipType) {
      case "free":
        return <Users className="h-4 w-4" />;
      case "standard":
        return <Sparkles className="h-4 w-4" />;
      case "platinum":
        return <Crown className="h-4 w-4" />;
      case "diamond":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getMembershipBadgeColor = (membershipType: string) => {
    switch (membershipType) {
      case "free":
        return "bg-gray-100 text-gray-800";
      case "standard":
        return "bg-blue-100 text-blue-800";
      case "platinum":
        return "bg-purple-100 text-purple-800";
      case "diamond":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            この機能をテストするにはログインが必要です。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          投稿制限機能テスト
        </h1>
        <p className="text-gray-600">Issue #34 - 投稿制限の実装テスト画面</p>
      </div>

      {/* 現在の制限状況 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            現在の投稿制限状況
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>読み込み中...</span>
            </div>
          ) : error ? (
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : postLimitStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {getMembershipIcon(postLimitStatus.membershipType)}
                  <span className="font-medium">会員グレード</span>
                </div>
                <Badge
                  className={getMembershipBadgeColor(
                    postLimitStatus.membershipType,
                  )}
                >
                  {postLimitStatus.membershipType}
                </Badge>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-800 mb-1">
                  今日の投稿数
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {postLimitStatus.currentCount}
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="font-medium text-purple-800 mb-1">制限数</div>
                <div className="text-2xl font-bold text-purple-600">
                  {postLimitStatus.dailyLimit}
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="font-medium text-green-800 mb-1">残り投稿</div>
                <div className="text-2xl font-bold text-green-600">
                  {postLimitStatus.remainingPosts}
                </div>
              </div>
            </div>
          ) : (
            <p>制限情報が取得できませんでした</p>
          )}

          {postLimitStatus && (
            <div className="mt-4 flex items-center gap-2">
              {postLimitStatus.canPost ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  投稿可能
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">
                  <XCircle className="h-3 w-3 mr-1" />
                  制限到達
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* テスト操作 */}
      <Card>
        <CardHeader>
          <CardTitle>テスト操作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              onClick={runTests}
              disabled={isRunningTests}
              className="w-full"
            >
              {isRunningTests ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              総合テスト実行
            </Button>

            <Button
              onClick={testRemoveLimit}
              variant="outline"
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              制限解除テスト
            </Button>

            <Button
              onClick={() => checkPostLimit()}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              状況再取得
            </Button>
          </div>

          {/* 会員グレード変更テスト */}
          <div>
            <h4 className="font-medium mb-2">会員グレード変更テスト</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <Button
                onClick={() => testMembershipUpdate("free")}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Users className="h-3 w-3 mr-1" />
                無料
              </Button>
              <Button
                onClick={() => testMembershipUpdate("standard")}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                スタンダード
              </Button>
              <Button
                onClick={() => testMembershipUpdate("platinum")}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Crown className="h-3 w-3 mr-1" />
                プラチナ
              </Button>
              <Button
                onClick={() => testMembershipUpdate("diamond")}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Crown className="h-3 w-3 mr-1 text-yellow-500" />
                ダイヤモンド
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* テスト結果 */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>テスト結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {testResults.join("\n")}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestPostLimitsPage;
