"use client";

import { supabase } from "@/supabase-client";
import {
  ArrowLeft,
  Settings,
  User,
  Edit3,
  Camera,
  Save,
  X,
  Globe,
  Moon,
  Sun,
  CreditCard,
  Mail,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { SupabaseMFASettings } from "../components/MFA/SupabaseMFASettings";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { useTheme } from "../hooks/useTheme";

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.user_metadata?.["full_name"] || "",
    bio: user?.user_metadata?.["bio"] || "",
    avatarUrl: user?.user_metadata?.["avatar_url"] || "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleThemeToggle = () => {
    toggleTheme();
    toast.success(
      theme === "dark" ? t("message.theme.light") : t("message.theme.dark"),
    );
  };

  const handleLanguageChange = (newLanguage: "ja" | "en") => {
    setLanguage(newLanguage);
    toast.success(t(`message.language.${newLanguage}`));
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.fullName,
          bio: profileData.bio,
          avatar_url: profileData.avatarUrl,
        },
      });

      if (error) throw error;

      toast.success(t("message.profile.updated"));
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(t("message.profile.update.failed"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("post-images")
        .getPublicUrl(filePath);

      setProfileData({ ...profileData, avatarUrl: data.publicUrl });
      toast.success(t("message.image.uploaded"));
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error(t("message.image.upload.failed"));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Button>
            <div className="flex items-center space-x-2">
              <Settings className="w-6 h-6 text-slate-600 dark:text-gray-300" />
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-gray-100">
                {t("settings.title")}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Settings */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
              <User className="w-5 h-5" />
              <span>{t("settings.profile")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isEditingProfile ? (
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {profileData.avatarUrl ? (
                    <img
                      src={profileData.avatarUrl}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                      {(profileData.fullName || user?.email || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 dark:text-gray-100">
                    {profileData.fullName || t("profile.not.set")}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-gray-300 mb-2">
                    {user?.email}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-300">
                    {profileData.bio || t("profile.bio.empty")}
                  </p>
                </div>
                <Button
                  onClick={() => setIsEditingProfile(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{t("settings.profile.edit")}</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {profileData.avatarUrl ? (
                      <img
                        src={profileData.avatarUrl}
                        alt="Avatar"
                        className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                        {(profileData.fullName || user?.email || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <label className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 cursor-pointer hover:bg-blue-600 transition-colors">
                      <Camera className="w-3 h-3 text-white" />
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-gray-300">
                    <p>{t("profile.image.change.instruction")}</p>
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">
                    {t("profile.name.display")}
                  </label>
                  <Input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = (
                        e.target as HTMLInputElement & { value: string }
                      ).value;
                      setProfileData({
                        ...profileData,
                        fullName: value,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder={t("profile.name.example")}
                  />
                </div>

                {/* Bio Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">
                    {t("profile.bio.description")}
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      const value = (
                        e.target as HTMLTextAreaElement & { value: string }
                      ).value;
                      setProfileData({ ...profileData, bio: value });
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder={t("profile.bio.example")}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button
                    onClick={handleProfileUpdate}
                    disabled={isUpdating}
                    className="flex items-center space-x-1"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {isUpdating ? t("common.updating") : t("common.save")}
                    </span>
                  </Button>
                  <Button
                    onClick={() => setIsEditingProfile(false)}
                    variant="outline"
                    className="flex items-center space-x-1"
                  >
                    <X className="w-4 h-4" />
                    <span>{t("common.cancel")}</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
              <Globe className="w-5 h-5" />
              <span>{t("settings.language")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-gray-300">
                {t("settings.language.description")}
              </p>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <Input
                    type="radio"
                    name="language"
                    value="ja"
                    checked={language === "ja"}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = (
                        e.target as HTMLInputElement & { value: string }
                      ).value;
                      handleLanguageChange(value as "ja" | "en");
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-slate-700 dark:text-gray-200">
                    日本語
                  </span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <Input
                    type="radio"
                    name="language"
                    value="en"
                    checked={language === "en"}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = (
                        e.target as HTMLInputElement & { value: string }
                      ).value;
                      handleLanguageChange(value as "ja" | "en");
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-slate-700 dark:text-gray-200">
                    English
                  </span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
              {theme === "dark" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
              <span>{t("settings.theme")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700 dark:text-gray-200">
                  {theme === "dark"
                    ? t("settings.theme.dark")
                    : t("settings.theme.light")}
                </p>
                <p className="text-sm text-slate-600 dark:text-gray-300">
                  {theme === "dark"
                    ? t("settings.theme.dark.description")
                    : t("settings.theme.light.description")}
                </p>
              </div>
              <Button
                onClick={handleThemeToggle}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4" />
                    <span>{t("settings.theme.light")}</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    <span>{t("settings.theme.dark")}</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <SupabaseMFASettings />

        {/* Payment Settings */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
              <CreditCard className="w-5 h-5" />
              <span>{t("payment.title")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-gray-300">
                {t("payment.description")}
              </p>
              <div className="bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-700 dark:text-gray-200">
                      {t("payment.current.plan")}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-gray-300">
                      {t("payment.free.plan")}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    {t("payment.coming.soon")}
                  </Button>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                  {t("payment.premium.title")}
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• {t("payment.premium.unlimited")}</li>
                  <li>• {t("payment.premium.analytics")}</li>
                  <li>• {t("payment.premium.support")}</li>
                  <li>• {t("payment.premium.no.ads")}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
              <Mail className="w-5 h-5" />
              <span>{t("account.title")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">
                  {t("account.email")}
                </label>
                <div className="text-slate-600 dark:text-gray-300 bg-slate-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                  {user?.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">
                  {t("account.joined")}
                </label>
                <div className="text-slate-600 dark:text-gray-300 bg-slate-50 dark:bg-gray-700 px-3 py-2 rounded-md flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString("ja-JP")
                      : "---"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
