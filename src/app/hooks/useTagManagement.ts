import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getRelatedTags } from "../../lib/tagUtils";
import { supabase } from "../../supabase-client";
import { createTagSchema } from "../../utils/schema";
import { useAuth } from "./useAuth";
import { useLanguage } from "./useLanguage";

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
          ? (maxIdData[0]?.id ?? 0) + 1 + retryCount
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

export const useTagManagement = (
  watchCommunityId: number | null,
  watchTagId: number | null,
) => {
  const { user } = useAuth();
  const { t } = useLanguage();
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
  const [tagValidationError, setTagValidationError] = useState<string>("");

  // タグデータを取得
  const { data: tagsData, refetch: refetchTags } = useQuery({
    queryKey: ["tags", watchCommunityId],
    queryFn: () => getTagsForCommunity(watchCommunityId || 0),
    enabled: !!watchCommunityId && watchCommunityId > 0,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

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

  // 新規タグ名入力時の類似タグ検索（セキュアなRPC関数を使用）
  useEffect(() => {
    const searchSimilarTags = async () => {
      if (
        !newTagName.trim() ||
        !watchCommunityId ||
        newTagName.trim().length < 2
      ) {
        setSimilarTags([]);
        setTagValidationError("");
        return;
      }

      // リアルタイムバリデーション（Zodスキーマ使用）
      const validationResult = createTagSchema.safeParse({
        name: newTagName,
        community_id: watchCommunityId,
        existing_tags: tagsData || [],
      });

      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0]?.message || "";
        setTagValidationError(errorMessage);
      } else {
        setTagValidationError("");
      }

      setIsLoadingSimilarTags(true);
      try {
        // セキュアなRPC関数を使用して類似タグを検索
        const { data: tags, error } = await supabase.rpc("search_tags_safe", {
          p_search_term: newTagName.trim(),
          p_community_id: watchCommunityId,
          p_sort_by: "name",
          p_sort_order: "asc",
          p_limit: 5,
          p_offset: 0,
        });

        if (error) {
          console.error("類似タグ検索エラー:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          setSimilarTags([]);
        } else {
          // RPC関数の結果を適切な形式に変換
          const similarTagsData = (tags || []).map(
            (tag: { id: number; name: string }) => ({
              id: tag.id,
              name: tag.name,
            }),
          );
          setSimilarTags(similarTagsData);
        }
      } catch (error) {
        console.error("類似タグ検索エラー:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        setSimilarTags([]);
      } finally {
        setIsLoadingSimilarTags(false);
      }
    };

    const timeoutId = setTimeout(searchSimilarTags, 300); // デバウンス
    return () => clearTimeout(timeoutId);
  }, [newTagName, watchCommunityId, tagsData]);

  // 新しいタグを作成
  const handleCreateTag = async (
    setValue: (name: "tag_id", value: number) => void,
  ) => {
    if (!user) {
      toast.error(t("create.post.error.tag.login.required"));
      return;
    }

    if (!newTagName.trim() || !watchCommunityId) {
      toast.error(t("create.post.error.tag.name.space.required"));
      return;
    }

    // Zodスキーマによるバリデーション
    const validationResult = createTagSchema.safeParse({
      name: newTagName,
      community_id: watchCommunityId,
      existing_tags: tagsData || [],
    });

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.errors[0]?.message ||
        "バリデーションエラーが発生しました";
      setTagValidationError(errorMessage);
      return;
    }

    setIsCreatingTag(true);
    try {
      const newTag = await createTag(newTagName, watchCommunityId);
      await refetchTags();
      setValue("tag_id", newTag.id);
      setNewTagName("");
      setTagValidationError("");
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

  // 類似タグを選択した際のハンドラ
  const handleSelectSimilarTag = (
    tag: { id: number; name: string },
    setValue: (name: "tag_id", value: number) => void,
  ) => {
    setValue("tag_id", tag.id);
    setNewTagName("");
    setSimilarTags([]);
    setTagValidationError("");
  };

  return {
    tagsData,
    newTagName,
    setNewTagName,
    isCreatingTag,
    relatedTags,
    isLoadingRelatedTags,
    similarTags,
    isLoadingSimilarTags,
    tagValidationError,
    handleCreateTag,
    handleSelectSimilarTag,
  };
};
