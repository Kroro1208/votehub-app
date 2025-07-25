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
import { Shield, Smartphone, Key, AlertTriangle } from "lucide-react";

interface TwoFAVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const TwoFAVerificationModal = ({
  isOpen,
  onClose,
  onSuccess,
  title = "2FA認証",
  description = "続行するには2要素認証が必要です",
}: TwoFAVerificationModalProps) => {
  const [verificationMethod, setVerificationMethod] = useState<
    "totp" | "backup"
  >("totp");
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { verifyTOTP, verifyBackupCode } = use2FA();

  const handleVerification = async () => {
    if (!code.trim()) {
      toast.error("認証コードを入力してください");
      return;
    }

    setIsVerifying(true);
    try {
      let isValid = false;

      if (verificationMethod === "totp") {
        if (code.length !== 6) {
          toast.error("認証コードは6桁で入力してください");
          return;
        }
        isValid = await verifyTOTP(code);
      } else {
        // バックアップコードは8桁の英数字
        if (code.length !== 8) {
          toast.error("バックアップコードは8桁で入力してください");
          return;
        }
        isValid = await verifyBackupCode(code);
      }

      if (isValid) {
        setCode("");
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("2FA verification error:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleMethodChange = (method: "totp" | "backup") => {
    setVerificationMethod(method);
    setCode("");
  };

  const handleClose = () => {
    setCode("");
    setVerificationMethod("totp");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 認証方法選択 */}
          <div className="flex gap-2">
            <Button
              variant={verificationMethod === "totp" ? "default" : "outline"}
              size="sm"
              onClick={() => handleMethodChange("totp")}
              className="flex-1 flex items-center gap-2"
            >
              <Smartphone className="h-4 w-4" />
              認証アプリ
            </Button>
            <Button
              variant={verificationMethod === "backup" ? "default" : "outline"}
              size="sm"
              onClick={() => handleMethodChange("backup")}
              className="flex-1 flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              バックアップ
            </Button>
          </div>

          {/* TOTP認証 */}
          {verificationMethod === "totp" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Smartphone className="h-5 w-5 text-blue-500 mt-1" />
                <div>
                  <h4 className="font-medium text-blue-800">
                    認証アプリを使用
                  </h4>
                  <p className="text-sm text-blue-600">
                    Google
                    Authenticatorやその他の認証アプリに表示される6桁のコードを入力してください
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totp-code">認証コード（6桁）</Label>
                <Input
                  id="totp-code"
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="text-center text-lg font-mono"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* バックアップコード認証 */}
          {verificationMethod === "backup" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-1" />
                <div>
                  <h4 className="font-medium text-orange-800">
                    バックアップコードを使用
                  </h4>
                  <p className="text-sm text-orange-600">
                    認証アプリが利用できない場合のバックアップコードを入力してください。各コードは1回のみ使用可能です。
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-code">バックアップコード（8桁）</Label>
                <Input
                  id="backup-code"
                  type="text"
                  maxLength={8}
                  value={code}
                  onChange={(e) =>
                    setCode(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                    )
                  }
                  placeholder="ABC12345"
                  className="text-center text-lg font-mono"
                  autoFocus
                />
                <p className="text-xs text-gray-500">
                  英数字8桁のコードを入力してください
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
          <Button
            onClick={handleVerification}
            disabled={
              isVerifying ||
              !code.trim() ||
              (verificationMethod === "totp" && code.length !== 6) ||
              (verificationMethod === "backup" && code.length !== 8)
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isVerifying ? "認証中..." : "認証"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
