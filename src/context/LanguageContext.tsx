"use client";

import { createContext } from "react";

export type Language = "ja" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
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
    "nav.user-ranking": "ユーザーランキング",

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

    // Home Header Status
    "home.header.title": "リアルタイム投票状況",

    // Right Panel
    "right.panel.trend.topics": "トレンドトピック",
    "right.panel.loading": "読み込み中...",
    "right.panel.data.error": "データ取得エラー",
    "right.panel.no.trend.tags": "トレンドタグがありません",
    "right.panel.top.users": "トップユーザー",
    "right.panel.view.all": "全て見る →",
    "right.panel.error.occurred": "エラーが発生しました",
    "right.panel.no.ranking.data": "ランキングデータがありません",
    "right.panel.user.fallback": "ユーザー",
    "right.panel.points": "pt",
    "right.panel.votes": "票",
    "right.panel.ending.soon": "終了間近",
    "right.panel.remaining": "残り",
    "right.panel.no.urgent.posts": "終了間近の投稿はありません",

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
    "create.post.submit.post": "議題を投稿する",

    // Grade Panel
    "grade.panel.membership.free": "無料会員",
    "grade.panel.membership.standard": "スタンダード",
    "grade.panel.membership.platinum": "プラチナ",
    "grade.panel.membership.diamond": "ダイヤモンド",
    "grade.panel.daily.posts": "本日の投稿",
    "grade.panel.remaining": "残り",
    "grade.panel.times": "回",
    "grade.panel.limit.reached": "制限到達",
    "grade.panel.post.limit.reached": "投稿制限到達",
    "grade.panel.remove.with.points": "30ポイントで解除",
    "grade.panel.today.posts": "今日の投稿数",
    "grade.panel.limit.count": "制限数",
    "grade.panel.remaining.posts": "残り投稿",
    "grade.panel.remove.limit.failed": "制限解除に失敗しました",

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
    "auth.login": "ログイン",
    "auth.login.title": "ログイン",
    "auth.signup.title": "新規登録",
    "auth.login.subtitle": "アカウントにログインしてください",
    "auth.signup.subtitle": "新しいアカウントを作成してください",
    "auth.email": "メールアドレス",
    "auth.email.placeholder": "your-email@example.com",
    "auth.password": "パスワード",
    "auth.password.placeholder": "パスワードを入力してください",
    "auth.password.confirm": "パスワード確認",
    "auth.password.confirm.placeholder": "パスワードを再入力してください",
    "auth.google.login": "Googleでログイン",
    "auth.google.signup": "Googleで登録",
    "auth.or": "または",
    "auth.processing": "処理中...",
    "auth.signup.success":
      "確認メールを送信しました。メールを確認してアカウントをアクティベートしてください。",
    "auth.switch.login": "ログイン",
    "auth.switch.signup": "新規登録",
    "auth.switch.login.text": "既にアカウントをお持ちの方は",
    "auth.switch.signup.text": "アカウントをお持ちでない方は",
    "auth.back.home": "← ホームページに戻る",
    "auth.error.callback": "認証エラーが発生しました",
    "auth.error.no_code": "認証コードが見つかりません",
    "auth.error.unexpected": "予期しないエラーが発生しました",
    "auth.validation.email.required": "メールアドレスを入力してください",
    "auth.validation.email.invalid": "有効なメールアドレスを入力してください",
    "auth.validation.password.required":
      "パスワードは6文字以上で入力してください",
    "auth.validation.password.max": "パスワードは100文字以内で入力してください",
    "auth.validation.password.confirm.required":
      "確認パスワードを入力してください",
    "auth.validation.password.mismatch": "パスワードが一致しません",

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

    // Comments Section
    "comment.title": "コメント",
    "comment.voting.ended": "投票期限が終了しています",
    "comment.voting.ended.desc":
      "この投稿の期限が過ぎているため、新しいコメントを投稿することはできません。",
    "comment.placeholder.main": "この投稿についてコメントを書く...",
    "comment.anonymous.user": "匿名ユーザー",
    "comment.post.as": "として投稿します",
    "comment.submitting": "投稿中",
    "comment.submit": "コメントを投稿",
    "comment.error.failed":
      "コメント登録中にエラーが発生しました。再度お試しください。",
    "comment.login.required": "コメントするにはログインしてください",
    "comment.user.comments": "ユーザーコメント",
    "comment.loading": "コメントを読み込み中...",
    "comment.no.comments":
      "まだコメントはありません。最初のコメントを投稿しましょう！",

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

    // Profile page
    "profile.page.not.found.title": "プロフィールが見つかりません",
    "profile.page.not.found.description":
      "ログインしてプロフィールを表示してください",
    "profile.page.you": "(あなた)",
    "profile.page.settings.edit": "設定と編集",
    "profile.page.posts.count": "投稿",
    "profile.page.votes.count": "投票",
    "profile.page.comments.count": "コメント",
    "profile.page.empathy.rank": "共感ランク",
    "profile.page.joined": "参加",
    "profile.page.calculate.scores": "既存投稿のスコア計算",
    "profile.page.calculate.scores.description":
      "※ 過去の投稿の品質度スコアと共感ポイントを計算します",
    "profile.page.your.posts": "あなたの投稿",
    "profile.page.user.posts": "の投稿",
    "profile.page.no.posts.title": "まだ投稿がありません",
    "profile.page.no.posts.own": "最初の投稿を作成してみましょう！",
    "profile.page.no.posts.other": "このユーザーはまだ投稿していません",
    "profile.page.score.calculating": "スコア計算を開始しています...",
    "profile.page.score.success":
      "スコア計算が完了しました！ページを更新してください。",
    "profile.page.score.error": "スコア計算中にエラーが発生しました。",
    "profile.page.score.failed": "スコア計算に失敗しました。",
    "profile.page.user.fallback": "ユーザー",

    // Quality Score Display
    "quality.score.title": "品質度スコア",
    "quality.score.no.posts": "まだ投稿がありません",
    "quality.score.no.posts.description":
      "投稿を作成すると品質度スコアが表示されます",
    "quality.score.rank.super": "スーパー",
    "quality.score.rank.excellent": "エクセレント",
    "quality.score.rank.good": "グッド",
    "quality.score.rank.average": "アベレージ",
    "quality.score.rank.needs.work": "ニーズワーク",
    "quality.score.rank.beginner": "ビギナー",
    "quality.score.rank.unrated": "未評価",
    "quality.score.average": "平均スコア",
    "quality.score.highest": "最高スコア",
    "quality.score.evaluated.posts": "評価済み投稿",
    "quality.score.rank.distribution": "ランク分布",
    "quality.score.recent.scores": "最新のスコア",

    // Empathy Points Display
    "empathy.points.title": "共感ポイント",
    "empathy.points.loading": "共感ポイントを取得中...",
    "empathy.points.points": "ポイント",
    "empathy.points.ranking": "ランキング",
    "empathy.points.next.rank": "次のランクまで",
    "empathy.points.current.rank": "現在のランク",
    "empathy.points.next.rank.progress": "次のランクへの進捗",
    "empathy.points.score.breakdown": "スコア内訳",
    "empathy.points.post.evaluation": "投稿評価",
    "empathy.points.comment.evaluation": "コメント評価",
    "empathy.points.participation.continuity": "参加継続",
    "empathy.points.community.contribution": "コミュニティ貢献",
    "empathy.points.interaction": "相互作用",
    "empathy.points.last.updated": "最終更新",

    // Empathy Ranks
    "empathy.rank.legend": "レジェンド",
    "empathy.rank.master": "マスター",
    "empathy.rank.expert": "エキスパート",
    "empathy.rank.active": "アクティブ",
    "empathy.rank.contributor": "コントリビューター",
    "empathy.rank.participant": "パーティシパント",
    "empathy.rank.new": "ニューカマー",
    "empathy.rank.position": "位",
    "empathy.rank.people": "人",
    "empathy.rank.to": "まで",

    // Common
    "common.back": "戻る",
    "common.edit": "編集",
    "common.save": "保存",
    "common.cancel": "キャンセル",
    "common.loading": "読み込み中...",
    "common.error": "エラー",
    "common.updating": "更新中...",
    "common.error.occurred": "エラーが発生しました",
    "common.login": "ログイン",
    "common.login.required": "ログインが必要です",
    "common.login.failed": "ログインに失敗しました",

    // Vote Button
    "vote.button.login.required": "投票するにはログインが必要です",
    "vote.button.agree": "賛成",
    "vote.button.disagree": "反対",
    "vote.button.voted.agree": "投票済み（賛成）",
    "vote.button.voted.disagree": "投票済み（反対）",
    "vote.button.derived.permission":
      "この派生質問は{targetText}者のみ投票できます",
    "vote.button.original.vote.required":
      "元の投稿に{targetText}投票すると投票権限が得られます",
    "vote.button.persuasion.time":
      "説得タイム中！投票を変更できます（1度限り）",
    "vote.button.persuasion.completed": "説得タイム中の投票変更完了",
    "vote.button.deadline": "投票期限",

    // Comments (Legacy - moved to Comments Section above)
    "comment.placeholder.reply": "返信を入力...",
    "comment.persuade.failed":
      "説得コメントの投稿に失敗しました。もう一度お試しください。",
    "comment.persuade.empty": "説得コメントを入力してください。",
    "comment.vote.empathy": "共感を示す",
    "comment.vote.oppose": "反対意見を示す",

    // AI Analysis
    "ai.analysis.completed": "AI分析が完了しました！",
    "ai.analysis.failed": "AI分析の実行に失敗しました",

    // Tag Stats
    "tag.stats.popularity.very.high": "非常に人気",
    "tag.stats.popularity.high": "人気",
    "tag.stats.popularity.medium": "普通",
    "tag.stats.popularity.low": "少し人気",
    "tag.stats.popularity.very.low": "活動少",
    "tag.stats.post.count": "投稿数",
    "tag.stats.vote.count": "投票数",
    "tag.stats.popularity": "人気度",
    "tag.stats.reaction.rate": "反応率",
    "tag.stats.avg.votes.per.post": "投稿あたり平均投票数",
    "tag.stats.popularity.score.formula": "人気度スコア",
    "tag.stats.activity.level": "活動レベル",

    // Common Stats
    "common.statistics": "統計情報",
    "common.created.date": "作成日",
    "common.high": "高",
    "common.medium": "中",
    "common.low": "低",
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

    // Home Header Status
    "home.header.title": "Real-time Voting Status",

    // Right Panel
    "right.panel.trend.topics": "Trending Topics",
    "right.panel.loading": "Loading...",
    "right.panel.data.error": "Data fetch error",
    "right.panel.no.trend.tags": "No trending tags available",
    "right.panel.top.users": "Top Users",
    "right.panel.view.all": "View All →",
    "right.panel.error.occurred": "An error occurred",
    "right.panel.no.ranking.data": "No ranking data available",
    "right.panel.user.fallback": "User",
    "right.panel.points": "pt",
    "right.panel.votes": "votes",
    "right.panel.ending.soon": "Ending Soon",
    "right.panel.remaining": "Remaining",
    "right.panel.no.urgent.posts": "No posts ending soon",

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
    "create.post.submit.post": "Submit Question",

    // Comments Section
    "comment.title": "Comments",
    "comment.voting.ended": "Voting has ended",
    "comment.voting.ended.desc":
      "Since this post's deadline has passed, you cannot post new comments.",
    "comment.placeholder.main": "Write a comment about this post...",
    "comment.anonymous.user": "Anonymous User",
    "comment.post.as": "will post as",
    "comment.submitting": "Submitting",
    "comment.submit": "Post Comment",
    "comment.error.failed":
      "An error occurred while registering the comment. Please try again.",
    "comment.login.required": "Please log in to comment",
    "comment.user.comments": "User Comments",
    "comment.loading": "Loading comments...",
    "comment.no.comments": "No comments yet. Post the first comment!",

    // Grade Panel
    "grade.panel.membership.free": "Free Member",
    "grade.panel.membership.standard": "Standard",
    "grade.panel.membership.platinum": "Platinum",
    "grade.panel.membership.diamond": "Diamond",
    "grade.panel.daily.posts": "Today's Posts",
    "grade.panel.remaining": "remaining",
    "grade.panel.times": "times",
    "grade.panel.limit.reached": "limit reached",
    "grade.panel.post.limit.reached": "Post Limit Reached",
    "grade.panel.remove.with.points": "Remove with 30 Points",
    "grade.panel.today.posts": "Today's Posts",
    "grade.panel.limit.count": "Limit",
    "grade.panel.remaining.posts": "Remaining Posts",
    "grade.panel.remove.limit.failed": "Failed to remove limit",

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
    "auth.login": "Login",
    "auth.login.title": "Login",
    "auth.signup.title": "Sign Up",
    "auth.login.subtitle": "Sign in to your account",
    "auth.signup.subtitle": "Create a new account",
    "auth.email": "Email Address",
    "auth.email.placeholder": "your-email@example.com",
    "auth.password": "Password",
    "auth.password.placeholder": "Enter your password",
    "auth.password.confirm": "Confirm Password",
    "auth.password.confirm.placeholder": "Re-enter your password",
    "auth.google.login": "Sign in with Google",
    "auth.google.signup": "Sign up with Google",
    "auth.or": "or",
    "auth.processing": "Processing...",
    "auth.signup.success":
      "Confirmation email sent. Please check your email to activate your account.",
    "auth.switch.login": "Login",
    "auth.switch.signup": "Sign Up",
    "auth.switch.login.text": "Already have an account?",
    "auth.switch.signup.text": "Don't have an account?",
    "auth.back.home": "← Back to Home",
    "auth.error.callback": "Authentication error occurred",
    "auth.error.no_code": "Authentication code not found",
    "auth.error.unexpected": "An unexpected error occurred",
    "auth.validation.email.required": "Please enter your email address",
    "auth.validation.email.invalid": "Please enter a valid email address",
    "auth.validation.password.required":
      "Password must be at least 6 characters",
    "auth.validation.password.max": "Password must be within 100 characters",
    "auth.validation.password.confirm.required": "Please confirm your password",
    "auth.validation.password.mismatch": "Passwords do not match",

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

    // Profile page
    "profile.page.not.found.title": "Profile not found",
    "profile.page.not.found.description": "Please log in to view profile",
    "profile.page.you": "(You)",
    "profile.page.settings.edit": "Settings & Edit",
    "profile.page.posts.count": "Posts",
    "profile.page.votes.count": "Votes",
    "profile.page.comments.count": "Comments",
    "profile.page.empathy.rank": "Empathy Rank",
    "profile.page.joined": "Joined",
    "profile.page.calculate.scores": "Calculate Existing Post Scores",
    "profile.page.calculate.scores.description":
      "※ Calculate quality scores and empathy points for past posts",
    "profile.page.your.posts": "Your Posts",
    "profile.page.user.posts": "'s Posts",
    "profile.page.no.posts.title": "No posts yet",
    "profile.page.no.posts.own": "Create your first post!",
    "profile.page.no.posts.other": "This user hasn't posted anything yet",
    "profile.page.score.calculating": "Starting score calculation...",
    "profile.page.score.success":
      "Score calculation completed! Please refresh the page.",
    "profile.page.score.error": "An error occurred during score calculation.",
    "profile.page.score.failed": "Score calculation failed.",
    "profile.page.user.fallback": "User",

    // Quality Score Display
    "quality.score.title": "Quality Score",
    "quality.score.no.posts": "No posts yet",
    "quality.score.no.posts.description":
      "Quality score will be displayed once you create posts",
    "quality.score.rank.super": "Super",
    "quality.score.rank.excellent": "Excellent",
    "quality.score.rank.good": "Good",
    "quality.score.rank.average": "Average",
    "quality.score.rank.needs.work": "Needs Work",
    "quality.score.rank.beginner": "Beginner",
    "quality.score.rank.unrated": "Unrated",
    "quality.score.average": "Average Score",
    "quality.score.highest": "Highest Score",
    "quality.score.evaluated.posts": "Evaluated Posts",
    "quality.score.rank.distribution": "Rank Distribution",
    "quality.score.recent.scores": "Recent Scores",

    // Empathy Points Display
    "empathy.points.title": "Empathy Points",
    "empathy.points.loading": "Loading empathy points...",
    "empathy.points.points": "Points",
    "empathy.points.ranking": "Ranking",
    "empathy.points.next.rank": "To Next Rank",
    "empathy.points.current.rank": "Current Rank",
    "empathy.points.next.rank.progress": "Progress to Next Rank",
    "empathy.points.score.breakdown": "Score Breakdown",
    "empathy.points.post.evaluation": "Post Evaluation",
    "empathy.points.comment.evaluation": "Comment Evaluation",
    "empathy.points.participation.continuity": "Participation Continuity",
    "empathy.points.community.contribution": "Community Contribution",
    "empathy.points.interaction": "Interaction",
    "empathy.points.last.updated": "Last Updated",

    // Empathy Ranks
    "empathy.rank.legend": "Legend",
    "empathy.rank.master": "Master",
    "empathy.rank.expert": "Expert",
    "empathy.rank.active": "Active",
    "empathy.rank.contributor": "Contributor",
    "empathy.rank.participant": "Participant",
    "empathy.rank.new": "Newcomer",
    "empathy.rank.position": "th",
    "empathy.rank.people": "",
    "empathy.rank.to": "to",

    // Common
    "common.back": "Back",
    "common.edit": "Edit",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.updating": "Updating...",
    "common.error.occurred": "An error occurred",
    "common.login": "Login",
    "common.login.required": "Login required",
    "common.login.failed": "Login failed",

    // Vote Button
    "vote.button.login.required": "Login required to vote",
    "vote.button.agree": "Agree",
    "vote.button.disagree": "Disagree",
    "vote.button.voted.agree": "Voted (Agree)",
    "vote.button.voted.disagree": "Voted (Disagree)",
    "vote.button.derived.permission":
      "Only {targetText} voters can vote on this derived question",
    "vote.button.original.vote.required":
      "Vote {targetText} on the original post to gain voting rights",
    "vote.button.persuasion.time":
      "Persuasion time! You can change your vote (once only)",
    "vote.button.persuasion.completed":
      "Vote change during persuasion time completed",
    "vote.button.deadline": "Vote Deadline",

    // Comments (Legacy - moved to Comments Section above)
    "comment.placeholder.reply": "Enter reply...",
    "comment.persuade.failed":
      "Failed to post persuasive comment. Please try again.",
    "comment.persuade.empty": "Please enter a persuasive comment.",
    "comment.vote.empathy": "Show empathy",
    "comment.vote.oppose": "Show opposition",

    // AI Analysis
    "ai.analysis.completed": "AI analysis completed!",
    "ai.analysis.failed": "AI analysis execution failed",

    // Tag Stats
    "tag.stats.popularity.very.high": "Very Popular",
    "tag.stats.popularity.high": "Popular",
    "tag.stats.popularity.medium": "Medium",
    "tag.stats.popularity.low": "Slightly Popular",
    "tag.stats.popularity.very.low": "Low Activity",
    "tag.stats.post.count": "Posts",
    "tag.stats.vote.count": "Votes",
    "tag.stats.popularity": "Popularity",
    "tag.stats.reaction.rate": "Reaction Rate",
    "tag.stats.avg.votes.per.post": "Average votes per post",
    "tag.stats.popularity.score.formula": "Popularity Score",
    "tag.stats.activity.level": "Activity Level",

    // Common Stats
    "common.statistics": "Statistics",
    "common.created.date": "Created",
    "common.high": "High",
    "common.medium": "Medium",
    "common.low": "Low",
  },
};
