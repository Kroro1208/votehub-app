import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";
import * as CryptoJS from "crypto-js";
import { supabase } from "../supabase-client";
import { useAuth } from "./useAuth";
import { toast } from "react-toastify";

interface TwoFAStatus {
  is_enabled: boolean;
  has_backup_codes: boolean;
  backup_codes_count: number;
  last_used_at: string | null;
  enabled_at: string | null;
}

interface TwoFASetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

// 暗号化/復号化のための秘密キー（実際の本番環境では環境変数から取得）
const ENCRYPTION_KEY =
  import.meta.env.VITE_2FA_ENCRYPTION_KEY ||
  "your-secret-encryption-key-change-this-in-production";

/**
 * 本番用のTOTP秘密キー生成
 */
const generateSecret = (): { secret: string; base32: string } => {
  const secretObj = speakeasy.generateSecret({
    name: "VoteHub",
    issuer: "VoteHub投票プラットフォーム",
    length: 32,
  });

  return {
    secret: secretObj.ascii || "",
    base32: secretObj.base32 || "",
  };
};

/**
 * 暗号化されたバックアップコードを生成
 */
const generateBackupCodes = (): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    // より強力なランダムコード生成
    const code = Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    codes.push(code);
  }
  return codes;
};

/**
 * QRコードのData URLを生成
 */
const generateQRCodeDataURL = async (
  secret: string,
  email: string,
  issuer: string = "VoteHub",
): Promise<string> => {
  const otpauth = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

  try {
    const qrCodeDataURL = await QRCode.toDataURL(otpauth, {
      errorCorrectionLevel: "H",
      type: "image/png",
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: 256,
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error("QR Code generation error:", error);
    throw new Error("QRコードの生成に失敗しました");
  }
};

/**
 * TOTPコードを検証
 */
const verifyTOTPCode = (secret: string, token: string): boolean => {
  try {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 2, // 時間窓を2に設定（前後60秒の余裕）
      step: 30, // 30秒間隔
    });
  } catch (error) {
    console.error("TOTP verification error:", error);
    return false;
  }
};

/**
 * 秘密キーを暗号化
 */
const encryptSecret = (secret: string): string => {
  try {
    return CryptoJS.AES.encrypt(secret, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error("Secret encryption error:", error);
    throw new Error("秘密キーの暗号化に失敗しました");
  }
};

/**
 * 秘密キーを復号化
 */
const decryptSecret = (encryptedSecret: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedSecret, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Secret decryption error:", error);
    throw new Error("秘密キーの復号化に失敗しました");
  }
};

/**
 * バックアップコードを暗号化
 */
const encryptBackupCodes = (codes: string[]): string[] => {
  try {
    return codes.map((code) =>
      CryptoJS.AES.encrypt(code, ENCRYPTION_KEY).toString(),
    );
  } catch (error) {
    console.error("Backup codes encryption error:", error);
    throw new Error("バックアップコードの暗号化に失敗しました");
  }
};

/**
 * バックアップコードを復号化
 */
const decryptBackupCodes = (encryptedCodes: string[]): string[] => {
  try {
    return encryptedCodes.map((encryptedCode) => {
      const bytes = CryptoJS.AES.decrypt(encryptedCode, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    });
  } catch (error) {
    console.error("Backup codes decryption error:", error);
    throw new Error("バックアップコードの復号化に失敗しました");
  }
};

// 2FA関連のカスタムフック
export const use2FA = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // 2FA状況を取得
  const {
    data: twoFAStatus,
    isLoading: isStatusLoading,
    error: statusError,
  } = useQuery<TwoFAStatus>({
    queryKey: ["2fa-status", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("ユーザーが認証されていません");

      const { data, error } = await supabase.rpc("get_user_2fa_status", {
        p_user_id: user.id,
      });

      if (error) throw new Error(error.message);
      return (
        data[0] || {
          is_enabled: false,
          has_backup_codes: false,
          backup_codes_count: 0,
          last_used_at: null,
          enabled_at: null,
        }
      );
    },
    enabled: !!user,
  });

  // 2FAセットアップ用のデータを生成
  const setupMutation = useMutation({
    mutationFn: async (): Promise<TwoFASetupData> => {
      if (!user?.email) throw new Error("ユーザー情報が不完全です");

      const secretObj = generateSecret();
      const qrCodeUrl = await generateQRCodeDataURL(
        secretObj.base32,
        user.email,
      );
      const backupCodes = generateBackupCodes();

      return {
        secret: secretObj.base32,
        qrCodeUrl,
        backupCodes,
      };
    },
    onError: (error) => {
      toast.error(`2FAセットアップの準備に失敗しました: ${error.message}`);
    },
  });

  // 2FAを有効化
  const enableMutation = useMutation({
    mutationFn: async ({
      secret,
      backupCodes,
      verificationCode,
    }: {
      secret: string;
      backupCodes: string[];
      verificationCode: string;
    }) => {
      if (!user) throw new Error("ユーザーが認証されていません");

      // 本番用: 実際にTOTPコードを検証
      const isValidCode = verifyTOTPCode(secret, verificationCode);
      if (!isValidCode) {
        throw new Error(
          "認証コードが正しくありません。Google Authenticatorで生成された6桁のコードを入力してください。",
        );
      }

      // 秘密キーとバックアップコードを暗号化
      const encryptedSecret = encryptSecret(secret);
      const encryptedBackupCodes = encryptBackupCodes(backupCodes);

      const { data, error } = await supabase.rpc("enable_user_2fa", {
        p_user_id: user.id,
        p_secret_key: encryptedSecret,
        p_backup_codes: encryptedBackupCodes,
      });

      if (error || !data) {
        throw new Error("2FAの有効化に失敗しました");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("2FAが正常に有効化されました");
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
    },
    onError: (error) => {
      toast.error(`2FAの有効化に失敗しました: ${error.message}`);
    },
  });

  // 2FAを無効化
  const disableMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("ユーザーが認証されていません");

      const { data, error } = await supabase.rpc("disable_user_2fa", {
        p_user_id: user.id,
      });

      if (error || !data) {
        throw new Error("2FAの無効化に失敗しました");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("2FAが無効化されました");
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
    },
    onError: (error) => {
      toast.error(`2FAの無効化に失敗しました: ${error.message}`);
    },
  });

  // TOTP認証（ログイン時等で使用）
  const verifyTOTP = async (code: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      if (!user) {
        throw new Error("ユーザーが認証されていません");
      }

      // ユーザーの暗号化された秘密キーを取得
      const { data: userSettings, error: settingsError } = await supabase
        .from("user_2fa_settings")
        .select("secret_key")
        .eq("user_id", user.id)
        .eq("is_enabled", true)
        .single();

      if (settingsError || !userSettings?.secret_key) {
        throw new Error("2FA設定が見つかりません");
      }

      // 秘密キーを復号化
      const decryptedSecret = decryptSecret(userSettings.secret_key);

      // TOTPコードを検証
      const isValid = verifyTOTPCode(decryptedSecret, code);

      // 2FA試行ログを記録
      await supabase.rpc("log_2fa_attempt", {
        p_user_id: user.id,
        p_attempt_type: "totp",
        p_success: isValid,
      });

      if (isValid) {
        toast.success("2FA認証が成功しました");
      } else {
        toast.error("認証コードが正しくありません");
      }

      return isValid;
    } catch (error) {
      console.error("TOTP verification error:", error);

      // 失敗ログを記録
      await supabase.rpc("log_2fa_attempt", {
        p_user_id: user?.id,
        p_attempt_type: "totp",
        p_success: false,
      });

      toast.error("2FA認証中にエラーが発生しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // バックアップコード認証
  const verifyBackupCode = async (code: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      if (!user) {
        throw new Error("ユーザーが認証されていません");
      }

      // 暗号化されたバックアップコードを取得
      const { data: userSettings, error: settingsError } = await supabase
        .from("user_2fa_settings")
        .select("backup_codes")
        .eq("user_id", user.id)
        .eq("is_enabled", true)
        .single();

      if (settingsError || !userSettings?.backup_codes) {
        throw new Error("バックアップコードが見つかりません");
      }

      // バックアップコードを復号化
      const decryptedCodes = decryptBackupCodes(userSettings.backup_codes);

      // コードが一致するかチェック
      const normalizedInputCode = code.toUpperCase().trim();
      const codeIndex = decryptedCodes.findIndex(
        (backupCode) => backupCode === normalizedInputCode,
      );

      if (codeIndex === -1) {
        // ログを記録
        await supabase.rpc("log_2fa_attempt", {
          p_user_id: user.id,
          p_attempt_type: "backup_code",
          p_success: false,
        });

        toast.error("無効なバックアップコードです");
        return false;
      }

      // 使用したバックアップコードを配列から削除
      const updatedCodes = decryptedCodes.filter(
        (_, index) => index !== codeIndex,
      );
      const encryptedUpdatedCodes = encryptBackupCodes(updatedCodes);

      // データベースを更新
      const { error: updateError } = await supabase
        .from("user_2fa_settings")
        .update({
          backup_codes: encryptedUpdatedCodes,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        throw new Error("バックアップコードの更新に失敗しました");
      }

      // 成功ログを記録
      await supabase.rpc("log_2fa_attempt", {
        p_user_id: user.id,
        p_attempt_type: "backup_code",
        p_success: true,
      });

      toast.success("バックアップコードで認証されました");

      // 残りのバックアップコードが少ない場合は警告
      if (updatedCodes.length <= 2) {
        toast.warning(
          `バックアップコードが残り${updatedCodes.length}個です。新しいコードを生成することを推奨します。`,
        );
      }

      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
      return true;
    } catch (error) {
      console.error("Backup code verification error:", error);

      // 失敗ログを記録
      await supabase.rpc("log_2fa_attempt", {
        p_user_id: user?.id,
        p_attempt_type: "backup_code",
        p_success: false,
      });

      toast.error("バックアップコード認証に失敗しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // 状態
    twoFAStatus,
    isStatusLoading,
    statusError,
    isLoading,

    // アクション
    setupTwoFA: setupMutation.mutate,
    isSettingUp: setupMutation.isPending,

    enableTwoFA: enableMutation.mutate,
    isEnabling: enableMutation.isPending,

    disableTwoFA: disableMutation.mutate,
    isDisabling: disableMutation.isPending,

    verifyTOTP,
    verifyBackupCode,

    // セットアップデータ
    setupData: setupMutation.data,
  };
};

// 2FA認証が必要かどうかを判定するヘルパー
export const useTwoFARequired = () => {
  const { twoFAStatus } = use2FA();

  return {
    isRequired: twoFAStatus?.is_enabled || false,
    hasBackupCodes: twoFAStatus?.has_backup_codes || false,
  };
};
