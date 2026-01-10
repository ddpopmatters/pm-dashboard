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
} from './utils';

// Checklist helpers
export const createEmptyChecklist = () => {
  const checklist = {};
  CHECKLIST_ITEMS.forEach(({ key }) => {
    checklist[key] = false;
  });
  return checklist;
};

export const ensureChecklist = (value) => {
  const base = createEmptyChecklist();
  if (value && typeof value === 'object') {
    Object.keys(base).forEach((key) => {
      base[key] = Boolean(value[key]);
    });
  }
  return base;
};

// Comments helper
export const ensureComments = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((comment) => comment && typeof comment === 'object' && comment.body)
    .map((comment) => ({
      id: comment.id || uuid(),
      author: comment.author || 'Unknown',
      body: comment.body,
      createdAt: comment.createdAt || new Date().toISOString(),
      mentions:
        Array.isArray(comment.mentions) && comment.mentions.length
          ? comment.mentions
          : extractMentions(comment.body),
    }));
};

// Analytics helper
export const ensureAnalytics = (value) => {
  if (!value || typeof value !== 'object') return {};
  const analytics = {};
  Object.entries(value).forEach(([platform, metrics]) => {
    if (!platform) return;
    if (!metrics || typeof metrics !== 'object') return;
    const cleaned = {};
    Object.entries(metrics).forEach(([key, metricValue]) => {
      if (metricValue === undefined || metricValue === null || metricValue === '') return;
      cleaned[key] = metricValue;
    });
    analytics[platform] = cleaned;
  });
  return analytics;
};

// Platform captions helper
export const ensurePlatformCaptions = (value) => {
  if (!value || typeof value !== 'object') return {};
  const cleaned = {};
  Object.entries(value).forEach(([key, val]) => {
    if (typeof val === 'string') cleaned[key] = val;
  });
  return cleaned;
};

// Main entry sanitizer
export const sanitizeEntry = (entry) => {
  if (!entry || typeof entry !== 'object') return null;
  const approvers = ensurePeopleArray(entry.approvers ?? entry.approver);
  const platforms = ensureArray(entry.platforms);
  const assetType = ASSET_TYPES.includes(entry.assetType) ? entry.assetType : 'Design';
  const status =
    typeof entry.status === 'string' && entry.status.toLowerCase() === 'approved'
      ? 'Approved'
      : 'Pending';
  const createdAt = entry.createdAt || new Date().toISOString();
  const updatedAt = entry.updatedAt || createdAt;
  const author =
    typeof entry.author === 'string'
      ? entry.author.trim()
      : entry.author
        ? String(entry.author).trim()
        : '';
  const caption = typeof entry.caption === 'string' ? entry.caption : '';
  const url =
    typeof entry.url === 'string' ? entry.url.trim() : entry.url ? String(entry.url).trim() : '';
  const firstComment = typeof entry.firstComment === 'string' ? entry.firstComment : '';

  const base = {
    ...entry,
    id: entry.id || uuid(),
    date: entry.date || new Date().toISOString().slice(0, 10),
    status,
    approvers,
    author,
    caption,
    url,
    approvalDeadline: typeof entry.approvalDeadline === 'string' ? entry.approvalDeadline : '',
    campaign: CAMPAIGNS.includes(entry.campaign) ? entry.campaign : '',
    contentPillar: CONTENT_PILLARS.includes(entry.contentPillar) ? entry.contentPillar : '',
    analytics: ensureAnalytics(entry.analytics),
    analyticsUpdatedAt:
      typeof entry.analyticsUpdatedAt === 'string' ? entry.analyticsUpdatedAt : '',
    testingFrameworkId:
      typeof entry.testingFrameworkId === 'string' ? entry.testingFrameworkId : '',
    testingFrameworkName:
      typeof entry.testingFrameworkName === 'string' ? entry.testingFrameworkName : '',
    assetType,
    script: assetType === 'Video' && typeof entry.script === 'string' ? entry.script : undefined,
    designCopy:
      assetType === 'Design' && typeof entry.designCopy === 'string' ? entry.designCopy : undefined,
    carouselSlides:
      assetType === 'Carousel' && Array.isArray(entry.carouselSlides)
        ? entry.carouselSlides.map((slide) => (typeof slide === 'string' ? slide : ''))
        : assetType === 'Carousel'
          ? ['', '', '']
          : undefined,
    firstComment,
    checklist: ensureChecklist(entry.checklist),
    comments: ensureComments(entry.comments),
    platformCaptions: ensurePlatformCaptions(entry.platformCaptions),
    platforms,
    previewUrl: entry.previewUrl ? String(entry.previewUrl) : '',
    createdAt,
    updatedAt,
    workflowStatus: KANBAN_STATUSES.includes(entry.workflowStatus)
      ? entry.workflowStatus
      : status === 'Approved'
        ? 'Approved'
        : entry.statusDetail === 'Scheduled'
          ? 'Scheduled'
          : 'Draft',
  };

  if (assetType !== 'Video') base.script = undefined;
  if (assetType !== 'Design') base.designCopy = undefined;
  if (assetType !== 'Carousel') base.carouselSlides = undefined;

  return base;
};

// Idea sanitizer
export const sanitizeIdea = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const ideaType = IDEA_TYPES.includes(raw.type) ? raw.type : IDEA_TYPES[0];
  const links = ensureLinksArray(raw.links);
  const attachments = ensureAttachments(raw.attachments);
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const notes = typeof raw.notes === 'string' ? raw.notes : '';
  const createdBy = typeof raw.createdBy === 'string' ? raw.createdBy : '';
  const createdAt = raw.createdAt || new Date().toISOString();
  const targetDate = raw.targetDate && typeof raw.targetDate === 'string' ? raw.targetDate : '';
  const monthKey = (iso) => (iso ? iso.slice(0, 7) : '');
  const targetMonth =
    raw.targetMonth && typeof raw.targetMonth === 'string'
      ? raw.targetMonth
      : targetDate
        ? monthKey(targetDate)
        : '';
  return {
    id: raw.id || uuid(),
    type: ideaType,
    title,
    notes,
    links,
    attachments,
    inspiration: typeof raw.inspiration === 'string' ? raw.inspiration : '',
    createdBy,
    createdAt,
    targetDate,
    targetMonth,
  };
};

// LinkedIn submission sanitizer
export const sanitizeLinkedInSubmission = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const submissionType = LINKEDIN_TYPES.includes(raw.submissionType)
    ? raw.submissionType
    : LINKEDIN_TYPES[0];
  const status = LINKEDIN_STATUSES.includes(raw.status) ? raw.status : LINKEDIN_STATUSES[0];
  const links = ensureLinksArray(raw.links);
  const attachments = ensureAttachments(raw.attachments);
  const postCopy = typeof raw.postCopy === 'string' ? raw.postCopy : raw.copy || '';
  const comments = typeof raw.comments === 'string' ? raw.comments : raw.callToAction || '';
  const owner = typeof raw.owner === 'string' ? raw.owner.trim() : '';
  const submitter = typeof raw.submitter === 'string' ? raw.submitter.trim() : '';
  const createdAt = raw.createdAt || new Date().toISOString();
  const targetDate = raw.targetDate && typeof raw.targetDate === 'string' ? raw.targetDate : '';
  const titleSource = typeof raw.title === 'string' ? raw.title : postCopy;
  const title = titleSource ? titleSource.trim() : 'LinkedIn draft';
  return {
    id: raw.id || uuid(),
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
export const sanitizeTestingFramework = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name) return null;
  const hypothesis = typeof raw.hypothesis === 'string' ? raw.hypothesis : '';
  const audience = typeof raw.audience === 'string' ? raw.audience : '';
  const metric = typeof raw.metric === 'string' ? raw.metric : '';
  const duration = typeof raw.duration === 'string' ? raw.duration : '';
  const status = TESTING_STATUSES.includes(raw.status) ? raw.status : TESTING_STATUSES[0];
  const notes = typeof raw.notes === 'string' ? raw.notes : '';
  const createdAt = raw.createdAt || new Date().toISOString();
  return {
    id: raw.id || uuid(),
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
export const computeStatusDetail = (entry) => {
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
export const getPlatformCaption = (baseCaption, platformCaptions, platform) => {
  if (!platform || platform === 'Main') return baseCaption;
  const custom =
    platformCaptions && typeof platformCaptions === 'object' ? platformCaptions[platform] : null;
  return custom && custom.trim().length ? custom : baseCaption;
};

// Check if URL is an image
export const isImageMedia = (url) => {
  if (!url) return false;
  if (typeof url !== 'string') return false;
  if (url.startsWith('data:image')) return true;
  const cleaned = url.split('?')[0].toLowerCase();
  return /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(cleaned);
};

// Entry signature for change detection
export const entrySignature = (entry) => {
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

// Determine workflow status
export const determineWorkflowStatus = ({
  approvers = [],
  assetType = 'No asset',
  previewUrl = '',
}) => {
  const hasApprovers = Array.isArray(approvers) && approvers.length > 0;
  const needsVisual =
    assetType && assetType !== 'No asset' && !(previewUrl && String(previewUrl).trim());
  if (hasApprovers || needsVisual) return 'Approval required';
  return 'Draft';
};
