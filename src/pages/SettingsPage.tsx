import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../supabase-client";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Globe,
  CreditCard,
  Moon,
  Sun,
  User,
  Camera,
  Edit3,
  Save,
  X,
  Mail,
  Calendar,
  Settings,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.user_metadata?.full_name || "",
    bio: user?.user_metadata?.bio || "",
    avatarUrl: user?.user_metadata?.avatar_url || "",
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
    <div className="min-h-screen bg-slate-300 dark:bg-dark-bg transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-slate-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Settings className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-dark-text">
                {t("settings.title")}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Settings */}
        <Card className="dark:bg-dark-surface dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-dark-text">
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
                  <h3 className="font-semibold text-slate-800 dark:text-dark-text">
                    {profileData.fullName || "未設定"}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-dark-muted mb-2">
                    {user?.email}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-dark-muted">
                    {profileData.bio || "自己紹介が設定されていません"}
                  </p>
                </div>
                <Button
                  onClick={() => setIsEditingProfile(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1 dark:border-slate-600 dark:text-dark-text dark:hover:bg-slate-700"
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
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>プロフィール画像をクリックして変更</p>
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    表示名
                  </label>
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        fullName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="あなたの名前"
                  />
                </div>

                {/* Bio Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    自己紹介
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) =>
                      setProfileData({ ...profileData, bio: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="あなたについて教えてください..."
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
                    <span>{isUpdating ? "更新中..." : "保存"}</span>
                  </Button>
                  <Button
                    onClick={() => setIsEditingProfile(false)}
                    variant="outline"
                    className="flex items-center space-x-1"
                  >
                    <X className="w-4 h-4" />
                    <span>キャンセル</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card className="dark:bg-dark-surface dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-dark-text">
              <Globe className="w-5 h-5" />
              <span>{t("settings.language")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-dark-muted">
                {t("settings.language.description")}
              </p>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="language"
                    value="ja"
                    checked={language === "ja"}
                    onChange={(e) =>
                      handleLanguageChange(e.target.value as "ja" | "en")
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-slate-700 dark:text-dark-text">
                    日本語
                  </span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="language"
                    value="en"
                    checked={language === "en"}
                    onChange={(e) =>
                      handleLanguageChange(e.target.value as "ja" | "en")
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-slate-700 dark:text-dark-text">
                    English
                  </span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card className="dark:bg-dark-surface dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-dark-text">
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
                <p className="font-medium text-slate-700 dark:text-dark-text">
                  {theme === "dark"
                    ? t("settings.theme.dark")
                    : t("settings.theme.light")}
                </p>
                <p className="text-sm text-slate-600 dark:text-dark-muted">
                  {theme === "dark"
                    ? t("settings.theme.dark.description")
                    : t("settings.theme.light.description")}
                </p>
              </div>
              <Button
                onClick={handleThemeToggle}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 dark:border-slate-600 dark:text-dark-text dark:hover:bg-slate-700"
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

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>支払い・サブスクリプション</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                プレミアム機能やサブスクリプションの管理
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-700">現在のプラン</h4>
                    <p className="text-sm text-slate-600">無料プラン</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    近日公開
                  </Button>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">
                  プレミアム機能
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 無制限の投稿作成</li>
                  <li>• 高度な分析機能</li>
                  <li>• 優先サポート</li>
                  <li>• 広告非表示</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5" />
              <span>アカウント情報</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  メールアドレス
                </label>
                <div className="text-slate-600 bg-slate-50 px-3 py-2 rounded-md">
                  {user?.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  登録日
                </label>
                <div className="text-slate-600 bg-slate-50 px-3 py-2 rounded-md flex items-center space-x-2">
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
