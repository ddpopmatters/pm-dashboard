import React from 'react';
import { createRoot } from 'react-dom/client';
import { LoginScreen } from './components/auth/LoginScreen';
import { CalendarView } from './features/calendar/CalendarView';
import { ApprovalsView } from './features/approvals';
import { KanbanView } from './features/kanban';
import { LinkedInView } from './features/linkedin';
import { AdminPanel } from './features/admin';
import { TestingView } from './features/testing';
import { AnalyticsView } from './features/analytics/AnalyticsView';
import { EngagementView, DEFAULT_ENGAGEMENT_GOALS } from './features/engagement/EngagementView';
import { useApi } from './hooks/useApi';
import {
  ALL_PLATFORMS,
  ASSET_TYPES,
  CAMPAIGNS,
  CHECKLIST_ITEMS,
  CONTENT_PILLARS,
  DEFAULT_APPROVERS,
  DEFAULT_USERS,
  FEATURE_OPTIONS,
  IDEA_TYPES,
  KANBAN_STATUSES,
  LINKEDIN_STATUSES,
  LINKEDIN_TYPES,
  PLAN_TAB_FEATURES,
  PLAN_TAB_ORDER,
  PLATFORM_DEFAULT_LIMITS,
  PLATFORM_IMAGES,
  PLATFORM_PREVIEW_META,
  PLATFORM_TIPS,
  PM_PROFILE_IMAGE,
  TESTING_STATUSES,
  WEEKDAY_LABELS,
  WORKFLOW_STAGES,
} from './constants';
import {
  cx,
  uuid,
  daysInMonth,
  monthStartISO,
  monthEndISO,
  isoFromParts,
  isOlderThanDays,
  ensureArray,
  normalizeEmail,
  extractMentions,
  storageAvailable,
  STORAGE_KEYS,
  escapeHtml,
  ensureLinksArray,
  ensureAttachments,
  ensurePeopleArray,
  monthKeyFromDate,
  normalizeDateValue,
} from './lib/utils';
import {
  createEmptyChecklist,
  ensureChecklist,
  ensureComments,
  ensureAnalytics,
  ensurePlatformCaptions,
  sanitizeEntry,
  sanitizeIdea,
  sanitizeLinkedInSubmission,
  sanitizeTestingFramework,
  computeStatusDetail,
  getPlatformCaption,
  isImageMedia,
  entrySignature,
  determineWorkflowStatus,
  APPROVER_ALERT_FIELDS,
  hasApproverRelevantChanges,
} from './lib/sanitizers';
import { resolveMentionCandidate, computeMentionState } from './lib/mentions';
import {
  entryDescriptor,
  entryReviewLink,
  buildEntryEmailContext,
  buildEntryEmailHtml,
  buildEntryEmailText,
  buildEntryEmailPayload,
} from './lib/email';
import { selectBaseClasses, fileInputClasses, checklistCheckboxClass } from './lib/styles';
import {
  MultiSelect,
  FieldRow,
  Button,
  Input,
  Textarea,
  Label,
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  Badge,
  Modal,
  Toggle,
  Separator,
} from './components/ui';
import {
  MentionSuggestionList,
  NotificationBell,
  PlatformIcon,
  SvgIcon,
  CalendarIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  LoaderIcon,
  TrashIcon,
  RotateCcwIcon,
  PlusIcon,
  CopyIcon,
} from './components/common';
import { ChangePasswordModal } from './components/auth';
import { PerformanceImportModal } from './features/performance';
import { GuidelinesModal } from './features/guidelines';
import { IdeasBoard, IdeaAttachment, IdeaForm } from './features/ideas';
import { MiniCalendar, MonthGrid } from './features/calendar';
import { CopyCheckSection } from './features/copy-check';
import { SocialPreview } from './features/social';
import { ApproverMulti } from './features/entry';
import { parseCSV, normalizeHeaderKey } from './lib/csv';
import {
  FALLBACK_GUIDELINES,
  normalizeGuidelines,
  loadGuidelines,
  saveGuidelines,
} from './lib/guidelines';
import { notificationKey, loadNotifications, saveNotifications } from './lib/notifications';
import { appendAudit } from './lib/audit';
import {
  loadEntries,
  saveEntries,
  loadIdeas,
  saveIdeas,
  loadLinkedInSubmissions,
  saveLinkedInSubmissions,
  loadTestingFrameworks,
  saveTestingFrameworks,
} from './lib/storage';

const { useState, useMemo, useEffect, useCallback, useRef } = React;
const DEFAULT_FEATURES = FEATURE_OPTIONS.map((option) => option.key);
const ensureFeaturesList = (value) => {
  if (!Array.isArray(value)) return [...DEFAULT_FEATURES];
  const allowed = new Set(DEFAULT_FEATURES);
  const normalized = Array.from(
    new Set(value.filter((entry) => typeof entry === 'string' && allowed.has(entry))),
  );
  return normalized.length ? normalized : [...DEFAULT_FEATURES];
};
const normalizeUserValue = (value) => {
  const base = typeof value === 'string' ? { name: value, email: '' } : value || {};
  const rawName = typeof base.name === 'string' && base.name.trim() ? base.name.trim() : '';
  const rawEmail = typeof base.email === 'string' && base.email.trim() ? base.email.trim() : '';
  const name = rawName || rawEmail || 'Unknown user';
  const id =
    typeof base.id === 'string' && base.id.trim()
      ? base.id.trim()
      : `${name || rawEmail}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    id,
    name,
    email: rawEmail,
    features: ensureFeaturesList(base.features),
    status: base.status || 'active',
    invitePending: Boolean(base.invitePending),
  };
};
const DEFAULT_USER_RECORDS = DEFAULT_USERS.map(normalizeUserValue);

// Storage key alias for user storage
const USER_STORAGE_KEY = STORAGE_KEYS.USER;
// Storage key for draft entry auto-save
const DRAFT_ENTRY_STORAGE_KEY = STORAGE_KEYS.DRAFT_ENTRY;
// Auto-save interval in milliseconds (30 seconds)
const DRAFT_AUTO_SAVE_INTERVAL = 30000;

const PLATFORM_ALIAS_MAP = (() => {
  const map = {};
  const add = (alias, canonical) => {
    if (!alias) return;
    const key = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!key) return;
    map[key] = canonical;
  };
  ALL_PLATFORMS.forEach((platform) => {
    add(platform, platform);
  });
  add('twitter', 'BlueSky');
  add('xtwitter', 'BlueSky');
  add('x', 'BlueSky');
  add('bluesky', 'BlueSky');
  add('blue sky', 'BlueSky');
  add('bsky', 'BlueSky');
  add('linkedin', 'LinkedIn');
  add('facebook', 'Facebook');
  add('fb', 'Facebook');
  add('instagram', 'Instagram');
  add('ig', 'Instagram');
  add('tiktok', 'TikTok');
  add('youtube', 'YouTube');
  add('yt', 'YouTube');
  return map;
})();

const normalizePlatform = (value) => {
  if (!value) return '';
  const cleaned = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  if (!cleaned) return '';
  return PLATFORM_ALIAS_MAP[cleaned] || '';
};

const PERFORMANCE_HEADER_KEYS = {
  entryId: ['entry_id', 'content_id', 'dashboard_id', 'id'],
  date: ['date', 'post_date', 'published_date', 'scheduled_date'],
  platform: ['platform', 'channel', 'network'],
  caption: ['caption', 'copy', 'post_text', 'text'],
  url: ['url', 'link', 'permalink'],
};

const PERFORMANCE_IGNORED_METRIC_KEYS = new Set([
  ...PERFORMANCE_HEADER_KEYS.entryId,
  ...PERFORMANCE_HEADER_KEYS.date,
  ...PERFORMANCE_HEADER_KEYS.platform,
  ...PERFORMANCE_HEADER_KEYS.caption,
  ...PERFORMANCE_HEADER_KEYS.url,
  'notes',
  'comments',
]);

const mergePerformanceData = (entries, dataset) => {
  const headers = Array.isArray(dataset?.headers) ? dataset.headers : [];
  const records = Array.isArray(dataset?.records) ? dataset.records : [];
  const summary = {
    totalRows: records.length,
    matched: 0,
    updatedEntries: new Set(),
    missing: [],
    ambiguous: [],
    errors: [],
  };
  if (!headers.length || !records.length) {
    return { nextEntries: entries, summary };
  }
  const normalizedHeaders = headers.map((header) => normalizeHeaderKey(header));
  const headerLabels = {};
  normalizedHeaders.forEach((key, idx) => {
    if (!headerLabels[key]) headerLabels[key] = headers[idx].trim();
  });
  const hasEntryId = normalizedHeaders.some((key) => PERFORMANCE_HEADER_KEYS.entryId.includes(key));
  const hasDate = normalizedHeaders.some((key) => PERFORMANCE_HEADER_KEYS.date.includes(key));
  const hasPlatform = normalizedHeaders.some((key) =>
    PERFORMANCE_HEADER_KEYS.platform.includes(key),
  );
  if (!hasEntryId && (!hasDate || !hasPlatform)) {
    summary.errors.push({
      rowNumber: 1,
      reason: 'CSV must include an entry_id column or both date and platform columns.',
    });
    return { nextEntries: entries, summary };
  }
  const metricKeys = normalizedHeaders.filter((key) => !PERFORMANCE_IGNORED_METRIC_KEYS.has(key));
  if (!metricKeys.length) {
    summary.errors.push({
      rowNumber: 1,
      reason: 'No metric columns detected in the upload.',
    });
    return { nextEntries: entries, summary };
  }

  const nextEntries = entries.map((entry) => ({
    ...entry,
    analytics: ensureAnalytics(entry.analytics),
  }));
  const entryIndexById = new Map();
  nextEntries.forEach((entry, index) => {
    entryIndexById.set(entry.id, index);
  });

  const entriesByDatePlatform = new Map();
  nextEntries.forEach((entry, index) => {
    ensureArray(entry.platforms).forEach((platform) => {
      const key = `${entry.date}__${platform}`;
      if (!entriesByDatePlatform.has(key)) entriesByDatePlatform.set(key, []);
      entriesByDatePlatform.get(key).push(index);
    });
  });

  const getFirstValue = (row, keys) => {
    for (const key of keys) {
      if (row[key]) return row[key];
    }
    return '';
  };

  let mutated = false;
  const timestamp = new Date().toISOString();

  records.forEach(({ rowNumber, record }) => {
    const normalizedRow = {};
    headers.forEach((header, idx) => {
      const key = normalizedHeaders[idx];
      normalizedRow[key] = record[header] ?? '';
    });

    const entryIdValue = getFirstValue(normalizedRow, PERFORMANCE_HEADER_KEYS.entryId);
    let entryIndex = -1;
    let matchedEntry = null;
    let platform = '';

    if (entryIdValue) {
      entryIndex = entryIndexById.get(entryIdValue);
      if (entryIndex === undefined) {
        summary.missing.push({
          rowNumber,
          reason: `Entry ID "${entryIdValue}" not found.`,
        });
        return;
      }
      matchedEntry = nextEntries[entryIndex];
      const platformRaw = getFirstValue(normalizedRow, PERFORMANCE_HEADER_KEYS.platform);
      platform = normalizePlatform(platformRaw);
      if (!platform) {
        if (ensureArray(matchedEntry.platforms).length === 1) {
          platform = matchedEntry.platforms[0];
        } else {
          summary.errors.push({
            rowNumber,
            reason: `Specify platform for entry ID "${entryIdValue}" (multiple platforms linked).`,
          });
          return;
        }
      }
      if (!ensureArray(matchedEntry.platforms).includes(platform)) {
        summary.ambiguous.push({
          rowNumber,
          reason: `Entry ID "${entryIdValue}" is not scheduled for ${platform}.`,
        });
        return;
      }
    } else {
      const dateRaw = getFirstValue(normalizedRow, PERFORMANCE_HEADER_KEYS.date);
      const isoDate = normalizeDateValue(dateRaw);
      if (!isoDate) {
        summary.errors.push({
          rowNumber,
          reason: 'Row is missing a valid date value.',
        });
        return;
      }
      const platformRaw = getFirstValue(normalizedRow, PERFORMANCE_HEADER_KEYS.platform);
      platform = normalizePlatform(platformRaw);
      if (!platform) {
        summary.errors.push({
          rowNumber,
          reason: 'Row is missing a recognizable platform value.',
        });
        return;
      }
      const candidates = (entriesByDatePlatform.get(`${isoDate}__${platform}`) || []).map(
        (candidateIndex) => nextEntries[candidateIndex],
      );
      if (!candidates.length) {
        summary.missing.push({
          rowNumber,
          reason: `No calendar item on ${isoDate} for ${platform}.`,
        });
        return;
      }
      if (candidates.length === 1) {
        matchedEntry = candidates[0];
        entryIndex = entryIndexById.get(matchedEntry.id);
      } else {
        const snippet = getFirstValue(normalizedRow, PERFORMANCE_HEADER_KEYS.caption).toLowerCase();
        const link = getFirstValue(normalizedRow, PERFORMANCE_HEADER_KEYS.url).toLowerCase();
        let filtered = candidates;
        if (snippet) {
          filtered = filtered.filter((entry) =>
            (entry.caption || '').toLowerCase().includes(snippet),
          );
        }
        if (filtered.length !== 1 && link) {
          filtered = candidates.filter((entry) => (entry.url || '').toLowerCase().includes(link));
        }
        if (filtered.length === 1) {
          matchedEntry = filtered[0];
          entryIndex = entryIndexById.get(matchedEntry.id);
        } else {
          summary.ambiguous.push({
            rowNumber,
            reason: `Multiple calendar items found on ${isoDate} for ${platform}. Add entry_id to disambiguate.`,
          });
          return;
        }
      }
    }

    if (!matchedEntry || entryIndex === -1) {
      summary.errors.push({
        rowNumber,
        reason: 'Unable to match this row to a calendar item.',
      });
      return;
    }

    const metricPayload = {};
    metricKeys.forEach((key) => {
      const rawValue = normalizedRow[key];
      if (rawValue === undefined || rawValue === null || rawValue === '') return;
      const label = headerLabels[key] || key;
      const cleanedNumeric = typeof rawValue === 'string' ? rawValue.replace(/,/g, '') : rawValue;
      const numericValue =
        typeof cleanedNumeric === 'string' && cleanedNumeric !== ''
          ? Number(cleanedNumeric)
          : Number.isFinite(cleanedNumeric)
            ? cleanedNumeric
            : NaN;
      if (typeof rawValue === 'string' && rawValue.trim().endsWith('%')) {
        metricPayload[label] = rawValue.trim();
        return;
      }
      if (!Number.isNaN(numericValue) && rawValue !== '') {
        metricPayload[label] = numericValue;
      } else {
        metricPayload[label] = rawValue;
      }
    });

    if (!Object.keys(metricPayload).length) {
      summary.errors.push({
        rowNumber,
        reason: 'No metric values detected in this row.',
      });
      return;
    }

    const targetEntry = nextEntries[entryIndex];
    const analytics = ensureAnalytics(targetEntry.analytics);
    const existing = analytics[platform] ? { ...analytics[platform] } : {};
    const mergedMetrics = {
      ...existing,
      ...metricPayload,
      lastImportedAt: timestamp,
    };
    analytics[platform] = mergedMetrics;
    nextEntries[entryIndex] = {
      ...targetEntry,
      analytics,
      analyticsUpdatedAt: timestamp,
    };
    summary.matched += 1;
    summary.updatedEntries.add(targetEntry.id);
    mutated = true;
  });

  summary.updatedEntries = Array.from(summary.updatedEntries);
  summary.updatedEntryCount = summary.updatedEntries.length;
  const resultEntries = mutated ? nextEntries : entries;
  return { nextEntries: resultEntries, summary };
};

(() => {
  console.assert(daysInMonth(2024, 1) === 29, 'Feb 2024 = 29 days');
  console.assert(
    isOlderThanDays(new Date(Date.now() - 31 * 864e5).toISOString(), 30),
    'trash cutoff',
  );
  const idA = uuid();
  const idB = uuid();
  console.assert(idA !== idB, 'uuid should be unique-ish');
  const ms = monthStartISO(new Date());
  const me = monthEndISO(new Date());
  console.assert(ms <= me, 'month start should be <= end');
  const hasAnyPlatform = (selected, platforms) =>
    selected.length === 0 || selected.some((p) => platforms.includes(p));
  console.assert(
    hasAnyPlatform(['LinkedIn'], ['Instagram', 'LinkedIn']) === true,
    'platform filter OR logic',
  );
  const unapproveOnEdit = (status) => (status === 'Approved' ? 'Pending' : status);
  console.assert(unapproveOnEdit('Approved') === 'Pending', 'editing approved should un-approve');
  const checklist = ensureChecklist({ assetCreated: 1 });
  console.assert(Object.keys(checklist).length === CHECKLIST_ITEMS.length, 'checklist length');
  console.assert(
    checklist.assetCreated === true && checklist.altTextWritten === false,
    'checklist migration',
  );
  const mentions = extractMentions('@Dan Davis please sync with @Comms Lead');
  console.assert(mentions.length === 2, 'extract mentions');
})();

function EntryForm({
  onSubmit,
  existingEntries = [],
  testingFrameworks = [],
  onPreviewAssetType,
  guidelines = FALLBACK_GUIDELINES,
  currentUser = '',
  currentUserEmail = '',
  approverOptions = DEFAULT_APPROVERS,
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [approvers, setApprovers] = useState([]);
  const currentAuthorName = useMemo(() => {
    if (currentUser && currentUser.trim().length) return currentUser.trim();
    if (currentUserEmail && currentUserEmail.trim().length) return currentUserEmail.trim();
    return '';
  }, [currentUser, currentUserEmail]);
  const [platforms, setPlatforms] = useState([]);
  const [allPlatforms, setAllPlatforms] = useState(false);
  const [caption, setCaption] = useState('');
  const [url, setUrl] = useState('');
  const [approvalDeadline, setApprovalDeadline] = useState('');
  const [assetType, setAssetType] = useState('No asset');
  const [script, setScript] = useState('');
  const [designCopy, setDesignCopy] = useState('');
  const [slidesCount, setSlidesCount] = useState(3);
  const [carouselSlides, setCarouselSlides] = useState(['', '', '']);
  const [firstComment, setFirstComment] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [overrideConflict, setOverrideConflict] = useState(false);
  const [platformCaptions, setPlatformCaptions] = useState({});
  const [activeCaptionTab, setActiveCaptionTab] = useState('Main');
  const [activePreviewPlatform, setActivePreviewPlatform] = useState('Main');
  const [campaign, setCampaign] = useState('');
  const [contentPillar, setContentPillar] = useState('');
  const [testingFrameworkId, setTestingFrameworkId] = useState('');
  const [entryFormErrors, setEntryFormErrors] = useState([]);

  useEffect(() => {
    if (allPlatforms) {
      setPlatforms((prev) => {
        const alreadyAll =
          prev.length === ALL_PLATFORMS.length && ALL_PLATFORMS.every((p) => prev.includes(p));
        return alreadyAll ? prev : [...ALL_PLATFORMS];
      });
    }
  }, [allPlatforms]);

  useEffect(() => {
    onPreviewAssetType?.(assetType === 'No asset' ? null : assetType);
  }, [assetType, onPreviewAssetType]);

  useEffect(() => {
    setCarouselSlides((prev) => {
      if (slidesCount > prev.length) {
        return [...prev, ...Array(slidesCount - prev.length).fill('')];
      }
      if (slidesCount < prev.length) {
        return prev.slice(0, slidesCount);
      }
      return prev;
    });
  }, [slidesCount]);

  const conflicts = useMemo(
    () => (existingEntries || []).filter((entry) => !entry.deletedAt && entry.date === date),
    [existingEntries, date],
  );
  const hasConflict = conflicts.length > 0;

  useEffect(() => {
    setOverrideConflict(false);
  }, [date]);

  useEffect(() => {
    setActiveCaptionTab((prevTab) =>
      prevTab === 'Main' || platforms.includes(prevTab) ? prevTab : 'Main',
    );
    setPlatformCaptions((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        if (!platforms.includes(key)) delete updated[key];
      });
      return updated;
    });
    setActivePreviewPlatform((prev) =>
      prev === 'Main' || platforms.includes(prev) ? prev : platforms[0] || 'Main',
    );
  }, [platforms]);

  const reset = () => {
    setApprovers([]);
    setPlatforms([]);
    setAllPlatforms(false);
    setCaption('');
    setUrl('');
    setApprovalDeadline('');
    setPreviewUrl('');
    setAssetType('No asset');
    setScript('');
    setDesignCopy('');
    setSlidesCount(3);
    setCarouselSlides(['', '', '']);
    setFirstComment('');
    setOverrideConflict(false);
    setPlatformCaptions({});
    setActiveCaptionTab('Main');
    setActivePreviewPlatform('Main');
    setCampaign('');
    setContentPillar('');
    setTestingFrameworkId('');
    setEntryFormErrors([]);
    onPreviewAssetType?.(null);
  };

  const validateEntry = () => {
    const errors = [];
    if (!date) errors.push('Date is required.');
    const resolvedPlatforms = allPlatforms ? [...ALL_PLATFORMS] : platforms;
    if (!resolvedPlatforms.length) errors.push('At least one platform is required.');
    if (!assetType) errors.push('Asset type is required.');
    if (assetType === 'Video' && !script.trim()) errors.push('Video script is required.');
    if (assetType === 'Design' && !designCopy.trim()) errors.push('Design copy is required.');
    if (
      assetType === 'Carousel' &&
      !carouselSlides.some((slide) => typeof slide === 'string' && slide.trim())
    )
      errors.push('At least one carousel slide needs copy.');
    return errors;
  };

  const derivedAuthor = currentAuthorName || currentUserEmail || '';

  const submitEntry = () => {
    const cleanedCaptions = {};
    platforms.forEach((platform) => {
      const value = platformCaptions[platform];
      if (value && value.trim()) cleanedCaptions[platform] = value;
    });
    const selectedFramework = testingFrameworks.find((item) => item.id === testingFrameworkId);
    onSubmit({
      date,
      approvers,
      author: derivedAuthor || undefined,
      platforms: ensureArray(allPlatforms ? [...ALL_PLATFORMS] : platforms),
      caption,
      url: url || undefined,
      approvalDeadline: approvalDeadline || undefined,
      previewUrl: previewUrl || undefined,
      assetType,
      script: assetType === 'Video' ? script : undefined,
      designCopy: assetType === 'Design' ? designCopy : undefined,
      carouselSlides: assetType === 'Carousel' ? carouselSlides : undefined,
      firstComment,
      platformCaptions: cleanedCaptions,
      campaign: campaign || undefined,
      contentPillar: contentPillar || undefined,
      testingFrameworkId: testingFrameworkId || undefined,
      testingFrameworkName: selectedFramework ? selectedFramework.name : undefined,
      workflowStatus: determineWorkflowStatus({ approvers, assetType, previewUrl }),
    });
    reset();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const errors = validateEntry();
    if (errors.length) {
      setEntryFormErrors(errors);
      return;
    }
    if (hasConflict && !overrideConflict) {
      return;
    }
    setEntryFormErrors([]);
    submitEntry();
  };

  const handleSubmitAnyway = () => {
    const errors = validateEntry();
    if (errors.length) {
      setEntryFormErrors(errors);
      return;
    }
    setOverrideConflict(true);
    setEntryFormErrors([]);
    submitEntry();
  };

  const captionTabs = useMemo(() => ['Main', ...platforms], [platforms]);
  const currentCaptionValue =
    activeCaptionTab === 'Main' ? caption : (platformCaptions[activeCaptionTab] ?? caption);
  const previewPlatforms = platforms.length ? platforms : ['Main'];
  const effectivePreviewPlatform = previewPlatforms.includes(activePreviewPlatform)
    ? activePreviewPlatform
    : previewPlatforms[0] || 'Main';
  const previewCaption = getPlatformCaption(caption, platformCaptions, effectivePreviewPlatform);
  const previewIsImage = isImageMedia(previewUrl);
  const previewIsVideo = previewUrl && /\.(mp4|webm|ogg)$/i.test(previewUrl);

  const handleCaptionChange = (value) => {
    if (activeCaptionTab === 'Main') {
      setCaption(value);
    } else {
      setPlatformCaptions((prev) => ({
        ...prev,
        [activeCaptionTab]: value,
      }));
    }
  };

  const handlePlatformToggle = (platform, checked) => {
    setPlatforms((prev) => {
      const next = checked
        ? prev.includes(platform)
          ? prev
          : [...prev, platform]
        : prev.filter((p) => p !== platform);
      setPlatformCaptions((prevCaptions) => {
        const updated = { ...prevCaptions };
        Object.keys(updated).forEach((key) => {
          if (!next.includes(key)) delete updated[key];
        });
        return updated;
      });
      setActiveCaptionTab((prevTab) =>
        prevTab === 'Main' || next.includes(prevTab) ? prevTab : 'Main',
      );
      setActivePreviewPlatform((prev) =>
        prev === 'Main' || next.includes(prev) ? prev : next[0] || 'Main',
      );
      return next;
    });
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl text-ocean-900">Create Content</CardTitle>
      </CardHeader>
      <CardContent>
        {entryFormErrors.length ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <div className="text-xs font-semibold uppercase tracking-wide text-rose-600">
              Please fix before saving
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {entryFormErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="entry-date">Date</Label>
                <Input
                  id="entry-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="approvalDeadline">Approval deadline</Label>
                <Input
                  id="approvalDeadline"
                  type="datetime-local"
                  value={approvalDeadline}
                  onChange={(event) => setApprovalDeadline(event.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-graystone-500">
                  Let approvers know when you need a decision by (optional).
                </p>
              </div>

              <div className="space-y-2">
                <Label>Testing framework</Label>
                <select
                  value={testingFrameworkId}
                  onChange={(event) => setTestingFrameworkId(event.target.value)}
                  className={cx(selectBaseClasses, 'w-full')}
                >
                  <option value="">No testing framework</option>
                  {testingFrameworks.map((framework) => (
                    <option key={framework.id} value={framework.id}>
                      {framework.name}
                    </option>
                  ))}
                </select>
                {testingFrameworks.length === 0 ? (
                  <p className="text-xs text-graystone-500">
                    Create frameworks in the Testing Lab to link experiments.
                  </p>
                ) : (
                  <p className="text-xs text-graystone-500">
                    Attach this brief to a testing plan for reporting.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Campaign</Label>
                <select
                  value={campaign}
                  onChange={(event) => setCampaign(event.target.value)}
                  className={cx(selectBaseClasses, 'w-full')}
                >
                  <option value="">No campaign</option>
                  {CAMPAIGNS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Content pillar</Label>
                <select
                  value={contentPillar}
                  onChange={(event) => setContentPillar(event.target.value)}
                  className={cx(selectBaseClasses, 'w-full')}
                >
                  <option value="">Not tagged</option>
                  {CONTENT_PILLARS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Approvers</Label>
                <ApproverMulti
                  value={approvers}
                  onChange={setApprovers}
                  options={approverOptions}
                />
              </div>

              <div className="space-y-2">
                <Label>Platforms</Label>
                <div className="flex items-center gap-3">
                  <Toggle
                    id="all-platforms"
                    checked={allPlatforms}
                    onChange={setAllPlatforms}
                    ariaLabel="Select all platforms"
                  />
                  <span className="text-sm text-graystone-600">Select all platforms</span>
                </div>
                {!allPlatforms && (
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-2">
                    {ALL_PLATFORMS.map((platform) => (
                      <label
                        key={platform}
                        className="flex items-center gap-2 rounded-xl border border-graystone-200 bg-white px-3 py-2 text-sm text-graystone-700 shadow-sm hover:border-graystone-300"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-graystone-300"
                          checked={platforms.includes(platform)}
                          onChange={(event) => handlePlatformToggle(platform, event.target.checked)}
                        />
                        <PlatformIcon platform={platform} />
                        <span>{platform}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {hasConflict && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                  <div className="font-semibold">
                    Heads up: {conflicts.length} post{conflicts.length === 1 ? '' : 's'} already
                    scheduled on this date.
                  </div>
                  <p className="mt-1 text-xs text-amber-700">
                    You can continue, but consider spacing things out.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={handleSubmitAnyway}>
                      Submit anyway
                    </Button>
                    <div className="flex items-center gap-2 text-xs text-amber-700">
                      <span>Try a different date:</span>
                      <Input
                        type="date"
                        value={date}
                        onChange={(event) => {
                          setOverrideConflict(false);
                          setDate(event.target.value);
                        }}
                        className="px-3 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label>Captions</Label>
                <div className="flex flex-wrap gap-2">
                  {captionTabs.map((tab) => (
                    <Button
                      key={tab}
                      type="button"
                      size="sm"
                      variant={activeCaptionTab === tab ? 'solid' : 'outline'}
                      onClick={() => setActiveCaptionTab(tab)}
                    >
                      {tab === 'Main' ? 'Main caption' : tab}
                    </Button>
                  ))}
                </div>
                <Textarea
                  value={currentCaptionValue}
                  onChange={(event) => handleCaptionChange(event.target.value)}
                  rows={4}
                  placeholder="Primary post caption"
                />
                <p className="text-xs text-graystone-500">
                  {activeCaptionTab === 'Main'
                    ? 'Changes here apply to every platform unless you customise a specific tab.'
                    : `${activeCaptionTab} caption overrides the main copy for that platform.`}
                </p>
                <CopyCheckSection
                  caption={caption}
                  platformCaptions={platformCaptions}
                  platforms={platforms}
                  assetType={assetType}
                  guidelines={guidelines}
                  currentUser={currentUser}
                  onApply={(platform, text, activeGuidelines) => {
                    if (platform === 'Main') {
                      setCaption(text);
                    } else {
                      setPlatformCaptions((prev) => ({ ...prev, [platform]: text }));
                    }
                    appendAudit({
                      user: currentUser,
                      action: 'copy-check-apply',
                      meta: { scope: 'form', platform, assetType },
                    });
                    if (window.api && window.api.enabled && activeGuidelines?.teamsWebhookUrl) {
                      window.api
                        .notify({
                          teamsWebhookUrl: activeGuidelines.teamsWebhookUrl,
                          message: `Copy check applied (${platform}) by ${currentUser}`,
                        })
                        .catch((error) => console.warn('Copy check notification failed', error));
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL (optional)</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://example.org/article"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="previewUrl">Preview asset</Label>
                <Input
                  id="previewUrl"
                  type="url"
                  value={previewUrl}
                  onChange={(event) => setPreviewUrl(event.target.value)}
                  placeholder="https://cdn.example.com/assets/post.png"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files && event.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          setPreviewUrl(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    className={cx(fileInputClasses, 'text-xs')}
                  />
                  {previewUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewUrl('')}
                    >
                      Clear preview
                    </Button>
                  )}
                </div>
                <p className="text-xs text-graystone-500">
                  Supports inline image previews in the modal.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Asset type</Label>
                <select
                  value={assetType}
                  onChange={(event) => setAssetType(event.target.value)}
                  className={cx(selectBaseClasses, 'w-full')}
                >
                  <option value="No asset">No asset</option>
                  <option value="Video">Video</option>
                  <option value="Design">Design</option>
                  <option value="Carousel">Carousel</option>
                </select>
              </div>

              {assetType === 'Video' && (
                <div className="space-y-2">
                  <Label htmlFor="script">Script</Label>
                  <Textarea
                    id="script"
                    value={script}
                    onChange={(event) => setScript(event.target.value)}
                    rows={4}
                  />
                </div>
              )}

              {assetType === 'Design' && (
                <div className="space-y-2">
                  <Label htmlFor="designCopy">Design copy</Label>
                  <Textarea
                    id="designCopy"
                    value={designCopy}
                    onChange={(event) => setDesignCopy(event.target.value)}
                    rows={4}
                  />
                </div>
              )}

              {assetType === 'Carousel' && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Number of slides</Label>
                    <select
                      value={String(slidesCount)}
                      onChange={(event) => setSlidesCount(Number(event.target.value))}
                      className={cx(selectBaseClasses, 'w-full')}
                    >
                      {Array.from({ length: 10 }, (_, index) => (
                        <option key={index + 1} value={index + 1}>
                          {index + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3">
                    {carouselSlides.map((val, idx) => (
                      <div key={idx} className="space-y-2">
                        <Label>Slide {idx + 1} copy</Label>
                        <Textarea
                          value={val}
                          onChange={(event) =>
                            setCarouselSlides((prev) =>
                              prev.map((slide, slideIndex) =>
                                slideIndex === idx ? event.target.value : slide,
                              ),
                            )
                          }
                          placeholder={`Copy for slide ${idx + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="firstComment">First comment</Label>
                <Textarea
                  id="firstComment"
                  value={firstComment}
                  onChange={(event) => setFirstComment(event.target.value)}
                  placeholder="Hashtags, context, extra links"
                  rows={3}
                />
              </div>
            </div>

            {platforms.length > 0 && (
              <aside className="space-y-4 rounded-2xl border border-aqua-200 bg-aqua-50 p-4 text-sm text-graystone-700">
                <div>
                  <h3 className="text-base font-semibold text-ocean-700">Platform tips</h3>
                  <p className="text-xs text-graystone-600">
                    Use these prompts to tailor captions per channel.
                  </p>
                </div>
                {platforms.map((platform) => {
                  const tips = PLATFORM_TIPS[platform];
                  if (!tips) return null;
                  return (
                    <div key={platform} className="space-y-1">
                      <div className="text-sm font-semibold text-ocean-700">{platform}</div>
                      <ul className="ml-4 list-disc space-y-1 text-xs text-graystone-600">
                        {tips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </aside>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" className="gap-2" disabled={hasConflict && !overrideConflict}>
              <PlusIcon className="h-4 w-4" />
              Submit to plan
            </Button>
            <Button type="button" variant="outline" onClick={reset}>
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ApprovalsModal({ open, onClose, approvals = [], onOpenEntry, onApprove }) {
  const hasItems = approvals.length > 0;
  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex h-full max-h-[80vh] flex-col bg-white">
        <div className="flex items-center justify-between border-b border-graystone-200 px-6 py-4">
          <div className="heading-font flex items-center gap-2 text-xl font-semibold text-black">
            <span className="inline-block h-3 w-3 rounded-full bg-[#00F5FF]" aria-hidden="true" />
            Your Approvals
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="heading-font text-sm normal-case"
          >
            Close
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {hasItems ? (
            <div className="space-y-4">
              {approvals.map((entry) => {
                const checklist = ensureChecklist(entry.checklist);
                const completed = Object.values(checklist).filter(Boolean).length;
                const total = CHECKLIST_ITEMS.length;
                const hasPreview = isImageMedia(entry.previewUrl);
                return (
                  <div
                    key={entry.id}
                    className="rounded-3xl border border-graystone-200 bg-white p-5 shadow-sm transition hover:border-aqua-300"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{entry.assetType}</Badge>
                          <span className="heading-font text-sm font-semibold text-graystone-800">
                            {new Date(entry.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              weekday: 'short',
                            })}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-aqua-100 px-2 py-1 text-xs font-medium text-ocean-700">
                            {entry.statusDetail || WORKFLOW_STAGES[0]}
                          </span>
                        </div>
                        {hasPreview ? (
                          <div className="overflow-hidden rounded-2xl border border-graystone-200">
                            <img
                              src={entry.previewUrl}
                              alt="Entry preview"
                              className="h-40 w-full object-cover"
                            />
                          </div>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-graystone-500">
                          <span>Requested by {entry.author || 'Unknown'}</span>
                          {entry.approvers?.length ? (
                            <span>Approvers: {entry.approvers.join(', ')}</span>
                          ) : null}
                        </div>
                        {entry.caption ? (
                          <p className="line-clamp-4 text-sm text-graystone-700">{entry.caption}</p>
                        ) : null}
                        {(entry.campaign || entry.contentPillar || entry.testingFrameworkName) && (
                          <div className="flex flex-wrap items-center gap-1 text-[11px] text-graystone-500">
                            {entry.campaign ? (
                              <span className="rounded-full bg-aqua-100 px-2 py-0.5 text-ocean-700">
                                {entry.campaign}
                              </span>
                            ) : null}
                            {entry.contentPillar ? (
                              <span className="rounded-full bg-graystone-100 px-2 py-0.5 text-graystone-700">
                                {entry.contentPillar}
                              </span>
                            ) : null}
                            {entry.testingFrameworkName ? (
                              <span className="rounded-full bg-ocean-500/10 px-2 py-0.5 text-ocean-700">
                                Test: {entry.testingFrameworkName}
                              </span>
                            ) : null}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs text-graystone-500">
                          {Object.entries(checklist).map(([key, value]) => {
                            const definition = CHECKLIST_ITEMS.find((item) => item.key === key);
                            if (!definition) return null;
                            return (
                              <span
                                key={key}
                                className={cx(
                                  'inline-flex items-center gap-1 rounded-full px-2 py-1',
                                  value
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-graystone-100 text-graystone-500',
                                )}
                              >
                                {value ? (
                                  <CheckCircleIcon className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <LoaderIcon className="h-3 w-3 text-graystone-400 animate-none" />
                                )}
                                {definition.label}
                              </span>
                            );
                          })}
                          <span className="rounded-full bg-graystone-100 px-2 py-1 text-xs text-graystone-600">
                            Checklist {completed}/{total}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <Button
                          size="sm"
                          onClick={() => onOpenEntry?.(entry.id)}
                          className="heading-font text-xs normal-case"
                        >
                          Review
                        </Button>
                        {entry.status !== 'Approved' ? (
                          <Button
                            variant="solid"
                            size="sm"
                            onClick={() => onApprove?.(entry.id)}
                            className="heading-font text-xs normal-case"
                          >
                            Approve
                          </Button>
                        ) : (
                          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Approved
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl border border-dashed border-graystone-200 bg-white/80 px-6 py-16 text-center">
              <p className="heading-font text-lg font-semibold text-ocean-700">
                You&apos;re all caught up
              </p>
              <p className="mt-2 max-w-sm text-sm text-graystone-500">
                Anything assigned to you will pop up here for a quick review. Check back once
                teammates submit something new.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function EntryPreviewModal({
  open,
  entry,
  onClose,
  onEdit,
  currentUser = '',
  currentUserEmail = '',
  reviewMode = false,
  canApprove = false,
  onApprove,
  onUpdate,
  onNotifyMentions,
  onCommentAdded,
  approverOptions = [],
  users = [],
}) {
  const sanitized = useMemo(() => (entry ? sanitizeEntry(entry) : null), [entry]);
  const [commentDraft, setCommentDraft] = useState('');
  const [mentionState, setMentionState] = useState(null);
  useEffect(() => {
    if (!open) {
      setCommentDraft('');
      setMentionState(null);
    }
  }, [open, entry?.id]);
  if (!open || !sanitized) return null;
  const plannedPlatforms = sanitized.platforms.length ? sanitized.platforms : ['Main'];
  const defaultPreviewPlatformCandidate =
    plannedPlatforms.find((name) => name && name !== 'Main') || null;
  const defaultPreviewPlatform =
    defaultPreviewPlatformCandidate ||
    (plannedPlatforms[0] && plannedPlatforms[0] !== 'Main' ? plannedPlatforms[0] : 'LinkedIn');
  const previewUrl = sanitized.previewUrl ? sanitized.previewUrl.trim() : '';
  const previewIsImage = isImageMedia(previewUrl);
  const previewIsVideo = previewUrl && /\.(mp4|webm|ogg)$/i.test(previewUrl);
  const friendlyDate = sanitized.date
    ? new Date(sanitized.date).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : 'Not scheduled';
  const normalizedCurrent = (currentUser || currentUserEmail || '').trim().toLowerCase();
  const normalizedAuthor = (sanitized.author || '').trim().toLowerCase();
  const canEdit = normalizedAuthor && normalizedCurrent && normalizedAuthor === normalizedCurrent;
  const mentionDirectory = useMemo(() => {
    if (!sanitized) return [];
    const normalizedUserNames = Array.isArray(users)
      ? users
          .map((user) => {
            if (!user) return '';
            if (typeof user === 'string') return user;
            if (user.name && String(user.name).trim().length) return String(user.name).trim();
            if (user.email && String(user.email).trim().length) return String(user.email).trim();
            return '';
          })
          .filter(Boolean)
      : [];
    return Array.from(
      new Set([
        ...approverOptions,
        ...normalizedUserNames,
        ...(sanitized.approvers || []),
        sanitized.author || '',
      ]),
    ).filter(Boolean);
  }, [approverOptions, users, sanitized]);
  const handleCommentChange = (event) => {
    const { value, selectionStart } = event.target;
    setCommentDraft(value);
    const nextState = computeMentionState(value, selectionStart, mentionDirectory);
    setMentionState(nextState);
  };
  const handleMentionSelect = (name) => {
    if (!mentionState || mentionState.start == null || mentionState.end == null) return;
    const before = commentDraft.slice(0, mentionState.start);
    const after = commentDraft.slice(mentionState.end);
    const needsSpace = after && !after.startsWith(' ') ? ' ' : '';
    const nextValue = `${before}@${name}${needsSpace}${after}`;
    setCommentDraft(nextValue);
    setMentionState(null);
  };
  const handleCommentSubmit = (event) => {
    event.preventDefault();
    if (!sanitized || !onUpdate) return;
    const body = commentDraft.trim();
    if (!body) return;
    const rawMentions = extractMentions(body);
    let finalBody = body;
    const resolvedHandles = new Set();
    const mentionNames = new Set();
    rawMentions.forEach((raw) => {
      const candidate = raw.replace(/^@/, '').trim();
      const match = resolveMentionCandidate(candidate, mentionDirectory);
      if (match) {
        const canonical = `@${match}`;
        resolvedHandles.add(canonical);
        mentionNames.add(match);
        finalBody = finalBody.replace(raw, canonical);
      }
    });
    const comment = {
      id: uuid(),
      author: currentUser || 'Unknown',
      body: finalBody,
      createdAt: new Date().toISOString(),
      mentions: Array.from(resolvedHandles),
    };
    const next = sanitizeEntry({
      ...sanitized,
      comments: [...ensureComments(sanitized.comments), comment],
    });
    onUpdate(next);
    setCommentDraft('');
    setMentionState(null);
    if (mentionNames.size && onNotifyMentions) {
      onNotifyMentions({ entry: next, comment, mentionNames: Array.from(mentionNames) });
    }
    if (onCommentAdded) {
      onCommentAdded({ entry: next, comment });
    }
  };
  const mentionSuggestions = mentionState?.suggestions || [];
  const reviewEnabled = Boolean(reviewMode);
  const allowApproveAction = reviewEnabled && canApprove;
  const allowCommenting = reviewEnabled && canApprove && Boolean(onUpdate);
  const platformIcons = Array.from(
    new Set(
      plannedPlatforms
        .map((platform) => (platform === 'Main' ? defaultPreviewPlatform : platform))
        .filter(Boolean),
    ),
  );
  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex h-full max-h-[80vh] flex-col bg-white">
        <div className="flex items-center justify-between border-b border-graystone-200 px-6 py-4">
          <div className="heading-font text-lg font-semibold text-ocean-900">
            Scheduled post by {sanitized.author || 'Unknown'} for {friendlyDate}
          </div>
          <Badge variant={sanitized.status === 'Approved' ? 'solid' : 'outline'}>
            {sanitized.status}
          </Badge>
        </div>
        <div className="border-b border-graystone-100 px-6 py-3">
          <div className="text-xs uppercase tracking-wide text-graystone-500">Platforms</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {platformIcons.map((platform) => (
              <span
                key={`${sanitized.id}-${platform}`}
                className="inline-flex items-center gap-2 rounded-full border border-graystone-200 bg-graystone-50 px-3 py-1 text-sm font-semibold text-graystone-700"
              >
                <PlatformIcon platform={platform} />
                {platform}
              </span>
            ))}
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            {plannedPlatforms.map((platform) => {
              const previewPlatformName = platform === 'Main' ? defaultPreviewPlatform : platform;
              const captionForPlatform = getPlatformCaption(
                sanitized.caption,
                sanitized.platformCaptions,
                platform,
              );
              return (
                <div
                  key={platform}
                  className="rounded-3xl border border-graystone-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-ocean-700">
                    <PlatformIcon platform={previewPlatformName} />
                    {platform === 'Main' ? previewPlatformName : platform}
                  </div>
                  <SocialPreview
                    platform={previewPlatformName}
                    caption={captionForPlatform}
                    mediaUrl={previewUrl}
                    isImage={previewIsImage}
                    isVideo={previewIsVideo}
                  />
                </div>
              );
            })}
          </div>
          {allowCommenting ? (
            <div className="space-y-2 rounded-3xl border border-aqua-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-ocean-800">Leave a comment</div>
              <form onSubmit={handleCommentSubmit} className="space-y-2">
                <Textarea
                  value={commentDraft}
                  onChange={handleCommentChange}
                  rows={3}
                  placeholder="Share feedback or @mention an approver"
                />
                <div className="relative">
                  <MentionSuggestionList
                    suggestions={mentionSuggestions}
                    onSelect={handleMentionSelect}
                  />
                </div>
                <div className="flex items-center justify-end">
                  <Button type="submit" disabled={!commentDraft.trim()}>
                    Add comment
                  </Button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-graystone-200 bg-graystone-50 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {allowApproveAction ? (
              <Button variant="outline" onClick={() => onApprove?.(sanitized.id)}>
                {sanitized.status === 'Approved' ? 'Mark as pending' : 'Mark as approved'}
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            {canEdit ? <Button onClick={() => onEdit?.(sanitized.id)}>Edit entry</Button> : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function EntryModal({
  entry,
  currentUser,
  currentUserEmail,
  onClose,
  onApprove,
  onDelete,
  onClone,
  onSave,
  onUpdate,
  onNotifyMentions,
  onCommentAdded,
  testingFrameworks = [],
  approverOptions = DEFAULT_APPROVERS,
  users = DEFAULT_USER_RECORDS,
}) {
  const sanitizedEntry = useMemo(() => sanitizeEntry(entry), [entry]);
  const [draft, setDraft] = useState(sanitizedEntry);
  const [allPlatforms, setAllPlatforms] = useState(
    sanitizedEntry ? sanitizedEntry.platforms.length === ALL_PLATFORMS.length : false,
  );
  const [commentDraft, setCommentDraft] = useState('');
  const [mentionState, setMentionState] = useState(null);
  const [activeCaptionTab, setActiveCaptionTab] = useState('Main');
  const [activePreviewPlatform, setActivePreviewPlatform] = useState('Main');
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineEntries, setTimelineEntries] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState('');
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [savedDraftInfo, setSavedDraftInfo] = useState(null);
  const { get: apiGet } = useApi();
  const frameworkOptions = Array.isArray(testingFrameworks) ? testingFrameworks : [];
  const frameworkMap = useMemo(() => {
    const map = new Map();
    frameworkOptions.forEach((item) => {
      if (item && item.id) {
        map.set(item.id, item);
      }
    });
    return map;
  }, [frameworkOptions]);

  useEffect(() => {
    if (!sanitizedEntry) {
      setDraft(null);
      setAllPlatforms(false);
      setCommentDraft('');
      return;
    }
    setDraft(sanitizedEntry);
    setAllPlatforms(sanitizedEntry.platforms.length === ALL_PLATFORMS.length);
    setCommentDraft('');
    setMentionState(null);
  }, [sanitizedEntry]);

  const draftPlatforms = Array.isArray(draft?.platforms) ? draft.platforms : [];
  const draftPlatformsKey = draftPlatforms.join('|');
  const sanitizedSignature = entrySignature(sanitizedEntry);
  const modalReady = Boolean(sanitizedEntry && draft);
  const normalizedViewer = useMemo(() => {
    if (currentUser && currentUser.trim()) return currentUser.trim().toLowerCase();
    if (currentUserEmail && currentUserEmail.trim()) return currentUserEmail.trim().toLowerCase();
    return '';
  }, [currentUser, currentUserEmail]);
  const isApproverView = useMemo(() => {
    if (!normalizedViewer) return false;
    const approvers = ensurePeopleArray(sanitizedEntry?.approvers);
    return approvers.some((name) => (name || '').trim().toLowerCase() === normalizedViewer);
  }, [sanitizedEntry, normalizedViewer]);
  const isAuthorView = useMemo(() => {
    if (!normalizedViewer) return false;
    const normalizedAuthor = (sanitizedEntry?.author || '').trim().toLowerCase();
    if (!normalizedAuthor) return false;
    return normalizedAuthor === normalizedViewer;
  }, [sanitizedEntry, normalizedViewer]);
  const showApproverContent = !isAuthorView || isApproverView;

  useEffect(() => {
    if (!sanitizedEntry) return;
    setActiveCaptionTab('Main');
    setActivePreviewPlatform(sanitizedEntry.platforms[0] || 'Main');
  }, [sanitizedSignature]);

  useEffect(() => {
    if (!sanitizedEntry) return;
    setActiveCaptionTab((prevTab) =>
      prevTab === 'Main' || draftPlatforms.includes(prevTab) ? prevTab : 'Main',
    );
    setActivePreviewPlatform((prevPlatform) =>
      draftPlatforms.includes(prevPlatform) ? prevPlatform : draftPlatforms[0] || 'Main',
    );
    setAllPlatforms(draftPlatforms.length === ALL_PLATFORMS.length);
  }, [sanitizedSignature, draftPlatformsKey]);

  useEffect(() => {
    if (!modalReady && timelineOpen) {
      setTimelineOpen(false);
    }
  }, [modalReady, timelineOpen]);

  // Check for saved draft on modal open
  useEffect(() => {
    if (!sanitizedEntry?.id || !storageAvailable) return;
    try {
      const stored = window.localStorage.getItem(DRAFT_ENTRY_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      // Only prompt if draft is for this entry and has meaningful changes
      if (parsed?.entryId === sanitizedEntry.id && parsed?.draft && parsed?.savedAt) {
        setSavedDraftInfo(parsed);
        setShowDraftRecovery(true);
      }
    } catch {
      // Ignore parse errors
    }
  }, [sanitizedEntry?.id]);

  // Ref to hold latest draft for stable auto-save interval
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  // Auto-save draft to localStorage every 30 seconds (stable interval)
  useEffect(() => {
    if (!sanitizedEntry?.id || !storageAvailable) return;
    const interval = setInterval(() => {
      const currentDraft = draftRef.current;
      if (!currentDraft?.id) return;
      try {
        const draftData = {
          entryId: currentDraft.id,
          draft: currentDraft,
          savedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(DRAFT_ENTRY_STORAGE_KEY, JSON.stringify(draftData));
      } catch {
        // Ignore storage errors
      }
    }, DRAFT_AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [sanitizedEntry?.id]); // Only restart interval when entry changes

  // Helper to clear saved draft
  const clearSavedDraft = useCallback(() => {
    if (!storageAvailable) return;
    try {
      window.localStorage.removeItem(DRAFT_ENTRY_STORAGE_KEY);
    } catch {
      // Ignore errors
    }
    setShowDraftRecovery(false);
    setSavedDraftInfo(null);
  }, []);

  // Restore draft from localStorage
  const restoreSavedDraft = useCallback(() => {
    if (savedDraftInfo?.draft) {
      setDraft(savedDraftInfo.draft);
    }
    setShowDraftRecovery(false);
  }, [savedDraftInfo]);

  if (!modalReady) return null;

  const update = (key, value) => {
    setDraft((prev) => {
      if (!prev) return prev;
      if (key === 'platforms') {
        const nextPlatforms = ensureArray(value);
        const allow = new Set(nextPlatforms);
        const nextCaptions = ensurePlatformCaptions(prev.platformCaptions);
        Object.keys(nextCaptions).forEach((platform) => {
          if (!allow.has(platform)) delete nextCaptions[platform];
        });
        const nextAnalytics = ensureAnalytics(prev.analytics);
        Object.keys(nextAnalytics).forEach((platform) => {
          if (!allow.has(platform)) delete nextAnalytics[platform];
        });
        return normalizeEntry({
          ...prev,
          platforms: nextPlatforms,
          platformCaptions: nextCaptions,
          analytics: nextAnalytics,
        });
      }
      return normalizeEntry({ ...prev, [key]: value });
    });
  };

  const normalizeEntry = (raw) => {
    const normalized = {
      ...raw,
      checklist: ensureChecklist(raw.checklist),
      comments: ensureComments(raw.comments),
      previewUrl: raw.previewUrl || '',
      platformCaptions: ensurePlatformCaptions(raw.platformCaptions),
      platforms: ensureArray(Array.isArray(raw.platforms) ? raw.platforms : []),
      analytics: ensureAnalytics(raw.analytics),
      analyticsUpdatedAt:
        typeof raw.analyticsUpdatedAt === 'string'
          ? raw.analyticsUpdatedAt
          : draft && typeof draft.analyticsUpdatedAt === 'string'
            ? draft.analyticsUpdatedAt
            : '',
      workflowStatus: KANBAN_STATUSES.includes(raw.workflowStatus)
        ? raw.workflowStatus
        : KANBAN_STATUSES.includes(draft.workflowStatus)
          ? draft.workflowStatus
          : KANBAN_STATUSES[0],
    };
    const frameworkId = normalized.testingFrameworkId ? String(normalized.testingFrameworkId) : '';
    const framework = frameworkId ? frameworkMap.get(frameworkId) : null;
    const next = {
      ...normalized,
      testingFrameworkId: frameworkId || undefined,
      testingFrameworkName: framework
        ? framework.name
        : normalized.testingFrameworkName || undefined,
    };
    return {
      ...next,
      statusDetail: computeStatusDetail(next),
    };
  };

  const handleSave = () => {
    let next = normalizeEntry(draft);
    const computedStatus = determineWorkflowStatus({
      approvers: next.approvers,
      assetType: next.assetType,
      previewUrl: next.previewUrl,
    });
    next = { ...next, workflowStatus: computedStatus };
    if (next.status === 'Approved') {
      next = normalizeEntry({ ...next, status: 'Pending', approvedAt: undefined });
    }
    clearSavedDraft();
    onSave(next);
    onClose();
  };

  const handleDelete = () => {
    const confirmDelete = window.confirm(
      'Move this item to the trash? You can restore it within 30 days.',
    );
    if (confirmDelete) {
      onDelete(draft.id);
      onClose();
    }
  };

  const handleClone = () => {
    if (!onClone || !draft) return;
    onClone(draft);
    onClose();
  };

  const handleAssetTypeChange = (nextType) => {
    setDraft((prev) => {
      const next = { ...prev, assetType: nextType };
      if (nextType !== 'Video') next.script = undefined;
      if (nextType !== 'Design') next.designCopy = undefined;
      if (nextType !== 'Carousel') {
        next.carouselSlides = undefined;
      } else {
        next.carouselSlides =
          prev.carouselSlides && prev.carouselSlides.length
            ? [...prev.carouselSlides]
            : ['', '', ''];
      }
      return normalizeEntry(next);
    });
  };

  const handleCarouselSlides = (desiredLength) => {
    setDraft((prev) => {
      const current = prev.carouselSlides || [];
      let nextSlides = [...current];
      if (desiredLength > current.length) {
        nextSlides = [...current, ...Array(desiredLength - current.length).fill('')];
      } else if (desiredLength < current.length) {
        nextSlides = current.slice(0, desiredLength);
      }
      return normalizeEntry({ ...prev, carouselSlides: nextSlides });
    });
  };

  const toggleChecklistItem = (key) => {
    setDraft((prev) => {
      const checklist = { ...ensureChecklist(prev.checklist) };
      checklist[key] = !checklist[key];
      const next = normalizeEntry({ ...prev, checklist });
      if (onUpdate) onUpdate(next);
      return next;
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : '';
      setDraft((prev) => {
        const next = normalizeEntry({ ...prev, previewUrl: url });
        if (onUpdate) onUpdate(next);
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleClearPreview = () => {
    setDraft((prev) => {
      const next = normalizeEntry({ ...prev, previewUrl: '' });
      if (onUpdate) onUpdate(next);
      return next;
    });
  };

  const handleCommentChange = (event) => {
    const { value, selectionStart } = event.target;
    setCommentDraft(value);
    const nextState = computeMentionState(value, selectionStart, mentionDirectory);
    setMentionState(nextState);
  };

  const handleMentionSelect = (name) => {
    if (!mentionState || mentionState.start == null || mentionState.end == null) return;
    const before = commentDraft.slice(0, mentionState.start);
    const after = commentDraft.slice(mentionState.end);
    const needsSpace = after && !after.startsWith(' ') ? ' ' : '';
    const nextValue = `${before}@${name}${needsSpace}${after}`;
    setCommentDraft(nextValue);
    setMentionState(null);
  };

  const handleCommentSubmit = (event) => {
    event.preventDefault();
    const body = commentDraft.trim();
    if (!body) return;

    const rawMentions = extractMentions(body);
    let finalBody = body;
    const resolvedHandles = new Set();
    const mentionNames = new Set();

    rawMentions.forEach((raw) => {
      const candidate = raw.replace(/^@/, '').trim();
      if (!candidate) return;
      const match = resolveMentionCandidate(candidate, mentionDirectory);
      if (match) {
        const canonical = `@${match}`;
        resolvedHandles.add(canonical);
        mentionNames.add(match);
        finalBody = finalBody.replace(raw, canonical);
      }
    });

    const comment = {
      id: uuid(),
      author: currentUser || 'Unknown',
      body: finalBody,
      createdAt: new Date().toISOString(),
      mentions: Array.from(resolvedHandles),
    };
    const next = normalizeEntry({
      ...draft,
      comments: [...(draft.comments || []), comment],
    });
    setDraft(next);
    setCommentDraft('');
    setMentionState(null);
    if (onUpdate) onUpdate(next);
    if (onNotifyMentions && mentionNames.size) {
      onNotifyMentions({
        entry: next,
        comment,
        mentionNames: Array.from(mentionNames),
      });
    }
    if (onCommentAdded) {
      onCommentAdded({ entry: next, comment });
    }
  };

  const loadTimeline = useCallback(
    async (entryId) => {
      if (!entryId) return;
      setTimelineLoading(true);
      setTimelineError('');
      try {
        let payload = null;
        if (window.api && typeof window.api.listAudit === 'function') {
          payload = await window.api.listAudit({ entryId, limit: 200 });
        } else {
          payload = await apiGet(`/api/audit?entryId=${encodeURIComponent(entryId)}&limit=200`);
        }
        setTimelineEntries(Array.isArray(payload) ? payload : []);
      } catch (error) {
        console.warn('Failed to load timeline', error);
        setTimelineEntries([]);
        setTimelineError('Unable to load timeline right now.');
      } finally {
        setTimelineLoading(false);
      }
    },
    [apiGet],
  );

  const handleOpenTimeline = () => {
    if (!sanitizedEntry?.id) return;
    setTimelineOpen(true);
    loadTimeline(sanitizedEntry.id);
  };

  const closeTimeline = () => setTimelineOpen(false);

  const formatTimelineAction = (action) => {
    if (!action) return 'Updated entry';
    return action.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const parseTimelineMeta = (meta) => {
    if (!meta) return {};
    if (typeof meta === 'object') return meta;
    try {
      const parsed = JSON.parse(meta);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const highlightMentions = (text) => {
    if (!text) return [text];
    return text.split(/(@[\w\s.&'-]+)/g).map((part, index) => {
      if (!part) return null;
      if (part.startsWith('@')) {
        return (
          <span key={index} className="font-semibold text-ocean-600">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const previewUrl = draft.previewUrl ? draft.previewUrl.trim() : '';
  const previewIsImage = isImageMedia(previewUrl);
  const previewIsVideo = previewUrl && /\.(mp4|webm|ogg)$/i.test(previewUrl);
  const previewPlatforms = draftPlatforms.length ? draftPlatforms : ['Main'];
  const effectivePreviewPlatform = previewPlatforms.includes(activePreviewPlatform)
    ? activePreviewPlatform
    : previewPlatforms[0] || 'Main';
  const previewCaption = getPlatformCaption(
    draft.caption,
    draft.platformCaptions,
    effectivePreviewPlatform,
  );
  const currentFramework = draft?.testingFrameworkId
    ? frameworkMap.get(draft.testingFrameworkId)
    : null;
  const analyticsByPlatform = ensureAnalytics(draft.analytics);
  const analyticsPlatforms = Object.keys(analyticsByPlatform);
  const formatMetricValue = (value) => {
    if (typeof value === 'number') return value.toLocaleString();
    if (value === null || value === undefined) return '—';
    return String(value);
  };

  const checklistCompleted = Object.values(ensureChecklist(draft.checklist)).filter(Boolean).length;
  const checklistTotal = CHECKLIST_ITEMS.length;
  const formatFriendlyDate = (value) => {
    if (!value) return 'Not set';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  const plannedPlatforms = draftPlatforms.length ? draftPlatforms : ['Main'];
  const defaultPreviewPlatformCandidate =
    plannedPlatforms.find((name) => name && name !== 'Main') || null;
  const defaultPreviewPlatform =
    defaultPreviewPlatformCandidate ||
    (plannedPlatforms[0] && plannedPlatforms[0] !== 'Main' ? plannedPlatforms[0] : 'LinkedIn');
  const renderAssetNotes = () => {
    const notes = [];
    if (draft.assetType === 'Video' && typeof draft.script === 'string' && draft.script.trim()) {
      notes.push(
        <div
          key="script"
          className="space-y-2 rounded-2xl border border-graystone-200 bg-white p-4 shadow-sm"
        >
          <div className="text-sm font-semibold text-ocean-800">Script</div>
          <p className="whitespace-pre-wrap text-sm text-graystone-700">{draft.script.trim()}</p>
        </div>,
      );
    }
    if (
      draft.assetType === 'Design' &&
      typeof draft.designCopy === 'string' &&
      draft.designCopy.trim()
    ) {
      notes.push(
        <div
          key="design"
          className="space-y-2 rounded-2xl border border-graystone-200 bg-white p-4 shadow-sm"
        >
          <div className="text-sm font-semibold text-ocean-800">Design copy</div>
          <p className="whitespace-pre-wrap text-sm text-graystone-700">
            {draft.designCopy.trim()}
          </p>
        </div>,
      );
    }
    if (draft.assetType === 'Carousel') {
      const slides = Array.isArray(draft.carouselSlides)
        ? draft.carouselSlides.filter((slide) => slide && slide.trim())
        : [];
      if (slides.length) {
        notes.push(
          <div
            key="carousel"
            className="space-y-2 rounded-2xl border border-graystone-200 bg-white p-4 shadow-sm"
          >
            <div className="text-sm font-semibold text-ocean-800">Carousel copy</div>
            <div className="space-y-2">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-graystone-100 bg-graystone-50 px-3 py-2 text-sm text-graystone-700"
                >
                  <div className="text-[11px] uppercase tracking-wide text-graystone-500">
                    Slide {index + 1}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{slide.trim()}</p>
                </div>
              ))}
            </div>
          </div>,
        );
      }
    }
    if (!notes.length) return null;
    return (
      <div className="space-y-3">
        <div className="text-sm font-semibold text-graystone-800">Asset copy</div>
        <div className="space-y-3">{notes}</div>
      </div>
    );
  };
  const renderApproverContent = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-graystone-200 bg-graystone-50 px-4 py-4">
          <div className="text-[11px] uppercase tracking-wide text-graystone-500">Scheduled</div>
          <div className="text-lg font-semibold text-ocean-800">
            {formatFriendlyDate(draft.date)}
          </div>
        </div>
        <div className="rounded-2xl border border-graystone-200 bg-graystone-50 px-4 py-4">
          <div className="text-[11px] uppercase tracking-wide text-graystone-500">
            Approval deadline
          </div>
          <div className="text-lg font-semibold text-ocean-800">
            {draft.approvalDeadline ? formatFriendlyDate(draft.approvalDeadline) : 'Not set'}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="text-sm font-semibold text-graystone-800">Planned platforms</div>
        <div className="grid gap-4 lg:grid-cols-2">
          {plannedPlatforms.map((platform) => {
            const previewPlatformName = platform === 'Main' ? defaultPreviewPlatform : platform;
            const captionForPlatform = getPlatformCaption(
              draft.caption,
              draft.platformCaptions,
              platform,
            );
            return (
              <div
                key={platform}
                className="space-y-3 rounded-2xl border border-graystone-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between text-sm font-semibold text-ocean-700">
                  <span className="inline-flex items-center gap-2">
                    <PlatformIcon platform={previewPlatformName} />
                    {platform === 'Main' ? 'Main copy' : platform}
                  </span>
                  <span className="text-xs text-graystone-500">
                    {(captionForPlatform || '').length} chars
                  </span>
                </div>
                <SocialPreview
                  platform={previewPlatformName}
                  caption={captionForPlatform}
                  mediaUrl={previewUrl}
                  isImage={previewIsImage}
                  isVideo={previewIsVideo}
                />
                <div className="rounded-2xl bg-graystone-50 px-3 py-2 text-sm text-graystone-700 whitespace-pre-wrap">
                  {captionForPlatform && captionForPlatform.trim().length
                    ? captionForPlatform
                    : 'No caption provided.'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {renderAssetNotes()}
    </div>
  );
  const renderCommentsSection = () => (
    <div className="space-y-3">
      <div className="text-sm font-medium text-graystone-800">Comments</div>
      {draft.comments && draft.comments.length > 0 ? (
        <div className="space-y-3">
          {draft.comments
            .slice()
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((comment) => (
              <div
                key={comment.id}
                className="rounded-xl border border-aqua-200 bg-aqua-50 p-3 text-sm text-graystone-800"
              >
                <div className="flex items-center justify-between text-xs text-graystone-500">
                  <span className="font-medium text-graystone-700">{comment.author}</span>
                  <span>{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-2 leading-relaxed">{highlightMentions(comment.body)}</div>
              </div>
            ))}
        </div>
      ) : (
        <p className="text-xs text-graystone-500">No comments yet. Use @ to mention teammates.</p>
      )}
      <form onSubmit={handleCommentSubmit} className="space-y-2">
        <Textarea
          value={commentDraft}
          onChange={handleCommentChange}
          rows={3}
          placeholder="Share feedback or mention someone with @"
        />
        <div className="relative">
          <MentionSuggestionList suggestions={mentionSuggestions} onSelect={handleMentionSelect} />
        </div>
        <div className="flex items-center justify-end">
          <Button type="submit" disabled={!commentDraft.trim()}>
            Add comment
          </Button>
        </div>
      </form>
    </div>
  );

  const canApproveAction = isApproverView && draft.status !== 'Approved';
  const canEdit = isAuthorView;
  const timelineList = Array.isArray(timelineEntries) ? timelineEntries : [];
  const mentionDirectory = useMemo(() => {
    const normalizedUserNames = Array.isArray(users)
      ? users
          .map((user) => {
            if (!user) return '';
            if (typeof user === 'string') return user;
            if (user.name && String(user.name).trim().length) return String(user.name).trim();
            if (user.email && String(user.email).trim().length) return String(user.email).trim();
            return '';
          })
          .filter(Boolean)
      : [];
    return Array.from(
      new Set([
        ...approverOptions,
        ...normalizedUserNames,
        ...(draft?.approvers || []),
        draft?.author || '',
      ]),
    ).filter(Boolean);
  }, [approverOptions, users, draft]);
  const mentionSuggestions = mentionState?.suggestions || [];

  return (
    <>
      <Modal open={modalReady} onClose={onClose}>
        <div className="bg-white">
          <div className="flex items-center justify-between border-b border-aqua-200 bg-ocean-500 px-6 py-4 text-white">
            <div>
              <div className="text-lg font-semibold">
                {showApproverContent ? 'Review content' : 'Edit content'}
              </div>
              <div className="text-xs text-aqua-100">
                Created {new Date(draft.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenTimeline}
                className="heading-font text-xs normal-case"
              >
                View timeline
              </Button>
              <span
                className={cx(
                  'rounded-full px-3 py-1 text-xs font-semibold text-ocean-900',
                  draft.status === 'Approved' ? 'bg-aqua-100' : 'bg-amber-100',
                )}
              >
                {draft.status}
              </span>
            </div>
          </div>

          <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6">
            {showDraftRecovery && savedDraftInfo && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="text-sm text-amber-800">
                  <span className="font-semibold">Unsaved draft found</span>
                  <span className="mx-1">·</span>
                  <span>Last saved {new Date(savedDraftInfo.savedAt).toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearSavedDraft} className="text-xs">
                    Discard
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={restoreSavedDraft}
                    className="bg-amber-600 text-xs hover:bg-amber-700"
                  >
                    Restore draft
                  </Button>
                </div>
              </div>
            )}
            {showApproverContent ? (
              renderApproverContent()
            ) : (
              <>
                <FieldRow label="Date">
                  <Input
                    type="date"
                    value={draft.date}
                    onChange={(event) => update('date', event.target.value)}
                  />
                </FieldRow>

                <FieldRow label="Approvers">
                  <ApproverMulti
                    value={draft.approvers || []}
                    onChange={(value) => update('approvers', value)}
                    options={approverOptions}
                  />
                </FieldRow>

                <FieldRow label="Campaign">
                  <select
                    value={draft.campaign || ''}
                    onChange={(event) => update('campaign', event.target.value || '')}
                    className={cx(selectBaseClasses, 'w-full')}
                  >
                    <option value="">No campaign</option>
                    {CAMPAIGNS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FieldRow>

                <FieldRow label="Content pillar">
                  <select
                    value={draft.contentPillar || ''}
                    onChange={(event) => update('contentPillar', event.target.value || '')}
                    className={cx(selectBaseClasses, 'w-full')}
                  >
                    <option value="">Not tagged</option>
                    {CONTENT_PILLARS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FieldRow>

                <FieldRow label="Testing framework">
                  <div className="space-y-2">
                    <select
                      value={draft.testingFrameworkId || ''}
                      onChange={(event) => {
                        const id = event.target.value;
                        const framework = id ? frameworkMap.get(id) : null;
                        setDraft((prev) => {
                          if (!prev) return prev;
                          return normalizeEntry({
                            ...prev,
                            testingFrameworkId: id || undefined,
                            testingFrameworkName: framework ? framework.name : undefined,
                          });
                        });
                      }}
                      className={cx(selectBaseClasses, 'w-full')}
                    >
                      <option value="">No testing framework</option>
                      {frameworkOptions.map((framework) => (
                        <option key={framework.id} value={framework.id}>
                          {framework.name}
                        </option>
                      ))}
                    </select>
                    {currentFramework ? (
                      <p className="text-xs text-graystone-500">
                        Tracking via &ldquo;{currentFramework.name}&rdquo;
                        {currentFramework.status ? ` (${currentFramework.status})` : ''}.
                      </p>
                    ) : frameworkOptions.length === 0 ? (
                      <p className="text-xs text-graystone-500">
                        Create frameworks in the Testing Lab to link experiments.
                      </p>
                    ) : (
                      <p className="text-xs text-graystone-500">
                        Attach this item to a testing plan for reporting.
                      </p>
                    )}
                  </div>
                </FieldRow>

                <FieldRow label="Platforms">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Toggle
                        id="modal-all-platforms"
                        ariaLabel="Select all platforms"
                        checked={allPlatforms}
                        onChange={(checked) => {
                          setAllPlatforms(checked);
                          if (checked) {
                            update('platforms', [...ALL_PLATFORMS]);
                          }
                        }}
                      />
                      <span className="text-sm text-graystone-600">Select all platforms</span>
                    </div>
                    {!allPlatforms && (
                      <div className="grid grid-cols-2 gap-2">
                        {ALL_PLATFORMS.map((platform) => (
                          <label
                            key={platform}
                            className="flex items-center gap-2 rounded-xl border border-aqua-200 bg-aqua-50 px-3 py-2 text-sm text-graystone-700 hover:border-aqua-300"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-graystone-300"
                              checked={draftPlatforms.includes(platform)}
                              onChange={(event) => {
                                const checked = event.target.checked;
                                const exists = draftPlatforms.includes(platform);
                                let nextPlatforms = draftPlatforms;
                                if (checked && !exists) {
                                  nextPlatforms = [...draftPlatforms, platform];
                                }
                                if (!checked && exists) {
                                  nextPlatforms = draftPlatforms.filter(
                                    (item) => item !== platform,
                                  );
                                }
                                update('platforms', nextPlatforms);
                              }}
                            />
                            <PlatformIcon platform={platform} />
                            <span className="text-graystone-700">{platform}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </FieldRow>

                <FieldRow label="Author">
                  <div className="rounded-2xl border border-graystone-200 bg-graystone-50 px-3 py-2 text-sm text-graystone-700">
                    {draft.author || 'Unknown'}
                  </div>
                </FieldRow>

                <FieldRow label="Caption">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {['Main', ...draftPlatforms].map((tab) => (
                        <Button
                          key={tab}
                          type="button"
                          size="sm"
                          variant={activeCaptionTab === tab ? 'solid' : 'outline'}
                          onClick={() => setActiveCaptionTab(tab)}
                        >
                          {tab === 'Main' ? 'Main' : tab}
                        </Button>
                      ))}
                    </div>
                    <Textarea
                      value={
                        activeCaptionTab === 'Main'
                          ? draft.caption
                          : (draft.platformCaptions?.[activeCaptionTab] ?? draft.caption)
                      }
                      onChange={(event) => {
                        const value = event.target.value;
                        if (activeCaptionTab === 'Main') {
                          setDraft((prev) => ({ ...prev, caption: value }));
                        } else {
                          setDraft((prev) => ({
                            ...prev,
                            platformCaptions: {
                              ...ensurePlatformCaptions(prev.platformCaptions),
                              [activeCaptionTab]: value,
                            },
                          }));
                        }
                      }}
                      rows={4}
                    />
                    <p className="text-xs text-graystone-500">
                      {activeCaptionTab === 'Main'
                        ? 'Updates here flow to every platform unless a custom version is set.'
                        : `${activeCaptionTab} caption overrides the main copy for that platform.`}
                    </p>
                  </div>
                </FieldRow>

                <FieldRow label="URL">
                  <Input
                    type="url"
                    value={draft.url || ''}
                    onChange={(event) => update('url', event.target.value || undefined)}
                  />
                </FieldRow>

                <FieldRow label="Preview">
                  <div className="space-y-4">
                    <Input
                      type="url"
                      value={draft.previewUrl || ''}
                      onChange={(event) => update('previewUrl', event.target.value)}
                      placeholder="https://cdn.example.com/assets/post.png"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className={cx(fileInputClasses, 'text-xs')}
                      />
                      {draft.previewUrl && (
                        <Button variant="ghost" size="sm" onClick={handleClearPreview}>
                          Clear preview
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {previewPlatforms.length > 1 && (
                        <div className="flex flex-wrap gap-2">
                          {previewPlatforms.map((platform) => (
                            <Button
                              key={platform}
                              type="button"
                              size="sm"
                              variant={activePreviewPlatform === platform ? 'solid' : 'outline'}
                              onClick={() => setActivePreviewPlatform(platform)}
                            >
                              {platform}
                            </Button>
                          ))}
                        </div>
                      )}
                      <SocialPreview
                        platform={effectivePreviewPlatform}
                        caption={previewCaption}
                        mediaUrl={previewUrl}
                        isImage={previewIsImage}
                        isVideo={previewIsVideo}
                      />
                      <p className="text-xs text-graystone-500">
                        Preview simulates the selected platform using the current caption and asset.
                      </p>
                    </div>
                  </div>
                </FieldRow>

                {analyticsPlatforms.length > 0 && (
                  <FieldRow label="Performance">
                    <div className="space-y-3">
                      {analyticsPlatforms.map((platform) => {
                        const metrics = analyticsByPlatform[platform] || {};
                        const { lastImportedAt, ...rest } = metrics;
                        const metricEntries = Object.entries(rest);
                        return (
                          <div
                            key={platform}
                            className="rounded-2xl border border-aqua-200 bg-aqua-50 px-3 py-3"
                          >
                            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ocean-700">
                              <span className="inline-flex items-center gap-1">
                                <PlatformIcon platform={platform} />
                                {platform}
                              </span>
                              {lastImportedAt ? (
                                <span className="text-xs font-normal text-graystone-500">
                                  Updated {new Date(lastImportedAt).toLocaleString()}
                                </span>
                              ) : null}
                            </div>
                            {metricEntries.length ? (
                              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {metricEntries.map(([metricKey, metricValue]) => (
                                  <div
                                    key={`${platform}-${metricKey}`}
                                    className="rounded-xl bg-white px-3 py-2 shadow-sm"
                                  >
                                    <div className="text-[11px] uppercase tracking-wide text-graystone-500">
                                      {metricKey}
                                    </div>
                                    <div className="text-sm font-semibold text-ocean-700">
                                      {formatMetricValue(metricValue)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-xs text-graystone-500">
                                No metrics captured yet.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </FieldRow>
                )}

                <Separator />

                <FieldRow label="Asset type">
                  <select
                    value={draft.assetType}
                    onChange={(event) => handleAssetTypeChange(event.target.value)}
                    className={cx(selectBaseClasses, 'w-full')}
                  >
                    <option value="No asset">No asset</option>
                    <option value="Video">Video</option>
                    <option value="Design">Design</option>
                    <option value="Carousel">Carousel</option>
                  </select>
                </FieldRow>

                {draft.assetType === 'Video' && (
                  <FieldRow label="Script">
                    <Textarea
                      value={draft.script || ''}
                      onChange={(event) => update('script', event.target.value)}
                      rows={4}
                    />
                  </FieldRow>
                )}

                {draft.assetType === 'Design' && (
                  <FieldRow label="Design copy">
                    <Textarea
                      value={draft.designCopy || ''}
                      onChange={(event) => update('designCopy', event.target.value)}
                      rows={4}
                    />
                  </FieldRow>
                )}

                {draft.assetType === 'Carousel' && (
                  <div className="space-y-4">
                    <FieldRow label="Slides">
                      <select
                        value={String(draft.carouselSlides?.length || 0)}
                        onChange={(event) => handleCarouselSlides(Number(event.target.value))}
                        className={cx(selectBaseClasses, 'w-full')}
                      >
                        {Array.from({ length: 10 }, (_, index) => (
                          <option key={index + 1} value={index + 1}>
                            {index + 1}
                          </option>
                        ))}
                      </select>
                    </FieldRow>
                    <div className="space-y-3">
                      {(draft.carouselSlides || []).map((slideText, idx) => (
                        <FieldRow key={idx} label={`Slide ${idx + 1}`}>
                          <Textarea
                            value={slideText}
                            onChange={(event) => {
                              const value = event.target.value;
                              setDraft((prev) => {
                                const currentSlides = prev.carouselSlides || [];
                                const nextSlides = currentSlides.map((slide, slideIndex) =>
                                  slideIndex === idx ? value : slide,
                                );
                                return { ...prev, carouselSlides: nextSlides };
                              });
                            }}
                            rows={3}
                          />
                        </FieldRow>
                      ))}
                    </div>
                  </div>
                )}

                <FieldRow label="First comment">
                  <Textarea
                    value={draft.firstComment || ''}
                    onChange={(event) => update('firstComment', event.target.value)}
                    rows={3}
                  />
                </FieldRow>

                <FieldRow label={`Checklist (${checklistCompleted}/${checklistTotal})`}>
                  <div className="flex flex-wrap gap-2">
                    {CHECKLIST_ITEMS.map((item) => (
                      <label
                        key={item.key}
                        className="heading-font inline-flex items-center gap-3 rounded-full border border-black bg-white px-4 py-2 text-xs font-semibold text-black shadow-[0_0_20px_rgba(15,157,222,0.2)] transition hover:bg-black hover:text-white"
                      >
                        <input
                          type="checkbox"
                          className={checklistCheckboxClass}
                          checked={ensureChecklist(draft.checklist)[item.key]}
                          onChange={() => toggleChecklistItem(item.key)}
                        />
                        <span className="normal-case">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </FieldRow>
              </>
            )}
            <Separator />
            {renderCommentsSection()}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-aqua-200 bg-aqua-50 px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              {canApproveAction ? (
                <Button variant="outline" onClick={() => onApprove(draft.id)} className="gap-2">
                  Mark as approved
                </Button>
              ) : null}
              {onClone && (
                <Button variant="outline" onClick={handleClone} className="gap-2 text-ocean-700">
                  <CopyIcon className="h-4 w-4 text-ocean-700" />
                  Clone entry
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="gap-2 text-graystone-700"
                >
                  <TrashIcon className="h-4 w-4 text-graystone-700" />
                  Move to trash
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={onClose}>
                {showApproverContent ? 'Close' : 'Cancel'}
              </Button>
              {canEdit && <Button onClick={handleSave}>Save changes</Button>}
            </div>
          </div>
        </div>
      </Modal>
      {timelineOpen ? (
        <Modal open={timelineOpen} onClose={closeTimeline}>
          <div className="flex h-full max-h-[80vh] flex-col bg-white">
            <div className="flex items-center justify-between border-b border-graystone-200 px-6 py-4">
              <div>
                <div className="heading-font text-lg font-semibold text-ocean-900">
                  Content timeline
                </div>
                <p className="text-xs text-graystone-500">Logged activity for this entry</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => sanitizedEntry?.id && loadTimeline(sanitizedEntry.id)}
                  className="heading-font text-xs normal-case"
                >
                  Refresh
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeTimeline}
                  className="heading-font text-xs normal-case"
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {timelineError ? (
                <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {timelineError}
                </div>
              ) : null}
              {timelineLoading ? (
                <p className="text-sm text-graystone-500">Loading timeline…</p>
              ) : timelineList.length ? (
                <div className="space-y-3">
                  {timelineList.map((item) => {
                    const meta = parseTimelineMeta(item.meta);
                    const metaKeys = Object.keys(meta || {});
                    const ts = item.ts ? new Date(item.ts).toLocaleString() : '';
                    return (
                      <div
                        key={item.id || `${item.ts}-${item.action}`}
                        className="rounded-2xl border border-graystone-200 bg-graystone-50 px-4 py-3 text-sm text-graystone-700"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-semibold text-ocean-800">
                            {formatTimelineAction(item.action)}
                          </div>
                          <div className="text-xs text-graystone-500">{ts}</div>
                        </div>
                        <div className="text-xs text-graystone-500">{item.user || 'System'}</div>
                        {metaKeys.length ? (
                          <div className="mt-2 rounded-xl bg-white px-3 py-2 text-xs text-graystone-600">
                            {metaKeys.map((key) => (
                              <div
                                key={key}
                                className="flex items-center justify-between gap-3 border-b border-graystone-100 py-1 last:border-b-0"
                              >
                                <span className="font-semibold text-graystone-700">{key}</span>
                                <span className="text-graystone-500">
                                  {typeof meta[key] === 'object'
                                    ? JSON.stringify(meta[key])
                                    : String(meta[key])}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-graystone-500">No timeline activity recorded yet.</p>
              )}
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

// Sidebar Navigation Component - matches PM Productivity Tool style
function Sidebar({
  currentView,
  planTab,
  onNavigate,
  currentUser,
  currentUserEmail,
  currentUserAvatar,
  profileInitials,
  onProfileClick,
  onSignOut,
  canUseCalendar,
  canUseKanban,
  canUseApprovals,
  canUseIdeas,
  canUseLinkedIn,
  canUseTesting,
  currentUserIsAdmin,
  outstandingCount,
}) {
  // Determine which sidebar item is active based on currentView and planTab
  const getActiveItem = () => {
    if (currentView === 'dashboard' || currentView === 'menu') return 'dashboard';
    if (currentView === 'analytics') return 'analytics';
    if (currentView === 'engagement') return 'engagement';
    if (currentView === 'approvals') return 'approvals';
    if (currentView === 'admin') return 'admin';
    if (currentView === 'form') return 'form';
    if (currentView === 'plan') {
      if (planTab === 'plan') return 'calendar';
      if (planTab === 'kanban') return 'kanban';
      if (planTab === 'ideas') return 'ideas';
      if (planTab === 'linkedin') return 'linkedin';
      if (planTab === 'testing') return 'testing';
    }
    return 'dashboard';
  };

  const activeItem = getActiveItem();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', enabled: true },
    { id: 'analytics', label: 'Analytics', icon: 'bar-chart', enabled: true },
    { id: 'engagement', label: 'Engagement', icon: 'users', enabled: true },
    { id: 'calendar', label: 'Calendar', icon: 'calendar', enabled: canUseCalendar },
    { id: 'kanban', label: 'Kanban', icon: 'columns', enabled: canUseKanban },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: 'check-circle',
      enabled: canUseApprovals,
      badge: outstandingCount,
    },
    { id: 'ideas', label: 'Ideas', icon: 'lightbulb', enabled: canUseIdeas },
    { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin', enabled: canUseLinkedIn },
    { id: 'testing', label: 'Testing', icon: 'flask', enabled: canUseTesting },
    { id: 'admin', label: 'Admin', icon: 'settings', enabled: currentUserIsAdmin },
  ].filter((item) => item.enabled);

  const iconMap = {
    'layout-dashboard': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
      </svg>
    ),
    'bar-chart': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="12" width="4" height="9" rx="1" strokeWidth="2" />
        <rect x="10" y="7" width="4" height="14" rx="1" strokeWidth="2" />
        <rect x="17" y="3" width="4" height="18" rx="1" strokeWidth="2" />
      </svg>
    ),
    users: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="7" r="4" strokeWidth="2" />
        <path
          d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    calendar: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
        <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
        <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
        <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
      </svg>
    ),
    columns: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="5" height="18" rx="1" strokeWidth="2" />
        <rect x="10" y="3" width="5" height="18" rx="1" strokeWidth="2" />
        <rect x="17" y="3" width="5" height="18" rx="1" strokeWidth="2" />
      </svg>
    ),
    'check-circle': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path d="M9 12l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    lightbulb: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          d="M9 18h6M10 22h4M12 2v1M4.22 4.22l.707.707M1 12h1M4.22 19.78l.707-.707M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    linkedin: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6ZM2 9h4v12H2ZM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    flask: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          d="M9 3h6M10 3v5.5l-4 6v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4l-4-6V3"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    settings: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" strokeWidth="2" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
          strokeWidth="2"
        />
      </svg>
    ),
    plus: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round" />
        <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  };

  return (
    <div className="w-64 bg-white flex flex-col h-screen fixed left-0 top-0 z-40 border-r border-ocean-100 shadow-sm">
      {/* Logo/Header */}
      <div className="p-6 border-b border-ocean-100">
        <div className="flex items-center gap-3">
          <img
            src="https://www.wikicorporates.org/mediawiki/images/thumb/d/db/Population-Matters-2020.png/250px-Population-Matters-2020.png"
            alt="Population Matters"
            className="h-10 w-10 object-contain"
          />
          <div>
            <h1 className="heading-font text-lg text-ocean-900">Content Hub</h1>
            <p className="text-xs text-ocean-600">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cx(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group',
              activeItem === item.id
                ? 'bg-ocean-500 text-white shadow-lg'
                : 'text-ocean-900 hover:bg-ocean-50',
            )}
          >
            <div className="relative flex items-center justify-center">
              {/* Hover Circle - Behind Icon */}
              <div
                className={cx(
                  'absolute w-10 h-10 rounded-full transition-all duration-300',
                  activeItem === item.id
                    ? 'scale-0 opacity-0'
                    : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100',
                )}
                style={{ backgroundColor: '#0CFFFF' }}
              />
              <span className="relative z-10">{iconMap[item.icon]}</span>
            </div>
            <span className="font-heading text-sm tracking-wide">{item.label}</span>
            {item.badge > 0 && (
              <span className="ml-auto text-xs font-semibold bg-aqua-400 text-ocean-900 rounded-full px-2 py-0.5">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Add New Item - Special Button */}
      {canUseCalendar && (
        <div className="p-4 border-t border-ocean-100">
          <button
            onClick={() => onNavigate('form')}
            className={cx(
              'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-left transition-all font-semibold',
              currentView === 'form'
                ? 'bg-ocean-600 text-white shadow-lg'
                : 'bg-ocean-500 text-white hover:bg-ocean-600 shadow-md',
            )}
          >
            {iconMap.plus}
            <span className="font-heading text-sm tracking-wide">Add Content</span>
          </button>
        </div>
      )}

      {/* User Profile Section */}
      <div className="p-4 border-t border-ocean-100">
        <button
          onClick={onProfileClick}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-ocean-50 hover:bg-ocean-100 transition-colors text-left"
        >
          {currentUserAvatar ? (
            <img
              src={currentUserAvatar}
              alt={currentUser || currentUserEmail || 'Profile'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-ocean-500 flex items-center justify-center text-white font-bold text-sm">
              {profileInitials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-ocean-900 truncate">
              {currentUser || currentUserEmail}
            </div>
            <div className="text-xs text-ocean-600">View profile</div>
          </div>
        </button>
        <button
          onClick={onSignOut}
          className="w-full mt-2 text-xs text-graystone-500 hover:text-ocean-700 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function ContentDashboard() {
  // Destructure stable method references to avoid re-renders when loading/error state changes
  const { get: apiGet, post: apiPost, put: apiPut, del: apiDel } = useApi();
  const [entries, setEntries] = useState([]);
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [viewingId, setViewingId] = useState(null);
  const [viewingSnapshot, setViewingSnapshot] = useState(null);
  const [notifications, setNotifications] = useState(() => loadNotifications());
  const [ideas, setIdeas] = useState(() => loadIdeas());
  const [linkedinSubmissions, setLinkedinSubmissions] = useState(() => loadLinkedInSubmissions());
  const [testingFrameworks, setTestingFrameworks] = useState(() => loadTestingFrameworks());
  const [adminAudits, setAdminAudits] = useState([]);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState('');
  const [currentUserFeatures, setCurrentUserFeatures] = useState(() => []);
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
  const [currentUserHasPassword, setCurrentUserHasPassword] = useState(false);
  const [authStatus, setAuthStatus] = useState('loading');
  const [authError, setAuthError] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [inviteToken, setInviteToken] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get('invite') || '';
    } catch {
      return '';
    }
  });
  const [invitePassword, setInvitePassword] = useState('');
  const [invitePasswordConfirm, setInvitePasswordConfirm] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [planTab, setPlanTab] = useState('plan');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPlatforms, setFilterPlatforms] = useState([]);
  const [filterWorkflow, setFilterWorkflow] = useState('All');
  const [filterQuery, setFilterQuery] = useState('');
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [syncQueue, setSyncQueue] = useState([]);
  const [syncToast, setSyncToast] = useState(null);
  const [performanceImportOpen, setPerformanceImportOpen] = useState(false);
  const [approvalsModalOpen, setApprovalsModalOpen] = useState(false);
  const [previewEntryId, setPreviewEntryId] = useState('');
  const [previewEntryContext, setPreviewEntryContext] = useState('default');
  const [menuMotionActive, setMenuMotionActive] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [pendingAssetType, setPendingAssetType] = useState(null);
  const [assetGoals, setAssetGoals] = useState(() => ({
    Video: 40,
    Design: 40,
    Carousel: 20,
  }));
  const [guidelines, setGuidelines] = useState(() => loadGuidelines());
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [approverDirectory, setApproverDirectory] = useState(DEFAULT_APPROVERS);
  const [userList, setUserList] = useState(() => []);
  const [engagementActivities, setEngagementActivities] = useState([]);
  const [engagementAccounts, setEngagementAccounts] = useState([]);
  const [engagementGoals, setEngagementGoals] = useState(() => DEFAULT_ENGAGEMENT_GOALS);
  const [newUserFirst, setNewUserFirst] = useState('');
  const [newUserLast, setNewUserLast] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFeatures, setNewUserFeatures] = useState(() => [...DEFAULT_FEATURES]);
  const [newUserIsApprover, setNewUserIsApprover] = useState(false);
  const [accessModalUser, setAccessModalUser] = useState(null);
  const [userAdminError, setUserAdminError] = useState('');
  const [userAdminSuccess, setUserAdminSuccess] = useState('');
  const profileMenuRef = useRef(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileFormName, setProfileFormName] = useState('');
  const [profileAvatarDraft, setProfileAvatarDraft] = useState('');
  const [profileStatus, setProfileStatus] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [deepLinkEntryId, setDeepLinkEntryId] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get('entry') || '';
    } catch {
      return '';
    }
  });
  const normalizedViewerName = useMemo(
    () => (currentUser || '').trim().toLowerCase(),
    [currentUser],
  );
  const normalizedViewerEmail = useMemo(
    () => (currentUserEmail || '').trim().toLowerCase(),
    [currentUserEmail],
  );
  const viewerMatchesValue = useCallback(
    (value) => {
      if (!value || typeof value !== 'string') return false;
      const normalized = value.trim().toLowerCase();
      if (!normalized) return false;
      if (normalizedViewerName && normalizedViewerName === normalized) return true;
      if (normalizedViewerEmail && normalizedViewerEmail === normalized) return true;
      return false;
    },
    [normalizedViewerName, normalizedViewerEmail],
  );
  const viewerIsAuthor = useCallback(
    (entry) => {
      if (!entry) return false;
      return viewerMatchesValue(entry.author);
    },
    [viewerMatchesValue],
  );
  const viewerIsApprover = useCallback(
    (entry) => {
      if (!entry) return false;
      const names = ensurePeopleArray(entry.approvers);
      return names.some((name) => viewerMatchesValue(name));
    },
    [viewerMatchesValue],
  );
  const hasFeature = useCallback(
    (feature) => currentUserIsAdmin || currentUserFeatures.includes(feature),
    [currentUserFeatures, currentUserIsAdmin],
  );
  const canUseCalendar = hasFeature('calendar');
  const canUseKanban = hasFeature('kanban');
  const canUseApprovals = hasFeature('approvals');
  const canUseIdeas = hasFeature('ideas');
  const canUseLinkedIn = hasFeature('linkedin');
  const canUseTesting = hasFeature('testing');
  const menuHasContent =
    canUseCalendar ||
    canUseKanban ||
    canUseApprovals ||
    canUseIdeas ||
    canUseLinkedIn ||
    canUseTesting ||
    currentUserIsAdmin;
  const profileInitials = useMemo(() => {
    const base = (currentUser && currentUser.trim()) || currentUserEmail || 'U';
    const parts = base.split(/\s+/).filter(Boolean);
    if (!parts.length) return base.slice(0, 2).toUpperCase();
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1] || '';
    return (first + last).toUpperCase();
  }, [currentUser, currentUserEmail]);
  const avatarPreview = profileAvatarDraft !== '' ? profileAvatarDraft : currentUserAvatar;
  const approverOptions = useMemo(() => {
    const derived = userList
      .filter((user) => user.isApprover && user.status !== 'disabled')
      .map((user) => {
        if (user.name && String(user.name).trim().length) return String(user.name).trim();
        if (user.email && String(user.email).trim().length) return String(user.email).trim();
        return '';
      })
      .filter(Boolean);
    if (derived.length) {
      return Array.from(new Set(derived));
    }
    return approverDirectory;
  }, [userList, approverDirectory]);
  const mentionUsers = useMemo(
    () => (userList.length ? userList : DEFAULT_USER_RECORDS),
    [userList],
  );
  const pushSyncToast = useCallback((message, tone = 'warning') => {
    setSyncToast({ id: uuid(), message, tone });
  }, []);
  useEffect(() => {
    if (!syncToast) return;
    const timeout = setTimeout(() => setSyncToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [syncToast]);
  const enqueueSyncTask = useCallback(
    (label, action, error, requiresApi = true) => {
      const entry = {
        id: uuid(),
        label,
        action,
        attempts: 1,
        lastError: error?.message || 'Unknown error',
        lastAttemptAt: new Date().toISOString(),
        requiresApi,
      };
      setSyncQueue((prev) => [...prev, entry].slice(-25));
      pushSyncToast(`${label} failed. Added to retry queue.`, 'warning');
    },
    [pushSyncToast],
  );
  const runSyncTask = useCallback(
    async (label, action, options = {}) => {
      const requiresApi = options.requiresApi !== false;
      if (requiresApi && (!window.api || !window.api.enabled)) {
        enqueueSyncTask(`${label} (offline)`, action, new Error('API offline'), requiresApi);
        return false;
      }
      try {
        await action();
        return true;
      } catch (error) {
        console.warn(`${label} failed`, error);
        enqueueSyncTask(label, action, error, requiresApi);
        return false;
      }
    },
    [enqueueSyncTask],
  );
  const retrySyncItem = useCallback(
    async (item) => {
      if (item.requiresApi && (!window.api || !window.api.enabled)) {
        setSyncQueue((prev) =>
          prev.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  lastError: 'API offline',
                  lastAttemptAt: new Date().toISOString(),
                }
              : entry,
          ),
        );
        pushSyncToast('API offline. Retry again when connected.', 'warning');
        return;
      }
      try {
        await item.action();
        setSyncQueue((prev) => prev.filter((entry) => entry.id !== item.id));
        pushSyncToast(`${item.label} synced.`, 'success');
      } catch (error) {
        setSyncQueue((prev) =>
          prev.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  attempts: entry.attempts + 1,
                  lastError: error?.message || 'Unknown error',
                  lastAttemptAt: new Date().toISOString(),
                }
              : entry,
          ),
        );
        pushSyncToast(`${item.label} failed again.`, 'warning');
      }
    },
    [pushSyncToast],
  );
  const retryAllSync = useCallback(() => {
    syncQueue.forEach((item) => retrySyncItem(item));
  }, [syncQueue, retrySyncItem]);
  const refreshEntries = useCallback(() => {
    if (!window.api || !window.api.enabled || !window.api.listEntries) return;
    window.api
      .listEntries()
      .then((payload) => Array.isArray(payload) && setEntries(payload))
      .catch(() => pushSyncToast('Unable to refresh entries from the server.', 'warning'));
  }, [pushSyncToast]);
  const refreshIdeas = useCallback(() => {
    if (!window.api || !window.api.enabled || !window.api.listIdeas) return;
    window.api
      .listIdeas()
      .then((payload) => Array.isArray(payload) && setIdeas(payload))
      .catch(() => pushSyncToast('Unable to refresh ideas from the server.', 'warning'));
  }, [pushSyncToast]);
  const refreshLinkedIn = useCallback(() => {
    if (!window.api || !window.api.enabled || !window.api.listLinkedIn) return;
    window.api
      .listLinkedIn()
      .then((payload) => Array.isArray(payload) && setLinkedinSubmissions(payload))
      .catch(() => pushSyncToast('Unable to refresh LinkedIn drafts.', 'warning'));
  }, [pushSyncToast]);
  const refreshTesting = useCallback(() => {
    if (!window.api || !window.api.enabled || !window.api.listTestingFrameworks) return;
    window.api
      .listTestingFrameworks()
      .then((payload) => Array.isArray(payload) && setTestingFrameworks(payload))
      .catch(() => pushSyncToast('Unable to refresh testing frameworks.', 'warning'));
  }, [pushSyncToast]);
  const refreshUsers = useCallback(() => {
    if (!window.api || !window.api.enabled || !window.api.listUsers) return;
    window.api
      .listUsers()
      .then((payload) => Array.isArray(payload) && setUserList(payload))
      .catch(() => pushSyncToast('Unable to refresh user roster.', 'warning'));
  }, [pushSyncToast]);
  const hydrateCurrentUser = useCallback(async () => {
    setAuthStatus('loading');
    setAuthError('');
    try {
      let payload = null;
      if (window.api && window.api.enabled) {
        // Check for Supabase session first
        const session = await window.api.getSession?.();
        if (session?.user) {
          // Ensure user profile exists and fetch it
          await window.api.ensureUserProfile?.(session.user);
          payload = await window.api.getCurrentUser();
        }
        // If Supabase is enabled but no session, user needs to login
        if (!payload) throw new Error('No authenticated session');
      } else {
        // Fallback to legacy API only when Supabase is not available
        payload = await apiGet('/api/user');
      }
      if (!payload) throw new Error('No user payload');
      const nextName =
        payload?.name && String(payload.name).trim().length
          ? String(payload.name).trim()
          : String(payload?.email || '');
      setCurrentUser(nextName);
      setCurrentUserEmail(String(payload?.email || ''));
      setCurrentUserAvatar(String(payload?.avatarUrl || ''));
      setCurrentUserFeatures(ensureFeaturesList(payload?.features));
      setCurrentUserIsAdmin(Boolean(payload?.isAdmin));
      setCurrentUserHasPassword(Boolean(payload?.hasPassword));
      setAuthStatus('ready');
    } catch (error) {
      console.warn('Failed to fetch authenticated user', error);
      setCurrentUser('');
      setCurrentUserEmail('');
      setCurrentUserAvatar('');
      setCurrentUserFeatures([]);
      setCurrentUserIsAdmin(false);
      setCurrentUserHasPassword(false);
      setUserList([]);
      setAccessModalUser(null);
      setAuthError('');
      setAuthStatus(inviteToken ? 'invite' : 'login');
      setProfileMenuOpen(false);
    }
  }, [inviteToken, apiGet]);

  useEffect(() => {
    hydrateCurrentUser();
  }, [hydrateCurrentUser]);

  useEffect(() => {
    if (inviteToken && authStatus !== 'ready') {
      setAuthStatus('invite');
    }
  }, [inviteToken, authStatus]);

  useEffect(() => {
    const required = PLAN_TAB_FEATURES[planTab];
    if (required && !hasFeature(required)) {
      for (const tab of PLAN_TAB_ORDER) {
        const needed = PLAN_TAB_FEATURES[tab];
        if (!needed || hasFeature(needed)) {
          setPlanTab(tab);
          return;
        }
      }
    }
  }, [planTab, hasFeature]);

  useEffect(() => {
    if (currentView === 'form' && !canUseCalendar) {
      setCurrentView('dashboard');
    } else if (currentView === 'approvals' && !canUseApprovals) {
      setCurrentView('dashboard');
    } else if (currentView === 'admin' && !currentUserIsAdmin) {
      setCurrentView('dashboard');
    } else if (currentView === 'plan') {
      const canUsePlan = PLAN_TAB_ORDER.some((tab) => {
        const needed = PLAN_TAB_FEATURES[tab];
        return !needed || hasFeature(needed);
      });
      if (!canUsePlan) {
        setCurrentView('dashboard');
      }
    }
  }, [currentView, hasFeature, currentUserIsAdmin, canUseCalendar, canUseApprovals]);

  const notifyViaServer = (payload, label = 'Send notification') => {
    if (typeof window === 'undefined' || !payload) return;
    const action = async () => {
      if (window.api && window.api.enabled && window.api.notify) {
        return window.api.notify(payload);
      }
      return apiPost('/api/notify', payload);
    };
    runSyncTask(label, action, { requiresApi: false });
  };
  const resetFilters = useCallback(() => {
    setFilterType('All');
    setFilterStatus('All');
    setFilterWorkflow('All');
    setFilterPlatforms([]);
    setFilterQuery('');
    setFilterOverdue(false);
  }, []);

  const handleChangePassword = useCallback(
    async ({ currentPassword, newPassword }) => {
      const payload = { currentPassword, newPassword };
      const submit = async () => {
        if (window.api && window.api.enabled && window.api.changePassword) {
          return window.api.changePassword(payload);
        }
        return apiPut('/api/password', payload);
      };
      try {
        const response = await submit();
        setCurrentUserHasPassword(true);
        return response;
      } catch (error) {
        console.error('Failed to update password', error);
        if (error instanceof Error) throw error;
        throw new Error('Unable to update password.');
      }
    },
    [setCurrentUserHasPassword, apiPut],
  );
  const refreshApprovers = useCallback(async () => {
    try {
      let payload = null;
      if (window.api && typeof window.api.listApprovers === 'function') {
        payload = await window.api.listApprovers();
      } else {
        payload = await apiGet('/api/approvers');
      }
      if (Array.isArray(payload) && payload.length) {
        setApproverDirectory(
          payload
            .map((entry) => {
              if (!entry) return '';
              if (entry.name && String(entry.name).trim().length) return String(entry.name).trim();
              if (entry.email && String(entry.email).trim().length)
                return String(entry.email).trim();
              return '';
            })
            .filter(Boolean),
        );
      } else {
        setApproverDirectory(DEFAULT_APPROVERS);
      }
    } catch (error) {
      console.warn('Failed to load approvers', error);
      setApproverDirectory(DEFAULT_APPROVERS);
    }
  }, [apiGet]);

  useEffect(() => {
    refreshApprovers();
  }, [refreshApprovers]);

  const PROFILE_IMAGE_LIMIT = 200 * 1024;

  const openProfileMenu = () => {
    setProfileFormName(currentUser || currentUserEmail || '');
    setProfileAvatarDraft(currentUserAvatar || '');
    setProfileStatus('');
    setProfileError('');
    setProfileMenuOpen(true);
  };

  const closeProfileMenu = () => {
    setProfileMenuOpen(false);
  };

  const handleProfileMenuToggle = () => {
    if (profileMenuOpen) {
      closeProfileMenu();
      return;
    }
    openProfileMenu();
  };

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClick = (event) => {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target)) {
        closeProfileMenu();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileMenuOpen]);

  const handleAvatarFileChange = (event) => {
    const file = event.target?.files && event.target.files[0];
    if (!file) return;
    if (file.size > PROFILE_IMAGE_LIMIT) {
      setProfileError('Image must be under 200KB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfileAvatarDraft(typeof reader.result === 'string' ? reader.result : '');
      setProfileError('');
    };
    reader.onerror = () => {
      setProfileError('Unable to read the selected image.');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    const desiredName = profileFormName.trim() || currentUser || currentUserEmail;
    const payload = { name: desiredName };
    if ((profileAvatarDraft || '') !== (currentUserAvatar || '')) {
      payload.avatar = profileAvatarDraft ? profileAvatarDraft : null;
    }
    setProfileSaving(true);
    setProfileStatus('');
    setProfileError('');
    try {
      let response = null;
      if (window.api && typeof window.api.updateProfile === 'function') {
        response = await window.api.updateProfile(payload);
      } else {
        response = await apiPut('/api/user', payload);
      }
      if (response?.user) {
        setCurrentUser(response.user.name || desiredName);
        setCurrentUserEmail(response.user.email || currentUserEmail);
        setCurrentUserAvatar(response.user.avatarUrl || '');
      } else {
        setCurrentUser(desiredName);
      }
      setProfileStatus('Profile updated.');
    } catch (error) {
      console.error('Failed to update profile', error);
      setProfileError(error instanceof Error ? error.message : 'Unable to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };
  const addUser = async () => {
    setUserAdminError('');
    setUserAdminSuccess('');
    if (!currentUserIsAdmin) {
      setUserAdminError('You do not have permission to manage users.');
      return;
    }
    const first = newUserFirst.trim();
    const last = newUserLast.trim();
    const email = newUserEmail.trim();
    if (!first || !last || !email) return;
    const fullname = `${first} ${last}`;
    const normalizedEmail = normalizeEmail(email);
    const selectedFeatures = ensureFeaturesList(newUserFeatures);
    if (!window.api || typeof window.api.createUser !== 'function') {
      setUserAdminError('Server is offline. Try again when connected.');
      return;
    }
    try {
      const created = await window.api
        .createUser({
          name: fullname,
          email,
          features: selectedFeatures,
          isApprover: newUserIsApprover,
        })
        .catch((error) => {
          throw error;
        });
      if (created) {
        setUserList((prev) => {
          const without = prev.filter((user) => user.id !== created.id);
          return [created, ...without];
        });
        setUserAdminSuccess(`Invitation sent to ${email}.`);
        refreshApprovers();
        refreshUsers();
      }
    } catch (error) {
      console.error(error);
      setUserAdminError('Unable to create user. Please try again.');
    }
    setNewUserFirst('');
    setNewUserLast('');
    setNewUserEmail('');
    setNewUserFeatures([...DEFAULT_FEATURES]);
    setNewUserIsApprover(false);
  };
  const removeUser = async (user) => {
    if (!user?.id) return;
    setUserAdminError('');
    setUserAdminSuccess('');
    if (!currentUserIsAdmin) {
      setUserAdminError('You do not have permission to manage users.');
      return;
    }
    if (!window.api || typeof window.api.deleteUser !== 'function') {
      setUserAdminError('Server is offline.');
      return;
    }
    try {
      await window.api.deleteUser(user.id);
      setUserList((prev) => prev.filter((item) => item.id !== user.id));
      setUserAdminSuccess(`Removed ${user.name || user.email}.`);
      refreshApprovers();
      refreshUsers();
    } catch (error) {
      console.error(error);
      setUserAdminError('Unable to remove user.');
    }
  };
  const toggleNewUserFeature = (feature) => {
    setNewUserFeatures((prev) =>
      prev.includes(feature) ? prev.filter((item) => item !== feature) : [...prev, feature],
    );
  };
  const toggleApproverRole = async (user) => {
    if (!user?.id) return;
    setUserAdminError('');
    setUserAdminSuccess('');
    if (!currentUserIsAdmin) {
      setUserAdminError('You do not have permission to manage users.');
      return;
    }
    if (!window.api || typeof window.api.updateUser !== 'function') {
      setUserAdminError('Server is offline.');
      return;
    }
    try {
      const nextValue = !user.isApprover;
      const result = await window.api.updateUser(user.id, { isApprover: nextValue });
      if (result?.user) {
        setUserList((prev) =>
          prev.map((entry) => (entry.id === result.user.id ? result.user : entry)),
        );
        setUserAdminSuccess(
          `${nextValue ? 'Added' : 'Removed'} ${user.name || user.email} ${
            nextValue ? 'to' : 'from'
          } the approver list.`,
        );
        refreshApprovers();
        refreshUsers();
      }
    } catch (error) {
      console.error(error);
      setUserAdminError('Unable to update approver status.');
    }
  };
  const handleAccessSave = async (features) => {
    if (!accessModalUser) return;
    if (!currentUserIsAdmin) {
      setUserAdminError('You do not have permission to manage users.');
      setAccessModalUser(null);
      return;
    }
    const normalized = ensureFeaturesList(features);
    if (!window.api || typeof window.api.updateUser !== 'function') {
      setUserAdminError('Server is offline.');
      return;
    }
    try {
      const result = await window.api.updateUser(accessModalUser.id, { features: normalized });
      if (result?.user) {
        setUserList((prev) =>
          prev.map((user) => (user.id === result.user.id ? result.user : user)),
        );
        refreshApprovers();
        refreshUsers();
      }
    } catch (error) {
      console.error(error);
      setUserAdminError('Unable to update access.');
    } finally {
      setAccessModalUser(null);
    }
  };

  useEffect(() => {
    setEntries(loadEntries());
    setIdeas(loadIdeas());
    setLinkedinSubmissions(loadLinkedInSubmissions());
    setTestingFrameworks(loadTestingFrameworks());
  }, []);

  // If server is available, hydrate from API once authenticated; fall back to local on failure
  useEffect(() => {
    if (authStatus !== 'ready') return;
    let cancelled = false;
    (async () => {
      try {
        if (window.api && window.api.enabled) {
          const wantsIdeas = canUseIdeas;
          const wantsLinkedIn = canUseLinkedIn;
          const wantsTesting = canUseTesting;
          const wantsUsers = currentUserIsAdmin;
          const [
            serverEntries,
            serverIdeas,
            serverLinkedIn,
            serverFrameworks,
            serverGuidelines,
            serverUsers,
          ] = await Promise.all([
            window.api.listEntries().catch(() => []),
            wantsIdeas ? window.api.listIdeas().catch(() => []) : Promise.resolve([]),
            wantsLinkedIn ? window.api.listLinkedIn().catch(() => []) : Promise.resolve([]),
            wantsTesting ? window.api.listTestingFrameworks().catch(() => []) : Promise.resolve([]),
            window.api.getGuidelines
              ? window.api.getGuidelines().catch(() => null)
              : Promise.resolve(null),
            wantsUsers && window.api.listUsers
              ? window.api.listUsers().catch(() => [])
              : Promise.resolve([]),
          ]);
          if (cancelled) return;
          if (Array.isArray(serverEntries)) setEntries(serverEntries);
          if (wantsIdeas) {
            if (Array.isArray(serverIdeas)) setIdeas(serverIdeas);
          } else {
            setIdeas([]);
          }
          if (wantsLinkedIn) {
            if (Array.isArray(serverLinkedIn)) setLinkedinSubmissions(serverLinkedIn);
          } else {
            setLinkedinSubmissions([]);
          }
          if (wantsTesting) {
            if (Array.isArray(serverFrameworks)) setTestingFrameworks(serverFrameworks);
          } else {
            setTestingFrameworks([]);
          }
          if (serverGuidelines) {
            const normalized = normalizeGuidelines(serverGuidelines);
            setGuidelines(normalized);
            saveGuidelines(normalized);
          }
          if (wantsUsers) {
            if (Array.isArray(serverUsers)) setUserList(serverUsers);
          } else {
            setUserList([]);
          }
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [authStatus, canUseIdeas, canUseLinkedIn, canUseTesting, currentUserIsAdmin]);

  // Also hydrate when the api client announces readiness
  useEffect(() => {
    const onReady = (e) => {
      if (e?.detail?.enabled && syncQueue.length) {
        retryAllSync();
      }
      if (e?.detail?.enabled && authStatus === 'ready') {
        const wantsIdeas = canUseIdeas;
        const wantsLinkedIn = canUseLinkedIn;
        const wantsTesting = canUseTesting;
        const wantsUsers = currentUserIsAdmin;
        Promise.all([
          window.api.listEntries().catch(() => []),
          wantsIdeas ? window.api.listIdeas().catch(() => []) : Promise.resolve([]),
          wantsLinkedIn ? window.api.listLinkedIn().catch(() => []) : Promise.resolve([]),
          wantsTesting ? window.api.listTestingFrameworks().catch(() => []) : Promise.resolve([]),
          window.api.getGuidelines
            ? window.api.getGuidelines().catch(() => null)
            : Promise.resolve(null),
          wantsUsers && window.api.listUsers
            ? window.api.listUsers().catch(() => [])
            : Promise.resolve([]),
        ])
          .then(
            ([
              serverEntries,
              serverIdeas,
              serverLinkedIn,
              serverFrameworks,
              serverGuidelines,
              serverUsers,
            ]) => {
              if (Array.isArray(serverEntries)) setEntries(serverEntries);
              if (wantsIdeas) {
                if (Array.isArray(serverIdeas)) setIdeas(serverIdeas);
              } else {
                setIdeas([]);
              }
              if (wantsLinkedIn) {
                if (Array.isArray(serverLinkedIn)) setLinkedinSubmissions(serverLinkedIn);
              } else {
                setLinkedinSubmissions([]);
              }
              if (wantsTesting) {
                if (Array.isArray(serverFrameworks)) setTestingFrameworks(serverFrameworks);
              } else {
                setTestingFrameworks([]);
              }
              if (serverGuidelines) {
                const normalized = normalizeGuidelines(serverGuidelines);
                setGuidelines(normalized);
                saveGuidelines(normalized);
              }
              if (wantsUsers) {
                if (Array.isArray(serverUsers)) setUserList(serverUsers);
              } else {
                setUserList([]);
              }
            },
          )
          .catch(() => {});
      }
    };
    window.addEventListener('pm-api-ready', onReady);
    return () => window.removeEventListener('pm-api-ready', onReady);
  }, [
    authStatus,
    canUseIdeas,
    canUseLinkedIn,
    canUseTesting,
    currentUserIsAdmin,
    retryAllSync,
    syncQueue.length,
  ]);

  useEffect(() => {
    setMenuMotionActive(true);
  }, []);

  // Fallback navigation via URL hash so CTAs work even if React handler is blocked.
  useEffect(() => {
    const syncFromHash = () => {
      if (window.location.hash === '#create') {
        setCurrentView('form');
        setPlanTab('plan');
        closeEntry();
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  useEffect(() => {
    if (currentView !== 'form') {
      setPendingAssetType(null);
    }
  }, [currentView]);

  const handleGuidelinesSave = (next) => {
    const normalized = normalizeGuidelines(next);
    setGuidelines(normalized);
    saveGuidelines(normalized);
    if (window.api && window.api.saveGuidelines) {
      runSyncTask('Save guidelines', () => window.api.saveGuidelines(normalized));
    }
    setGuidelinesOpen(false);
  };

  useEffect(() => {
    if (!(window.api && window.api.enabled)) {
      saveEntries(entries);
    }
  }, [entries]);

  useEffect(() => {
    if (!storageAvailable) return;
    if (currentUser) {
      window.localStorage.setItem(USER_STORAGE_KEY, currentUser);
    } else {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUserIsAdmin) {
      setAccessModalUser(null);
    }
  }, [currentUserIsAdmin]);

  useEffect(() => {
    if (!canUseApprovals) {
      setApprovalsModalOpen(false);
    }
  }, [canUseApprovals]);

  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    saveIdeas(ideas);
  }, [ideas]);

  useEffect(() => {
    saveLinkedInSubmissions(linkedinSubmissions);
  }, [linkedinSubmissions]);

  useEffect(() => {
    saveTestingFrameworks(testingFrameworks);
  }, [testingFrameworks]);
  useEffect(() => {
    if (!testingFrameworks.length) {
      if (selectedFrameworkId) setSelectedFrameworkId('');
      return;
    }
    if (
      !selectedFrameworkId ||
      !testingFrameworks.some((framework) => framework.id === selectedFrameworkId)
    ) {
      setSelectedFrameworkId(testingFrameworks[0].id);
    }
  }, [testingFrameworks, selectedFrameworkId]);

  const addNotifications = (items = []) => {
    if (!items || !items.length) return;
    setNotifications((prev) => {
      const existing = new Set(
        prev.map(
          (item) => item.key || notificationKey(item.type, item.entryId, item.user, item.meta),
        ),
      );
      const additions = items
        .map((item) => {
          const key = item.key || notificationKey(item.type, item.entryId, item.user, item.meta);
          return {
            id: uuid(),
            entryId: item.entryId,
            user: item.user,
            type: item.type,
            message: item.message,
            createdAt: item.createdAt || new Date().toISOString(),
            read: false,
            meta: item.meta || {},
            key,
          };
        })
        .filter(
          (item) =>
            item.entryId && item.user && item.type && item.message && !existing.has(item.key),
        );
      if (!additions.length) return prev;
      return [...additions, ...prev];
    });
  };

  const markNotificationsAsReadForEntry = (entryId, user = currentUser) => {
    if (!entryId || !user) return;
    setNotifications((prev) =>
      prev.map((item) =>
        item.entryId === entryId && item.user === user && !item.read
          ? { ...item, read: true }
          : item,
      ),
    );
  };

  const buildApprovalNotifications = (entry, names) => {
    const approvers = names ? names : ensurePeopleArray(entry.approvers);
    if (!approvers.length) return [];
    const descriptor =
      entry.caption && entry.caption.trim().length
        ? entry.caption.trim()
        : `${entry.assetType} on ${new Date(entry.date).toLocaleDateString()}`;
    const timestamp = new Date().toISOString();
    return approvers.map((user) => ({
      entryId: entry.id,
      user,
      type: 'approval-assigned',
      message: `${descriptor} is awaiting your approval.`,
      createdAt: timestamp,
      meta: { source: 'approval' },
      key: notificationKey('approval-assigned', entry.id, user),
    }));
  };

  const buildMentionNotifications = (entry, comment, mentionNames) => {
    if (!mentionNames || !mentionNames.length) return [];
    const descriptor =
      entry.caption && entry.caption.trim().length
        ? entry.caption.trim()
        : `${entry.assetType} on ${new Date(entry.date).toLocaleDateString()}`;
    const author = comment.author || 'A teammate';
    const timestamp = comment.createdAt || new Date().toISOString();
    return mentionNames
      .filter((user) => user && user.trim() && user.trim() !== (comment.author || '').trim())
      .map((user) => ({
        entryId: entry.id,
        user,
        type: 'mention',
        message: `${author} mentioned you on "${descriptor}".`,
        createdAt: timestamp,
        meta: { commentId: comment.id },
        key: notificationKey('mention', entry.id, user, { commentId: comment.id }),
      }));
  };

  const handleMentionNotifications = ({ entry, comment, mentionNames }) => {
    if (!entry || !comment) return;
    const payload = buildMentionNotifications(entry, comment, mentionNames);
    if (payload.length) addNotifications(payload);
  };

  const handleCommentActivity = ({ entry, comment }) => {
    if (!entry || !comment) return;
    const approvers = ensurePeopleArray(entry.approvers);
    const authorNames = ensurePeopleArray(entry.author);
    const actorName = comment.author || currentUser || 'Unknown';
    const normalizedActor = actorName ? actorName.trim().toLowerCase() : '';
    const recipients = new Set();
    const addRecipientsFrom = (list) => {
      list.forEach((name) => {
        const trimmed = (name || '').trim();
        if (!trimmed) return;
        if (normalizedActor && trimmed.toLowerCase() === normalizedActor) return;
        recipients.add(trimmed);
      });
    };
    const actorIsApprover = approvers.some(
      (name) => (name || '').trim().toLowerCase() === normalizedActor,
    );
    const actorIsAuthor = authorNames.some(
      (name) => (name || '').trim().toLowerCase() === normalizedActor,
    );
    if (actorIsApprover) {
      addRecipientsFrom(authorNames.length ? authorNames : approvers);
    } else if (actorIsAuthor) {
      addRecipientsFrom(approvers);
    } else {
      addRecipientsFrom([...authorNames, ...approvers]);
    }
    if (!recipients.size) return;
    const descriptor = entryDescriptor(entry);
    const timestamp = new Date().toISOString();
    addNotifications(
      Array.from(recipients).map((user) => ({
        entryId: entry.id,
        user,
        type: 'comment',
        message: `${actorName} commented on ${descriptor}.`,
        createdAt: timestamp,
        meta: { commentId: comment.id, source: 'comment' },
        key: notificationKey('comment', entry.id, user, { commentId: comment.id }),
      })),
    );
    try {
      const link = entryReviewLink(entry);
      const rawSnippet = comment.body || '';
      const snippet = rawSnippet.length > 600 ? `${rawSnippet.slice(0, 600)}…` : rawSnippet;
      const textParts = [
        `${actorName} commented on "${descriptor}".`,
        snippet ? snippet : '',
        link ? `Review: ${link}` : '',
      ].filter(Boolean);
      const text = textParts.join('\n\n');
      const htmlSnippet = snippet ? escapeHtml(snippet).replace(/\n/g, '<br />') : '';
      const html = `
        <div style="font-family:'Helvetica Neue',Arial,sans-serif; font-size:14px; color:#0f172a;">
          <p><strong>${escapeHtml(actorName)}</strong> commented on <strong>${escapeHtml(
            descriptor,
          )}</strong>.</p>
          ${
            htmlSnippet
              ? `<blockquote style="margin:12px 0; padding:12px; background:#f1f5f9; border-left:3px solid #0A66C2;">${htmlSnippet}</blockquote>`
              : ''
          }
          ${
            link
              ? `<p style="margin:0;"><a href="${escapeHtml(
                  link,
                )}" style="color:#0A66C2; text-decoration:none;">Review this entry</a></p>`
              : ''
          }
        </div>
      `.trim();
      notifyViaServer(
        {
          approvers: Array.from(recipients),
          to: Array.from(recipients),
          subject: `[PM Dashboard] New comment on ${descriptor}`,
          text,
          html,
        },
        `Send comment alert (${entry.id})`,
      );
    } catch {}
  };

  const notifyApproversAboutChange = (entry) => {
    if (!entry) return;
    const approvers = ensurePeopleArray(entry.approvers);
    if (!approvers.length) return;
    const actorName = currentUser || 'A teammate';
    const normalizedActor = actorName.trim().toLowerCase();
    const recipients = approvers
      .map((name) => (name || '').trim())
      .filter((name) => name && name.toLowerCase() !== normalizedActor);
    if (!recipients.length) return;
    const descriptor = entryDescriptor(entry);
    const timestamp = new Date().toISOString();
    addNotifications(
      recipients.map((user) => ({
        entryId: entry.id,
        user,
        type: 'approval-update',
        message: `${actorName} updated ${descriptor}.`,
        createdAt: timestamp,
        meta: { source: 'entry-update' },
        key: notificationKey('approval-update', entry.id, user),
      })),
    );
    try {
      const link = entryReviewLink(entry);
      const textLines = [
        `${actorName} updated "${descriptor}".`,
        link ? `Review: ${link}` : '',
      ].filter(Boolean);
      const text = textLines.join('\n\n');
      const html = `
        <div style="font-family:'Helvetica Neue',Arial,sans-serif; font-size:14px; color:#0f172a;">
          <p><strong>${escapeHtml(actorName)}</strong> updated <strong>${escapeHtml(
            descriptor,
          )}</strong>.</p>
          ${
            link
              ? `<p style="margin:0;"><a href="${escapeHtml(
                  link,
                )}" style="color:#0A66C2; text-decoration:none;">Review this entry</a></p>`
              : ''
          }
        </div>
      `.trim();
      notifyViaServer(
        {
          approvers: recipients,
          to: recipients,
          subject: `[PM Dashboard] ${actorName} updated ${descriptor}`,
          text,
          html,
        },
        `Send approval update (${entry.id})`,
      );
    } catch {}
  };

  const addIdea = (idea) => {
    const timestamp = new Date().toISOString();
    const sanitized = sanitizeIdea({
      ...idea,
      createdBy: idea.createdBy || currentUser || 'Unknown',
      createdAt: timestamp,
    });
    setIdeas((prev) => [sanitized, ...prev]);
    runSyncTask(`Create idea (${sanitized.id})`, () => window.api.createIdea(sanitized)).then(
      (ok) => {
        if (ok) refreshIdeas();
      },
    );
    appendAudit({
      user: currentUser,
      action: 'idea-create',
      meta: { id: sanitized.id, title: sanitized.title },
    });
  };

  const deleteIdea = (id) => {
    setIdeas((prev) => prev.filter((idea) => idea.id !== id));
    runSyncTask(`Delete idea (${id})`, () => window.api.deleteIdea(id)).then((ok) => {
      if (ok) refreshIdeas();
    });
    appendAudit({ user: currentUser, action: 'idea-delete', meta: { id } });
  };

  const addLinkedInSubmission = (payload) => {
    const timestamp = new Date().toISOString();
    const sanitized = sanitizeLinkedInSubmission({
      ...payload,
      createdAt: timestamp,
      submitter: payload.submitter || currentUser || 'Unknown',
    });
    setLinkedinSubmissions((prev) => [sanitized, ...prev]);
    runSyncTask(`Create LinkedIn draft (${sanitized.id})`, () =>
      window.api.createLinkedIn(sanitized),
    ).then((ok) => {
      if (ok) refreshLinkedIn();
    });
    appendAudit({
      user: currentUser,
      action: 'linkedin-create',
      meta: { id: sanitized.id, title: sanitized.title },
    });
    if (guidelines?.teamsWebhookUrl) {
      notifyViaServer(
        {
          teamsWebhookUrl: guidelines.teamsWebhookUrl,
          message: `LinkedIn submission created by ${sanitized.submitter}: ${sanitized.title}`,
        },
        `Send LinkedIn notification (${sanitized.id})`,
      );
    }
  };

  const updateLinkedInStatus = (id, status) => {
    if (!LINKEDIN_STATUSES.includes(status)) return;
    const timestamp = new Date().toISOString();
    setLinkedinSubmissions((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              updatedAt: timestamp,
            }
          : item,
      ),
    );
    runSyncTask(`Update LinkedIn status (${id})`, () =>
      window.api.updateLinkedIn(id, { status, updatedAt: timestamp }),
    ).then((ok) => {
      if (ok) refreshLinkedIn();
    });
    appendAudit({ user: currentUser, action: 'linkedin-status', meta: { id, status } });
    if (guidelines?.teamsWebhookUrl && (status === 'Approved' || status === 'Shared')) {
      notifyViaServer(
        {
          teamsWebhookUrl: guidelines.teamsWebhookUrl,
          message: `LinkedIn submission ${status.toLowerCase()}: ${id}`,
        },
        `Send LinkedIn status (${id})`,
      );
    }
  };

  const addTestingFrameworkEntry = (framework) => {
    const timestamp = new Date().toISOString();
    const sanitized = sanitizeTestingFramework({
      ...framework,
      createdAt: timestamp,
    });
    if (!sanitized) return;
    setTestingFrameworks((prev) => [sanitized, ...prev]);
    setSelectedFrameworkId(sanitized.id);
    runSyncTask(`Create testing framework (${sanitized.id})`, () =>
      window.api.createTestingFramework(sanitized),
    ).then((ok) => {
      if (ok) refreshTesting();
    });
    appendAudit({
      user: currentUser,
      action: 'framework-create',
      meta: { id: sanitized.id, name: sanitized.name },
    });
  };

  const deleteTestingFramework = (id) => {
    setTestingFrameworks((prev) => prev.filter((item) => item.id !== id));
    if (!id) return;
    if (selectedFrameworkId === id) {
      setSelectedFrameworkId('');
    }
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.testingFrameworkId !== id) return entry;
        const sanitized = sanitizeEntry({
          ...entry,
          testingFrameworkId: '',
          testingFrameworkName: '',
        });
        return {
          ...sanitized,
          statusDetail: computeStatusDetail(sanitized),
        };
      }),
    );
    runSyncTask(`Delete testing framework (${id})`, () =>
      window.api.deleteTestingFramework(id),
    ).then((ok) => {
      if (ok) refreshTesting();
    });
    appendAudit({ user: currentUser, action: 'framework-delete', meta: { id } });
  };

  const importPerformanceDataset = (dataset) => {
    let summary = {
      totalRows: Array.isArray(dataset?.records) ? dataset.records.length : 0,
      matched: 0,
      updatedEntries: [],
      updatedEntryCount: 0,
      missing: [],
      ambiguous: [],
      errors: [],
    };
    let updatedEntriesSnapshot = [];
    setEntries((prev) => {
      const { nextEntries, summary: computed } = mergePerformanceData(prev, dataset);
      summary = computed;
      updatedEntriesSnapshot = nextEntries;
      return nextEntries;
    });
    const shouldPersist = Array.isArray(summary.updatedEntries) && summary.updatedEntries.length;
    if (shouldPersist) {
      try {
        const entryMap = new Map((updatedEntriesSnapshot || []).map((entry) => [entry.id, entry]));
        const updates = summary.updatedEntries
          .map((entryId) => {
            const latest = entryMap.get(entryId);
            if (!latest) return null;
            return runSyncTask(`Update analytics (${entryId})`, () =>
              window.api.updateEntry(entryId, {
                analytics: latest.analytics,
                analyticsUpdatedAt: latest.analyticsUpdatedAt,
              }),
            );
          })
          .filter(Boolean);
        if (updates.length) {
          Promise.all(updates)
            .then(() => refreshEntries())
            .catch(() => pushSyncToast('Unable to refresh entries after import.', 'warning'));
        }
      } catch {}
    }
    return summary;
  };

  const monthLabel = monthCursor.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const days = useMemo(
    () =>
      Array.from(
        { length: daysInMonth(monthCursor.getFullYear(), monthCursor.getMonth()) },
        (_, index) => index + 1,
      ),
    [monthCursor],
  );

  const startISO = monthStartISO(monthCursor);
  const endISO = monthEndISO(monthCursor);
  const normalizedFilterQuery = filterQuery.trim().toLowerCase();
  const monthEntryTotal = useMemo(
    () =>
      entries.filter((entry) => !entry.deletedAt && entry.date >= startISO && entry.date <= endISO)
        .length,
    [entries, startISO, endISO],
  );
  const isApprovalOverdue = (entry) => {
    if (!entry?.approvalDeadline) return false;
    const parsed = new Date(entry.approvalDeadline);
    if (Number.isNaN(parsed.getTime())) return false;
    return parsed.getTime() < Date.now() && entry.status !== 'Approved';
  };
  const matchesSearch = (entry) => {
    if (!normalizedFilterQuery) return true;
    const caption = entry.caption || '';
    const platformCaptions =
      entry.platformCaptions && typeof entry.platformCaptions === 'object'
        ? Object.values(entry.platformCaptions).join(' ')
        : '';
    const platforms = Array.isArray(entry.platforms) ? entry.platforms.join(' ') : '';
    const extra = [
      entry.author,
      entry.campaign,
      entry.contentPillar,
      entry.statusDetail,
      entry.workflowStatus,
      entry.status,
      entry.assetType,
      entry.previewUrl,
      entry.firstComment,
    ]
      .filter(Boolean)
      .join(' ');
    const haystack = `${caption} ${platformCaptions} ${platforms} ${extra}`.toLowerCase();
    return haystack.includes(normalizedFilterQuery);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterType !== 'All') count += 1;
    if (filterStatus !== 'All') count += 1;
    if (filterWorkflow !== 'All') count += 1;
    if (filterPlatforms.length) count += 1;
    if (filterQuery.trim()) count += 1;
    if (filterOverdue) count += 1;
    return count;
  }, [filterType, filterStatus, filterWorkflow, filterPlatforms, filterQuery, filterOverdue]);

  const monthEntries = useMemo(() => {
    return entries
      .filter((entry) => !entry.deletedAt && entry.date >= startISO && entry.date <= endISO)
      .filter((entry) => (filterType === 'All' ? true : entry.assetType === filterType))
      .filter((entry) => (filterStatus === 'All' ? true : entry.status === filterStatus))
      .filter((entry) =>
        filterWorkflow === 'All' ? true : entry.workflowStatus === filterWorkflow,
      )
      .filter((entry) =>
        filterPlatforms.length === 0
          ? true
          : filterPlatforms.some((platform) => entry.platforms.includes(platform)),
      )
      .filter((entry) => (!filterOverdue ? true : isApprovalOverdue(entry)))
      .filter((entry) => matchesSearch(entry))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [
    entries,
    startISO,
    endISO,
    filterType,
    filterStatus,
    filterWorkflow,
    filterPlatforms,
    filterOverdue,
    normalizedFilterQuery,
  ]);

  const previewEntry = useMemo(
    () => entries.find((entry) => entry.id === previewEntryId) || null,
    [entries, previewEntryId],
  );
  const previewIsReviewMode = Boolean(previewEntry && previewEntryContext === 'calendar');
  const previewCanApprove =
    previewIsReviewMode && previewEntry ? viewerIsApprover(previewEntry) : false;

  const assetTypeSummary = useMemo(() => {
    const counts = monthEntries.reduce((acc, entry) => {
      acc[entry.assetType] = (acc[entry.assetType] || 0) + 1;
      return acc;
    }, {});
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    return { counts, total };
  }, [monthEntries]);

  const ideasByMonth = useMemo(() => {
    const groups = new Map();
    ideas.forEach((idea) => {
      const key = idea.targetMonth || '';
      if (!key) return;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(idea);
    });
    return groups;
  }, [ideas]);

  const currentMonthIdeas = useMemo(() => {
    const key = monthCursor.toISOString().slice(0, 7);
    const items = ideasByMonth.get(key) || [];
    return items.slice().sort((a, b) => (a.targetDate || '').localeCompare(b.targetDate || ''));
  }, [ideasByMonth, monthCursor]);

  const entriesByFramework = useMemo(() => {
    const map = new Map();
    entries.forEach((entry) => {
      if (entry.deletedAt) return;
      const key = entry.testingFrameworkId ? String(entry.testingFrameworkId) : '';
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(entry);
    });
    const result = {};
    map.forEach((list, key) => {
      result[key] = list.slice().sort((a, b) => a.date.localeCompare(b.date));
    });
    return result;
  }, [entries]);
  const frameworkEntryCounts = useMemo(() => {
    const counts = {};
    testingFrameworks.forEach((framework) => {
      counts[framework.id] = entriesByFramework[framework.id]
        ? entriesByFramework[framework.id].length
        : 0;
    });
    return counts;
  }, [testingFrameworks, entriesByFramework]);
  const selectedFramework =
    selectedFrameworkId && testingFrameworks.length
      ? testingFrameworks.find((framework) => framework.id === selectedFrameworkId) || null
      : null;
  const selectedFrameworkEntries =
    selectedFrameworkId && entriesByFramework[selectedFrameworkId]
      ? entriesByFramework[selectedFrameworkId]
      : [];

  const trashed = useMemo(
    () =>
      entries
        .filter((entry) => entry.deletedAt)
        .sort((a, b) => (b.deletedAt || '').localeCompare(a.deletedAt || '')),
    [entries],
  );

  const outstandingApprovals = useMemo(() => {
    if (!currentUser) return [];
    return entries
      .filter(
        (entry) =>
          !entry.deletedAt &&
          entry.status === 'Pending' &&
          Array.isArray(entry.approvers) &&
          entry.approvers.includes(currentUser),
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [entries, currentUser]);

  const outstandingCount = outstandingApprovals.length;
  const ideaCount = ideas.length;
  const linkedinCount = linkedinSubmissions.length;
  const testingFrameworkCount = testingFrameworks.length;

  const userNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications
      .filter((item) => item.user === currentUser)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [notifications, currentUser]);

  const featureTiles = [
    {
      id: 'create',
      title: 'Create Content',
      description:
        'Capture briefs, assign approvers, and log the assets your team needs to produce next.',
      cta: 'Open form',
      onClick: () => {
        setCurrentView('form');
        setPlanTab('plan');
        closeEntry();
      },
    },
    {
      id: 'calendar',
      title: 'Calendar',
      description:
        'Review what is booked each day, approve content, and tidy up anything sitting in trash.',
      cta: 'View calendar',
      onClick: () => {
        setCurrentView('plan');
        setPlanTab('plan');
        closeEntry();
      },
    },
    {
      id: 'kanban',
      title: 'Production Kanban',
      description: 'Move work from draft to scheduled with status-based swimlanes.',
      cta: 'View board',
      onClick: () => {
        setCurrentView('plan');
        setPlanTab('kanban');
        closeEntry();
      },
    },
    {
      id: 'linkedin',
      title: 'LinkedIn drafts',
      description: 'Submit LinkedIn copy for review or queue posts for teammates to share.',
      cta: 'View drafts',
      onClick: () => {
        setCurrentView('plan');
        setPlanTab('linkedin');
        closeEntry();
      },
    },
    {
      id: 'testing',
      title: 'Testing Lab',
      description: 'Document hypotheses, success metrics, and frameworks you can link to briefs.',
      cta: 'Explore tests',
      onClick: () => {
        setCurrentView('plan');
        setPlanTab('testing');
        closeEntry();
      },
    },
    {
      id: 'approvals',
      title: 'Your Approvals',
      description: 'Track what still needs your sign-off and clear the queue in one pass.',
      cta: 'View queue',
      onClick: () => {
        setCurrentView('approvals');
        setPlanTab('plan');
        closeEntry();
      },
    },
    {
      id: 'ideas',
      title: 'Ideas Log',
      description:
        'Capture topics, themes, and series concepts—complete with notes, links, and assets.',
      cta: 'View ideas',
      onClick: () => {
        setCurrentView('plan');
        setPlanTab('ideas');
        closeEntry();
      },
    },
  ];

  const unreadNotifications = useMemo(
    () => userNotifications.filter((item) => !item.read),
    [userNotifications],
  );

  const unreadMentionsCount = useMemo(
    () => unreadNotifications.filter((item) => item.type === 'mention').length,
    [unreadNotifications],
  );

  const closeEntry = () => {
    setViewingId(null);
    setViewingSnapshot(null);
    setPreviewEntryId('');
    setPreviewEntryContext('default');
  };

  const openEntry = (id) => {
    if (!id) {
      closeEntry();
      return;
    }
    const found = entries.find((entry) => entry.id === id);
    if (!found) {
      closeEntry();
      return;
    }
    const sanitized = sanitizeEntry(found);
    const canEdit = currentUserIsAdmin || viewerIsAuthor(sanitized);
    if (canEdit) {
      setPreviewEntryId('');
      setPreviewEntryContext('default');
      setViewingId(id);
      setViewingSnapshot(sanitized);
    } else {
      setViewingId(null);
      setViewingSnapshot(null);
      setPreviewEntryId(id);
      setPreviewEntryContext('calendar');
    }
    markNotificationsAsReadForEntry(found.id, currentUser);
  };

  const closePreview = () => {
    setPreviewEntryId('');
    setPreviewEntryContext('default');
  };
  const handlePreviewEdit = (id) => {
    if (!id) return;
    closePreview();
    openEntry(id);
  };

  useEffect(() => {
    if (!viewingId) {
      setViewingSnapshot(null);
      return;
    }
    const latest = entries.find((entry) => entry.id === viewingId);
    if (!latest) {
      closeEntry();
      return;
    }
    const sanitized = sanitizeEntry(latest);
    setViewingSnapshot((prev) => {
      if (prev && entrySignature(prev) === entrySignature(sanitized)) {
        return prev;
      }
      return sanitized;
    });
    markNotificationsAsReadForEntry(latest.id, currentUser);
  }, [entries, viewingId, currentUser]);

  const clearEntryQueryParam = () => {
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.has('entry')) return;
      url.searchParams.delete('entry');
      window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
    } catch {}
  };

  useEffect(() => {
    if (!deepLinkEntryId) return;
    if (authStatus !== 'ready') return;
    const existing = entries.find((entry) => entry.id === deepLinkEntryId);
    if (existing) {
      openEntry(deepLinkEntryId);
      clearEntryQueryParam();
      setDeepLinkEntryId('');
    }
  }, [deepLinkEntryId, entries, authStatus]);

  const addEntry = (data) => {
    const timestamp = new Date().toISOString();
    let createdEntry = null;
    setEntries((prev) => {
      const rawEntry = {
        id: uuid(),
        status: 'Pending',
        createdAt: timestamp,
        updatedAt: timestamp,
        checklist: data.checklist,
        comments: data.comments || [],
        workflowStatus:
          data.workflowStatus && KANBAN_STATUSES.includes(data.workflowStatus)
            ? data.workflowStatus
            : KANBAN_STATUSES[0],
        ...data,
      };
      const sanitized = sanitizeEntry(rawEntry);
      const entryWithStatus = {
        ...sanitized,
        statusDetail: computeStatusDetail(sanitized),
      };
      createdEntry = entryWithStatus;
      return [entryWithStatus, ...prev];
    });
    if (createdEntry) {
      const descriptor =
        createdEntry.caption && createdEntry.caption.trim().length
          ? createdEntry.caption.trim()
          : `${createdEntry.assetType || 'Asset'} on ${new Date(createdEntry.date).toLocaleDateString()}`;
      addNotifications(buildApprovalNotifications(createdEntry));
      const entryApprovers = ensurePeopleArray(createdEntry.approvers);
      const shouldEmailApprovers = entryApprovers.length || guidelines?.teamsWebhookUrl;
      if (shouldEmailApprovers) {
        try {
          const requesterName = currentUser || createdEntry.author || 'A teammate';
          const emailPayload = buildEntryEmailPayload(createdEntry);
          const fallbackSubject = `[PM Dashboard] Approval requested: ${descriptor}`;
          const fallbackText = `${requesterName} requested your approval for ${descriptor} scheduled ${new Date(
            createdEntry.date,
          ).toLocaleDateString()}.`;
          notifyViaServer(
            {
              teamsWebhookUrl: guidelines?.teamsWebhookUrl,
              message: `${requesterName} requested approval for entry ${createdEntry.id}`,
              approvers: entryApprovers,
              subject: emailPayload?.subject || fallbackSubject,
              text: emailPayload?.text || fallbackText,
              html: emailPayload?.html,
            },
            `Send approval request (${createdEntry.id})`,
          );
        } catch {}
      }
      try {
        const payload = {
          id: createdEntry.id,
          date: createdEntry.date,
          platforms: createdEntry.platforms,
          assetType: createdEntry.assetType,
          caption: createdEntry.caption,
          platformCaptions: createdEntry.platformCaptions,
          firstComment: createdEntry.firstComment,
          status: createdEntry.status,
          approvers: createdEntry.approvers,
          author: createdEntry.author || currentUser || 'Unknown',
          campaign: createdEntry.campaign,
          contentPillar: createdEntry.contentPillar,
          previewUrl: createdEntry.previewUrl,
          approvalDeadline: createdEntry.approvalDeadline,
          checklist: createdEntry.checklist,
          analytics: createdEntry.analytics,
          workflowStatus: createdEntry.workflowStatus,
          statusDetail: createdEntry.statusDetail,
          aiFlags: createdEntry.aiFlags,
          aiScore: createdEntry.aiScore,
          testingFrameworkId: createdEntry.testingFrameworkId,
          testingFrameworkName: createdEntry.testingFrameworkName,
          user: currentUser,
        };
        runSyncTask(`Create entry (${createdEntry.id})`, () =>
          window.api.createEntry(payload),
        ).then((ok) => {
          if (ok) refreshEntries();
        });
      } catch {}
      appendAudit({
        user: currentUser,
        entryId: createdEntry.id,
        action: 'entry-create',
        meta: {
          date: createdEntry.date,
          assetType: createdEntry.assetType,
          platforms: createdEntry.platforms,
        },
      });
    }
  };

  const cloneEntry = (sourceEntry) => {
    if (!sourceEntry) return;
    const timestamp = new Date().toISOString();
    const newId = uuid();

    // Clone all content fields but reset metadata
    const clonedData = {
      // Content fields - keep these
      platforms: sourceEntry.platforms || [],
      assetType: sourceEntry.assetType || '',
      caption: sourceEntry.caption || '',
      platformCaptions: sourceEntry.platformCaptions || {},
      firstComment: sourceEntry.firstComment || '',
      script: sourceEntry.script || '',
      designCopy: sourceEntry.designCopy || '',
      carouselSlides: sourceEntry.carouselSlides || [],
      previewUrl: sourceEntry.previewUrl || '',
      campaign: sourceEntry.campaign || '',
      contentPillar: sourceEntry.contentPillar || '',
      testingFrameworkId: sourceEntry.testingFrameworkId || '',
      testingFrameworkName: sourceEntry.testingFrameworkName || '',

      // Reset these for the new entry
      id: newId,
      date: '', // User must select a new date
      status: 'Pending',
      workflowStatus: KANBAN_STATUSES[0], // Draft
      author: currentUser || 'Unknown',
      approvers: sourceEntry.approvers || [], // Keep approvers for convenience
      approvalDeadline: '', // Clear deadline
      approvedAt: undefined,
      checklist: createEmptyChecklist(), // Fresh checklist
      comments: [], // No comments on clone
      analytics: {}, // No analytics yet
      analyticsUpdatedAt: '',
      aiFlags: [],
      aiScore: {},
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    };

    const sanitized = sanitizeEntry(clonedData);
    const entryWithStatus = {
      ...sanitized,
      statusDetail: computeStatusDetail(sanitized),
      _isNew: true, // Flag to indicate this needs to be created, not updated
    };

    setEntries((prev) => [entryWithStatus, ...prev]);

    // Open the cloned entry for editing
    setViewingId(newId);
    setViewingSnapshot(entryWithStatus);

    // Show toast notification
    setSyncToast({ message: 'Entry cloned - select a date to schedule', tone: 'success' });
    setTimeout(() => setSyncToast(null), 3000);

    appendAudit({
      user: currentUser,
      entryId: newId,
      action: 'entry-clone',
      meta: {
        sourceEntryId: sourceEntry.id,
        assetType: clonedData.assetType,
        platforms: clonedData.platforms,
      },
    });
  };

  const createEntryFromIdea = (idea) => {
    if (!idea) return;
    const timestamp = new Date().toISOString();
    const newId = uuid();

    // Create entry from idea data
    const entryData = {
      id: newId,
      date: idea.targetDate || '', // Use target date if set, otherwise empty
      platforms: [], // User will select
      assetType: '',
      caption: idea.title || '', // Use idea title as starting caption
      platformCaptions: {},
      firstComment: '',
      script: '',
      designCopy: '',
      carouselSlides: [],
      previewUrl: '',
      campaign: '',
      contentPillar: '',
      testingFrameworkId: '',
      testingFrameworkName: '',
      status: 'Pending',
      workflowStatus: KANBAN_STATUSES[0], // Draft
      author: currentUser || 'Unknown',
      approvers: [],
      approvalDeadline: '',
      approvedAt: undefined,
      checklist: createEmptyChecklist(),
      comments: [],
      analytics: {},
      analyticsUpdatedAt: '',
      aiFlags: [],
      aiScore: {},
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
      // Carry over links and attachments from idea
      links: idea.links || [],
      attachments: idea.attachments || [],
    };

    const sanitized = sanitizeEntry(entryData);
    const entryWithStatus = {
      ...sanitized,
      statusDetail: computeStatusDetail(sanitized),
      _isNew: true, // Flag to indicate this needs to be created, not updated
      _sourceIdeaId: idea.id, // Track source idea for conversion persistence
    };

    setEntries((prev) => [entryWithStatus, ...prev]);

    // Mark the idea as converted (local state)
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === idea.id ? { ...i, convertedToEntryId: newId, convertedAt: timestamp } : i,
      ),
    );

    // Persist idea conversion to server
    if (window.api?.updateIdea) {
      try {
        runSyncTask(`Update idea conversion (${idea.id})`, () =>
          window.api.updateIdea(idea.id, {
            convertedToEntryId: newId,
            convertedAt: timestamp,
          }),
        ).then((ok) => {
          if (ok) refreshIdeas();
        });
      } catch {}
    }

    // Open the new entry for editing
    setViewingId(newId);
    setViewingSnapshot(entryWithStatus);

    // Show toast notification
    setSyncToast({ message: 'Entry created from idea - complete the details', tone: 'success' });
    setTimeout(() => setSyncToast(null), 3000);

    appendAudit({
      user: currentUser,
      entryId: newId,
      action: 'entry-create-from-idea',
      meta: {
        ideaId: idea.id,
        ideaTitle: idea.title,
      },
    });
  };

  const upsert = (updated) => {
    const timestamp = new Date().toISOString();
    let approvalNotifications = [];
    const pendingApproverAlerts = [];
    const normalizedActor = (currentUser || '').trim().toLowerCase();
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === updated.id
          ? (() => {
              const merged = {
                ...entry,
                ...updated,
                updatedAt: timestamp,
              };
              const sanitized = sanitizeEntry(merged);
              const previousApprovers = ensurePeopleArray(entry.approvers);
              const nextApprovers = ensurePeopleArray(sanitized.approvers);
              const newApprovers = nextApprovers.filter(
                (name) => name && !previousApprovers.includes(name),
              );
              if (newApprovers.length) {
                approvalNotifications = approvalNotifications.concat(
                  buildApprovalNotifications(sanitized, newApprovers),
                );
              }
              const actorIsApprover = normalizedActor
                ? nextApprovers.some(
                    (name) => (name || '').trim().toLowerCase() === normalizedActor,
                  )
                : false;
              if (
                hasApproverRelevantChanges(entry, sanitized) &&
                nextApprovers.length &&
                !actorIsApprover
              ) {
                pendingApproverAlerts.push(sanitized);
              }
              return {
                ...sanitized,
                statusDetail: computeStatusDetail(sanitized),
              };
            })()
          : entry,
      ),
    );
    if (approvalNotifications.length) {
      addNotifications(approvalNotifications);
    }
    if (pendingApproverAlerts.length) {
      pendingApproverAlerts.forEach((entry) => notifyApproversAboutChange(entry));
    }
    if (updated?.id) {
      // Check if this is a new entry that needs to be created
      const existingEntry = entries.find((e) => e.id === updated.id);
      const isNewEntry = existingEntry?._isNew;

      try {
        const payload = { ...updated };
        delete payload.id;
        delete payload._isNew;
        delete payload._sourceIdeaId;

        if (isNewEntry) {
          // Create new entry on server
          const createPayload = {
            ...payload,
            id: updated.id,
            user: currentUser,
          };
          runSyncTask(`Create entry (${updated.id})`, () =>
            window.api.createEntry(createPayload),
          ).then((ok) => {
            if (ok) {
              // Clear the _isNew flag after successful creation
              setEntries((prev) =>
                prev.map((e) => (e.id === updated.id ? { ...e, _isNew: undefined } : e)),
              );
              refreshEntries();
            }
          });
        } else {
          // Update existing entry
          runSyncTask(`Update entry (${updated.id})`, () =>
            window.api.updateEntry(updated.id, payload),
          ).then((ok) => {
            if (ok) refreshEntries();
          });
        }
      } catch {}
    }
    appendAudit({
      user: currentUser,
      entryId: updated?.id,
      action: updated?._isNew ? 'entry-create' : 'entry-update',
    });
  };

  const toggleApprove = (id) => {
    const entryRecord = entries.find((entry) => entry.id === id) || null;
    const timestamp = new Date().toISOString();
    let nextStatusForServer = null;
    let nextWorkflowStatusForServer = null;
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry;
        const toggled = entry.status === 'Approved' ? 'Pending' : 'Approved';
        nextStatusForServer = toggled;
        const updatedEntry = sanitizeEntry({
          ...entry,
          status: toggled,
          approvedAt: toggled === 'Approved' ? timestamp : undefined,
          updatedAt: timestamp,
        });
        // Streamlined workflow: Approved → 'Approved', Unapproved → 'Ready for Review'
        const workflowStatus = toggled === 'Approved' ? 'Approved' : 'Ready for Review';
        nextWorkflowStatusForServer = workflowStatus;
        const normalized = {
          ...updatedEntry,
          workflowStatus,
        };
        return {
          ...normalized,
          statusDetail: computeStatusDetail(normalized),
        };
      }),
    );
    if (nextStatusForServer) {
      try {
        runSyncTask(`Update approval (${id})`, () =>
          window.api.updateEntry(id, {
            status: nextStatusForServer,
            workflowStatus: nextWorkflowStatusForServer,
            approvedAt: nextStatusForServer === 'Approved' ? timestamp : null,
          }),
        ).then((ok) => {
          if (ok) refreshEntries();
        });
      } catch {}
    }
    appendAudit({
      user: currentUser,
      entryId: id,
      action: nextStatusForServer === 'Approved' ? 'entry-approve' : 'entry-unapprove',
    });
    const entryApprovers = ensurePeopleArray(entryRecord?.approvers);
    const descriptor =
      entryRecord && entryRecord.caption && entryRecord.caption.trim().length
        ? entryRecord.caption.trim()
        : entryRecord
          ? `${entryRecord.assetType || 'Asset'} on ${new Date(entryRecord.date).toLocaleDateString()}`
          : `Entry ${id}`;
    const shouldNotify = guidelines?.teamsWebhookUrl || entryApprovers.length;
    if (shouldNotify) {
      try {
        const statusMsg = nextStatusForServer === 'Approved' ? 'approved' : 'unapproved';
        const subjectLabel =
          entryRecord?.campaign ||
          entryRecord?.contentPillar ||
          entryRecord?.assetType ||
          `Entry ${id}`;
        const subject = `[PM Dashboard] ${subjectLabel} ${statusMsg}`;
        const summaryParts = [
          `${currentUser} ${statusMsg} entry ${entryRecord?.id || id}`,
          entryRecord?.date
            ? `scheduled for ${new Date(entryRecord.date).toLocaleDateString()}`
            : '',
        ].filter(Boolean);
        const emailPayload = buildEntryEmailPayload(entryRecord, {
          subjectOverride: `${subjectLabel} ${statusMsg}`,
        });
        notifyViaServer(
          {
            teamsWebhookUrl: guidelines?.teamsWebhookUrl,
            message: `Entry ${id} ${statusMsg} by ${currentUser}`,
            approvers: entryApprovers,
            subject: emailPayload?.subject || subject,
            text: emailPayload?.text || summaryParts.join(' - '),
            html: emailPayload?.html,
          },
          `Send approval status (${id})`,
        );
      } catch {}
    }
    const requestorNames = ensurePeopleArray(entryRecord?.author);
    if (nextStatusForServer === 'Approved' && requestorNames.length) {
      try {
        const subjectApproved = `[PM Dashboard] Approved: ${descriptor}`;
        const textApproved = `${currentUser} approved ${descriptor}.`;
        notifyViaServer(
          {
            to: requestorNames,
            subject: subjectApproved,
            text: textApproved,
          },
          `Notify requester (${id})`,
        );
      } catch {}
    }
  };

  const updateWorkflowStatus = (id, nextStatus) => {
    if (!KANBAN_STATUSES.includes(nextStatus)) return;
    const timestamp = new Date().toISOString();
    // Sync approval status with workflow status
    const syncedStatus =
      nextStatus === 'Approved' || nextStatus === 'Published' ? 'Approved' : 'Pending';
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry;
        const sanitized = sanitizeEntry({
          ...entry,
          workflowStatus: nextStatus,
          status: syncedStatus,
          approvedAt:
            syncedStatus === 'Approved' && !entry.approvedAt ? timestamp : entry.approvedAt,
          updatedAt: timestamp,
        });
        return {
          ...sanitized,
          statusDetail: computeStatusDetail(sanitized),
        };
      }),
    );
    try {
      runSyncTask(`Update workflow (${id})`, () =>
        window.api.updateEntry(id, {
          workflowStatus: nextStatus,
          status: syncedStatus,
          approvedAt: syncedStatus === 'Approved' ? timestamp : undefined,
        }),
      ).then((ok) => {
        if (ok) refreshEntries();
      });
    } catch {}
    appendAudit({
      user: currentUser,
      entryId: id,
      action: 'entry-workflow',
      meta: { to: nextStatus },
    });
  };

  const softDelete = (id) => {
    const timestamp = new Date().toISOString();
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, deletedAt: timestamp, updatedAt: timestamp } : entry,
      ),
    );
    if (viewingId === id) closeEntry();
    try {
      runSyncTask(`Delete entry (${id})`, () => window.api.deleteEntry(id)).then((ok) => {
        if (ok) refreshEntries();
      });
    } catch {}
    appendAudit({ user: currentUser, entryId: id, action: 'entry-delete-soft' });
  };

  const restore = (id) => {
    const timestamp = new Date().toISOString();
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, deletedAt: undefined, updatedAt: timestamp } : entry,
      ),
    );
    try {
      runSyncTask(`Restore entry (${id})`, () =>
        window.api.updateEntry(id, { deletedAt: null }),
      ).then((ok) => {
        if (ok) refreshEntries();
      });
    } catch {}
    appendAudit({ user: currentUser, entryId: id, action: 'entry-restore' });
  };

  const hardDelete = (id) => {
    const confirmed = window.confirm('Delete this item permanently? This cannot be undone.');
    if (!confirmed) return;
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    if (viewingId === id) closeEntry();
    try {
      runSyncTask(`Delete entry permanently (${id})`, () =>
        window.api.deleteEntry(id, { hard: true }),
      ).then((ok) => {
        if (ok) refreshEntries();
      });
    } catch {}
    appendAudit({ user: currentUser, entryId: id, action: 'entry-delete-hard' });
  };

  const resetLoginFields = () => {
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
  };

  const retryAuth = () => {
    hydrateCurrentUser();
  };

  const handleSignOut = () => {
    (async () => {
      try {
        if (window.api && typeof window.api.logout === 'function') {
          await window.api.logout();
        } else {
          await apiDel('/api/auth');
        }
      } catch {}
      setCurrentUser('');
      setCurrentUserEmail('');
      setCurrentUserAvatar('');
      setCurrentUserFeatures([]);
      setCurrentUserIsAdmin(false);
      setCurrentUserHasPassword(false);
      setAuthStatus('login');
      resetLoginFields();
      setCurrentView('dashboard');
      closeEntry();
      setUserList([]);
      setAccessModalUser(null);
      setChangePasswordOpen(false);
      setApproverDirectory(DEFAULT_APPROVERS);
      setProfileMenuOpen(false);
      setProfileFormName('');
      setProfileAvatarDraft('');
      setProfileStatus('');
      setProfileError('');
      setSyncQueue([]);
      setSyncToast(null);
    })();
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    setLoginError('');
    const normalizedEmail = normalizeEmail(loginEmail);
    if (!normalizedEmail) {
      setLoginError('Enter the email you were invited with.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Enter your password.');
      return;
    }
    try {
      let response = null;
      if (window.api && typeof window.api.login === 'function') {
        response = await window.api.login({ email: normalizedEmail, password: loginPassword });
      } else {
        response = await apiPost('/api/auth', { email: normalizedEmail, password: loginPassword });
      }
      const name =
        response?.user?.name && response.user.name.trim().length
          ? response.user.name.trim()
          : normalizedEmail;
      setCurrentUser(name);
      setCurrentUserEmail(response?.user?.email || normalizedEmail);
      setCurrentUserAvatar(response?.user?.avatarUrl || '');
      setCurrentUserFeatures(ensureFeaturesList(response?.user?.features));
      setCurrentUserIsAdmin(Boolean(response?.user?.isAdmin));
      setCurrentUserHasPassword(Boolean(response?.user?.hasPassword));
      setAuthStatus('ready');
      setAuthError('');
      resetLoginFields();
    } catch (error) {
      console.error(error);
      setLoginError('Invalid email or password.');
    }
  };

  const clearInviteParam = () => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('invite')) {
        url.searchParams.delete('invite');
        window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
      }
    } catch {}
  };

  const submitInvite = async (event) => {
    event.preventDefault();
    setInviteError('');
    if (!inviteToken) {
      setInviteError('This invite link is invalid.');
      return;
    }
    if (!invitePassword || invitePassword.length < 8) {
      setInviteError('Choose a password with at least 8 characters.');
      return;
    }
    if (invitePassword !== invitePasswordConfirm) {
      setInviteError('Passwords must match.');
      return;
    }
    try {
      let response = null;
      if (window.api && typeof window.api.acceptInvite === 'function') {
        response = await window.api.acceptInvite({ token: inviteToken, password: invitePassword });
      } else {
        response = await apiPut('/api/auth', { token: inviteToken, password: invitePassword });
      }
      const name =
        response?.user?.name && response.user.name.trim().length
          ? response.user.name.trim()
          : response?.user?.email || '';
      setCurrentUser(name);
      setCurrentUserEmail(response?.user?.email || '');
      setCurrentUserAvatar(response?.user?.avatarUrl || '');
      setCurrentUserFeatures(ensureFeaturesList(response?.user?.features));
      setCurrentUserIsAdmin(Boolean(response?.user?.isAdmin));
      setCurrentUserHasPassword(Boolean(response?.user?.hasPassword));
      setInviteToken('');
      setInvitePassword('');
      setInvitePasswordConfirm('');
      setAuthStatus('ready');
      clearInviteParam();
    } catch (error) {
      console.error(error);
      setInviteError('This invite link is invalid or has expired.');
    }
  };

  // Handle sidebar navigation - must be defined before conditional returns
  const handleSidebarNavigate = useCallback(
    (view) => {
      closeEntry();

      // Map sidebar items to view/tab combinations
      const viewMap = {
        dashboard: { view: 'dashboard', tab: 'plan' },
        analytics: { view: 'analytics', tab: 'plan' },
        engagement: { view: 'engagement', tab: 'plan' },
        calendar: { view: 'plan', tab: 'plan' },
        kanban: { view: 'plan', tab: 'kanban' },
        ideas: { view: 'plan', tab: 'ideas' },
        linkedin: { view: 'plan', tab: 'linkedin' },
        testing: { view: 'plan', tab: 'testing' },
        approvals: { view: 'approvals', tab: 'plan' },
        admin: { view: 'admin', tab: 'plan' },
        form: { view: 'form', tab: 'plan' },
      };

      const mapping = viewMap[view] || { view: 'dashboard', tab: 'plan' };
      setCurrentView(mapping.view);
      setPlanTab(mapping.tab);

      try {
        window.location.hash = `#${view}`;
      } catch {}
    },
    [closeEntry],
  );

  if (authStatus === 'invite') {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-16 text-ocean-900">
        <div className="rounded-3xl border border-aqua-200 bg-white p-8 shadow-2xl">
          <h1 className="heading-font text-3xl font-semibold text-ocean-600">
            Welcome to PM Dashboard
          </h1>
          <p className="mt-2 text-sm text-graystone-600">
            Set your password to finish activating your account.
          </p>
          {inviteError ? (
            <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-700">
              {inviteError}
            </div>
          ) : null}
          <form className="mt-6 space-y-4" onSubmit={submitInvite}>
            <div className="space-y-2">
              <Label className="text-sm text-graystone-600" htmlFor="invite-password">
                Password
              </Label>
              <Input
                id="invite-password"
                type="password"
                autoComplete="new-password"
                value={invitePassword}
                onChange={(event) => setInvitePassword(event.target.value)}
                className="w-full rounded-2xl border border-graystone-200 px-4 py-3 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-aqua-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-graystone-600" htmlFor="invite-password-confirm">
                Confirm password
              </Label>
              <Input
                id="invite-password-confirm"
                type="password"
                autoComplete="new-password"
                value={invitePasswordConfirm}
                onChange={(event) => setInvitePasswordConfirm(event.target.value)}
                className="w-full rounded-2xl border border-graystone-200 px-4 py-3 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-aqua-200"
              />
            </div>
            <Button type="submit" className="w-full">
              Set password & enter
            </Button>
          </form>
          <button
            type="button"
            className="mt-4 text-xs text-ocean-600 underline"
            onClick={() => {
              setInviteToken('');
              setAuthStatus('login');
              clearInviteParam();
            }}
          >
            Have an account already? Sign in instead
          </button>
        </div>
      </div>
    );
  }

  if (authStatus === 'login') {
    const handleAuthChange = ({ user, profile }) => {
      if (profile) {
        const nextName =
          profile?.name && String(profile.name).trim().length
            ? String(profile.name).trim()
            : String(profile?.email || user?.email || '');
        setCurrentUser(nextName);
        setCurrentUserEmail(String(profile?.email || user?.email || ''));
        setCurrentUserAvatar(String(profile?.avatarUrl || profile?.avatar_url || ''));
        setCurrentUserFeatures(ensureFeaturesList(profile?.features));
        setCurrentUserIsAdmin(Boolean(profile?.isAdmin || profile?.is_admin));
        setCurrentUserHasPassword(true);
        setAuthStatus('ready');
      } else {
        // Re-fetch user data
        hydrateCurrentUser();
      }
    };
    return <LoginScreen onAuthChange={handleAuthChange} />;
  }

  if (authStatus === 'loading') {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-16 text-ocean-900">
        <div className="rounded-3xl border border-aqua-200 bg-white p-8 text-center shadow-2xl">
          <div className="heading-font text-3xl font-semibold text-ocean-600">Checking access…</div>
          <p className="mt-4 text-sm text-graystone-600">
            Verifying your Cloudflare Access session so we can load the dashboard.
          </p>
          <div className="mt-6 animate-pulse rounded-2xl bg-aqua-100 px-4 py-3 text-sm text-ocean-700">
            Hang tight—this only takes a moment.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#cfebf8' }}>
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        planTab={planTab}
        onNavigate={handleSidebarNavigate}
        currentUser={currentUser}
        currentUserEmail={currentUserEmail}
        currentUserAvatar={currentUserAvatar}
        profileInitials={profileInitials}
        onProfileClick={handleProfileMenuToggle}
        onSignOut={handleSignOut}
        canUseCalendar={canUseCalendar}
        canUseKanban={canUseKanban}
        canUseApprovals={canUseApprovals}
        canUseIdeas={canUseIdeas}
        canUseLinkedIn={canUseLinkedIn}
        canUseTesting={canUseTesting}
        currentUserIsAdmin={currentUserIsAdmin}
        outstandingCount={outstandingCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto ml-64" style={{ backgroundColor: '#cfebf8' }}>
        <div className="container mx-auto p-8 max-w-7xl">
          {/* Sync Queue Toast */}
          {syncQueue.length ? (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-semibold">Sync pending.</span> {syncQueue.length} update
                  {syncQueue.length === 1 ? '' : 's'} waiting to send.
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={retryAllSync}>
                    Retry all
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSyncQueue([])}>
                    Dismiss
                  </Button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-amber-800">
                {syncQueue.slice(0, 3).map((item) => (
                  <span key={item.id} className="rounded-full bg-amber-100 px-3 py-1">
                    {item.label}
                    {item.attempts > 1 ? ` (x${item.attempts})` : ''}
                  </span>
                ))}
                {syncQueue.length > 3 ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1">
                    +{syncQueue.length - 3} more
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Profile Modal */}
          {profileMenuOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div
                ref={profileMenuRef}
                className="w-80 max-w-sm rounded-3xl border border-graystone-200 bg-white p-6 shadow-2xl"
              >
                <form className="space-y-4" onSubmit={handleProfileSave}>
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-full border border-graystone-200 bg-aqua-50">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-ocean-700">
                          {profileInitials}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-base font-semibold text-ocean-800">
                        {currentUser || 'Your profile'}
                      </div>
                      <div className="text-xs text-graystone-500">
                        {currentUserEmail || 'No email'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-graystone-600" htmlFor="profile-name">
                      Display name
                    </Label>
                    <Input
                      id="profile-name"
                      value={profileFormName}
                      onChange={(event) => setProfileFormName(event.target.value)}
                      className="w-full rounded-xl border border-graystone-200 px-3 py-2 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-aqua-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-graystone-600">Profile photo</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer rounded-full border border-graystone-200 px-3 py-1 text-xs font-semibold text-ocean-700 shadow-sm transition hover:border-ocean-300">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarFileChange}
                        />
                        Upload photo
                      </label>
                      {avatarPreview ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setProfileAvatarDraft('')}
                        >
                          Remove photo
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {profileError ? (
                    <div className="rounded-xl bg-rose-50 px-4 py-2 text-xs text-rose-700">
                      {profileError}
                    </div>
                  ) : null}
                  {profileStatus ? (
                    <div className="rounded-xl bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
                      {profileStatus}
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-2 pt-2">
                    <Button type="submit" disabled={profileSaving}>
                      {profileSaving ? 'Saving...' : 'Save profile'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setChangePasswordOpen(true);
                      }}
                    >
                      Change password
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setProfileMenuOpen(false)}>
                      Close
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Dashboard View */}
          {(currentView === 'menu' || currentView === 'dashboard') && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Dashboard Header */}
              <div className="gradient-header rounded-2xl p-8 text-white shadow-xl mb-8">
                <h1 className="heading-font text-3xl font-bold mb-2">Content Dashboard</h1>
                <p className="text-ocean-100">
                  Plan, approve, and ship social content in one place.
                </p>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                {canUseApprovals && (
                  <button
                    type="button"
                    onClick={() => outstandingCount > 0 && setApprovalsModalOpen(true)}
                    disabled={outstandingCount === 0}
                    className="bg-white rounded-xl border border-ocean-100 shadow-sm p-5 text-left transition card-hover group"
                  >
                    <div className="text-xs font-semibold text-graystone-600 uppercase mb-1">
                      Awaiting Approval
                    </div>
                    <div className="stat-glow inline-flex items-center justify-center">
                      <div className="stat-value text-3xl font-bold text-ocean-900">
                        {outstandingCount}
                      </div>
                    </div>
                  </button>
                )}
                {canUseApprovals && unreadMentionsCount > 0 && (
                  <div className="bg-white rounded-xl border border-ocean-100 shadow-sm p-5 text-left">
                    <div className="text-xs font-semibold text-graystone-600 uppercase mb-1">
                      New Mentions
                    </div>
                    <div className="stat-glow inline-flex items-center justify-center">
                      <div className="stat-value text-3xl font-bold text-ocean-900">
                        {unreadMentionsCount}
                      </div>
                    </div>
                  </div>
                )}
                <div className="bg-white rounded-xl border border-ocean-100 shadow-sm p-5 text-left">
                  <div className="text-xs font-semibold text-graystone-600 uppercase mb-1">
                    Total Entries
                  </div>
                  <div className="stat-glow inline-flex items-center justify-center">
                    <div className="stat-value text-3xl font-bold text-ocean-900">
                      {entries.length}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGuidelinesOpen(true)}
                  className="bg-white rounded-xl border border-ocean-100 shadow-sm p-5 text-left transition card-hover"
                >
                  <div className="text-xs font-semibold text-graystone-600 uppercase mb-1">
                    Quick Actions
                  </div>
                  <div className="text-sm font-medium text-ocean-700">Open Guidelines</div>
                </button>
              </div>

              {/* Feature Cards Grid */}
              {menuHasContent ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                  {canUseCalendar && (
                    <div className="flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]">
                      <div className="heading-font flex items-center gap-3 text-2xl font-semibold text-black">
                        <span
                          className={cx(
                            'inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out',
                            menuMotionActive
                              ? 'translate-x-0 opacity-100 rotate-180'
                              : 'translate-x-6 opacity-0',
                          )}
                          style={{ transitionDelay: '80ms' }}
                          aria-hidden="true"
                        />
                        <span
                          className={cx(
                            'transform transition-all duration-700 ease-out',
                            menuMotionActive
                              ? 'translate-x-0 opacity-100'
                              : 'translate-x-4 opacity-0',
                          )}
                          style={{ transitionDelay: '160ms' }}
                        >
                          Create Content
                        </span>
                      </div>
                      <p className="text-sm text-graystone-600">
                        Capture briefs, assign approvers, and log the assets your team needs to
                        produce next.
                      </p>
                      <Button
                        onClick={() => {
                          setCurrentView('form');
                          setPlanTab('plan');
                          closeEntry();
                          try {
                            window.location.hash = '#create';
                          } catch {}
                        }}
                        className="mt-auto"
                      >
                        Open form
                      </Button>
                    </div>
                  )}
                  {canUseCalendar && (
                    <div className="flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]">
                      <div className="heading-font flex items-center gap-3 text-2xl font-semibold text-black">
                        <span
                          className={cx(
                            'inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out',
                            menuMotionActive
                              ? 'translate-x-0 opacity-100 rotate-180'
                              : 'translate-x-6 opacity-0',
                          )}
                          style={{ transitionDelay: '120ms' }}
                          aria-hidden="true"
                        />
                        <span
                          className={cx(
                            'transform transition-all duration-700 ease-out',
                            menuMotionActive
                              ? 'translate-x-0 opacity-100'
                              : 'translate-x-4 opacity-0',
                          )}
                          style={{ transitionDelay: '200ms' }}
                        >
                          Calendar
                        </span>
                      </div>
                      <p className="text-sm text-graystone-600">
                        Review what is booked each day, approve content, and tidy up anything
                        sitting in trash.
                      </p>
                      <Button
                        onClick={() => {
                          setCurrentView('plan');
                          setPlanTab('plan');
                          closeEntry();
                        }}
                        className="mt-auto"
                      >
                        View calendar
                      </Button>
                    </div>
                  )}
                  {canUseKanban && (
                    <div className="flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]">
                      <div className="heading-font flex items-center gap-3 text-2xl font-semibold text-black">
                        <span
                          className={cx(
                            'inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out',
                            menuMotionActive
                              ? 'translate-x-0 opacity-100 rotate-180'
                              : 'translate-x-6 opacity-0',
                          )}
                          style={{ transitionDelay: '160ms' }}
                          aria-hidden="true"
                        />
                        <span
                          className={cx(
                            'transform transition-all duration-700 ease-out',
                            menuMotionActive
                              ? 'translate-x-0 opacity-100'
                              : 'translate-x-4 opacity-0',
                          )}
                          style={{ transitionDelay: '240ms' }}
                        >
                          Production Kanban
                        </span>
                      </div>
                      <p className="text-sm text-graystone-600">
                        Move work from draft to scheduled with status-based swimlanes.
                      </p>
                      <Button
                        onClick={() => {
                          setCurrentView('plan');
                          setPlanTab('kanban');
                          closeEntry();
                        }}
                        className="mt-auto"
                      >
                        View board
                      </Button>
                    </div>
                  )}
                  {canUseLinkedIn && (
                    <div className="flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]">
                      <div className="heading-font flex items-center gap-3 text-2xl font-semibold text-black">
                        <span
                          className={cx(
                            'inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out',
                            menuMotionActive
                              ? 'translate-x-0 opacity-100 rotate-180'
                              : 'translate-x-6 opacity-0',
                          )}
                          style={{ transitionDelay: '200ms' }}
                          aria-hidden="true"
                        />
                        <span
                          className={cx(
                            'transform transition-all duration-700 ease-out',
                            menuMotionActive
                              ? 'translate-x-0 opacity-100'
                              : 'translate-x-4 opacity-0',
                          )}
                          style={{ transitionDelay: '280ms' }}
                        >
                          LinkedIn drafts
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-graystone-600">
                        Submit LinkedIn copy for review or queue posts for teammates to share.
                      </p>
                      <Button
                        onClick={() => {
                          setCurrentView('plan');
                          setPlanTab('linkedin');
                          closeEntry();
                        }}
                        className="mt-auto"
                      >
                        View drafts
                      </Button>
                    </div>
                  )}
                  {canUseTesting && (
                    <div className="flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]">
                      <div className="heading-font flex items-center gap-3 text-2xl font-semibold text-black">
                        <span
                          className={cx(
                            'inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out',
                            menuMotionActive
                              ? 'translate-x-0 opacity-100 rotate-180'
                              : 'translate-x-6 opacity-0',
                          )}
                          style={{ transitionDelay: '240ms' }}
                          aria-hidden="true"
                        />
                        <span
                          className={cx(
                            'transform transition-all duration-700 ease-out',
                            menuMotionActive
                              ? 'translate-x-0 opacity-100'
                              : 'translate-x-4 opacity-0',
                          )}
                          style={{ transitionDelay: '320ms' }}
                        >
                          Testing Lab
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-graystone-600">
                        Document hypotheses, success metrics, and frameworks you can link to briefs.
                      </p>
                      <Button
                        onClick={() => {
                          setCurrentView('plan');
                          setPlanTab('testing');
                          closeEntry();
                        }}
                        className="mt-auto"
                      >
                        Explore tests
                      </Button>
                    </div>
                  )}
                  {canUseApprovals && (
                    <div className="flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]">
                      <div className="heading-font flex items-center gap-3 text-2xl font-semibold text-black">
                        <span
                          className={cx(
                            'inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out',
                            menuMotionActive
                              ? 'translate-x-0 opacity-100 rotate-180'
                              : 'translate-x-6 opacity-0',
                          )}
                          style={{ transitionDelay: '280ms' }}
                          aria-hidden="true"
                        />
                        <span
                          className={cx(
                            'transform transition-all duration-700 ease-out',
                            menuMotionActive
                              ? 'translate-x-0 opacity-100'
                              : 'translate-x-4 opacity-0',
                          )}
                          style={{ transitionDelay: '360ms' }}
                        >
                          Your Approvals
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-graystone-600">
                        Track what still needs your sign-off and clear the queue in one pass.
                      </p>
                      <Button
                        onClick={() => {
                          setCurrentView('approvals');
                          setPlanTab('plan');
                          closeEntry();
                        }}
                        className="mt-auto"
                      >
                        View queue
                      </Button>
                    </div>
                  )}
                  {canUseIdeas && (
                    <div className="flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]">
                      <div className="heading-font flex items-center gap-3 text-2xl font-semibold text-black">
                        <span
                          className={cx(
                            'inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out',
                            menuMotionActive
                              ? 'translate-x-0 opacity-100 rotate-180'
                              : 'translate-x-6 opacity-0',
                          )}
                          style={{ transitionDelay: '320ms' }}
                          aria-hidden="true"
                        />
                        <span
                          className={cx(
                            'transform transition-all duration-700 ease-out',
                            menuMotionActive
                              ? 'translate-x-0 opacity-100'
                              : 'translate-x-4 opacity-0',
                          )}
                          style={{ transitionDelay: '400ms' }}
                        >
                          Ideas Log
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-graystone-600">
                        Capture topics, themes, and series concepts—complete with notes, links, and
                        assets.
                      </p>
                      <Button
                        onClick={() => {
                          setCurrentView('plan');
                          setPlanTab('ideas');
                          closeEntry();
                        }}
                        className="mt-auto"
                      >
                        View ideas
                      </Button>
                    </div>
                  )}
                  {currentUserIsAdmin && (
                    <div className="flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]">
                      <div className="heading-font flex items-center gap-3 text-2xl font-semibold text-black">
                        <span
                          className={cx(
                            'inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out',
                            menuMotionActive
                              ? 'translate-x-0 opacity-100 rotate-180'
                              : 'translate-x-6 opacity-0',
                          )}
                          style={{ transitionDelay: '320ms' }}
                          aria-hidden="true"
                        />
                        <span
                          className={cx(
                            'transform transition-all duration-700 ease-out',
                            menuMotionActive
                              ? 'translate-x-0 opacity-100'
                              : 'translate-x-4 opacity-0',
                          )}
                          style={{ transitionDelay: '360ms' }}
                        >
                          Admin tools
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-graystone-600">
                        View recent audit events and verify server connectivity.
                      </p>
                      <Button
                        onClick={() => {
                          setCurrentView('admin');
                          closeEntry();
                        }}
                        className="mt-auto"
                      >
                        View admin
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-3xl border border-aqua-200 bg-white p-8 text-sm text-graystone-600 shadow-[0_0_35px_rgba(15,157,222,0.2)]">
                  You don't have any modules assigned yet. Ask an administrator to grant access to
                  specific areas of the dashboard.
                </div>
              )}
              {userNotifications.length > 0 && (
                <Card className="mt-8 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg text-ocean-900">Notifications</CardTitle>
                    <p className="mt-2 text-sm text-graystone-500">
                      Mentions and approval assignments for your content.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {userNotifications.slice(0, 8).map((note) => (
                        <button
                          key={note.id}
                          onClick={() => {
                            openEntry(note.entryId);
                            markNotificationsAsReadForEntry(note.entryId, currentUser);
                          }}
                          className={cx(
                            'w-full rounded-xl border px-4 py-3 text-left text-sm transition',
                            note.read
                              ? 'border-graystone-200 bg-white hover:border-aqua-300 hover:bg-aqua-50/50'
                              : 'border-aqua-300 bg-aqua-50 hover:border-aqua-400',
                          )}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium text-graystone-800">{note.message}</span>
                            <span className="text-xs text-graystone-500">
                              {new Date(note.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {currentView === 'form' && canUseCalendar && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setCurrentView('dashboard');
                      setPlanTab('plan');
                      closeEntry();
                    }}
                    className="self-start"
                  >
                    Dashboard
                  </Button>
                  <h2 className="text-2xl font-semibold text-ocean-700">Create Content</h2>
                  <p className="text-sm text-graystone-600">
                    Submit a brief and it will appear on the calendar instantly.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentView('plan');
                      setPlanTab('plan');
                      closeEntry();
                    }}
                  >
                    View calendar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="heading-font text-sm normal-case"
                  >
                    Switch user
                  </Button>
                  <NotificationBell
                    notifications={userNotifications}
                    unreadCount={unreadNotifications.length}
                    onOpenItem={(note) => {
                      if (note.entryId) {
                        openEntry(note.entryId);
                      }
                      markNotificationsAsReadForEntry(note.entryId, currentUser);
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(260px,1fr)]">
                <div className="w-full">
                  <EntryForm
                    onSubmit={addEntry}
                    existingEntries={entries.filter((entry) => !entry.deletedAt)}
                    testingFrameworks={testingFrameworks}
                    onPreviewAssetType={setPendingAssetType}
                    guidelines={guidelines}
                    currentUser={currentUser}
                    currentUserEmail={currentUserEmail}
                    approverOptions={approverOptions}
                  />
                </div>
                <div className="flex w-full flex-col gap-6">
                  <div className="rounded-3xl border border-aqua-200 bg-white px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-black px-4 py-2 text-sm font-semibold text-graystone-800">
                        <CalendarIcon className="h-4 w-4 text-ocean-600" />
                        {monthLabel}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setMonthCursor(
                              new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1),
                            )
                          }
                        >
                          Prev
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setMonthCursor(
                              new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1),
                            )
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-graystone-500">
                      This selector only updates the Month at a glance calendar.
                    </p>
                  </div>
                  <MiniCalendar
                    monthCursor={monthCursor}
                    entries={monthEntries}
                    onPreviewEntry={(entry) => {
                      setPreviewEntryId(entry?.id || '');
                      setPreviewEntryContext(entry?.id ? 'form' : 'default');
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {currentView === 'plan' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setCurrentView('dashboard');
                      setPlanTab('plan');
                      closeEntry();
                    }}
                  >
                    Dashboard
                  </Button>
                  <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-aqua-200 bg-aqua-50 p-1 text-ocean-600">
                    {canUseCalendar && (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() => setPlanTab('plan')}
                          className={cx(
                            'rounded-2xl px-4 py-2 text-sm transition',
                            planTab === 'plan'
                              ? 'bg-ocean-500 text-white hover:bg-ocean-600'
                              : 'text-ocean-600 hover:bg-aqua-100',
                          )}
                        >
                          Calendar
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setPlanTab('trash')}
                          className={cx(
                            'rounded-2xl px-4 py-2 text-sm transition',
                            planTab === 'trash'
                              ? 'bg-ocean-500 text-white hover:bg-ocean-600'
                              : 'text-ocean-600 hover:bg-aqua-100',
                          )}
                        >
                          Trash
                        </Button>
                      </>
                    )}
                    {canUseKanban && (
                      <Button
                        variant="ghost"
                        onClick={() => setPlanTab('kanban')}
                        className={cx(
                          'rounded-2xl px-4 py-2 text-sm transition',
                          planTab === 'kanban'
                            ? 'bg-ocean-500 text-white hover:bg-ocean-600'
                            : 'text-ocean-600 hover:bg-aqua-100',
                        )}
                      >
                        Kanban
                      </Button>
                    )}
                    {canUseIdeas && (
                      <Button
                        variant="ghost"
                        onClick={() => setPlanTab('ideas')}
                        className={cx(
                          'rounded-2xl px-4 py-2 text-sm transition',
                          planTab === 'ideas'
                            ? 'bg-ocean-500 text-white hover:bg-ocean-600'
                            : 'text-ocean-600 hover:bg-aqua-100',
                        )}
                      >
                        Ideas
                      </Button>
                    )}
                    {canUseLinkedIn && (
                      <Button
                        variant="ghost"
                        onClick={() => setPlanTab('linkedin')}
                        className={cx(
                          'rounded-2xl px-4 py-2 text-sm transition',
                          planTab === 'linkedin'
                            ? 'bg-ocean-500 text-white hover:bg-ocean-600'
                            : 'text-ocean-600 hover:bg-aqua-100',
                        )}
                      >
                        LinkedIn
                      </Button>
                    )}
                    {canUseTesting && (
                      <Button
                        variant="ghost"
                        onClick={() => setPlanTab('testing')}
                        className={cx(
                          'rounded-2xl px-4 py-2 text-sm transition',
                          planTab === 'testing'
                            ? 'bg-ocean-500 text-white hover:bg-ocean-600'
                            : 'text-ocean-600 hover:bg-aqua-100',
                        )}
                      >
                        Testing Lab
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      if (!canUseCalendar) return;
                      setCurrentView('form');
                      setPlanTab('plan');
                      closeEntry();
                      try {
                        window.location.hash = '#create';
                      } catch {}
                    }}
                    className="gap-2"
                    disabled={!canUseCalendar}
                  >
                    <PlusIcon className="h-4 w-4 text-white" />
                    Create content
                  </Button>
                </div>
              </div>

              {(() => {
                switch (planTab) {
                  case 'plan':
                    if (!canUseCalendar) return null;
                    return (
                      <CalendarView
                        entries={entries}
                        ideas={ideas}
                        onApprove={toggleApprove}
                        onDelete={softDelete}
                        onOpenEntry={openEntry}
                        onImportPerformance={() => setPerformanceImportOpen(true)}
                        assetGoals={assetGoals}
                        onGoalsChange={setAssetGoals}
                      />
                    );
                  case 'trash':
                    if (!canUseCalendar) return null;
                    return (
                      <Card className="shadow-xl">
                        <CardHeader>
                          <CardTitle className="text-lg text-ocean-900">
                            Trash (30-day retention)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {trashed.length === 0 ? (
                            <p className="text-sm text-graystone-500">Nothing in the trash.</p>
                          ) : (
                            <div className="space-y-3">
                              {trashed.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="rounded-xl border border-graystone-200 bg-white px-4 py-3 shadow-sm"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge variant="outline">{entry.assetType}</Badge>
                                      <span className="text-sm font-medium text-graystone-700">
                                        {new Date(entry.date).toLocaleDateString()}
                                      </span>
                                      <span className="text-xs text-graystone-500">
                                        Deleted{' '}
                                        {entry.deletedAt
                                          ? new Date(entry.deletedAt).toLocaleString()
                                          : ''}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => restore(entry.id)}
                                      >
                                        <RotateCcwIcon className="h-4 w-4 text-graystone-600" />
                                        Restore
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => hardDelete(entry.id)}
                                      >
                                        <TrashIcon className="h-4 w-4 text-white" />
                                        Delete forever
                                      </Button>
                                    </div>
                                  </div>
                                  {entry.caption && (
                                    <p className="mt-2 line-clamp-2 text-sm text-graystone-600">
                                      {entry.caption}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  case 'kanban':
                    if (!canUseKanban) return null;
                    return (
                      <KanbanView
                        entries={entries}
                        onOpenEntry={openEntry}
                        onUpdateStatus={updateWorkflowStatus}
                      />
                    );
                  case 'ideas':
                    if (!canUseIdeas) return null;
                    return (
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <IdeaForm onSubmit={addIdea} currentUser={currentUser} />
                        <IdeasBoard
                          ideas={ideas}
                          onDelete={deleteIdea}
                          onCreateEntry={createEntryFromIdea}
                        />
                      </div>
                    );
                  case 'linkedin':
                    if (!canUseLinkedIn) return null;
                    return (
                      <LinkedInView
                        submissions={linkedinSubmissions}
                        currentUser={currentUser}
                        approverOptions={approverOptions}
                        onSubmit={addLinkedInSubmission}
                        onStatusChange={updateLinkedInStatus}
                      />
                    );
                  case 'testing':
                    if (!canUseTesting) return null;
                    return (
                      <TestingView
                        frameworks={testingFrameworks}
                        selectedFrameworkId={selectedFrameworkId}
                        selectedFramework={selectedFramework}
                        selectedFrameworkEntries={selectedFrameworkEntries}
                        frameworkEntryCounts={frameworkEntryCounts}
                        onAddFramework={addTestingFrameworkEntry}
                        onDeleteFramework={deleteTestingFramework}
                        onSelectFramework={setSelectedFrameworkId}
                        onOpenEntry={openEntry}
                      />
                    );
                  default:
                    return null;
                }
              })()}
            </div>
          )}

          {currentView === 'analytics' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AnalyticsView entries={entries} />
            </div>
          )}

          {currentView === 'engagement' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <EngagementView
                activities={engagementActivities}
                accounts={engagementAccounts}
                goals={engagementGoals}
                currentUser={currentUser}
                onAddActivity={(activity) => {
                  const newActivity = {
                    ...activity,
                    id: uuid(),
                    createdAt: new Date().toISOString(),
                    createdBy: currentUser,
                  };
                  setEngagementActivities((prev) => [newActivity, ...prev]);
                }}
                onDeleteActivity={(id) => {
                  setEngagementActivities((prev) => prev.filter((a) => a.id !== id));
                }}
                onAddAccount={(account) => {
                  const newAccount = {
                    ...account,
                    id: uuid(),
                    createdAt: new Date().toISOString(),
                    createdBy: currentUser,
                  };
                  setEngagementAccounts((prev) => [newAccount, ...prev]);
                }}
                onDeleteAccount={(id) => {
                  setEngagementAccounts((prev) => prev.filter((a) => a.id !== id));
                }}
                onUpdateAccount={(id, updates) => {
                  setEngagementAccounts((prev) =>
                    prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
                  );
                }}
                onUpdateGoals={(goals) => setEngagementGoals(goals)}
              />
            </div>
          )}

          {currentView === 'approvals' && canUseApprovals && (
            <ApprovalsView
              approvals={outstandingApprovals}
              outstandingCount={outstandingCount}
              unreadMentionsCount={unreadMentionsCount}
              canUseCalendar={canUseCalendar}
              onApprove={toggleApprove}
              onOpenEntry={openEntry}
              onBackToMenu={() => {
                setCurrentView('dashboard');
                setPlanTab('plan');
                closeEntry();
              }}
              onGoToCalendar={() => {
                if (!canUseCalendar) return;
                setCurrentView('plan');
                setPlanTab('plan');
              }}
              onCreateContent={() => {
                setCurrentView('form');
                setPlanTab('plan');
                closeEntry();
                try {
                  window.location.hash = '#create';
                } catch {}
              }}
              onSwitchUser={handleSignOut}
            />
          )}
          {currentView === 'admin' && currentUserIsAdmin && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentView('dashboard')}
                    className="self-start"
                  >
                    Dashboard
                  </Button>
                  <h2 className="text-2xl font-semibold text-ocean-700">Admin tools</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (window.api && window.api.enabled) {
                        apiGet('/api/health').catch(() => {});
                      }
                    }}
                  >
                    Ping server
                  </Button>
                  <Button
                    onClick={() => {
                      (async () => {
                        try {
                          if (window.api && window.api.enabled) {
                            const json = await apiGet('/api/audit?limit=200');
                            setAdminAudits(Array.isArray(json) ? json : []);
                          } else {
                            const raw = storageAvailable
                              ? window.localStorage.getItem('pm-content-audit-log')
                              : '[]';
                            const local = raw ? JSON.parse(raw) : [];
                            setAdminAudits(Array.isArray(local) ? local : []);
                          }
                        } catch {}
                      })();
                    }}
                  >
                    Refresh audits
                  </Button>
                </div>
              </div>

              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg text-ocean-900">Recent audit events</CardTitle>
                  <p className="mt-2 text-sm text-graystone-500">
                    Pulled from the server when connected; local fallback otherwise.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {adminAudits.length === 0 ? (
                      <p className="text-sm text-graystone-600">No audit events.</p>
                    ) : (
                      adminAudits.slice(0, 200).map((row) => (
                        <div
                          key={row.id}
                          className="flex items-center justify-between rounded-xl border border-graystone-200 bg-white px-3 py-2 text-sm"
                        >
                          <div className="flex flex-col">
                            <div className="font-medium text-ocean-800">
                              {row.action || 'event'}
                            </div>
                            <div className="text-[11px] text-graystone-600">
                              {row.user || 'Unknown'} · {row.entryId || '—'}
                            </div>
                          </div>
                          <div className="text-[11px] text-graystone-500">
                            {row.ts ? new Date(row.ts).toLocaleString() : ''}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg text-ocean-900">Approver directory</CardTitle>
                  <p className="mt-2 text-sm text-graystone-500">
                    Approvers are managed via the user roster. Enable the role on a teammate to list
                    them here.
                  </p>
                </CardHeader>
                <CardContent>
                  {approverOptions.length ? (
                    <div className="flex flex-wrap gap-2">
                      {approverOptions.map((name) => (
                        <span
                          key={name}
                          className="rounded-full bg-aqua-100 px-3 py-1 text-xs font-semibold text-ocean-700"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-graystone-500">
                      No approvers configured yet. Mark a user as an approver to add them.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg text-ocean-900">User roster</CardTitle>
                  <p className="mt-2 text-sm text-graystone-500">
                    Add new users (first + last + email); they’ll be emailed when created.
                  </p>
                </CardHeader>
                <CardContent>
                  {userAdminError ? (
                    <div className="mb-3 rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-700">
                      {userAdminError}
                    </div>
                  ) : null}
                  {userAdminSuccess ? (
                    <div className="mb-3 rounded-2xl bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
                      {userAdminSuccess}
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    {userList.length ? (
                      userList.map((user) => (
                        <div
                          key={user.id || user.email || user.name}
                          className="rounded-xl border border-graystone-200 bg-white px-3 py-3 text-sm text-graystone-700"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <div className="font-medium text-graystone-900">{user.name}</div>
                              <div className="text-[11px] text-graystone-500">
                                {user.email || 'No email'} ·{' '}
                                {user.status === 'disabled'
                                  ? 'Disabled'
                                  : user.invitePending || user.status === 'pending'
                                    ? 'Invite pending'
                                    : 'Active'}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-semibold uppercase text-graystone-500">
                                {user.isAdmin ? (
                                  <span className="rounded-full bg-ocean-50 px-2 py-0.5 text-ocean-700">
                                    Admin
                                  </span>
                                ) : null}
                                {user.isApprover ? (
                                  <span className="rounded-full bg-aqua-50 px-2 py-0.5 text-ocean-700">
                                    Approver
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleApproverRole(user)}
                              >
                                {user.isApprover ? 'Remove approver' : 'Make approver'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAccessModalUser(user)}
                              >
                                Access
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => removeUser(user)}>
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-graystone-500">No users configured yet.</p>
                    )}
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-3">
                    <Input
                      placeholder="First name"
                      value={newUserFirst}
                      onChange={(event) => setNewUserFirst(event.target.value)}
                      className="px-3 py-2"
                    />
                    <Input
                      placeholder="Last name"
                      value={newUserLast}
                      onChange={(event) => setNewUserLast(event.target.value)}
                      className="px-3 py-2"
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={newUserEmail}
                      onChange={(event) => setNewUserEmail(event.target.value)}
                      className="px-3 py-2"
                    />
                  </div>
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-graystone-600">Grant access to</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {FEATURE_OPTIONS.map((option) => {
                        const enabled = newUserFeatures.includes(option.key);
                        return (
                          <label
                            key={option.key}
                            className={cx(
                              'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold transition',
                              enabled
                                ? 'border-aqua-200 bg-aqua-100 text-ocean-700'
                                : 'border-graystone-200 bg-white text-graystone-600 hover:border-graystone-400',
                            )}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-graystone-300 text-aqua-500 focus:ring-aqua-300"
                              checked={enabled}
                              onChange={() => toggleNewUserFeature(option.key)}
                            />
                            <span>{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-graystone-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-graystone-300 text-aqua-500 focus:ring-aqua-300"
                        checked={newUserIsApprover}
                        onChange={(event) => setNewUserIsApprover(event.target.checked)}
                      />
                      Approver
                    </label>
                    <span className="text-[11px] text-graystone-500">
                      Approvers appear in the approvals picker and receive notifications.
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button
                      onClick={addUser}
                      disabled={!newUserFirst.trim() || !newUserLast.trim() || !newUserEmail.trim()}
                    >
                      Add user
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <EntryPreviewModal
            open={Boolean(previewEntry)}
            entry={previewEntry}
            onClose={closePreview}
            onEdit={handlePreviewEdit}
            currentUser={currentUser}
            currentUserEmail={currentUserEmail}
            reviewMode={previewIsReviewMode}
            canApprove={previewCanApprove}
            onApprove={toggleApprove}
            onUpdate={upsert}
            onNotifyMentions={handleMentionNotifications}
            onCommentAdded={handleCommentActivity}
            approverOptions={approverOptions}
            users={mentionUsers}
          />
          {viewingSnapshot ? (
            <EntryModal
              entry={viewingSnapshot}
              currentUser={currentUser}
              currentUserEmail={currentUserEmail}
              onClose={closeEntry}
              onApprove={toggleApprove}
              onDelete={softDelete}
              onClone={cloneEntry}
              onSave={upsert}
              onUpdate={upsert}
              onNotifyMentions={handleMentionNotifications}
              onCommentAdded={handleCommentActivity}
              testingFrameworks={testingFrameworks}
              approverOptions={approverOptions}
              users={mentionUsers}
            />
          ) : null}
          {canUseApprovals && (
            <ApprovalsModal
              open={approvalsModalOpen}
              onClose={() => setApprovalsModalOpen(false)}
              approvals={outstandingApprovals}
              onOpenEntry={(id) => {
                setApprovalsModalOpen(false);
                openEntry(id);
              }}
              onApprove={(id) => toggleApprove(id)}
            />
          )}
          {currentUserIsAdmin && (
            <AccessModal
              open={Boolean(accessModalUser)}
              user={accessModalUser}
              features={accessModalUser?.features || DEFAULT_FEATURES}
              onClose={() => setAccessModalUser(null)}
              onSave={handleAccessSave}
            />
          )}
          <ChangePasswordModal
            open={changePasswordOpen}
            requiresCurrent={currentUserHasPassword}
            onClose={() => setChangePasswordOpen(false)}
            onSubmit={handleChangePassword}
          />
          {syncToast ? (
            <div className="fixed bottom-6 right-6 z-50 max-w-xs">
              <div
                className={cx(
                  'rounded-2xl border px-4 py-3 text-sm shadow-xl',
                  syncToast.tone === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-amber-200 bg-amber-50 text-amber-900',
                )}
              >
                {syncToast.message}
              </div>
            </div>
          ) : null}
          <GuidelinesModal
            open={guidelinesOpen}
            guidelines={guidelines}
            onClose={() => setGuidelinesOpen(false)}
            onSave={handleGuidelinesSave}
          />
          <PerformanceImportModal
            open={performanceImportOpen}
            onClose={() => setPerformanceImportOpen(false)}
            onImport={importPerformanceDataset}
          />
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<ContentDashboard />);
}
