import type { TagStats } from "../hooks/useTagStats.ts";

// タグの人気度スコア計算方法の定義
export enum PopularityCalculationType {
  SIMPLE = "simple", // 投稿数 * 2 + 投票数
  WEIGHTED = "weighted", // 投稿数 * 3 + 投票数 * 2 + コメント数
  TIME_DECAY = "time_decay", // 時間減衰を考慮した計算
  ENGAGEMENT = "engagement", // エンゲージメント率を考慮
}

// 人気度計算のパラメータ
export interface PopularityConfig {
  postWeight: number; // 投稿数の重み
  voteWeight: number; // 投票数の重み
  commentWeight: number; // コメント数の重み
  timeDecayFactor: number; // 時間減衰係数
  engagementBonus: number; // エンゲージメントボーナス
}

// デフォルト設定
export const DEFAULT_POPULARITY_CONFIG: PopularityConfig = {
  postWeight: 2,
  voteWeight: 1,
  commentWeight: 0.5,
  timeDecayFactor: 0.95,
  engagementBonus: 1.2,
};

// シンプルな人気度計算
export const calculateSimplePopularity = (
  postCount: number,
  voteCount: number,
  config: PopularityConfig = DEFAULT_POPULARITY_CONFIG,
): number => {
  return Math.round(
    postCount * config.postWeight + voteCount * config.voteWeight,
  );
};

// 重み付きの人気度計算
export const calculateWeightedPopularity = (
  postCount: number,
  voteCount: number,
  commentCount: number = 0,
  config: PopularityConfig = DEFAULT_POPULARITY_CONFIG,
): number => {
  return Math.round(
    postCount * config.postWeight +
      voteCount * config.voteWeight +
      commentCount * config.commentWeight,
  );
};

// 時間減衰を考慮した人気度計算
export const calculateTimeDecayPopularity = (
  postCount: number,
  voteCount: number,
  createdAt: string,
  config: PopularityConfig = DEFAULT_POPULARITY_CONFIG,
): number => {
  const now = new Date();
  const createdDate = new Date(createdAt);
  const daysSinceCreation = Math.floor(
    (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  // 時間減衰係数を適用
  const decayFactor = Math.pow(config.timeDecayFactor, daysSinceCreation);

  const baseScore =
    postCount * config.postWeight + voteCount * config.voteWeight;
  return Math.round(baseScore * decayFactor);
};

// エンゲージメント率を考慮した人気度計算
export const calculateEngagementPopularity = (
  postCount: number,
  voteCount: number,
  commentCount: number = 0,
  config: PopularityConfig = DEFAULT_POPULARITY_CONFIG,
): number => {
  if (postCount === 0) return 0;

  const engagementRate = (voteCount + commentCount) / postCount;
  const engagementBonus = engagementRate > 1 ? config.engagementBonus : 1;

  const baseScore =
    postCount * config.postWeight + voteCount * config.voteWeight;
  return Math.round(baseScore * engagementBonus);
};

// 人気度計算の統合関数
export const calculatePopularity = (
  postCount: number,
  voteCount: number,
  commentCount: number = 0,
  createdAt: string,
  type: PopularityCalculationType = PopularityCalculationType.SIMPLE,
  config: PopularityConfig = DEFAULT_POPULARITY_CONFIG,
): number => {
  switch (type) {
    case PopularityCalculationType.SIMPLE:
      return calculateSimplePopularity(postCount, voteCount, config);

    case PopularityCalculationType.WEIGHTED:
      return calculateWeightedPopularity(
        postCount,
        voteCount,
        commentCount,
        config,
      );

    case PopularityCalculationType.TIME_DECAY:
      return calculateTimeDecayPopularity(
        postCount,
        voteCount,
        createdAt,
        config,
      );

    case PopularityCalculationType.ENGAGEMENT:
      return calculateEngagementPopularity(
        postCount,
        voteCount,
        commentCount,
        config,
      );

    default:
      return calculateSimplePopularity(postCount, voteCount, config);
  }
};

// タグ統計情報の人気度を再計算
export const recalculateTagPopularity = (
  tagStats: TagStats[],
  type: PopularityCalculationType = PopularityCalculationType.SIMPLE,
  config: PopularityConfig = DEFAULT_POPULARITY_CONFIG,
): TagStats[] => {
  return tagStats.map((tag) => ({
    ...tag,
    popularity_score: calculatePopularity(
      tag.post_count,
      tag.vote_count,
      0, // コメント数は現在のスキーマでは取得していない
      tag.created_at,
      type,
      config,
    ),
  }));
};

// タグの人気度ランキング
export const getTopTagsByPopularity = (
  tagStats: TagStats[],
  limit: number = 10,
  type: PopularityCalculationType = PopularityCalculationType.SIMPLE,
  config: PopularityConfig = DEFAULT_POPULARITY_CONFIG,
): TagStats[] => {
  const recalculatedStats = recalculateTagPopularity(tagStats, type, config);

  return recalculatedStats
    .sort((a, b) => b.popularity_score - a.popularity_score)
    .slice(0, limit);
};

// タグの成長率を計算（過去のデータが必要）
export const calculateTagGrowthRate = (
  currentStats: TagStats,
  previousStats: TagStats,
): {
  postGrowthRate: number;
  voteGrowthRate: number;
  popularityGrowthRate: number;
} => {
  const postGrowthRate =
    previousStats.post_count === 0
      ? 0
      : ((currentStats.post_count - previousStats.post_count) /
          previousStats.post_count) *
        100;

  const voteGrowthRate =
    previousStats.vote_count === 0
      ? 0
      : ((currentStats.vote_count - previousStats.vote_count) /
          previousStats.vote_count) *
        100;

  const popularityGrowthRate =
    previousStats.popularity_score === 0
      ? 0
      : ((currentStats.popularity_score - previousStats.popularity_score) /
          previousStats.popularity_score) *
        100;

  return {
    postGrowthRate: Math.round(postGrowthRate * 100) / 100,
    voteGrowthRate: Math.round(voteGrowthRate * 100) / 100,
    popularityGrowthRate: Math.round(popularityGrowthRate * 100) / 100,
  };
};

// タグの活動度を計算
export const calculateTagActivity = (
  tagStats: TagStats,
  daysSinceCreation: number,
): {
  avgPostsPerDay: number;
  avgVotesPerDay: number;
  activityScore: number;
} => {
  const avgPostsPerDay =
    daysSinceCreation > 0 ? tagStats.post_count / daysSinceCreation : 0;
  const avgVotesPerDay =
    daysSinceCreation > 0 ? tagStats.vote_count / daysSinceCreation : 0;

  // 活動度スコア = 日平均投稿数 * 2 + 日平均投票数
  const activityScore = avgPostsPerDay * 2 + avgVotesPerDay;

  return {
    avgPostsPerDay: Math.round(avgPostsPerDay * 100) / 100,
    avgVotesPerDay: Math.round(avgVotesPerDay * 100) / 100,
    activityScore: Math.round(activityScore * 100) / 100,
  };
};

// タグの人気度カテゴリを判定
export const getPopularityCategory = (
  popularityScore: number,
  allTagStats: TagStats[],
): "low" | "medium" | "high" | "very_high" => {
  if (allTagStats.length === 0) return "low";

  const scores = allTagStats
    .map((tag) => tag.popularity_score)
    .sort((a, b) => b - a);
  const top10Percent = Math.ceil(scores.length * 0.1);
  const top25Percent = Math.ceil(scores.length * 0.25);
  const top50Percent = Math.ceil(scores.length * 0.5);

  if (popularityScore >= scores[top10Percent - 1]) {
    return "very_high";
  } else if (popularityScore >= scores[top25Percent - 1]) {
    return "high";
  } else if (popularityScore >= scores[top50Percent - 1]) {
    return "medium";
  } else {
    return "low";
  }
};

// タグの推奨レベルを計算
export const getTagRecommendationLevel = (
  tagStats: TagStats,
  userInterestTags: number[] = [],
): {
  level: "not_recommended" | "low" | "medium" | "high" | "very_high";
  reason: string;
} => {
  const isUserInterested = userInterestTags.includes(tagStats.id);

  if (isUserInterested) {
    return {
      level: "very_high",
      reason: "ユーザーの関心タグです",
    };
  }

  if (tagStats.popularity_score >= 100) {
    return {
      level: "very_high",
      reason: "非常に人気の高いタグです",
    };
  } else if (tagStats.popularity_score >= 50) {
    return {
      level: "high",
      reason: "人気のタグです",
    };
  } else if (tagStats.popularity_score >= 20) {
    return {
      level: "medium",
      reason: "適度な人気があります",
    };
  } else if (tagStats.popularity_score >= 5) {
    return {
      level: "low",
      reason: "少し人気があります",
    };
  } else {
    return {
      level: "not_recommended",
      reason: "活動があまりありません",
    };
  }
};

// タグの関連度を計算（他のタグとの共起関係）
export const calculateTagRelation = (
  sharedPostCount: number,
  totalUniquePostCount: number,
): number => {
  if (totalUniquePostCount === 0) return 0;

  // Jaccard係数を使用した関連度計算
  // 関連度 = 共通投稿数 / (タグA投稿数 + タグB投稿数 - 共通投稿数)
  const relationScore = sharedPostCount / totalUniquePostCount;
  return Math.round(relationScore * 100) / 100;
};

// タグIDから関連度を計算する関数（Supabaseクエリ用）
export const calculateTagRelationFromIds = async (
  tagId: number,
  otherTagId: number,
): Promise<number> => {
  try {
    // 動的インポートでSupabaseクライアントを取得
    const { supabase } = await import("../supabase-client");

    // 1. tagIdを持つ投稿数を取得
    const { data: tagAPosts, error: errorA } = await supabase
      .from("posts")
      .select("id")
      .eq("tag_id", tagId);

    if (errorA) {
      console.error("タグA投稿取得エラー:", errorA);
      return 0;
    }

    // 2. otherTagIdを持つ投稿数を取得
    const { data: tagBPosts, error: errorB } = await supabase
      .from("posts")
      .select("id")
      .eq("tag_id", otherTagId);

    if (errorB) {
      console.error("タグB投稿取得エラー:", errorB);
      return 0;
    }

    const tagACount = tagAPosts?.length || 0;
    const tagBCount = tagBPosts?.length || 0;

    // 投稿数が少ない場合は関連度を低く設定
    if (tagACount < 2 || tagBCount < 2) {
      return 0;
    }

    // 3. 同じコミュニティの投稿で共起をチェック（簡易版）
    // 実際の共起は複雑なので、ここでは投稿数比率で近似
    const minCount = Math.min(tagACount, tagBCount);
    const maxCount = Math.max(tagACount, tagBCount);

    // 投稿数の類似度を関連度とする（0-1の範囲）
    const similarityScore = minCount / maxCount;

    // コミュニティが同じかどうかもチェック
    const { data: tagAInfo, error: tagAError } = await supabase
      .from("tags")
      .select("community_id")
      .eq("id", tagId)
      .single();

    const { data: tagBInfo, error: tagBError } = await supabase
      .from("tags")
      .select("community_id")
      .eq("id", otherTagId)
      .single();

    if (!tagAError && !tagBError && tagAInfo && tagBInfo) {
      const sameCommunity = tagAInfo.community_id === tagBInfo.community_id;
      // 同じコミュニティなら関連度を上げる
      const communityBonus = sameCommunity ? 0.3 : 0;
      const finalScore = Math.min(similarityScore + communityBonus, 1);

      return Math.round(finalScore * 100) / 100;
    }

    return Math.round(similarityScore * 100) / 100;
  } catch (error) {
    console.error("タグ関連度計算エラー:", error);
    return 0;
  }
};

// 関連タグ推奨機能
export const getRelatedTags = async (
  selectedTagId: number,
  communityId: number,
  limit: number = 3,
): Promise<Array<{ id: number; name: string; relationScore: number }>> => {
  try {
    const { supabase } = await import("../supabase-client");

    // 同じコミュニティの他のタグを取得
    const { data: otherTags, error } = await supabase
      .from("tags")
      .select("id, name")
      .eq("community_id", communityId)
      .neq("id", selectedTagId);

    if (error || !otherTags) {
      console.error("関連タグ取得エラー:", error);
      return [];
    }

    // 各タグとの関連度を計算
    const relatedTagsPromises = otherTags.map(async (tag) => {
      const relationScore = await calculateTagRelationFromIds(
        selectedTagId,
        tag.id,
      );
      return {
        id: tag.id,
        name: tag.name,
        relationScore,
      };
    });

    const relatedTags = await Promise.all(relatedTagsPromises);

    // 関連度順にソートして上位を返す
    return relatedTags
      .filter((tag) => tag.relationScore > 0.1) // 最低閾値
      .sort((a, b) => b.relationScore - a.relationScore)
      .slice(0, limit);
  } catch (error) {
    console.error("関連タグ推奨エラー:", error);
    return [];
  }
};

// タグの検索スコア計算
export const calculateTagSearchScore = (
  tag: TagStats,
  searchTerm: string,
  boost: {
    nameMatch: number;
    popularityBoost: number;
    recentBoost: number;
  } = {
    nameMatch: 10,
    popularityBoost: 0.1,
    recentBoost: 0.05,
  },
): number => {
  let score = 0;

  // 名前の一致度
  const nameMatch = tag.name.toLowerCase().includes(searchTerm.toLowerCase());
  if (nameMatch) {
    score += boost.nameMatch;

    // 完全一致の場合は追加ボーナス
    if (tag.name.toLowerCase() === searchTerm.toLowerCase()) {
      score += boost.nameMatch;
    }
  }

  // 人気度による boost
  score += tag.popularity_score * boost.popularityBoost;

  // 最近の作成による boost
  const daysSinceCreation = Math.floor(
    (new Date().getTime() - new Date(tag.created_at).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (daysSinceCreation <= 30) {
    score += (30 - daysSinceCreation) * boost.recentBoost;
  }

  return Math.round(score * 100) / 100;
};
