// Localization — English + Russian. The chosen language lives in a cookie
// (not localStorage) so server components can read it during render: that is
// what keeps a reload from flashing English before the client swaps it.
//
// Scope: user-facing copy — explanations, buttons, errors. Brand words
// (ZEROFANS, ZeroFans Labs), platform names (Reddit, GitHub, Product Hunt),
// subreddit names and the visual effects stay as they are in both languages.
// The admin panel and the legal pages stay English (operator tooling / binding
// text — see brain/Decisions Log).

export type Lang = "en" | "ru";

export const LANGS: readonly Lang[] = ["en", "ru"] as const;
export const LANG_COOKIE = "zf_lang";
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** Anything that isn't a language we ship falls back to English. */
export function normalizeLang(value: string | null | undefined): Lang {
  return value === "ru" ? "ru" : "en";
}

const en = {
  nav: {
    profile: "Profile",
    signIn: "Sign in with GitHub",
    signOut: "Sign out",
    signedIn: "signed in",
    adminPanel: "Admin panel",
    supabaseHint: "Connect Supabase to enable sign-in",
  },
  lang: {
    label: "Language",
    soon: "soon",
  },
  landing: {
    titleLine1: "Light the way",
    titleLine2: "to first users",
    offer1: "Where to post without getting banned — per-sub rules & briefs",
    offer2: "Is your Reddit account ready — karma & age check",
    offer3: "Live threads in your niche to jump into today",
    noteTitle: "Mission brief",
    notePrefix: "Paste your URL and ZeroFans maps where to post. Each spot lists its",
    noteRules: "rules",
    noteKarma: "karma bar",
    noteTime: "best time",
    noteMiddle: "— so you reach first users",
    noteEnd: "without getting banned",
  },
  footer: {
    privacy: "Privacy",
    terms: "Terms",
    refunds: "Refunds",
    contact: "Contact",
  },
  form: {
    descriptionPlaceholder: "One line: what it does, for whom (optional)",
    addDescription: "+ add a one-line description (optional)",
    submit: "Scan to launch →",
    steps: [
      "Reading your landing page",
      "Extracting your niche",
      "Matching {count} communities",
      "Checking posting rules",
      "Ranking your map",
    ],
    errInvalidUrl: "Enter a valid http(s) URL.",
    errOwnDomain: "nice try 😏 — go map a real product.",
    errGeneric: "Something went wrong. Try again.",
    errAuthRequired: "Sign in with GitHub first.",
    errMapLimit:
      "You can keep 2 maps at a time. Delete one in your profile to analyze a new product.",
    errBlocked: "This account is blocked. Contact us if you think that's a mistake.",
    errDailyLimit: "Daily analysis limit reached — try again tomorrow.",
    errNotAProduct:
      "That's a big platform, not a product launch. Paste your own product's landing page.",
    errInvalidInput: "Enter a valid URL.",
    errEmptyLanding: "Couldn't read that page — add a one-line description and retry.",
    errAiNotConfigured:
      "AI key not set in this environment. Add ANTHROPIC_API_KEY + restart/redeploy.",
    errAnalysisFailed: "Analysis failed (API). Try again in a moment.",
  },
  map: {
    unlockTitle: "Unlock the full map",
    unlockBullet1: "All {count} remaining communities with posting briefs",
    unlockBullet2: "Each sub's live mod-pinned rules",
    unlockBullet3: "Live-thread finder ($0.50 per search)",
    noMatches:
      "No strong community matches for this product yet — it may sit outside our curated indie / SaaS / maker set.",
    noMatchesHintStart: "Try a clearer one-line description on the",
    noMatchesHintHome: "home page",
    noMatchesHintMiddle: ", or browse the full",
    noMatchesHintDb: "community database",
    reddit: "Reddit",
    otherChannels: "Other channels",
    browseAllText:
      "Want the rest? Browse every community in the database — including ones this map didn't rank for your product.",
    browseAllCta: "Browse all communities →",
    signedOutTitle: "Sign in to open this map",
    signedOutBody:
      "Maps are private to the account that created them. Sign in with GitHub (top right) and this page will load.",
  },
  profile: {
    blocked:
      "This account is blocked: maps, unlocks, checks and top-ups are disabled. If you think this is a mistake, use the contact page.",
    accountMeta: "Account · Signed in with GitHub",
    balanceSection: "Balance & usage",
    balance: "Balance",
    maps: "Maps",
    unlockedMaps: "Unlocked maps",
    balanceHint:
      "Top up your balance, then unlock any map for {price} — all publics + their posting briefs. You can keep {max} maps at once; delete one below to analyze a new product.",
    mapsSection: "Your launch maps",
    noMapsStart: "No maps yet. Paste a product URL on the",
    noMapsHome: "home page",
    noMapsEnd: "to light your first one.",
    redditSection: "Reddit account check",
    playbookSection: "Posting playbook",
    dangerZone: "Danger zone",
  },
  mapHeader: {
    eyebrow: "Your launch map",
  },
  unlock: {
    spend: "Spend {price}",
    balance: "Balance: {amount}",
    notEnough: "Not enough balance.",
    topUp: "Top up",
    confirmQuestion: "Charge {price} now? No refunds.",
    cancel: "Cancel",
    charging: "Charging",
    confirm: "Confirm — spend {price}",
  },
  topup: {
    soonTitle: "Top-up — connecting soon",
    soonLabel: "Top up — coming soon",
    cta: "Top up",
    methodHint: "{rub} ₽ via SBP / card / crypto",
    errStart: "Couldn't start checkout — try again.",
    errNetwork: "Network error.",
  },
  deleteMap: {
    title: "Delete this map",
    delete: "Delete",
    cancel: "Cancel",
    confirm: "Confirm",
  },
  deleteAccount: {
    cta: "Delete account",
    warning: "This wipes your account and every saved map. Permanent.",
    cancel: "Cancel",
    deleting: "Deleting…",
    confirm: "Yes, delete everything",
    errFailed: "Couldn't delete the account. Try again.",
    errNetwork: "Network error. Try again.",
  },
  guide: {
    eyebrowLeft: "Before you post · don't get banned",
    eyebrowRight: "Account playbook",
    step1Title: "Age the account",
    step1Body:
      "Use an account that's at least 2–4 weeks old with a verified email. Brand-new accounts that post their own link first get shadowbanned.",
    karmaCta: "Check this account's karma & age — {price}",
    step2Title: "Build 50–100+ comment karma",
    step2Body:
      "Leave genuine comments in your niche for a few days first. This clears the new-user spam filter so your post is actually visible.",
    step3Title: "Keep the 90/10 ratio",
    step3Body:
      "No more than ~10% of your activity about yourself. For every promo post, leave ~9 helpful comments. Subs measure this.",
    step4Title: "Match each sub's format",
    step4Body:
      "Read the rules. If a sub is megathread- or comment-only (see each card), post there — not a standalone link. One direct link, no shorteners.",
    step5Title: "Adapt the draft, post at the best time",
    step5Body:
      "Rewrite the draft in your own words (verbatim AI posts get detected), then post at the card's best time. Check visibility from an incognito window after.",
  },
  opportunities: {
    title: "Where to jump in",
    subtitle: "Live threads about your space — join with a real comment, not a link.",
    saved: "Saved {date} — kept until you refresh.",
    searching: "Searching",
    refresh: "Refresh · $0.50",
    find: "Find live threads · $0.50",
    charge: "Charge $0.50?",
    confirm: "Confirm",
    cancel: "Cancel",
    soon: "Connecting soon.",
    locked: "🔒 Unlock this map to find live threads to join.",
    busy: "Searching Reddit — this takes ~20–40 seconds, hang tight",
    empty:
      "No live threads passed the quality bar right now — we only show conversations you can actually join. Try again in a few hours.",
    few: "Threads that passed the live-conversation bar right now: {count} — check back later for fresh ones.",
    errSearchFailed: "Search failed on Reddit — try again later.",
    errTimeout:
      "Search is taking longer than usual — reopen this page in a minute, the result is kept.",
    errNoBalance: "Not enough balance — a search costs $0.50. Top up in your profile.",
    errDailyLimit: "Daily search limit for your account reached — try again tomorrow.",
    errNoKeywords: "Not enough product keywords to search.",
    errStartDetail: "Couldn't start: {detail}",
    errStart: "Couldn't start the search — try again.",
    errNetwork: "Network error.",
    commentsSuffix: "{n} comments",
    upvotesSuffix: "{n} upvotes",
    open: "open →",
  },
  mapRow: {
    openAria: "Open {name}",
    save: "Save",
    cancel: "Cancel",
    unlocked: "Unlocked",
    basic: "Basic",
    rename: "Rename",
    renameTitle: "Rename map",
  },
  card: {
    policyWelcome: "Welcome",
    policyMegathread: "Megathread only",
    policyCommentOnly: "Comments only",
    policyBanned: "No self-promo",
    membersTitle: "{n} members",
    locked: "🔒 Unlock to see the brief — rules, links & a tailored angle",
  },
  brief: {
    heading: "Posting brief",
    hide: "Hide",
    showRules: "Show rules",
    bestTime: "Best time",
    karma: "Karma",
    rulesOf: "Rules · r/{sub}",
    collapse: "collapse",
    showAll: "show all {count}",
    rulesFallback: "Rules & removal",
    openSubmit: "Open submit form",
    open: "Open",
    linkOk: "Link OK, in context",
    linkComments: "Link in comments only",
    linkNone: "No links",
    linkIsPost: "URL is the post",
    linkInline: "Link inline, once",
    linkListing: "Link in the listing",
  },
  guidePanel: {
    title: "How to not get banned & build Reddit karma",
    subtitle: "Account setup, the 90/10 rule, karma, shadowban checks",
    hide: "− Hide",
    read: "+ Read",
    footer:
      "Drafts from ZeroFans are a starting point — always adapt them in your own words before posting. Verbatim AI posts get detected and downvoted.",
    s1Title: "Account setup (before you post)",
    s1Points: [
      "Age the account 2–4 weeks before any promo post. Brand-new accounts that post their own link first almost always get shadowbanned (post visible to you, hidden from everyone).",
      "Build 50–100+ comment karma before posting in larger subs. Smaller, friendly subs (r/SideProject, r/IMadeThis, r/alphaandbetausers) tolerate less — but not zero.",
      "Verify your email — an unverified email is a strong spam-filter signal.",
      "Leave 10–20 genuine comments in your niche first. This 'warms up' the account and clears the new-user filter.",
      "One account = one person. Multiple accounts from one IP, self-voting, or 'please upvote' asks is ban-evasion / vote manipulation — banned hard, often by IP.",
    ],
    s2Title: "The 90/10 rule (critical)",
    s2Points: [
      "No more than ~10% of your activity should be about yourself. For every promo post, leave ~9 genuinely helpful comments.",
      "Subs and AutoModerator actually measure the share of self-promo domains in your history — it's not just etiquette.",
    ],
    s3Title: "Before posting in a specific sub",
    s3Points: [
      "Read the rules and pinned posts. Many subs only allow megathreads — see the policy column in the table below.",
      "Check for karma/age requirements in the rules or AutoModerator's auto-reply (it often says exactly why a post was hidden).",
      "Post at the sub's best time (see the table) for more reach and less chance of being treated as spam.",
      "Never use link shorteners (bit.ly etc.) — near-universal auto-removal. Use the direct URL.",
    ],
    s4Title: "Building karma fast (and safely)",
    s4Points: [
      "Comment value, not volume: answer questions in your niche where you actually know the answer.",
      "Post genuinely useful content (a lesson learned, a teardown, a free resource) in relevant subs — these earn karma and goodwill without tripping self-promo filters.",
      "Don't farm karma in meme/karma subs and then immediately pivot to promo — the pattern is obvious to mods.",
    ],
    s5Title: "Launch day: order of operations",
    s5Points: [
      "Post to ONE sub per session, not all at once — identical posts across many subs within hours is a classic spam signature.",
      "Start with the friendliest sub on your map (Welcome policy), read the reaction, refine the post, then work up to stricter subs over days.",
      "Stay in the thread for the first 2 hours and answer every comment — reply speed is the biggest lever on how far a post travels.",
      "If a post gets removed, don't repost it elsewhere immediately. Fix what broke the rule first, or the next sub's mods see the pattern.",
      "Use the 'Where to jump in' threads as warm-up: a helpful comment in a live discussion often outperforms a cold post.",
    ],
    s6Title: "Spot a shadowban / recover from a ban",
    s6Points: [
      "Open your post in an incognito window (logged out). If it's not visible, you're shadowbanned in that sub or globally.",
      "If banned in a sub, don't make a new account to evade — that's worse than the original ban.",
      "Message the mods (modmail) politely: admit the mistake, ask to repost in the correct format. They often un-ban.",
    ],
  },
  karma: {
    cta: "Check your Reddit karma",
    heading: "Reddit readiness",
    meta: "{n}/{max} accounts · {price} per check",
    hide: "− hide",
    karmaSuffix: "{n} karma",
    confirm: "Confirm",
    recheck: "Re-check",
    postKarma: "Post {n}",
    commentKarma: "Comment {n}",
    checkedOn: "checked {date}",
    gate: "Unlock at least one map to check karma.",
    confirmNew: "Check {user} for {price}?",
    checking: "Checking",
    confirmPrice: "Confirm — {price}",
    cancel: "Cancel",
    namePlaceholder: "yourname",
    check: "Check · {price}",
    soon: "Connecting soon.",
    ageDays: "{n}d old",
    ageMonths: "{n}mo old",
    ageYears: "{n}y old",
    verdictFresh: "Too fresh",
    verdictWarming: "Warming up",
    verdictReady: "Ready",
    recYoung:
      "Account is very young — wait ~2 weeks before any promo post; comment daily meanwhile.",
    recUnder10:
      "Under 10 karma most subs auto-remove you. Answer 5–10 questions in your niche to clear the floor.",
    recUnder50:
      "Get to 50+ karma before the stricter subs — helpful comments in mid-size niche subs are the fastest safe route.",
    recImbalance:
      "Post karma outweighs comment karma — that reads as a self-promoter to mods. Balance it with genuine comments.",
    recSolid:
      "Solid comment history — start with the 'Welcome' subs on your map, one post per session.",
    recHealthy:
      "Account looks healthy. Keep the 90/10 rule: ~9 helpful comments per 1 promo post.",
    errGate: "Unlock at least one map first — the karma check is part of a launch.",
    errInvalidName: "Enter a valid username.",
    errDailyLimit: "Daily check limit for your account reached — try again tomorrow.",
    errStart: "Couldn't start the check — try again.",
    errNoUser: "No such Reddit user (or the profile is private).",
    errFailed: "Check failed on Reddit — try again later.",
    errTimeout: "Taking too long — try again.",
    errNetwork: "Network error.",
  },
  communities: {
    meta: "community db · {n}",
    title: "Community database",
    subtitle:
      "The curated catalog of where to launch — with each community's self-promo policy, karma bar, and best time to post.",
    search: "Search name, tag, note…",
    shown: "{n} shown",
    thName: "Name",
    thPlatform: "Platform",
    thPolicy: "Policy",
    thKarma: "Karma",
    thActivity: "Activity",
    thBestTime: "Best time",
    thVerified: "Verified",
    all: "all",
  },
  demo: {
    meta: "demo · mock data",
    eyebrow: "your launch map",
    titleFor: "Where to launch {host}",
    sample: "(demo · sample data)",
    lockedNote:
      "{count} more communities are locked — unlock rules, drafts, and one-click submit links for your whole map.",
    unlock: "Unlock full map",
  },
  contact: {
    meta: "Contact",
    title: "Get in touch",
    subtitle: "Questions, feedback, or a community to add? Reach out.",
  },
  authError: {
    title: "Sign-in failed",
    body: "Could not complete GitHub sign-in. Try again.",
    back: "Back home",
  },
} as const;

type Dict = {
  -readonly [K in keyof typeof en]: {
    -readonly [P in keyof (typeof en)[K]]: (typeof en)[K][P] extends readonly string[]
      ? string[]
      : string;
  };
};

const ru: Dict = {
  nav: {
    profile: "Профиль",
    signIn: "Войти через GitHub",
    signOut: "Выйти",
    signedIn: "вы вошли",
    adminPanel: "Админка",
    supabaseHint: "Подключите Supabase, чтобы включить вход",
  },
  lang: {
    label: "Язык",
    soon: "скоро",
  },
  landing: {
    titleLine1: "Путь к первым",
    titleLine2: "пользователям",
    offer1: "Где постить и не получить бан — правила и брифы по каждому сообществу",
    offer2: "Готов ли ваш аккаунт Reddit — проверка кармы и возраста",
    offer3: "Живые обсуждения в вашей нише, куда можно зайти сегодня",
    noteTitle: "Бриф",
    notePrefix:
      "Вставьте ссылку — ZeroFans покажет, где постить. У каждого места свои",
    noteRules: "правила",
    noteKarma: "порог кармы",
    noteTime: "лучшее время",
    noteMiddle: "— так вы дойдёте до первых пользователей",
    noteEnd: "без бана",
  },
  footer: {
    privacy: "Конфиденциальность",
    terms: "Условия",
    refunds: "Возвраты",
    contact: "Контакты",
  },
  form: {
    descriptionPlaceholder: "Одной строкой: что это и для кого (необязательно)",
    addDescription: "+ добавить описание одной строкой (необязательно)",
    submit: "Сканировать →",
    steps: [
      "Читаю вашу страницу",
      "Определяю нишу",
      "Сверяю {count} сообществ",
      "Проверяю правила постинга",
      "Ранжирую карту",
    ],
    errInvalidUrl: "Введите корректную http(s)-ссылку.",
    errOwnDomain: "хорошая попытка 😏 — соберите карту для реального продукта.",
    errGeneric: "Что-то пошло не так. Попробуйте ещё раз.",
    errAuthRequired: "Сначала войдите через GitHub.",
    errMapLimit:
      "Можно держать 2 карты одновременно. Удалите одну в профиле, чтобы разобрать новый продукт.",
    errBlocked: "Аккаунт заблокирован. Напишите нам, если считаете это ошибкой.",
    errDailyLimit: "Дневной лимит разборов исчерпан — попробуйте завтра.",
    errNotAProduct:
      "Это большая платформа, а не запуск продукта. Вставьте лендинг своего продукта.",
    errInvalidInput: "Введите корректную ссылку.",
    errEmptyLanding:
      "Не удалось прочитать страницу — добавьте описание одной строкой и повторите.",
    errAiNotConfigured:
      "Ключ AI не задан в этом окружении. Добавьте ANTHROPIC_API_KEY и перезапустите деплой.",
    errAnalysisFailed: "Разбор не удался (API). Попробуйте через минуту.",
  },
  map: {
    unlockTitle: "Открыть карту полностью",
    unlockBullet1: "Все оставшиеся сообщества ({count}) с брифами по постингу",
    unlockBullet2: "Актуальные правила модераторов каждого сообщества",
    unlockBullet3: "Поиск живых обсуждений ($0.50 за поиск)",
    noMatches:
      "Подходящих сообществ для этого продукта пока нет — возможно, он вне нашей подборки indie / SaaS / maker.",
    noMatchesHintStart: "Попробуйте описание точнее на",
    noMatchesHintHome: "главной",
    noMatchesHintMiddle: "или посмотрите всю",
    noMatchesHintDb: "базу сообществ",
    reddit: "Reddit",
    otherChannels: "Другие каналы",
    browseAllText:
      "Нужно больше? Посмотрите все сообщества в базе — включая те, что эта карта не подобрала под ваш продукт.",
    browseAllCta: "Все сообщества →",
    signedOutTitle: "Войдите, чтобы открыть карту",
    signedOutBody:
      "Карты видны только тому аккаунту, который их создал. Войдите через GitHub (справа сверху) — и страница загрузится.",
  },
  profile: {
    blocked:
      "Аккаунт заблокирован: карты, разблокировки, проверки и пополнения недоступны. Если это ошибка — напишите нам через страницу контактов.",
    accountMeta: "Аккаунт · вход через GitHub",
    balanceSection: "Баланс и лимиты",
    balance: "Баланс",
    maps: "Карты",
    unlockedMaps: "Открытые карты",
    balanceHint:
      "Пополните баланс и открывайте любую карту за {price} — все сообщества и брифы к ним. Одновременно можно держать {max} карты; удалите одну ниже, чтобы разобрать новый продукт.",
    mapsSection: "Ваши карты запуска",
    noMapsStart: "Карт пока нет. Вставьте ссылку на продукт на",
    noMapsHome: "главной",
    noMapsEnd: "— и появится первая.",
    redditSection: "Проверка аккаунта Reddit",
    playbookSection: "Как постить",
    dangerZone: "Опасная зона",
  },
  mapHeader: {
    eyebrow: "Ваша карта запуска",
  },
  unlock: {
    spend: "Списать {price}",
    balance: "Баланс: {amount}",
    notEnough: "Недостаточно средств.",
    topUp: "Пополнить",
    confirmQuestion: "Списать {price} сейчас? Возврата не будет.",
    cancel: "Отмена",
    charging: "Списываю",
    confirm: "Подтвердить — списать {price}",
  },
  topup: {
    soonTitle: "Пополнение — скоро подключим",
    soonLabel: "Пополнение — скоро",
    cta: "Пополнить",
    methodHint: "{rub} ₽ — СБП / карта / крипта",
    errStart: "Не удалось открыть оплату — попробуйте ещё раз.",
    errNetwork: "Ошибка сети.",
  },
  deleteMap: {
    title: "Удалить эту карту",
    delete: "Удалить",
    cancel: "Отмена",
    confirm: "Подтвердить",
  },
  deleteAccount: {
    cta: "Удалить аккаунт",
    warning: "Это сотрёт аккаунт и все сохранённые карты. Навсегда.",
    cancel: "Отмена",
    deleting: "Удаляю…",
    confirm: "Да, удалить всё",
    errFailed: "Не удалось удалить аккаунт. Попробуйте ещё раз.",
    errNetwork: "Ошибка сети. Попробуйте ещё раз.",
  },
  guide: {
    eyebrowLeft: "Перед постом · как не получить бан",
    eyebrowRight: "Памятка по аккаунту",
    step1Title: "Дайте аккаунту отлежаться",
    step1Body:
      "Берите аккаунт возрастом хотя бы 2–4 недели с подтверждённой почтой. Свежие аккаунты, которые сразу постят свою ссылку, уходят в теневой бан.",
    karmaCta: "Проверить карму и возраст аккаунта — {price}",
    step2Title: "Наберите 50–100+ кармы за комментарии",
    step2Body:
      "Несколько дней пишите настоящие комментарии в своей нише. Это снимает спам-фильтр для новичков, и пост станет виден.",
    step3Title: "Держите пропорцию 90/10",
    step3Body:
      "О себе — не больше ~10% активности. На каждый промо-пост примерно 9 полезных комментариев. Сообщества это считают.",
    step4Title: "Подстройтесь под формат сообщества",
    step4Body:
      "Читайте правила. Если сообщество принимает только мегатреды или комментарии (указано на карточке) — пишите туда, а не отдельным постом. Одна прямая ссылка, без сокращателей.",
    step5Title: "Перепишите черновик и постите в лучшее время",
    step5Body:
      "Перескажите черновик своими словами (дословный AI-текст вычисляют), затем публикуйте в указанное на карточке время. После проверьте видимость из режима инкогнито.",
  },
  opportunities: {
    title: "Куда зайти",
    subtitle:
      "Живые обсуждения в вашей теме — заходите с настоящим комментарием, а не со ссылкой.",
    saved: "Сохранено {date} — держим до следующего обновления.",
    searching: "Ищу",
    refresh: "Обновить · $0.50",
    find: "Найти живые обсуждения · $0.50",
    charge: "Списать $0.50?",
    confirm: "Подтвердить",
    cancel: "Отмена",
    soon: "Скоро подключим.",
    locked: "🔒 Откройте карту, чтобы искать живые обсуждения.",
    busy: "Ищу на Reddit — это займёт ~20–40 секунд, подождите",
    empty:
      "Сейчас ни одно обсуждение не прошло порог качества — мы показываем только те, куда действительно можно зайти. Попробуйте через несколько часов.",
    few: "Порог живого обсуждения сейчас прошло: {count} — загляните позже за свежими.",
    errSearchFailed: "Поиск на Reddit не удался — попробуйте позже.",
    errTimeout:
      "Поиск идёт дольше обычного — откройте страницу через минуту, результат сохранится.",
    errNoBalance: "Недостаточно средств — поиск стоит $0.50. Пополните баланс в профиле.",
    errDailyLimit: "Дневной лимит поисков для аккаунта исчерпан — попробуйте завтра.",
    errNoKeywords: "Слишком мало ключевых слов о продукте для поиска.",
    errStartDetail: "Не удалось запустить: {detail}",
    errStart: "Не удалось запустить поиск — попробуйте ещё раз.",
    errNetwork: "Ошибка сети.",
    commentsSuffix: "{n} комм.",
    upvotesSuffix: "{n} апвоутов",
    open: "открыть →",
  },
  mapRow: {
    openAria: "Открыть {name}",
    save: "Сохранить",
    cancel: "Отмена",
    unlocked: "Открыта",
    basic: "Базовая",
    rename: "Переименовать",
    renameTitle: "Переименовать карту",
  },
  card: {
    policyWelcome: "Рады новичкам",
    policyMegathread: "Только мегатред",
    policyCommentOnly: "Только комментарии",
    policyBanned: "Без саморекламы",
    membersTitle: "{n} участников",
    locked: "🔒 Откройте карту, чтобы увидеть бриф — правила, ссылки и подход",
  },
  brief: {
    heading: "Бриф по постингу",
    hide: "Скрыть",
    showRules: "Показать правила",
    bestTime: "Лучшее время",
    karma: "Карма",
    rulesOf: "Правила · r/{sub}",
    collapse: "свернуть",
    showAll: "показать все ({count})",
    rulesFallback: "Правила и удаление",
    openSubmit: "Открыть форму публикации",
    open: "Открыть",
    linkOk: "Ссылка можно, в контексте",
    linkComments: "Ссылка только в комментариях",
    linkNone: "Без ссылок",
    linkIsPost: "Ссылка и есть пост",
    linkInline: "Ссылка в тексте, один раз",
    linkListing: "Ссылка в карточке каталога",
  },
  guidePanel: {
    title: "Как не получить бан и набрать карму на Reddit",
    subtitle: "Настройка аккаунта, правило 90/10, карма, проверка теневого бана",
    hide: "− Скрыть",
    read: "+ Читать",
    footer:
      "Черновики ZeroFans — это отправная точка. Всегда переписывайте их своими словами перед публикацией: дословный AI-текст вычисляют и минусуют.",
    s1Title: "Настройка аккаунта (до первого поста)",
    s1Points: [
      "Дайте аккаунту отлежаться 2–4 недели до любого промо-поста. Свежие аккаунты, которые первым делом постят свою ссылку, почти всегда уходят в теневой бан (вам пост виден, остальным — нет).",
      "Наберите 50–100+ кармы за комментарии, прежде чем постить в крупных сообществах. Небольшие и дружелюбные (r/SideProject, r/IMadeThis, r/alphaandbetausers) терпят меньшую карму — но не нулевую.",
      "Подтвердите почту — неподтверждённый адрес сильный сигнал для спам-фильтра.",
      "Сначала оставьте 10–20 настоящих комментариев в своей нише. Это «прогревает» аккаунт и снимает фильтр для новичков.",
      "Один аккаунт = один человек. Несколько аккаунтов с одного IP, голосование за себя или просьбы «проголосуйте» — это обход бана и накрутка. Банят жёстко, часто по IP.",
    ],
    s2Title: "Правило 90/10 (самое важное)",
    s2Points: [
      "О себе — не больше ~10% активности. На каждый промо-пост оставьте ~9 по-настоящему полезных комментариев.",
      "Сообщества и AutoModerator реально считают долю саморекламных доменов в вашей истории — это не просто вежливость.",
    ],
    s3Title: "Перед постом в конкретном сообществе",
    s3Points: [
      "Прочитайте правила и закреплённые посты. Многие сообщества разрешают только мегатреды — смотрите колонку политики в таблице ниже.",
      "Проверьте требования к карме и возрасту в правилах или в автоответе AutoModerator — он часто прямо пишет, почему пост скрыли.",
      "Публикуйте в лучшее для сообщества время (см. таблицу): больше охват и меньше шансов попасть под спам-фильтр.",
      "Никогда не используйте сокращатели ссылок (bit.ly и подобные) — почти везде автоудаление. Ставьте прямой адрес.",
    ],
    s4Title: "Как быстро и безопасно набрать карму",
    s4Points: [
      "Важна польза комментария, а не количество: отвечайте на вопросы в своей нише там, где вы действительно знаете ответ.",
      "Публикуйте по-настоящему полезное (вынесенный урок, разбор, бесплатный ресурс) в подходящих сообществах — это приносит карму и репутацию, не задевая фильтры саморекламы.",
      "Не фармите карму в мем-сообществах, чтобы сразу переключиться на промо — модераторы видят этот шаблон насквозь.",
    ],
    s5Title: "День запуска: порядок действий",
    s5Points: [
      "Постите в ОДНО сообщество за заход, а не во все сразу: одинаковые посты в десятке мест за пару часов — классическая подпись спама.",
      "Начните с самого дружелюбного сообщества на карте, посмотрите на реакцию, доработайте пост и только потом идите в более строгие — в течение нескольких дней.",
      "Первые 2 часа будьте в треде и отвечайте на каждый комментарий: скорость ответа сильнее всего влияет на то, как далеко уйдёт пост.",
      "Если пост удалили, не перепощивайте его сразу в другое место. Сначала исправьте то, что нарушило правило, иначе модераторы следующего сообщества увидят повтор.",
      "Используйте обсуждения из блока «Куда зайти» как разогрев: полезный комментарий в живом треде часто работает лучше холодного поста.",
    ],
    s6Title: "Как распознать теневой бан и выйти из бана",
    s6Points: [
      "Откройте свой пост в режиме инкогнито (без входа). Если его не видно — вы в теневом бане: в этом сообществе или глобально.",
      "Если забанили в сообществе, не заводите новый аккаунт для обхода — это хуже исходного бана.",
      "Напишите модераторам (modmail) вежливо: признайте ошибку и попросите опубликовать заново в правильном формате. Часто разбанивают.",
    ],
  },
  karma: {
    cta: "Проверить карму на Reddit",
    heading: "Готовность аккаунта Reddit",
    meta: "{n}/{max} аккаунтов · {price} за проверку",
    hide: "− скрыть",
    karmaSuffix: "{n} кармы",
    confirm: "Подтвердить",
    recheck: "Перепроверить",
    postKarma: "Посты {n}",
    commentKarma: "Комментарии {n}",
    checkedOn: "проверено {date}",
    gate: "Откройте хотя бы одну карту, чтобы проверять карму.",
    confirmNew: "Проверить {user} за {price}?",
    checking: "Проверяю",
    confirmPrice: "Подтвердить — {price}",
    cancel: "Отмена",
    namePlaceholder: "имя",
    check: "Проверить · {price}",
    soon: "Скоро подключим.",
    ageDays: "{n} дн.",
    ageMonths: "{n} мес.",
    ageYears: "{n} г.",
    verdictFresh: "Слишком свежий",
    verdictWarming: "Прогревается",
    verdictReady: "Готов",
    recYoung:
      "Аккаунт совсем молодой — подождите ~2 недели до любого промо-поста, а пока комментируйте каждый день.",
    recUnder10:
      "При карме меньше 10 большинство сообществ удаляет посты автоматически. Ответьте на 5–10 вопросов в своей нише, чтобы пройти порог.",
    recUnder50:
      "Наберите 50+ кармы до строгих сообществ — полезные комментарии в нишевых сообществах среднего размера самый быстрый безопасный путь.",
    recImbalance:
      "Карма за посты выше, чем за комментарии — для модераторов это признак саморекламщика. Уравновесьте её настоящими комментариями.",
    recSolid:
      "Хорошая история комментариев — начните с самых дружелюбных сообществ на карте, по одному посту за заход.",
    recHealthy:
      "Аккаунт выглядит здоровым. Держите правило 90/10: ~9 полезных комментариев на 1 промо-пост.",
    errGate: "Сначала откройте хотя бы одну карту — проверка кармы это часть запуска.",
    errInvalidName: "Введите корректное имя пользователя.",
    errDailyLimit: "Дневной лимит проверок для аккаунта исчерпан — попробуйте завтра.",
    errStart: "Не удалось запустить проверку — попробуйте ещё раз.",
    errNoUser: "Такого пользователя Reddit нет (или профиль закрыт).",
    errFailed: "Проверка на Reddit не удалась — попробуйте позже.",
    errTimeout: "Слишком долго — попробуйте ещё раз.",
    errNetwork: "Ошибка сети.",
  },
  communities: {
    meta: "база сообществ · {n}",
    title: "База сообществ",
    subtitle:
      "Отобранный каталог мест для запуска — с политикой саморекламы, порогом кармы и лучшим временем для поста.",
    search: "Поиск по названию, тегу, заметке…",
    shown: "показано: {n}",
    thName: "Название",
    thPlatform: "Платформа",
    thPolicy: "Политика",
    thKarma: "Карма",
    thActivity: "Активность",
    thBestTime: "Лучшее время",
    thVerified: "Проверено",
    all: "все",
  },
  demo: {
    meta: "демо · условные данные",
    eyebrow: "ваша карта запуска",
    titleFor: "Где запускать {host}",
    sample: "(демо · пример данных)",
    lockedNote:
      "Ещё сообществ закрыто: {count} — откройте правила, черновики и ссылки на публикацию для всей карты.",
    unlock: "Открыть карту полностью",
  },
  contact: {
    meta: "Контакты",
    title: "Связаться с нами",
    subtitle: "Вопросы, отзывы или сообщество, которое стоит добавить? Напишите.",
  },
  authError: {
    title: "Вход не удался",
    body: "Не получилось завершить вход через GitHub. Попробуйте ещё раз.",
    back: "На главную",
  },
};

const DICTS: Record<Lang, Dict> = { en: en as unknown as Dict, ru };

export function dict(lang: Lang): Dict {
  return DICTS[lang];
}

/** Fill {name} placeholders: t("Matching {count}", { count: 58 }). */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k) =>
    k in vars ? String(vars[k]) : m
  );
}
