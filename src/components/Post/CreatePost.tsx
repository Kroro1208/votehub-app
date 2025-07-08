import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "../../supabase-client";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { usePostLimits } from "../../hooks/usePostLimits";
import { type Community, getCommunitites } from "../Community/CommunityList";
import "react-datepicker/dist/react-datepicker.css";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GiVote } from "react-icons/gi";

import {
  Upload,
  X,
  MessageSquare,
  Users,
  Image as ImageIcon,
  Loader2,
  FileText,
  Clock,
  AlertTriangle,
  Hash,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import DatePicker from "react-datepicker";
import { z } from "zod";
import { toast } from "react-toastify";
import { createPostSchema } from "../../utils/schema";
import { useLanguage } from "../../context/LanguageContext";
import GradePanel from "./GradePanel";
import { getRelatedTags } from "../../lib/tagUtils";

interface PostInput {
  title: string;
  content: string;
  avatar_url: string | null;
  community_id?: number | null;
  tag_id?: number | null;
  vote_deadline?: string | null;
  user_id?: string;
}

type CreatePostFormData = z.infer<typeof createPostSchema>;

const createPost = async (post: PostInput, imageFile: File) => {
  const fileExt = imageFile.name.split(".").pop() || "";
  const filePath = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  // Supabase Storageに画像をアップロード
  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(filePath, imageFile);

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  // アップロードした画像のパブリックURLを取得
  const { data: publicUrlData } = supabase.storage
    .from("post-images")
    .getPublicUrl(filePath);

  // 公開URLと共にSupabaseのpostsテーブルに投稿を作成
  const { data, error } = await supabase
    .from("posts")
    .insert({ ...post, image_url: publicUrlData.publicUrl })
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

// タグを取得する関数
const getTagsForCommunity = async (communityId: number) => {
  if (!communityId || communityId <= 0) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("community_id", communityId)
      .order("name");

    if (error) {
      console.error("タグ取得エラー:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("タグ取得で予期しないエラー:", error);
    return [];
  }
};

// 新しいタグを作成する関数
const createTag = async (name: string, communityId: number) => {
  try {
    // Check for duplicate names first (case-insensitive)
    const { data: existingTags, error: checkError } = await supabase
      .from("tags")
      .select("name")
      .eq("community_id", communityId)
      .ilike("name", name.trim());

    if (checkError) {
      console.error("Error checking existing tags:", checkError);
    }

    if (existingTags && existingTags.length > 0) {
      throw new Error("このタグ名は既に存在します。");
    }

    // Get the maximum ID to generate a new one (with retry for race conditions)
    let newId: number;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      const { data: maxIdData, error: maxIdError } = await supabase
        .from("tags")
        .select("id")
        .order("id", { ascending: false })
        .limit(1);

      if (maxIdError) {
        console.error("Error getting max tag ID:", maxIdError);
        throw new Error("タグID取得に失敗しました");
      }

      // Generate new ID (max + 1 + retryCount to handle race conditions, or 1 if no tags exist)
      newId =
        maxIdData && maxIdData.length > 0
          ? maxIdData[0].id + 1 + retryCount
          : 1;

      const { data, error } = await supabase
        .from("tags")
        .insert({
          id: newId,
          name: name.trim(),
          community_id: communityId,
        })
        .select()
        .single();

      if (!error) {
        return data; // Success
      }

      // Handle specific errors
      if (error.code === "42501") {
        throw new Error("タグ作成の権限がありません。ログインしてください。");
      } else if (error.code === "23505" && error.message.includes("id")) {
        // ID conflict, retry with higher ID
        retryCount++;
        if (retryCount >= maxRetries) {
          throw new Error(
            "ID生成でエラーが発生しました。もう一度お試しください。",
          );
        }
        continue;
      } else if (error.code === "23505") {
        throw new Error("このタグ名は既に存在します。");
      } else if (error.code === "23502") {
        throw new Error("タグ作成でデータベースエラーが発生しました。");
      }

      console.error("Tag creation error:", error);
      throw new Error(`タグ作成に失敗しました: ${error.message}`);
    }

    throw new Error("タグ作成に失敗しました。もう一度お試しください。");
  } catch (error) {
    console.error("Unexpected error in createTag:", error);
    throw error;
  }
};

const CreatePost = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [relatedTags, setRelatedTags] = useState<
    Array<{ id: number; name: string; relationScore: number }>
  >([]);
  const [isLoadingRelatedTags, setIsLoadingRelatedTags] = useState(false);
  const [similarTags, setSimilarTags] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [isLoadingSimilarTags, setIsLoadingSimilarTags] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  // 投稿制限機能
  const {
    postLimitStatus,
    isLoading: isCheckingLimits,
    incrementPostCount,
    removePostLimitWithPoints,
  } = usePostLimits();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      content: "",
      community_id: null,
      tag_id: null,
      vote_deadline: undefined,
    },
  });

  const watchImage = watch("image");
  const watchCommunityId = watch("community_id");
  const watchTagId = watch("tag_id");

  // タグデータを取得
  const { data: tagsData, refetch: refetchTags } = useQuery({
    queryKey: ["tags", watchCommunityId],
    queryFn: () => getTagsForCommunity(watchCommunityId || 0),
    enabled: !!watchCommunityId && watchCommunityId > 0,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!watchImage || watchImage.length === 0) {
      setImagePreview(null);
      return;
    }

    // 画像が選択された場合、プレビューを表示
    const file = watchImage[0];
    const objUrl = URL.createObjectURL(file);
    setImagePreview(objUrl);

    // コンポーネントのアンマウント時にオブジェクトURLを解放
    return () => URL.revokeObjectURL(objUrl);
  }, [watchImage]);

  // タグ選択時に関連タグを取得
  useEffect(() => {
    if (!watchTagId || !watchCommunityId) {
      setRelatedTags([]);
      return;
    }

    const loadRelatedTags = async () => {
      setIsLoadingRelatedTags(true);
      try {
        const related = await getRelatedTags(watchTagId, watchCommunityId, 3);
        setRelatedTags(related);
      } catch (error) {
        console.error("関連タグ取得エラー:", error);
        setRelatedTags([]);
      } finally {
        setIsLoadingRelatedTags(false);
      }
    };

    loadRelatedTags();
  }, [watchTagId, watchCommunityId]);

  // 新規タグ名入力時の類似タグ検索
  useEffect(() => {
    const searchSimilarTags = async () => {
      if (
        !newTagName.trim() ||
        !watchCommunityId ||
        newTagName.trim().length < 2
      ) {
        setSimilarTags([]);
        return;
      }

      setIsLoadingSimilarTags(true);
      try {
        const { data: tags, error } = await supabase
          .from("tags")
          .select("id, name")
          .eq("community_id", watchCommunityId)
          .ilike("name", `%${newTagName.trim()}%`)
          .limit(5);

        if (error) {
          console.error("類似タグ検索エラー:", error);
          setSimilarTags([]);
        } else {
          setSimilarTags(tags || []);
        }
      } catch (error) {
        console.error("類似タグ検索エラー:", error);
        setSimilarTags([]);
      } finally {
        setIsLoadingSimilarTags(false);
      }
    };

    const timeoutId = setTimeout(searchSimilarTags, 300); // デバウンス
    return () => clearTimeout(timeoutId);
  }, [newTagName, watchCommunityId]);

  const { data: communityData } = useQuery<Community[], Error>({
    queryKey: ["communities"],
    queryFn: getCommunitites,
  });

  const { mutate } = useMutation({
    mutationFn: (data: { post: PostInput; imageFile: File }) => {
      return createPost(data.post, data.imageFile);
    },
    onMutate: () => {
      setIsSubmitting(true);
    },
    onSuccess: () => {
      reset();
      setIsSubmitting(false);
      navigate("/");
    },
    onError: (error) => {
      setIsSubmitting(false);
      console.error(error.message);
      toast.error(t("create.post.error.create.failed"));
    },
  });

  const onSubmit = async (data: CreatePostFormData) => {
    if (!user) {
      toast.error(t("create.post.error.login.required"));
      return;
    }

    // 投稿制限チェック
    if (!postLimitStatus?.can_post) {
      toast.error(
        "本日の投稿制限に達しています。ポイントを使用して制限を解除するか、明日再度お試しください。",
      );
      return;
    }

    const imageFile = data.image[0];

    // 投稿数をインクリメント（投稿作成前）
    const incrementSuccess = await incrementPostCount();
    if (!incrementSuccess) {
      toast.error("投稿制限のため投稿できませんでした。");
      return;
    }

    mutate({
      post: {
        title: data.title,
        content: data.content,
        avatar_url: user?.user_metadata.avatar_url || null,
        community_id: data.community_id,
        tag_id: data.tag_id || null,
        vote_deadline: data.vote_deadline.toISOString(),
        user_id: user?.id,
      },
      imageFile,
    });
  };

  const handleRemoveImage = () => {
    setValue("image", new DataTransfer().files as FileList);
    setImagePreview(null);
  };

  // 新しいタグを作成
  const handleCreateTag = async () => {
    if (!user) {
      toast.error(t("create.post.error.tag.login.required"));
      return;
    }

    if (!newTagName.trim() || !watchCommunityId) {
      toast.error(t("create.post.error.tag.name.space.required"));
      return;
    }

    // タグ名の重複チェック
    if (
      tagsData?.some(
        (tag) => tag.name.toLowerCase() === newTagName.trim().toLowerCase(),
      )
    ) {
      toast.error(t("create.post.error.tag.duplicate"));
      return;
    }

    setIsCreatingTag(true);
    try {
      const newTag = await createTag(newTagName, watchCommunityId);
      await refetchTags();
      setValue("tag_id", newTag.id);
      setNewTagName("");
      toast.success(t("create.post.success.tag.created"));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("create.post.error.tag.create.failed");
      toast.error(errorMessage || t("create.post.error.tag.create.failed"));
      console.error("Tag creation error:", error);
    } finally {
      setIsCreatingTag(false);
    }
  };

  const watchedContent = watch("content");

  // 投稿制限解除の処理
  const handleRemovePostLimit = async () => {
    const result = await removePostLimitWithPoints(30);
    if (result?.success) {
      toast.success(result.message);
    } else {
      toast.error(result?.message || "制限解除に失敗しました");
    }
  };

  // 類似タグを選択した際のハンドラ
  const handleSelectSimilarTag = (tag: { id: number; name: string }) => {
    setValue("tag_id", tag.id);
    setNewTagName("");
    setSimilarTags([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-gray-200 dark:from-slate-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-4 mt-10">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <GiVote size={50} />
          </div>
        </div>
        {/* Header Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-400 mb-2">
            {t("create.post.title")}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {t("create.post.subtitle")}
          </p>
        </div>

        <GradePanel
          postLimitStatus={postLimitStatus}
          handleRemovePostLimit={handleRemovePostLimit}
        />

        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 shadow-xl shadow-blue-100/50 dark:shadow-blue-900/50 rounded-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Title Input */}
              <div className="group">
                <Label
                  htmlFor="title"
                  className="flex items-center gap-3 text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3"
                >
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  {t("create.post.question")}
                </Label>
                <Input
                  id="title"
                  type="text"
                  {...register("title")}
                  placeholder={t("create.post.question.placeholder")}
                  className="h-14 text-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-300 rounded-xl"
                />
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Content Textarea */}
              <div className="group">
                <Label
                  htmlFor="content"
                  className="flex items-center gap-3 text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3"
                >
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                    <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  {t("create.post.content.title")}
                </Label>
                <div className="relative border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus-within:border-green-500 dark:focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-200 dark:focus-within:ring-green-800 transition-all duration-300">
                  <div className="p-4 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <Label className="text-sm font-semibold text-green-700 dark:text-green-300">
                          {t("create.post.content.pro")}
                        </Label>
                      </div>
                      <Input
                        placeholder={t("create.post.content.pro.placeholder")}
                        className="text-sm border-green-200 dark:border-green-700 focus:border-green-400 dark:focus:border-green-500"
                        onChange={(e) => {
                          const currentContent = watch("content") || "";
                          const lines = currentContent.split("\n");
                          const proPrefix = t("create.post.content.pro.prefix");
                          const proIndex = lines.findIndex((line) =>
                            line.startsWith(proPrefix),
                          );
                          if (proIndex !== -1) {
                            lines[proIndex] = `${proPrefix} ${e.target.value}`;
                          } else {
                            lines.unshift(`${proPrefix} ${e.target.value}`);
                          }
                          setValue("content", lines.join("\n"));
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <Label className="text-sm font-semibold text-red-700 dark:text-red-300">
                          {t("create.post.content.con")}
                        </Label>
                      </div>
                      <Input
                        placeholder={t("create.post.content.con.placeholder")}
                        className="text-sm border-red-200 dark:border-red-700 focus:border-red-400 dark:focus:border-red-500"
                        onChange={(e) => {
                          const currentContent = watch("content") || "";
                          const lines = currentContent.split("\n");
                          const conPrefix = t("create.post.content.con.prefix");
                          const proPrefix = t("create.post.content.pro.prefix");
                          const conIndex = lines.findIndex((line) =>
                            line.startsWith(conPrefix),
                          );
                          if (conIndex !== -1) {
                            lines[conIndex] = `${conPrefix} ${e.target.value}`;
                          } else {
                            const proIndex = lines.findIndex((line) =>
                              line.startsWith(proPrefix),
                            );
                            if (proIndex !== -1) {
                              lines.splice(
                                proIndex + 1,
                                0,
                                `${conPrefix} ${e.target.value}`,
                              );
                            } else {
                              lines.push(`${conPrefix} ${e.target.value}`);
                            }
                          }
                          setValue("content", lines.join("\n"));
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                        {t("create.post.content.detail")}
                      </Label>
                      <Textarea
                        rows={4}
                        placeholder={t(
                          "create.post.content.detail.placeholder",
                        )}
                        className="text-sm resize-none border-gray-200 dark:border-gray-600"
                        onChange={(e) => {
                          const currentContent = watch("content") || "";
                          const lines = currentContent.split("\n");
                          // 賛成・反対以外の行を削除
                          const proPrefix = t("create.post.content.pro.prefix");
                          const conPrefix = t("create.post.content.con.prefix");
                          const filteredLines = lines.filter(
                            (line) =>
                              line.startsWith(proPrefix) ||
                              line.startsWith(conPrefix),
                          );
                          if (e.target.value.trim()) {
                            filteredLines.push("", e.target.value);
                          }
                          setValue("content", filteredLines.join("\n"));
                        }}
                      />
                    </div>
                  </div>
                  {/* Hidden textarea for form submission */}
                  <input type="hidden" {...register("content")} />
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t("create.post.content.note")}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-600 px-3 py-1 rounded-full">
                    {watchedContent.length}{" "}
                    {t("create.post.content.characters")}
                  </span>
                </div>
                {errors.content && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {errors.content.message}
                  </p>
                )}
              </div>

              {/* Community Selection and Vote Deadline - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Community Selection */}
                <div className="group">
                  <Label className="flex items-center gap-3 text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    {t("create.post.space")}
                  </Label>
                  <Controller
                    name="community_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value ? Number(value) : null)
                        }
                        value={field.value?.toString() || ""}
                      >
                        <SelectTrigger className="text-sm border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all duration-300 rounded-xl flex items-center">
                          <SelectValue
                            placeholder={t("create.post.space.placeholder")}
                          />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                          {communityData?.map((item) => (
                            <SelectItem
                              key={item.id}
                              value={item.id.toString()}
                              className="py-3 text-gray-900 dark:text-gray-100 focus:bg-purple-50 dark:focus:bg-purple-900/50"
                            >
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.community_id && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {errors.community_id.message}
                    </p>
                  )}
                </div>

                {/* Vote Deadline */}
                <div className="group">
                  <Label
                    htmlFor="vote_deadline"
                    className="flex items-center gap-3 text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3"
                  >
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50 transition-colors">
                      <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    {t("create.post.deadline.title")}
                  </Label>
                  <div className="relative">
                    <Controller
                      name="vote_deadline"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={(date) => field.onChange(date)}
                          showTimeSelect
                          dateFormat="yyyy/MM/dd HH:mm"
                          timeIntervals={15}
                          placeholderText={t(
                            "create.post.deadline.placeholder",
                          )}
                          className="h-10 min-w-72 flex items-center border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all duration-300 rounded-xl dir-rtl text-left pl-3"
                        />
                      )}
                    />
                  </div>
                  {errors.vote_deadline && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {errors.vote_deadline.message}
                    </p>
                  )}
                </div>
              </div>

              {/* タグ選択 - スペースが選択された場合のみ表示 */}
              {watchCommunityId && watchCommunityId > 0 && (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border">
                  <Label
                    htmlFor="tag_id"
                    className="text-lg font-semibold text-gray-700 dark:text-gray-200"
                  >
                    {t("create.post.tag.title")}
                  </Label>

                  {/* 既存タグの選択 */}
                  <Controller
                    name="tag_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(value) => {
                          field.onChange(
                            value === "none" ? null : parseInt(value),
                          );
                        }}
                      >
                        <SelectTrigger className="border-2 border-gray-200 dark:border-gray-600">
                          <SelectValue
                            placeholder={t("create.post.tag.select")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            {t("create.post.tag.none")}
                          </SelectItem>
                          {tagsData?.map((tag) => (
                            <SelectItem key={tag.id} value={tag.id.toString()}>
                              #{tag.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />

                  {/* 新しいタグの作成 */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder={
                          user
                            ? t("create.post.tag.create.placeholder")
                            : t("create.post.tag.create.placeholder.login")
                        }
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        className="flex-1"
                        maxLength={20}
                        disabled={!user}
                      />
                      <Button
                        type="button"
                        onClick={handleCreateTag}
                        disabled={!user || !newTagName.trim() || isCreatingTag}
                        variant="outline"
                        size="sm"
                        className={`${user ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                      >
                        {isCreatingTag
                          ? t("create.post.tag.create.button.creating")
                          : t("create.post.tag.create.button")}
                      </Button>
                    </div>
                    {user ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("create.post.tag.example")}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {t("create.post.tag.login.required")}
                      </p>
                    )}

                    {/* 類似タグの表示 */}
                    {similarTags.length > 0 && (
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1 bg-yellow-100 dark:bg-yellow-800 rounded">
                            <Hash className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            類似するタグが見つかりました
                          </span>
                          {isLoadingSimilarTags && (
                            <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {similarTags.map((tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => handleSelectSimilarTag(tag)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-600 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-800 transition-colors"
                            >
                              <span className="text-yellow-700 dark:text-yellow-300">
                                #{tag.name}
                              </span>
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                          重複を避けるため、既存のタグをクリックして選択することをお勧めします。
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 関連タグ推奨 */}
                  {relatedTags.length > 0 && (
                    <div className="space-y-2 mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-blue-100 dark:bg-blue-800 rounded">
                          <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          おすすめの関連タグ
                        </span>
                        {isLoadingRelatedTags && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {relatedTags.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => setValue("tag_id", tag.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors group"
                          >
                            <span className="text-blue-700 dark:text-blue-300">
                              #{tag.name}
                            </span>
                            <span className="text-blue-500 dark:text-blue-400 text-[10px]">
                              ({Math.round(tag.relationScore * 100)}%)
                            </span>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        選択中のタグと関連性の高いタグです。クリックして選択できます。
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Image Upload Section */}
              <div className="group">
                <Label
                  htmlFor="image"
                  className="flex items-center gap-3 text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4"
                >
                  <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg group-hover:bg-rose-200 dark:group-hover:bg-rose-800/50 transition-colors">
                    <ImageIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  {t("create.post.image.title")}
                </Label>

                <div className="relative">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    placeholder={t("create.post.image.placeholder")}
                    {...register("image")}
                  />
                </div>
                {errors.image && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {errors.image.message}
                  </p>
                )}

                {imagePreview && (
                  <Card className="mt-6 overflow-hidden border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-2xl shadow-lg">
                    <CardContent className="p-6">
                      <div className="relative group/image">
                        <img
                          src={imagePreview}
                          alt={t("create.post.image.preview")}
                          className="w-full h-auto rounded-xl object-contain max-h-96 transition-transform duration-300 group-hover/image:scale-[1.02]"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={handleRemoveImage}
                          className="absolute -top-3 -right-3 h-10 w-10 rounded-full shadow-xl hover:scale-110 transition-transform duration-200"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-600 dark:to-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <ImageIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                          </div>
                          <span className="font-semibold text-gray-700 dark:text-gray-200">
                            {watchImage?.[0].name}
                          </span>
                        </div>
                        <span className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm">
                          {watchImage?.[0]
                            ? Math.round(watchImage?.[0].size / 1024)
                            : ""}
                          KB
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isCheckingLimits ||
                    (postLimitStatus ? !postLimitStatus.can_post : false)
                  }
                  className="w-full h-16 text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-500 dark:via-purple-500 dark:to-indigo-500 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:via-purple-600 dark:hover:to-indigo-600 text-white transition-all duration-500 rounded-2xl shadow-xl shadow-blue-200/50 dark:shadow-blue-900/50 hover:shadow-blue-300/50 dark:hover:shadow-blue-800/50 hover:scale-[1.02] transform disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>{t("create.post.submitting")}</span>
                    </div>
                  ) : isCheckingLimits ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>制限確認中...</span>
                    </div>
                  ) : postLimitStatus && !postLimitStatus.can_post ? (
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6" />
                      <span>投稿制限到達 - ポイントで制限解除してください</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Upload className="h-6 w-6" />
                      <span>{t("create.post.submit")}</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePost;
