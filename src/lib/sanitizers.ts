/**
 * Sanitization functions for data normalization
 */
import {
  ASSET_TYPES,
  CAMPAIGNS,
  CONTENT_PILLARS,
  CHECKLIST_ITEMS,
  KANBAN_STATUSES,
  IDEA_TYPES,
  LINKEDIN_TYPES,
  LINKEDIN_STATUSES,
  TESTING_STATUSES,
  WORKFLOW_STAGES,
} from '../constants';
import {
  uuid,
  ensureArray,
  ensurePeopleArray,
  ensureLinksArray,
  ensureAttachments,
  extractMentions,
  serializeForComparison,
} from './utils';
import type {
  Attachment,
  Entry,
  Idea,
  LinkedInSubmission,
  TestingFramework,
  Comment,
} from '../types/models';

// Type for checklist object
export type Checklist = Record<string, boolean>;

// Type for analytics data
export type Analytics = Record<string, Record<string, unknown>>;

// Type for platform captions
export type PlatformCaptions = Record<string, string>;

// Checklist helpers
export const createEmptyChecklist = (): Checklist => {
  const checklist: Checklist = {};
  CHECKLIST_ITEMS.forEach(({ key }) => {
    checklist[key] = false;
  });
  return checklist;
};

export const ensureChecklist = (value: unknown): Checklist => {
  const base = createEmptyChecklist();
  if (value && typeof value === 'object') {
    const valueObj = value as Record<string, unknown>;
    Object.keys(base).forEach((key) => {
      base[key] = Boolean(valueObj[key]);
    });
  }
  return base;
};

// Comments helper
export const ensureComments = (value: unknown): Comment[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (comment): comment is Record<string, unknown> =>
        comment && typeof comment === 'object' && 'body' in comment && Boolean(comment.body),
    )
    .map((comment) => ({
      id: typeof comment.id === 'string' ? comment.id : uuid(),
      author: typeof comment.author === 'string' ? comment.author : 'Unknown',
      body: String(comment.body),
      createdAt:
        typeof comment.createdAt === 'string' ? comment.createdAt : new Date().toISOString(),
      mentions:
        Array.isArray(comment.mentions) && comment.mentions.length
          ? (comment.mentions as string[])
          : extractMentions(String(comment.body)),
    }));
};

// Analytics helper
export const ensureAnalytics = (value: unknown): Analytics => {
  if (!value || typeof value !== 'object') return {};
  const valueObj = value as Record<string, unknown>;
  const analytics: Analytics = {};
  Object.entries(valueObj).forEach(([platform, metrics]) => {
    if (!platform) return;
    if (!metrics || typeof metrics !== 'object') return;
    const metricsObj = metrics as Record<string, unknown>;
    const cleaned: Record<string, unknown> = {};
    Object.entries(metricsObj).forEach(([key, metricValue]) => {
      if (metricValue === undefined || metricValue === null || metricValue === '') return;
      cleaned[key] = metricValue;
    });
    analytics[platform] = cleaned;
  });
  return analytics;
};

// Platform captions helper
export const ensurePlatformCaptions = (value: unknown): PlatformCaptions => {
  if (!value || typeof value !== 'object') return {};
  const valueObj = value as Record<string, unknown>;
  const cleaned: PlatformCaptions = {};
  Object.entries(valueObj).forEach(([key, val]) => {
    if (typeof val === 'string') cleaned[key] = val;
  });
  return cleaned;
};

// Helper to check if value is in readonly array
const isInArray = <T extends readonly string[]>(arr: T, value: string): value is T[number] =>
  arr.includes(value as T[number]);

// Main entry sanitizer
export const sanitizeEntry = (entry: unknown): Entry | null => {
  if (!entry || typeof entry !== 'object') return null;
  const raw = entry as Record<string, unknown>;

  const approvers = ensurePeopleArray(raw.approvers ?? raw.approver);
  const platforms = ensureArray(raw.platforms);
  const assetType =
    typeof raw.assetType === 'string' && isInArray(ASSET_TYPES, raw.assetType)
      ? raw.assetType
      : 'Design';
  const status =
    typeof raw.status === 'string' && raw.status.toLowerCase() === 'approved'
      ? 'Approved'
      : 'Pending';
  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString();
  const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt;
  const author =
    typeof raw.author === 'string'
      ? raw.author.trim()
      : raw.author
        ? String(raw.author).trim()
        : '';
  const caption = typeof raw.caption === 'string' ? raw.caption : '';
  const url = typeof raw.url === 'string' ? raw.url.trim() : raw.url ? String(raw.url).trim() : '';
  const firstComment = typeof raw.firstComment === 'string' ? raw.firstComment : '';

  const base: Entry = {
    ...(raw as Partial<Entry>),
    id: typeof raw.id === 'string' ? raw.id : uuid(),
    date: typeof raw.date === 'string' ? raw.date : new Date().toISOString().slice(0, 10),
    status,
    approvers,
    author,
    caption,
    url,
    approvalDeadline: typeof raw.approvalDeadline === 'string' ? raw.approvalDeadline : '',
    campaign:
      typeof raw.campaign === 'string' && isInArray(CAMPAIGNS, raw.campaign) ? raw.campaign : '',
    contentPillar:
      typeof raw.contentPillar === 'string' && isInArray(CONTENT_PILLARS, raw.contentPillar)
        ? raw.contentPillar
        : '',
    analytics: ensureAnalytics(raw.analytics),
    analyticsUpdatedAt: typeof raw.analyticsUpdatedAt === 'string' ? raw.analyticsUpdatedAt : '',
    testingFrameworkId: typeof raw.testingFrameworkId === 'string' ? raw.testingFrameworkId : '',
    testingFrameworkName:
      typeof raw.testingFrameworkName === 'string' ? raw.testingFrameworkName : '',
    assetType,
    script: assetType === 'Video' && typeof raw.script === 'string' ? raw.script : undefined,
    designCopy:
      assetType === 'Design' && typeof raw.designCopy === 'string' ? raw.designCopy : undefined,
    carouselSlides:
      assetType === 'Carousel' && Array.isArray(raw.carouselSlides)
        ? raw.carouselSlides.map((slide) => (typeof slide === 'string' ? slide : ''))
        : assetType === 'Carousel'
          ? ['', '', '']
          : undefined,
    firstComment,
    checklist: ensureChecklist(raw.checklist),
    comments: ensureComments(raw.comments),
    platformCaptions: ensurePlatformCaptions(raw.platformCaptions),
    platforms,
    previewUrl: raw.previewUrl ? String(raw.previewUrl) : '',
    createdAt,
    updatedAt,
    workflowStatus:
      typeof raw.workflowStatus === 'string' && isInArray(KANBAN_STATUSES, raw.workflowStatus)
        ? raw.workflowStatus
        : status === 'Approved'
          ? 'Approved'
          : raw.statusDetail === 'Scheduled'
            ? 'Scheduled'
            : 'Draft',
    statusDetail: typeof raw.statusDetail === 'string' ? raw.statusDetail : '',
    aiFlags: Array.isArray(raw.aiFlags) ? (raw.aiFlags as string[]) : [],
    aiScore:
      raw.aiScore && typeof raw.aiScore === 'object' ? (raw.aiScore as Record<string, number>) : {},
    approvedAt: typeof raw.approvedAt === 'string' ? raw.approvedAt : null,
    deletedAt: typeof raw.deletedAt === 'string' ? raw.deletedAt : null,
  };

  if (assetType !== 'Video') base.script = undefined;
  if (assetType !== 'Design') base.designCopy = undefined;
  if (assetType !== 'Carousel') base.carouselSlides = undefined;

  return base;
};

// Idea sanitizer
export const sanitizeIdea = (raw: unknown): Idea | null => {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;

  const ideaType =
    typeof data.type === 'string' && isInArray(IDEA_TYPES, data.type) ? data.type : IDEA_TYPES[0];
  const links = ensureLinksArray(data.links);
  const attachments = ensureAttachments(data.attachments);
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const notes = typeof data.notes === 'string' ? data.notes : '';
  const createdBy = typeof data.createdBy === 'string' ? data.createdBy : '';
  const createdAt = typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString();
  const targetDate = data.targetDate && typeof data.targetDate === 'string' ? data.targetDate : '';
  const monthKey = (iso: string) => (iso ? iso.slice(0, 7) : '');
  const targetMonth =
    data.targetMonth && typeof data.targetMonth === 'string'
      ? data.targetMonth
      : targetDate
        ? monthKey(targetDate)
        : '';

  return {
    id: typeof data.id === 'string' ? data.id : uuid(),
    type: ideaType,
    title,
    notes,
    links,
    attachments,
    inspiration: typeof data.inspiration === 'string' ? data.inspiration : '',
    createdBy,
    createdAt,
    targetDate,
    targetMonth,
  };
};

// LinkedIn submission sanitizer
export const sanitizeLinkedInSubmission = (raw: unknown): LinkedInSubmission | null => {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;

  const submissionType =
    typeof data.submissionType === 'string' && isInArray(LINKEDIN_TYPES, data.submissionType)
      ? data.submissionType
      : LINKEDIN_TYPES[0];
  const status =
    typeof data.status === 'string' && isInArray(LINKEDIN_STATUSES, data.status)
      ? data.status
      : LINKEDIN_STATUSES[0];
  const links = ensureLinksArray(data.links);
  const attachments = ensureAttachments(data.attachments);
  const postCopy = typeof data.postCopy === 'string' ? data.postCopy : String(data.copy || '');
  const comments =
    typeof data.comments === 'string' ? data.comments : String(data.callToAction || '');
  const owner = typeof data.owner === 'string' ? data.owner.trim() : '';
  const submitter = typeof data.submitter === 'string' ? data.submitter.trim() : '';
  const createdAt = typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString();
  const targetDate = data.targetDate && typeof data.targetDate === 'string' ? data.targetDate : '';
  const titleSource = typeof data.title === 'string' ? data.title : postCopy;
  const title = titleSource ? titleSource.trim() : 'LinkedIn draft';

  return {
    id: typeof data.id === 'string' ? data.id : uuid(),
    submissionType,
    status,
    title,
    postCopy,
    comments,
    owner,
    submitter,
    links,
    attachments,
    targetDate,
    createdAt,
  };
};

// Testing framework sanitizer
export const sanitizeTestingFramework = (raw: unknown): TestingFramework | null => {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;

  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (!name) return null;
  const hypothesis = typeof data.hypothesis === 'string' ? data.hypothesis : '';
  const audience = typeof data.audience === 'string' ? data.audience : '';
  const metric = typeof data.metric === 'string' ? data.metric : '';
  const duration = typeof data.duration === 'string' ? data.duration : '';
  const status =
    typeof data.status === 'string' && isInArray(TESTING_STATUSES, data.status)
      ? data.status
      : TESTING_STATUSES[0];
  const notes = typeof data.notes === 'string' ? data.notes : '';
  const createdAt = typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString();

  return {
    id: typeof data.id === 'string' ? data.id : uuid(),
    name,
    hypothesis,
    audience,
    metric,
    duration,
    status,
    notes,
    createdAt,
  };
};

// Compute status detail based on checklist completion
export const computeStatusDetail = (entry: Partial<Entry> | null | undefined): string => {
  if (!entry) return WORKFLOW_STAGES[0];
  const checklist = ensureChecklist(entry.checklist);
  const total = CHECKLIST_ITEMS.length || 1;
  const completed = Object.values(checklist).filter(Boolean).length;

  if (entry.status === 'Approved') {
    return completed === total ? 'Internals approved' : 'Ready for review';
  }

  if (completed === 0) return 'Briefing';
  if (completed < Math.ceil(total / 3)) return 'Production';
  if (completed < total) return 'Ready for review';
  if (completed >= total) return 'Scheduled';

  return entry.statusDetail || WORKFLOW_STAGES[0];
};

// Get platform-specific caption
export const getPlatformCaption = (
  baseCaption: string,
  platformCaptions: PlatformCaptions | null | undefined,
  platform: string,
): string => {
  if (!platform || platform === 'Main') return baseCaption;
  const custom =
    platformCaptions && typeof platformCaptions === 'object' ? platformCaptions[platform] : null;
  return custom && custom.trim().length ? custom : baseCaption;
};

// Check if URL is an image
export const isImageMedia = (url: unknown): boolean => {
  if (!url) return false;
  if (typeof url !== 'string') return false;
  if (url.startsWith('data:image')) return true;
  const cleaned = url.split('?')[0].toLowerCase();
  return /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(cleaned);
};

// Entry signature for change detection
export const entrySignature = (entry: Partial<Entry> | null | undefined): string => {
  if (!entry) return '';
  try {
    return [
      entry.id,
      entry.updatedAt,
      entry.status,
      entry.statusDetail,
      entry.campaign,
      entry.contentPillar,
      entry.caption,
      entry.previewUrl,
      (entry.platforms || []).join('|'),
      JSON.stringify(ensureChecklist(entry.checklist)),
      (entry.comments || []).length,
    ].join('::');
  } catch (error) {
    console.warn('Failed to compute entry signature', error);
    return String(entry.id || 'unknown');
  }
};

// Determine workflow status params
interface DetermineWorkflowParams {
  approvers?: string[];
  assetType?: string;
  previewUrl?: string;
}

// Determine workflow status
export const determineWorkflowStatus = ({
  approvers = [],
  assetType = 'No asset',
  previewUrl = '',
}: DetermineWorkflowParams): string => {
  const hasApprovers = Array.isArray(approvers) && approvers.length > 0;
  const needsVisual =
    assetType && assetType !== 'No asset' && !(previewUrl && String(previewUrl).trim());
  if (hasApprovers || needsVisual) return 'Approval required';
  return 'Draft';
};

// Fields that trigger approver re-notification when changed
export const APPROVER_ALERT_FIELDS: readonly string[] = [
  'date',
  'platforms',
  'assetType',
  'caption',
  'platformCaptions',
  'firstComment',
  'approvalDeadline',
  'campaign',
  'contentPillar',
  'previewUrl',
  'checklist',
  'analytics',
  'testingFrameworkId',
  'testingFrameworkName',
  'workflowStatus',
  'statusDetail',
  'carouselSlides',
  'designCopy',
  'script',
] as const;

/**
 * Checks if entry changes are relevant to approvers (require re-notification)
 */
export const hasApproverRelevantChanges = (
  previousEntry: Partial<Entry> | null | undefined,
  nextEntry: Partial<Entry> | null | undefined,
): boolean => {
  if (!nextEntry) return false;
  if (!previousEntry) return true;
  return APPROVER_ALERT_FIELDS.some((field) => {
    const prevValue = (previousEntry as Record<string, unknown>)[field];
    const nextValue = (nextEntry as Record<string, unknown>)[field];
    return serializeForComparison(prevValue) !== serializeForComparison(nextValue);
  });
};
