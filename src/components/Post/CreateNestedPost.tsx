import React from "react";

import { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createNestedPostSchema } from "../../utils/schema.tsx";
import { z } from "zod";
import { supabase } from "../../supabase-client.ts";
import { useAuth } from "../../hooks/useAuth.ts";
import {
  Upload,
  X,
  MessageSquare,
  Image as ImageIcon,
  Loader2,
  FileText,
  Clock,
  MessageSquarePlus,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card.tsx";
import { Label } from "../ui/label.tsx";
import { Input } from "../ui/input.tsx";
import { Textarea } from "../ui/textarea.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select.tsx";
import { Button } from "../ui/button.tsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { toast } from "react-toastify";
import { FaArrowAltCircleDown, FaArrowAltCircleUp } from "react-icons/fa";

interface DatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  showTimeSelect?: boolean;
  dateFormat?: string;
  timeIntervals?: number;
  placeholderText?: string;
  className?: string;
}

export const TypedDatePicker =
  DatePicker as unknown as React.ComponentType<DatePickerProps>;

type CreateNestedPostFormData = z.infer<typeof createNestedPostSchema>;

interface CreateNestedPostProps {
  parentPost: {
    id: number;
    community_id: number;
    title: string;
    nest_level: number;
  };
  onCancel: () => void;
  onSuccess: () => void;
  isDialog?: boolean;
}

const CreateNestedPost = ({
  parentPost,
  onCancel,
  onSuccess,
  isDialog = false,
}: CreateNestedPostProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateNestedPostFormData>({
    resolver: zodResolver(createNestedPostSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      pro_opinion: "",
      con_opinion: "",
      detailed_description: "",
      parent_post_id: parentPost.id,
      target_vote_choice: undefined,
      vote_deadline: undefined,
    },
  });

  const watchImage = watch("image");
  const watchedProOpinion = watch("pro_opinion");
  const watchedConOpinion = watch("con_opinion");
  const watchedDetailedDescription = watch("detailed_description");
  const watchedTargetChoice = watch("target_vote_choice");

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

  const onSubmit = async (data: CreateNestedPostFormData) => {
    if (!user) {
      toast.error("ログインが必要です");
      return;
    }

    if (parentPost.nest_level >= 3) {
      toast.error("ネストレベルは最大3段階までです");
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = null;

      // 画像アップロード処理
      if (data.image && data.image.length > 0) {
        const file = data.image[0];
        const fileExt = file.name.split(".").pop() || "";
        const filePath = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(
            `画像のアップロードに失敗しました: ${uploadError.message}`,
          );
        }

        const { data: publicURL } = supabase.storage
          .from("post-images")
          .getPublicUrl(filePath);

        imageUrl = publicURL.publicUrl;
      }

      // コンテンツを結合
      const combinedContent = [
        `賛成: ${data.pro_opinion}`,
        `反対: ${data.con_opinion}`,
        data.detailed_description ? `\n${data.detailed_description}` : "",
      ].join("\n");

      // ネスト投稿作成
      const { data: insertedPost, error: insertError } = await supabase
        .from("posts")
        .insert({
          title: data.title,
          content: combinedContent,
          vote_deadline: data.vote_deadline.toISOString(),
          parent_post_id: data.parent_post_id,
          nest_level: parentPost.nest_level + 1,
          target_vote_choice: data.target_vote_choice,
          community_id: parentPost.community_id,
          user_id: user.id,
          image_url: imageUrl,
          avatar_url: user.user_metadata?.avatar_url || null,
        })
        .select("id")
        .single();

      if (insertError) {
        throw new Error(
          `投稿の作成に失敗しました:${insertedPost}: ${insertError.message}`,
        );
      }

      // 通知は database trigger (notify_nested_post_created) が自動的に処理

      toast.success("派生投稿を作成しました！");
      reset();
      onSuccess();
    } catch (error) {
      console.error("Error creating nested post:", error);
      toast.error(
        error instanceof Error ? error.message : "投稿の作成に失敗しました",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveImage = () => {
    setValue("image", new DataTransfer().files as FileList);
    setImagePreview(null);
  };

  const ContentWrapper = useMemo(() => {
    return ({ children }: { children: React.ReactNode }) => {
      if (isDialog) {
        return <div className="space-y-6">{children}</div>;
      }
      return (
        <Card className="w-full mx-auto backdrop-blur-sm bg-white/80 border border-gray-200 shadow-xl rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <MessageSquarePlus className="h-6 w-6 text-violet-600" />
                </div>
                派生投稿を作成
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8">{children}</CardContent>
        </Card>
      );
    };
  }, [isDialog, onCancel]);

  return (
    <ContentWrapper>
      {/* 親投稿情報 */}
      <div className="mb-6 p-4 bg-slate-50 rounded-xl border-l-4 border-violet-500">
        <p className="text-sm font-medium text-slate-600 mb-1">返信先:</p>
        <p className="font-semibold text-slate-800">{parentPost.title}</p>
        <p className="text-xs text-slate-500 mt-1">
          ネストレベル: {parentPost.nest_level} → {parentPost.nest_level + 1}
          {parentPost.nest_level >= 2 && " (最大レベルに到達)"}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Title Input */}
        <div className="group">
          <Label
            htmlFor="title"
            className="flex items-center gap-3 text-lg font-semibold text-gray-700 mb-3"
          >
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            タイトル
          </Label>
          <Input
            id="title"
            type="text"
            {...register("title")}
            placeholder="派生質問のタイトルを入力してください..."
            className="h-14 text-lg border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
          />
          {errors.title && (
            <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Content Textarea */}
        <div className="group">
          <Label
            htmlFor="content"
            className="flex items-center gap-3 text-lg font-semibold text-gray-700 mb-3"
          >
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            内容
          </Label>
          <div className="relative border-2 border-gray-200 bg-white rounded-xl focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200 transition-all duration-300">
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <Label className="text-sm font-semibold text-green-700">
                    賛成意見
                  </Label>
                </div>
                <Input
                  placeholder="賛成意見の内容を書いてください"
                  className="text-sm border-green-200 focus:border-green-400"
                  {...register("pro_opinion")}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <Label className="text-sm font-semibold text-red-700">
                    反対意見
                  </Label>
                </div>
                <Input
                  placeholder="反対意見の内容を書いてください..."
                  className="text-sm border-red-200 focus:border-red-400"
                  {...register("con_opinion")}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                  詳細説明（任意）
                </Label>
                <Textarea
                  rows={4}
                  placeholder="追加の補足説明があれば記入してください..."
                  className="text-sm resize-none border-gray-200"
                  {...register("detailed_description")}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3">
            <span className="text-sm text-gray-500">
              両方の視点を示すことで、より建設的な議論が期待できます
            </span>
            <span className="text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1 rounded-full">
              {(watchedProOpinion?.length || 0) +
                (watchedConOpinion?.length || 0) +
                (watchedDetailedDescription?.length || 0)}{" "}
              文字
            </span>
          </div>
          {(errors.pro_opinion ||
            errors.con_opinion ||
            errors.detailed_description) && (
            <div className="mt-2 space-y-1">
              {errors.pro_opinion && (
                <p className="text-sm text-red-600">
                  {errors.pro_opinion.message}
                </p>
              )}
              {errors.con_opinion && (
                <p className="text-sm text-red-600">
                  {errors.con_opinion.message}
                </p>
              )}
              {errors.detailed_description && (
                <p className="text-sm text-red-600">
                  {errors.detailed_description.message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Target Vote Choice and Vote Deadline - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Vote Choice */}
          <div className="group">
            <Label className="flex items-center gap-3 text-lg font-semibold text-gray-700 mb-3">
              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              質問の対象
            </Label>
            <Controller
              name="target_vote_choice"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(value) =>
                    field.onChange(value === "" ? undefined : parseInt(value))
                  }
                >
                  <SelectTrigger className="text-sm w-[400px] border-2 border-gray-200 bg-white text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-300 rounded-xl">
                    <SelectValue placeholder="質問の対象を選択してください" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-gray-200 bg-white">
                    <SelectItem
                      value="1"
                      className="py-3 text-gray-900 focus:bg-green-50"
                    >
                      <FaArrowAltCircleUp className="text-green-500" />
                      <p>賛成者向け</p>
                    </SelectItem>
                    <SelectItem
                      value="-1"
                      className="py-3 text-gray-900 focus:bg-red-50"
                    >
                      <FaArrowAltCircleDown className="text-red-500" />
                      <p>反対者向け</p>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.target_vote_choice && (
              <p className="mt-2 text-sm text-red-600">
                {errors.target_vote_choice.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {watchedTargetChoice === 1 &&
                "親投稿で「賛成」に投票した人のみが回答できる質問です"}
              {watchedTargetChoice === -1 &&
                "親投稿で「反対」に投票した人のみが回答できる質問です"}
              {!watchedTargetChoice &&
                "親投稿への投票状況に基づいて質問対象を絞り込めます"}
            </p>
          </div>

          {/* Vote Deadline */}
          <div className="group">
            <Label
              htmlFor="vote_deadline"
              className="flex items-center gap-3 text-lg font-semibold text-gray-700 mb-3"
            >
              <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                <Clock className="h-5 w-5 text-indigo-600" />
              </div>
              投票期限
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
                    placeholderText="投票期限を選択してください"
                    className="h-10 w-[400px] flex items-center border-2 border-gray-200 bg-white text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 rounded-xl text-left pl-3"
                  />
                )}
              />
            </div>
            {errors.vote_deadline && (
              <p className="mt-2 text-sm text-red-600">
                {errors.vote_deadline.message}
              </p>
            )}
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="group">
          <Label
            htmlFor="image"
            className="flex items-center gap-3 text-lg font-semibold text-gray-700 mb-4"
          >
            <div className="p-2 bg-rose-100 rounded-lg group-hover:bg-rose-200 transition-colors">
              <ImageIcon className="h-5 w-5 text-rose-600" />
            </div>
            画像アップロード（任意）
          </Label>

          <div className="relative">
            <Input
              id="image"
              type="file"
              accept="image/*"
              {...register("image")}
              className="border-2 border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all duration-300 rounded-xl"
            />
          </div>
          {errors.image && (
            <p className="mt-2 text-sm text-red-600">{errors.image.message}</p>
          )}

          {imagePreview && (
            <Card className="mt-6 overflow-hidden border-2 border-gray-200 bg-white rounded-2xl shadow-lg">
              <CardContent className="p-6">
                <div className="relative group/image">
                  <img
                    src={imagePreview}
                    alt="プレビュー"
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
                <div className="flex items-center justify-between mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <ImageIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <span className="font-semibold text-gray-700">
                      {watchImage?.[0]?.name}
                    </span>
                  </div>
                  <span className="bg-white px-4 py-2 rounded-full text-sm font-medium text-gray-600 shadow-sm">
                    {watchImage?.[0]
                      ? Math.round(watchImage[0].size / 1024)
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
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting || parentPost.nest_level >= 3}
              className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white transition-all duration-500 rounded-xl shadow-xl shadow-violet-200/50 hover:shadow-violet-300/50 hover:scale-[1.02] transform disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>作成中...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5" />
                  <span>派生投稿を作成</span>
                </div>
              )}
            </Button>
            {!isDialog && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="h-14 px-8 text-lg border-2 border-gray-300 hover:border-gray-400 transition-all duration-300 rounded-xl"
              >
                キャンセル
              </Button>
            )}
          </div>
        </div>
      </form>
    </ContentWrapper>
  );
};

export default CreateNestedPost;
