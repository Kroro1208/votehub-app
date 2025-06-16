import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { supabase } from "../../supabase-client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { toast } from "react-toastify";
import { FaPeopleLine } from "react-icons/fa6";
import { IoPricetagsOutline } from "react-icons/io5";
import { TbFileDescription } from "react-icons/tb";

const communitySchema = z.object({
  name: z.string().min(1, "スペース名は必須です"),
  description: z.string().min(1, "スペースの説明は必須です"),
});

type CommunityFormData = z.infer<typeof communitySchema>;

const createCommunity = async (community: CommunityFormData) => {
  const { data, error } = await supabase.from("communities").insert(community);
  if (error) {
    // Postgresのユニーク制約違反エラー（23505）をチェック
    if (error.code === "23505") {
      throw new Error("このスペース名は既に使用されています");
    }
    throw new Error(error.message);
  }
  return data;
};

const CreateCommunity = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CommunityFormData>({
    resolver: zodResolver(communitySchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const { mutate, isError, isPending } = useMutation({
    mutationFn: createCommunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      toast.success("スペースが作成されました");
      navigate("/space");
    },
    onError: (errors: Error) => {
      toast.error(errors.message);
    },
  });

  const onSubmit = (data: CommunityFormData) => {
    mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <FaPeopleLine size={50} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            新しいスペースを作成
          </h2>
          <p className="text-gray-600">
            コミュニティを作成して、仲間とつながりましょう
          </p>
        </div>

        {/* フォーム */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* スペース名 */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-semibold text-gray-700 flex items-center"
              >
                <IoPricetagsOutline size={18} />
                スペース名
              </Label>
              <Input
                type="text"
                id="name"
                {...register("name")}
                className={`w-full px-4 py-3 text-black dark:text-white rounded-xl border-2 transition-all duration-200 bg-gray-50 focus:bg-white ${
                  errors.name
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                } focus:ring-4 outline-none`}
                placeholder="例：写真愛好家の集い"
              />
              {errors.name && (
                <div className="flex items-center mt-2">
                  <svg
                    className="h-4 w-4 text-red-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                </div>
              )}
            </div>

            {/* スペースの説明 */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-semibold text-gray-700 flex items-center"
              >
                <TbFileDescription size={20} />
                スペースの説明
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                rows={5}
                className={`w-full px-4 py-3 text-black dark:text-white rounded-xl border-2 transition-all duration-200 bg-gray-50 focus:bg-white resize-none ${
                  errors.description
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                } focus:ring-4 outline-none`}
                placeholder="このスペースの目的や内容について詳しく説明してください..."
              />
              {errors.description && (
                <div className="flex items-center mt-2">
                  <svg
                    className="h-4 w-4 text-red-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-red-600">
                    {errors.description.message}
                  </p>
                </div>
              )}
            </div>

            {/* 送信ボタン */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isPending || isSubmitting}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 transform ${
                  isPending || isSubmitting
                    ? "bg-gray-400 cursor-not-allowed scale-95"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl"
                }`}
              >
                {isPending || isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    作成中...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    スペースを作成
                  </div>
                )}
              </Button>
            </div>

            {/* エラーメッセージ */}
            {isError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      スペース作成中にエラーが発生しました
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      もう一度お試しください
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* フッター */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            作成したスペースは後から編集できます
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateCommunity;
