"use client";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import "react-datepicker/dist/react-datepicker.css";
import { Controller, useForm } from "react-hook-form";
import { GiVote } from "react-icons/gi";

import { Clock, FileText, Users } from "lucide-react";

import { createPostSchema } from "../../../utils/schema";
import { toast } from "react-toastify";
import { z } from "zod";
import { useCreatePost } from "../../hooks/useCreatePost";
import { useImagePreview } from "../../hooks/useImagePreview";
import { useLanguage } from "../../hooks/useLanguage";
import { usePostLimits } from "../../hooks/usePostLimits";
import { useTagManagement } from "../../hooks/useTagManagement";
import { Community, getCommunitites } from "../Community/CommunityList";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import ContentSection from "./ContentSection";
import { TypedDatePicker } from "./CreateNestedPost";
import GradePanel from "./GradePanel";
import ImageUploadSection from "./ImageUploadSection";
import TagSection from "./TagSection";

type CreatePostFormData = z.infer<typeof createPostSchema>;

const CreatePost = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const communityIdFromUrl = searchParams?.get("community_id");
  const initialCommunityId = communityIdFromUrl
    ? parseInt(communityIdFromUrl, 10)
    : null;

  // 投稿制限機能
  const {
    postLimitStatus,
    isLoading: isCheckingLimits,
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
      community_id: initialCommunityId,
      tag_id: null,
      vote_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
      image: (typeof window !== "undefined"
        ? new DataTransfer().files
        : null) as FileList,
    },
  });

  const watchImage = watch("image");
  const watchCommunityId = watch("community_id");
  const watchTagId = watch("tag_id");
  const watchedContent = watch("content");

  const { handleSubmit: handlePostSubmit } = useCreatePost();
  const { imagePreview, handleRemoveImage } = useImagePreview(watchImage);
  const {
    tagsData,
    newTagName,
    setNewTagName,
    isCreatingTag,
    relatedTags,
    isLoadingRelatedTags,
    similarTags,
    isLoadingSimilarTags,
    handleCreateTag,
    handleSelectSimilarTag,
  } = useTagManagement(watchCommunityId || null, watchTagId || null);

  const { data: communityData } = useQuery<Community[], Error>({
    queryKey: ["communities"],
    queryFn: getCommunitites,
  });

  const onSubmit = async (data: CreatePostFormData) => {
    await handlePostSubmit(data, reset, setIsSubmitting);
  };

  const handleCreateTagWrapper = async () => {
    await handleCreateTag((name, value) => setValue(name as "tag_id", value));
  };

  const handleSelectSimilarTagWrapper = (tag: { id: number; name: string }) => {
    handleSelectSimilarTag(tag, (name, value) =>
      setValue(name as "tag_id", value),
    );
  };

  // 投稿制限解除の処理
  const handleRemovePostLimit = async () => {
    const result = await removePostLimitWithPoints(30);
    if (result?.success) {
      toast.success(result.message);
    } else {
      toast.error(result?.message || t("grade.panel.remove.limit.failed"));
    }
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
              <ContentSection
                control={control}
                watch={watch}
                setValue={setValue}
                errors={errors}
                watchedContent={watchedContent}
              />

              {/* スペース選択 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {/* 投票期限 */}
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
                        <TypedDatePicker
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
              <TagSection
                control={control}
                setValue={setValue}
                watchCommunityId={watchCommunityId}
                tagsData={tagsData || []}
                newTagName={newTagName}
                setNewTagName={setNewTagName}
                isCreatingTag={isCreatingTag}
                relatedTags={relatedTags}
                isLoadingRelatedTags={isLoadingRelatedTags}
                similarTags={similarTags}
                isLoadingSimilarTags={isLoadingSimilarTags}
                onCreateTag={handleCreateTagWrapper}
                onSelectSimilarTag={handleSelectSimilarTagWrapper}
              />

              {/* Image Upload Section */}
              <ImageUploadSection
                register={register}
                errors={errors}
                imagePreview={imagePreview}
                watchImage={watchImage}
                onRemoveImage={() =>
                  handleRemoveImage((_name: string, value: FileList) =>
                    setValue("image", value),
                  )
                }
              />

              {/* Submit Button */}
              <div className="flex flex-col items-center justify-center">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isCheckingLimits ||
                    (postLimitStatus ? !postLimitStatus.can_post : false)
                  }
                  className="w-32 h-32 flex items-center text-center rounded-full justify-center text-8xl bg-gradient-to-br from-gray-300 via-gray-400 to-gray-600 hover:from-gray-200 hover:via-gray-300 hover:to-gray-500 active:from-gray-400 active:via-gray-500 active:to-gray-700 text-white border-4 border-gray-200 border-t-white border-l-white border-r-gray-500 border-b-gray-600 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.3),0_4px_8px_rgba(0,0,0,0.3)] hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.2),0_6px_12px_rgba(0,0,0,0.4)] active:shadow-[inset_0_-2px_4px_rgba(255,255,255,0.2),inset_0_2px_4px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-1"
                >
                  {isSubmitting
                    ? "⏳"
                    : isCheckingLimits
                      ? "⏳"
                      : postLimitStatus && !postLimitStatus.can_post
                        ? "⚠️"
                        : "🗳️"}
                </button>
                <p className="mt-2">{t("create.post.submit.post")}</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePost;
