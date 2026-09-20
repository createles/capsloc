import { en } from "./en";

export const ja: typeof en = {
  // 1. Top Header & Global Shell
  "header.studioSubtitle": "ローカライゼーションスタジオ",
  "header.connected": "接続中",
  "header.reconnecting": "再接続中...",
  "header.signOut": "サインアウト",
  "app.connecting": "CapsLoc に接続中...",

  // 2. Channel Sidebar
  "sidebar.filterPlaceholder": "チャンネルや同僚を検索...",
  "sidebar.projectChannels": "プロジェクトチャンネル",
  "sidebar.directMessages": "ダイレクトメッセージ",
  "sidebar.createChannel": "チャンネルを作成",
  "sidebar.startDm": "ダイレクトメッセージを開始",
  "sidebar.loadingChannels": "チャンネルを読み込み中...",
  "sidebar.noChannelsMatch": "一致するチャンネルがありません",
  "sidebar.noProjectChannels": "プロジェクトチャンネルがありません",
  "sidebar.noDmsMatch": "一致する同僚がいません",
  "sidebar.noDms": "ダイレクトメッセージがありません",
  "sidebar.quickStatus": "クイックステータス",
  "sidebar.clear": "クリア",
  "sidebar.writeCustom": "+ ステータスを自由に入力...",
  "sidebar.typeStatus": "ステータスを入力...",
  "sidebar.editFullProfile": "クリックしてプロフィールを編集",
  "sidebar.online": "オンライン",
  "sidebar.offline": "オフライン",

  // Quick Status Presets
  "status.onBreak": "休憩中",
  "status.lqaTesting": "LQAテスト中",
  "status.focusMode": "集中モード",
  "status.lunchBreak": "昼休み",
  "status.away": "離席中",
  "status.inMeeting": "会議中",

  // 3. Chat Pane Sub-Header & Pinned Banners
  "chat.members": "メンバー",
  "chat.sprintStatus": "スプリント状況",
  "chat.pinSprintStatus": "スプリント状況を固定",
  "chat.invite": "招待",
  "chat.inspector": "インスペクター",
  "chat.sprintStatusLabel": "スプリント状況:",
  "chat.edit": "編集",
  "chat.selectChannelPrompt": "チャンネルを選択してメッセージを開始",

  // 4. Message Feed & Actions
  "message.noMessages": "まだメッセージはありません",
  "message.emptyGuide":
    "#LOC-XXXX または $STR_XXXX タグを含むメッセージは自動的にリンクされ、インスペクターで検証できます。",
  "message.copyText": "メッセージ本文をコピー",
  "message.copied": "コピー完了",
  "message.inspectTag": "検証:",
  "message.loadOlder": "過去のメッセージを読み込む",
  "message.mentionsCount": "{total}件中 {current}件の言及",
  "message.newMessage": "{count}件の新着メッセージ",
  "message.newMessages": "{count}件の新着メッセージ",
  "message.today": "今日",
  "message.yesterday": "昨日",
  "typing.isTyping": "が入力中...",
  "typing.areTyping": "が入力中...",

  // 5. Message Composer
  "composer.placeholderChannel":
    "#{channel} へのメッセージ... (Shift+Enterで改行、@名前 または #LOC-XXXX を入力)",
  "composer.placeholderDm":
    "@{recipient} へのメッセージ... (Shift+Enterで改行、@名前 または #LOC-XXXX を入力)",
  "composer.dropToAttach": "ドロップしてファイルを添付",
  "composer.mentionHeader": "同僚にメンション",
  "composer.attachTooltip": "スクリーンショットやファイルを添付",
  "composer.mentionTooltip": "同僚をタグ付け (@)",
  "composer.locTagTooltip": "#LOC キーのショートカットを挿入",
  "composer.uploadHint": "最大10MB • スクショを貼り付けまたはドロップ",
  "composer.uploadingAttachment": "添付ファイルをアップロード中...",
  "composer.send": "送信",
  "composer.sending": "送信中...",

  // 6. Localization & Glossary Inspector
  "inspector.title": "スタジオコーデックス",
  "inspector.badge": "LQAツール",
  "inspector.tabInspector": "文字列インスペクター",
  "inspector.tabGlossary": "用語集コーデックス",
  "inspector.noStringSelected": "文字列が選択されていません",
  "inspector.noStringHelp":
    "チャット内の #LOC-XXXX または $STR_XXXX タグをクリックすると、日本語ソース、文字数制限ゲージ、ワークフロー状況を検証できます。",
  "inspector.inspecting": "検証中",
  "inspector.notFound": "レコードが見つかりません:",
  "inspector.stringIdentifier": "文字列識別子",
  "inspector.project": "プロジェクト:",
  "inspector.locale": "ロケール:",
  "inspector.workflowStatus": "レビューワークフロー状況",
  "inspector.sourceText": "日本語ソース原文",
  "inspector.copy": "コピー",
  "inspector.copied": "コピー完了",
  "inspector.targetTranslation": "翻訳テキスト",
  "inspector.translationPending": "翻訳保留中...",
  "inspector.chars": "文字",
  "inspector.overflowWarning": "表示枠超過: 制限より +{count} 文字オーバーしています！",
  "inspector.contextNotes": "文脈・シーン注記",
  "inspector.channelMentions": "チャンネル内言及",
  "inspector.inChannelCount": "このチャンネル内に {count} 件",
  "inspector.matchesInChannel": "チャンネル内に {count} 件の一致",
  "inspector.matchInChannel": "チャンネル内に 1 件の一致",
  "inspector.noMatches": "チャンネル内に一致なし",
  "inspector.highlight": "ハイライト表示",
  "inspector.highlighted": "ハイライト中",
  "inspector.glossarySearchPlaceholder": "用語を検索 (例: 鬼人薬, ロックピック)...",
  "inspector.noTermsFound": "登録用語が見つかりません",
  "inspector.noEntriesMatch": '"{query}" に一致する用語はありません',
  "inspector.noRecords": "用語集レコードが読み込まれていません",
  "inspector.source": "原文:",
  "inspector.showLess": "折りたたむ",
  "inspector.showGuidelines": "ガイドラインと注記を表示",

  // 7. Modal Dialogs
  // 7.1 Auth Modal
  "auth.terminalAuth": "CAPSLOC // 端末認証",
  "auth.tagline": "社内ゲームローカライゼーション業務",
  "auth.signIn": "サインイン",
  "auth.register": "新規オペレーター登録",
  "auth.username": "ユーザー名",
  "auth.displayName": "表示名",
  "auth.locRole": "担当ロール",
  "auth.primaryLocale": "主要言語ロケール",
  "auth.workstationEmail": "ワークステーションEmail",
  "auth.securityPassword": "セキュリティパスワード",
  "auth.btnRegister": "登録して端末を開始",
  "auth.btnSignIn": "セッションを認証",
  "auth.quickSelect": "デモ用ペルソナ即時選択 (シード済みDB)",

  // 7.2 User Profile Modal
  "profile.editProfile": "プロフィール編集",
  "profile.displayName": "表示名",
  "profile.customStatus": "カスタムステータス",
  "profile.statusPlaceholder": "現在の作業内容 (例: バイオハザードUIテキスト更新中)",
  "profile.bio": "自己紹介 / 専門分野",
  "profile.bioPlaceholder": "例: モンスターハンターシリーズ 日英リード翻訳者",
  "profile.primaryLocale": "主要言語ロケール",
  "profile.cancel": "キャンセル",
  "profile.saveChanges": "変更を保存",

  // 7.3 Channel Members Modal
  "members.title": "チャンネルメンバー",
  "members.searchPlaceholder": "メンバーを名前、役職、ロケールで検索...",
  "members.loading": "チャンネルメンバーを読み込み中...",
  "members.noMatches": "該当するメンバーが見つかりません",
  "members.noEnrolled": "このチャンネルに登録されているメンバーはいません",
  "members.you": "あなた",
  "members.online": "オンライン",
  "members.offline": "オフライン",
  "members.admin": "管理者",
  "members.invite": "招待",

  // 7.4 Create Channel Modal
  "createChannel.title": "チャンネル作成",
  "createChannel.channelName": "チャンネル名",
  "createChannel.projectTag": "プロジェクトタグ",
  "createChannel.localeTag": "言語タグ",
  "createChannel.description": "説明 (省略可能)",
  "createChannel.descriptionPlaceholder": "このチャンネルの目的・用途は？",
  "createChannel.visibility": "チャンネルの公開範囲",
  "createChannel.public": "パブリック",
  "createChannel.publicHelp": "全チームメンバーが参加可能",
  "createChannel.private": "プライベート",
  "createChannel.privateHelp": "特定言語チームのみに制限",
  "createChannel.cancel": "キャンセル",
  "createChannel.submit": "チャンネルを作成",

  // 7.5 Direct Message Modal
  "dm.title": "ダイレクトメッセージ",
  "dm.searchPlaceholder": "同僚を名前または@ユーザー名で検索...",
  "dm.loading": "チームディレクトリを読み込み中...",
  "dm.noMatches": '"{query}" に一致する同僚が見つかりません',

  // 7.6 Edit Channel Status Modal
  "editStatus.title": "チャンネルのスプリント状況を編集",
  "editStatus.sprintStatus": "スプリント状況 / 固定マイルストーン",
  "editStatus.bannerNotice": "チャットストリーム上部に固定バナーとして表示されます。",
  "editStatus.channelDescription": "チャンネルの説明",
  "editStatus.descPlaceholder": "チャンネルの目的およびローカライズ対象範囲...",
  "editStatus.clearStatus": "状況をクリア",
  "editStatus.cancel": "キャンセル",
  "editStatus.saveStatus": "状況を保存",

  // 7.7 Invite Member Modal
  "invite.title": "#{channel} に招待",
  "invite.searchPlaceholder": "同僚を名前または役職で検索...",
  "invite.scanning": "ディレクトリを検索中...",
  "invite.noMatches": "検索条件に一致する同僚はいません",
  "invite.allEnrolled": "全ての同僚がすでに参加しています",
  "invite.inviteBtn": "招待",
  "invite.enrolled": "参加済み",

  // 7.8 Image Lightbox Modal
  "lightbox.uploadedBy": "アップロード者:",
  "lightbox.zoomOut": "縮小",
  "lightbox.zoomIn": "拡大",
  "lightbox.download": "アセットをダウンロード",
  "lightbox.close": "閉じる (Esc)",

  // 8. Hover Cards & Toast Notifications
  // 8.1 User Profile Hover Card
  "hoverCard.status": "ステータス",
  "hoverCard.sendDm": "ダイレクトメッセージを送信",
  "hoverCard.yourProfile": "あなたのプロフィール",

  // 8.2 Mention Toast
  "toast.taggedIn": "#{channel} でメンションされました",
  "toast.mentionedYou": "さんがあなたをメンションしました",
  "toast.viewMention": "メンションを確認",

  // 9. Roles & Status Enums
  // 9.1 Localization Roles
  "LocRole.TRANSLATOR": "翻訳者",
  "LocRole.LQA_TESTER": "LQAテスター",
  "LocRole.SOLUTIONS_DEV": "開発エンジニア",
  "LocRole.LOC_PM": "ローカライズPM",
  "LocRole.AUDIO_SPECIALIST": "音声スペシャリスト",
  "LocRole.GENERAL_USER": "メンバー",

  // 9.2 String Workflow Statuses
  "StringStatus.DRAFT": "下書き",
  "StringStatus.IN_REVIEW": "レビュー中",
  "StringStatus.LQA_FLAGGED": "LQA指摘あり",
  "StringStatus.APPROVED": "承認済み",
};
