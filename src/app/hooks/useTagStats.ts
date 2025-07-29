import { supabase } from "../../supabase-client";
import { useQuery } from "@tanstack/react-query";

export interface TagStats {
  id: number;
  name: string;
  community_id: number;
  post_count: number;
  vote_count: number;
  popularity_score: number;
  created_at: string;
  community?:
    | {
        id: number;
        name: string;
      }
    | undefined;
}

export interface TagPopularityParams {
  communityId?: number | undefined;
  limit?: number | undefined;
  sortBy?: "post_count" | "vote_count" | "popularity_score" | undefined;
  sortOrder?: "asc" | "desc" | undefined;
}

// タグの統計情報を取得する関数
const getTagStats = async (
  params: TagPopularityParams = {},
): Promise<TagStats[]> => {
  const {
    communityId,
    limit = 10,
    sortBy = "popularity_score",
    sortOrder = "desc",
  } = params;

  try {
    // 基本的なタグ情報を取得
    let tagsQuery = supabase.from("tags").select(`
        id,
        name,
        community_id,
        created_at,
        communities(id, name)
      `);

    // コミュニティフィルタリング
    if (communityId) {
      tagsQuery = tagsQuery.eq("community_id", communityId);
    }

    const { data: tags, error: tagsError } = await tagsQuery;

    if (tagsError) {
      throw new Error(`タグデータ取得エラー: ${tagsError.message}`);
    }

    if (!tags || tags.length === 0) {
      return [];
    }

    // 各タグの統計情報を並行して取得
    const tagStatsPromises = tags.map(async (tag) => {
      // タグに関連する投稿数を取得
      const { data: posts, error: postsError } = await supabase
        .from("posts")
        .select("id")
        .eq("tag_id", tag.id);

      if (postsError) {
        console.error(`投稿数取得エラー (tag_id: ${tag.id}):`, postsError);
        // エラーが発生した場合は0を返す
        return {
          ...tag,
          post_count: 0,
          vote_count: 0,
          popularity_score: 0,
          community: Array.isArray(tag.communities)
            ? tag.communities[0]
            : tag.communities,
        };
      }

      const postIds = posts?.map((post) => post.id) || [];
      const postCount = postIds.length;

      // タグに関連する投稿の投票数を取得
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

      // 人気度スコアを計算（投稿数 * 2 + 投票数）
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

    const tagStats = await Promise.all(tagStatsPromises);

    // ソート処理
    const sortedStats = tagStats.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (sortOrder === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    // 制限数で切り取り
    return sortedStats.slice(0, limit);
  } catch (error) {
    console.error("タグ統計情報取得エラー:", error);
    throw error;
  }
};

// 特定のタグの統計情報を取得
const getTagStatsById = async (tagId: number): Promise<TagStats | null> => {
  try {
    const { data: tag, error: tagError } = await supabase
      .from("tags")
      .select(
        `
        id,
        name,
        community_id,
        created_at,
        communities(id, name)
      `,
      )
      .eq("id", tagId)
      .single();

    if (tagError) {
      throw new Error(`タグデータ取得エラー: ${tagError.message}`);
    }

    if (!tag) {
      return null;
    }

    // 投稿数を取得
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id")
      .eq("tag_id", tagId);

    if (postsError) {
      console.error(`投稿数取得エラー (tag_id: ${tagId}):`, postsError);
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
        console.error(`投票数取得エラー (tag_id: ${tagId}):`, votesError);
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
  } catch (error) {
    console.error("タグ統計情報取得エラー:", error);
    throw error;
  }
};

// コミュニティ別タグ統計情報を取得するhook
export const useTagStats = (params: TagPopularityParams = {}) => {
  return useQuery({
    queryKey: ["tagStats", params],
    queryFn: () => getTagStats(params),
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間ガベージコレクション防止
    retry: 2,
    retryDelay: 1000,
  });
};

// 特定のタグの統計情報を取得するhook
export const useTagStatsById = (tagId: number) => {
  return useQuery({
    queryKey: ["tagStats", tagId],
    queryFn: () => getTagStatsById(tagId),
    enabled: !!tagId,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間ガベージコレクション防止
    retry: 2,
    retryDelay: 1000,
  });
};

// タグ一覧（統計情報なし）を取得するhook
export const useTags = (communityId?: number) => {
  return useQuery({
    queryKey: ["tags", communityId],
    queryFn: async () => {
      let query = supabase
        .from("tags")
        .select(
          `
          id,
          name,
          community_id,
          created_at,
          communities(id, name)
        `,
        )
        .order("name");

      if (communityId) {
        query = query.eq("community_id", communityId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`タグ一覧取得エラー: ${error.message}`);
      }

      return (
        data?.map((tag) => ({
          ...tag,
          community: Array.isArray(tag.communities)
            ? tag.communities[0]
            : tag.communities,
        })) || []
      );
    },
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間ガベージコレクション防止
    retry: 2,
    retryDelay: 1000,
  });
};
