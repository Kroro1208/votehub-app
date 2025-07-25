import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { use2FA } from "../../hooks/use2FA";
import { TwoFASetupModal } from "./TwoFASetupModal";
import { TwoFAVerificationModal } from "./TwoFAVerificationModal";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Smartphone,
  Key,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export const TwoFASettings = () => {
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [pendingDisable, setPendingDisable] = useState(false);

  const { twoFAStatus, isStatusLoading, disableTwoFA, isDisabling } = use2FA();

  const handleEnableClick = () => {
    setIsSetupModalOpen(true);
  };

  const handleDisableClick = () => {
    setPendingDisable(true);
    setIsVerificationModalOpen(true);
  };

  const handleVerificationSuccess = () => {
    if (pendingDisable) {
      disableTwoFA();
      setPendingDisable(false);
    }
  };

  const handleVerificationClose = () => {
    setPendingDisable(false);
    setIsVerificationModalOpen(false);
  };

  if (isStatusLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            2要素認証 (2FA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            2要素認証 (2FA)
          </CardTitle>
          <CardDescription>
            アカウントのセキュリティを強化するために2要素認証を設定できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 現在のステータス */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              {twoFAStatus?.is_enabled ? (
                <ShieldCheck className="h-8 w-8 text-green-500" />
              ) : (
                <ShieldX className="h-8 w-8 text-gray-400" />
              )}
              <div>
                <h3 className="font-medium">
                  {twoFAStatus?.is_enabled ? "2FAが有効です" : "2FAが無効です"}
                </h3>
                <p className="text-sm text-gray-600">
                  {twoFAStatus?.is_enabled
                    ? "アカウントは2要素認証で保護されています"
                    : "2要素認証でアカウントのセキュリティを強化しましょう"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {twoFAStatus?.is_enabled ? (
                <Button
                  variant="destructive"
                  onClick={handleDisableClick}
                  disabled={isDisabling}
                  className="flex items-center gap-2"
                >
                  <ShieldX className="h-4 w-4" />
                  {isDisabling ? "無効化中..." : "2FAを無効化"}
                </Button>
              ) : (
                <Button
                  onClick={handleEnableClick}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <ShieldCheck className="h-4 w-4" />
                  2FAを有効化
                </Button>
              )}
            </div>
          </div>

          {/* 2FAが有効な場合の詳細情報 */}
          {twoFAStatus?.is_enabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 認証アプリ */}
                <div className="p-4 rounded-lg border bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-green-800">認証アプリ</h4>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-sm text-green-700">
                    認証アプリが設定されています
                  </p>
                  {twoFAStatus.enabled_at && (
                    <p className="text-xs text-green-600 mt-1">
                      有効化日:{" "}
                      {new Date(twoFAStatus.enabled_at).toLocaleDateString(
                        "ja-JP",
                      )}
                    </p>
                  )}
                </div>

                {/* バックアップコード */}
                <div className="p-4 rounded-lg border bg-blue-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium text-blue-800">
                      バックアップコード
                    </h4>
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-sm text-blue-700">
                    {twoFAStatus.backup_codes_count}
                    個のバックアップコードが利用可能
                  </p>
                  {twoFAStatus.backup_codes_count <= 2 && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                      <p className="text-xs text-orange-600">
                        残りわずかです。新しいコードの生成を推奨します
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 最終使用日 */}
              {twoFAStatus.last_used_at && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    最終使用:{" "}
                    {new Date(twoFAStatus.last_used_at).toLocaleString("ja-JP")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2FAが無効な場合の説明 */}
          {!twoFAStatus?.is_enabled && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">
                  2要素認証とは？
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  パスワードに加えて、スマートフォンの認証アプリで生成される6桁のコードを使用してログインする仕組みです。
                  これにより、パスワードが漏洩してもアカウントの安全性が保たれます。
                </p>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>不正アクセスからアカウントを保護</li>
                  <li>パスワード漏洩時の被害を最小限に</li>
                  <li>重要な操作時の追加認証</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-800 mb-2">
                  対応認証アプリ
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>• Google Authenticator</div>
                  <div>• Microsoft Authenticator</div>
                  <div>• Authy</div>
                  <div>• 1Password</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2FA設定モーダル */}
      <TwoFASetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
      />

      {/* 2FA認証モーダル（無効化時） */}
      <TwoFAVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={handleVerificationClose}
        onSuccess={handleVerificationSuccess}
        title="2FA無効化の確認"
        description="2要素認証を無効化するには認証が必要です"
      />
    </>
  );
};
