export const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

export const ASSET_TYPES = ['No asset', 'Video', 'Design', 'Carousel'] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const IDEA_TYPES = ['Topic', 'Theme', 'Series', 'Campaign', 'Other'] as const;
export type IdeaType = (typeof IDEA_TYPES)[number];

// Streamlined Kanban with 4 statuses (simplified from 7)
export const KANBAN_STATUSES = ['Draft', 'Ready for Review', 'Approved', 'Published'] as const;
export type KanbanStatus = (typeof KANBAN_STATUSES)[number];

// Legacy status mapping for migration
export const LEGACY_STATUS_MAP: Record<string, KanbanStatus> = {
  Draft: 'Draft',
  'Approval required': 'Ready for Review',
  'Awaiting brand approval': 'Ready for Review',
  'Awaiting SME approval': 'Ready for Review',
  'Awaiting visual': 'Ready for Review',
  'In Review': 'Ready for Review',
  Approved: 'Approved',
  Scheduled: 'Approved',
  Published: 'Published',
};

export const CAMPAIGNS = [
  'Evergreen',
  'Product launch',
  'Event',
  'Thought leadership',
  'Advocacy',
] as const;
export type Campaign = (typeof CAMPAIGNS)[number];

export const CONTENT_PILLARS = [
  'Awareness',
  'Education',
  'Engagement',
  'Community',
  'Conversion',
] as const;
export type ContentPillar = (typeof CONTENT_PILLARS)[number];

export const ALL_PLATFORMS = [
  'Instagram',
  'Facebook',
  'LinkedIn',
  'BlueSky',
  'TikTok',
  'YouTube',
] as const;
export type Platform = (typeof ALL_PLATFORMS)[number];

export const DEFAULT_APPROVERS = [
  'Jameen Kaur',
  'Emma Lewendon-Strutt',
  'Josh Hill',
  'Shweta Shirodkar',
  'Dan Davis',
] as const;

export const PLATFORM_DEFAULT_LIMITS: Record<Platform, number> = {
  Instagram: 2200,
  Facebook: 63206,
  LinkedIn: 3000,
  BlueSky: 300,
  TikTok: 2200,
  YouTube: 5000,
};

export const GUIDELINES_STORAGE_KEY = 'content-guidelines-settings-v1';

export interface UserRecord {
  name: string;
  email: string;
}

export const DEFAULT_USERS: UserRecord[] = [
  { name: 'Daniel Davis', email: 'daniel.davis@populationmatters.org' },
  { name: 'Dan Davis', email: 'dan@example.com' },
  { name: 'Francesca Harrison', email: '' },
  { name: 'Comms Lead', email: '' },
  { name: 'Campaigns Manager', email: '' },
  { name: 'Policy Lead', email: '' },
  { name: 'Creative Director', email: '' },
  { name: 'Social Lead', email: '' },
];

export interface FeatureOption {
  key: string;
  label: string;
}

export const FEATURE_OPTIONS: FeatureOption[] = [
  { key: 'calendar', label: 'Calendar & planning' },
  { key: 'kanban', label: 'Production Kanban' },
  { key: 'approvals', label: 'Approvals queue' },
  { key: 'ideas', label: 'Ideas log' },
  { key: 'admin', label: 'Admin tools' },
];

export const PLAN_TAB_FEATURES: Record<string, string> = {
  plan: 'calendar',
  trash: 'calendar',
  kanban: 'kanban',
  ideas: 'ideas',
};

export const PLAN_TAB_ORDER = ['plan', 'kanban', 'ideas', 'trash'] as const;

export const WORKFLOW_STAGES = [
  'Briefing',
  'Production',
  'Ready for review',
  'Internals approved',
  'Scheduled',
  'Published',
] as const;
export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

export interface ChecklistItem {
  key: string;
  label: string;
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  { key: 'assetCreated', label: 'Asset created' },
  { key: 'altTextWritten', label: 'Alt text prepared' },
  { key: 'linksChecked', label: 'Links checked' },
  { key: 'copyProofed', label: 'Copy proofed' },
  { key: 'tagsSet', label: 'Tags / targeting set' },
];

export const PLATFORM_IMAGES: Record<Platform, string> = {
  Instagram: 'https://cdn.simpleicons.org/instagram/E4405F',
  Facebook: 'https://cdn.simpleicons.org/facebook/1877F2',
  LinkedIn:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNCAyNCc+PHJlY3Qgd2lkdGg9JzI0JyBoZWlnaHQ9JzI0JyByeD0nNCcgZmlsbD0nJTIzMEE2NkMyJy8+PHBhdGggZmlsbD0nd2hpdGUnIGQ9J005LjE5IDE4LjVINi41NFY5Ljg4aDIuNjVWMTguNVptLTEuMzItOS44NGMtLjg1IDAtMS41My0uNjktMS41My0xLjUzcy42OC0xLjUzIDEuNTMtMS41MyAxLjUzLjY5IDEuNTMgMS41My0uNjggMS41My0xLjUzIDEuNTNabTExLjEzIDkuODRoLTIuNjR2LTQuNDJjMC0xLjA1LS4wMi0yLjQtMS40Ni0yLjQtMS40NiAwLTEuNjggMS4xNC0xLjY4IDIuMzJ2NC40OUgxMC4yVjkuODhoMi41M3YxLjE4aC4wNGMuMzUtLjY2IDEuMjEtMS4zNiAyLjQ5LTEuMzYgMi42NiAwIDMuMTYgMS43NSAzLjE2IDQuMDJ2NC43N1onLz48L3N2Zz4=',
  BlueSky: 'https://cdn.simpleicons.org/bluesky/1A3B55',
  TikTok: 'https://cdn.simpleicons.org/tiktok',
  YouTube: 'https://cdn.simpleicons.org/youtube/FF0000',
};

export const PLATFORM_TIPS: Record<Platform, string[]> = {
  Instagram: [
    'Lead with a strong hook in the first 2 lines.',
    'Use line breaks or emojis to improve readability.',
    'Finish with 3-5 targeted hashtags.',
  ],
  Facebook: [
    'Keep copy short and conversational.',
    'Mention the benefit before the ask.',
    'Add a clear CTA near the end.',
  ],
  LinkedIn: [
    'Open with a bold insight or data point.',
    'Write in short paragraphs for skim reading.',
    'End with a question to invite comments.',
  ],
  BlueSky: [
    'Stay conversational and lift the strongest statement up front.',
    'Use a few hashtags and keep the tone welcoming.',
    'End with a prompt to encourage replies.',
  ],
  TikTok: [
    'Hook viewers with a first sentence that matches the audio.',
    'Add keywords to improve search visibility.',
    'Include a clear call to action to comment or share.',
  ],
  YouTube: [
    'Front-load the value proposition in line one.',
    'Add timestamps or bullet points for longer videos.',
    'Encourage likes/subscribes in the final sentence.',
  ],
};

export const PM_PROFILE_IMAGE =
  'https://upload.wikimedia.org/wikipedia/en/thumb/3/35/Population_Matters_logo.png/240px-Population_Matters_logo.png';

export interface PlatformPreviewMeta {
  name: string;
  handle: string;
  accent: string;
  profileUrl: string;
  avatar: string;
}

export const PLATFORM_PREVIEW_META: Record<Platform, PlatformPreviewMeta> = {
  Instagram: {
    name: 'Population Matters',
    handle: '@popnmatters',
    accent: '#F56040',
    profileUrl: 'https://www.instagram.com/popnmatters/',
    avatar:
      'https://www.wikicorporates.org/mediawiki/images/thumb/d/db/Population-Matters-2020.png/250px-Population-Matters-2020.png',
  },
  Facebook: {
    name: 'Population Matters',
    handle: 'facebook.com/PopulationMatters',
    accent: '#1877F2',
    profileUrl: 'https://www.facebook.com/PopulationMatters',
    avatar:
      'https://www.wikicorporates.org/mediawiki/images/thumb/d/db/Population-Matters-2020.png/250px-Population-Matters-2020.png',
  },
  LinkedIn: {
    name: 'Population Matters',
    handle: 'population matters',
    accent: '#0A66C2',
    profileUrl: 'https://www.linkedin.com/company/population-matters/',
    avatar:
      'https://www.wikicorporates.org/mediawiki/images/thumb/d/db/Population-Matters-2020.png/250px-Population-Matters-2020.png',
  },
  BlueSky: {
    name: 'Population Matters',
    handle: '@popnmatters.bsky.social',
    accent: '#1D9BF0',
    profileUrl: 'https://bsky.app/profile/popnmatters.bsky.social',
    avatar:
      'https://www.wikicorporates.org/mediawiki/images/thumb/d/db/Population-Matters-2020.png/250px-Population-Matters-2020.png',
  },
  YouTube: {
    name: 'Population Matters',
    handle: 'PopulationMatters',
    accent: '#FF0000',
    profileUrl: 'https://www.youtube.com/c/populationmatters',
    avatar:
      'https://www.wikicorporates.org/mediawiki/images/thumb/d/db/Population-Matters-2020.png/250px-Population-Matters-2020.png',
  },
  TikTok: {
    name: 'Population Matters',
    handle: '@PopulationMatters',
    accent: '#EE1D52',
    profileUrl: 'https://www.tiktok.com/@PopulationMatters',
    avatar:
      'https://www.wikicorporates.org/mediawiki/images/thumb/d/db/Population-Matters-2020.png/250px-Population-Matters-2020.png',
  },
};
