"use client";
import PostDetail from "@/app/components/Post/PostDetail";
import { useParams } from "next/navigation";

export default function PostDetailPage() {
  const params = useParams();
  return <PostDetail postId={Number(params?.["id"])} />;
}
