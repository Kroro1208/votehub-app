import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { supabase } from "../supabase-client";
import { useAuth } from "./useAuth";
import { useLanguage } from "../context/LanguageContext";
import { usePostLimits } from "./usePostLimits";

export interface PostInput {
  title: string;
  content: string;
  avatar_url: string | null;
  community_id?: number | null;
  tag_id?: number | null;
  vote_deadline?: string | null;
  user_id?: string;
}

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

export const useCreatePost = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { postLimitStatus, incrementPostCount } = usePostLimits();

  const { mutate, isPending: isSubmitting } = useMutation({
    mutationFn: (data: { post: PostInput; imageFile: File }) => {
      return createPost(data.post, data.imageFile);
    },
    onSuccess: () => {
      navigate("/");
    },
    onError: (error) => {
      console.error(error.message);
      toast.error(t("create.post.error.create.failed"));
    },
  });

  const handleSubmit = async (
    data: {
      title: string;
      content: string;
      community_id: number | null;
      tag_id?: number | null;
      vote_deadline: Date;
      image: FileList;
    },
    reset: () => void,
    setIsSubmitting: (value: boolean) => void,
  ) => {
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

    setIsSubmitting(true);

    mutate(
      {
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
      },
      {
        onSettled: () => {
          setIsSubmitting(false);
          reset();
        },
      },
    );
  };

  return {
    handleSubmit,
    isSubmitting,
  };
};
