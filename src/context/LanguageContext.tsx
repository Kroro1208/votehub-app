import { createContext } from "react";

export type Language = "ja" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const translations = {
  ja: {
    // Navigation
    "nav.home": "投票場",
    "nav.trending": "人気の投票",
    "nav.results": "結果発表",
    "nav.bookmarks": "ブックマーク",
    "nav.stats": "統計",
    "nav.space": "スペース",
    "nav.settings": "設定",
    "nav.notifications": "通知",
    "nav.create": "投稿作成",

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
    "home.title": "議題一覧",
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
    "space.create": "スペース作成",
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

    // Auth
    "auth.login.required": "ログインが必要です",
    "auth.sign.out": "ログアウト",
    "auth.sign.up": "新規登録",

    // Bookmarks
    "bookmarks.title": "ブックマーク",
    "bookmarks.description": "保存した投稿を確認できます",
    "bookmarks.empty.title": "ブックマークがありません",
    "bookmarks.empty.description": "気になる投稿をブックマークしてみましょう！",

    // Ranking
    "ranking.title": "ユーザーランキング",
    "ranking.description": "コミュニティで活躍しているユーザーをチェック！",
    "ranking.your.rank": "あなたの順位",
    "ranking.user.fallback": "名無しユーザー",
    "ranking.quality.score": "品質スコア",
    "ranking.empathy.points": "共感ポイント",
    "ranking.empty.title": "ユーザーがいません",
    "ranking.empty.description": "まだユーザーが参加していません",

    // Posts
    "posts.count": "投稿",
    "votes.count": "票",
    "comments.count": "コメント",

    // Sort
    "sort.new": "新着順",
    "sort.popular": "人気順",
    "sort.deadline": "期限順",

    // Profile
    "profile.not.set": "未設定",
    "profile.bio.empty": "自己紹介がありません",
    "profile.image.change": "画像を変更",
    "profile.name.label": "表示名",
    "profile.name.placeholder": "表示名を入力してください",
    "profile.bio.label": "自己紹介",
    "profile.bio.placeholder": "自己紹介を入力してください",

    // Welcome
    "welcome.slide1.title": "投票コミュニティへようこそ！",
    "welcome.slide1.description": "みんなで議論し、投票で決めよう",
    "welcome.slide1.feature1": "リアルタイム投票",
    "welcome.slide1.feature2": "コミュニティ機能",
    "welcome.slide1.feature3": "意見交換",
    "welcome.slide2.title": "スペースを作成しよう",
    "welcome.slide2.description": "興味のあるトピックでコミュニティを作成",
    "welcome.slide2.feature1": "トピック別議論",
    "welcome.slide2.feature2": "メンバー管理",
    "welcome.slide2.feature3": "投票管理",
    "welcome.slide3.title": "さあ、始めましょう！",
    "welcome.slide3.description": "今すぐ参加して投票を楽しもう",
    "welcome.navigation.previous": "前へ",
    "welcome.navigation.next": "次へ",
    "welcome.navigation.start": "始める",

    // Comments
    "comment.placeholder": "コメントを入力してください...",

    // Nested Posts
    "post.nested.title.placeholder": "タイトルを入力してください",
    "post.nested.agree.placeholder": "賛成意見を入力してください",
    "post.nested.disagree.placeholder": "反対意見を入力してください",
    "post.nested.details.placeholder": "詳細を入力してください",
    "post.nested.target.placeholder": "対象を選択してください",

    // 2FA/MFA
    "mfa.title": "2段階認証（MFA）",
    "mfa.description":
      "Supabase公式のMFA機能を使用してアカウントのセキュリティを強化",
    "mfa.setup.required": "認証アプリが必要です",
    "mfa.setup.install":
      "Google Authenticator、Microsoft Authenticator、Authyなどの認証アプリをスマートフォンにインストールしてください。",
    "mfa.setup.steps": "設定手順:",
    "mfa.setup.step1": "認証アプリをスマートフォンにインストール",
    "mfa.setup.step2": "「MFAを設定」ボタンをクリック",
    "mfa.setup.step3": "QRコードをスキャンまたは手動でキーを入力",
    "mfa.setup.step4": "認証アプリに表示される6桁のコードを入力",
    "mfa.setup.button": "MFAを設定",
    "mfa.setup.preparing": "設定準備中...",
    "mfa.enabled": "MFAが有効化されています",
    "mfa.enabled.description":
      "あなたのアカウントは2段階認証で保護されています。",
    "mfa.registered.methods": "登録済みの認証方法:",
    "mfa.app.name": "認証アプリ",
    "mfa.disable": "無効化",
    "mfa.disable.confirm": "MFAを無効化してもよろしいですか？",
    "mfa.modal.title": "MFA認証アプリを設定",
    "mfa.modal.description":
      "認証アプリでQRコードをスキャンし、表示されるコードを入力してください",
    "mfa.modal.preparing": "MFA設定を準備中...",
    "mfa.modal.manual.key": "認証アプリに以下のキーを手動で入力してください:",
    "mfa.modal.code.label": "認証コード（6桁）",
    "mfa.modal.code.placeholder": "123456",
    "mfa.modal.code.note":
      "認証アプリに表示される6桁のコードは30秒ごとに変更されます。",
    "mfa.modal.verify": "認証して有効化",
    "mfa.modal.verifying": "検証中...",
    "mfa.error.code.required": "認証コードを入力してください",
    "mfa.error.code.length": "認証コードは6桁で入力してください",
    "mfa.error.code.format": "認証コードは6桁の数字で入力してください",

    // Profile form labels and placeholders
    "profile.image.change.instruction": "プロフィール画像をクリックして変更",
    "profile.name.display": "表示名",
    "profile.name.example": "あなたの名前",
    "profile.bio.description": "自己紹介",
    "profile.bio.example": "あなたについて教えてください...",

    // Payment section
    "payment.title": "支払い・サブスクリプション",
    "payment.description": "プレミアム機能やサブスクリプションの管理",
    "payment.current.plan": "現在のプラン",
    "payment.free.plan": "無料プラン",
    "payment.coming.soon": "近日公開",
    "payment.premium.title": "プレミアム機能",
    "payment.premium.unlimited": "無制限の投稿作成",
    "payment.premium.analytics": "高度な分析機能",
    "payment.premium.support": "優先サポート",
    "payment.premium.no.ads": "広告非表示",

    // Account information
    "account.title": "アカウント情報",
    "account.email": "メールアドレス",
    "account.joined": "登録日",

    // Common
    "common.back": "戻る",
    "common.edit": "編集",
    "common.save": "保存",
    "common.cancel": "キャンセル",
    "common.loading": "読み込み中...",
    "common.error": "エラー",
    "common.updating": "更新中...",
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

    // Auth
    "auth.login.required": "Login is required",
    "auth.sign.out": "Sign Out",
    "auth.sign.up": "Sign Up",

    // Bookmarks
    "bookmarks.title": "Bookmarks",
    "bookmarks.description": "View your saved posts",
    "bookmarks.empty.title": "No bookmarks yet",
    "bookmarks.empty.description":
      "Bookmark interesting posts to see them here!",

    // Ranking
    "ranking.title": "User Ranking",
    "ranking.description": "Check out the most active users in the community!",
    "ranking.your.rank": "Your Rank",
    "ranking.user.fallback": "Anonymous User",
    "ranking.quality.score": "Quality Score",
    "ranking.empathy.points": "Empathy Points",
    "ranking.empty.title": "No users found",
    "ranking.empty.description": "No users have joined yet",

    // Posts
    "posts.count": "posts",
    "votes.count": "votes",
    "comments.count": "comments",

    // Sort
    "sort.new": "Newest",
    "sort.popular": "Popular",
    "sort.deadline": "Deadline",

    // Profile
    "profile.not.set": "Not set",
    "profile.bio.empty": "No bio available",
    "profile.image.change": "Change image",
    "profile.name.label": "Display Name",
    "profile.name.placeholder": "Enter your display name",
    "profile.bio.label": "Bio",
    "profile.bio.placeholder": "Enter your bio",

    // Welcome
    "welcome.slide1.title": "Welcome to Voting Community!",
    "welcome.slide1.description": "Discuss together and decide by voting",
    "welcome.slide1.feature1": "Real-time voting",
    "welcome.slide1.feature2": "Community features",
    "welcome.slide1.feature3": "Opinion exchange",
    "welcome.slide2.title": "Create Spaces",
    "welcome.slide2.description":
      "Create communities on topics you're interested in",
    "welcome.slide2.feature1": "Topic-based discussions",
    "welcome.slide2.feature2": "Member management",
    "welcome.slide2.feature3": "Vote management",
    "welcome.slide3.title": "Let's get started!",
    "welcome.slide3.description": "Join now and enjoy voting",
    "welcome.navigation.previous": "Previous",
    "welcome.navigation.next": "Next",
    "welcome.navigation.start": "Get Started",

    // Comments
    "comment.placeholder": "Enter your comment...",

    // Nested Posts
    "post.nested.title.placeholder": "Enter title",
    "post.nested.agree.placeholder": "Enter supporting opinion",
    "post.nested.disagree.placeholder": "Enter opposing opinion",
    "post.nested.details.placeholder": "Enter details",
    "post.nested.target.placeholder": "Select target",

    // 2FA/MFA
    "mfa.title": "Two-Factor Authentication (MFA)",
    "mfa.description":
      "Enhance your account security using Supabase's official MFA feature",
    "mfa.setup.required": "Authentication app required",
    "mfa.setup.install":
      "Please install an authentication app like Google Authenticator, Microsoft Authenticator, or Authy on your smartphone.",
    "mfa.setup.steps": "Setup steps:",
    "mfa.setup.step1": "Install authentication app on your smartphone",
    "mfa.setup.step2": 'Click "Setup MFA" button',
    "mfa.setup.step3": "Scan QR code or manually enter the key",
    "mfa.setup.step4":
      "Enter the 6-digit code displayed in your authentication app",
    "mfa.setup.button": "Setup MFA",
    "mfa.setup.preparing": "Preparing setup...",
    "mfa.enabled": "MFA is enabled",
    "mfa.enabled.description":
      "Your account is protected with two-factor authentication.",
    "mfa.registered.methods": "Registered authentication methods:",
    "mfa.app.name": "Authentication App",
    "mfa.disable": "Disable",
    "mfa.disable.confirm": "Are you sure you want to disable MFA?",
    "mfa.modal.title": "Setup MFA Authentication App",
    "mfa.modal.description":
      "Scan the QR code with your authentication app and enter the displayed code",
    "mfa.modal.preparing": "Preparing MFA setup...",
    "mfa.modal.manual.key":
      "Manually enter the following key in your authentication app:",
    "mfa.modal.code.label": "Authentication Code (6 digits)",
    "mfa.modal.code.placeholder": "123456",
    "mfa.modal.code.note":
      "The 6-digit code displayed in your authentication app changes every 30 seconds.",
    "mfa.modal.verify": "Verify and Enable",
    "mfa.modal.verifying": "Verifying...",
    "mfa.error.code.required": "Please enter the authentication code",
    "mfa.error.code.length": "Authentication code must be 6 digits",
    "mfa.error.code.format": "Authentication code must be 6 numeric digits",

    // Profile form labels and placeholders
    "profile.image.change.instruction": "Click profile image to change",
    "profile.name.display": "Display Name",
    "profile.name.example": "Your name",
    "profile.bio.description": "Bio",
    "profile.bio.example": "Tell us about yourself...",

    // Payment section
    "payment.title": "Payment & Subscription",
    "payment.description": "Manage premium features and subscriptions",
    "payment.current.plan": "Current Plan",
    "payment.free.plan": "Free Plan",
    "payment.coming.soon": "Coming Soon",
    "payment.premium.title": "Premium Features",
    "payment.premium.unlimited": "Unlimited post creation",
    "payment.premium.analytics": "Advanced analytics",
    "payment.premium.support": "Priority support",
    "payment.premium.no.ads": "Ad-free experience",

    // Account information
    "account.title": "Account Information",
    "account.email": "Email Address",
    "account.joined": "Joined",

    // Common
    "common.back": "Back",
    "common.edit": "Edit",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.updating": "Updating...",
  },
};
