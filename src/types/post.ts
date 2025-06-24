// 共通の投稿型定義
export interface BasePost {
  id: number;
  title: string;
  content: string;
  created_at: string;
  image_url: string | null;
  avatar_url: string | null;
  vote_deadline: string | null;
  community_id: number;
  user_id: string;
  parent_post_id: number | null;
  nest_level: number;
  target_vote_choice: number | null;
  vote_count: number;
  comment_count: number;
  popularity_score: number;
  communities: {
    id: number;
    name: string;
    description: string;
  } | null;
}

// 人気投票ページ用の型
export type PopularPost = BasePost;

// 結果発表ページ用の型
export type CompletedPost = BasePost;
