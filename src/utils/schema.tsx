import { z } from "zod";

// タグ作成時の類似性チェック用バリデーション関数
export const validateTagSimilarity = (
  newTagName: string,
  existingTags: Array<{ id: number; name: string; community_id: number }>,
): {
  isValid: boolean;
  message?: string;
  suggestedTag?: { id: number; name: string };
} => {
  const trimmedNewName = newTagName.trim().toLowerCase();

  if (!trimmedNewName) {
    return { isValid: false, message: "タグ名を入力してください" };
  }

  const duplicateTag = existingTags.find((tag) => {
    const existingName = tag.name.toLowerCase();
    // 完全一致
    if (existingName === trimmedNewName) return true;
    // 一方が他方を含む場合（類似性チェック）
    if (
      existingName.includes(trimmedNewName) ||
      trimmedNewName.includes(existingName)
    ) {
      return true;
    }
    return false;
  });

  if (duplicateTag) {
    return {
      isValid: false,
      message: `類似するタグ「${duplicateTag.name}」が既に存在します`,
      suggestedTag: { id: duplicateTag.id, name: duplicateTag.name },
    };
  }

  return { isValid: true };
};

// タグ作成用スキーマ
export const createTagSchema = z
  .object({
    name: z
      .string()
      .min(1, "タグ名を入力してください")
      .max(20, "タグ名は20文字以内で入力してください")
      .refine((name) => name.trim().length > 0, "タグ名を入力してください"),
    community_id: z.number().int().positive("コミュニティを選択してください"),
    existing_tags: z
      .array(
        z.object({
          id: z.number(),
          name: z.string(),
          community_id: z.number(),
        }),
      )
      .optional()
      .default([]),
  })
  .refine(
    (data) => {
      const validation = validateTagSimilarity(data.name, data.existing_tags);
      return validation.isValid;
    },
    (data) => ({
      message:
        validateTagSimilarity(data.name, data.existing_tags).message ||
        "無効なタグ名です",
      path: ["name"],
    }),
  );

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
    .any()
    .refine((files) => {
      if (typeof window === "undefined") return true; // サーバーサイドではスキップ
      return files instanceof FileList && files?.length === 1;
    }, "画像をアップロードしてください")
    .refine((files) => {
      if (typeof window === "undefined") return true; // サーバーサイドではスキップ
      return ["image/jpeg", "image/png"].includes(files?.[0]?.type || "");
    }, "対応している画像形式はJPEG、PNGです"),
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
    .any()
    .refine((files) => {
      if (typeof window === "undefined") return true; // サーバーサイドではスキップ
      return (
        files instanceof FileList && (files.length === 0 || files.length === 1)
      );
    }, "画像は1つまでアップロード可能です")
    .refine((files) => {
      if (typeof window === "undefined") return true; // サーバーサイドではスキップ
      return (
        files.length === 0 ||
        ["image/jpeg", "image/png"].includes(files[0]?.type || "")
      );
    }, "対応している画像形式はJPEG、PNGです"),
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
