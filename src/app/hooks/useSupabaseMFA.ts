import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase-client";
import { useAuth } from "./useAuth";
import { toast } from "react-toastify";
import type { Factor } from "@supabase/supabase-js";

interface MFAEnrollResponse {
  id: string;
  type: string;
  factor_type: string;
  friendly_name?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

interface MFAChallenge {
  id: string;
  type: string;
  expires_at: number;
}

export const useSupabaseMFA = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [challenge, setChallenge] = useState<MFAChallenge | null>(null);

  // MFA要素一覧を取得
  const {
    data: mfaFactors,
    isLoading: isFactorsLoading,
    error: factorsError,
  } = useQuery<Factor[]>({
    queryKey: ["mfa-factors", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      return data.totp || [];
    },
    enabled: !!user,
  });

  // MFA登録を開始
  const enrollMutation = useMutation({
    mutationFn: async ({
      onSuccess,
    }: {
      factorType?: "totp";
      onSuccess?: (() => void) | undefined;
    }): Promise<{
      data: MFAEnrollResponse;
      onSuccess?: (() => void) | undefined;
    }> => {
      // 明示的なパラメータでエンロール
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "VoteHub MFA",
      });

      if (error) {
        console.error("MFA enrollment error:", error);
        throw error;
      }

      if (!data) throw new Error("MFA登録データが取得できませんでした");

      // 少し待機してサーバー側の処理を確実にする
      await new Promise((resolve) => setTimeout(resolve, 500));

      return { data: data as MFAEnrollResponse, onSuccess };
    },
    onSuccess: ({ onSuccess }) => {
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(`MFA登録の開始に失敗しました: ${error.message}`);
    },
  });

  // MFA登録を確認・完了
  const verifyEnrollMutation = useMutation({
    mutationFn: async ({
      factorId,
      code,
      onSuccess,
    }: {
      factorId: string;
      code: string;
      onSuccess?: () => void;
    }) => {
      try {
        // enrollment verification は challengeAndVerify を使用
        const { data, error } = await supabase.auth.mfa.challengeAndVerify({
          factorId,
          code,
        });

        if (error) {
          console.error("Enrollment verification failed:", error);
          throw error;
        }

        return { data, onSuccess };
      } catch (error) {
        console.error("MFA enrollment verify error:", error);
        throw error;
      }
    },
    onSuccess: ({ onSuccess }) => {
      toast.success("MFAが正常に有効化されました");
      queryClient.invalidateQueries({ queryKey: ["mfa-factors"] });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      console.error("MFA verify enroll error:", error);
      toast.error(
        "MFA設定を削除して最初からやり直してください。認証アプリの時刻同期も確認してください。",
      );
    },
  });

  // ...existing code...

  // MFA要素を削除（無効化）
  const unenrollMutation = useMutation({
    mutationFn: async ({
      factorId,
      onSuccessCallback,
    }: {
      factorId: string;
      onSuccessCallback?: () => void;
    }) => {
      const { data, error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      return { data, onSuccessCallback };
    },
    onSuccess: ({ onSuccessCallback }) => {
      toast.success("MFAが無効化されました");
      queryClient.invalidateQueries({ queryKey: ["mfa-factors"] });
      // 削除完了後のコールバックを実行
      if (onSuccessCallback) {
        setTimeout(onSuccessCallback, 500);
      }
    },
    onError: (error) => {
      console.error("MFA unenroll error:", error);
      toast.error(`MFAの無効化に失敗しました: ${error.message}`);
    },
  });

  // MFAチャレンジを作成（ログイン時等で使用）
  const createChallenge = async (factorId: string): Promise<MFAChallenge> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.mfa.challenge({ factorId });

      if (error) throw error;
      if (!data) throw new Error("チャレンジの作成に失敗しました");

      const challengeData: MFAChallenge = {
        id: data.id,
        type: data.type,
        expires_at: data.expires_at,
      };

      setChallenge(challengeData);
      return challengeData;
    } catch (error) {
      console.error("MFA challenge error:", error);
      toast.error("MFAチャレンジの作成に失敗しました");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // MFAチャレンジを検証
  const verifyChallenge = async (
    challengeId: string,
    code: string,
    factorId: string,
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.mfa.verify({
        challengeId,
        code,
        factorId,
      });

      if (error) throw error;

      if (data) {
        toast.success("MFA認証が成功しました");
        setChallenge(null);
        return true;
      }

      toast.error("認証コードが正しくありません");
      return false;
    } catch (error) {
      console.error("MFA verify error:", error);
      toast.error("MFA認証中にエラーが発生しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // MFA状態の取得
  const getMFAStatus = () => {
    const activeFactor = mfaFactors?.find(
      (factor: Factor) => factor.status === "verified",
    );
    return {
      isEnabled: !!activeFactor,
      hasTOTP:
        mfaFactors?.some(
          (factor: Factor) =>
            factor.factor_type === "totp" && factor.status === "verified",
        ) || false,
      factorCount: mfaFactors?.length || 0,
      activeFactor,
    };
  };

  return {
    // 状態
    mfaFactors,
    isFactorsLoading,
    factorsError,
    isLoading,
    challenge,

    // アクション
    enrollMFA: enrollMutation.mutate,
    isEnrolling: enrollMutation.isPending,
    enrollData: enrollMutation.data?.data,

    verifyEnroll: verifyEnrollMutation.mutate,
    isVerifyingEnroll: verifyEnrollMutation.isPending,

    unenrollMFA: unenrollMutation.mutate,
    isUnenrolling: unenrollMutation.isPending,

    createChallenge,
    verifyChallenge,

    // ヘルパー
    getMFAStatus,
  };
};

// MFA認証が必要かどうかを判定するヘルパー
export const useSupabaseMFARequired = () => {
  const { getMFAStatus } = useSupabaseMFA();
  const status = getMFAStatus();

  return {
    isRequired: status.isEnabled,
    hasTOTP: status.hasTOTP,
  };
};
