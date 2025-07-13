import { supabase } from "../supabase-client.ts";
import type { TagStats } from "../hooks/useTagStats.ts";

export interface CreateTagParams {
  name: string;
  communityId: number;
}

export interface UpdateTagParams {
  id: number;
  name?: string;
  communityId?: number;
}

interface TagUpdateData {
  name?: string;
  community_id?: number;
}

export interface TagFilters {
  communityId?: number;
  searchTerm?: string;
  minPostCount?: number;
  minVoteCount?: number;
  sortBy?:
    | "name"
    | "post_count"
    | "vote_count"
    | "popularity_score"
    | "created_at";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

// タグ作成
export const createTag = async (params: CreateTagParams) => {
  const { name, communityId } = params;

  try {
    // 重複チェック（同じコミュニティ内で同じ名前のタグがないかチェック）
    const { data: existingTags, error: checkError } = await supabase
      .from("tags")
      .select("id, name")
      .eq("community_id", communityId)
      .ilike("name", name.trim());

    if (checkError) {
      throw new Error(`重複チェックエラー: ${checkError.message}`);
    }

    if (existingTags && existingTags.length > 0) {
      throw new Error("このタグ名は既に存在します");
    }

    // 新しいタグの最大IDを取得
    const { data: maxIdData, error: maxIdError } = await supabase
      .from("tags")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);

    if (maxIdError) {
      throw new Error(`最大ID取得エラー: ${maxIdError.message}`);
    }

    const newId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;

    // タグ作成
    const { data, error } = await supabase
      .from("tags")
      .insert({
        id: newId,
        name: name.trim(),
        community_id: communityId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("このタグ名は既に存在します");
      }
      throw new Error(`タグ作成エラー: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("タグ作成エラー:", error);
    throw error;
  }
};

// タグ更新
export const updateTag = async (params: UpdateTagParams) => {
  const { id, name, communityId } = params;

  try {
    const updateData: TagUpdateData = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (communityId !== undefined) {
      updateData.community_id = communityId;
    }

    // 名前の更新がある場合は重複チェック
    if (name !== undefined && communityId !== undefined) {
      const { data: existingTags, error: checkError } = await supabase
        .from("tags")
        .select("id, name")
        .eq("community_id", communityId)
        .ilike("name", name.trim())
        .neq("id", id);

      if (checkError) {
        throw new Error(`重複チェックエラー: ${checkError.message}`);
      }

      if (existingTags && existingTags.length > 0) {
        throw new Error("このタグ名は既に存在します");
      }
    }

    const { data, error } = await supabase
      .from("tags")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("このタグ名は既に存在します");
      }
      throw new Error(`タグ更新エラー: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("タグ更新エラー:", error);
    throw error;
  }
};

// タグ削除
export const deleteTag = async (tagId: number) => {
  try {
    // タグを使用している投稿があるかチェック
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id")
      .eq("tag_id", tagId)
      .limit(1);

    if (postsError) {
      throw new Error(`投稿チェックエラー: ${postsError.message}`);
    }

    if (posts && posts.length > 0) {
      throw new Error("このタグは投稿で使用されているため削除できません");
    }

    // タグ削除
    const { error } = await supabase.from("tags").delete().eq("id", tagId);

    if (error) {
      throw new Error(`タグ削除エラー: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error("タグ削除エラー:", error);
    throw error;
  }
};

// 高度な検索・フィルタリング機能
export const searchTags = async (
  filters: TagFilters = {},
): Promise<TagStats[]> => {
  const {
    communityId,
    searchTerm,
    minPostCount = 0,
    minVoteCount = 0,
    sortBy = "popularity_score",
    sortOrder = "desc",
    limit = 20,
    offset = 0,
  } = filters;

  try {
    // 基本的なタグクエリ
    let query = supabase.from("tags").select(`
        id,
        name,
        community_id,
        created_at,
        communities(id, name)
      `);

    // フィルタリング
    if (communityId) {
      query = query.eq("community_id", communityId);
    }

    if (searchTerm) {
      query = query.ilike("name", `%${searchTerm}%`);
    }

    const { data: tags, error: tagsError } = await query;

    if (tagsError) {
      throw new Error(`タグ検索エラー: ${tagsError.message}`);
    }

    if (!tags || tags.length === 0) {
      return [];
    }

    // 各タグの統計情報を取得
    const tagStatsPromises = tags.map(async (tag) => {
      // 投稿数を取得
      const { data: posts, error: postsError } = await supabase
        .from("posts")
        .select("id")
        .eq("tag_id", tag.id);

      if (postsError) {
        console.error(`投稿数取得エラー (tag_id: ${tag.id}):`, postsError);
        return null;
      }

      const postIds = posts?.map((post) => post.id) || [];
      const postCount = postIds.length;

      // 投票数を取得
      let voteCount = 0;
      if (postIds.length > 0) {
        const { data: votes, error: votesError } = await supabase
          .from("votes")
          .select("id")
          .in("post_id", postIds);

        if (votesError) {
          console.error(`投票数取得エラー (tag_id: ${tag.id}):`, votesError);
        } else {
          voteCount = votes?.length || 0;
        }
      }

      // 人気度スコアを計算
      const popularityScore = postCount * 2 + voteCount;

      return {
        id: tag.id,
        name: tag.name,
        community_id: tag.community_id,
        created_at: tag.created_at,
        post_count: postCount,
        vote_count: voteCount,
        popularity_score: popularityScore,
        community: Array.isArray(tag.communities)
          ? tag.communities[0]
          : tag.communities,
      };
    });

    const tagStats = (await Promise.all(tagStatsPromises)).filter(
      Boolean,
    ) as TagStats[];

    // 最小値フィルタリング
    const filteredStats = tagStats.filter(
      (stat) =>
        stat.post_count >= minPostCount && stat.vote_count >= minVoteCount,
    );

    // ソート処理
    const sortedStats = filteredStats.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (sortOrder === "asc") {
        return Number(aValue) - Number(bValue);
      } else {
        return Number(bValue) - Number(aValue);
      }
    });

    // ページネーション
    return sortedStats.slice(offset, offset + limit);
  } catch (error) {
    console.error("タグ検索エラー:", error);
    throw error;
  }
};

// 人気タグTOP N を取得
export const getTopTags = async (
  communityId?: number,
  limit: number = 10,
  sortBy: "post_count" | "vote_count" | "popularity_score" = "popularity_score",
): Promise<TagStats[]> => {
  return searchTags({
    communityId,
    sortBy,
    sortOrder: "desc",
    limit,
    minPostCount: 1, // 最低1つの投稿があるタグのみ
  });
};

// タグの投稿一覧を取得
export const getTagPosts = async (
  tagId: number,
  limit: number = 10,
  offset: number = 0,
) => {
  try {
    const { data: posts, error } = await supabase
      .from("posts")
      .select(
        `
        id,
        title,
        content,
        created_at,
        image_url,
        avatar_url,
        vote_deadline,
        community_id,
        user_id,
        parent_post_id,
        nest_level,
        target_vote_choice,
        communities(id, name)
      `,
      )
      .eq("tag_id", tagId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`タグ投稿取得エラー: ${error.message}`);
    }

    return posts || [];
  } catch (error) {
    console.error("タグ投稿取得エラー:", error);
    throw error;
  }
};

// タグ統計情報の一括更新（管理者用）
export const recalculateTagStats = async (tagId?: number) => {
  try {
    // 特定のタグまたは全てのタグの統計情報を再計算
    let query = supabase.from("tags").select("id, name, community_id");

    if (tagId) {
      query = query.eq("id", tagId);
    }

    const { data: tags, error: tagsError } = await query;

    if (tagsError) {
      throw new Error(`タグ取得エラー: ${tagsError.message}`);
    }

    if (!tags || tags.length === 0) {
      return [];
    }

    const results = [];

    for (const tag of tags) {
      // 投稿数を取得
      const { data: posts, error: postsError } = await supabase
        .from("posts")
        .select("id")
        .eq("tag_id", tag.id);

      if (postsError) {
        console.error(`投稿数取得エラー (tag_id: ${tag.id}):`, postsError);
        continue;
      }

      const postIds = posts?.map((post) => post.id) || [];
      const postCount = postIds.length;

      // 投票数を取得
      let voteCount = 0;
      if (postIds.length > 0) {
        const { data: votes, error: votesError } = await supabase
          .from("votes")
          .select("id")
          .in("post_id", postIds);

        if (votesError) {
          console.error(`投票数取得エラー (tag_id: ${tag.id}):`, votesError);
        } else {
          voteCount = votes?.length || 0;
        }
      }

      const popularityScore = postCount * 2 + voteCount;

      results.push({
        id: tag.id,
        name: tag.name,
        community_id: tag.community_id,
        post_count: postCount,
        vote_count: voteCount,
        popularity_score: popularityScore,
      });
    }

    return results;
  } catch (error) {
    console.error("タグ統計情報再計算エラー:", error);
    throw error;
  }
};
