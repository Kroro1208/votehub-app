import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAuth } from "./useAuth";
import { useLanguage } from "./useLanguage";
import { usePostLimits } from "./usePostLimits";
import { supabase } from "../../supabase-client";
import { checkRateLimit, RateLimitError } from "../../utils/rateLimiter";

export interface PostInput {
  title: string;
  content: string;
  avatar_url: string | null;
  community_id?: number | null;
  tag_id?: number | null | undefined;
  vote_deadline?: string | null;
  user_id?: string;
  parent_post_id?: number | null | undefined;
}

const createPost = async (post: PostInput, imageFile: File) => {
  const fileExt = imageFile.name.split(".").pop() || "";
  const filePath = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}.${fileExt}`;

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

  // RPC関数を使用して安全に投稿を作成
  const { data, error } = await supabase.rpc("create_post_secure", {
    p_title: post.title,
    p_content: post.content,
    p_avatar_url: post.avatar_url,
    p_community_id: post.community_id,
    p_tag_id: post.tag_id,
    p_vote_deadline: post.vote_deadline,
    p_user_id: post.user_id,
    p_image_url: publicUrlData.publicUrl,
  });

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const useCreatePost = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { postLimitStatus, incrementPostCount } = usePostLimits();

  const { mutate, isPending: isSubmitting } = useMutation({
    mutationFn: (data: { post: PostInput; imageFile: File }) => {
      return createPost(data.post, data.imageFile);
    },
    onSuccess: () => {
      router.push("/");
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
      tag_id?: number | null | undefined;
      vote_deadline: Date;
      image?: FileList | null;
      parent_post_id?: number | null | undefined;
    },
    reset: () => void,
    setIsSubmitting: (value: boolean) => void,
  ) => {
    if (!user) {
      toast.error(t("create.post.error.login.required"));
      return;
    }

    // レート制限チェック
    try {
      checkRateLimit(user.id, "POST_CREATE");
    } catch (error) {
      if (error instanceof RateLimitError) {
        toast.error(error.message);
        return;
      }
      throw error;
    }

    // 投稿制限チェック
    if (!postLimitStatus?.can_post) {
      toast.error(
        "本日の投稿制限に達しています。ポイントを使用して制限を解除するか、明日再度お試しください。",
      );
      return;
    }

    const imageFile = data.image?.[0];

    if (!imageFile) {
      toast.error("画像ファイルが必要です");
      return;
    }

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
          avatar_url: user?.user_metadata?.["avatar_url"] || null,
          community_id: data.community_id,
          tag_id: data.tag_id,
          vote_deadline: data.vote_deadline.toISOString(),
          user_id: user?.id,
          parent_post_id: data.parent_post_id,
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
