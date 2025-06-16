import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "../../supabase-client";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
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

interface PostInput {
  title: string;
  content: string;
  avatar_url: string | null;
  community_id?: number | null;
  vote_deadline?: string | null;
  user_id?: string;
}

// スキーマ定義
const createPostSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(100, "タイトルは100文字以内で入力してください"),
  content: z
    .string()
    .min(1, "内容は必須です")
    .max(1000, "内容は1000文字以内で入力してください"),
  community_id: z.number().int().nullable(),
  vote_deadline: z
    .date({
      required_error: "投票期限は必須です",
      invalid_type_error: "投票期限は有効な日時を選択してください",
    })
    .refine((date) => date > new Date(), {
      message: "投票期限は未来の日付を選択してください",
    }),
  image: z
    .instanceof(FileList)
    .refine((files) => files?.length === 1, "画像をアップロードしてください")
    .refine(
      (files) => ["image/jpeg", "image/png"].includes(files?.[0]?.type || ""),
      "対応している画像形式はJPEG、PNGです",
    ),
});

type CreatePostFormData = z.infer<typeof createPostSchema>;

const createPost = async (post: PostInput, imageFile: File) => {
  const fileExt = imageFile.name.split(".").pop() || "";
  const filePath = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(filePath, imageFile);

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from("post-images")
    .getPublicUrl(filePath);

  const { data, error } = await supabase
    .from("posts")
    .insert({ ...post, image_url: publicUrlData.publicUrl })
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const CreatePost = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user } = useAuth();

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
      vote_deadline: undefined,
    },
  });

  const watchImage = watch("image");

  useEffect(() => {
    if (!watchImage || watchImage.length === 0) {
      setImagePreview(null);
      return;
    }
    const file = watchImage[0];
    const objUrl = URL.createObjectURL(file);
    setImagePreview(objUrl);

    // Cleanup function to revoke object URL
    return () => URL.revokeObjectURL(objUrl);
  }, [watchImage]);

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
    onSuccess: (data) => {
      console.log("結果", data);
      reset();
      setIsSubmitting(false);
      navigate("/");
    },
    onError: (error) => {
      setIsSubmitting(false);
      console.error(error.message);
      toast.error("投稿の作成に失敗しました");
    },
  });

  const onSubmit = (data: CreatePostFormData) => {
    if (!user) {
      toast.error("ログインが必要です");
      return;
    }
    const imageFile = data.image[0];
    mutate({
      post: {
        title: data.title,
        content: data.content,
        avatar_url: user?.user_metadata.avatar_url || null,
        community_id: data.community_id,
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

  const watchedContent = watch("content");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-4 mt-10">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <GiVote size={50} />
          </div>
        </div>
        {/* Header Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            新しい投稿を作成
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            あなたの意見に対しての投票を募りましょう
          </p>
        </div>

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
                  タイトル
                </Label>
                <Input
                  id="title"
                  type="text"
                  {...register("title")}
                  placeholder="魅力的なタイトルを入力してください..."
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
                  内容
                </Label>
                <div className="relative border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus-within:border-green-500 dark:focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-200 dark:focus-within:ring-green-800 transition-all duration-300">
                  <div className="p-4 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <Label className="text-sm font-semibold text-green-700 dark:text-green-300">
                          賛成意見
                        </Label>
                      </div>
                      <Input
                        placeholder="賛成する理由を書いてください..."
                        className="text-sm border-green-200 dark:border-green-700 focus:border-green-400 dark:focus:border-green-500"
                        onChange={(e) => {
                          const currentContent = watch("content") || "";
                          const lines = currentContent.split("\n");
                          const proIndex = lines.findIndex((line) =>
                            line.startsWith("賛成:"),
                          );
                          if (proIndex !== -1) {
                            lines[proIndex] = `賛成: ${e.target.value}`;
                          } else {
                            lines.unshift(`賛成: ${e.target.value}`);
                          }
                          setValue("content", lines.join("\n"));
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <Label className="text-sm font-semibold text-red-700 dark:text-red-300">
                          反対意見
                        </Label>
                      </div>
                      <Input
                        placeholder="反対する理由を書いてください..."
                        className="text-sm border-red-200 dark:border-red-700 focus:border-red-400 dark:focus:border-red-500"
                        onChange={(e) => {
                          const currentContent = watch("content") || "";
                          const lines = currentContent.split("\n");
                          const conIndex = lines.findIndex((line) =>
                            line.startsWith("反対:"),
                          );
                          if (conIndex !== -1) {
                            lines[conIndex] = `反対: ${e.target.value}`;
                          } else {
                            const proIndex = lines.findIndex((line) =>
                              line.startsWith("賛成:"),
                            );
                            if (proIndex !== -1) {
                              lines.splice(
                                proIndex + 1,
                                0,
                                `反対: ${e.target.value}`,
                              );
                            } else {
                              lines.push(`反対: ${e.target.value}`);
                            }
                          }
                          setValue("content", lines.join("\n"));
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                        詳細説明（任意）
                      </Label>
                      <Textarea
                        rows={4}
                        placeholder="追加の詳細説明があれば記入してください..."
                        className="text-sm resize-none border-gray-200 dark:border-gray-600"
                        onChange={(e) => {
                          const currentContent = watch("content") || "";
                          const lines = currentContent.split("\n");
                          // 賛成・反対以外の行を削除
                          const filteredLines = lines.filter(
                            (line) =>
                              line.startsWith("賛成:") ||
                              line.startsWith("反対:"),
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
                    両方の視点を示すことで、より建設的な議論が期待できます
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-600 px-3 py-1 rounded-full">
                    {watchedContent.length} 文字
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
                    コミュニティ
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
                          <SelectValue placeholder="コミュニティを選択してください" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                          {communityData?.map((item) => (
                            <SelectItem
                              key={item.id}
                              value={item.id.toString()}
                              className="text-lg py-3 text-gray-900 dark:text-gray-100 focus:bg-purple-50 dark:focus:bg-purple-900/50"
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
                    投票期限
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
                          placeholderText="投票期限を選択してください"
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

              {/* Image Upload Section */}
              <div className="group">
                <Label
                  htmlFor="image"
                  className="flex items-center gap-3 text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4"
                >
                  <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg group-hover:bg-rose-200 dark:group-hover:bg-rose-800/50 transition-colors">
                    <ImageIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  画像アップロード
                </Label>

                <div className="relative">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
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
                  disabled={isSubmitting}
                  className="w-full h-16 text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-500 dark:via-purple-500 dark:to-indigo-500 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:via-purple-600 dark:hover:to-indigo-600 text-white transition-all duration-500 rounded-2xl shadow-xl shadow-blue-200/50 dark:shadow-blue-900/50 hover:shadow-blue-300/50 dark:hover:shadow-blue-800/50 hover:scale-[1.02] transform disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>投稿中...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Upload className="h-6 w-6" />
                      <span>投稿を公開する</span>
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
