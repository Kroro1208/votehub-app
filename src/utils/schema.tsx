import { z } from "zod";

export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(100, "タイトルは100文字以内で入力してください"),
  content: z
    .string()
    .min(1, "内容は必須です")
    .max(1000, "内容は1000文字以内で入力してください"),
  community_id: z.number().int().nullable(),
  tag_id: z.number().int().nullable().optional(),
  vote_deadline: z
    .date({
      required_error: "投票期限は必須です",
      invalid_type_error: "投票期限は有効な日時を選択してください",
    })
    .refine((date) => date > new Date(), {
      message: "投票期限は未来の日付を選択してください",
    }),
  image: z
    .instanceof(FileList)
    .refine((files) => files?.length === 1, "画像をアップロードしてください")
    .refine(
      (files) => ["image/jpeg", "image/png"].includes(files?.[0]?.type || ""),
      "対応している画像形式はJPEG、PNGです",
    ),
});
