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
  parent_post_id: z.number().int().nullable().optional(),
});

export const createNestedPostSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(100, "タイトルは100文字以内で入力してください"),
  pro_opinion: z
    .string()
    .min(1, "賛成意見は必須です")
    .max(300, "賛成意見は300文字以内で入力してください"),
  con_opinion: z
    .string()
    .min(1, "反対意見は必須です")
    .max(300, "反対意見は300文字以内で入力してください"),
  detailed_description: z
    .string()
    .max(400, "詳細説明は400文字以内で入力してください")
    .optional(),
  content: z.string().optional(), // 後方互換性のため保持
  vote_deadline: z
    .date({
      required_error: "投票期限は必須です",
      invalid_type_error: "投票期限は有効な日時を選択してください",
    })
    .refine(
      (date) => {
        const now = new Date();
        const minDeadline = new Date(now.getTime() + 5 * 60 * 1000); // 5分後
        return date > minDeadline;
      },
      {
        message: "投票期限は現在時刻から5分以上先を選択してください",
      },
    ),
  parent_post_id: z.number().int(),
  target_vote_choice: z.union([z.literal(1), z.literal(-1)], {
    errorMap: () => ({
      message: "賛成（1）または反対（-1）を選択してください",
    }),
  }),
  image: z
    .instanceof(FileList)
    .refine(
      (files) => files.length === 0 || files.length === 1,
      "画像は1つまでアップロード可能です",
    )
    .refine(
      (files) =>
        files.length === 0 ||
        ["image/jpeg", "image/png"].includes(files[0]?.type || ""),
      "対応している画像形式はJPEG、PNGです",
    ),
});

export const japaneseEmojiMap: Record<string, string[]> = {
  // 基本感情
  笑顔: ["😊", "😀", "😁", "😄", "😃", "🙂"],
  笑: ["😂", "🤣", "😆"],
  泣: ["😢", "😭", "🥺"],
  怒: ["😠", "😡", "💢"],
  驚: ["😲", "😱", "😯"],
  愛: ["😍", "🥰", "❤️", "💕"],

  // 基本動物
  猫: ["🐱", "🐈", "😸"],
  犬: ["🐶", "🐕"],
  鳥: ["🐦", "🐤", "🐣"],
  魚: ["🐟", "🐠", "🐡"],
  ロボット: ["🤖"],

  // 基本食べ物
  食: ["🍎", "🍕", "🍔", "🍜"],
  りんご: ["🍎"],
  ラーメン: ["🍜"],
  寿司: ["🍣"],
  コーヒー: ["☕"],

  // 乗り物
  車: ["🚗", "🚙"],
  電車: ["🚄", "🚅"],
  飛行機: ["✈️"],

  // 場所
  家: ["🏠", "🏡"],
  学校: ["🏫"],
  病院: ["🏥"],

  // 職業
  医者: ["👨‍⚕️", "👩‍⚕️"],
  先生: ["👨‍🏫", "👩‍🏫"],
  エンジニア: ["👨‍💻", "👩‍💻"],

  // 物・道具
  本: ["📚", "📖"],
  電話: ["📞", "📱"],
  パソコン: ["💻"],
  時計: ["⏰", "⌚"],

  // 自然
  太陽: ["☀️", "🌞"],
  月: ["🌙", "🌕"],
  星: ["⭐", "🌟"],
  雨: ["🌧️", "☔"],
  花: ["🌸", "🌺", "🌻"],

  // 色
  赤: ["🔴", "❤️"],
  青: ["🔵", "💙"],
  緑: ["🟢", "💚"],
  黄: ["🟡", "💛"],

  // 記号
  ハート: ["❤️", "💕", "💖", "💙", "💚", "💛", "💜"],
  火: ["🔥"],
  水: ["💧", "🌊"],
  チェック: ["✅"],
  バツ: ["❌"],

  // その他
  お金: ["💰", "💵"],
  プレゼント: ["🎁"],
  誕生日: ["🎂", "🎉"],
};
