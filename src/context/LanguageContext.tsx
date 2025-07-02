import { createContext, useContext, useState, ReactNode } from "react";

type Language = "ja" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

// Translation dictionaries
const translations = {
  ja: {
    // Navigation
    "nav.home": "投票中",
    "nav.trending": "人気の投票",
    "nav.results": "結果発表",
    "nav.bookmarks": "ブックマーク",
    "nav.stats": "統計",
    "nav.space": "スペース",
    "nav.settings": "設定",
    "nav.notifications": "通知",
    "nav.create": "投票を作成",

    // Settings
    "settings.title": "設定",
    "settings.profile": "プロフィール設定",
    "settings.language": "言語設定",
    "settings.theme": "テーマ設定",
    "settings.payment": "支払い・サブスクリプション",
    "settings.account": "アカウント情報",
    "settings.profile.edit": "編集",
    "settings.profile.save": "保存",
    "settings.profile.cancel": "キャンセル",
    "settings.profile.name": "表示名",
    "settings.profile.bio": "自己紹介",
    "settings.profile.updating": "更新中...",
    "settings.language.description": "アプリの表示言語を選択してください",
    "settings.theme.light": "ライトモード",
    "settings.theme.dark": "ダークモード",
    "settings.theme.light.description": "明るいテーマで表示されています",
    "settings.theme.dark.description": "暗いテーマで表示されています",
    "settings.payment.current": "現在のプラン",
    "settings.payment.free": "無料プラン",
    "settings.payment.premium": "プレミアム機能",
    "settings.payment.coming": "近日公開",
    "settings.account.email": "メールアドレス",
    "settings.account.joined": "登録日",

    // Messages
    "message.profile.updated": "プロフィールを更新しました",
    "message.profile.update.failed": "プロフィールの更新に失敗しました",
    "message.image.uploaded": "画像をアップロードしました",
    "message.image.upload.failed": "画像のアップロードに失敗しました",
    "message.theme.light": "ライトモードに切り替えました",
    "message.theme.dark": "ダークモードに切り替えました",
    "message.language.ja": "言語を日本語に設定しました",
    "message.language.en": "Language set to English",

    // Home Page
    "home.title": "投票中の質問",
    "home.no.posts": "投稿がありません",
    "home.no.posts.description": "新しい投稿を作成してみましょう！",
    "home.stats.voting": "投票中",
    "home.stats.today.participation": "今日の参加",
    "home.stats.active.users": "アクティブユーザー",
    "home.tabs.all": "すべて",
    "home.tabs.urgent": "期限間近",
    "home.tabs.popular": "人気",
    "home.tabs.recent": "新着",

    // Create Post Page
    "create.post.title": "新しい投稿を作成",
    "create.post.question": "質問",
    "create.post.question.placeholder": "あなたの質問を入力してください...",
    "create.post.description": "説明",
    "create.post.description.placeholder":
      "質問の詳細説明を入力してください...",
    "create.post.image": "画像",
    "create.post.image.upload": "画像をアップロード",
    "create.post.submit": "投稿を作成",
    "create.post.submitting": "作成中...",
    "create.post.subtitle": "あなたの意見に対しての投票を募りましょう",
    "create.post.content.title": "内容",
    "create.post.content.pro": "賛成意見",
    "create.post.content.pro.placeholder": "賛成意見の内容を書いてください",
    "create.post.content.con": "反対意見",
    "create.post.content.con.placeholder": "反対意見の内容を書いてください...",
    "create.post.content.detail": "詳細説明（任意）",
    "create.post.content.detail.placeholder":
      "追加の補足説明があれば記入してください...",
    "create.post.content.note":
      "両方の視点を示すことで、より建設的な議論が期待できます",
    "create.post.content.characters": "文字",
    "create.post.space": "スペース",
    "create.post.space.placeholder": "スペースを選択してください",
    "create.post.deadline": "投票期限",
    "create.post.deadline.placeholder": "投票期限を選択してください",
    "create.post.category": "カテゴリ（タグ）",
    "create.post.category.placeholder": "カテゴリを選択してください",
    "create.post.category.none": "カテゴリなし",
    "create.post.category.new": "新しいカテゴリ名",
    "create.post.category.new.login": "ログインしてタグを作成",
    "create.post.category.create": "作成",
    "create.post.category.creating": "作成中...",
    "create.post.category.example":
      "例: サッカー、筋トレ、ヨガなど（20文字以内）",
    "create.post.category.login.required":
      "新しいカテゴリを作成するにはログインが必要です",
    "create.post.image.title": "画像アップロード",
    "create.post.image.placeholder": "画像をアップロードしてください",
    "create.post.image.preview": "プレビュー",
    "create.post.deadline.title": "投票期限",
    "create.post.tag.title": "カテゴリ（タグ）",
    "create.post.tag.select": "カテゴリを選択してください",
    "create.post.tag.none": "カテゴリなし",
    "create.post.tag.create.placeholder": "新しいカテゴリ名",
    "create.post.tag.create.placeholder.login": "ログインしてタグを作成",
    "create.post.tag.create.button": "作成",
    "create.post.tag.create.button.creating": "作成中...",
    "create.post.tag.example": "例: サッカー、筋トレ、ヨガなど（20文字以内）",
    "create.post.tag.login.required":
      "新しいカテゴリを作成するにはログインが必要です",
    "create.post.content.pro.prefix": "賛成:",
    "create.post.content.con.prefix": "反対:",
    "create.post.error.login.required": "ログインが必要です",
    "create.post.error.create.failed": "投稿の作成に失敗しました",
    "create.post.error.tag.login.required":
      "タグを作成するにはログインが必要です",
    "create.post.error.tag.name.space.required":
      "タグ名とスペースを選択してください",
    "create.post.error.tag.duplicate": "このタグ名は既に存在します",
    "create.post.success.tag.created": "新しいタグを作成しました",
    "create.post.error.tag.create.failed": "タグの作成に失敗しました",
    "create.post.error.tag.exists": "このタグ名は既に存在します。",
    "create.post.error.tag.permission":
      "タグ作成の権限がありません。ログインしてください。",
    "create.post.error.tag.id.failed":
      "ID生成でエラーが発生しました。もう一度お試しください。",
    "create.post.error.tag.db.error":
      "タグ作成でデータベースエラーが発生しました。",
    "create.post.error.tag.retry":
      "タグ作成に失敗しました。もう一度お試しください。",
    "create.post.publish": "投稿を公開する",

    // Space Page
    "space.title": "スペース",
    "space.create": "スペースを作成",
    "space.description":
      "興味のあるトピックで仲間と繋がり、意見を交換し、一緒に投票を楽しみましょう",
    "space.no.communities": "コミュニティがありません",
    "space.no.communities.description":
      "新しいコミュニティを作成してみましょう！",

    // Create Space Page
    "create.space.title": "新しいスペースを作成",
    "create.space.subtitle": "コミュニティを作成して、仲間とつながりましょう",
    "create.space.name": "スペース名",
    "create.space.name.placeholder": "スペース名を入力してください...",
    "create.space.description": "説明",
    "create.space.description.placeholder":
      "スペースの説明を入力してください...",
    "create.space.submit": "スペースを作成",
    "create.space.submitting": "作成中...",
    "create.space.success": "スペースが作成されました",
    "create.space.error.name.exists": "このスペース名は既に使用されています",
    "create.space.error.failed": "スペース作成中にエラーが発生しました",
    "create.space.error.retry": "もう一度お試しください",
    "create.space.footer": "作成したスペースは後から編集できます",

    // Common
    "common.back": "戻る",
    "common.edit": "編集",
    "common.save": "保存",
    "common.cancel": "キャンセル",
    "common.loading": "読み込み中...",
    "common.error": "エラー",
  },
  en: {
    // Navigation
    "nav.home": "Voting",
    "nav.trending": "Popular Votes",
    "nav.results": "Results",
    "nav.bookmarks": "Bookmarks",
    "nav.stats": "Statistics",
    "nav.space": "Spaces",
    "nav.settings": "Settings",
    "nav.notifications": "Notifications",
    "nav.create": "Create Vote",

    // Settings
    "settings.title": "Settings",
    "settings.profile": "Profile Settings",
    "settings.language": "Language Settings",
    "settings.theme": "Theme Settings",
    "settings.payment": "Payment & Subscription",
    "settings.account": "Account Information",
    "settings.profile.edit": "Edit",
    "settings.profile.save": "Save",
    "settings.profile.cancel": "Cancel",
    "settings.profile.name": "Display Name",
    "settings.profile.bio": "Bio",
    "settings.profile.updating": "Updating...",
    "settings.language.description":
      "Select your preferred language for the app",
    "settings.theme.light": "Light Mode",
    "settings.theme.dark": "Dark Mode",
    "settings.theme.light.description": "Using light theme",
    "settings.theme.dark.description": "Using dark theme",
    "settings.payment.current": "Current Plan",
    "settings.payment.free": "Free Plan",
    "settings.payment.premium": "Premium Features",
    "settings.payment.coming": "Coming Soon",
    "settings.account.email": "Email Address",
    "settings.account.joined": "Joined",

    // Messages
    "message.profile.updated": "Profile updated successfully",
    "message.profile.update.failed": "Failed to update profile",
    "message.image.uploaded": "Image uploaded successfully",
    "message.image.upload.failed": "Failed to upload image",
    "message.theme.light": "Switched to light mode",
    "message.theme.dark": "Switched to dark mode",
    "message.language.ja": "言語を日本語に設定しました",
    "message.language.en": "Language set to English",

    // Home Page
    "home.title": "Active Questions",
    "home.no.posts": "No posts available",
    "home.no.posts.description": "Create a new post to get started!",
    "home.stats.voting": "Voting",
    "home.stats.today.participation": "Today's Participation",
    "home.stats.active.users": "Active Users",
    "home.tabs.all": "All",
    "home.tabs.urgent": "Urgent",
    "home.tabs.popular": "Popular",
    "home.tabs.recent": "Recent",

    // Create Post Page
    "create.post.title": "Create New Post",
    "create.post.question": "Question",
    "create.post.question.placeholder": "Enter your question...",
    "create.post.description": "Description",
    "create.post.description.placeholder":
      "Enter detailed description of your question...",
    "create.post.image": "Image",
    "create.post.image.upload": "Upload Image",
    "create.post.submit": "Create Post",
    "create.post.submitting": "Creating...",
    "create.post.subtitle": "Let others vote on your opinion",
    "create.post.content.title": "Content",
    "create.post.content.pro": "Agree Opinion",
    "create.post.content.pro.placeholder": "Write your supporting argument",
    "create.post.content.con": "Disagree Opinion",
    "create.post.content.con.placeholder": "Write your opposing argument...",
    "create.post.content.detail": "Additional Details (Optional)",
    "create.post.content.detail.placeholder":
      "Add any additional explanation if needed...",
    "create.post.content.note":
      "Showing both perspectives encourages more constructive discussion",
    "create.post.content.characters": "characters",
    "create.post.space": "Space",
    "create.post.space.placeholder": "Select a space",
    "create.post.deadline": "Vote Deadline",
    "create.post.deadline.placeholder": "Select vote deadline",
    "create.post.category": "Category (Tag)",
    "create.post.category.placeholder": "Select a category",
    "create.post.category.none": "No category",
    "create.post.category.new": "New category name",
    "create.post.category.new.login": "Login to create tags",
    "create.post.category.create": "Create",
    "create.post.category.creating": "Creating...",
    "create.post.category.example":
      "e.g., Soccer, Fitness, Yoga, etc. (max 20 chars)",
    "create.post.category.login.required":
      "Login required to create new categories",
    "create.post.image.title": "Image Upload",
    "create.post.image.placeholder": "Upload an image",
    "create.post.image.preview": "Preview",
    "create.post.deadline.title": "Vote Deadline",
    "create.post.tag.title": "Category (Tag)",
    "create.post.tag.select": "Select a category",
    "create.post.tag.none": "No category",
    "create.post.tag.create.placeholder": "New category name",
    "create.post.tag.create.placeholder.login": "Login to create tags",
    "create.post.tag.create.button": "Create",
    "create.post.tag.create.button.creating": "Creating...",
    "create.post.tag.example":
      "e.g., Soccer, Fitness, Yoga, etc. (max 20 chars)",
    "create.post.tag.login.required": "Login required to create new categories",
    "create.post.content.pro.prefix": "Agree:",
    "create.post.content.con.prefix": "Disagree:",
    "create.post.error.login.required": "Login is required",
    "create.post.error.create.failed": "Failed to create post",
    "create.post.error.tag.login.required": "Login required to create tags",
    "create.post.error.tag.name.space.required":
      "Please enter tag name and select space",
    "create.post.error.tag.duplicate": "This tag name already exists",
    "create.post.success.tag.created": "New tag created successfully",
    "create.post.error.tag.create.failed": "Failed to create tag",
    "create.post.error.tag.exists": "This tag name already exists.",
    "create.post.error.tag.permission":
      "No permission to create tags. Please log in.",
    "create.post.error.tag.id.failed":
      "Error occurred in ID generation. Please try again.",
    "create.post.error.tag.db.error":
      "Database error occurred while creating tag.",
    "create.post.error.tag.retry": "Failed to create tag. Please try again.",
    "create.post.publish": "Publish Post",

    // Space Page
    "space.title": "Spaces",
    "space.create": "Create Space",
    "space.description":
      "Connect with like-minded people on topics you're interested in, exchange opinions, and enjoy voting together",
    "space.no.communities": "No communities available",
    "space.no.communities.description":
      "Create a new community to get started!",

    // Create Space Page
    "create.space.title": "Create New Space",
    "create.space.subtitle":
      "Create a community and connect with like-minded people",
    "create.space.name": "Space Name",
    "create.space.name.placeholder": "Enter space name...",
    "create.space.description": "Description",
    "create.space.description.placeholder": "Enter space description...",
    "create.space.submit": "Create Space",
    "create.space.submitting": "Creating...",
    "create.space.success": "Space created successfully",
    "create.space.error.name.exists": "This space name is already in use",
    "create.space.error.failed": "Error occurred while creating space",
    "create.space.error.retry": "Please try again",
    "create.space.footer": "Created spaces can be edited later",

    // Common
    "common.back": "Back",
    "common.edit": "Edit",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.loading": "Loading...",
    "common.error": "Error",
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check localStorage first, then browser language
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && (savedLanguage === "ja" || savedLanguage === "en")) {
      return savedLanguage;
    }

    // Check browser language
    const browserLanguage = navigator.language.toLowerCase();
    if (browserLanguage.startsWith("ja")) {
      return "ja";
    }

    return "en";
  });

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem("language", newLanguage);
  };

  const t = (key: string): string => {
    return (
      translations[language][
        key as keyof (typeof translations)[typeof language]
      ] || key
    );
  };

  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
