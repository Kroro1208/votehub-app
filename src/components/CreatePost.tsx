import { useMutation } from "@tanstack/react-query";
import { type ChangeEvent, useState } from "react";
import { supabase } from "../supabase-client";

interface PostInput {
  title: string;
  content: string;
}

const createPost = async (post: PostInput, imageFile: File) => {
  const filePath = `${post.title}-${Date.now()}-${imageFile.name}`;
  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(filePath, imageFile);

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from("post-images")
    .getPublicUrl(filePath);

  const { data, error } = await supabase
    .from("posts")
    .insert({ ...post, image_url: publicUrlData.publicUrl });

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const CreatePost = () => {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutate } = useMutation({
    mutationFn: (data: { post: PostInput; imageFile: File }) => {
      return createPost(data.post, data.imageFile);
    },
    onMutate: () => {
      setIsSubmitting(true);
    },
    onSuccess: () => {
      setTitle("");
      setContent("");
      setSelectedFile(null);
      setIsSubmitting(false);
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    mutate({ post: { title, content }, imageFile: selectedFile });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">新規投稿を作成</h2>
          <div className="mt-1 h-1 w-42 bg-green-500 mx-auto rounded" />
        </div>

        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium ">
            タイトル
          </label>
          <input
            type="text"
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            placeholder="タイトルを入力してください"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-medium">
            内容
          </label>
          <textarea
            id="content"
            required
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
            placeholder="投稿の内容を入力してください"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="image" className="block text-sm font-medium">
            画像
          </label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            placeholder="画像をアップロードしてください"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${
              isSubmitting
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isSubmitting ? "投稿中..." : "投稿する"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
