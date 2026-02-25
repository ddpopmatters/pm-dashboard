import {
  ASSET_TYPES,
  IDEA_TYPES,
  KANBAN_STATUSES,
  LINKEDIN_STATUSES,
  TESTING_STATUSES,
  LINKEDIN_TYPES,
  CAMPAIGNS,
  CONTENT_PILLARS,
  ALL_PLATFORMS,
  PLATFORM_DEFAULT_LIMITS,
  DEFAULT_GUIDELINES,
  CHECKLIST_ITEMS,
  WORKFLOW_STAGES,
  PERFORMANCE_HEADER_KEYS,
  PERFORMANCE_IGNORED_METRIC_KEYS,
} from "./constants.js";

export const cx = (...xs) => xs.filter(Boolean).join(" ");
export const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
export const monthStartISO = (d) =>
  new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
export const monthEndISO = (d) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
export const uuid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
export const isOlderThanDays = (iso, days) =>
  Date.now() - new Date(iso).getTime() > days * 864e5;
export const isoFromParts = (year, monthIndex, day) =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
export const ensureArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

export const createEmptyChecklist = () => {
  const checklist = {};
  CHECKLIST_ITEMS.forEach(({ key }) => {
    checklist[key] = false;
  });
  return checklist;
};

export const ensureChecklist = (value) => {
  const base = createEmptyChecklist();
  if (value && typeof value === "object") {
    Object.keys(base).forEach((key) => {
      base[key] = Boolean(value[key]);
    });
  }
  return base;
};

export const ensureComments = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((comment) => comment && typeof comment === "object" && comment.body)
    .map((comment) => ({
      id: comment.id || uuid(),
      author: comment.author || "Unknown",
      body: comment.body,
      createdAt: comment.createdAt || new Date().toISOString(),
      mentions:
        Array.isArray(comment.mentions) && comment.mentions.length
          ? comment.mentions
          : extractMentions(comment.body),
    }));
};

export const ensureAnalytics = (value) => {
  if (!value || typeof value !== "object") return {};
  const analytics = {};
  Object.entries(value).forEach(([platform, metrics]) => {
    if (!platform) return;
    if (!metrics || typeof metrics !== "object") return;
    const cleaned = {};
    Object.entries(metrics).forEach(([key, metricValue]) => {
      if (metricValue === undefined || metricValue === null || metricValue === "") return;
      cleaned[key] = metricValue;
    });
    analytics[platform] = cleaned;
  });
  return analytics;
};

export const PLATFORM_ALIAS_MAP = (() => {
  const map = {};
  const add = (alias, canonical) => {
    if (!alias) return;
    const key = alias.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!key) return;
    map[key] = canonical;
  };
  ALL_PLATFORMS.forEach((platform) => {
    add(platform, platform);
  });
  add("twitter", "X/Twitter");
  add("xtwitter", "X/Twitter");
  add("x", "X/Twitter");
  add("linkedin", "LinkedIn");
  add("facebook", "Facebook");
  add("fb", "Facebook");
  add("instagram", "Instagram");
  add("ig", "Instagram");
  add("tiktok", "TikTok");
  add("youtube", "YouTube");
  add("yt", "YouTube");
  add("threads", "Threads");
  add("pinterest", "Pinterest");
  return map;
})();

export const normalizePlatform = (value) => {
  if (!value) return "";
  const cleaned = String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!cleaned) return "";
  return PLATFORM_ALIAS_MAP[cleaned] || "";
};

export const splitCSVLine = (line) => {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
};

export const parseCSV = (text) => {
  if (!text || typeof text !== "string") {
    return { headers: [], records: [] };
  }
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (!lines.length) {
    return { headers: [], records: [] };
  }
  const headers = splitCSVLine(lines[0]).map((header) => header.trim());
  const records = lines.slice(1).map((line, index) => {
    const values = splitCSVLine(line);
    while (values.length < headers.length) values.push("");
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = (values[idx] ?? "").trim();
    });
    return { rowNumber: index + 2, record };
  });
  return { headers, records };
};

export const normalizeHeaderKey = (key) =>
  key.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");

export const normalizeDateValue = (raw) => {
  if (!raw) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

export const mergePerformanceData = (entries, dataset) => {
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
  const hasEntryId = normalizedHeaders.some((key) =>
    PERFORMANCE_HEADER_KEYS.entryId.includes(key),
  );
  const hasDate = normalizedHeaders.some((key) =>
    PERFORMANCE_HEADER_KEYS.date.includes(key),
  );
  const hasPlatform = normalizedHeaders.some((key) =>
    PERFORMANCE_HEADER_KEYS.platform.includes(key),
  );
  if (!hasEntryId && (!hasDate || !hasPlatform)) {
    summary.errors.push({
      rowNumber: 1,
      reason: "CSV must include an entry_id column or both date and platform columns.",
    });
    return { nextEntries: entries, summary };
  }
  const metricKeys = normalizedHeaders.filter(
    (key) => !PERFORMANCE_IGNORED_METRIC_KEYS.has(key),
  );
  if (!metricKeys.length) {
    summary.errors.push({
      rowNumber: 1,
      reason: "No metric columns detected in the upload.",
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
    return "";
  };

  let mutated = false;
  const timestamp = new Date().toISOString();

  records.forEach(({ rowNumber, record }) => {
    const normalizedRow = {};
    headers.forEach((header, idx) => {
      const key = normalizedHeaders[idx];
      normalizedRow[key] = record[header] ?? "";
    });

    const entryIdValue = getFirstValue(normalizedRow, PERFORMANCE_HEADER_KEYS.entryId);
    let entryIndex = -1;
    let matchedEntry = null;
    let platform = "";

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
          reason: "Row is missing a valid date value.",
        });
        return;
      }
      const platformRaw = getFirstValue(normalizedRow, PERFORMANCE_HEADER_KEYS.platform);
      platform = normalizePlatform(platformRaw);
      if (!platform) {
        summary.errors.push({
          rowNumber,
          reason: "Row is missing a recognizable platform value.",
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
        const snippet = getFirstValue(
          normalizedRow,
          PERFORMANCE_HEADER_KEYS.caption,
        ).toLowerCase();
        const link = getFirstValue(
          normalizedRow,
          PERFORMANCE_HEADER_KEYS.url,
        ).toLowerCase();
        let filtered = candidates;
        if (snippet) {
          filtered = filtered.filter((entry) =>
            (entry.caption || "").toLowerCase().includes(snippet),
          );
        }
        if (filtered.length !== 1 && link) {
          filtered = candidates.filter((entry) =>
            (entry.url || "").toLowerCase().includes(link),
          );
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
        reason: "Unable to match this row to a calendar item.",
      });
      return;
    }

    const metricPayload = {};
    metricKeys.forEach((key) => {
      const rawValue = normalizedRow[key];
      if (rawValue === undefined || rawValue === null || rawValue === "") return;
      const label = headerLabels[key] || key;
      const cleanedNumeric =
        typeof rawValue === "string" ? rawValue.replace(/,/g, "") : rawValue;
      const numericValue =
        typeof cleanedNumeric === "string" && cleanedNumeric !== ""
          ? Number(cleanedNumeric)
          : Number.isFinite(cleanedNumeric)
            ? cleanedNumeric
            : NaN;
      if (typeof rawValue === "string" && rawValue.trim().endsWith("%")) {
        metricPayload[label] = rawValue.trim();
        return;
      }
      if (!Number.isNaN(numericValue) && rawValue !== "") {
        metricPayload[label] = numericValue;
      } else {
        metricPayload[label] = rawValue;
      }
    });

    if (!Object.keys(metricPayload).length) {
      summary.errors.push({
        rowNumber,
        reason: "No metric values detected in this row.",
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

export const extractMentions = (text) => {
  if (!text) return [];
  const matches = text.match(/@([\w\s.&'-]+)/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((token) => token.trim())));
};

export const ensurePlatformCaptions = (value) => {
  if (!value || typeof value !== "object") return {};
  const cleaned = {};
  Object.entries(value).forEach(([key, val]) => {
    if (typeof val === "string") cleaned[key] = val;
  });
  return cleaned;
};

export const ensurePeopleArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((name) => (typeof name === "string" ? name.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
};

export const ensureLinksArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((link) => (typeof link === "string" ? link.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\n+/)
      .map((link) => link.trim())
      .filter(Boolean);
  }
  return [];
};

export const ensureAttachments = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((attachment) => {
      if (!attachment || typeof attachment !== "object") return null;
      const name = typeof attachment.name === "string" ? attachment.name : "Attachment";
      const dataUrl = typeof attachment.dataUrl === "string" ? attachment.dataUrl : "";
      const type = typeof attachment.type === "string" ? attachment.type : "";
      const size = typeof attachment.size === "number" ? attachment.size : 0;
      if (!dataUrl) return null;
      return { id: attachment.id || uuid(), name, dataUrl, type, size };
    })
    .filter(Boolean);
};

export const normalizeGuidelines = (raw) => {
  if (!raw || typeof raw !== "object") {
    return {
      ...DEFAULT_GUIDELINES,
      charLimits: { ...DEFAULT_GUIDELINES.charLimits },
    };
  }
  const bannedWords = Array.isArray(raw.bannedWords)
    ? raw.bannedWords.map((word) => String(word).trim()).filter(Boolean)
    : [...DEFAULT_GUIDELINES.bannedWords];
  const requiredPhrases = Array.isArray(raw.requiredPhrases)
    ? raw.requiredPhrases.map((p) => String(p).trim()).filter(Boolean)
    : [...DEFAULT_GUIDELINES.requiredPhrases];
  const languageGuide =
    typeof raw.languageGuide === "string"
      ? raw.languageGuide
      : DEFAULT_GUIDELINES.languageGuide;
  const hashtagTips =
    typeof raw.hashtagTips === "string" ? raw.hashtagTips : DEFAULT_GUIDELINES.hashtagTips;
  const charLimits = { ...DEFAULT_GUIDELINES.charLimits, ...(raw.charLimits || {}) };
  Object.keys(charLimits).forEach((platform) => {
    const value = Number(charLimits[platform]);
    charLimits[platform] =
      Number.isFinite(value) && value > 0 ? value : PLATFORM_DEFAULT_LIMITS[platform] || 500;
  });
  const teamsWebhookUrl =
    typeof raw.teamsWebhookUrl === "string" ? raw.teamsWebhookUrl : "";
  return {
    bannedWords,
    requiredPhrases,
    languageGuide,
    hashtagTips,
    charLimits,
    teamsWebhookUrl,
  };
};

export const resolveMentionCandidate = (candidate, names) => {
  if (!candidate) return null;
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  const condensed = lower.replace(/\s+/g, "");
  for (const name of names) {
    if (!name) continue;
    const clean = String(name).trim();
    if (!clean) continue;
    const lowerName = clean.toLowerCase();
    if (lowerName === lower) return clean;
    if (lowerName.replace(/\s+/g, "") === condensed) return clean;
    if (lowerName.startsWith(lower)) return clean;
    const parts = clean.split(/\s+/).map((part) => part.toLowerCase());
    if (parts.includes(lower)) return clean;
  }
  return null;
};

export const monthKeyFromDate = (iso) => {
  if (!iso) return "";
  return iso.slice(0, 7);
};

export const sanitizeIdea = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const ideaType = IDEA_TYPES.includes(raw.type) ? raw.type : IDEA_TYPES[0];
  const links = ensureLinksArray(raw.links);
  const attachments = ensureAttachments(raw.attachments);
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const notes = typeof raw.notes === "string" ? raw.notes : "";
  const createdBy = typeof raw.createdBy === "string" ? raw.createdBy : "";
  const createdAt = raw.createdAt || new Date().toISOString();
  const targetDate =
    raw.targetDate && typeof raw.targetDate === "string" ? raw.targetDate : "";
  const targetMonth =
    raw.targetMonth && typeof raw.targetMonth === "string"
      ? raw.targetMonth
      : targetDate
        ? monthKeyFromDate(targetDate)
        : "";
  return {
    id: raw.id || uuid(),
    type: ideaType,
    title,
    notes,
    links,
    attachments,
    inspiration: typeof raw.inspiration === "string" ? raw.inspiration : "",
    createdBy,
    createdAt,
    targetDate,
    targetMonth,
  };
};

export const notificationKey = (type, entryId, user, meta = {}) => {
  const commentId = meta.commentId || "";
  return [type, entryId || "none", user || "", commentId].join(":");
};

export const sanitizeEntry = (entry) => {
  if (!entry || typeof entry !== "object") return null;
  const approvers = ensurePeopleArray(entry.approvers ?? entry.approver);
  const platforms = ensureArray(entry.platforms);
  const assetType = ASSET_TYPES.includes(entry.assetType) ? entry.assetType : "Design";
  const status =
    typeof entry.status === "string" && entry.status.toLowerCase() === "approved"
      ? "Approved"
      : "Pending";
  const createdAt = entry.createdAt || new Date().toISOString();
  const updatedAt = entry.updatedAt || createdAt;
  const author =
    typeof entry.author === "string"
      ? entry.author.trim()
      : entry.author
        ? String(entry.author).trim()
        : "";
  const caption = typeof entry.caption === "string" ? entry.caption : "";
  const url =
    typeof entry.url === "string"
      ? entry.url.trim()
      : entry.url
        ? String(entry.url).trim()
        : "";
  const firstComment =
    typeof entry.firstComment === "string" ? entry.firstComment : "";

  const base = {
    ...entry,
    id: entry.id || uuid(),
    date: entry.date || new Date().toISOString().slice(0, 10),
    status,
    approvers,
    author,
    caption,
    url,
    campaign: CAMPAIGNS.includes(entry.campaign) ? entry.campaign : "",
    contentPillar: CONTENT_PILLARS.includes(entry.contentPillar)
      ? entry.contentPillar
      : "",
    analytics: ensureAnalytics(entry.analytics),
    analyticsUpdatedAt:
      typeof entry.analyticsUpdatedAt === "string" ? entry.analyticsUpdatedAt : "",
    testingFrameworkId:
      typeof entry.testingFrameworkId === "string" ? entry.testingFrameworkId : "",
    testingFrameworkName:
      typeof entry.testingFrameworkName === "string" ? entry.testingFrameworkName : "",
    assetType,
    script:
      assetType === "Video" && typeof entry.script === "string" ? entry.script : undefined,
    designCopy:
      assetType === "Design" && typeof entry.designCopy === "string"
        ? entry.designCopy
        : undefined,
    carouselSlides:
      assetType === "Carousel" && Array.isArray(entry.carouselSlides)
        ? entry.carouselSlides.map((slide) => (typeof slide === "string" ? slide : ""))
        : assetType === "Carousel"
          ? ["", "", ""]
          : undefined,
    firstComment,
    checklist: ensureChecklist(entry.checklist),
    comments: ensureComments(entry.comments),
    platformCaptions: ensurePlatformCaptions(entry.platformCaptions),
    platforms,
    previewUrl: entry.previewUrl ? String(entry.previewUrl) : "",
    createdAt,
    updatedAt,
    workflowStatus: KANBAN_STATUSES.includes(entry.workflowStatus)
      ? entry.workflowStatus
      : status === "Approved"
        ? "Approved"
        : entry.statusDetail === "Scheduled"
          ? "Scheduled"
          : "Draft",
  };

  if (assetType !== "Video") base.script = undefined;
  if (assetType !== "Design") base.designCopy = undefined;
  if (assetType !== "Carousel") base.carouselSlides = undefined;

  return base;
};

export const sanitizeLinkedInSubmission = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const submissionType = LINKEDIN_TYPES.includes(raw.submissionType)
    ? raw.submissionType
    : LINKEDIN_TYPES[0];
  const status = LINKEDIN_STATUSES.includes(raw.status)
    ? raw.status
    : LINKEDIN_STATUSES[0];
  const links = ensureLinksArray(raw.links);
  const attachments = ensureAttachments(raw.attachments);
  const postCopy = typeof raw.postCopy === "string" ? raw.postCopy : raw.copy || "";
  const comments = typeof raw.comments === "string" ? raw.comments : raw.callToAction || "";
  const owner = typeof raw.owner === "string" ? raw.owner.trim() : "";
  const submitter = typeof raw.submitter === "string" ? raw.submitter.trim() : "";
  const createdAt = raw.createdAt || new Date().toISOString();
  const targetDate =
    raw.targetDate && typeof raw.targetDate === "string" ? raw.targetDate : "";
  const titleSource = typeof raw.title === "string" ? raw.title : postCopy;
  const title = titleSource ? titleSource.trim() : "LinkedIn draft";
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

export const sanitizeTestingFramework = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name) return null;
  const hypothesis = typeof raw.hypothesis === "string" ? raw.hypothesis : "";
  const audience = typeof raw.audience === "string" ? raw.audience : "";
  const metric = typeof raw.metric === "string" ? raw.metric : "";
  const duration = typeof raw.duration === "string" ? raw.duration : "";
  const status = TESTING_STATUSES.includes(raw.status) ? raw.status : TESTING_STATUSES[0];
  const notes = typeof raw.notes === "string" ? raw.notes : "";
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

export const entrySignature = (entry) => {
  if (!entry) return "";
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
      (entry.platforms || []).join("|"),
      JSON.stringify(ensureChecklist(entry.checklist)),
      (entry.comments || []).length,
    ].join("::");
  } catch (error) {
    console.warn("Failed to compute entry signature", error);
    return String(entry.id || "unknown");
  }
};

export const computeStatusDetail = (entry) => {
  if (!entry) return WORKFLOW_STAGES[0];
  const checklist = ensureChecklist(entry.checklist);
  const total = CHECKLIST_ITEMS.length || 1;
  const completed = Object.values(checklist).filter(Boolean).length;

  if (entry.status === "Approved") {
    return completed === total ? "Internals approved" : "Ready for review";
  }

  if (completed === 0) return "Briefing";
  if (completed < Math.ceil(total / 3)) return "Production";
  if (completed < total) return "Ready for review";
  if (completed >= total) return "Scheduled";

  return entry.statusDetail || WORKFLOW_STAGES[0];
};

export const getPlatformCaption = (baseCaption, platformCaptions, platform) => {
  if (!platform || platform === "Main") return baseCaption;
  const custom =
    platformCaptions && typeof platformCaptions === "object"
      ? platformCaptions[platform]
      : null;
  return custom && custom.trim().length ? custom : baseCaption;
};

export const isImageMedia = (url) => {
  if (!url) return false;
  if (typeof url !== "string") return false;
  if (url.startsWith("data:image")) return true;
  const cleaned = url.split("?")[0].toLowerCase();
  return /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(cleaned);
};
