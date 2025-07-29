"use client";
import React, { useEffect, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@radix-ui/react-dialog";
import {
  AlertTriangle,
  CheckCircle,
  Key,
  QrCode,
  Shield,
  Smartphone,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useLanguage } from "../../hooks/useLanguage";
import { useSupabaseMFA } from "../../hooks/useSupabaseMFA";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { DialogFooter, DialogHeader } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export const SupabaseMFASettings = () => {
  const { t } = useLanguage();
  const {
    mfaFactors,
    isFactorsLoading,
    enrollMFA,
    isEnrolling,
    enrollData,
    verifyEnroll,
    isVerifyingEnroll,
    unenrollMFA,
    isUnenrolling,
    getMFAStatus,
  } = useSupabaseMFA();

  const [showSetupModal, setShowSetupModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showQRCode, setShowQRCode] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // MFA検証が完了して成功した場合のみモーダルを閉じる
  const [verificationSuccessful, setVerificationSuccessful] = useState(false);

  React.useEffect(() => {
    if (verificationSuccessful) {
      const timer = setTimeout(() => {
        setShowSetupModal(false);
        setVerificationCode("");
        setVerificationSuccessful(false);
      }, 1000);
      return () => clearTimeout(timer);
    }

    return () => {}; // 空のクリーンアップ関数を返す
  }, [verificationSuccessful]);

  const mfaStatus = getMFAStatus();

  // モーダルが開かれたときに入力フィールドにフォーカス
  useEffect(() => {
    if (showSetupModal && enrollData && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [showSetupModal, enrollData]);

  const handleStartSetup = async () => {
    // 新規作成
    enrollMFA({
      factorType: "totp",
      onSuccess: () => {
        setShowSetupModal(true);
      },
    });
  };

  const handleVerifySetup = async () => {
    if (!enrollData || !verificationCode) {
      toast.error(t("mfa.error.code.required"));
      return;
    }

    if (verificationCode.length !== 6) {
      toast.error(t("mfa.error.code.length"));
      return;
    }

    // 数値のみチェック
    if (!/^\d{6}$/.test(verificationCode)) {
      toast.error(t("mfa.error.code.format"));
      return;
    }

    // useSupabaseMFAフックのverifyEnrollを使用
    verifyEnroll({
      factorId: enrollData.id,
      code: verificationCode.trim(),
      onSuccess: () => {
        setVerificationSuccessful(true);
      },
    });
  };

  const handleDisableMFA = async (factorId: string) => {
    if (window.confirm(t("mfa.disable.confirm"))) {
      unenrollMFA({ factorId });
    }
  };

  const handleCloseModal = () => {
    setShowSetupModal(false);
    setVerificationCode("");
    setShowQRCode(true);
  };

  if (isFactorsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            2段階認証（MFA）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="text-sm text-gray-500">{t("common.loading")}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-gray-100">
            <Shield className="h-5 w-5" />
            {t("mfa.title")}
          </CardTitle>
          <CardDescription className="dark:text-gray-300">
            {t("mfa.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!mfaStatus.isEnabled ? (
            // MFA未設定の場合
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Smartphone className="h-5 w-5 text-blue-500 mt-1" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300">
                    {t("mfa.setup.required")}
                  </h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    {t("mfa.setup.install")}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium dark:text-gray-200">
                  {t("mfa.setup.steps")}
                </h4>
                <ol className="text-sm space-y-1 list-decimal list-inside text-gray-600 dark:text-gray-400">
                  <li>{t("mfa.setup.step1")}</li>
                  <li>{t("mfa.setup.step2")}</li>
                  <li>{t("mfa.setup.step3")}</li>
                  <li>{t("mfa.setup.step4")}</li>
                </ol>
              </div>

              <Button
                onClick={handleStartSetup}
                disabled={isEnrolling}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isEnrolling ? t("mfa.setup.preparing") : t("mfa.setup.button")}
              </Button>
            </div>
          ) : (
            // MFA設定済みの場合
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-300">
                    {t("mfa.enabled")}
                  </h4>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    {t("mfa.enabled.description")}
                  </p>
                </div>
              </div>

              {mfaFactors && mfaFactors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium dark:text-gray-200">
                    {t("mfa.registered.methods")}
                  </h4>
                  {mfaFactors.map((factor) => (
                    <div
                      key={factor.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium dark:text-gray-200">
                            {factor.friendly_name || t("mfa.app.name")}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {factor.factor_type?.toUpperCase()} -{" "}
                            {factor.status}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisableMFA(factor.id)}
                        disabled={isUnenrolling}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                        {isUnenrolling
                          ? t("common.updating")
                          : t("mfa.disable")}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* セットアップモーダル */}
      <Dialog open={showSetupModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-blue-500" />
              {t("mfa.modal.title")}
            </DialogTitle>
            <DialogDescription>{t("mfa.modal.description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isEnrolling && (
              <div className="flex justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("mfa.modal.preparing")}
                  </p>
                </div>
              </div>
            )}

            {!isEnrolling && enrollData && (
              <div>
                {showQRCode ? (
                  <>
                    <div className="flex justify-center">
                      <img
                        src={enrollData.totp.qr_code}
                        alt="MFA QR Code"
                        className="border rounded-lg"
                      />
                    </div>
                    <div className="text-center mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowQRCode(false)}
                        className="text-xs"
                      >
                        {t("common.manual.entry") ||
                          "QRコードをスキャンできない場合はこちら"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {t("mfa.modal.manual.key")}
                      </p>
                      <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded break-all block">
                        {enrollData.totp.secret}
                      </code>
                    </div>
                    <div className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowQRCode(true)}
                        className="text-xs"
                      >
                        {t("common.back") || "QRコードに戻る"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isEnrolling && enrollData && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="verification-code">
                    {t("mfa.modal.code.label")}
                  </Label>
                  <Input
                    ref={inputRef}
                    id="verification-code"
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setVerificationCode(value);
                    }}
                    placeholder={t("mfa.modal.code.placeholder")}
                    className="text-center text-lg font-mono"
                    disabled={false}
                    autoComplete="off"
                    inputMode="numeric"
                  />
                </div>

                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div className="text-xs text-yellow-800 dark:text-yellow-300">
                    <p className="mb-1">{t("mfa.modal.code.note")}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleVerifySetup}
              disabled={
                isVerifyingEnroll ||
                verificationCode.length !== 6 ||
                !enrollData
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {isVerifyingEnroll
                ? t("mfa.modal.verifying")
                : t("mfa.modal.verify")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
