import { atom } from "jotai";
import { PostType } from "../components/PostList";

// 基本のpostsデータのatom
export const postsAtom = atom<PostType[]>([]);

// フィルター用のatom
export const postsFilterAtom = atom<"all" | "active" | "expired">("all");

// フィルタリングされたpostsの派生atom
export const filteredPostsAtom = atom((get) => {
  const posts = get(postsAtom);
  const filter = get(postsFilterAtom);

  if (filter === "all") return posts;

  return posts.filter((post) => {
    if (!post.vote_deadline) return filter === "active";

    const isExpired = new Date() > new Date(post.vote_deadline);
    return filter === "expired" ? isExpired : !isExpired;
  });
});
