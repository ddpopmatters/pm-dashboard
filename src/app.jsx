import React from 'react';
import { createRoot } from 'react-dom/client';
import { LoginScreen } from './components/auth/LoginScreen';
import { Sidebar } from './components/layout';
import { CalendarView } from './features/calendar/CalendarView';
import { ApprovalsView, ApprovalsModal } from './features/approvals';
import { KanbanView } from './features/kanban';
import { AdminPanel } from './features/admin';
import { AnalyticsView } from './features/analytics/AnalyticsView';
import { DashboardView } from './features/dashboard';
import { EngagementView, DEFAULT_ENGAGEMENT_GOALS } from './features/engagement/EngagementView';
import {
  PublishSettingsPanel,
  DEFAULT_PUBLISH_SETTINGS,
  triggerPublish,
  initializePublishStatus,
  getAggregatePublishStatus,
  canPublish,
  canPostAgain,
} from './features/publishing';
import { useApi } from './hooks/useApi';
import {
  ALL_PLATFORMS,
  CAMPAIGNS,
  CHECKLIST_ITEMS,
  CONTENT_PILLARS,
  DEFAULT_APPROVERS,
  DEFAULT_USERS,
  FEATURE_OPTIONS,
  KANBAN_STATUSES,
  PLAN_TAB_FEATURES,
  PLAN_TAB_ORDER,
  PLATFORM_TIPS,
  WORKFLOW_STAGES,
} from './constants';
import {
  cx,
  uuid,
  daysInMonth,
  monthStartISO,
  monthEndISO,
  isOlderThanDays,
  ensureArray,
  normalizeEmail,
  extractMentions,
  storageAvailable,
  STORAGE_KEYS,
  escapeHtml,
  ensurePeopleArray,
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
  computeStatusDetail,
  getPlatformCaption,
  isImageMedia,
  entrySignature,
  determineWorkflowStatus,
  hasApproverRelevantChanges,
} from './lib/sanitizers';
import { resolveMentionCandidate, computeMentionState } from './lib/mentions';
import { entryDescriptor, entryReviewLink, buildEntryEmailPayload } from './lib/email';
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
  ArrowUpIcon,
  ArrowPathIcon,
} from './components/common';
import { ChangePasswordModal } from './components/auth';
import { PerformanceImportModal } from './features/performance';
import { GuidelinesModal } from './features/guidelines';
import { IdeasBoard, IdeaAttachment, IdeaForm } from './features/ideas';
import { MiniCalendar, MonthGrid } from './features/calendar';
import { CopyCheckSection } from './features/copy-check';
import { SocialPreview } from './features/social';
import { ApproverMulti, EntryForm, EntryModal, EntryPreviewModal } from './features/entry';
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
  loadInfluencers,
  saveInfluencers,
} from './lib/storage';
import { InfluencersView, InfluencerModal } from './features/influencers';

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

function ContentDashboard() {
  // Destructure stable method references to avoid re-renders when loading/error state changes
  const { get: apiGet, post: apiPost, put: apiPut, del: apiDel } = useApi();
  const [entries, setEntries] = useState([]);
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [viewingId, setViewingId] = useState(null);
  const [viewingSnapshot, setViewingSnapshot] = useState(null);
  const [notifications, setNotifications] = useState(() => loadNotifications());
  const [ideas, setIdeas] = useState(() => loadIdeas());
  const [adminAudits, setAdminAudits] = useState([]);
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
  const [dailyPostTarget, setDailyPostTarget] = useState(() => {
    try {
      const stored = window.localStorage.getItem('pm-daily-post-target');
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [guidelines, setGuidelines] = useState(() => loadGuidelines());
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [approverDirectory, setApproverDirectory] = useState(DEFAULT_APPROVERS);
  const [userList, setUserList] = useState(() => []);
  const [engagementActivities, setEngagementActivities] = useState([]);
  const [engagementAccounts, setEngagementAccounts] = useState([]);
  const [engagementGoals, setEngagementGoals] = useState(() => DEFAULT_ENGAGEMENT_GOALS);
  const [publishSettings, setPublishSettings] = useState(() => {
    try {
      const stored = window.localStorage.getItem('pm-publish-settings');
      return stored
        ? { ...DEFAULT_PUBLISH_SETTINGS, ...JSON.parse(stored) }
        : DEFAULT_PUBLISH_SETTINGS;
    } catch {
      return DEFAULT_PUBLISH_SETTINGS;
    }
  });
  const [influencers, setInfluencers] = useState(() => loadInfluencers());
  const [influencerModalOpen, setInfluencerModalOpen] = useState(false);
  const [editingInfluencerId, setEditingInfluencerId] = useState(null);
  const [filterEvergreen, setFilterEvergreen] = useState(false);
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
  const canUseInfluencers = true; // Show to everyone
  const menuHasContent =
    canUseCalendar ||
    canUseKanban ||
    canUseApprovals ||
    canUseIdeas ||
    canUseInfluencers ||
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

  // Persist publish settings to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem('pm-publish-settings', JSON.stringify(publishSettings));
    } catch {
      // Ignore storage errors
    }
  }, [publishSettings]);

  useEffect(() => {
    if (currentView === 'form' && !canUseCalendar) {
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
  }, [currentView, hasFeature, currentUserIsAdmin, canUseCalendar]);

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
    setFilterEvergreen(false);
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
  }, []);

  // If server is available, hydrate from API once authenticated; fall back to local on failure
  useEffect(() => {
    if (authStatus !== 'ready') return;
    let cancelled = false;
    (async () => {
      try {
        if (window.api && window.api.enabled) {
          const wantsIdeas = canUseIdeas;
          const wantsUsers = currentUserIsAdmin;
          const [serverEntries, serverIdeas, serverGuidelines, serverUsers] = await Promise.all([
            window.api.listEntries().catch(() => []),
            wantsIdeas ? window.api.listIdeas().catch(() => []) : Promise.resolve([]),
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
  }, [authStatus, canUseIdeas, currentUserIsAdmin]);

  // Also hydrate when the api client announces readiness
  useEffect(() => {
    const onReady = (e) => {
      if (e?.detail?.enabled && syncQueue.length) {
        retryAllSync();
      }
      if (e?.detail?.enabled && authStatus === 'ready') {
        const wantsIdeas = canUseIdeas;
        const wantsUsers = currentUserIsAdmin;
        Promise.all([
          window.api.listEntries().catch(() => []),
          wantsIdeas ? window.api.listIdeas().catch(() => []) : Promise.resolve([]),
          window.api.getGuidelines
            ? window.api.getGuidelines().catch(() => null)
            : Promise.resolve(null),
          wantsUsers && window.api.listUsers
            ? window.api.listUsers().catch(() => [])
            : Promise.resolve([]),
        ])
          .then(([serverEntries, serverIdeas, serverGuidelines, serverUsers]) => {
            if (Array.isArray(serverEntries)) setEntries(serverEntries);
            if (wantsIdeas) {
              if (Array.isArray(serverIdeas)) setIdeas(serverIdeas);
            } else {
              setIdeas([]);
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
          })
          .catch(() => {});
      }
    };
    window.addEventListener('pm-api-ready', onReady);
    return () => window.removeEventListener('pm-api-ready', onReady);
  }, [authStatus, canUseIdeas, currentUserIsAdmin, retryAllSync, syncQueue.length]);

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
    saveInfluencers(influencers);
  }, [influencers]);

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
    if (filterEvergreen) count += 1;
    return count;
  }, [
    filterType,
    filterStatus,
    filterWorkflow,
    filterPlatforms,
    filterQuery,
    filterOverdue,
    filterEvergreen,
  ]);

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
      .filter((entry) => (!filterEvergreen ? true : entry.evergreen))
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
    filterEvergreen,
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
      id: 'approvals',
      title: 'Your Approvals',
      description: 'Track what still needs your sign-off and clear the queue in one pass.',
      cta: 'View queue',
      onClick: () => {
        setCurrentView('plan');
        setPlanTab('approvals');
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

  // Publish an entry to Zapier webhook
  const handlePublishEntry = async (id) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry || !canPublish(entry)) return;

    // Initialize publish status for all platforms (set to 'publishing')
    const newPublishStatus = initializePublishStatus(entry.platforms);
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, publishStatus: newPublishStatus } : e)),
    );

    // Trigger the webhook
    const result = await triggerPublish(entry, publishSettings);
    const timestamp = new Date().toISOString();

    if (result.success) {
      // Mark all as published (with no-cors, we assume success if no error)
      const publishedStatus = {};
      entry.platforms.forEach((platform) => {
        publishedStatus[platform] = {
          status: 'published',
          url: null, // URL would come from callback
          error: null,
          timestamp,
        };
      });

      const updates = {
        publishStatus: publishedStatus,
        workflowStatus: 'Published',
        publishedAt: timestamp,
      };

      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));

      // Persist to API if available
      if (window.api?.updateEntry) {
        try {
          await window.api.updateEntry(id, updates);
        } catch (err) {
          console.error('Failed to persist publish status:', err);
        }
      }
    } else {
      // Mark all as failed
      const failedStatus = {};
      entry.platforms.forEach((platform) => {
        failedStatus[platform] = {
          status: 'failed',
          url: null,
          error: result.error || 'Failed to publish',
          timestamp,
        };
      });

      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, publishStatus: failedStatus } : e)),
      );

      // Persist failure status to API if available
      if (window.api?.updateEntry) {
        try {
          await window.api.updateEntry(id, { publishStatus: failedStatus });
        } catch (err) {
          console.error('Failed to persist publish failure:', err);
        }
      }
    }

    appendAudit({
      user: currentUser,
      entryId: id,
      action: 'entry-publish-trigger',
    });
  };

  // Clone an entry for "Post Again"
  const handlePostAgain = (id) => {
    const original = entries.find((e) => e.id === id);
    if (!original) return;

    const newId = uuid();
    const today = new Date().toISOString().split('T')[0];
    const cloned = {
      ...sanitizeEntry(original),
      id: newId,
      date: today,
      status: 'Pending',
      workflowStatus: 'Draft',
      approvedAt: null,
      publishStatus: {},
      publishedAt: null,
      variantOfId: original.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _isNew: true,
    };
    cloned.statusDetail = computeStatusDetail(cloned);
    setEntries((prev) => [...prev, cloned]);
    setViewingId(newId);
    setViewingSnapshot(cloned);

    appendAudit({
      user: currentUser,
      entryId: newId,
      action: 'entry-post-again',
      meta: { originalEntryId: original.id },
    });
  };

  // Toggle evergreen flag on entry
  const handleToggleEvergreen = (id) => {
    const timestamp = new Date().toISOString();
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry;
        return { ...entry, evergreen: !entry.evergreen, updatedAt: timestamp };
      }),
    );

    const entry = entries.find((e) => e.id === id);
    if (entry && window.api?.updateEntry) {
      runSyncTask(`Toggle evergreen (${id})`, () =>
        window.api.updateEntry(id, { evergreen: !entry.evergreen }),
      );
    }
  };

  // Change entry date via drag-and-drop
  const handleEntryDateChange = (id, newDate) => {
    const timestamp = new Date().toISOString();
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry;
        return { ...entry, date: newDate, updatedAt: timestamp };
      }),
    );

    if (window.api?.updateEntry) {
      runSyncTask(`Change date (${id})`, () => window.api.updateEntry(id, { date: newDate }));
    }

    appendAudit({
      user: currentUser,
      entryId: id,
      action: 'entry-date-changed',
      data: { newDate },
    });
  };

  // Update daily post target for content gap flagging
  const handleDailyPostTargetChange = (target) => {
    setDailyPostTarget(target);
    try {
      window.localStorage.setItem('pm-daily-post-target', String(target));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Bulk date shift for multiple entries
  const handleBulkDateShift = (entryIds, daysDelta) => {
    const timestamp = new Date().toISOString();
    // Use local date parsing/formatting to avoid timezone issues
    const shiftDate = (dateStr) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      d.setDate(d.getDate() + daysDelta);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };

    // Use Set for O(1) lookups instead of O(n) includes()
    const entryIdSet = new Set(entryIds);

    // Build a map of id→originalDate for API persistence (before state update)
    const originalDates = new Map();
    entries.forEach((e) => {
      if (entryIdSet.has(e.id)) {
        originalDates.set(e.id, e.date);
      }
    });

    setEntries((prev) =>
      prev.map((entry) => {
        if (!entryIdSet.has(entry.id)) return entry;
        return { ...entry, date: shiftDate(entry.date), updatedAt: timestamp };
      }),
    );

    // Persist changes to API using precomputed map (O(n) instead of O(n^2))
    if (window.api?.updateEntry) {
      originalDates.forEach((originalDate, id) => {
        runSyncTask(`Shift date (${id})`, () =>
          window.api.updateEntry(id, { date: shiftDate(originalDate) }),
        );
      });
    }

    appendAudit({
      user: currentUser,
      action: 'bulk-date-shift',
      data: { entryIds, daysDelta },
    });
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

  const handleAddInfluencer = useCallback(
    (data) => {
      const newInfluencer = {
        ...data,
        id: uuid(),
        createdAt: new Date().toISOString(),
        createdBy: currentUser,
      };
      setInfluencers((prev) => [newInfluencer, ...prev]);
    },
    [currentUser],
  );

  const handleUpdateInfluencer = useCallback((updated) => {
    setInfluencers((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }, []);

  const handleDeleteInfluencer = useCallback((id) => {
    setInfluencers((prev) => prev.filter((i) => i.id !== id));
    // Also unlink any entries
    setEntries((prev) =>
      prev.map((e) => (e.influencerId === id ? { ...e, influencerId: undefined } : e)),
    );
  }, []);

  const handleOpenInfluencerDetail = useCallback((id) => {
    setEditingInfluencerId(id === 'new' ? null : id);
    setInfluencerModalOpen(true);
  }, []);

  const handleLinkEntryToInfluencer = useCallback((influencerId, entryId) => {
    setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, influencerId } : e)));
  }, []);

  const handleUnlinkEntryFromInfluencer = useCallback((entryId) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, influencerId: undefined } : e)),
    );
  }, []);

  // Handle sidebar navigation - must be defined before conditional returns
  const handleSidebarNavigate = useCallback(
    (view) => {
      closeEntry();

      // Map sidebar items to view/tab combinations
      const viewMap = {
        dashboard: { view: 'dashboard', tab: 'plan' },
        analytics: { view: 'analytics', tab: 'plan' },
        engagement: { view: 'engagement', tab: 'plan' },
        content: { view: 'plan', tab: 'plan' },
        ideas: { view: 'plan', tab: 'ideas' },
        influencers: { view: 'influencers', tab: 'plan' },
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
        canUseInfluencers={canUseInfluencers}
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
            <DashboardView
              entries={entries}
              currentUser={currentUser}
              assetGoals={assetGoals}
              engagementActivities={engagementActivities}
              engagementGoals={engagementGoals}
              pendingApprovalCount={outstandingCount}
              onOpenEntry={openEntry}
              onNavigate={(view, tab) => {
                setCurrentView(view);
                if (tab) setPlanTab(tab);
                closeEntry();
              }}
              onOpenGuidelines={() => setGuidelinesOpen(true)}
              onOpenApprovals={() => setApprovalsModalOpen(true)}
            />
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
                        Board
                      </Button>
                    )}
                    {canUseApprovals && (
                      <Button
                        variant="ghost"
                        onClick={() => setPlanTab('approvals')}
                        className={cx(
                          'rounded-2xl px-4 py-2 text-sm transition',
                          planTab === 'approvals'
                            ? 'bg-ocean-500 text-white hover:bg-ocean-600'
                            : 'text-ocean-600 hover:bg-aqua-100',
                        )}
                      >
                        Approvals
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
                        onEntryDateChange={handleEntryDateChange}
                        dailyPostTarget={dailyPostTarget}
                        onDailyPostTargetChange={handleDailyPostTargetChange}
                        onBulkDateShift={handleBulkDateShift}
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
                  case 'approvals':
                    if (!canUseApprovals) return null;
                    return (
                      <ApprovalsView
                        approvals={outstandingApprovals}
                        outstandingCount={outstandingCount}
                        unreadMentionsCount={unreadMentionsCount}
                        canUseCalendar={canUseCalendar}
                        onApprove={toggleApprove}
                        onOpenEntry={openEntry}
                        onBackToMenu={() => setPlanTab('plan')}
                        onGoToCalendar={() => setPlanTab('plan')}
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

          {currentView === 'influencers' && canUseInfluencers && (
            <InfluencersView
              influencers={influencers}
              entries={entries}
              currentUser={currentUser}
              onAdd={handleAddInfluencer}
              onUpdate={handleUpdateInfluencer}
              onDelete={handleDeleteInfluencer}
              onOpenDetail={handleOpenInfluencerDetail}
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

              {/* Publishing Settings */}
              <PublishSettingsPanel settings={publishSettings} onUpdate={setPublishSettings} />
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
              onPublish={handlePublishEntry}
              onPostAgain={handlePostAgain}
              onToggleEvergreen={handleToggleEvergreen}
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
          <InfluencerModal
            open={influencerModalOpen}
            influencer={
              editingInfluencerId
                ? influencers.find((i) => i.id === editingInfluencerId) || null
                : null
            }
            entries={entries}
            currentUser={currentUser}
            onClose={() => {
              setInfluencerModalOpen(false);
              setEditingInfluencerId(null);
            }}
            onSave={(inf) => {
              if (editingInfluencerId) {
                handleUpdateInfluencer(inf);
              } else {
                handleAddInfluencer(inf);
              }
            }}
            onDelete={handleDeleteInfluencer}
            onLinkEntry={handleLinkEntryToInfluencer}
            onUnlinkEntry={handleUnlinkEntryFromInfluencer}
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
