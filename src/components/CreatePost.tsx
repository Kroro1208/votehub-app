import { useMutation, useQuery } from "@tanstack/react-query";
import { type ChangeEvent, useEffect, useState } from "react";
import { supabase } from "../supabase-client";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { type Community, getCommunitites } from "./CommunityList";

interface PostInput {
  title: string;
  content: string;
  avatar_url: string | null;
  community_id?: number | null;
}

const createPost = async (post: PostInput, imageFile: File) => {
  // ファイルパスに日本語、カタカナ入れたらエラーになるので注意
  const fileExt = imageFile.name.split(".").pop() || "";
  const filePath = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
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
    .insert({ ...post, image_url: publicUrlData.publicUrl })
    .select();

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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [communityId, setCommunityId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!selectedFile) {
      setImagePreview(null);
      return;
    }
    const objUrl = URL.createObjectURL(selectedFile);
    setImagePreview(objUrl);
  }, [selectedFile]);

  const { data: communityData } = useQuery<Community[], Error>({
    queryKey: ["communities"],
    queryFn: getCommunitites,
  });

  const { mutate } = useMutation({
    mutationFn: (data: { post: PostInput; imageFile: File }) => {
      return createPost(data.post, data.imageFile);
    },
    onMutate: () => {
      setIsSubmitting(true);
    },
    onSuccess: (data) => {
      console.log("結果", data);
      setTitle("");
      setContent("");
      setSelectedFile(null);
      setIsSubmitting(false);
      navigate("/");
    },
    onError: (error) => {
      setIsSubmitting(false);
      console.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    mutate({
      post: {
        title,
        content,
        avatar_url: user?.user_metadata.avatar_url || null,
        community_id: communityId,
      },
      imageFile: selectedFile,
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleCommunityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCommunityId(value ? Number(value) : null);
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
          <label htmlFor="community" className="block text-sm font-medium">
            コミュニティを選択
          </label>
          <select
            id="community"
            onChange={handleCommunityChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          >
            <option value={""}>選択する</option>
            {communityData?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
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

          {imagePreview && (
            <div className="mt-4 relative">
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="プレビュー"
                  className="w-full h-auto rounded-md border border-gray-600 object-contain max-h-64"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <title>削除</title>
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {selectedFile?.name} (
                {selectedFile ? Math.round(selectedFile?.size / 1024) : ""}KB)
              </p>
            </div>
          )}
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
