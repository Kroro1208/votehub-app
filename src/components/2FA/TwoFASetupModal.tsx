import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { use2FA } from "../../hooks/use2FA";
import { toast } from "react-toastify";
import {
  Copy,
  Download,
  Shield,
  Smartphone,
  AlertTriangle,
} from "lucide-react";

interface TwoFASetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TwoFASetupModal = ({ isOpen, onClose }: TwoFASetupModalProps) => {
  const [step, setStep] = useState<"setup" | "verify" | "backup">("setup");
  const [verificationCode, setVerificationCode] = useState("");
  const { setupTwoFA, enableTwoFA, setupData, isSettingUp, isEnabling } =
    use2FA();

  const handleSetupStart = () => {
    setupTwoFA();
    setStep("verify");
  };

  const handleVerifyAndEnable = async () => {
    if (!setupData || !verificationCode) {
      toast.error("認証コードを入力してください");
      return;
    }

    if (verificationCode.length !== 6) {
      toast.error("認証コードは6桁で入力してください");
      return;
    }

    try {
      await enableTwoFA({
        secret: setupData.secret,
        backupCodes: setupData.backupCodes,
        verificationCode: verificationCode,
      });
      setStep("backup");
    } catch {
      // エラーは hook 内で処理される
    }
  };

  const handleCopyBackupCodes = () => {
    if (setupData?.backupCodes) {
      const codesText = setupData.backupCodes.join("\n");
      navigator.clipboard.writeText(codesText);
      toast.success("バックアップコードをクリップボードにコピーしました");
    }
  };

  const handleDownloadBackupCodes = () => {
    if (setupData?.backupCodes) {
      const codesText = setupData.backupCodes.join("\n");
      const blob = new Blob([codesText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "votehub-backup-codes.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("バックアップコードをダウンロードしました");
    }
  };

  const handleComplete = () => {
    setStep("setup");
    setVerificationCode("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        {step === "setup" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                2FA（二要素認証）を設定
              </DialogTitle>
              <DialogDescription>
                アカウントのセキュリティを強化するために2FAを設定します
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Smartphone className="h-5 w-5 text-blue-500 mt-1" />
                <div>
                  <h4 className="font-medium text-blue-800">
                    認証アプリが必要です
                  </h4>
                  <p className="text-sm text-blue-600">
                    Google Authenticator、Authy、Microsoft Authenticator など
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">設定手順:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside text-gray-600">
                  <li>認証アプリをスマートフォンにインストール</li>
                  <li>次の画面でQRコードをスキャン</li>
                  <li>アプリに表示される6桁のコードを入力</li>
                  <li>バックアップコードを安全に保存</li>
                </ol>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button
                onClick={handleSetupStart}
                disabled={isSettingUp}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSettingUp ? "準備中..." : "設定を開始"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "verify" && setupData && (
          <>
            <DialogHeader>
              <DialogTitle>QRコードをスキャン</DialogTitle>
              <DialogDescription>
                認証アプリでQRコードをスキャンし、表示されるコードを入力してください
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <img
                  src={setupData.qrCodeUrl}
                  alt="2FA QR Code"
                  className="border rounded-lg"
                />
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  QRコードをスキャンできない場合は、こちらのキーを手動で入力:
                </p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                  {setupData.secret}
                </code>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-code">認証コード（6桁）</Label>
                <Input
                  id="verification-code"
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="123456"
                  className="text-center text-lg font-mono"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("setup")}>
                戻る
              </Button>
              <Button
                onClick={handleVerifyAndEnable}
                disabled={isEnabling || verificationCode.length !== 6}
                className="bg-green-600 hover:bg-green-700"
              >
                {isEnabling ? "検証中..." : "認証して有効化"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "backup" && setupData && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                バックアップコードを保存
              </DialogTitle>
              <DialogDescription>
                これらのコードは一度だけ表示されます。安全な場所に保存してください。
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium">重要な注意事項:</p>
                    <ul className="mt-1 space-y-1 list-disc list-inside">
                      <li>各コードは1回のみ使用可能</li>
                      <li>認証アプリが使用できない時の緊急用</li>
                      <li>安全な場所（パスワードマネージャーなど）に保存</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>バックアップコード（10個）</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyBackupCodes}
                      className="flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      コピー
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadBackupCodes}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      保存
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 p-3 bg-gray-50 rounded-lg font-mono text-sm">
                  {setupData.backupCodes.map((code, index) => (
                    <div key={index} className="text-center py-1">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleComplete}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                保存完了、2FAを有効化
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
