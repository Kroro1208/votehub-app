"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FaPeopleLine } from "react-icons/fa6";
import { IoPricetagsOutline } from "react-icons/io5";
import { TbFileDescription } from "react-icons/tb";
import { toast } from "react-toastify";
import { useLanguage } from "../../hooks/useLanguage";

import { supabase } from "@/supabase-client";
import { japaneseEmojiMap } from "@/utils/schema";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

const communitySchema = z.object({
  name: z.string().min(1, "スペース名は必須です"),
  description: z.string().min(1, "スペースの説明は必須です"),
  icon: z.string().min(1, "アイコンを選択してください"),
});

type CommunityFormData = z.infer<typeof communitySchema>;

const createCommunity = async (community: CommunityFormData) => {
  const { data, error } = await supabase.rpc("create_community_secure", {
    p_name: community.name,
    p_description: community.description,
    p_icon: community.icon,
  });

  if (error) {
    // Postgresのユニーク制約違反エラー（23505）をチェック
    if (error.code === "23505") {
      throw new Error("このスペース名は既に使用されています");
    }
    throw new Error(error.message);
  }
  return data;
};

const CreateCommunity = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CommunityFormData>({
    resolver: zodResolver(communitySchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      icon: "🏛️",
    },
  });

  const selectedIcon = watch("icon");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEmojis, setFilteredEmojis] = useState<string[]>([]);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // 最適化された日本語検索フィルター
  const searchEmojis = (term: string) => {
    if (!term.trim()) {
      setFilteredEmojis([]);
      return;
    }

    const results = new Set<string>();

    // 完全一致を優先
    if (japaneseEmojiMap[term]) {
      japaneseEmojiMap[term].forEach((emoji) => results.add(emoji));
    }

    // 部分一致（文字が含まれる場合）
    Object.entries(japaneseEmojiMap).forEach(([keyword, emojis]) => {
      if (keyword.includes(term)) {
        emojis.forEach((emoji) => results.add(emoji));
      }
    });

    setFilteredEmojis(Array.from(results).slice(0, 24)); // 表示数を制限
  };

  useEffect(() => {
    searchEmojis(searchTerm);
  }, [searchTerm]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setValue("icon", emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // モーダル表示時のスクロール制御とクリック外で閉じる
  useEffect(() => {
    if (showEmojiPicker) {
      // ページスクロールを無効化
      document.body.style.overflow = "hidden";

      // ESCキーで閉じる
      const handleEscKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setShowEmojiPicker(false);
        }
      };

      document.addEventListener("keydown", handleEscKey);

      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscKey);
      };
    }

    return () => {}; // 空のクリーンアップ関数を返す
  }, [showEmojiPicker]);

  const { mutate, isError, isPending } = useMutation({
    mutationFn: createCommunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      toast.success("スペースが作成されました");
      router.push("/space");
    },
    onError: (errors: Error) => {
      toast.error(errors.message);
    },
  });

  const onSubmit = (data: CommunityFormData) => {
    mutate(data);
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <FaPeopleLine size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-gray-400 mb-2">
            {t("create.space.title")}
          </h2>
          <p className="text-slate-600 dark:text-dark-muted">
            コミュニティを作成して、仲間とつながりましょう
          </p>
        </div>

        {/* フォーム */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-slate-700">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input type="hidden" {...register("icon")} />
            {/* スペース名 */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-semibold text-gray-700 dark:text-dark-text flex items-center"
              >
                <IoPricetagsOutline size={18} />
                {t("create.space.name")}
              </Label>
              <Input
                type="text"
                id="name"
                {...register("name")}
                className={`w-full px-4 py-3 text-black dark:text-white rounded-xl border-2 transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 ${
                  errors.name
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20"
                } focus:ring-4 outline-none`}
                placeholder={t("create.space.name.placeholder")}
              />
              {errors.name && (
                <div className="flex items-center mt-2">
                  <svg
                    className="h-4 w-4 text-red-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                </div>
              )}
            </div>

            {/* アイコン選択 */}
            <div className="space-y-2">
              <Label
                htmlFor="icon"
                className="text-sm font-semibold text-gray-700 dark:text-dark-text flex items-center"
              >
                <span className="text-2xl mr-2">{selectedIcon}</span>
                スペースアイコン
              </Label>
              <div className="relative">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{selectedIcon}</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      絵文字を選択してください
                    </span>
                  </div>
                </Button>
              </div>

              {/* EmojiPicker Modal */}
              {showEmojiPicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  {/* Background Overlay */}
                  <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowEmojiPicker(false)}
                  />

                  {/* Modal Content */}
                  <div
                    ref={emojiPickerRef}
                    className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-600 max-w-sm w-full mx-4"
                  >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        絵文字を選択
                      </h3>
                      <Button
                        type="button"
                        onClick={() => setShowEmojiPicker(false)}
                        className="p-2 text-gray-400 dark:hover:text-gray-300 rounded-lg dark:hover:bg-gray-700 transition-colors"
                      >
                        <XIcon size={20} />
                      </Button>
                    </div>

                    {/* Japanese Search */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                      <div className="relative">
                        <Input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="日本語で検索 (例: ロボット, 笑顔)"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Search Results */}
                      {searchTerm && (
                        <div className="mt-3">
                          {filteredEmojis.length > 0 ? (
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                検索結果: {filteredEmojis.length}個
                              </p>
                              <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                                {filteredEmojis.map((emoji, index) => (
                                  <Button
                                    key={index}
                                    type="button"
                                    onClick={() => {
                                      setValue("icon", emoji);
                                      setShowEmojiPicker(false);
                                      setSearchTerm("");
                                    }}
                                    className="w-8 h-8 flex items-center justify-center text-xl dark:hover:bg-gray-600 rounded transition-colors"
                                  >
                                    {emoji}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                              「{searchTerm}」に関連する絵文字が見つかりません
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* EmojiPicker Content */}
                    <div className="p-2">
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        width="100%"
                        height={300}
                        searchDisabled={true}
                        skinTonesDisabled={true}
                        previewConfig={{ showPreview: false }}
                      />
                    </div>
                  </div>
                </div>
              )}
              {errors.icon && (
                <div className="flex items-center mt-2">
                  <svg
                    className="h-4 w-4 text-red-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-red-600">{errors.icon.message}</p>
                </div>
              )}
            </div>

            {/* スペースの説明 */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-semibold text-gray-700 dark:text-dark-text flex items-center"
              >
                <TbFileDescription size={20} />
                {t("create.space.description")}
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                rows={5}
                className={`w-full px-4 py-3 text-black dark:text-white rounded-xl border-2 transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 resize-none ${
                  errors.description
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20"
                } focus:ring-4 outline-none`}
                placeholder={t("create.space.description.placeholder")}
              />
              {errors.description && (
                <div className="flex items-center mt-2">
                  <svg
                    className="h-4 w-4 text-red-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-red-600">
                    {errors.description.message}
                  </p>
                </div>
              )}
            </div>

            {/* 送信ボタン */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isPending || isSubmitting}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 transform ${
                  isPending || isSubmitting
                    ? "bg-gray-400 cursor-not-allowed scale-95"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl"
                }`}
              >
                {isPending || isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {t("create.space.submitting")}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    {t("create.space.submit")}
                  </div>
                )}
              </Button>
            </div>

            {/* エラーメッセージ */}
            {isError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      スペース作成中にエラーが発生しました
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      もう一度お試しください
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* フッター */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            作成したスペースは後から編集できます
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateCommunity;
