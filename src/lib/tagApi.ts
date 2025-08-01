import { supabase } from "../supabase-client";
import type { TagStats } from "../app/hooks/useTagStats";

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
    // TODO: 重複チェック（同じコミュニティ内で同じ名前のタグがないかチェック）
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

    const newId =
      maxIdData && maxIdData.length > 0 ? (maxIdData[0]?.id ?? 0) + 1 : 1;

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

// 高度な検索・フィルタリング機能（セキュアなRPC関数を使用）
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
    // セキュアなRPC関数を使用してタグ検索
    const { data: tags, error: tagsError } = await supabase.rpc(
      "search_tags_safe",
      {
        p_search_term: searchTerm || null,
        p_community_id: communityId || null,
        p_sort_by: sortBy,
        p_sort_order: sortOrder,
        p_limit: limit,
        p_offset: offset,
      },
    );

    if (tagsError) {
      throw new Error(`タグ検索エラー: ${tagsError.message}`);
    }

    if (!tags || tags.length === 0) {
      return [];
    }

    // RPC関数の結果をTagStats型に変換
    const tagStats: TagStats[] = tags.map(
      (tag: {
        id: number;
        name: string;
        community_id: number | null;
        created_at: string;
        post_count: string | number;
        community_name?: string;
      }) => ({
        id: tag.id,
        name: tag.name,
        community_id: tag.community_id,
        created_at: tag.created_at,
        post_count: Number(tag.post_count) || 0,
        vote_count: 0, // RPC関数で投票数計算を追加する場合はここで設定
        popularity_score: Number(tag.post_count) * 2, // 簡易計算
        community: tag.community_name
          ? { id: tag.community_id, name: tag.community_name }
          : null,
      }),
    );

    // 最小値フィルタリング
    return tagStats.filter(
      (stat) =>
        stat.post_count >= minPostCount && stat.vote_count >= minVoteCount,
    );
  } catch (error) {
    console.error("タグ検索エラー:", error);
    throw error;
  }
};

// 人気タグTOP N を取得（セキュアなRPC関数を使用）
export const getTopTags = async (
  communityId?: number,
  limit: number = 10,
): Promise<TagStats[]> => {
  try {
    // 人気タグランキング専用のRPC関数を使用
    const { data: tags, error } = await supabase.rpc(
      "get_popular_tags_ranking",
      {
        p_limit: limit,
      },
    );

    if (error) {
      throw new Error(`人気タグ取得エラー: ${error.message}`);
    }

    if (!tags || tags.length === 0) {
      return [];
    }

    // コミュニティでフィルタリング（必要な場合）
    const filteredTags = communityId
      ? tags.filter(
          (tag: { community_id: number | null }) =>
            tag.community_id === communityId,
        )
      : tags;

    // TagStats型に変換
    return filteredTags.map(
      (tag: {
        id: number;
        name: string;
        community_id: number | null;
        created_at: string;
        post_count: string | number;
        popularity_score?: number;
        total_votes?: number;
        community_name?: string;
      }) => ({
        id: tag.id,
        name: tag.name,
        community_id: tag.community_id,
        created_at: new Date().toISOString(), // RPC関数にcreated_atがない場合のフォールバック
        post_count: Number(tag.post_count) || 0,
        vote_count: Number(tag.total_votes) || 0,
        popularity_score: Number(tag.popularity_score) || 0,
        community: tag.community_name
          ? { id: tag.community_id, name: tag.community_name }
          : null,
      }),
    );
  } catch (error) {
    console.error("人気タグ取得エラー:", error);
    throw error;
  }
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
