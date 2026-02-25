export const ASSET_TYPES = ["Video", "Design", "Carousel"];
export const IDEA_TYPES = ["Topic", "Theme", "Series", "Campaign", "Other"];
export const KANBAN_STATUSES = [
  "Draft",
  "Awaiting brand approval",
  "Awaiting SME approval",
  "Awaiting visual",
  "Approved",
  "Scheduled",
];
export const LINKEDIN_STATUSES = ["Draft", "Needs review", "Approved", "Shared"];
export const TESTING_STATUSES = ["Planned", "In flight", "Completed", "Archived"];
export const LINKEDIN_TYPES = ["My own account", "Content team to me"];
export const CAMPAIGNS = [
  "Evergreen",
  "Product launch",
  "Event",
  "Thought leadership",
  "Advocacy",
];
export const CONTENT_PILLARS = [
  "Awareness",
  "Education",
  "Engagement",
  "Community",
  "Conversion",
];

export const ALL_PLATFORMS = [
  "Instagram",
  "Facebook",
  "LinkedIn",
  "X/Twitter",
  "TikTok",
  "YouTube",
  "Threads",
  "Pinterest",
];

export const DEFAULT_APPROVERS = ["Dan Davis", "Comms Lead", "Campaigns Manager", "Policy Lead"];
export const PLATFORM_DEFAULT_LIMITS = {
  Instagram: 2200,
  Facebook: 63206,
  LinkedIn: 3000,
  "X/Twitter": 280,
  TikTok: 2200,
  YouTube: 5000,
  Threads: 500,
  Pinterest: 500,
};

export const DEFAULT_GUIDELINES = {
  bannedWords: ["shocking", "apocalypse"],
  requiredPhrases: ["Population Matters"],
  languageGuide: "Keep copy confident, compassionate, and evidence-led.",
  hashtagTips: "#PopulationMatters #Sustainability",
  charLimits: { ...PLATFORM_DEFAULT_LIMITS },
  teamsWebhookUrl: "",
};

export const USERS = [
  "Dan Davis",
  "Comms Lead",
  "Campaigns Manager",
  "Policy Lead",
  "Creative Director",
  "Social Lead",
];

export const WORKFLOW_STAGES = [
  "Briefing",
  "Production",
  "Ready for review",
  "Internals approved",
  "Scheduled",
  "Published",
];

export const CHECKLIST_ITEMS = [
  { key: "assetCreated", label: "Asset created" },
  { key: "altTextWritten", label: "Alt text prepared" },
  { key: "linksChecked", label: "Links checked" },
  { key: "copyProofed", label: "Copy proofed" },
  { key: "tagsSet", label: "Tags / targeting set" },
];

export const PLATFORM_IMAGES = {
  Instagram: "https://cdn.simpleicons.org/instagram/E4405F",
  Facebook: "https://cdn.simpleicons.org/facebook/1877F2",
  LinkedIn: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNCAyNCc+PHJlY3Qgd2lkdGg9JzI0JyBoZWlnaHQ9JzI0JyByeD0nNCcgZmlsbD0nJTIzMEE2NkMyJy8+PHBhdGggZmlsbD0nd2hpdGUnIGQ9J005LjE5IDE4LjVINi41NFY5Ljg4aDIuNjVWMTguNVptLTEuMzItOS44NGMtLjg1IDAtMS41My0uNjktMS41My0xLjUzcy42OC0xLjUzIDEuNTMtMS41MyAxLjUzLjY5IDEuNTMgMS41My0uNjggMS41My0xLjUzIDEuNTNabTExLjEzIDkuODRoLTIuNjR2LTQuNDJjMC0xLjA1LS4wMi0yLjQtMS40Ni0yLjQtMS40NiAwLTEuNjggMS4xNC0xLjY4IDIuMzJ2NC40OUgxMC4yVjkuODhoMi41M3YxLjE4aC4wNGMuMzUtLjY2IDEuMjEtMS4zNiAyLjQ5LTEuMzYgMi42NiAwIDMuMTYgMS43NSAzLjE2IDQuMDJ2NC43N1onLz48L3N2Zz4=",
  "X/Twitter": "https://cdn.simpleicons.org/x",
  TikTok: "https://cdn.simpleicons.org/tiktok",
  YouTube: "https://cdn.simpleicons.org/youtube/FF0000",
  Threads: "https://cdn.simpleicons.org/threads",
  Pinterest: "https://cdn.simpleicons.org/pinterest/E60023",
};

export const PLATFORM_TIPS = {
  Instagram: [
    "Lead with a strong hook in the first 2 lines.",
    "Use line breaks or emojis to improve readability.",
    "Finish with 3-5 targeted hashtags.",
  ],
  Facebook: [
    "Keep copy short and conversational.",
    "Mention the benefit before the ask.",
    "Add a clear CTA near the end.",
  ],
  LinkedIn: [
    "Open with a bold insight or data point.",
    "Write in short paragraphs for skim reading.",
    "End with a question to invite comments.",
  ],
  "X/Twitter": [
    "Stay under 240 characters when possible.",
    "Use 1-2 hashtags max.",
    "Lead with the strongest phrase; trim filler.",
  ],
  TikTok: [
    "Hook viewers with a first sentence that matches the audio.",
    "Add keywords to improve search visibility.",
    "Include a clear call to action to comment or share.",
  ],
  YouTube: [
    "Front-load the value proposition in line one.",
    "Add timestamps or bullet points for longer videos.",
    "Encourage likes/subscribes in the final sentence.",
  ],
  Threads: [
    "Write like a friendly text message.",
    "Keep lines short and emoji-friendly.",
    "Invite quick replies with a direct prompt.",
  ],
  Pinterest: [
    "Focus on outcomes and inspiration.",
    "Use keywords that match board searches.",
    "Finish with a link-friendly CTA.",
  ],
};

export const PLATFORM_PREVIEW_META = {
  Instagram: { name: "Your Brand", handle: "@yourbrand", accent: "#F56040" },
  Facebook: { name: "Your Brand", handle: "facebook.com/yourbrand", accent: "#1877F2" },
  LinkedIn: { name: "Your Brand", handle: "Your Role • Company", accent: "#0A66C2" },
  "X/Twitter": { name: "Your Brand", handle: "@yourbrand", accent: "#1D9BF0" },
  TikTok: { name: "yourbrand", handle: "Your Brand", accent: "#EE1D52" },
  YouTube: { name: "Your Brand", handle: "1.2K subscribers", accent: "#FF0000" },
  Threads: { name: "Your Brand", handle: "@yourbrand", accent: "#101010" },
  Pinterest: { name: "Your Brand", handle: "1.5M followers", accent: "#E60023" },
};

export const STORAGE_KEY = "pm-content-dashboard-v1";
export const USER_STORAGE_KEY = "pm-content-dashboard-user";
export const NOTIFICATIONS_STORAGE_KEY = "pm-content-dashboard-notifications";
export const IDEAS_STORAGE_KEY = "pm-content-dashboard-ideas";
export const LINKEDIN_STORAGE_KEY = "pm-content-dashboard-linkedin";
export const TESTING_STORAGE_KEY = "pm-content-dashboard-testing";
export const GUIDELINES_STORAGE_KEY = "content-guidelines-settings-v1";
export const AUDIT_STORAGE_KEY = "pm-content-audit-log";
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export const storageAvailable =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const PERFORMANCE_HEADER_KEYS = {
  entryId: ["entry_id", "content_id", "dashboard_id", "id"],
  date: ["date", "post_date", "published_date", "scheduled_date"],
  platform: ["platform", "channel", "network"],
  caption: ["caption", "copy", "post_text", "text"],
  url: ["url", "link", "permalink"],
};

export const PERFORMANCE_IGNORED_METRIC_KEYS = new Set([
  ...PERFORMANCE_HEADER_KEYS.entryId,
  ...PERFORMANCE_HEADER_KEYS.date,
  ...PERFORMANCE_HEADER_KEYS.platform,
  ...PERFORMANCE_HEADER_KEYS.caption,
  ...PERFORMANCE_HEADER_KEYS.url,
  "notes",
  "comments",
]);
