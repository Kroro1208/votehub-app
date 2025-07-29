import { supabase } from "../../supabase-client";
import { useQuery } from "@tanstack/react-query";

export interface TagRanking {
  id: number;
  name: string;
  post_count: number;
  vote_count: number;
  popularity_score: number;
}

// タグの人気度ランキングを取得する関数
const getTagRanking = async (limit: number = 5): Promise<TagRanking[]> => {
  // 直接フォールバック関数を使用（RPC関数は未実装のため）
  return await getTagRankingFallback(limit);
};

// フォールバック用の直接クエリ
const getTagRankingFallback = async (
  limit: number = 5,
): Promise<TagRanking[]> => {
  // 全タグを取得
  const { data: allTags, error: allTagsError } = await supabase
    .from("tags")
    .select("id, name");

  if (allTagsError) {
    console.error("タグ一覧取得エラー:", allTagsError);
    return [];
  }

  if (!allTags) return [];

  const rankings: TagRanking[] = [];

  for (const tag of allTags) {
    // このタグの投稿数を取得
    const { data: tagPosts, error: postsError } = await supabase
      .from("posts")
      .select("id")
      .eq("tag_id", tag.id);

    if (postsError) continue;

    const postCount = tagPosts?.length || 0;

    // このタグの投稿の投票数を取得
    let voteCount = 0;
    if (postCount > 0) {
      const postIds = tagPosts!.map((p) => p.id);
      const { data: votes, error: votesError } = await supabase
        .from("votes")
        .select("id")
        .in("post_id", postIds);

      if (!votesError) {
        voteCount = votes?.length || 0;
      }
    }

    // 人気度スコア = 投稿数 × 2 + 投票数
    const popularityScore = postCount * 2 + voteCount;

    rankings.push({
      id: tag.id,
      name: tag.name,
      post_count: postCount,
      vote_count: voteCount,
      popularity_score: popularityScore,
    });
  }

  // 投稿があるタグのみフィルタリング
  const filteredRankings = rankings.filter(
    (tag: TagRanking) => tag.post_count > 0,
  );

  return filteredRankings
    .sort(
      (a: TagRanking, b: TagRanking) => b.popularity_score - a.popularity_score,
    )
    .slice(0, limit);
};

// タグランキングを取得するReact Queryフック
export const useTagRanking = (limit: number = 5) => {
  return useQuery<TagRanking[], Error>({
    queryKey: ["tagRanking", limit],
    queryFn: () => getTagRanking(limit),
    staleTime: 1000 * 60 * 5, // 5分間キャッシュ
    refetchInterval: 1000 * 60 * 10, // 10分毎に自動更新
  });
};
