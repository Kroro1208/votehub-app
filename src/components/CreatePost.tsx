import { useMutation, useQuery } from "@tanstack/react-query";
import { type ChangeEvent, useEffect, useState } from "react";
import { supabase } from "../supabase-client";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { type Community, getCommunitites } from "./CommunityList";
import "react-datepicker/dist/react-datepicker.css";

import {
  Upload,
  X,
  MessageSquare,
  Users,
  Image as ImageIcon,
  Loader2,
  FileText,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import DatePicker from "react-datepicker";

interface PostInput {
  title: string;
  content: string;
  avatar_url: string | null;
  community_id?: number | null;
  vote_deadline?: string | null;
}

const createPost = async (post: PostInput, imageFile: File) => {
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
  const [voteDeadline, setVoteDeadline] = useState<string>("");

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!selectedFile) {
      setImagePreview(null);
      return;
    }
    const objUrl = URL.createObjectURL(selectedFile);
    setImagePreview(objUrl);

    // Cleanup function to revoke object URL
    return () => URL.revokeObjectURL(objUrl);
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
    if (!selectedFile) return alert("画像をアップロードしてください");
    if (!voteDeadline) return alert("投票期限を設定してください");
    mutate({
      post: {
        title,
        content,
        avatar_url: user?.user_metadata.avatar_url || null,
        community_id: communityId,
        vote_deadline: voteDeadline
          ? new Date(voteDeadline).toISOString()
          : null,
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

  const handleCommunityChange = (value: string) => {
    setCommunityId(value ? Number(value) : null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950 py-8 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4">
            新しい投稿を作成
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            あなたのアイデアをコミュニティと共有しましょう
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 shadow-xl shadow-blue-100/50 dark:shadow-blue-900/50 rounded-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Title Input */}
              <div className="group">
                <Label
                  htmlFor="title"
                  className="flex items-center gap-3 text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3"
                >
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  タイトル
                </Label>
                <Input
                  id="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="魅力的なタイトルを入力してください..."
                  className="h-14 text-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-300 rounded-xl"
                />
              </div>

              {/* Content Textarea */}
              <div className="group">
                <Label
                  htmlFor="content"
                  className="flex items-center gap-3 text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3"
                >
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                    <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  内容
                </Label>
                <Textarea
                  id="content"
                  required
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="あなたの考えや意見を詳しく説明してください..."
                  className="resize-none text-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 transition-all duration-300 rounded-xl"
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    詳細な説明を追加することで、より良い議論が生まれます
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-600 px-3 py-1 rounded-full">
                    {content.length} 文字
                  </span>
                </div>
              </div>

              {/* Community Selection and Vote Deadline - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Community Selection */}
                <div className="group">
                  <Label className="flex items-center gap-3 text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    コミュニティ
                  </Label>
                  <Select onValueChange={handleCommunityChange}>
                    <SelectTrigger className="text-sm border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all duration-300 rounded-xl flex items-center">
                      <SelectValue placeholder="コミュニティを選択してください" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                      {communityData?.map((item) => (
                        <SelectItem
                          key={item.id}
                          value={item.id.toString()}
                          className="text-lg py-3 text-gray-900 dark:text-gray-100 focus:bg-purple-50 dark:focus:bg-purple-900/50"
                        >
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vote Deadline */}
                <div className="group">
                  <Label
                    htmlFor="vote_deadline"
                    className="flex items-center gap-3 text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3"
                  >
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50 transition-colors">
                      <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    投票期限
                  </Label>
                  <div className="relative">
                    {/* <Input
                      id="vote_deadline"
                      type="datetime-local"
                      value={voteDeadline}
                      onChange={(e) => setVoteDeadline(e.target.value)}
                      className="h-10 flex items-center border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all duration-300 rounded-xl dir-rtl text-left"
                    /> */}
                    <DatePicker
                      selected={voteDeadline ? new Date(voteDeadline) : null}
                      onChange={(date) =>
                        setVoteDeadline(date?.toISOString() || "")
                      }
                      showTimeSelect
                      dateFormat="yyyy/MM/dd HH:mm"
                      timeIntervals={15}
                      placeholderText="投票期限を選択してください"
                      className="h-10 min-w-72 flex items-center border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all duration-300 rounded-xl dir-rtl text-left pl-3"
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="group">
                <Label
                  htmlFor="image"
                  className="flex items-center gap-3 text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4"
                >
                  <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg group-hover:bg-rose-200 dark:group-hover:bg-rose-800/50 transition-colors">
                    <ImageIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  画像アップロード
                </Label>

                <div className="relative">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>

                {imagePreview && (
                  <Card className="mt-6 overflow-hidden border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-2xl shadow-lg">
                    <CardContent className="p-6">
                      <div className="relative group/image">
                        <img
                          src={imagePreview}
                          alt="プレビュー"
                          className="w-full h-auto rounded-xl object-contain max-h-96 transition-transform duration-300 group-hover/image:scale-[1.02]"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={handleRemoveImage}
                          className="absolute -top-3 -right-3 h-10 w-10 rounded-full shadow-xl hover:scale-110 transition-transform duration-200"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-600 dark:to-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <ImageIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                          </div>
                          <span className="font-semibold text-gray-700 dark:text-gray-200">
                            {selectedFile?.name}
                          </span>
                        </div>
                        <span className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm">
                          {selectedFile
                            ? Math.round(selectedFile.size / 1024)
                            : ""}
                          KB
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-16 text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-500 dark:via-purple-500 dark:to-indigo-500 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:via-purple-600 dark:hover:to-indigo-600 text-white transition-all duration-500 rounded-2xl shadow-xl shadow-blue-200/50 dark:shadow-blue-900/50 hover:shadow-blue-300/50 dark:hover:shadow-blue-800/50 hover:scale-[1.02] transform disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>投稿中...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Upload className="h-6 w-6" />
                      <span>投稿を公開する</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePost;
