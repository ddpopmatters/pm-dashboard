"use strict";
(() => {
  // src/constants.js
  var ASSET_TYPES = ["Video", "Design", "Carousel"];
  var IDEA_TYPES = ["Topic", "Theme", "Series", "Campaign", "Other"];
  var KANBAN_STATUSES = [
    "Draft",
    "Awaiting brand approval",
    "Awaiting SME approval",
    "Awaiting visual",
    "Approved",
    "Scheduled"
  ];
  var LINKEDIN_STATUSES = ["Draft", "Needs review", "Approved", "Shared"];
  var TESTING_STATUSES = ["Planned", "In flight", "Completed", "Archived"];
  var LINKEDIN_TYPES = ["My own account", "Content team to me"];
  var CAMPAIGNS = [
    "Evergreen",
    "Product launch",
    "Event",
    "Thought leadership",
    "Advocacy"
  ];
  var CONTENT_PILLARS = [
    "Awareness",
    "Education",
    "Engagement",
    "Community",
    "Conversion"
  ];
  var ALL_PLATFORMS = [
    "Instagram",
    "Facebook",
    "LinkedIn",
    "X/Twitter",
    "TikTok",
    "YouTube",
    "Threads",
    "Pinterest"
  ];
  var DEFAULT_APPROVERS = ["Dan Davis", "Comms Lead", "Campaigns Manager", "Policy Lead"];
  var PLATFORM_DEFAULT_LIMITS = {
    Instagram: 2200,
    Facebook: 63206,
    LinkedIn: 3e3,
    "X/Twitter": 280,
    TikTok: 2200,
    YouTube: 5e3,
    Threads: 500,
    Pinterest: 500
  };
  var DEFAULT_GUIDELINES = {
    bannedWords: ["shocking", "apocalypse"],
    requiredPhrases: ["Population Matters"],
    languageGuide: "Keep copy confident, compassionate, and evidence-led.",
    hashtagTips: "#PopulationMatters #Sustainability",
    charLimits: { ...PLATFORM_DEFAULT_LIMITS },
    teamsWebhookUrl: ""
  };
  var USERS = [
    "Dan Davis",
    "Comms Lead",
    "Campaigns Manager",
    "Policy Lead",
    "Creative Director",
    "Social Lead"
  ];
  var WORKFLOW_STAGES = [
    "Briefing",
    "Production",
    "Ready for review",
    "Internals approved",
    "Scheduled",
    "Published"
  ];
  var CHECKLIST_ITEMS = [
    { key: "assetCreated", label: "Asset created" },
    { key: "altTextWritten", label: "Alt text prepared" },
    { key: "linksChecked", label: "Links checked" },
    { key: "copyProofed", label: "Copy proofed" },
    { key: "tagsSet", label: "Tags / targeting set" }
  ];
  var PLATFORM_IMAGES = {
    Instagram: "https://cdn.simpleicons.org/instagram/E4405F",
    Facebook: "https://cdn.simpleicons.org/facebook/1877F2",
    LinkedIn: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNCAyNCc+PHJlY3Qgd2lkdGg9JzI0JyBoZWlnaHQ9JzI0JyByeD0nNCcgZmlsbD0nJTIzMEE2NkMyJy8+PHBhdGggZmlsbD0nd2hpdGUnIGQ9J005LjE5IDE4LjVINi41NFY5Ljg4aDIuNjVWMTguNVptLTEuMzItOS44NGMtLjg1IDAtMS41My0uNjktMS41My0xLjUzcy42OC0xLjUzIDEuNTMtMS41MyAxLjUzLjY5IDEuNTMgMS41My0uNjggMS41My0xLjUzIDEuNTNabTExLjEzIDkuODRoLTIuNjR2LTQuNDJjMC0xLjA1LS4wMi0yLjQtMS40Ni0yLjQtMS40NiAwLTEuNjggMS4xNC0xLjY4IDIuMzJ2NC40OUgxMC4yVjkuODhoMi41M3YxLjE4aC4wNGMuMzUtLjY2IDEuMjEtMS4zNiAyLjQ5LTEuMzYgMi42NiAwIDMuMTYgMS43NSAzLjE2IDQuMDJ2NC43N1onLz48L3N2Zz4=",
    "X/Twitter": "https://cdn.simpleicons.org/x",
    TikTok: "https://cdn.simpleicons.org/tiktok",
    YouTube: "https://cdn.simpleicons.org/youtube/FF0000",
    Threads: "https://cdn.simpleicons.org/threads",
    Pinterest: "https://cdn.simpleicons.org/pinterest/E60023"
  };
  var PLATFORM_TIPS = {
    Instagram: [
      "Lead with a strong hook in the first 2 lines.",
      "Use line breaks or emojis to improve readability.",
      "Finish with 3-5 targeted hashtags."
    ],
    Facebook: [
      "Keep copy short and conversational.",
      "Mention the benefit before the ask.",
      "Add a clear CTA near the end."
    ],
    LinkedIn: [
      "Open with a bold insight or data point.",
      "Write in short paragraphs for skim reading.",
      "End with a question to invite comments."
    ],
    "X/Twitter": [
      "Stay under 240 characters when possible.",
      "Use 1-2 hashtags max.",
      "Lead with the strongest phrase; trim filler."
    ],
    TikTok: [
      "Hook viewers with a first sentence that matches the audio.",
      "Add keywords to improve search visibility.",
      "Include a clear call to action to comment or share."
    ],
    YouTube: [
      "Front-load the value proposition in line one.",
      "Add timestamps or bullet points for longer videos.",
      "Encourage likes/subscribes in the final sentence."
    ],
    Threads: [
      "Write like a friendly text message.",
      "Keep lines short and emoji-friendly.",
      "Invite quick replies with a direct prompt."
    ],
    Pinterest: [
      "Focus on outcomes and inspiration.",
      "Use keywords that match board searches.",
      "Finish with a link-friendly CTA."
    ]
  };
  var PLATFORM_PREVIEW_META = {
    Instagram: { name: "Your Brand", handle: "@yourbrand", accent: "#F56040" },
    Facebook: { name: "Your Brand", handle: "facebook.com/yourbrand", accent: "#1877F2" },
    LinkedIn: { name: "Your Brand", handle: "Your Role \u2022 Company", accent: "#0A66C2" },
    "X/Twitter": { name: "Your Brand", handle: "@yourbrand", accent: "#1D9BF0" },
    TikTok: { name: "yourbrand", handle: "Your Brand", accent: "#EE1D52" },
    YouTube: { name: "Your Brand", handle: "1.2K subscribers", accent: "#FF0000" },
    Threads: { name: "Your Brand", handle: "@yourbrand", accent: "#101010" },
    Pinterest: { name: "Your Brand", handle: "1.5M followers", accent: "#E60023" }
  };
  var STORAGE_KEY = "pm-content-dashboard-v1";
  var USER_STORAGE_KEY = "pm-content-dashboard-user";
  var NOTIFICATIONS_STORAGE_KEY = "pm-content-dashboard-notifications";
  var IDEAS_STORAGE_KEY = "pm-content-dashboard-ideas";
  var LINKEDIN_STORAGE_KEY = "pm-content-dashboard-linkedin";
  var TESTING_STORAGE_KEY = "pm-content-dashboard-testing";
  var GUIDELINES_STORAGE_KEY = "content-guidelines-settings-v1";
  var AUDIT_STORAGE_KEY = "pm-content-audit-log";
  var MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
  var storageAvailable = typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  var PERFORMANCE_HEADER_KEYS = {
    entryId: ["entry_id", "content_id", "dashboard_id", "id"],
    date: ["date", "post_date", "published_date", "scheduled_date"],
    platform: ["platform", "channel", "network"],
    caption: ["caption", "copy", "post_text", "text"],
    url: ["url", "link", "permalink"]
  };
  var PERFORMANCE_IGNORED_METRIC_KEYS = /* @__PURE__ */ new Set([
    ...PERFORMANCE_HEADER_KEYS.entryId,
    ...PERFORMANCE_HEADER_KEYS.date,
    ...PERFORMANCE_HEADER_KEYS.platform,
    ...PERFORMANCE_HEADER_KEYS.caption,
    ...PERFORMANCE_HEADER_KEYS.url,
    "notes",
    "comments"
  ]);

  // src/utils.js
  var cx = (...xs) => xs.filter(Boolean).join(" ");
  var daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  var monthStartISO = (d) => new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  var monthEndISO = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  var uuid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  var isOlderThanDays = (iso, days) => Date.now() - new Date(iso).getTime() > days * 864e5;
  var isoFromParts = (year, monthIndex, day) => `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  var ensureArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
  var createEmptyChecklist = () => {
    const checklist = {};
    CHECKLIST_ITEMS.forEach(({ key }) => {
      checklist[key] = false;
    });
    return checklist;
  };
  var ensureChecklist = (value) => {
    const base = createEmptyChecklist();
    if (value && typeof value === "object") {
      Object.keys(base).forEach((key) => {
        base[key] = Boolean(value[key]);
      });
    }
    return base;
  };
  var ensureComments = (value) => {
    if (!Array.isArray(value)) return [];
    return value.filter((comment) => comment && typeof comment === "object" && comment.body).map((comment) => ({
      id: comment.id || uuid(),
      author: comment.author || "Unknown",
      body: comment.body,
      createdAt: comment.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      mentions: Array.isArray(comment.mentions) && comment.mentions.length ? comment.mentions : extractMentions(comment.body)
    }));
  };
  var ensureAnalytics = (value) => {
    if (!value || typeof value !== "object") return {};
    const analytics = {};
    Object.entries(value).forEach(([platform, metrics]) => {
      if (!platform) return;
      if (!metrics || typeof metrics !== "object") return;
      const cleaned = {};
      Object.entries(metrics).forEach(([key, metricValue]) => {
        if (metricValue === void 0 || metricValue === null || metricValue === "") return;
        cleaned[key] = metricValue;
      });
      analytics[platform] = cleaned;
    });
    return analytics;
  };
  var PLATFORM_ALIAS_MAP = (() => {
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
  var normalizePlatform = (value) => {
    if (!value) return "";
    const cleaned = String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!cleaned) return "";
    return PLATFORM_ALIAS_MAP[cleaned] || "";
  };
  var splitCSVLine = (line) => {
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
  var parseCSV = (text) => {
    if (!text || typeof text !== "string") {
      return { headers: [], records: [] };
    }
    const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = normalized.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
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
  var normalizeHeaderKey = (key) => key.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  var normalizeDateValue = (raw) => {
    if (!raw) return "";
    const trimmed = String(raw).trim();
    if (!trimmed) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString().slice(0, 10);
  };
  var mergePerformanceData = (entries, dataset) => {
    const headers = Array.isArray(dataset?.headers) ? dataset.headers : [];
    const records = Array.isArray(dataset?.records) ? dataset.records : [];
    const summary = {
      totalRows: records.length,
      matched: 0,
      updatedEntries: /* @__PURE__ */ new Set(),
      missing: [],
      ambiguous: [],
      errors: []
    };
    if (!headers.length || !records.length) {
      return { nextEntries: entries, summary };
    }
    const normalizedHeaders = headers.map((header) => normalizeHeaderKey(header));
    const headerLabels = {};
    normalizedHeaders.forEach((key, idx) => {
      if (!headerLabels[key]) headerLabels[key] = headers[idx].trim();
    });
    const hasEntryId = normalizedHeaders.some(
      (key) => PERFORMANCE_HEADER_KEYS.entryId.includes(key)
    );
    const hasDate = normalizedHeaders.some(
      (key) => PERFORMANCE_HEADER_KEYS.date.includes(key)
    );
    const hasPlatform = normalizedHeaders.some(
      (key) => PERFORMANCE_HEADER_KEYS.platform.includes(key)
    );
    if (!hasEntryId && (!hasDate || !hasPlatform)) {
      summary.errors.push({
        rowNumber: 1,
        reason: "CSV must include an entry_id column or both date and platform columns."
      });
      return { nextEntries: entries, summary };
    }
    const metricKeys = normalizedHeaders.filter(
      (key) => !PERFORMANCE_IGNORED_METRIC_KEYS.has(key)
    );
    if (!metricKeys.length) {
      summary.errors.push({
        rowNumber: 1,
        reason: "No metric columns detected in the upload."
      });
      return { nextEntries: entries, summary };
    }
    const nextEntries = entries.map((entry) => ({
      ...entry,
      analytics: ensureAnalytics(entry.analytics)
    }));
    const entryIndexById = /* @__PURE__ */ new Map();
    nextEntries.forEach((entry, index) => {
      entryIndexById.set(entry.id, index);
    });
    const entriesByDatePlatform = /* @__PURE__ */ new Map();
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
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
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
        if (entryIndex === void 0) {
          summary.missing.push({
            rowNumber,
            reason: `Entry ID "${entryIdValue}" not found.`
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
              reason: `Specify platform for entry ID "${entryIdValue}" (multiple platforms linked).`
            });
            return;
          }
        }
        if (!ensureArray(matchedEntry.platforms).includes(platform)) {
          summary.ambiguous.push({
            rowNumber,
            reason: `Entry ID "${entryIdValue}" is not scheduled for ${platform}.`
          });
          return;
        }
      } else {
        const dateRaw = getFirstValue(normalizedRow, PERFORMANCE_HEADER_KEYS.date);
        const isoDate = normalizeDateValue(dateRaw);
        if (!isoDate) {
          summary.errors.push({
            rowNumber,
            reason: "Row is missing a valid date value."
          });
          return;
        }
        const platformRaw = getFirstValue(normalizedRow, PERFORMANCE_HEADER_KEYS.platform);
        platform = normalizePlatform(platformRaw);
        if (!platform) {
          summary.errors.push({
            rowNumber,
            reason: "Row is missing a recognizable platform value."
          });
          return;
        }
        const candidates = (entriesByDatePlatform.get(`${isoDate}__${platform}`) || []).map(
          (candidateIndex) => nextEntries[candidateIndex]
        );
        if (!candidates.length) {
          summary.missing.push({
            rowNumber,
            reason: `No calendar item on ${isoDate} for ${platform}.`
          });
          return;
        }
        if (candidates.length === 1) {
          matchedEntry = candidates[0];
          entryIndex = entryIndexById.get(matchedEntry.id);
        } else {
          const snippet = getFirstValue(
            normalizedRow,
            PERFORMANCE_HEADER_KEYS.caption
          ).toLowerCase();
          const link = getFirstValue(
            normalizedRow,
            PERFORMANCE_HEADER_KEYS.url
          ).toLowerCase();
          let filtered = candidates;
          if (snippet) {
            filtered = filtered.filter(
              (entry) => (entry.caption || "").toLowerCase().includes(snippet)
            );
          }
          if (filtered.length !== 1 && link) {
            filtered = candidates.filter(
              (entry) => (entry.url || "").toLowerCase().includes(link)
            );
          }
          if (filtered.length === 1) {
            matchedEntry = filtered[0];
            entryIndex = entryIndexById.get(matchedEntry.id);
          } else {
            summary.ambiguous.push({
              rowNumber,
              reason: `Multiple calendar items found on ${isoDate} for ${platform}. Add entry_id to disambiguate.`
            });
            return;
          }
        }
      }
      if (!matchedEntry || entryIndex === -1) {
        summary.errors.push({
          rowNumber,
          reason: "Unable to match this row to a calendar item."
        });
        return;
      }
      const metricPayload = {};
      metricKeys.forEach((key) => {
        const rawValue = normalizedRow[key];
        if (rawValue === void 0 || rawValue === null || rawValue === "") return;
        const label = headerLabels[key] || key;
        const cleanedNumeric = typeof rawValue === "string" ? rawValue.replace(/,/g, "") : rawValue;
        const numericValue = typeof cleanedNumeric === "string" && cleanedNumeric !== "" ? Number(cleanedNumeric) : Number.isFinite(cleanedNumeric) ? cleanedNumeric : NaN;
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
          reason: "No metric values detected in this row."
        });
        return;
      }
      const targetEntry = nextEntries[entryIndex];
      const analytics = ensureAnalytics(targetEntry.analytics);
      const existing = analytics[platform] ? { ...analytics[platform] } : {};
      const mergedMetrics = {
        ...existing,
        ...metricPayload,
        lastImportedAt: timestamp
      };
      analytics[platform] = mergedMetrics;
      nextEntries[entryIndex] = {
        ...targetEntry,
        analytics,
        analyticsUpdatedAt: timestamp
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
  var extractMentions = (text) => {
    if (!text) return [];
    const matches = text.match(/@([\w\s.&'-]+)/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map((token) => token.trim())));
  };
  var ensurePlatformCaptions = (value) => {
    if (!value || typeof value !== "object") return {};
    const cleaned = {};
    Object.entries(value).forEach(([key, val]) => {
      if (typeof val === "string") cleaned[key] = val;
    });
    return cleaned;
  };
  var ensurePeopleArray = (value) => {
    if (Array.isArray(value)) {
      return value.map((name) => typeof name === "string" ? name.trim() : "").filter(Boolean);
    }
    if (typeof value === "string" && value.trim()) {
      return [value.trim()];
    }
    return [];
  };
  var ensureLinksArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((link) => typeof link === "string" ? link.trim() : "").filter(Boolean);
    }
    if (typeof value === "string") {
      return value.split(/\n+/).map((link) => link.trim()).filter(Boolean);
    }
    return [];
  };
  var ensureAttachments = (value) => {
    if (!Array.isArray(value)) return [];
    return value.map((attachment) => {
      if (!attachment || typeof attachment !== "object") return null;
      const name = typeof attachment.name === "string" ? attachment.name : "Attachment";
      const dataUrl = typeof attachment.dataUrl === "string" ? attachment.dataUrl : "";
      const type = typeof attachment.type === "string" ? attachment.type : "";
      const size = typeof attachment.size === "number" ? attachment.size : 0;
      if (!dataUrl) return null;
      return { id: attachment.id || uuid(), name, dataUrl, type, size };
    }).filter(Boolean);
  };
  var normalizeGuidelines = (raw) => {
    if (!raw || typeof raw !== "object") {
      return {
        ...DEFAULT_GUIDELINES,
        charLimits: { ...DEFAULT_GUIDELINES.charLimits }
      };
    }
    const bannedWords = Array.isArray(raw.bannedWords) ? raw.bannedWords.map((word) => String(word).trim()).filter(Boolean) : [...DEFAULT_GUIDELINES.bannedWords];
    const requiredPhrases = Array.isArray(raw.requiredPhrases) ? raw.requiredPhrases.map((p) => String(p).trim()).filter(Boolean) : [...DEFAULT_GUIDELINES.requiredPhrases];
    const languageGuide = typeof raw.languageGuide === "string" ? raw.languageGuide : DEFAULT_GUIDELINES.languageGuide;
    const hashtagTips = typeof raw.hashtagTips === "string" ? raw.hashtagTips : DEFAULT_GUIDELINES.hashtagTips;
    const charLimits = { ...DEFAULT_GUIDELINES.charLimits, ...raw.charLimits || {} };
    Object.keys(charLimits).forEach((platform) => {
      const value = Number(charLimits[platform]);
      charLimits[platform] = Number.isFinite(value) && value > 0 ? value : PLATFORM_DEFAULT_LIMITS[platform] || 500;
    });
    const teamsWebhookUrl = typeof raw.teamsWebhookUrl === "string" ? raw.teamsWebhookUrl : "";
    return {
      bannedWords,
      requiredPhrases,
      languageGuide,
      hashtagTips,
      charLimits,
      teamsWebhookUrl
    };
  };
  var resolveMentionCandidate = (candidate, names) => {
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
  var monthKeyFromDate = (iso) => {
    if (!iso) return "";
    return iso.slice(0, 7);
  };
  var sanitizeIdea = (raw) => {
    if (!raw || typeof raw !== "object") return null;
    const ideaType = IDEA_TYPES.includes(raw.type) ? raw.type : IDEA_TYPES[0];
    const links = ensureLinksArray(raw.links);
    const attachments = ensureAttachments(raw.attachments);
    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    const notes = typeof raw.notes === "string" ? raw.notes : "";
    const createdBy = typeof raw.createdBy === "string" ? raw.createdBy : "";
    const createdAt = raw.createdAt || (/* @__PURE__ */ new Date()).toISOString();
    const targetDate = raw.targetDate && typeof raw.targetDate === "string" ? raw.targetDate : "";
    const targetMonth = raw.targetMonth && typeof raw.targetMonth === "string" ? raw.targetMonth : targetDate ? monthKeyFromDate(targetDate) : "";
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
      targetMonth
    };
  };
  var notificationKey = (type, entryId, user, meta = {}) => {
    const commentId = meta.commentId || "";
    return [type, entryId || "none", user || "", commentId].join(":");
  };
  var sanitizeEntry = (entry) => {
    if (!entry || typeof entry !== "object") return null;
    const approvers = ensurePeopleArray(entry.approvers ?? entry.approver);
    const platforms = ensureArray(entry.platforms);
    const assetType = ASSET_TYPES.includes(entry.assetType) ? entry.assetType : "Design";
    const status = typeof entry.status === "string" && entry.status.toLowerCase() === "approved" ? "Approved" : "Pending";
    const createdAt = entry.createdAt || (/* @__PURE__ */ new Date()).toISOString();
    const updatedAt = entry.updatedAt || createdAt;
    const author = typeof entry.author === "string" ? entry.author.trim() : entry.author ? String(entry.author).trim() : "";
    const caption = typeof entry.caption === "string" ? entry.caption : "";
    const url = typeof entry.url === "string" ? entry.url.trim() : entry.url ? String(entry.url).trim() : "";
    const firstComment = typeof entry.firstComment === "string" ? entry.firstComment : "";
    const base = {
      ...entry,
      id: entry.id || uuid(),
      date: entry.date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      status,
      approvers,
      author,
      caption,
      url,
      campaign: CAMPAIGNS.includes(entry.campaign) ? entry.campaign : "",
      contentPillar: CONTENT_PILLARS.includes(entry.contentPillar) ? entry.contentPillar : "",
      analytics: ensureAnalytics(entry.analytics),
      analyticsUpdatedAt: typeof entry.analyticsUpdatedAt === "string" ? entry.analyticsUpdatedAt : "",
      testingFrameworkId: typeof entry.testingFrameworkId === "string" ? entry.testingFrameworkId : "",
      testingFrameworkName: typeof entry.testingFrameworkName === "string" ? entry.testingFrameworkName : "",
      assetType,
      script: assetType === "Video" && typeof entry.script === "string" ? entry.script : void 0,
      designCopy: assetType === "Design" && typeof entry.designCopy === "string" ? entry.designCopy : void 0,
      carouselSlides: assetType === "Carousel" && Array.isArray(entry.carouselSlides) ? entry.carouselSlides.map((slide) => typeof slide === "string" ? slide : "") : assetType === "Carousel" ? ["", "", ""] : void 0,
      firstComment,
      checklist: ensureChecklist(entry.checklist),
      comments: ensureComments(entry.comments),
      platformCaptions: ensurePlatformCaptions(entry.platformCaptions),
      platforms,
      previewUrl: entry.previewUrl ? String(entry.previewUrl) : "",
      createdAt,
      updatedAt,
      workflowStatus: KANBAN_STATUSES.includes(entry.workflowStatus) ? entry.workflowStatus : status === "Approved" ? "Approved" : entry.statusDetail === "Scheduled" ? "Scheduled" : "Draft"
    };
    if (assetType !== "Video") base.script = void 0;
    if (assetType !== "Design") base.designCopy = void 0;
    if (assetType !== "Carousel") base.carouselSlides = void 0;
    return base;
  };
  var sanitizeLinkedInSubmission = (raw) => {
    if (!raw || typeof raw !== "object") return null;
    const submissionType = LINKEDIN_TYPES.includes(raw.submissionType) ? raw.submissionType : LINKEDIN_TYPES[0];
    const status = LINKEDIN_STATUSES.includes(raw.status) ? raw.status : LINKEDIN_STATUSES[0];
    const links = ensureLinksArray(raw.links);
    const attachments = ensureAttachments(raw.attachments);
    const postCopy = typeof raw.postCopy === "string" ? raw.postCopy : raw.copy || "";
    const comments = typeof raw.comments === "string" ? raw.comments : raw.callToAction || "";
    const owner = typeof raw.owner === "string" ? raw.owner.trim() : "";
    const submitter = typeof raw.submitter === "string" ? raw.submitter.trim() : "";
    const createdAt = raw.createdAt || (/* @__PURE__ */ new Date()).toISOString();
    const targetDate = raw.targetDate && typeof raw.targetDate === "string" ? raw.targetDate : "";
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
      createdAt
    };
  };
  var sanitizeTestingFramework = (raw) => {
    if (!raw || typeof raw !== "object") return null;
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    if (!name) return null;
    const hypothesis = typeof raw.hypothesis === "string" ? raw.hypothesis : "";
    const audience = typeof raw.audience === "string" ? raw.audience : "";
    const metric = typeof raw.metric === "string" ? raw.metric : "";
    const duration = typeof raw.duration === "string" ? raw.duration : "";
    const status = TESTING_STATUSES.includes(raw.status) ? raw.status : TESTING_STATUSES[0];
    const notes = typeof raw.notes === "string" ? raw.notes : "";
    const createdAt = raw.createdAt || (/* @__PURE__ */ new Date()).toISOString();
    return {
      id: raw.id || uuid(),
      name,
      hypothesis,
      audience,
      metric,
      duration,
      status,
      notes,
      createdAt
    };
  };
  var entrySignature = (entry) => {
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
        (entry.comments || []).length
      ].join("::");
    } catch (error) {
      console.warn("Failed to compute entry signature", error);
      return String(entry.id || "unknown");
    }
  };
  var computeStatusDetail = (entry) => {
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
  var getPlatformCaption = (baseCaption, platformCaptions, platform) => {
    if (!platform || platform === "Main") return baseCaption;
    const custom = platformCaptions && typeof platformCaptions === "object" ? platformCaptions[platform] : null;
    return custom && custom.trim().length ? custom : baseCaption;
  };
  var isImageMedia = (url) => {
    if (!url) return false;
    if (typeof url !== "string") return false;
    if (url.startsWith("data:image")) return true;
    const cleaned = url.split("?")[0].toLowerCase();
    return /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(cleaned);
  };

  // src/storage.js
  function readStorage(key, fallback) {
    if (!storageAvailable) return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      console.warn(`Failed to read ${key}`, error);
      return fallback;
    }
  }
  function writeStorage(key, value) {
    if (!storageAvailable) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to write ${key}`, error);
    }
  }
  var loadGuidelines = () => {
    const raw = readStorage(GUIDELINES_STORAGE_KEY, null);
    return normalizeGuidelines(raw || void 0);
  };
  var saveGuidelines = (guidelines) => {
    writeStorage(GUIDELINES_STORAGE_KEY, normalizeGuidelines(guidelines));
  };
  var loadNotifications = () => {
    const parsed = readStorage(NOTIFICATIONS_STORAGE_KEY, []);
    return Array.isArray(parsed) ? parsed.map((item) => ({
      id: item.id || uuid(),
      entryId: item.entryId,
      user: item.user,
      type: item.type,
      message: item.message,
      createdAt: item.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      read: Boolean(item.read),
      key: item.key || notificationKey(item.type, item.entryId, item.user, item.meta),
      meta: item.meta && typeof item.meta === "object" ? item.meta : {}
    })).filter((item) => item.entryId && item.user && item.type && item.message) : [];
  };
  var saveNotifications = (items) => {
    writeStorage(NOTIFICATIONS_STORAGE_KEY, items);
  };
  var appendAudit = (event) => {
    if (!storageAvailable) return;
    try {
      const raw = window.localStorage.getItem(AUDIT_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const entry = {
        id: uuid(),
        ts: (/* @__PURE__ */ new Date()).toISOString(),
        user: event?.user || "Unknown",
        entryId: event?.entryId || "",
        action: event?.action || "",
        meta: event?.meta || {}
      };
      list.unshift(entry);
      window.localStorage.setItem(
        AUDIT_STORAGE_KEY,
        JSON.stringify(list.slice(0, 500))
      );
    } catch (e) {
      console.warn("Failed to append audit", e);
    }
  };
  var loadIdeas = () => {
    const parsed = readStorage(IDEAS_STORAGE_KEY, []);
    return Array.isArray(parsed) ? parsed.map((item) => sanitizeIdea(item)).filter(Boolean).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")) : [];
  };
  var saveIdeas = (ideas) => {
    writeStorage(IDEAS_STORAGE_KEY, ideas);
  };
  var loadLinkedInSubmissions = () => {
    const parsed = readStorage(LINKEDIN_STORAGE_KEY, []);
    return Array.isArray(parsed) ? parsed.map((item) => sanitizeLinkedInSubmission(item)).filter(Boolean).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")) : [];
  };
  var saveLinkedInSubmissions = (items) => {
    writeStorage(LINKEDIN_STORAGE_KEY, items);
  };
  var loadTestingFrameworks = () => {
    const parsed = readStorage(TESTING_STORAGE_KEY, []);
    return Array.isArray(parsed) ? parsed.map((item) => sanitizeTestingFramework(item)).filter(Boolean).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")) : [];
  };
  var saveTestingFrameworks = (items) => {
    writeStorage(TESTING_STORAGE_KEY, items);
  };
  function loadEntries() {
    if (!storageAvailable) return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const migrated = parsed.map((entry) => sanitizeEntry(entry)).filter(Boolean).map((sanitized) => ({
        ...sanitized,
        statusDetail: computeStatusDetail(sanitized)
      }));
      const kept = migrated.filter(
        (entry) => !(entry.deletedAt && isOlderThanDays(entry.deletedAt, 30))
      );
      if (kept.length !== migrated.length && storageAvailable) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
      }
      return kept;
    } catch (error) {
      console.warn("Failed to load entries from storage", error);
      return [];
    }
  }
  function saveEntries(entries) {
    writeStorage(STORAGE_KEY, entries);
  }

  // src/components/ui.jsx
  var { useState } = React;
  var iconBase = "h-4 w-4 shrink-0 text-ocean-500";
  var SvgIcon = ({ children, className }) => /* @__PURE__ */ React.createElement(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "currentColor",
      className: cx(iconBase, className),
      "aria-hidden": "true"
    },
    children
  );
  var CalendarIcon = ({ className = iconBase }) => /* @__PURE__ */ React.createElement(SvgIcon, { className }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "4", width: "18", height: "18", rx: "3" }), /* @__PURE__ */ React.createElement("line", { x1: "3", y1: "10", x2: "21", y2: "10", stroke: "currentColor", strokeWidth: "2" }), /* @__PURE__ */ React.createElement("line", { x1: "8", y1: "2", x2: "8", y2: "6", stroke: "currentColor", strokeWidth: "2" }), /* @__PURE__ */ React.createElement("line", { x1: "16", y1: "2", x2: "16", y2: "6", stroke: "currentColor", strokeWidth: "2" }));
  var ChevronDownIcon = ({ className = iconBase }) => /* @__PURE__ */ React.createElement(SvgIcon, { className }, /* @__PURE__ */ React.createElement("path", { d: "M6.75 9.25 12 14.5l5.25-5.25", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" }));
  var CheckCircleIcon = ({ className = iconBase }) => /* @__PURE__ */ React.createElement(SvgIcon, { className: cx(className, "text-emerald-600") }, /* @__PURE__ */ React.createElement("path", { d: "M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm-1 14-4-4 1.414-1.414L11 12.172l4.586-4.586L17 9l-6 7Z" }));
  var LoaderIcon = ({ className = iconBase }) => /* @__PURE__ */ React.createElement(SvgIcon, { className: cx(className, "animate-spin text-amber-600") }, /* @__PURE__ */ React.createElement("path", { d: "M12 2a10 10 0 0 0-9.95 9h2.02A8 8 0 1 1 12 20a7.96 7.96 0 0 1-5.66-2.34l-1.42 1.42A9.96 9.96 0 0 0 12 22a10 10 0 0 0 0-20Z" }));
  var TrashIcon = ({ className = iconBase }) => /* @__PURE__ */ React.createElement(SvgIcon, { className }, /* @__PURE__ */ React.createElement("path", { d: "M9 3h6l1 2h5v2h-2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7H3V5h5l1-2Zm2 6v8h2V9h-2Z" }));
  var RotateCcwIcon = ({ className = iconBase }) => /* @__PURE__ */ React.createElement(SvgIcon, { className }, /* @__PURE__ */ React.createElement("path", { d: "M11 2v3a1 1 0 0 1-1 1H7l3.293 3.293-1.414 1.414L3.586 6.414a2 2 0 0 1 0-2.828L8.879.293 10.293 1.707 7.586 4.414H10a3 3 0 0 0 3-3V0h-2Zm1 4a8 8 0 1 1-7.446 5.1l1.895.633A6 6 0 1 0 12 6V4Z" }));
  var PlusIcon = ({ className = iconBase }) => /* @__PURE__ */ React.createElement(SvgIcon, { className }, /* @__PURE__ */ React.createElement("path", { d: "M11 4h2v6h6v2h-6v6h-2v-6H5v-2h6V4Z" }));
  function PlatformIcon({ platform }) {
    const src = PLATFORM_IMAGES[platform];
    const [failed, setFailed] = useState(false);
    if (!src || failed) {
      return /* @__PURE__ */ React.createElement("span", { className: "flex h-4 w-4 items-center justify-center rounded-full bg-aqua-100 text-[10px] font-semibold text-ocean-700" }, platform.slice(0, 1));
    }
    return /* @__PURE__ */ React.createElement(
      "img",
      {
        src,
        alt: `${platform} logo`,
        className: "h-4 w-4 object-contain",
        loading: "lazy",
        referrerPolicy: "no-referrer",
        crossOrigin: "anonymous",
        onError: () => setFailed(true)
      }
    );
  }
  var Card = ({ className = "", children }) => /* @__PURE__ */ React.createElement("div", { className: cx("rounded-2xl border border-graystone-200 bg-white shadow-sm", className) }, children);
  var CardHeader = ({ className = "", children }) => /* @__PURE__ */ React.createElement("div", { className: cx("border-b border-graystone-200 px-5 py-4", className) }, children);
  var CardContent = ({ className = "", children }) => /* @__PURE__ */ React.createElement("div", { className: cx("px-5 py-4", className) }, children);
  var CardTitle = ({ className = "", children }) => /* @__PURE__ */ React.createElement("div", { className: cx("flex items-center gap-2", className) }, /* @__PURE__ */ React.createElement("span", { className: "inline-block h-3 w-3 rounded-full bg-[#00F5FF]", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("h2", { className: "heading-font text-lg font-semibold text-ocean-800" }, children));
  var Badge = ({ variant = "default", className = "", children }) => {
    const styles = {
      default: "bg-aqua-100 text-ocean-700",
      secondary: "bg-graystone-100 text-graystone-700",
      outline: "border border-aqua-200 text-ocean-700 bg-aqua-50"
    };
    return /* @__PURE__ */ React.createElement("span", { className: cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", styles[variant], className) }, children);
  };
  var CopyCheckSection = window.CopyCheckSection || (() => null);
  var NotificationBell = ({ notifications, unreadCount, onOpenItem }) => {
    const [open, setOpen] = useState(false);
    const topItems = (notifications || []).slice(0, 8);
    return /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setOpen((prev) => !prev),
        className: "relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#00F5FF] text-black shadow-[0_0_20px_rgba(15,157,222,0.35)] transition hover:-translate-y-0.5",
        "aria-label": unreadCount ? `${unreadCount} unread notifications` : "Notifications"
      },
      /* @__PURE__ */ React.createElement(
        "svg",
        {
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 24 24",
          className: "h-5 w-5",
          fill: "currentColor"
        },
        /* @__PURE__ */ React.createElement("path", { d: "M12 2a6 6 0 0 0-6 6v2.586a2 2 0 0 1-.586 1.414l-.828.828A1 1 0 0 0 5 15h14a1 1 0 0 0 .707-1.707l-.828-.828A2 2 0 0 1 18 10.586V8a6 6 0 0 0-6-6Zm0 20a3 3 0 0 0 2.995-2.824L15 19h-6a3 3 0 0 0 2.824 2.995L12 22Z" })
      ),
      /* @__PURE__ */ React.createElement("span", { className: "absolute -bottom-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-black px-1 text-[11px] font-semibold text-white" }, unreadCount || 0)
    ), open && /* @__PURE__ */ React.createElement("div", { className: "absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-graystone-200 bg-white p-4 shadow-xl" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "heading-font flex items-center gap-2 text-sm font-semibold text-ocean-700" }, /* @__PURE__ */ React.createElement("span", { className: "inline-block h-3 w-3 rounded-full bg-[#00F5FF]", "aria-hidden": "true" }), "Notifications"), /* @__PURE__ */ React.createElement("button", { className: "text-xs text-graystone-500 hover:text-ocean-600", onClick: () => setOpen(false) }, "Close")), /* @__PURE__ */ React.createElement("div", { className: "mt-3 space-y-2" }, topItems.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-graystone-500" }, "You're all caught up.") : topItems.map((note) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: note.id,
        className: cx(
          "w-full rounded-xl border px-3 py-2 text-left text-sm transition",
          note.read ? "border-graystone-200 bg-white hover:border-aqua-200 hover:bg-aqua-50" : "border-aqua-200 bg-aqua-50 hover:border-ocean-300"
        ),
        onClick: () => {
          onOpenItem(note);
          setOpen(false);
        }
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "font-medium text-ocean-700" }, note.message), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-graystone-500" }, note.createdAt ? new Date(note.createdAt).toLocaleString() : ""))
    )))));
  };
  var Button = ({
    type = "button",
    variant = "solid",
    size = "md",
    disabled = false,
    className = "",
    onClick,
    children
  }) => {
    const base = "heading-font inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0F9DDE]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#CFEBF8] disabled:cursor-not-allowed disabled:opacity-60";
    const variants = {
      solid: "border border-black bg-black text-white shadow-[0_0_30px_rgba(15,157,222,0.35)] hover:-translate-y-0.5 hover:bg-white hover:text-black",
      outline: "border border-black bg-white text-black hover:-translate-y-0.5 hover:bg-black hover:text-white",
      ghost: "text-black hover:bg-black/10",
      destructive: "border border-rose-500 bg-rose-600 text-white shadow-[0_0_25px_rgba(244,63,94,0.35)] hover:-translate-y-0.5 hover:bg-rose-700",
      cta: "border border-[#0F9DDE]/40 bg-white text-black shadow-[0_0_35px_rgba(15,157,222,0.3)] hover:-translate-y-0.5 hover:shadow-[0_0_45px_rgba(15,157,222,0.45)]"
    };
    const sizes = {
      sm: "px-4 py-1.5 text-xs",
      md: "px-6 py-2 text-sm",
      lg: "px-7 py-3 text-base",
      icon: "h-10 w-10"
    };
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        type,
        onClick,
        disabled,
        className: cx(base, variants[variant] || variants.solid, sizes[size], className)
      },
      children
    );
  };
  var selectBaseClasses = "dropdown-font rounded-full border border-black bg-white px-4 py-2 text-sm font-normal text-black shadow-[0_0_20px_rgba(15,157,222,0.2)] transition hover:bg-black hover:text-white focus:border-black focus:outline-none focus:ring-4 focus:ring-[#0F9DDE]/40 focus:ring-offset-2 focus:ring-offset-[#CFEBF8] disabled:cursor-not-allowed disabled:opacity-60";
  var fileInputClasses = "heading-font w-full max-w-xs text-sm text-graystone-600 file:rounded-full file:border file:border-black file:bg-black file:px-5 file:py-2 file:text-sm file:font-semibold file:text-white file:shadow-[0_0_30px_rgba(15,157,222,0.35)] file:transition file:hover:bg-white file:hover:text-black file:hover:shadow-[0_0_40px_rgba(15,157,222,0.45)]";
  var Input = ({ className = "", type = "text", ...props }) => {
    const isPicker = type === "date" || type === "month" || type === "time";
    const base = isPicker ? cx(selectBaseClasses, "w-full") : "w-full rounded-lg border border-graystone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-aqua-200";
    return /* @__PURE__ */ React.createElement(
      "input",
      {
        type,
        className: cx(base, className),
        ...props
      }
    );
  };
  var Textarea = ({ className = "", rows = 3, ...props }) => /* @__PURE__ */ React.createElement(
    "textarea",
    {
      rows,
      className: cx(
        "w-full rounded-lg border border-graystone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-aqua-200",
        className
      ),
      ...props
    }
  );
  var Label = ({ htmlFor, className = "", children }) => /* @__PURE__ */ React.createElement("label", { htmlFor, className: cx("block text-sm font-medium text-graystone-700", className) }, children);
  var Separator = () => /* @__PURE__ */ React.createElement("div", { className: "h-px w-full bg-graystone-200" });
  var Toggle = ({ checked, onChange, id, ariaLabel }) => /* @__PURE__ */ React.createElement("label", { className: "inline-flex cursor-pointer items-center gap-3", htmlFor: id }, /* @__PURE__ */ React.createElement("span", { className: "relative inline-flex items-center" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      id,
      type: "checkbox",
      checked,
      onChange: (event) => onChange(event.target.checked),
      className: "peer sr-only",
      "aria-label": ariaLabel
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "h-5 w-10 rounded-full bg-graystone-300 transition-colors peer-checked:bg-aqua-500" }), /* @__PURE__ */ React.createElement("span", { className: "absolute left-[3px] top-[3px] h-4 w-4 rounded-full bg-white transition-all peer-checked:translate-x-5 peer-checked:bg-white" })));
  var MULTI_OPTION_BASE = "dropdown-font flex cursor-pointer items-center gap-3 px-4 py-2 text-sm font-normal text-black transition hover:bg-black hover:text-white";
  var checklistCheckboxClass = "h-4 w-4 rounded border-black bg-white text-[#00F5FF] focus:ring-0 focus:ring-offset-0";
  var MultiSelect = ({ placeholder, value, onChange, options }) => {
    const [open, setOpen] = useState(false);
    const toggle = (val) => {
      const exists = value.includes(val);
      onChange(exists ? value.filter((x) => x !== val) : [...value, val]);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "outline",
        className: "w-full justify-between px-4 py-2",
        onClick: () => setOpen((prev) => !prev)
      },
      /* @__PURE__ */ React.createElement("span", { className: "text-sm" }, value.length ? `${value.length} selected` : placeholder),
      /* @__PURE__ */ React.createElement(ChevronDownIcon, { className: "h-4 w-4" })
    ), open && /* @__PURE__ */ React.createElement("div", { className: "absolute left-0 top-12 z-30 w-full rounded-3xl border border-black bg-white text-black shadow-[0_0_25px_rgba(15,157,222,0.3)]" }, /* @__PURE__ */ React.createElement("div", { className: "max-h-52 overflow-y-auto py-2" }, options.map((option) => /* @__PURE__ */ React.createElement(
      "label",
      {
        key: option.value,
        className: MULTI_OPTION_BASE
      },
      /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "checkbox",
          className: checklistCheckboxClass,
          checked: value.includes(option.value),
          onChange: () => toggle(option.value)
        }
      ),
      option.icon ? /* @__PURE__ */ React.createElement("span", { className: "transition-colors" }, option.icon) : null,
      /* @__PURE__ */ React.createElement("span", { className: "text-sm font-normal" }, option.label)
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-t border-black/10 px-3 py-3" }, /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", onClick: () => onChange([]), className: "heading-font text-sm" }, "Clear"), /* @__PURE__ */ React.createElement(Button, { size: "sm", onClick: () => setOpen(false) }, "Done"))));
  };
  var PlatformFilter = ({ value, onChange }) => /* @__PURE__ */ React.createElement(
    MultiSelect,
    {
      placeholder: "All platforms",
      value,
      onChange,
      options: ALL_PLATFORMS.map((platform) => ({
        value: platform,
        label: platform,
        icon: /* @__PURE__ */ React.createElement(PlatformIcon, { platform })
      }))
    }
  );
  var ApproverMulti = ({ value, onChange }) => /* @__PURE__ */ React.createElement(
    MultiSelect,
    {
      placeholder: "Select approvers",
      value,
      onChange,
      options: DEFAULT_APPROVERS.map((name) => ({
        value: name,
        label: name
      }))
    }
  );
  var Modal = ({ open, onClose, children }) => {
    if (!open) return null;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 py-8",
        onMouseDown: (event) => {
          if (event.target === event.currentTarget) onClose();
        }
      },
      /* @__PURE__ */ React.createElement("div", { className: "floating-panel w-full max-w-3xl overflow-hidden rounded-3xl border border-aqua-200" }, children)
    );
  };
  var FieldRow = ({ label, children }) => /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "col-span-1 pt-2 text-sm font-medium text-graystone-700" }, label), /* @__PURE__ */ React.createElement("div", { className: "col-span-2 space-y-2 text-sm text-graystone-800" }, children));

  // src/content-dashboard.jsx
  var { useState: useState2, useMemo, useEffect } = React;
  function EntryForm({
    monthCursor,
    onSubmit,
    existingEntries = [],
    testingFrameworks = [],
    onPreviewAssetType,
    guidelines = DEFAULT_GUIDELINES,
    currentUser = ""
  }) {
    const [date, setDate] = useState2(() => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
    const [approvers, setApprovers] = useState2([]);
    const [author, setAuthor] = useState2("");
    const [platforms, setPlatforms] = useState2([]);
    const [allPlatforms, setAllPlatforms] = useState2(false);
    const [caption, setCaption] = useState2("");
    const [url, setUrl] = useState2("");
    const [assetType, setAssetType] = useState2("Design");
    const [script, setScript] = useState2("");
    const [designCopy, setDesignCopy] = useState2("");
    const [slidesCount, setSlidesCount] = useState2(3);
    const [carouselSlides, setCarouselSlides] = useState2(["", "", ""]);
    const [firstComment, setFirstComment] = useState2("");
    const [previewUrl, setPreviewUrl] = useState2("");
    const [previewUploadError, setPreviewUploadError] = useState2("");
    const [overrideConflict, setOverrideConflict] = useState2(false);
    const [platformCaptions, setPlatformCaptions] = useState2({});
    const [activeCaptionTab, setActiveCaptionTab] = useState2("Main");
    const [activePreviewPlatform, setActivePreviewPlatform] = useState2("Main");
    const [workflowStatus, setWorkflowStatus] = useState2(KANBAN_STATUSES[0]);
    const [campaign, setCampaign] = useState2("");
    const [contentPillar, setContentPillar] = useState2("");
    const [testingFrameworkId, setTestingFrameworkId] = useState2("");
    const dayOptions = useMemo(() => {
      const total = daysInMonth(monthCursor.getFullYear(), monthCursor.getMonth());
      return Array.from(
        { length: total },
        (_, index) => new Date(monthCursor.getFullYear(), monthCursor.getMonth(), index + 1).toISOString().slice(0, 10)
      );
    }, [monthCursor]);
    useEffect(() => {
      if (allPlatforms) {
        setPlatforms((prev) => {
          const alreadyAll = prev.length === ALL_PLATFORMS.length && ALL_PLATFORMS.every((p) => prev.includes(p));
          return alreadyAll ? prev : [...ALL_PLATFORMS];
        });
      }
    }, [allPlatforms]);
    useEffect(() => {
      onPreviewAssetType?.(assetType || null);
    }, [assetType, onPreviewAssetType]);
    useEffect(() => {
      setCarouselSlides((prev) => {
        if (slidesCount > prev.length) {
          return [...prev, ...Array(slidesCount - prev.length).fill("")];
        }
        if (slidesCount < prev.length) {
          return prev.slice(0, slidesCount);
        }
        return prev;
      });
    }, [slidesCount]);
    const conflicts = useMemo(
      () => (existingEntries || []).filter(
        (entry) => !entry.deletedAt && entry.date === date
      ),
      [existingEntries, date]
    );
    const hasConflict = conflicts.length > 0;
    useEffect(() => {
      setOverrideConflict(false);
    }, [date]);
    useEffect(() => {
      setActiveCaptionTab((prevTab) => prevTab === "Main" || platforms.includes(prevTab) ? prevTab : "Main");
      setPlatformCaptions((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          if (!platforms.includes(key)) delete updated[key];
        });
        return updated;
      });
      setActivePreviewPlatform((prev) => prev === "Main" || platforms.includes(prev) ? prev : platforms[0] || "Main");
    }, [platforms]);
    const reset = () => {
      setApprovers([]);
      setAuthor("");
      setPlatforms([]);
      setAllPlatforms(false);
      setCaption("");
      setUrl("");
      setPreviewUrl("");
      setAssetType("Design");
      setScript("");
      setDesignCopy("");
      setSlidesCount(3);
      setCarouselSlides(["", "", ""]);
      setFirstComment("");
      setOverrideConflict(false);
      setPlatformCaptions({});
      setActiveCaptionTab("Main");
      setActivePreviewPlatform("Main");
      setWorkflowStatus(KANBAN_STATUSES[0]);
      setCampaign("");
      setContentPillar("");
      setTestingFrameworkId("");
      onPreviewAssetType?.(null);
    };
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
        author: author || void 0,
        platforms: ensureArray(allPlatforms ? [...ALL_PLATFORMS] : platforms),
        caption,
        url: url || void 0,
        previewUrl: previewUrl || void 0,
        assetType,
        script: assetType === "Video" ? script : void 0,
        designCopy: assetType === "Design" ? designCopy : void 0,
        carouselSlides: assetType === "Carousel" ? carouselSlides : void 0,
        firstComment,
        platformCaptions: cleanedCaptions,
        workflowStatus,
        campaign: campaign || void 0,
        contentPillar: contentPillar || void 0,
        testingFrameworkId: testingFrameworkId || void 0,
        testingFrameworkName: selectedFramework ? selectedFramework.name : void 0
      });
      reset();
    };
    const handleSubmit = (event) => {
      event.preventDefault();
      if (hasConflict && !overrideConflict) {
        return;
      }
      submitEntry();
    };
    const handleSubmitAnyway = () => {
      setOverrideConflict(true);
      submitEntry();
    };
    const captionTabs = useMemo(() => ["Main", ...platforms], [platforms]);
    const currentCaptionValue = activeCaptionTab === "Main" ? caption : platformCaptions[activeCaptionTab] ?? caption;
    const previewPlatforms = platforms.length ? platforms : ["Main"];
    const effectivePreviewPlatform = previewPlatforms.includes(activePreviewPlatform) ? activePreviewPlatform : previewPlatforms[0] || "Main";
    const previewCaption = getPlatformCaption(caption, platformCaptions, effectivePreviewPlatform);
    const previewIsImage = isImageMedia(previewUrl);
    const previewIsVideo = previewUrl && /\.(mp4|webm|ogg)$/i.test(previewUrl);
    const handleCaptionChange = (value) => {
      if (activeCaptionTab === "Main") {
        setCaption(value);
      } else {
        setPlatformCaptions((prev) => ({
          ...prev,
          [activeCaptionTab]: value
        }));
      }
    };
    const handlePlatformToggle = (platform, checked) => {
      setPlatforms((prev) => {
        const next = checked ? prev.includes(platform) ? prev : [...prev, platform] : prev.filter((p) => p !== platform);
        setPlatformCaptions((prevCaptions) => {
          const updated = { ...prevCaptions };
          Object.keys(updated).forEach((key) => {
            if (!next.includes(key)) delete updated[key];
          });
          return updated;
        });
        setActiveCaptionTab(
          (prevTab) => prevTab === "Main" || next.includes(prevTab) ? prevTab : "Main"
        );
        setActivePreviewPlatform(
          (prev2) => prev2 === "Main" || next.includes(prev2) ? prev2 : next[0] || "Main"
        );
        return next;
      });
    };
    return /* @__PURE__ */ React.createElement(Card, { className: "shadow-xl" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-xl text-ocean-900" }, "Create Content")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("form", { className: "space-y-6", onSubmit: handleSubmit }, /* @__PURE__ */ React.createElement("div", { className: "grid gap-6 lg:grid-cols-[2fr,1fr]" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Date"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: date,
        onChange: (event) => setDate(event.target.value),
        className: cx(selectBaseClasses, "w-full")
      },
      dayOptions.map((iso) => /* @__PURE__ */ React.createElement("option", { key: iso, value: iso }, new Date(iso).toLocaleDateString(void 0, {
        weekday: "short",
        day: "2-digit",
        month: "short"
      })))
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Workflow status"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: workflowStatus,
        onChange: (event) => setWorkflowStatus(event.target.value),
        className: cx(selectBaseClasses, "w-full")
      },
      KANBAN_STATUSES.map((statusOption) => /* @__PURE__ */ React.createElement("option", { key: statusOption, value: statusOption }, statusOption))
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Testing framework"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: testingFrameworkId,
        onChange: (event) => setTestingFrameworkId(event.target.value),
        className: cx(selectBaseClasses, "w-full")
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, "No testing framework"),
      testingFrameworks.map((framework) => /* @__PURE__ */ React.createElement("option", { key: framework.id, value: framework.id }, framework.name))
    ), testingFrameworks.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-graystone-500" }, "Create frameworks in the Testing Lab to link experiments.") : /* @__PURE__ */ React.createElement("p", { className: "text-xs text-graystone-500" }, "Attach this brief to a testing plan for reporting.")), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Campaign"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: campaign,
        onChange: (event) => setCampaign(event.target.value),
        className: cx(selectBaseClasses, "w-full")
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, "No campaign"),
      CAMPAIGNS.map((name) => /* @__PURE__ */ React.createElement("option", { key: name, value: name }, name))
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Content pillar"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: contentPillar,
        onChange: (event) => setContentPillar(event.target.value),
        className: cx(selectBaseClasses, "w-full")
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, "Not tagged"),
      CONTENT_PILLARS.map((name) => /* @__PURE__ */ React.createElement("option", { key: name, value: name }, name))
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Approvers"), /* @__PURE__ */ React.createElement(ApproverMulti, { value: approvers, onChange: setApprovers })), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Platforms"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(Toggle, { id: "all-platforms", checked: allPlatforms, onChange: setAllPlatforms, ariaLabel: "Select all platforms" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm text-graystone-600" }, "Select all platforms")), !allPlatforms && /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2 md:grid-cols-2" }, ALL_PLATFORMS.map((platform) => /* @__PURE__ */ React.createElement(
      "label",
      {
        key: platform,
        className: "flex items-center gap-2 rounded-xl border border-graystone-200 bg-white px-3 py-2 text-sm text-graystone-700 shadow-sm hover:border-graystone-300"
      },
      /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "checkbox",
          className: "h-4 w-4 rounded border-graystone-300",
          checked: platforms.includes(platform),
          onChange: (event) => handlePlatformToggle(platform, event.target.checked)
        }
      ),
      /* @__PURE__ */ React.createElement(PlatformIcon, { platform }),
      /* @__PURE__ */ React.createElement("span", null, platform)
    )))), hasConflict && /* @__PURE__ */ React.createElement("div", { className: "rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-800" }, /* @__PURE__ */ React.createElement("div", { className: "font-semibold" }, "Heads up: ", conflicts.length, " post", conflicts.length === 1 ? "" : "s", " already scheduled on this date."), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-xs text-amber-700" }, "You can continue, but consider spacing things out."), /* @__PURE__ */ React.createElement("div", { className: "mt-3 flex flex-wrap items-center gap-2" }, /* @__PURE__ */ React.createElement(Button, { size: "sm", onClick: handleSubmitAnyway }, "Submit anyway"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-xs text-amber-700" }, /* @__PURE__ */ React.createElement("span", null, "Try a different date:"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: date,
        onChange: (event) => {
          setOverrideConflict(false);
          setDate(event.target.value);
        },
        className: cx(selectBaseClasses, "px-3 py-1 text-xs")
      },
      dayOptions.map((iso) => /* @__PURE__ */ React.createElement("option", { key: iso, value: iso }, new Date(iso).toLocaleDateString(void 0, {
        weekday: "short",
        day: "2-digit",
        month: "short"
      })))
    )))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "author" }, "Author"), /* @__PURE__ */ React.createElement(
      "select",
      {
        id: "author",
        value: author,
        onChange: (event) => setAuthor(event.target.value),
        className: cx(selectBaseClasses, "w-full")
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, "Select author"),
      /* @__PURE__ */ React.createElement("option", { value: "Dan" }, "Dan"),
      /* @__PURE__ */ React.createElement("option", { value: "Fran" }, "Fran")
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement(Label, null, "Captions"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, captionTabs.map((tab) => /* @__PURE__ */ React.createElement(
      Button,
      {
        key: tab,
        type: "button",
        size: "sm",
        variant: activeCaptionTab === tab ? "solid" : "outline",
        onClick: () => setActiveCaptionTab(tab)
      },
      tab === "Main" ? "Main caption" : tab
    ))), /* @__PURE__ */ React.createElement(
      Textarea,
      {
        value: currentCaptionValue,
        onChange: (event) => handleCaptionChange(event.target.value),
        rows: 4,
        placeholder: "Primary post caption"
      }
    ), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-graystone-500" }, activeCaptionTab === "Main" ? "Changes here apply to every platform unless you customise a specific tab." : `${activeCaptionTab} caption overrides the main copy for that platform.`), /* @__PURE__ */ React.createElement(
      CopyCheckSection,
      {
        caption,
        platformCaptions,
        platforms,
        assetType,
        guidelines,
        currentUser,
        onApply: (platform, text, activeGuidelines) => {
          if (platform === "Main") {
            setCaption(text);
          } else {
            setPlatformCaptions((prev) => ({ ...prev, [platform]: text }));
          }
          appendAudit({
            user: currentUser,
            action: "copy-check-apply",
            meta: { scope: "form", platform, assetType }
          });
          if (activeGuidelines?.teamsWebhookUrl) {
            try {
              fetch(activeGuidelines.teamsWebhookUrl, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ text: `Copy check applied (${platform}) by ${currentUser}` })
              });
            } catch {
            }
          }
        }
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "url" }, "URL (optional)"), /* @__PURE__ */ React.createElement(
      Input,
      {
        id: "url",
        type: "url",
        value: url,
        onChange: (event) => setUrl(event.target.value),
        placeholder: "https://example.org/article"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "previewUrl" }, "Preview asset"), /* @__PURE__ */ React.createElement(
      Input,
      {
        id: "previewUrl",
        type: "url",
        value: previewUrl,
        onChange: (event) => setPreviewUrl(event.target.value),
        placeholder: "https://cdn.example.com/assets/post.png"
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-3" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "file",
        accept: "image/*",
        onChange: (event) => {
          const file = event.target.files && event.target.files[0];
          if (!file) return;
          if (file.size > MAX_UPLOAD_BYTES) {
            setPreviewUploadError(`File too large (max 5 MB): ${file.name}`);
            event.target.value = "";
            return;
          }
          setPreviewUploadError("");
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              setPreviewUrl(reader.result);
            }
          };
          reader.readAsDataURL(file);
        },
        className: cx(fileInputClasses, "text-xs")
      }
    ), previewUrl && /* @__PURE__ */ React.createElement(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => setPreviewUrl("") }, "Clear preview")), previewUploadError && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-red-600" }, previewUploadError), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-graystone-500" }, "Supports inline image previews in the modal.")), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Asset type"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: assetType,
        onChange: (event) => setAssetType(event.target.value),
        className: cx(selectBaseClasses, "w-full")
      },
      /* @__PURE__ */ React.createElement("option", { value: "Video" }, "Video"),
      /* @__PURE__ */ React.createElement("option", { value: "Design" }, "Design"),
      /* @__PURE__ */ React.createElement("option", { value: "Carousel" }, "Carousel")
    )), assetType === "Video" && /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "script" }, "Script"), /* @__PURE__ */ React.createElement(Textarea, { id: "script", value: script, onChange: (event) => setScript(event.target.value), rows: 4 })), assetType === "Design" && /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "designCopy" }, "Design copy"), /* @__PURE__ */ React.createElement(Textarea, { id: "designCopy", value: designCopy, onChange: (event) => setDesignCopy(event.target.value), rows: 4 })), assetType === "Carousel" && /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Number of slides"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: String(slidesCount),
        onChange: (event) => setSlidesCount(Number(event.target.value)),
        className: cx(selectBaseClasses, "w-full")
      },
      Array.from({ length: 10 }, (_, index) => /* @__PURE__ */ React.createElement("option", { key: index + 1, value: index + 1 }, index + 1))
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, carouselSlides.map((val, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Slide ", idx + 1, " copy"), /* @__PURE__ */ React.createElement(
      Textarea,
      {
        value: val,
        onChange: (event) => setCarouselSlides(
          (prev) => prev.map((slide, slideIndex) => slideIndex === idx ? event.target.value : slide)
        ),
        placeholder: `Copy for slide ${idx + 1}`
      }
    ))))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "firstComment" }, "First comment"), /* @__PURE__ */ React.createElement(
      Textarea,
      {
        id: "firstComment",
        value: firstComment,
        onChange: (event) => setFirstComment(event.target.value),
        placeholder: "Hashtags, context, extra links",
        rows: 3
      }
    ))), platforms.length > 0 && /* @__PURE__ */ React.createElement("aside", { className: "space-y-4 rounded-2xl border border-aqua-200 bg-aqua-50 p-4 text-sm text-graystone-700" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-semibold text-ocean-700" }, "Platform tips"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-graystone-600" }, "Use these prompts to tailor captions per channel.")), platforms.map((platform) => {
      const tips = PLATFORM_TIPS[platform];
      if (!tips) return null;
      return /* @__PURE__ */ React.createElement("div", { key: platform, className: "space-y-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold text-ocean-700" }, platform), /* @__PURE__ */ React.createElement("ul", { className: "ml-4 list-disc space-y-1 text-xs text-graystone-600" }, tips.map((tip, idx) => /* @__PURE__ */ React.createElement("li", { key: idx }, tip))));
    }))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-3" }, /* @__PURE__ */ React.createElement(Button, { type: "submit", className: "gap-2", disabled: hasConflict && !overrideConflict }, /* @__PURE__ */ React.createElement(PlusIcon, { className: "h-4 w-4" }), "Submit to plan"), /* @__PURE__ */ React.createElement(Button, { type: "button", variant: "outline", onClick: reset }, "Reset")))));
  }
  function KanbanBoard({ statuses, entries, onOpen, onUpdateStatus }) {
    return /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto pb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex min-w-max gap-4" }, statuses.map((status) => {
      const cards = entries.filter(
        (entry) => (entry.workflowStatus || statuses[0]) === status
      );
      return /* @__PURE__ */ React.createElement("div", { key: status, className: "w-72 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "mb-3 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold text-ocean-700" }, status), /* @__PURE__ */ React.createElement(Badge, { variant: "secondary" }, cards.length)), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, cards.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "rounded-xl border border-aqua-200 bg-aqua-50 px-3 py-4 text-xs text-graystone-500" }, "Nothing here yet.") : cards.map((entry) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: entry.id,
          className: "space-y-2 rounded-2xl border border-graystone-200 bg-white p-3 shadow-sm"
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement(Badge, { variant: "outline" }, entry.assetType), entry.analytics && Object.keys(entry.analytics).length ? /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-ocean-500/10 px-2 py-0.5 text-[11px] font-semibold text-ocean-700" }, "Performance") : null, /* @__PURE__ */ React.createElement(
          "select",
          {
            value: entry.workflowStatus || statuses[0],
            onChange: (event) => onUpdateStatus(entry.id, event.target.value),
            className: cx(selectBaseClasses, "w-32 px-3 py-1 text-xs")
          },
          statuses.map((option) => /* @__PURE__ */ React.createElement("option", { key: option, value: option }, option))
        )),
        /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold text-graystone-800 line-clamp-2" }, entry.caption || entry.title || "Untitled"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-1 text-[11px] text-graystone-500" }, entry.campaign ? /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-aqua-100 px-2 py-0.5 text-ocean-700" }, entry.campaign) : null, entry.contentPillar ? /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-graystone-100 px-2 py-0.5 text-graystone-700" }, entry.contentPillar) : null, entry.testingFrameworkName ? /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-ocean-500/10 px-2 py-0.5 text-ocean-700" }, "Test: ", entry.testingFrameworkName) : null)),
        /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2 text-xs text-graystone-500" }, /* @__PURE__ */ React.createElement("span", null, new Date(entry.date).toLocaleDateString()), entry.platforms && entry.platforms.length > 0 && /* @__PURE__ */ React.createElement("span", null, entry.platforms.join(", "))),
        entry.firstComment && /* @__PURE__ */ React.createElement("div", { className: "rounded-xl bg-aqua-50 px-2 py-1 text-[11px] text-ocean-700 line-clamp-2" }, entry.firstComment),
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => onOpen(entry.id),
            className: "text-xs"
          },
          "Open"
        ), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] uppercase tracking-wide text-graystone-400" }, entry.status))
      ))));
    })));
  }
  function IdeaAttachment({ attachment }) {
    const isImage = typeof attachment.dataUrl === "string" && attachment.dataUrl.startsWith("data:image");
    return /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 rounded-xl border border-graystone-200 bg-white px-3 py-2 text-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-graystone-200 bg-graystone-100" }, isImage ? /* @__PURE__ */ React.createElement("img", { src: attachment.dataUrl, alt: attachment.name, className: "h-full w-full object-cover" }) : /* @__PURE__ */ React.createElement("span", { className: "text-xs text-graystone-500" }, attachment.type || "File")), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "font-medium text-graystone-700" }, attachment.name), attachment.size ? /* @__PURE__ */ React.createElement("div", { className: "text-xs text-graystone-500" }, Math.round(attachment.size / 1024), " KB") : null), /* @__PURE__ */ React.createElement(
      "a",
      {
        href: attachment.dataUrl,
        download: attachment.name || "attachment",
        className: "text-xs font-semibold text-ocean-600 hover:underline"
      },
      "Download"
    ));
  }
  function IdeaForm({ onSubmit, currentUser }) {
    const [type, setType] = useState2(IDEA_TYPES[0]);
    const [title, setTitle] = useState2("");
    const [notes, setNotes] = useState2("");
    const [inspiration, setInspiration] = useState2("");
    const [targetDate, setTargetDate] = useState2("");
    const [targetMonth, setTargetMonth] = useState2("");
    const [links, setLinks] = useState2([""]);
    const [attachments, setAttachments] = useState2([]);
    const [uploadError, setUploadError] = useState2("");
    const reset = () => {
      setType(IDEA_TYPES[0]);
      setTitle("");
      setNotes("");
      setInspiration("");
      setLinks([""]);
      setAttachments([]);
      setUploadError("");
      setTargetDate("");
      setTargetMonth("");
    };
    const handleFileUpload = (event) => {
      const files = event.target.files ? Array.from(event.target.files) : [];
      if (!files.length) return;
      const oversized = files.filter((f) => f.size > MAX_UPLOAD_BYTES);
      if (oversized.length) {
        setUploadError(`File too large (max 5 MB): ${oversized.map((f) => f.name).join(", ")}`);
        event.target.value = "";
        return;
      }
      setUploadError("");
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result !== "string") return;
          setAttachments((prev) => [
            ...prev,
            {
              id: uuid(),
              name: file.name,
              dataUrl: reader.result,
              type: file.type,
              size: file.size
            }
          ]);
        };
        reader.readAsDataURL(file);
      });
      event.target.value = "";
    };
    const updateLink = (index, value) => {
      setLinks((prev) => prev.map((link, idx) => idx === index ? value : link));
    };
    const addLinkField = () => setLinks((prev) => [...prev, ""]);
    const removeLinkField = (index) => {
      setLinks((prev) => prev.filter((_, idx) => idx !== index));
    };
    const removeAttachment = (id) => {
      setAttachments((prev) => prev.filter((item) => item.id !== id));
    };
    const submit = (event) => {
      event.preventDefault();
      if (!title.trim()) {
        window.alert("Please add a title for the idea.");
        return;
      }
      const monthValue = targetMonth ? targetMonth : targetDate ? targetDate.slice(0, 7) : "";
      const payload = {
        type,
        title: title.trim(),
        notes: notes.trim(),
        inspiration: inspiration.trim(),
        links: links.filter((link) => link && link.trim()),
        attachments,
        createdBy: currentUser || "Unknown",
        targetDate: targetDate || void 0,
        targetMonth: monthValue || void 0
      };
      onSubmit(payload);
      reset();
    };
    return /* @__PURE__ */ React.createElement(Card, { className: "shadow-xl" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-xl text-ocean-900" }, "Log a New Idea"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-500" }, "Capture inspiration before it disappears.")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("form", { onSubmit: submit, className: "space-y-5" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Idea type"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: type,
        onChange: (event) => setType(event.target.value),
        className: cx(selectBaseClasses, "w-full")
      },
      IDEA_TYPES.map((option) => /* @__PURE__ */ React.createElement("option", { key: option, value: option }, option))
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Logged by"), /* @__PURE__ */ React.createElement(Input, { value: currentUser || "Unknown", readOnly: true, className: "bg-graystone-100" })), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Target month"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "month",
        value: targetMonth,
        onChange: (event) => setTargetMonth(event.target.value),
        className: cx(selectBaseClasses, "w-full")
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Target date (optional)"), /* @__PURE__ */ React.createElement(
      Input,
      {
        type: "date",
        value: targetDate,
        onChange: (event) => setTargetDate(event.target.value)
      }
    ), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-graystone-500" }, "Set a specific day if you already know when you want this idea to land.")), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Title"), /* @__PURE__ */ React.createElement(
      Input,
      {
        value: title,
        onChange: (event) => setTitle(event.target.value),
        placeholder: "Working title",
        required: true
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Notes"), /* @__PURE__ */ React.createElement(
      Textarea,
      {
        value: notes,
        onChange: (event) => setNotes(event.target.value),
        rows: 4,
        placeholder: "What is the angle or concept?"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Resources / inspiration"), /* @__PURE__ */ React.createElement(
      Textarea,
      {
        value: inspiration,
        onChange: (event) => setInspiration(event.target.value),
        rows: 3,
        placeholder: "Reference podcasts, creators, campaigns, or prompts"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement(Label, null, "Links"), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, links.map((link, index) => /* @__PURE__ */ React.createElement("div", { key: index, className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      Input,
      {
        value: link,
        onChange: (event) => updateLink(index, event.target.value),
        placeholder: "https://..."
      }
    ), links.length > 1 && /* @__PURE__ */ React.createElement(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => removeLinkField(index) }, "Remove")))), /* @__PURE__ */ React.createElement(Button, { type: "button", variant: "outline", size: "sm", onClick: addLinkField }, "Add another link")), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement(Label, null, "Attachments"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "file",
        multiple: true,
        onChange: handleFileUpload,
        className: cx(fileInputClasses, "text-xs")
      }
    ), uploadError && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-red-600" }, uploadError), attachments.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, attachments.map((attachment) => /* @__PURE__ */ React.createElement("div", { key: attachment.id, className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(IdeaAttachment, { attachment }), /* @__PURE__ */ React.createElement(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => removeAttachment(attachment.id) }, "Remove"))))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(Button, { type: "submit", className: "gap-2" }, /* @__PURE__ */ React.createElement(PlusIcon, { className: "h-4 w-4 text-white" }), "Log idea"), /* @__PURE__ */ React.createElement(Button, { type: "button", variant: "outline", onClick: reset }, "Reset")))));
  }
  function LinkedInSubmissionForm({ onSubmit, currentUser }) {
    const [submissionType, setSubmissionType] = useState2(LINKEDIN_TYPES[0]);
    const initialOwner = DEFAULT_APPROVERS.includes(currentUser) ? currentUser : DEFAULT_APPROVERS[0];
    const [owner, setOwner] = useState2(initialOwner);
    const [submitter, setSubmitter] = useState2(
      DEFAULT_APPROVERS.includes(currentUser) ? currentUser : DEFAULT_APPROVERS[0]
    );
    const [postCopy, setPostCopy] = useState2("");
    const [comments, setComments] = useState2("");
    const [status, setStatus] = useState2(LINKEDIN_STATUSES[0]);
    const [targetDate, setTargetDate] = useState2("");
    const [links, setLinks] = useState2([""]);
    const [attachments, setAttachments] = useState2([]);
    const [uploadError, setUploadError] = useState2("");
    const [title, setTitle] = useState2("LinkedIn draft");
    useEffect(() => {
      if (DEFAULT_APPROVERS.includes(currentUser)) {
        setOwner(currentUser);
        setSubmitter(currentUser);
      }
    }, [currentUser]);
    const reset = () => {
      setSubmissionType(LINKEDIN_TYPES[0]);
      setOwner(DEFAULT_APPROVERS.includes(currentUser) ? currentUser : DEFAULT_APPROVERS[0]);
      setSubmitter(DEFAULT_APPROVERS.includes(currentUser) ? currentUser : DEFAULT_APPROVERS[0]);
      setTitle("LinkedIn draft");
      setPostCopy("");
      setComments("");
      setStatus(LINKEDIN_STATUSES[0]);
      setTargetDate("");
      setLinks([""]);
      setAttachments([]);
      setUploadError("");
    };
    const handleFileUpload = (event) => {
      const files = event.target.files ? Array.from(event.target.files) : [];
      if (!files.length) return;
      const oversized = files.filter((f) => f.size > MAX_UPLOAD_BYTES);
      if (oversized.length) {
        setUploadError(`File too large (max 5 MB): ${oversized.map((f) => f.name).join(", ")}`);
        event.target.value = "";
        return;
      }
      setUploadError("");
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result !== "string") return;
          setAttachments((prev) => [
            ...prev,
            {
              id: uuid(),
              name: file.name,
              dataUrl: reader.result,
              type: file.type,
              size: file.size
            }
          ]);
        };
        reader.readAsDataURL(file);
      });
      event.target.value = "";
    };
    const updateLink = (index, value) => {
      setLinks((prev) => prev.map((link, idx) => idx === index ? value : link));
    };
    const addLinkField = () => setLinks((prev) => [...prev, ""]);
    const removeLinkField = (index) => {
      setLinks((prev) => prev.filter((_, idx) => idx !== index));
    };
    const removeAttachment = (id) => {
      setAttachments((prev) => prev.filter((item) => item.id !== id));
    };
    const submit = (event) => {
      event.preventDefault();
      if (!title.trim()) {
        window.alert("Please add a title for this submission.");
        return;
      }
      if (!postCopy.trim()) {
        window.alert("Please include draft post copy.");
        return;
      }
      const payload = {
        submissionType,
        owner: owner || currentUser || "",
        submitter: submitter || currentUser || "",
        postCopy,
        comments,
        status,
        targetDate,
        links: links.filter((link) => link && link.trim()),
        attachments,
        title
      };
      onSubmit(payload);
      reset();
    };
    return /* @__PURE__ */ React.createElement(Card, { className: "shadow-xl" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-xl text-ocean-900" }, "LinkedIn submission"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-600" }, "Share draft copy for personal accounts and route approvals.")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("form", { onSubmit: submit, className: "space-y-5" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Submission type"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: submissionType,
        onChange: (event) => setSubmissionType(event.target.value),
        className: cx(selectBaseClasses, "w-full")
      },
      LINKEDIN_TYPES.map((option) => /* @__PURE__ */ React.createElement("option", { key: option, value: option }, option))
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Status"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: status,
        onChange: (event) => setStatus(event.target.value),
        className: cx(selectBaseClasses, "w-full")
      },
      LINKEDIN_STATUSES.map((option) => /* @__PURE__ */ React.createElement("option", { key: option, value: option }, option))
    ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Account owner"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: owner,
        onChange: (event) => setOwner(event.target.value),
        className: cx(selectBaseClasses, "w-full")
      },
      DEFAULT_APPROVERS.map((person) => /* @__PURE__ */ React.createElement("option", { key: person, value: person }, person))
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Submitted by"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: submitter,
        onChange: (event) => setSubmitter(event.target.value),
        className: cx(selectBaseClasses, "w-full")
      },
      DEFAULT_APPROVERS.map((person) => /* @__PURE__ */ React.createElement("option", { key: person, value: person }, person))
    ))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Copy"), /* @__PURE__ */ React.createElement(
      Textarea,
      {
        value: postCopy,
        onChange: (event) => {
          const value = event.target.value;
          setPostCopy(value);
          const derived = value.trim().split(/\n+/)[0].slice(0, 80);
          if (derived) setTitle(derived);
        },
        rows: 6,
        placeholder: "Your LinkedIn copy goes here"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Comments"), /* @__PURE__ */ React.createElement(
      Textarea,
      {
        value: comments,
        onChange: (event) => setComments(event.target.value),
        rows: 3,
        placeholder: "Key points, hashtags, tagging instructions"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Target publish date"), /* @__PURE__ */ React.createElement(Input, { type: "date", value: targetDate, onChange: (event) => setTargetDate(event.target.value) }))), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement(Label, null, "Links to include"), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, links.map((link, index) => /* @__PURE__ */ React.createElement("div", { key: index, className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      Input,
      {
        value: link,
        onChange: (event) => updateLink(index, event.target.value),
        placeholder: "https://..."
      }
    ), links.length > 1 && /* @__PURE__ */ React.createElement(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => removeLinkField(index) }, "Remove")))), /* @__PURE__ */ React.createElement(Button, { type: "button", variant: "outline", size: "sm", onClick: addLinkField }, "Add another link")), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement(Label, null, "Images / videos to include"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "file",
        multiple: true,
        onChange: handleFileUpload,
        className: cx(fileInputClasses, "text-xs")
      }
    ), uploadError && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-red-600" }, uploadError), attachments.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, attachments.map((attachment) => /* @__PURE__ */ React.createElement("div", { key: attachment.id, className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(IdeaAttachment, { attachment }), /* @__PURE__ */ React.createElement(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => removeAttachment(attachment.id) }, "Remove"))))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(Button, { type: "submit", className: "gap-2" }, /* @__PURE__ */ React.createElement(PlusIcon, { className: "h-4 w-4" }), "Submit for review"), /* @__PURE__ */ React.createElement(Button, { type: "button", variant: "outline", onClick: reset }, "Reset")))));
  }
  function LinkedInSubmissionList({ submissions, onStatusChange }) {
    const [filter, setFilter] = useState2("All");
    const filtered = useMemo(() => {
      if (filter === "All") return submissions;
      return submissions.filter((item) => item.status === filter);
    }, [submissions, filter]);
    return /* @__PURE__ */ React.createElement(Card, { className: "shadow-xl" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-xl text-ocean-900" }, "LinkedIn queue"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-600" }, "Review, approve, and share drafted LinkedIn posts.")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Label, { className: "text-xs text-graystone-500" }, "Filter"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: filter,
        onChange: (event) => setFilter(event.target.value),
        className: cx(selectBaseClasses, "px-4 py-2 text-sm")
      },
      /* @__PURE__ */ React.createElement("option", { value: "All" }, "All statuses"),
      LINKEDIN_STATUSES.map((status) => /* @__PURE__ */ React.createElement("option", { key: status, value: status }, status))
    )))), /* @__PURE__ */ React.createElement(CardContent, null, filtered.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-600" }, "No submissions yet. Share a draft using the form.") : /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, filtered.map((submission) => /* @__PURE__ */ React.createElement("div", { key: submission.id, className: "space-y-2 rounded-2xl border border-graystone-200 bg-white p-4 shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2" }, /* @__PURE__ */ React.createElement(Badge, { variant: "outline" }, submission.submissionType), /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-aqua-100 px-2 py-0.5 text-xs text-ocean-700" }, submission.owner || "Unknown owner"), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-graystone-500" }, "Submitted by ", submission.submitter || "Unknown")), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: submission.status,
        onChange: (event) => onStatusChange(submission.id, event.target.value),
        className: cx(selectBaseClasses, "w-32 px-3 py-1 text-xs")
      },
      LINKEDIN_STATUSES.map((status) => /* @__PURE__ */ React.createElement("option", { key: status, value: status }, status))
    )), /* @__PURE__ */ React.createElement("div", { className: "text-lg font-semibold text-ocean-900" }, submission.title), /* @__PURE__ */ React.createElement("div", { className: "whitespace-pre-wrap text-sm text-graystone-700" }, submission.postCopy), submission.comments && /* @__PURE__ */ React.createElement("div", { className: "rounded-xl bg-aqua-50 px-3 py-2 text-xs text-ocean-700" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, "Comments:"), " ", submission.comments), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-3 text-xs text-graystone-500" }, submission.targetDate ? /* @__PURE__ */ React.createElement("span", null, "Target date ", new Date(submission.targetDate).toLocaleDateString()) : null, /* @__PURE__ */ React.createElement("span", null, "Created ", new Date(submission.createdAt).toLocaleString())), submission.links && submission.links.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-semibold uppercase tracking-wide text-graystone-500" }, "Links"), /* @__PURE__ */ React.createElement("ul", { className: "space-y-1 text-sm text-ocean-600" }, submission.links.map((link, idx) => /* @__PURE__ */ React.createElement("li", { key: idx }, /* @__PURE__ */ React.createElement("a", { href: link, target: "_blank", rel: "noopener noreferrer", className: "hover:underline" }, link))))), submission.attachments && submission.attachments.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-semibold uppercase tracking-wide text-graystone-500" }, "Attachments"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-2 md:grid-cols-2" }, submission.attachments.map((attachment) => /* @__PURE__ */ React.createElement(IdeaAttachment, { key: attachment.id, attachment })))))))));
  }
  function TestingFrameworkForm({ onSubmit }) {
    const [name, setName] = useState2("");
    const [hypothesis, setHypothesis] = useState2("");
    const [audience, setAudience] = useState2("");
    const [metric, setMetric] = useState2("");
    const [duration, setDuration] = useState2("");
    const [notes, setNotes] = useState2("");
    const [status, setStatus] = useState2(TESTING_STATUSES[0]);
    const reset = () => {
      setName("");
      setHypothesis("");
      setAudience("");
      setMetric("");
      setDuration("");
      setNotes("");
      setStatus(TESTING_STATUSES[0]);
    };
    const submit = (event) => {
      event.preventDefault();
      if (!name.trim()) {
        window.alert("Please name the testing framework.");
        return;
      }
      onSubmit({
        name: name.trim(),
        hypothesis,
        audience,
        metric,
        duration,
        notes,
        status
      });
      reset();
    };
    return /* @__PURE__ */ React.createElement(Card, { className: "shadow-xl" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-xl text-ocean-900" }, "Testing Lab"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-600" }, "Document hypotheses and guardrails for content experiments.")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("form", { onSubmit: submit, className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Framework name"), /* @__PURE__ */ React.createElement(Input, { value: name, onChange: (event) => setName(event.target.value), placeholder: "Experiment title" })), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Status"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: status,
        onChange: (event) => setStatus(event.target.value),
        className: cx(selectBaseClasses, "w-full")
      },
      TESTING_STATUSES.map((option) => /* @__PURE__ */ React.createElement("option", { key: option, value: option }, option))
    ))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Hypothesis"), /* @__PURE__ */ React.createElement(
      Textarea,
      {
        value: hypothesis,
        onChange: (event) => setHypothesis(event.target.value),
        rows: 3,
        placeholder: "If we\u2026 then we expect\u2026"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Audience / segment"), /* @__PURE__ */ React.createElement(Input, { value: audience, onChange: (event) => setAudience(event.target.value), placeholder: "Target audience" })), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Primary metric"), /* @__PURE__ */ React.createElement(Input, { value: metric, onChange: (event) => setMetric(event.target.value), placeholder: "Example: CTR, saves" }))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Test duration / cadence"), /* @__PURE__ */ React.createElement(Input, { value: duration, onChange: (event) => setDuration(event.target.value), placeholder: "e.g. 2 weeks / 4 posts" })), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Notes"), /* @__PURE__ */ React.createElement(Textarea, { value: notes, onChange: (event) => setNotes(event.target.value), rows: 3, placeholder: "Guardrails, next steps" })), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(Button, { type: "submit", className: "gap-2" }, /* @__PURE__ */ React.createElement(PlusIcon, { className: "h-4 w-4" }), "Save framework"), /* @__PURE__ */ React.createElement(Button, { type: "button", variant: "outline", onClick: reset }, "Reset")))));
  }
  function TestingFrameworkList({ frameworks, onDelete, onSelect, selectedId, entryCounts = {} }) {
    if (!frameworks.length) {
      return /* @__PURE__ */ React.createElement(Card, { className: "shadow-xl" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-xl text-ocean-900" }, "Experiment backlog"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-600" }, "Log experiments and link them to content briefs.")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-600" }, "No frameworks yet. Create one to define your testing plan.")));
    }
    return /* @__PURE__ */ React.createElement(Card, { className: "shadow-xl" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-xl text-ocean-900" }, "Experiment backlog"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-600" }, "Reference these when planning or reporting on tests.")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, frameworks.map((framework) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: framework.id,
        role: onSelect ? "button" : void 0,
        tabIndex: onSelect ? 0 : void 0,
        onClick: () => onSelect && onSelect(framework.id),
        onKeyDown: (event) => {
          if (!onSelect) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(framework.id);
          }
        },
        className: cx(
          "space-y-2 rounded-2xl border p-4 text-left shadow-sm transition",
          selectedId === framework.id ? "border-ocean-500 bg-aqua-50 ring-2 ring-ocean-500/20" : "border-graystone-200 bg-white hover:border-aqua-300 hover:bg-aqua-50/50"
        )
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col" }, /* @__PURE__ */ React.createElement("div", { className: "text-lg font-semibold text-ocean-900" }, framework.name), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2 text-xs text-graystone-500" }, /* @__PURE__ */ React.createElement("span", null, framework.status), /* @__PURE__ */ React.createElement("span", null, "Created ", new Date(framework.createdAt).toLocaleDateString()))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, selectedId === framework.id ? /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-ocean-500 px-2 py-0.5 text-[11px] font-semibold text-white" }, "Viewing hub") : null, /* @__PURE__ */ React.createElement(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: (event) => {
            event.stopPropagation();
            const confirmed = window.confirm("Remove this framework?");
            if (confirmed) onDelete(framework.id);
          }
        },
        "Remove"
      ))),
      /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-2 text-xs text-graystone-600 md:grid-cols-3" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-graystone-700" }, "Audience:"), " ", framework.audience || "\u2014"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-graystone-700" }, "Metric:"), " ", framework.metric || "\u2014"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-graystone-700" }, "Duration:"), " ", framework.duration || "\u2014")),
      framework.hypothesis && /* @__PURE__ */ React.createElement("div", { className: "rounded-xl bg-aqua-50 px-3 py-2 text-xs text-ocean-700" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-graystone-700" }, "Hypothesis:"), " ", framework.hypothesis),
      framework.notes && /* @__PURE__ */ React.createElement("div", { className: "rounded-xl bg-graystone-100 px-3 py-2 text-xs text-graystone-700" }, framework.notes),
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[11px] text-graystone-500" }, /* @__PURE__ */ React.createElement("span", null, entryCounts[framework.id] ? `${entryCounts[framework.id]} linked ${entryCounts[framework.id] === 1 ? "entry" : "entries"}` : "No linked content yet"), onSelect ? /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center gap-1 text-xs font-semibold text-ocean-600" }, "View hub \u2192") : null)
    )))));
  }
  function TestingFrameworkHub({ framework, entries = [], onOpenEntry }) {
    if (!framework) {
      return /* @__PURE__ */ React.createElement(Card, { className: "shadow-xl" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-xl text-ocean-900" }, "Experiment hub"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-600" }, "Select an experiment on the left to see linked content and progress.")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-600" }, "Need a place to start? Create a framework and attach it to a brief from the Create Content form.")));
    }
    return /* @__PURE__ */ React.createElement(Card, { className: "shadow-xl" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-xl text-ocean-900" }, framework.name), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-sm text-graystone-600" }, framework.hypothesis ? framework.hypothesis : "Linked briefs inherit this testing framework for reporting.")), /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-ocean-500/10 px-3 py-1 text-xs font-semibold text-ocean-700" }, framework.status)), /* @__PURE__ */ React.createElement("div", { className: "mt-3 grid grid-cols-1 gap-2 text-xs text-graystone-500 md:grid-cols-3" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-graystone-700" }, "Audience:"), " ", framework.audience || "\u2014"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-graystone-700" }, "Metric:"), " ", framework.metric || "\u2014"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-graystone-700" }, "Duration:"), " ", framework.duration || "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "mt-2 text-xs font-semibold uppercase tracking-wide text-graystone-400" }, entries.length, " linked ", entries.length === 1 ? "item" : "items")), /* @__PURE__ */ React.createElement(CardContent, null, entries.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "rounded-2xl border border-dashed border-aqua-200 bg-aqua-50/40 px-4 py-6 text-center text-sm text-graystone-600" }, "No content linked to this experiment yet. Attach a brief via Create Content to populate the hub.") : /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, entries.map((entry) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: entry.id,
        className: "space-y-2 rounded-2xl border border-graystone-200 bg-white p-4 shadow-sm"
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-start justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2" }, /* @__PURE__ */ React.createElement(Badge, { variant: "outline" }, entry.assetType), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold text-graystone-800" }, new Date(entry.date).toLocaleDateString(void 0, {
        weekday: "short",
        month: "short",
        day: "numeric"
      })), /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-aqua-100 px-2 py-0.5 text-xs font-medium text-ocean-700" }, entry.statusDetail), /* @__PURE__ */ React.createElement(
        "span",
        {
          className: cx(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            entry.status === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          )
        },
        entry.status
      )), entry.caption && /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-700 line-clamp-3" }, entry.caption), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-1 text-xs text-graystone-500" }, entry.platforms.map((platform) => /* @__PURE__ */ React.createElement(
        "span",
        {
          key: platform,
          className: "inline-flex items-center gap-1 rounded-full bg-graystone-100 px-2 py-1"
        },
        /* @__PURE__ */ React.createElement(PlatformIcon, { platform }),
        platform
      ))), (entry.campaign || entry.contentPillar) && /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-1 text-[11px] text-graystone-500" }, entry.campaign ? /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-aqua-100 px-2 py-0.5 text-ocean-700" }, entry.campaign) : null, entry.contentPillar ? /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-graystone-100 px-2 py-0.5 text-graystone-700" }, entry.contentPillar) : null)), onOpenEntry ? /* @__PURE__ */ React.createElement(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => onOpenEntry(entry.id),
          className: "text-xs"
        },
        "Open item"
      ) : null)
    )))));
  }
  function PerformanceImportModal({ open, onClose, onImport }) {
    const [summary, setSummary] = useState2(null);
    const [error, setError] = useState2("");
    const [importing, setImporting] = useState2(false);
    const [fileName, setFileName] = useState2("");
    useEffect(() => {
      if (!open) {
        setSummary(null);
        setError("");
        setImporting(false);
        setFileName("");
      }
    }, [open]);
    if (!open) return null;
    const handleFileChange = (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      setImporting(true);
      setError("");
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = typeof reader.result === "string" ? reader.result : "";
          const parsed = parseCSV(text);
          const result = onImport(parsed);
          setSummary(result);
          setFileName(file.name);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to import file.");
          setSummary(null);
        } finally {
          setImporting(false);
          if (event.target) event.target.value = "";
        }
      };
      reader.onerror = () => {
        setError("Failed to read the selected file.");
        setImporting(false);
        if (event.target) event.target.value = "";
      };
      reader.readAsText(file);
    };
    const renderIssues = (label, items, tone = "warn") => {
      if (!items || !items.length) return null;
      const toneClass = tone === "error" ? "border-rose-200 bg-rose-50" : tone === "warn" ? "border-amber-200 bg-amber-50" : "border-aqua-200 bg-aqua-50";
      return /* @__PURE__ */ React.createElement("div", { className: `rounded-2xl border px-4 py-3 text-sm ${toneClass}` }, /* @__PURE__ */ React.createElement("div", { className: "font-semibold text-graystone-700" }, label), /* @__PURE__ */ React.createElement("ul", { className: "mt-2 space-y-1 text-xs text-graystone-600" }, items.slice(0, 6).map((item, index) => /* @__PURE__ */ React.createElement("li", { key: index }, "Row ", item.rowNumber, ": ", item.reason)), items.length > 6 ? /* @__PURE__ */ React.createElement("li", { className: "font-medium" }, "\u2026and ", items.length - 6, " more.") : null));
    };
    const matchedCount = summary?.matched || 0;
    const totalRows = summary?.totalRows || 0;
    const updatedEntryCount = summary?.updatedEntryCount || 0;
    return /* @__PURE__ */ React.createElement(Modal, { open, onClose }, /* @__PURE__ */ React.createElement("div", { className: "bg-white" }, /* @__PURE__ */ React.createElement("div", { className: "border-b border-aqua-200 bg-ocean-500 px-6 py-4 text-white" }, /* @__PURE__ */ React.createElement("div", { className: "text-lg font-semibold" }, "Import performance"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-aqua-100" }, "Upload a CSV export from your social platforms to attach results to calendar items.")), /* @__PURE__ */ React.createElement("div", { className: "max-h-[70vh] space-y-5 overflow-y-auto px-6 py-6" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2 text-sm text-graystone-600" }, /* @__PURE__ */ React.createElement("div", { className: "font-semibold text-graystone-700" }, "How it works"), /* @__PURE__ */ React.createElement("ul", { className: "list-disc space-y-1 pl-5 text-xs" }, /* @__PURE__ */ React.createElement("li", null, "Include either an ", /* @__PURE__ */ React.createElement("code", null, "entry_id"), " column or both ", /* @__PURE__ */ React.createElement("code", null, "date"), " and", " ", /* @__PURE__ */ React.createElement("code", null, "platform"), " columns."), /* @__PURE__ */ React.createElement("li", null, "Metric columns (e.g. ", /* @__PURE__ */ React.createElement("code", null, "impressions"), ", ", /* @__PURE__ */ React.createElement("code", null, "clicks"), ", ", /* @__PURE__ */ React.createElement("code", null, "engagement_rate"), ") will be stored exactly as they appear."), /* @__PURE__ */ React.createElement("li", null, "Use one of the recognised platform names (Instagram, Facebook, LinkedIn, TikTok, YouTube, Threads, Pinterest, X/Twitter)."))), /* @__PURE__ */ React.createElement("div", { className: "rounded-2xl border border-dashed border-aqua-300 bg-aqua-50/50 px-4 py-5" }, /* @__PURE__ */ React.createElement("label", { className: "flex cursor-pointer flex-col items-center gap-2 text-sm font-semibold text-ocean-700" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "file",
        accept: ".csv",
        className: "hidden",
        onChange: handleFileChange,
        disabled: importing
      }
    ), /* @__PURE__ */ React.createElement("span", { className: "heading-font inline-flex items-center gap-2 rounded-full border border-black bg-black px-5 py-2 text-sm font-semibold text-white shadow-[0_0_30px_rgba(15,157,222,0.35)] transition hover:bg-white hover:text-black" }, importing ? "Importing\u2026" : "Choose CSV file"), fileName ? /* @__PURE__ */ React.createElement("span", { className: "text-xs text-graystone-600" }, fileName) : null, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-normal text-graystone-500" }, "Columns detected: entry_id \xB7 date \xB7 platform \xB7 impressions \xB7 engagements \xB7 clicks \u2026"))), error ? /* @__PURE__ */ React.createElement("div", { className: "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" }, error) : null, summary ? /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "rounded-2xl border border-aqua-200 bg-aqua-50 px-4 py-3" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold text-ocean-700" }, "Imported ", matchedCount, "/", totalRows, " rows into ", updatedEntryCount, " ", updatedEntryCount === 1 ? "entry" : "entries", "."), summary.updatedEntries && summary.updatedEntries.length ? /* @__PURE__ */ React.createElement("div", { className: "mt-1 text-xs text-graystone-600" }, "Updated IDs: ", summary.updatedEntries.join(", ")) : null), renderIssues("Rows skipped", summary.missing, "warn"), renderIssues("Rows needing attention", summary.ambiguous, "warn"), renderIssues("Errors", summary.errors, "error")) : null), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-end gap-3 border-t border-graystone-200 bg-graystone-50 px-6 py-4" }, /* @__PURE__ */ React.createElement(Button, { variant: "ghost", onClick: onClose }, "Close"))));
  }
  function ApprovalsModal({ open, onClose, approvals = [], onOpenEntry, onApprove }) {
    const hasItems = approvals.length > 0;
    return /* @__PURE__ */ React.createElement(Modal, { open, onClose }, /* @__PURE__ */ React.createElement("div", { className: "flex h-full max-h-[80vh] flex-col bg-white" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-graystone-200 px-6 py-4" }, /* @__PURE__ */ React.createElement("div", { className: "heading-font flex items-center gap-2 text-xl font-semibold text-black" }, /* @__PURE__ */ React.createElement("span", { className: "inline-block h-3 w-3 rounded-full bg-[#00F5FF]", "aria-hidden": "true" }), "Your Approvals"), /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "ghost",
        size: "sm",
        onClick: onClose,
        className: "heading-font text-sm normal-case"
      },
      "Close"
    )), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto px-6 py-5" }, hasItems ? /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, approvals.map((entry) => {
      const checklist = ensureChecklist(entry.checklist);
      const completed = Object.values(checklist).filter(Boolean).length;
      const total = CHECKLIST_ITEMS.length;
      const hasPreview = isImageMedia(entry.previewUrl);
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: entry.id,
          className: "rounded-3xl border border-graystone-200 bg-white p-5 shadow-sm transition hover:border-aqua-300"
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-start justify-between gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2" }, /* @__PURE__ */ React.createElement(Badge, { variant: "outline" }, entry.assetType), /* @__PURE__ */ React.createElement("span", { className: "heading-font text-sm font-semibold text-graystone-800" }, new Date(entry.date).toLocaleDateString(void 0, {
          month: "short",
          day: "numeric",
          weekday: "short"
        })), /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center rounded-full bg-aqua-100 px-2 py-1 text-xs font-medium text-ocean-700" }, entry.statusDetail || WORKFLOW_STAGES[0])), hasPreview ? /* @__PURE__ */ React.createElement("div", { className: "overflow-hidden rounded-2xl border border-graystone-200" }, /* @__PURE__ */ React.createElement(
          "img",
          {
            src: entry.previewUrl,
            alt: "Entry preview",
            className: "h-40 w-full object-cover"
          }
        )) : null, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2 text-xs text-graystone-500" }, /* @__PURE__ */ React.createElement("span", null, "Requested by ", entry.author || "Unknown"), entry.approvers?.length ? /* @__PURE__ */ React.createElement("span", null, "Approvers: ", entry.approvers.join(", ")) : null), entry.caption ? /* @__PURE__ */ React.createElement("p", { className: "line-clamp-4 text-sm text-graystone-700" }, entry.caption) : null, (entry.campaign || entry.contentPillar || entry.testingFrameworkName) && /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-1 text-[11px] text-graystone-500" }, entry.campaign ? /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-aqua-100 px-2 py-0.5 text-ocean-700" }, entry.campaign) : null, entry.contentPillar ? /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-graystone-100 px-2 py-0.5 text-graystone-700" }, entry.contentPillar) : null, entry.testingFrameworkName ? /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-ocean-500/10 px-2 py-0.5 text-ocean-700" }, "Test: ", entry.testingFrameworkName) : null), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 text-xs text-graystone-500" }, Object.entries(checklist).map(([key, value]) => {
          const definition = CHECKLIST_ITEMS.find((item) => item.key === key);
          if (!definition) return null;
          return /* @__PURE__ */ React.createElement(
            "span",
            {
              key,
              className: cx(
                "inline-flex items-center gap-1 rounded-full px-2 py-1",
                value ? "bg-emerald-100 text-emerald-700" : "bg-graystone-100 text-graystone-500"
              )
            },
            value ? /* @__PURE__ */ React.createElement(CheckCircleIcon, { className: "h-3 w-3 text-emerald-600" }) : /* @__PURE__ */ React.createElement(LoaderIcon, { className: "h-3 w-3 text-graystone-400 animate-none" }),
            definition.label
          );
        }), /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-graystone-100 px-2 py-1 text-xs text-graystone-600" }, "Checklist ", completed, "/", total))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-end gap-3" }, /* @__PURE__ */ React.createElement(
          Button,
          {
            size: "sm",
            onClick: () => onOpenEntry?.(entry.id),
            className: "heading-font text-xs normal-case"
          },
          "Review"
        ), /* @__PURE__ */ React.createElement(
          Button,
          {
            variant: entry.status === "Approved" ? "outline" : "solid",
            size: "sm",
            onClick: () => onApprove?.(entry.id),
            className: "heading-font text-xs normal-case"
          },
          entry.status === "Approved" ? "Mark pending" : "Approve"
        )))
      );
    })) : /* @__PURE__ */ React.createElement("div", { className: "flex h-full w-full flex-col items-center justify-center rounded-3xl border border-dashed border-graystone-200 bg-white/80 px-6 py-16 text-center" }, /* @__PURE__ */ React.createElement("p", { className: "heading-font text-lg font-semibold text-ocean-700" }, "You're all caught up"), /* @__PURE__ */ React.createElement("p", { className: "mt-2 max-w-sm text-sm text-graystone-500" }, "Anything assigned to you will pop up here for a quick review. Check back once teammates submit something new.")))));
  }
  function GuidelinesModal({ open, guidelines, onClose, onSave }) {
    const buildDraft = (source) => ({
      bannedWordsText: (source?.bannedWords || []).join(", "),
      requiredPhrasesText: (source?.requiredPhrases || []).join(", "),
      languageGuide: source?.languageGuide || "",
      hashtagTips: source?.hashtagTips || "",
      charLimits: { ...source?.charLimits || {} },
      teamsWebhookUrl: source?.teamsWebhookUrl || ""
    });
    const [draft, setDraft] = React.useState(buildDraft(guidelines));
    React.useEffect(() => {
      setDraft(buildDraft(guidelines));
    }, [guidelines]);
    if (!open) return null;
    const splitList = (value) => String(value || "").split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
    const handleSave = () => {
      onSave?.({
        bannedWords: splitList(draft.bannedWordsText),
        requiredPhrases: splitList(draft.requiredPhrasesText),
        languageGuide: draft.languageGuide,
        hashtagTips: draft.hashtagTips,
        charLimits: { ...draft.charLimits },
        teamsWebhookUrl: String(draft.teamsWebhookUrl || "")
      });
    };
    return /* @__PURE__ */ React.createElement(Modal, { open, onClose }, /* @__PURE__ */ React.createElement("div", { className: "bg-white" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-graystone-200 px-6 py-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "heading-font text-lg text-black" }, "Content standards"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-graystone-500" }, "Store language guidance, banned words, and platform best practices in one place.")), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", onClick: onClose }, "Close")), /* @__PURE__ */ React.createElement("div", { className: "max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6 text-sm text-graystone-700" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Banned words (comma or line separated)"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        className: "w-full rounded-2xl border border-graystone-200 px-3 py-2 text-sm shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-aqua-200",
        rows: 3,
        value: draft.bannedWordsText,
        onChange: (event) => setDraft((prev) => ({ ...prev, bannedWordsText: event.target.value }))
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Required phrases (comma or line separated)"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        className: "w-full rounded-2xl border border-graystone-200 px-3 py-2 text-sm shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-aqua-200",
        rows: 3,
        value: draft.requiredPhrasesText,
        onChange: (event) => setDraft((prev) => ({ ...prev, requiredPhrasesText: event.target.value }))
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Language guide"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        className: "w-full rounded-2xl border border-graystone-200 px-3 py-2 text-sm shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-aqua-200",
        rows: 4,
        value: draft.languageGuide,
        onChange: (event) => setDraft((prev) => ({ ...prev, languageGuide: event.target.value }))
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Hashtag recommendations"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        className: "w-full rounded-2xl border border-graystone-200 px-3 py-2 text-sm shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-aqua-200",
        rows: 3,
        value: draft.hashtagTips,
        onChange: (event) => setDraft((prev) => ({ ...prev, hashtagTips: event.target.value }))
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement(Label, null, "Character limit best practices"), /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "ghost",
        size: "sm",
        onClick: () => setDraft({
          ...draft,
          charLimits: { ...DEFAULT_GUIDELINES.charLimits }
        })
      },
      "Reset defaults"
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3 text-xs lg:grid-cols-3" }, ALL_PLATFORMS.map((platform) => /* @__PURE__ */ React.createElement("label", { key: platform, className: "flex flex-col gap-1 rounded-2xl border border-graystone-200 bg-white px-3 py-2 shadow-sm" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-graystone-600" }, platform), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 1,
        className: "dropdown-font w-full rounded-full border border-black px-3 py-1 text-xs",
        value: draft.charLimits?.[platform] ?? PLATFORM_DEFAULT_LIMITS[platform] ?? "",
        onChange: (event) => setDraft((prev) => ({
          ...prev,
          charLimits: {
            ...prev.charLimits,
            [platform]: Number(event.target.value)
          }
        }))
      }
    ))))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, null, "Microsoft Teams webhook URL (optional)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "url",
        placeholder: "https://outlook.office.com/webhook/...",
        className: "dropdown-font w-full rounded-full border border-black px-4 py-2 text-sm",
        value: draft.teamsWebhookUrl,
        onChange: (e) => setDraft((prev) => ({ ...prev, teamsWebhookUrl: e.target.value }))
      }
    ), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-graystone-500" }, "If set, approvals/AI applies can post a brief activity summary to Teams."))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-t border-graystone-200 bg-graystone-50 px-6 py-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-graystone-500" }, "Changes are saved locally and can be referenced by your team anytime."), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(Button, { variant: "ghost", onClick: onClose }, "Cancel"), /* @__PURE__ */ React.createElement(Button, { onClick: handleSave }, "Save guidelines")))));
  }
  function IdeasBoard({ ideas, onDelete }) {
    const [filter, setFilter] = useState2("All");
    const filteredIdeas = useMemo(() => {
      if (filter === "All") return ideas;
      return ideas.filter((idea) => idea.type === filter);
    }, [ideas, filter]);
    return /* @__PURE__ */ React.createElement(Card, { className: "shadow-xl" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-xl text-ocean-900" }, "Ideas Library"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-500" }, "A living backlog of topics, themes, and series ideas.")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Label, { className: "text-xs text-graystone-500" }, "Filter"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: filter,
        onChange: (event) => setFilter(event.target.value),
        className: cx(selectBaseClasses, "px-4 py-2 text-sm")
      },
      /* @__PURE__ */ React.createElement("option", { value: "All" }, "All ideas"),
      IDEA_TYPES.map((option) => /* @__PURE__ */ React.createElement("option", { key: option, value: option }, option))
    )))), /* @__PURE__ */ React.createElement(CardContent, null, filteredIdeas.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-500" }, "No ideas logged yet. Capture your next spark on the left.") : /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-4" }, filteredIdeas.map((idea) => /* @__PURE__ */ React.createElement("div", { key: idea.id, className: "rounded-2xl border border-graystone-200 bg-white p-4 shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-start justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2" }, /* @__PURE__ */ React.createElement(Badge, { variant: "outline" }, idea.type), /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-aqua-50 px-2 py-1 text-xs text-ocean-600" }, "Logged ", new Date(idea.createdAt).toLocaleString()), idea.createdBy ? /* @__PURE__ */ React.createElement("span", { className: "text-xs text-graystone-500" }, "by ", idea.createdBy) : null), /* @__PURE__ */ React.createElement("div", { className: "text-lg font-semibold text-ocean-900" }, idea.title), idea.notes && /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-700 whitespace-pre-wrap" }, idea.notes), idea.inspiration && /* @__PURE__ */ React.createElement("div", { className: "rounded-xl bg-aqua-50 p-3 text-xs text-ocean-700" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, "Inspiration:"), " ", idea.inspiration), idea.links && idea.links.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-semibold uppercase tracking-wide text-graystone-500" }, "Links"), /* @__PURE__ */ React.createElement("ul", { className: "space-y-1 text-sm text-ocean-600" }, idea.links.map((link, index) => /* @__PURE__ */ React.createElement("li", { key: index }, /* @__PURE__ */ React.createElement("a", { href: link, target: "_blank", rel: "noopener noreferrer", className: "hover:underline" }, link))))), idea.attachments && idea.attachments.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-semibold uppercase tracking-wide text-graystone-500" }, "Attachments"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-2 md:grid-cols-2" }, idea.attachments.map((attachment) => /* @__PURE__ */ React.createElement(IdeaAttachment, { key: attachment.id, attachment })))), (idea.targetMonth || idea.targetDate) && /* @__PURE__ */ React.createElement("div", { className: "text-xs text-graystone-500" }, idea.targetMonth ? `Planned for ${idea.targetMonth}` : null, idea.targetDate ? ` \u2022 Aim for ${new Date(idea.targetDate).toLocaleDateString()}` : null)), /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "ghost",
        size: "sm",
        onClick: () => {
          const confirmDelete = window.confirm("Remove this idea from the log?");
          if (confirmDelete) onDelete(idea.id);
        }
      },
      /* @__PURE__ */ React.createElement(TrashIcon, { className: "h-4 w-4 text-graystone-500" }),
      "Remove"
    )))))));
  }
  function MonthGrid({ days, month, year, entries, onApprove, onDelete, onOpen }) {
    const byDate = useMemo(() => {
      const map = /* @__PURE__ */ new Map();
      days.forEach((day) => {
        const iso = new Date(year, month, day).toISOString().slice(0, 10);
        map.set(iso, []);
      });
      entries.forEach((entry) => {
        const arr = map.get(entry.date) || [];
        arr.push(entry);
        map.set(entry.date, arr);
      });
      return map;
    }, [days, month, year, entries]);
    return /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" }, days.map((day) => {
      const iso = new Date(year, month, day).toISOString().slice(0, 10);
      const dayEntries = byDate.get(iso) || [];
      const label = new Date(year, month, day).toLocaleDateString(void 0, {
        weekday: "short",
        day: "2-digit"
      });
      return /* @__PURE__ */ React.createElement(Card, { key: iso, className: "flex h-64 flex-col bg-white" }, /* @__PURE__ */ React.createElement(CardHeader, { className: "border-b border-graystone-200 py-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-sm font-semibold text-ocean-900" }, label), /* @__PURE__ */ React.createElement(Badge, { variant: dayEntries.length ? "default" : "secondary" }, dayEntries.length, " ", dayEntries.length === 1 ? "item" : "items"))), /* @__PURE__ */ React.createElement(CardContent, { className: "flex-1 space-y-3 overflow-y-auto" }, dayEntries.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-500" }, "No items planned."), dayEntries.map((entry) => {
        const checklist = ensureChecklist(entry.checklist);
        const completed = Object.values(checklist).filter(Boolean).length;
        const total = CHECKLIST_ITEMS.length;
        const hasPreviewImage = isImageMedia(entry.previewUrl);
        const hasPerformance = entry.analytics && Object.keys(entry.analytics).length > 0;
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: entry.id,
            className: "cursor-pointer rounded-xl border border-graystone-200 bg-white p-3 transition hover:border-aqua-400 hover:bg-aqua-50",
            onClick: () => onOpen(entry.id)
          },
          /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, hasPreviewImage && /* @__PURE__ */ React.createElement("div", { className: "overflow-hidden rounded-lg border border-graystone-200" }, /* @__PURE__ */ React.createElement(
            "img",
            {
              src: entry.previewUrl,
              alt: `${entry.assetType} preview`,
              className: "h-24 w-full object-cover"
            }
          )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2" }, /* @__PURE__ */ React.createElement(Badge, { variant: "outline" }, entry.assetType), /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center rounded-full bg-aqua-100 px-2 py-1 text-xs font-medium text-ocean-700" }, entry.statusDetail || WORKFLOW_STAGES[0]), hasPerformance ? /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center gap-1 rounded-full bg-ocean-500/10 px-2 py-0.5 text-xs font-medium text-ocean-700" }, "Performance") : null, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1" }, entry.platforms.map((platform) => /* @__PURE__ */ React.createElement(
            "span",
            {
              key: platform,
              className: "inline-flex items-center gap-1 rounded-full bg-graystone-100 px-2 py-1 text-xs text-graystone-600"
            },
            /* @__PURE__ */ React.createElement(PlatformIcon, { platform }),
            platform
          )))), entry.caption && /* @__PURE__ */ React.createElement("p", { className: "line-clamp-3 text-sm text-graystone-700" }, entry.caption), (entry.campaign || entry.contentPillar || entry.testingFrameworkName) && /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-1 text-[11px] text-graystone-500" }, entry.campaign ? /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-aqua-100 px-2 py-0.5 text-ocean-700" }, entry.campaign) : null, entry.contentPillar ? /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-graystone-100 px-2 py-0.5 text-graystone-700" }, entry.contentPillar) : null, entry.testingFrameworkName ? /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-ocean-500/10 px-2 py-0.5 text-ocean-700" }, "Test: ", entry.testingFrameworkName) : null), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-graystone-500" }, "Checklist ", completed, "/", total)), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-end gap-2" }, /* @__PURE__ */ React.createElement(
            "span",
            {
              className: cx(
                "rounded-full px-2 py-1 text-xs font-semibold",
                entry.status === "Approved" && "bg-emerald-100 text-emerald-700",
                entry.status === "Pending" && "bg-amber-100 text-amber-700"
              )
            },
            entry.status
          ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement(
            Button,
            {
              size: "icon",
              variant: "ghost",
              onClick: (event) => {
                event.stopPropagation();
                onApprove(entry.id);
              },
              title: "Toggle approval"
            },
            entry.status === "Approved" ? /* @__PURE__ */ React.createElement(CheckCircleIcon, { className: "h-5 w-5 text-emerald-600" }) : /* @__PURE__ */ React.createElement(LoaderIcon, { className: "h-5 w-5 text-amber-600" })
          ), /* @__PURE__ */ React.createElement(
            Button,
            {
              size: "icon",
              variant: "ghost",
              onClick: (event) => {
                event.stopPropagation();
                const confirmDelete = window.confirm(
                  "Move this item to the trash? You can restore it within 30 days."
                );
                if (confirmDelete) onDelete(entry.id);
              },
              title: "Move to trash"
            },
            /* @__PURE__ */ React.createElement(TrashIcon, { className: "h-5 w-5 text-graystone-500" })
          ))))
        );
      })));
    }));
  }
  function AssetMixPie({ counts, total }) {
    const palette = {
      Video: "#2563eb",
      Design: "#1d4ed8",
      Carousel: "#60a5fa"
    };
    const entries = ["Video", "Design", "Carousel"].map((type) => ({ type, value: counts[type] || 0 })).filter((item) => item.value > 0);
    if (!entries.length || !total) return null;
    let cumulative = 0;
    const segments = entries.map(({ type, value }) => {
      const start = cumulative / total * 100;
      cumulative += value;
      const end = cumulative / total * 100;
      const color = palette[type] || "#2563eb";
      return `${color} ${start}% ${end}%`;
    });
    const gradient = `conic-gradient(${segments.join(", ")})`;
    cumulative = 0;
    return /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "h-16 w-16 rounded-full border border-aqua-200",
        style: { background: gradient }
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "space-y-1 text-xs text-graystone-600" }, entries.map(({ type, value }) => {
      const color = palette[type] || "#2563eb";
      const percentage = Math.round(value / total * 100);
      return /* @__PURE__ */ React.createElement("div", { key: type, className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "inline-block h-2 w-2 rounded-full", style: { backgroundColor: color } }), /* @__PURE__ */ React.createElement("span", { className: "font-medium text-graystone-700" }, type), /* @__PURE__ */ React.createElement("span", null, value, " (", percentage, "% )"));
    })));
  }
  var WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
  function MiniCalendar({ monthCursor, entries, onOpenEntry }) {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const totalDays = daysInMonth(year, month);
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalCells = Math.ceil((firstDayIndex + totalDays) / 7) * 7;
    const entriesByDate = useMemo(() => {
      const map = /* @__PURE__ */ new Map();
      entries.forEach((entry) => {
        if (!entry?.date) return;
        const list = map.get(entry.date) || [];
        list.push(entry);
        map.set(entry.date, list);
      });
      return map;
    }, [entries]);
    const cells = useMemo(() => {
      const items = [];
      for (let i = 0; i < totalCells; i += 1) {
        const dayNumber = i - firstDayIndex + 1;
        const inMonth = dayNumber >= 1 && dayNumber <= totalDays;
        if (!inMonth) {
          items.push({ key: `pad-${i}`, inMonth: false });
          continue;
        }
        const iso = isoFromParts(year, month, dayNumber);
        const dayEntries = entriesByDate.get(iso) || [];
        items.push({
          key: iso,
          inMonth: true,
          label: dayNumber,
          iso,
          entries: dayEntries
        });
      }
      return items;
    }, [entriesByDate, firstDayIndex, month, totalCells, totalDays, year]);
    return /* @__PURE__ */ React.createElement(Card, { className: "shadow-md" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-base text-ocean-900" }, "Month at a glance"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-graystone-500" }, "Tap a turquoise dot to open that post.")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase text-graystone-400" }, WEEKDAY_LABELS.map((label) => /* @__PURE__ */ React.createElement("span", { key: label }, label))), /* @__PURE__ */ React.createElement("div", { className: "mt-2 grid grid-cols-7 gap-2 text-xs" }, cells.map((cell) => {
      if (!cell.inMonth) {
        return /* @__PURE__ */ React.createElement("div", { key: cell.key, className: "min-h-[56px] rounded-xl border border-transparent bg-transparent" });
      }
      const hasEntries = cell.entries.length > 0;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: cell.key,
          className: cx(
            "min-h-[64px] rounded-xl border px-2 py-2",
            hasEntries ? "border-[#00F5FF]/60 bg-[#E8FBFF]" : "border-graystone-200 bg-white"
          )
        },
        /* @__PURE__ */ React.createElement("div", { className: "text-[11px] font-semibold text-graystone-700" }, cell.label),
        hasEntries ? /* @__PURE__ */ React.createElement("div", { className: "mt-2 flex flex-wrap gap-1" }, cell.entries.map((entry) => /* @__PURE__ */ React.createElement(
          "button",
          {
            key: entry.id,
            type: "button",
            onClick: () => onOpenEntry(entry.id),
            className: "h-3 w-3 rounded-full bg-[#00F5FF] text-transparent transition hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]",
            title: `${entry.assetType} \u2022 ${entry.platforms?.join(", ") || ""}`,
            "aria-label": `Open ${entry.assetType} scheduled on ${new Date(entry.date).toLocaleDateString()}`
          },
          "\u2022"
        ))) : /* @__PURE__ */ React.createElement("div", { className: "mt-3 text-[10px] text-graystone-300" }, "\u2014")
      );
    }))));
  }
  function AssetRatioCard({ summary, monthLabel, pendingAssetType, goals, onGoalsChange }) {
    const baseCounts = summary?.counts || {};
    const total = summary?.total || 0;
    const counts = useMemo(() => {
      if (pendingAssetType) {
        return {
          ...baseCounts,
          [pendingAssetType]: (baseCounts[pendingAssetType] || 0) + 1
        };
      }
      return baseCounts;
    }, [baseCounts, pendingAssetType]);
    const adjustedTotal = total + (pendingAssetType ? 1 : 0);
    const types = ["Video", "Design", "Carousel"];
    const goalTotal = Object.values(goals || {}).reduce((acc, value) => acc + Number(value || 0), 0) || 100;
    const normalizedGoals = types.reduce((acc, type) => {
      const raw = Number(goals?.[type] || 0);
      acc[type] = goalTotal ? Math.round(raw / goalTotal * 100) : 0;
      return acc;
    }, {});
    const handleGoalChange = (type, value) => {
      const next = Math.max(0, Math.min(100, Number(value) || 0));
      onGoalsChange?.({
        ...goals,
        [type]: next
      });
    };
    return /* @__PURE__ */ React.createElement(Card, { className: "shadow-md" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-base text-ocean-900" }, "Asset ratio"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-graystone-500" }, monthLabel)), /* @__PURE__ */ React.createElement(CardContent, null, adjustedTotal === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-500" }, "No assets scheduled for this month yet.") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "mb-4 flex justify-center" }, /* @__PURE__ */ React.createElement(AssetMixPie, { counts, total: adjustedTotal })), /* @__PURE__ */ React.createElement("div", { className: "space-y-2 text-xs" }, types.map((type) => {
      const value = counts[type] || 0;
      const percent = value === 0 ? 0 : Math.round(value / adjustedTotal * 100);
      const goalPercent = normalizedGoals[type] || 0;
      return /* @__PURE__ */ React.createElement("div", { key: type, className: "flex items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "font-medium text-graystone-700" }, type), /* @__PURE__ */ React.createElement("span", { className: "ml-1 text-graystone-400" }, "| goal ", goalPercent, "%")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "text-graystone-600" }, percent, "% (", value, ")"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "number",
          min: "0",
          max: "100",
          value: goals?.[type] ?? 0,
          onChange: (event) => handleGoalChange(type, event.target.value),
          className: "dropdown-font w-16 rounded-full border border-black px-3 py-1 text-xs",
          "aria-label": `Goal percentage for ${type}`
        }
      )));
    }))), pendingAssetType ? /* @__PURE__ */ React.createElement("p", { className: "mt-4 text-[11px] text-graystone-500" }, "Includes current draft tagged as ", /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, pendingAssetType), ".") : null));
  }
  function SocialPreview({ platform, caption, mediaUrl, isImage, isVideo }) {
    const meta = PLATFORM_PREVIEW_META[platform] || PLATFORM_PREVIEW_META.Instagram;
    const accent = meta.accent || "#2563eb";
    const avatarStyle = {
      backgroundColor: `${accent}1f`
    };
    const platformLabel = platform === "Main" ? "All platforms" : platform;
    const prettyCaption = caption && caption.trim().length ? caption : "Your caption will appear here.";
    const renderMedia = () => {
      if (!mediaUrl) return null;
      if (isVideo) return /* @__PURE__ */ React.createElement("video", { src: mediaUrl, controls: true, className: "w-full" });
      if (isImage) return /* @__PURE__ */ React.createElement("img", { src: mediaUrl, alt: platform, className: "w-full object-cover" });
      return null;
    };
    const renderInteractions = () => /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-6 px-4 py-2 text-xs text-graystone-500" }, /* @__PURE__ */ React.createElement("span", { style: { color: accent } }, "\u{1F44D} 128"), /* @__PURE__ */ React.createElement("span", null, "\u{1F4AC} 12"), /* @__PURE__ */ React.createElement("span", null, "\u2197\uFE0F Share"));
    const renderBody = () => {
      switch (platform) {
        case "LinkedIn":
          return /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "px-4 text-sm text-graystone-800 whitespace-pre-wrap" }, prettyCaption), mediaUrl ? renderMedia() : /* @__PURE__ */ React.createElement("div", { className: "px-4 pb-3 text-xs text-graystone-500" }, "Add an asset to complete the preview."), renderInteractions());
        case "X/Twitter":
          return /* @__PURE__ */ React.createElement("div", { className: "space-y-2 px-4 py-3 text-sm text-graystone-800" }, /* @__PURE__ */ React.createElement("div", { className: "whitespace-pre-wrap" }, prettyCaption), mediaUrl ? renderMedia() : null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-6 pt-1 text-xs text-graystone-500" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4AC} 21"), /* @__PURE__ */ React.createElement("span", null, "\u{1F501} 34"), /* @__PURE__ */ React.createElement("span", null, "\u2764\uFE0F 210"), /* @__PURE__ */ React.createElement("span", null, "\u2197\uFE0F")));
        case "Instagram":
          return /* @__PURE__ */ React.createElement("div", { className: "space-y-0" }, mediaUrl ? renderMedia() : /* @__PURE__ */ React.createElement("div", { className: "px-4 pb-3 text-xs text-graystone-500" }, "Add an image or reel to complete the preview."), /* @__PURE__ */ React.createElement("div", { className: "px-4 py-3 text-sm text-graystone-800 whitespace-pre-wrap" }, prettyCaption), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4 px-4 pb-3 text-xs text-graystone-500" }, /* @__PURE__ */ React.createElement("span", null, "\u2764 4,532"), /* @__PURE__ */ React.createElement("span", null, "\u{1F4AC} 98"), /* @__PURE__ */ React.createElement("span", null, "\u2709\uFE0F Share")));
        default:
          return /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, mediaUrl ? renderMedia() : /* @__PURE__ */ React.createElement("div", { className: "px-4 pb-3 text-xs text-graystone-500" }, "Add an asset to complete the preview."), /* @__PURE__ */ React.createElement("div", { className: "px-4 py-3 text-sm text-graystone-800 whitespace-pre-wrap" }, prettyCaption));
      }
    };
    return /* @__PURE__ */ React.createElement("div", { className: "max-w-sm overflow-hidden rounded-2xl border border-graystone-200 bg-white shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 px-4 py-3" }, /* @__PURE__ */ React.createElement("div", { className: "h-9 w-9 rounded-full", style: avatarStyle }), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold text-ocean-900" }, meta.name), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-graystone-500" }, meta.handle)), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-semibold text-graystone-400" }, platformLabel)), renderBody());
  }
  function EntryModal({
    entry,
    currentUser,
    onClose,
    onApprove,
    onDelete,
    onSave,
    onUpdate,
    onNotifyMentions,
    testingFrameworks = []
  }) {
    const sanitizedEntry = useMemo(() => sanitizeEntry(entry), [entry]);
    const [draft, setDraft] = useState2(sanitizedEntry);
    const [allPlatforms, setAllPlatforms] = useState2(
      sanitizedEntry ? sanitizedEntry.platforms.length === ALL_PLATFORMS.length : false
    );
    const [commentDraft, setCommentDraft] = useState2("");
    const [previewUploadError, setPreviewUploadError] = useState2("");
    const [activeCaptionTab, setActiveCaptionTab] = useState2("Main");
    const [activePreviewPlatform, setActivePreviewPlatform] = useState2("Main");
    const frameworkOptions = Array.isArray(testingFrameworks) ? testingFrameworks : [];
    const frameworkMap = useMemo(() => {
      const map = /* @__PURE__ */ new Map();
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
        setCommentDraft("");
        return;
      }
      setDraft(sanitizedEntry);
      setAllPlatforms(sanitizedEntry.platforms.length === ALL_PLATFORMS.length);
      setCommentDraft("");
    }, [sanitizedEntry]);
    const draftPlatforms = Array.isArray(draft?.platforms) ? draft.platforms : [];
    const draftPlatformsKey = draftPlatforms.join("|");
    const sanitizedSignature = entrySignature(sanitizedEntry);
    const modalReady = Boolean(sanitizedEntry && draft);
    useEffect(() => {
      if (!sanitizedEntry) return;
      setActiveCaptionTab("Main");
      setActivePreviewPlatform(sanitizedEntry.platforms[0] || "Main");
    }, [sanitizedSignature]);
    useEffect(() => {
      if (!sanitizedEntry) return;
      setActiveCaptionTab(
        (prevTab) => prevTab === "Main" || draftPlatforms.includes(prevTab) ? prevTab : "Main"
      );
      setActivePreviewPlatform(
        (prevPlatform) => draftPlatforms.includes(prevPlatform) ? prevPlatform : draftPlatforms[0] || "Main"
      );
      setAllPlatforms(draftPlatforms.length === ALL_PLATFORMS.length);
    }, [sanitizedSignature, draftPlatformsKey]);
    if (!modalReady) return null;
    const update = (key, value) => {
      setDraft((prev) => {
        if (!prev) return prev;
        if (key === "platforms") {
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
            analytics: nextAnalytics
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
        previewUrl: raw.previewUrl || "",
        platformCaptions: ensurePlatformCaptions(raw.platformCaptions),
        platforms: ensureArray(Array.isArray(raw.platforms) ? raw.platforms : []),
        analytics: ensureAnalytics(raw.analytics),
        analyticsUpdatedAt: typeof raw.analyticsUpdatedAt === "string" ? raw.analyticsUpdatedAt : draft && typeof draft.analyticsUpdatedAt === "string" ? draft.analyticsUpdatedAt : "",
        workflowStatus: KANBAN_STATUSES.includes(raw.workflowStatus) ? raw.workflowStatus : KANBAN_STATUSES.includes(draft.workflowStatus) ? draft.workflowStatus : KANBAN_STATUSES[0]
      };
      const frameworkId = normalized.testingFrameworkId ? String(normalized.testingFrameworkId) : "";
      const framework = frameworkId ? frameworkMap.get(frameworkId) : null;
      const next = {
        ...normalized,
        testingFrameworkId: frameworkId || void 0,
        testingFrameworkName: framework ? framework.name : normalized.testingFrameworkName || void 0
      };
      return {
        ...next,
        statusDetail: computeStatusDetail(next)
      };
    };
    const handleSave = () => {
      let next = normalizeEntry(draft);
      if (next.status === "Approved") {
        next = normalizeEntry({ ...next, status: "Pending", approvedAt: void 0 });
      }
      onSave(next);
      onClose();
    };
    const handleDelete = () => {
      const confirmDelete = window.confirm(
        "Move this item to the trash? You can restore it within 30 days."
      );
      if (confirmDelete) {
        onDelete(draft.id);
        onClose();
      }
    };
    const handleAssetTypeChange = (nextType) => {
      setDraft((prev) => {
        const next = { ...prev, assetType: nextType };
        if (nextType !== "Video") next.script = void 0;
        if (nextType !== "Design") next.designCopy = void 0;
        if (nextType !== "Carousel") {
          next.carouselSlides = void 0;
        } else {
          next.carouselSlides = prev.carouselSlides && prev.carouselSlides.length ? [...prev.carouselSlides] : ["", "", ""];
        }
        return normalizeEntry(next);
      });
    };
    const handleCarouselSlides = (desiredLength) => {
      setDraft((prev) => {
        const current = prev.carouselSlides || [];
        let nextSlides = [...current];
        if (desiredLength > current.length) {
          nextSlides = [...current, ...Array(desiredLength - current.length).fill("")];
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
      if (file.size > MAX_UPLOAD_BYTES) {
        setPreviewUploadError(`File too large (max 5 MB): ${file.name}`);
        event.target.value = "";
        return;
      }
      setPreviewUploadError("");
      const reader = new FileReader();
      reader.onload = () => {
        const url = typeof reader.result === "string" ? reader.result : "";
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
        const next = normalizeEntry({ ...prev, previewUrl: "" });
        if (onUpdate) onUpdate(next);
        return next;
      });
    };
    const handleCommentSubmit = (event) => {
      event.preventDefault();
      const body = commentDraft.trim();
      if (!body) return;
      const mentionDirectory = Array.from(
        new Set(
          [
            ...DEFAULT_APPROVERS,
            ...USERS,
            ...draft.approvers || [],
            draft.author
          ].filter(Boolean).map((name) => String(name).trim()).filter(Boolean)
        )
      );
      const rawMentions = extractMentions(body);
      let finalBody = body;
      const resolvedHandles = /* @__PURE__ */ new Set();
      const mentionNames = /* @__PURE__ */ new Set();
      rawMentions.forEach((raw) => {
        const candidate = raw.replace(/^@/, "").trim();
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
        author: currentUser || "Unknown",
        body: finalBody,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        mentions: Array.from(resolvedHandles)
      };
      const next = normalizeEntry({
        ...draft,
        comments: [...draft.comments || [], comment]
      });
      setDraft(next);
      setCommentDraft("");
      if (onUpdate) onUpdate(next);
      if (onNotifyMentions && mentionNames.size) {
        onNotifyMentions({
          entry: next,
          comment,
          mentionNames: Array.from(mentionNames)
        });
      }
    };
    const highlightMentions = (text) => {
      if (!text) return [text];
      return text.split(/(@[\w\s.&'-]+)/g).map((part, index) => {
        if (!part) return null;
        if (part.startsWith("@")) {
          return /* @__PURE__ */ React.createElement("span", { key: index, className: "font-semibold text-ocean-600" }, part);
        }
        return /* @__PURE__ */ React.createElement("span", { key: index }, part);
      });
    };
    const previewUrl = draft.previewUrl ? draft.previewUrl.trim() : "";
    const previewIsImage = isImageMedia(previewUrl);
    const previewIsVideo = previewUrl && /\.(mp4|webm|ogg)$/i.test(previewUrl);
    const previewPlatforms = draftPlatforms.length ? draftPlatforms : ["Main"];
    const effectivePreviewPlatform = previewPlatforms.includes(activePreviewPlatform) ? activePreviewPlatform : previewPlatforms[0] || "Main";
    const previewCaption = getPlatformCaption(draft.caption, draft.platformCaptions, effectivePreviewPlatform);
    const currentFramework = draft?.testingFrameworkId ? frameworkMap.get(draft.testingFrameworkId) : null;
    const analyticsByPlatform = ensureAnalytics(draft.analytics);
    const analyticsPlatforms = Object.keys(analyticsByPlatform);
    const formatMetricValue = (value) => {
      if (typeof value === "number") return value.toLocaleString();
      if (value === null || value === void 0) return "\u2014";
      return String(value);
    };
    const checklistCompleted = Object.values(ensureChecklist(draft.checklist)).filter(Boolean).length;
    const checklistTotal = CHECKLIST_ITEMS.length;
    return /* @__PURE__ */ React.createElement(Modal, { open: modalReady, onClose }, /* @__PURE__ */ React.createElement("div", { className: "bg-white" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-aqua-200 bg-ocean-500 px-6 py-4 text-white" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-lg font-semibold" }, "Edit content"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-aqua-100" }, "Created ", new Date(draft.createdAt).toLocaleString())), /* @__PURE__ */ React.createElement(
      "span",
      {
        className: cx(
          "rounded-full px-3 py-1 text-xs font-semibold text-ocean-900",
          draft.status === "Approved" ? "bg-aqua-100" : "bg-amber-100"
        )
      },
      draft.status
    )), /* @__PURE__ */ React.createElement("div", { className: "max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6" }, /* @__PURE__ */ React.createElement(FieldRow, { label: "Date" }, /* @__PURE__ */ React.createElement(Input, { type: "date", value: draft.date, onChange: (event) => update("date", event.target.value) })), /* @__PURE__ */ React.createElement(FieldRow, { label: "Workflow status" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: draft.workflowStatus || KANBAN_STATUSES[0],
        onChange: (event) => update("workflowStatus", event.target.value),
        className: cx(selectBaseClasses, "w-full")
      },
      KANBAN_STATUSES.map((statusOption) => /* @__PURE__ */ React.createElement("option", { key: statusOption, value: statusOption }, statusOption))
    )), /* @__PURE__ */ React.createElement(FieldRow, { label: "Approvers" }, /* @__PURE__ */ React.createElement(ApproverMulti, { value: draft.approvers || [], onChange: (value) => update("approvers", value) })), /* @__PURE__ */ React.createElement(FieldRow, { label: "Campaign" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: draft.campaign || "",
        onChange: (event) => update("campaign", event.target.value || ""),
        className: cx(selectBaseClasses, "w-full")
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, "No campaign"),
      CAMPAIGNS.map((option) => /* @__PURE__ */ React.createElement("option", { key: option, value: option }, option))
    )), /* @__PURE__ */ React.createElement(FieldRow, { label: "Content pillar" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: draft.contentPillar || "",
        onChange: (event) => update("contentPillar", event.target.value || ""),
        className: cx(selectBaseClasses, "w-full")
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, "Not tagged"),
      CONTENT_PILLARS.map((option) => /* @__PURE__ */ React.createElement("option", { key: option, value: option }, option))
    )), /* @__PURE__ */ React.createElement(FieldRow, { label: "Testing framework" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: draft.testingFrameworkId || "",
        onChange: (event) => {
          const id = event.target.value;
          const framework = id ? frameworkMap.get(id) : null;
          setDraft((prev) => {
            if (!prev) return prev;
            return normalizeEntry({
              ...prev,
              testingFrameworkId: id || void 0,
              testingFrameworkName: framework ? framework.name : void 0
            });
          });
        },
        className: cx(selectBaseClasses, "w-full")
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, "No testing framework"),
      frameworkOptions.map((framework) => /* @__PURE__ */ React.createElement("option", { key: framework.id, value: framework.id }, framework.name))
    ), currentFramework ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-graystone-500" }, "Tracking via \u201C", currentFramework.name, "\u201D", currentFramework.status ? ` (${currentFramework.status})` : "", ".") : frameworkOptions.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-graystone-500" }, "Create frameworks in the Testing Lab to link experiments.") : /* @__PURE__ */ React.createElement("p", { className: "text-xs text-graystone-500" }, "Attach this item to a testing plan for reporting."))), /* @__PURE__ */ React.createElement(FieldRow, { label: "Platforms" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
      Toggle,
      {
        id: "modal-all-platforms",
        ariaLabel: "Select all platforms",
        checked: allPlatforms,
        onChange: (checked) => {
          setAllPlatforms(checked);
          if (checked) {
            update("platforms", [...ALL_PLATFORMS]);
          }
        }
      }
    ), /* @__PURE__ */ React.createElement("span", { className: "text-sm text-graystone-600" }, "Select all platforms")), !allPlatforms && /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, ALL_PLATFORMS.map((platform) => /* @__PURE__ */ React.createElement(
      "label",
      {
        key: platform,
        className: "flex items-center gap-2 rounded-xl border border-aqua-200 bg-aqua-50 px-3 py-2 text-sm text-graystone-700 hover:border-aqua-300"
      },
      /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "checkbox",
          className: "h-4 w-4 rounded border-graystone-300",
          checked: draftPlatforms.includes(platform),
          onChange: (event) => {
            const checked = event.target.checked;
            const exists = draftPlatforms.includes(platform);
            let nextPlatforms = draftPlatforms;
            if (checked && !exists) {
              nextPlatforms = [...draftPlatforms, platform];
            }
            if (!checked && exists) {
              nextPlatforms = draftPlatforms.filter((item) => item !== platform);
            }
            update("platforms", nextPlatforms);
          }
        }
      ),
      /* @__PURE__ */ React.createElement(PlatformIcon, { platform }),
      /* @__PURE__ */ React.createElement("span", { className: "text-graystone-700" }, platform)
    ))))), /* @__PURE__ */ React.createElement(FieldRow, { label: "Author" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: draft.author || "",
        onChange: (event) => update("author", event.target.value || void 0),
        className: cx(selectBaseClasses, "w-full")
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, "Select author"),
      /* @__PURE__ */ React.createElement("option", { value: "Dan" }, "Dan"),
      /* @__PURE__ */ React.createElement("option", { value: "Fran" }, "Fran")
    )), /* @__PURE__ */ React.createElement(FieldRow, { label: "Caption" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, ["Main", ...draftPlatforms].map((tab) => /* @__PURE__ */ React.createElement(
      Button,
      {
        key: tab,
        type: "button",
        size: "sm",
        variant: activeCaptionTab === tab ? "solid" : "outline",
        onClick: () => setActiveCaptionTab(tab)
      },
      tab === "Main" ? "Main" : tab
    ))), /* @__PURE__ */ React.createElement(
      Textarea,
      {
        value: activeCaptionTab === "Main" ? draft.caption : draft.platformCaptions?.[activeCaptionTab] ?? draft.caption,
        onChange: (event) => {
          const value = event.target.value;
          if (activeCaptionTab === "Main") {
            setDraft((prev) => ({ ...prev, caption: value }));
          } else {
            setDraft((prev) => ({
              ...prev,
              platformCaptions: {
                ...ensurePlatformCaptions(prev.platformCaptions),
                [activeCaptionTab]: value
              }
            }));
          }
        },
        rows: 4
      }
    ), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-graystone-500" }, activeCaptionTab === "Main" ? "Updates here flow to every platform unless a custom version is set." : `${activeCaptionTab} caption overrides the main copy for that platform.`))), /* @__PURE__ */ React.createElement(FieldRow, { label: "URL" }, /* @__PURE__ */ React.createElement(
      Input,
      {
        type: "url",
        value: draft.url || "",
        onChange: (event) => update("url", event.target.value || void 0)
      }
    )), /* @__PURE__ */ React.createElement(FieldRow, { label: "Preview" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement(
      Input,
      {
        type: "url",
        value: draft.previewUrl || "",
        onChange: (event) => update("previewUrl", event.target.value),
        placeholder: "https://cdn.example.com/assets/post.png"
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-3" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "file",
        accept: "image/*",
        onChange: handleFileUpload,
        className: cx(fileInputClasses, "text-xs")
      }
    ), draft.previewUrl && /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", onClick: handleClearPreview }, "Clear preview")), previewUploadError && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-red-600" }, previewUploadError), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, previewPlatforms.length > 1 && /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, previewPlatforms.map((platform) => /* @__PURE__ */ React.createElement(
      Button,
      {
        key: platform,
        type: "button",
        size: "sm",
        variant: activePreviewPlatform === platform ? "solid" : "outline",
        onClick: () => setActivePreviewPlatform(platform)
      },
      platform
    ))), /* @__PURE__ */ React.createElement(
      SocialPreview,
      {
        platform: effectivePreviewPlatform,
        caption: previewCaption,
        mediaUrl: previewUrl,
        isImage: previewIsImage,
        isVideo: previewIsVideo
      }
    ), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-graystone-500" }, "Preview simulates the selected platform using the current caption and asset.")))), analyticsPlatforms.length > 0 && /* @__PURE__ */ React.createElement(FieldRow, { label: "Performance" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, analyticsPlatforms.map((platform) => {
      const metrics = analyticsByPlatform[platform] || {};
      const { lastImportedAt, ...rest } = metrics;
      const metricEntries = Object.entries(rest);
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: platform,
          className: "rounded-2xl border border-aqua-200 bg-aqua-50 px-3 py-3"
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2 text-sm font-semibold text-ocean-700" }, /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center gap-1" }, /* @__PURE__ */ React.createElement(PlatformIcon, { platform }), platform), lastImportedAt ? /* @__PURE__ */ React.createElement("span", { className: "text-xs font-normal text-graystone-500" }, "Updated ", new Date(lastImportedAt).toLocaleString()) : null),
        metricEntries.length ? /* @__PURE__ */ React.createElement("div", { className: "mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3" }, metricEntries.map(([metricKey, metricValue]) => /* @__PURE__ */ React.createElement(
          "div",
          {
            key: `${platform}-${metricKey}`,
            className: "rounded-xl bg-white px-3 py-2 shadow-sm"
          },
          /* @__PURE__ */ React.createElement("div", { className: "text-[11px] uppercase tracking-wide text-graystone-500" }, metricKey),
          /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold text-ocean-700" }, formatMetricValue(metricValue))
        ))) : /* @__PURE__ */ React.createElement("p", { className: "mt-2 text-xs text-graystone-500" }, "No metrics captured yet.")
      );
    }))), /* @__PURE__ */ React.createElement(Separator, null), /* @__PURE__ */ React.createElement(FieldRow, { label: "Asset type" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: draft.assetType,
        onChange: (event) => handleAssetTypeChange(event.target.value),
        className: cx(selectBaseClasses, "w-full")
      },
      /* @__PURE__ */ React.createElement("option", { value: "Video" }, "Video"),
      /* @__PURE__ */ React.createElement("option", { value: "Design" }, "Design"),
      /* @__PURE__ */ React.createElement("option", { value: "Carousel" }, "Carousel")
    )), draft.assetType === "Video" && /* @__PURE__ */ React.createElement(FieldRow, { label: "Script" }, /* @__PURE__ */ React.createElement(
      Textarea,
      {
        value: draft.script || "",
        onChange: (event) => update("script", event.target.value),
        rows: 4
      }
    )), draft.assetType === "Design" && /* @__PURE__ */ React.createElement(FieldRow, { label: "Design copy" }, /* @__PURE__ */ React.createElement(
      Textarea,
      {
        value: draft.designCopy || "",
        onChange: (event) => update("designCopy", event.target.value),
        rows: 4
      }
    )), draft.assetType === "Carousel" && /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement(FieldRow, { label: "Slides" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: String(draft.carouselSlides?.length || 0),
        onChange: (event) => handleCarouselSlides(Number(event.target.value)),
        className: cx(selectBaseClasses, "w-full")
      },
      Array.from({ length: 10 }, (_, index) => /* @__PURE__ */ React.createElement("option", { key: index + 1, value: index + 1 }, index + 1))
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, (draft.carouselSlides || []).map((slideText, idx) => /* @__PURE__ */ React.createElement(FieldRow, { key: idx, label: `Slide ${idx + 1}` }, /* @__PURE__ */ React.createElement(
      Textarea,
      {
        value: slideText,
        onChange: (event) => {
          const value = event.target.value;
          setDraft((prev) => {
            const currentSlides = prev.carouselSlides || [];
            const nextSlides = currentSlides.map(
              (slide, slideIndex) => slideIndex === idx ? value : slide
            );
            return { ...prev, carouselSlides: nextSlides };
          });
        },
        rows: 3
      }
    ))))), /* @__PURE__ */ React.createElement(FieldRow, { label: "First comment" }, /* @__PURE__ */ React.createElement(
      Textarea,
      {
        value: draft.firstComment || "",
        onChange: (event) => update("firstComment", event.target.value),
        rows: 3
      }
    )), /* @__PURE__ */ React.createElement(FieldRow, { label: `Checklist (${checklistCompleted}/${checklistTotal})` }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, CHECKLIST_ITEMS.map((item) => /* @__PURE__ */ React.createElement(
      "label",
      {
        key: item.key,
        className: "heading-font inline-flex items-center gap-3 rounded-full border border-black bg-white px-4 py-2 text-xs font-semibold text-black shadow-[0_0_20px_rgba(15,157,222,0.2)] transition hover:bg-black hover:text-white"
      },
      /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "checkbox",
          className: checklistCheckboxClass,
          checked: ensureChecklist(draft.checklist)[item.key],
          onChange: () => toggleChecklistItem(item.key)
        }
      ),
      /* @__PURE__ */ React.createElement("span", { className: "normal-case" }, item.label)
    )))), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-medium text-graystone-800" }, "Comments"), draft.comments && draft.comments.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, draft.comments.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((comment) => /* @__PURE__ */ React.createElement("div", { key: comment.id, className: "rounded-xl border border-aqua-200 bg-aqua-50 p-3 text-sm text-graystone-800" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-xs text-graystone-500" }, /* @__PURE__ */ React.createElement("span", { className: "font-medium text-graystone-700" }, comment.author), /* @__PURE__ */ React.createElement("span", null, new Date(comment.createdAt).toLocaleString())), /* @__PURE__ */ React.createElement("div", { className: "mt-2 leading-relaxed" }, highlightMentions(comment.body))))) : /* @__PURE__ */ React.createElement("p", { className: "text-xs text-graystone-500" }, "No comments yet. Use @ to mention teammates."), /* @__PURE__ */ React.createElement("form", { onSubmit: handleCommentSubmit, className: "space-y-2" }, /* @__PURE__ */ React.createElement(
      Textarea,
      {
        value: commentDraft,
        onChange: (event) => setCommentDraft(event.target.value),
        rows: 3,
        placeholder: "Share feedback or mention someone with @"
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-end" }, /* @__PURE__ */ React.createElement(Button, { type: "submit", disabled: !commentDraft.trim() }, "Add comment"))))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3 border-t border-aqua-200 bg-aqua-50 px-6 py-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-3" }, /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "outline",
        onClick: () => onApprove(draft.id),
        className: "gap-2"
      },
      draft.status === "Approved" ? "Mark as pending" : "Mark as approved"
    ), /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "outline",
        onClick: handleDelete
      },
      /* @__PURE__ */ React.createElement(TrashIcon, { className: "h-4 w-4 text-white" }),
      "Move to trash"
    )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(Button, { variant: "ghost", onClick: onClose }, "Cancel"), /* @__PURE__ */ React.createElement(Button, { onClick: handleSave }, "Save changes")))));
  }
  function ContentDashboard() {
    const [entries, setEntries] = useState2([]);
    const [monthCursor, setMonthCursor] = useState2(() => /* @__PURE__ */ new Date());
    const [viewingId, setViewingId] = useState2(null);
    const [viewingSnapshot, setViewingSnapshot] = useState2(null);
    const [notifications, setNotifications] = useState2(() => loadNotifications());
    const [ideas, setIdeas] = useState2(() => loadIdeas());
    const [linkedinSubmissions, setLinkedinSubmissions] = useState2(() => loadLinkedInSubmissions());
    const [testingFrameworks, setTestingFrameworks] = useState2(() => loadTestingFrameworks());
    const [selectedFrameworkId, setSelectedFrameworkId] = useState2("");
    const [currentUser, setCurrentUser] = useState2(
      () => storageAvailable ? window.localStorage.getItem(USER_STORAGE_KEY) : null
    );
    const [userSelection, setUserSelection] = useState2(
      () => storageAvailable ? window.localStorage.getItem(USER_STORAGE_KEY) || "" : ""
    );
    const [currentView, setCurrentView] = useState2(() => {
      if (storageAvailable) {
        return window.localStorage.getItem(USER_STORAGE_KEY) ? "menu" : "login";
      }
      return "login";
    });
    const [planTab, setPlanTab] = useState2("plan");
    const [filterType, setFilterType] = useState2("All");
    const [filterStatus, setFilterStatus] = useState2("All");
    const [filterPlatforms, setFilterPlatforms] = useState2([]);
    const [performanceImportOpen, setPerformanceImportOpen] = useState2(false);
    const [approvalsModalOpen, setApprovalsModalOpen] = useState2(false);
    const [menuMotionActive, setMenuMotionActive] = useState2(false);
    const [pendingAssetType, setPendingAssetType] = useState2(null);
    const [assetGoals, setAssetGoals] = useState2(() => ({
      Video: 40,
      Design: 40,
      Carousel: 20
    }));
    const [guidelines, setGuidelines] = useState2(() => loadGuidelines());
    const [guidelinesOpen, setGuidelinesOpen] = useState2(false);
    useEffect(() => {
      setEntries(loadEntries());
      setIdeas(loadIdeas());
      setLinkedinSubmissions(loadLinkedInSubmissions());
      setTestingFrameworks(loadTestingFrameworks());
    }, []);
    useEffect(() => {
      setMenuMotionActive(true);
    }, []);
    useEffect(() => {
      const syncFromHash = () => {
        if (window.location.hash === "#create") {
          setCurrentView("form");
          setPlanTab("plan");
          closeEntry();
        }
      };
      syncFromHash();
      window.addEventListener("hashchange", syncFromHash);
      return () => window.removeEventListener("hashchange", syncFromHash);
    }, []);
    useEffect(() => {
      if (currentView !== "form") {
        setPendingAssetType(null);
      }
    }, [currentView]);
    const handleGuidelinesSave = (next) => {
      const normalized = normalizeGuidelines(next);
      setGuidelines(normalized);
      saveGuidelines(normalized);
      setGuidelinesOpen(false);
    };
    useEffect(() => {
      saveEntries(entries);
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
        if (selectedFrameworkId) setSelectedFrameworkId("");
        return;
      }
      if (!selectedFrameworkId || !testingFrameworks.some((framework) => framework.id === selectedFrameworkId)) {
        setSelectedFrameworkId(testingFrameworks[0].id);
      }
    }, [testingFrameworks, selectedFrameworkId]);
    const addNotifications = (items = []) => {
      if (!items || !items.length) return;
      setNotifications((prev) => {
        const existing = new Set(
          prev.map((item) => item.key || notificationKey(item.type, item.entryId, item.user, item.meta))
        );
        const additions = items.map((item) => {
          const key = item.key || notificationKey(item.type, item.entryId, item.user, item.meta);
          return {
            id: uuid(),
            entryId: item.entryId,
            user: item.user,
            type: item.type,
            message: item.message,
            createdAt: item.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
            read: false,
            meta: item.meta || {},
            key
          };
        }).filter(
          (item) => item.entryId && item.user && item.type && item.message && !existing.has(item.key)
        );
        if (!additions.length) return prev;
        return [...additions, ...prev];
      });
    };
    const markNotificationsAsReadForEntry = (entryId, user = currentUser) => {
      if (!entryId || !user) return;
      setNotifications(
        (prev) => prev.map(
          (item) => item.entryId === entryId && item.user === user && !item.read ? { ...item, read: true } : item
        )
      );
    };
    const buildApprovalNotifications = (entry, names) => {
      const approvers = names ? names : ensurePeopleArray(entry.approvers);
      if (!approvers.length) return [];
      const descriptor = entry.caption && entry.caption.trim().length ? entry.caption.trim() : `${entry.assetType} on ${new Date(entry.date).toLocaleDateString()}`;
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      return approvers.map((user) => ({
        entryId: entry.id,
        user,
        type: "approval-assigned",
        message: `${descriptor} is awaiting your approval.`,
        createdAt: timestamp,
        meta: { source: "approval" },
        key: notificationKey("approval-assigned", entry.id, user)
      }));
    };
    const buildMentionNotifications = (entry, comment, mentionNames) => {
      if (!mentionNames || !mentionNames.length) return [];
      const descriptor = entry.caption && entry.caption.trim().length ? entry.caption.trim() : `${entry.assetType} on ${new Date(entry.date).toLocaleDateString()}`;
      const author = comment.author || "A teammate";
      const timestamp = comment.createdAt || (/* @__PURE__ */ new Date()).toISOString();
      return mentionNames.filter((user) => user && user.trim() && user.trim() !== (comment.author || "").trim()).map((user) => ({
        entryId: entry.id,
        user,
        type: "mention",
        message: `${author} mentioned you on "${descriptor}".`,
        createdAt: timestamp,
        meta: { commentId: comment.id },
        key: notificationKey("mention", entry.id, user, { commentId: comment.id })
      }));
    };
    const handleMentionNotifications = ({ entry, comment, mentionNames }) => {
      if (!entry || !comment) return;
      const payload = buildMentionNotifications(entry, comment, mentionNames);
      if (payload.length) addNotifications(payload);
    };
    const addIdea = (idea) => {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      const sanitized = sanitizeIdea({
        ...idea,
        createdBy: idea.createdBy || currentUser || "Unknown",
        createdAt: timestamp
      });
      setIdeas((prev) => [sanitized, ...prev]);
    };
    const deleteIdea = (id) => {
      setIdeas((prev) => prev.filter((idea) => idea.id !== id));
    };
    const addLinkedInSubmission = (payload) => {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      const sanitized = sanitizeLinkedInSubmission({
        ...payload,
        createdAt: timestamp,
        submitter: payload.submitter || currentUser || "Unknown"
      });
      setLinkedinSubmissions((prev) => [sanitized, ...prev]);
    };
    const updateLinkedInStatus = (id, status) => {
      if (!LINKEDIN_STATUSES.includes(status)) return;
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      setLinkedinSubmissions(
        (prev) => prev.map(
          (item) => item.id === id ? {
            ...item,
            status,
            updatedAt: timestamp
          } : item
        )
      );
    };
    const addTestingFrameworkEntry = (framework) => {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      const sanitized = sanitizeTestingFramework({
        ...framework,
        createdAt: timestamp
      });
      if (!sanitized) return;
      setTestingFrameworks((prev) => [sanitized, ...prev]);
      setSelectedFrameworkId(sanitized.id);
    };
    const deleteTestingFramework = (id) => {
      setTestingFrameworks((prev) => prev.filter((item) => item.id !== id));
      if (!id) return;
      if (selectedFrameworkId === id) {
        setSelectedFrameworkId("");
      }
      setEntries(
        (prev) => prev.map((entry) => {
          if (entry.testingFrameworkId !== id) return entry;
          const sanitized = sanitizeEntry({
            ...entry,
            testingFrameworkId: "",
            testingFrameworkName: ""
          });
          return {
            ...sanitized,
            statusDetail: computeStatusDetail(sanitized)
          };
        })
      );
    };
    const importPerformanceDataset = (dataset) => {
      let summary = {
        totalRows: Array.isArray(dataset?.records) ? dataset.records.length : 0,
        matched: 0,
        updatedEntries: [],
        updatedEntryCount: 0,
        missing: [],
        ambiguous: [],
        errors: []
      };
      setEntries((prev) => {
        const { nextEntries, summary: computed } = mergePerformanceData(prev, dataset);
        summary = computed;
        return nextEntries;
      });
      return summary;
    };
    const monthLabel = monthCursor.toLocaleDateString(void 0, {
      month: "long",
      year: "numeric"
    });
    const days = useMemo(
      () => Array.from(
        { length: daysInMonth(monthCursor.getFullYear(), monthCursor.getMonth()) },
        (_, index) => index + 1
      ),
      [monthCursor]
    );
    const startISO = monthStartISO(monthCursor);
    const endISO = monthEndISO(monthCursor);
    const monthEntries = useMemo(() => {
      return entries.filter((entry) => !entry.deletedAt && entry.date >= startISO && entry.date <= endISO).filter((entry) => filterType === "All" ? true : entry.assetType === filterType).filter((entry) => filterStatus === "All" ? true : entry.status === filterStatus).filter((entry) => filterPlatforms.length === 0 ? true : filterPlatforms.some((platform) => entry.platforms.includes(platform))).sort((a, b) => a.date.localeCompare(b.date));
    }, [entries, startISO, endISO, filterType, filterStatus, filterPlatforms]);
    const assetTypeSummary = useMemo(() => {
      const counts = monthEntries.reduce((acc, entry) => {
        acc[entry.assetType] = (acc[entry.assetType] || 0) + 1;
        return acc;
      }, {});
      const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
      return { counts, total };
    }, [monthEntries]);
    const ideasByMonth = useMemo(() => {
      const groups = /* @__PURE__ */ new Map();
      ideas.forEach((idea) => {
        const key = idea.targetMonth || "";
        if (!key) return;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(idea);
      });
      return groups;
    }, [ideas]);
    const currentMonthIdeas = useMemo(() => {
      const key = monthCursor.toISOString().slice(0, 7);
      const items = ideasByMonth.get(key) || [];
      return items.slice().sort((a, b) => (a.targetDate || "").localeCompare(b.targetDate || ""));
    }, [ideasByMonth, monthCursor]);
    const kanbanEntries = useMemo(
      () => entries.filter((entry) => !entry.deletedAt),
      [entries]
    );
    const entriesByFramework = useMemo(() => {
      const map = /* @__PURE__ */ new Map();
      entries.forEach((entry) => {
        if (entry.deletedAt) return;
        const key = entry.testingFrameworkId ? String(entry.testingFrameworkId) : "";
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
        counts[framework.id] = entriesByFramework[framework.id] ? entriesByFramework[framework.id].length : 0;
      });
      return counts;
    }, [testingFrameworks, entriesByFramework]);
    const selectedFramework = selectedFrameworkId && testingFrameworks.length ? testingFrameworks.find((framework) => framework.id === selectedFrameworkId) || null : null;
    const selectedFrameworkEntries = selectedFrameworkId && entriesByFramework[selectedFrameworkId] ? entriesByFramework[selectedFrameworkId] : [];
    const trashed = useMemo(
      () => entries.filter((entry) => entry.deletedAt).sort((a, b) => (b.deletedAt || "").localeCompare(a.deletedAt || "")),
      [entries]
    );
    const outstandingApprovals = useMemo(() => {
      if (!currentUser) return [];
      return entries.filter(
        (entry) => !entry.deletedAt && entry.status === "Pending" && Array.isArray(entry.approvers) && entry.approvers.includes(currentUser)
      ).sort((a, b) => a.date.localeCompare(b.date));
    }, [entries, currentUser]);
    const outstandingCount = outstandingApprovals.length;
    const ideaCount = ideas.length;
    const linkedinCount = linkedinSubmissions.length;
    const testingFrameworkCount = testingFrameworks.length;
    const userNotifications = useMemo(() => {
      if (!currentUser) return [];
      return notifications.filter((item) => item.user === currentUser).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    }, [notifications, currentUser]);
    const featureTiles = [
      {
        id: "create",
        title: "Create Content",
        description: "Capture briefs, assign approvers, and log the assets your team needs to produce next.",
        cta: "Open form",
        onClick: () => {
          setCurrentView("form");
          setPlanTab("plan");
          closeEntry();
        }
      },
      {
        id: "calendar",
        title: "Calendar",
        description: "Review what is booked each day, approve content, and tidy up anything sitting in trash.",
        cta: "View calendar",
        onClick: () => {
          setCurrentView("plan");
          setPlanTab("plan");
          closeEntry();
        }
      },
      {
        id: "kanban",
        title: "Production Kanban",
        description: "Move work from draft to scheduled with status-based swimlanes.",
        cta: "View board",
        onClick: () => {
          setCurrentView("plan");
          setPlanTab("kanban");
          closeEntry();
        }
      },
      {
        id: "linkedin",
        title: "LinkedIn drafts",
        description: "Submit LinkedIn copy for review or queue posts for teammates to share.",
        cta: "View drafts",
        onClick: () => {
          setCurrentView("plan");
          setPlanTab("linkedin");
          closeEntry();
        }
      },
      {
        id: "testing",
        title: "Testing Lab",
        description: "Document hypotheses, success metrics, and frameworks you can link to briefs.",
        cta: "Explore tests",
        onClick: () => {
          setCurrentView("plan");
          setPlanTab("testing");
          closeEntry();
        }
      },
      {
        id: "approvals",
        title: "Your Approvals",
        description: "Track what still needs your sign-off and clear the queue in one pass.",
        cta: "View queue",
        onClick: () => {
          setCurrentView("approvals");
          setPlanTab("plan");
          closeEntry();
        }
      },
      {
        id: "ideas",
        title: "Ideas Log",
        description: "Capture topics, themes, and series concepts\u2014complete with notes, links, and assets.",
        cta: "View ideas",
        onClick: () => {
          setCurrentView("plan");
          setPlanTab("ideas");
          closeEntry();
        }
      }
    ];
    const unreadNotifications = useMemo(
      () => userNotifications.filter((item) => !item.read),
      [userNotifications]
    );
    const unreadMentionsCount = useMemo(
      () => unreadNotifications.filter((item) => item.type === "mention").length,
      [unreadNotifications]
    );
    const closeEntry = () => {
      setViewingId(null);
      setViewingSnapshot(null);
    };
    const openEntry = (id) => {
      if (!id) {
        closeEntry();
        return;
      }
      setViewingId(id);
      const found = entries.find((entry) => entry.id === id);
      setViewingSnapshot(found ? sanitizeEntry(found) : null);
      if (found) {
        markNotificationsAsReadForEntry(found.id, currentUser);
      }
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
    const addEntry = (data) => {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      let createdEntry = null;
      setEntries((prev) => {
        const rawEntry = {
          id: uuid(),
          status: "Pending",
          createdAt: timestamp,
          updatedAt: timestamp,
          checklist: data.checklist,
          comments: data.comments || [],
          workflowStatus: data.workflowStatus && KANBAN_STATUSES.includes(data.workflowStatus) ? data.workflowStatus : KANBAN_STATUSES[0],
          ...data
        };
        const sanitized = sanitizeEntry(rawEntry);
        const entryWithStatus = {
          ...sanitized,
          statusDetail: computeStatusDetail(sanitized)
        };
        createdEntry = entryWithStatus;
        return [entryWithStatus, ...prev];
      });
      if (createdEntry) {
        addNotifications(buildApprovalNotifications(createdEntry));
      }
    };
    const upsert = (updated) => {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      let approvalNotifications = [];
      setEntries(
        (prev) => prev.map(
          (entry) => entry.id === updated.id ? (() => {
            const merged = {
              ...entry,
              ...updated,
              updatedAt: timestamp
            };
            const sanitized = sanitizeEntry(merged);
            const previousApprovers = ensurePeopleArray(entry.approvers);
            const nextApprovers = ensurePeopleArray(sanitized.approvers);
            const newApprovers = nextApprovers.filter(
              (name) => name && !previousApprovers.includes(name)
            );
            if (newApprovers.length) {
              approvalNotifications = approvalNotifications.concat(
                buildApprovalNotifications(sanitized, newApprovers)
              );
            }
            return {
              ...sanitized,
              statusDetail: computeStatusDetail(sanitized)
            };
          })() : entry
        )
      );
      if (approvalNotifications.length) {
        addNotifications(approvalNotifications);
      }
    };
    const toggleApprove = (id) => {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      setEntries(
        (prev) => prev.map((entry) => {
          if (entry.id !== id) return entry;
          const toggled = entry.status === "Approved" ? "Pending" : "Approved";
          const updatedEntry = sanitizeEntry({
            ...entry,
            status: toggled,
            approvedAt: toggled === "Approved" ? timestamp : void 0,
            updatedAt: timestamp
          });
          const workflowStatus = toggled === "Approved" ? "Approved" : KANBAN_STATUSES.includes(updatedEntry.workflowStatus) ? updatedEntry.workflowStatus : KANBAN_STATUSES.includes(entry.workflowStatus) ? entry.workflowStatus : KANBAN_STATUSES[0];
          const normalized = {
            ...updatedEntry,
            workflowStatus
          };
          return {
            ...normalized,
            statusDetail: computeStatusDetail(normalized)
          };
        })
      );
    };
    const updateWorkflowStatus = (id, nextStatus) => {
      if (!KANBAN_STATUSES.includes(nextStatus)) return;
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      setEntries(
        (prev) => prev.map((entry) => {
          if (entry.id !== id) return entry;
          const sanitized = sanitizeEntry({
            ...entry,
            workflowStatus: nextStatus,
            updatedAt: timestamp
          });
          return {
            ...sanitized,
            statusDetail: computeStatusDetail(sanitized)
          };
        })
      );
    };
    const softDelete = (id) => {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      setEntries(
        (prev) => prev.map(
          (entry) => entry.id === id ? { ...entry, deletedAt: timestamp, updatedAt: timestamp } : entry
        )
      );
      if (viewingId === id) closeEntry();
    };
    const restore = (id) => {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      setEntries(
        (prev) => prev.map(
          (entry) => entry.id === id ? { ...entry, deletedAt: void 0, updatedAt: timestamp } : entry
        )
      );
    };
    const hardDelete = (id) => {
      const confirmed = window.confirm("Delete this item permanently? This cannot be undone.");
      if (!confirmed) return;
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      if (viewingId === id) closeEntry();
    };
    const handleSignOut = () => {
      setCurrentUser(null);
      setUserSelection("");
      setCurrentView("login");
      closeEntry();
    };
    const submitLogin = (event) => {
      event.preventDefault();
      if (!userSelection) return;
      setCurrentUser(userSelection);
      setCurrentView("menu");
      closeEntry();
    };
    if (currentView === "login") {
      return /* @__PURE__ */ React.createElement("div", { className: "mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-16 text-ocean-900" }, /* @__PURE__ */ React.createElement("div", { className: "rounded-3xl border border-aqua-200 bg-white p-8 shadow-2xl" }, /* @__PURE__ */ React.createElement("h1", { className: "heading-font text-3xl font-semibold text-ocean-600" }, "Content Dashboard"), /* @__PURE__ */ React.createElement("p", { className: "mt-2 text-sm text-graystone-600" }, "Pick yourself from the roster to jump into planning, approvals, and production tracking."), /* @__PURE__ */ React.createElement("form", { className: "mt-6 space-y-4", onSubmit: submitLogin }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { className: "text-sm text-graystone-600", htmlFor: "login-user" }, "Who's working?"), /* @__PURE__ */ React.createElement(
        "select",
        {
          id: "login-user",
          value: userSelection,
          onChange: (event) => setUserSelection(event.target.value),
          className: cx(selectBaseClasses, "w-full px-4 py-3 text-sm")
        },
        /* @__PURE__ */ React.createElement("option", { value: "" }, "Select your name"),
        USERS.map((user) => /* @__PURE__ */ React.createElement("option", { key: user, value: user }, user))
      )), /* @__PURE__ */ React.createElement(
        Button,
        {
          type: "submit",
          disabled: !userSelection,
          className: "w-full"
        },
        "Enter dashboard"
      ))), /* @__PURE__ */ React.createElement("p", { className: "mt-6 text-center text-xs text-graystone-500" }, "Tip: approvals are filtered automatically so you only see what needs your sign-off."));
    }
    return /* @__PURE__ */ React.createElement("div", { className: "mx-auto max-w-7xl px-4 py-8" }, currentView === "menu" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "mb-6 flex flex-col gap-4 text-ocean-900 lg:flex-row lg:items-center lg:justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "heading-font inline-flex items-center gap-2 text-sm font-semibold text-black" }, /* @__PURE__ */ React.createElement("span", { className: "inline-block h-3 w-3 rounded-full bg-[#00F5FF]", "aria-hidden": "true" }), "Signed in as"), /* @__PURE__ */ React.createElement("span", { className: "heading-font inline-flex items-center rounded-full bg-aqua-100 px-4 py-2 text-sm font-semibold text-ocean-700" }, currentUser)), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-3" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => outstandingCount > 0 && setApprovalsModalOpen(true),
        disabled: outstandingCount === 0,
        className: "heading-font inline-flex items-center gap-2 rounded-full border border-[#0F9DDE]/30 bg-aqua-100/80 px-4 py-2 text-sm font-semibold text-ocean-700 transition hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(15,157,222,0.35)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0F9DDE]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#CFEBF8] disabled:translate-y-0 disabled:shadow-none disabled:opacity-60"
      },
      /* @__PURE__ */ React.createElement("span", { className: "inline-block h-3 w-3 rounded-full bg-[#00F5FF]", "aria-hidden": "true" }),
      outstandingCount,
      " awaiting approval"
    ), unreadMentionsCount > 0 ? /* @__PURE__ */ React.createElement("span", { className: "heading-font inline-flex items-center gap-2 rounded-full bg-aqua-100 px-4 py-2 text-sm font-semibold text-ocean-700" }, /* @__PURE__ */ React.createElement("span", { className: "inline-block h-3 w-3 rounded-full bg-[#00F5FF]", "aria-hidden": "true" }), unreadMentionsCount, " new mentions") : null, /* @__PURE__ */ React.createElement(
      Button,
      {
        onClick: handleSignOut,
        className: "heading-font text-sm normal-case"
      },
      "Switch user"
    ), /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "outline",
        className: "heading-font text-sm normal-case",
        onClick: () => setGuidelinesOpen(true)
      },
      "Guidelines"
    ), /* @__PURE__ */ React.createElement(
      NotificationBell,
      {
        notifications: userNotifications,
        unreadCount: unreadNotifications.length,
        onOpenItem: (note) => {
          openEntry(note.entryId);
          markNotificationsAsReadForEntry(note.entryId, currentUser);
        }
      }
    ))), /* @__PURE__ */ React.createElement("header", { className: "mb-10" }, /* @__PURE__ */ React.createElement("div", { className: "border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]" }, /* @__PURE__ */ React.createElement("h1", { className: "heading-font flex items-center gap-2 text-3xl font-semibold text-black md:text-4xl" }, /* @__PURE__ */ React.createElement("span", { className: "inline-block h-3 w-3 rounded-full bg-[#00F5FF]", "aria-hidden": "true" }), "Content Dashboard"), /* @__PURE__ */ React.createElement("p", { className: "mt-3 max-w-2xl text-base text-graystone-600" }, "Plan, approve, and ship social content in one place. Track production status, stay on top of approvals, and keep a clean trail of who owns what."))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]"
      },
      /* @__PURE__ */ React.createElement("div", { className: "heading-font flex items-center gap-3 text-2xl font-semibold text-black" }, /* @__PURE__ */ React.createElement(
        "span",
        {
          className: cx(
            "inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out",
            menuMotionActive ? "translate-x-0 opacity-100 rotate-180" : "translate-x-6 opacity-0"
          ),
          style: { transitionDelay: "80ms" },
          "aria-hidden": "true"
        }
      ), /* @__PURE__ */ React.createElement(
        "span",
        {
          className: cx(
            "transform transition-all duration-700 ease-out",
            menuMotionActive ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
          ),
          style: { transitionDelay: "160ms" }
        },
        "Create Content"
      )),
      /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-600" }, "Capture briefs, assign approvers, and log the assets your team needs to produce next."),
      /* @__PURE__ */ React.createElement(
        Button,
        {
          onClick: () => {
            setCurrentView("form");
            setPlanTab("plan");
            closeEntry();
            try {
              window.location.hash = "#create";
            } catch {
            }
          },
          className: "mt-auto"
        },
        "Open form"
      )
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]"
      },
      /* @__PURE__ */ React.createElement("div", { className: "heading-font flex items-center gap-3 text-2xl font-semibold text-black" }, /* @__PURE__ */ React.createElement(
        "span",
        {
          className: cx(
            "inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out",
            menuMotionActive ? "translate-x-0 opacity-100 rotate-180" : "translate-x-6 opacity-0"
          ),
          style: { transitionDelay: "120ms" },
          "aria-hidden": "true"
        }
      ), /* @__PURE__ */ React.createElement(
        "span",
        {
          className: cx(
            "transform transition-all duration-700 ease-out",
            menuMotionActive ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
          ),
          style: { transitionDelay: "200ms" }
        },
        "Calendar"
      )),
      /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-600" }, "Review what is booked each day, approve content, and tidy up anything sitting in trash."),
      /* @__PURE__ */ React.createElement(
        Button,
        {
          onClick: () => {
            setCurrentView("plan");
            setPlanTab("plan");
            closeEntry();
          },
          className: "mt-auto"
        },
        "View calendar"
      )
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]"
      },
      /* @__PURE__ */ React.createElement("div", { className: "heading-font flex items-center gap-3 text-2xl font-semibold text-black" }, /* @__PURE__ */ React.createElement(
        "span",
        {
          className: cx(
            "inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out",
            menuMotionActive ? "translate-x-0 opacity-100 rotate-180" : "translate-x-6 opacity-0"
          ),
          style: { transitionDelay: "160ms" },
          "aria-hidden": "true"
        }
      ), /* @__PURE__ */ React.createElement(
        "span",
        {
          className: cx(
            "transform transition-all duration-700 ease-out",
            menuMotionActive ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
          ),
          style: { transitionDelay: "240ms" }
        },
        "Production Kanban"
      )),
      /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-600" }, "Move work from draft to scheduled with status-based swimlanes."),
      /* @__PURE__ */ React.createElement(
        Button,
        {
          onClick: () => {
            setCurrentView("plan");
            setPlanTab("kanban");
            closeEntry();
          },
          className: "mt-auto"
        },
        "View board"
      )
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]"
      },
      /* @__PURE__ */ React.createElement("div", { className: "heading-font flex items-center gap-3 text-2xl font-semibold text-black" }, /* @__PURE__ */ React.createElement(
        "span",
        {
          className: cx(
            "inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out",
            menuMotionActive ? "translate-x-0 opacity-100 rotate-180" : "translate-x-6 opacity-0"
          ),
          style: { transitionDelay: "200ms" },
          "aria-hidden": "true"
        }
      ), /* @__PURE__ */ React.createElement(
        "span",
        {
          className: cx(
            "transform transition-all duration-700 ease-out",
            menuMotionActive ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
          ),
          style: { transitionDelay: "280ms" }
        },
        "LinkedIn drafts"
      )),
      /* @__PURE__ */ React.createElement("p", { className: "mt-3 text-sm text-graystone-600" }, "Submit LinkedIn copy for review or queue posts for teammates to share."),
      /* @__PURE__ */ React.createElement(
        Button,
        {
          onClick: () => {
            setCurrentView("plan");
            setPlanTab("linkedin");
            closeEntry();
          },
          className: "mt-auto"
        },
        "View drafts"
      )
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]"
      },
      /* @__PURE__ */ React.createElement("div", { className: "heading-font flex items-center gap-3 text-2xl font-semibold text-black" }, /* @__PURE__ */ React.createElement(
        "span",
        {
          className: cx(
            "inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out",
            menuMotionActive ? "translate-x-0 opacity-100 rotate-180" : "translate-x-6 opacity-0"
          ),
          style: { transitionDelay: "240ms" },
          "aria-hidden": "true"
        }
      ), /* @__PURE__ */ React.createElement(
        "span",
        {
          className: cx(
            "transform transition-all duration-700 ease-out",
            menuMotionActive ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
          ),
          style: { transitionDelay: "320ms" }
        },
        "Testing Lab"
      )),
      /* @__PURE__ */ React.createElement("p", { className: "mt-3 text-sm text-graystone-600" }, "Document hypotheses, success metrics, and frameworks you can link to briefs."),
      /* @__PURE__ */ React.createElement(
        Button,
        {
          onClick: () => {
            setCurrentView("plan");
            setPlanTab("testing");
            closeEntry();
          },
          className: "mt-auto"
        },
        "Explore tests"
      )
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]"
      },
      /* @__PURE__ */ React.createElement("div", { className: "heading-font flex items-center gap-3 text-2xl font-semibold text-black" }, /* @__PURE__ */ React.createElement(
        "span",
        {
          className: cx(
            "inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out",
            menuMotionActive ? "translate-x-0 opacity-100 rotate-180" : "translate-x-6 opacity-0"
          ),
          style: { transitionDelay: "280ms" },
          "aria-hidden": "true"
        }
      ), /* @__PURE__ */ React.createElement(
        "span",
        {
          className: cx(
            "transform transition-all duration-700 ease-out",
            menuMotionActive ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
          ),
          style: { transitionDelay: "360ms" }
        },
        "Your Approvals"
      )),
      /* @__PURE__ */ React.createElement("p", { className: "mt-3 text-sm text-graystone-600" }, "Track what still needs your sign-off and clear the queue in one pass."),
      /* @__PURE__ */ React.createElement(
        Button,
        {
          onClick: () => {
            setCurrentView("approvals");
            setPlanTab("plan");
            closeEntry();
          },
          className: "mt-auto"
        },
        "View queue"
      )
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]"
      },
      /* @__PURE__ */ React.createElement("div", { className: "heading-font flex items-center gap-3 text-2xl font-semibold text-black" }, /* @__PURE__ */ React.createElement(
        "span",
        {
          className: cx(
            "inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out",
            menuMotionActive ? "translate-x-0 opacity-100 rotate-180" : "translate-x-6 opacity-0"
          ),
          style: { transitionDelay: "320ms" },
          "aria-hidden": "true"
        }
      ), /* @__PURE__ */ React.createElement(
        "span",
        {
          className: cx(
            "transform transition-all duration-700 ease-out",
            menuMotionActive ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
          ),
          style: { transitionDelay: "400ms" }
        },
        "Ideas Log"
      )),
      /* @__PURE__ */ React.createElement("p", { className: "mt-3 text-sm text-graystone-600" }, "Capture topics, themes, and series concepts\u2014complete with notes, links, and assets."),
      /* @__PURE__ */ React.createElement(
        Button,
        {
          onClick: () => {
            setCurrentView("plan");
            setPlanTab("ideas");
            closeEntry();
          },
          className: "mt-auto"
        },
        "View ideas"
      )
    )), userNotifications.length > 0 && /* @__PURE__ */ React.createElement(Card, { className: "mt-8 shadow-xl" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-lg text-ocean-900" }, "Notifications"), /* @__PURE__ */ React.createElement("p", { className: "mt-2 text-sm text-graystone-500" }, "Mentions and approval assignments for your content.")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, userNotifications.slice(0, 8).map((note) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: note.id,
        onClick: () => {
          openEntry(note.entryId);
          markNotificationsAsReadForEntry(note.entryId, currentUser);
        },
        className: cx(
          "w-full rounded-xl border px-4 py-3 text-left text-sm transition",
          note.read ? "border-graystone-200 bg-white hover:border-aqua-300 hover:bg-aqua-50/50" : "border-aqua-300 bg-aqua-50 hover:border-aqua-400"
        )
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "font-medium text-graystone-800" }, note.message), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-graystone-500" }, new Date(note.createdAt).toLocaleString()))
    )))))), currentView === "form" && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1" }, /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "ghost",
        onClick: () => {
          setCurrentView("menu");
          setPlanTab("plan");
          closeEntry();
        },
        className: "self-start"
      },
      "Back to menu"
    ), /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-semibold text-ocean-700" }, "Create Content"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-600" }, "Submit a brief and it will appear on the calendar instantly.")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "outline",
        onClick: () => {
          setCurrentView("plan");
          setPlanTab("plan");
          closeEntry();
        }
      },
      "View calendar"
    ), /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "ghost",
        onClick: handleSignOut,
        className: "heading-font text-sm normal-case"
      },
      "Switch user"
    ), /* @__PURE__ */ React.createElement(
      NotificationBell,
      {
        notifications: userNotifications,
        unreadCount: unreadNotifications.length,
        onOpenItem: (note) => {
          if (note.entryId) {
            openEntry(note.entryId);
          }
          markNotificationsAsReadForEntry(note.entryId, currentUser);
        }
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-aqua-200 pb-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "outline",
        size: "sm",
        onClick: () => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))
      },
      "Prev"
    ), /* @__PURE__ */ React.createElement("div", { className: "inline-flex items-center gap-2 rounded-full border border-black px-4 py-2 text-sm font-semibold text-graystone-800" }, /* @__PURE__ */ React.createElement(CalendarIcon, { className: "h-4 w-4 text-ocean-600" }), monthLabel), /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "outline",
        size: "sm",
        onClick: () => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))
      },
      "Next"
    )), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-graystone-600" }, "Choose the month to populate the day picker below.")), /* @__PURE__ */ React.createElement("div", { className: "grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(260px,1fr)]" }, /* @__PURE__ */ React.createElement("div", { className: "w-full" }, /* @__PURE__ */ React.createElement(
      EntryForm,
      {
        key: startISO,
        monthCursor,
        onSubmit: addEntry,
        existingEntries: entries.filter((entry) => !entry.deletedAt),
        testingFrameworks,
        onPreviewAssetType: setPendingAssetType,
        guidelines,
        currentUser
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "flex w-full flex-col gap-6" }, /* @__PURE__ */ React.createElement(MiniCalendar, { monthCursor, entries: monthEntries, onOpenEntry: openEntry })))), currentView === "plan" && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-3" }, /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "ghost",
        onClick: () => {
          setCurrentView("menu");
          setPlanTab("plan");
          closeEntry();
        }
      },
      "Back to menu"
    ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 rounded-3xl border border-aqua-200 bg-aqua-50 p-1 text-ocean-600" }, /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "ghost",
        onClick: () => setPlanTab("plan"),
        className: cx(
          "rounded-2xl px-4 py-2 text-sm transition",
          planTab === "plan" ? "bg-ocean-500 text-white hover:bg-ocean-600" : "text-ocean-600 hover:bg-aqua-100"
        )
      },
      "Calendar"
    ), /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "ghost",
        onClick: () => setPlanTab("trash"),
        className: cx(
          "rounded-2xl px-4 py-2 text-sm transition",
          planTab === "trash" ? "bg-ocean-500 text-white hover:bg-ocean-600" : "text-ocean-600 hover:bg-aqua-100"
        )
      },
      "Trash"
    ), /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "ghost",
        onClick: () => setPlanTab("kanban"),
        className: cx(
          "rounded-2xl px-4 py-2 text-sm transition",
          planTab === "kanban" ? "bg-ocean-500 text-white hover:bg-ocean-600" : "text-ocean-600 hover:bg-aqua-100"
        )
      },
      "Kanban"
    ), /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "ghost",
        onClick: () => setPlanTab("ideas"),
        className: cx(
          "rounded-2xl px-4 py-2 text-sm transition",
          planTab === "ideas" ? "bg-ocean-500 text-white hover:bg-ocean-600" : "text-ocean-600 hover:bg-aqua-100"
        )
      },
      "Ideas"
    ), /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "ghost",
        onClick: () => setPlanTab("linkedin"),
        className: cx(
          "rounded-2xl px-4 py-2 text-sm transition",
          planTab === "linkedin" ? "bg-ocean-500 text-white hover:bg-ocean-600" : "text-ocean-600 hover:bg-aqua-100"
        )
      },
      "LinkedIn"
    ), /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "ghost",
        onClick: () => setPlanTab("testing"),
        className: cx(
          "rounded-2xl px-4 py-2 text-sm transition",
          planTab === "testing" ? "bg-ocean-500 text-white hover:bg-ocean-600" : "text-ocean-600 hover:bg-aqua-100"
        )
      },
      "Testing Lab"
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      Button,
      {
        onClick: () => {
          setCurrentView("form");
          setPlanTab("plan");
          closeEntry();
          try {
            window.location.hash = "#create";
          } catch {
          }
        },
        className: "gap-2"
      },
      /* @__PURE__ */ React.createElement(PlusIcon, { className: "h-4 w-4 text-white" }),
      "Create content"
    ), /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "outline",
        onClick: () => setGuidelinesOpen(true)
      },
      "Guidelines"
    ), /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "ghost",
        onClick: handleSignOut,
        className: "heading-font text-sm normal-case"
      },
      "Switch user"
    ))), (() => {
      switch (planTab) {
        case "plan":
          return /* @__PURE__ */ React.createElement(Card, { className: "shadow-xl" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-xl text-ocean-900" }, "Calendar"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => setMonthCursor(
                new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1)
              )
            },
            "Prev"
          ), /* @__PURE__ */ React.createElement("div", { className: "inline-flex items-center gap-2 rounded-md border border-graystone-200 bg-white px-3 py-1 text-sm font-medium text-graystone-700 shadow-sm" }, /* @__PURE__ */ React.createElement(CalendarIcon, { className: "h-4 w-4 text-graystone-500" }), monthLabel), /* @__PURE__ */ React.createElement(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => setMonthCursor(
                new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1)
              )
            },
            "Next"
          ), /* @__PURE__ */ React.createElement(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => setPerformanceImportOpen(true)
            },
            "Import performance"
          ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Label, { className: "text-xs text-graystone-600" }, "Asset type"), /* @__PURE__ */ React.createElement(
            "select",
            {
              value: filterType,
              onChange: (event) => setFilterType(event.target.value),
              className: cx(selectBaseClasses, "mt-1 w-full")
            },
            /* @__PURE__ */ React.createElement("option", { value: "All" }, "All"),
            /* @__PURE__ */ React.createElement("option", { value: "Video" }, "Video"),
            /* @__PURE__ */ React.createElement("option", { value: "Design" }, "Design"),
            /* @__PURE__ */ React.createElement("option", { value: "Carousel" }, "Carousel")
          )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Label, { className: "text-xs text-graystone-600" }, "Status"), /* @__PURE__ */ React.createElement(
            "select",
            {
              value: filterStatus,
              onChange: (event) => setFilterStatus(event.target.value),
              className: cx(selectBaseClasses, "mt-1 w-full")
            },
            /* @__PURE__ */ React.createElement("option", { value: "All" }, "All"),
            /* @__PURE__ */ React.createElement("option", { value: "Pending" }, "Pending"),
            /* @__PURE__ */ React.createElement("option", { value: "Approved" }, "Approved")
          )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Label, { className: "text-xs text-graystone-600" }, "Platforms"), /* @__PURE__ */ React.createElement("div", { className: "mt-1" }, /* @__PURE__ */ React.createElement(PlatformFilter, { value: filterPlatforms, onChange: setFilterPlatforms })))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1" }, /* @__PURE__ */ React.createElement("div", { className: "rounded-2xl border border-aqua-200 bg-aqua-50 px-3 py-3" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-semibold uppercase tracking-wide text-ocean-600" }, "Ideas for this month"), currentMonthIdeas.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "mt-2 text-xs text-graystone-500" }, "No ideas tagged for this month yet.") : /* @__PURE__ */ React.createElement("div", { className: "mt-2 space-y-2" }, currentMonthIdeas.map((idea) => /* @__PURE__ */ React.createElement(
            "div",
            {
              key: idea.id,
              className: "rounded-xl border border-aqua-200 bg-white px-3 py-2 text-xs text-graystone-700"
            },
            /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-ocean-700" }, idea.title), idea.targetDate ? /* @__PURE__ */ React.createElement("span", { className: "text-graystone-500" }, new Date(idea.targetDate).toLocaleDateString()) : null),
            idea.notes && /* @__PURE__ */ React.createElement("div", { className: "mt-1 line-clamp-2 text-graystone-600" }, idea.notes),
            /* @__PURE__ */ React.createElement("div", { className: "mt-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-graystone-400" }, idea.type, idea.links && idea.links.length > 0 && /* @__PURE__ */ React.createElement(
              "a",
              {
                href: idea.links[0],
                target: "_blank",
                rel: "noopener noreferrer",
                className: "text-ocean-600 hover:underline"
              },
              "View link"
            ))
          ))))))), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("div", { className: "grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(240px,0.8fr)]" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(
            MonthGrid,
            {
              days,
              month: monthCursor.getMonth(),
              year: monthCursor.getFullYear(),
              entries: monthEntries,
              onApprove: toggleApprove,
              onDelete: softDelete,
              onOpen: openEntry
            }
          )), /* @__PURE__ */ React.createElement(
            AssetRatioCard,
            {
              summary: assetTypeSummary,
              monthLabel,
              pendingAssetType: null,
              goals: assetGoals,
              onGoalsChange: setAssetGoals
            }
          ))));
        case "trash":
          return /* @__PURE__ */ React.createElement(Card, { className: "shadow-xl" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-lg text-ocean-900" }, "Trash (30-day retention)")), /* @__PURE__ */ React.createElement(CardContent, null, trashed.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-500" }, "Nothing in the trash.") : /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, trashed.map((entry) => /* @__PURE__ */ React.createElement(
            "div",
            {
              key: entry.id,
              className: "rounded-xl border border-graystone-200 bg-white px-4 py-3 shadow-sm"
            },
            /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2" }, /* @__PURE__ */ React.createElement(Badge, { variant: "outline" }, entry.assetType), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-medium text-graystone-700" }, new Date(entry.date).toLocaleDateString()), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-graystone-500" }, "Deleted ", entry.deletedAt ? new Date(entry.deletedAt).toLocaleString() : "")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "outline", onClick: () => restore(entry.id) }, /* @__PURE__ */ React.createElement(RotateCcwIcon, { className: "h-4 w-4 text-graystone-600" }), "Restore"), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "destructive", onClick: () => hardDelete(entry.id) }, /* @__PURE__ */ React.createElement(TrashIcon, { className: "h-4 w-4 text-white" }), "Delete forever"))),
            entry.caption && /* @__PURE__ */ React.createElement("p", { className: "mt-2 line-clamp-2 text-sm text-graystone-600" }, entry.caption)
          )))));
        case "kanban":
          return /* @__PURE__ */ React.createElement(
            KanbanBoard,
            {
              statuses: KANBAN_STATUSES,
              entries: kanbanEntries,
              onOpen: openEntry,
              onUpdateStatus: updateWorkflowStatus
            }
          );
        case "ideas":
          return /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2" }, /* @__PURE__ */ React.createElement(IdeaForm, { onSubmit: addIdea, currentUser }), /* @__PURE__ */ React.createElement(IdeasBoard, { ideas, onDelete: deleteIdea }));
        case "linkedin":
          return /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2" }, /* @__PURE__ */ React.createElement(LinkedInSubmissionForm, { onSubmit: addLinkedInSubmission, currentUser }), /* @__PURE__ */ React.createElement(
            LinkedInSubmissionList,
            {
              submissions: linkedinSubmissions,
              onStatusChange: updateLinkedInStatus
            }
          ));
        case "testing":
          return /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr,1fr] xl:grid-cols-[1.5fr,1fr]" }, /* @__PURE__ */ React.createElement(TestingFrameworkForm, { onSubmit: addTestingFrameworkEntry }), /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement(
            TestingFrameworkList,
            {
              frameworks: testingFrameworks,
              onDelete: deleteTestingFramework,
              onSelect: setSelectedFrameworkId,
              selectedId: selectedFrameworkId,
              entryCounts: frameworkEntryCounts
            }
          ), /* @__PURE__ */ React.createElement(
            TestingFrameworkHub,
            {
              framework: selectedFramework,
              entries: selectedFrameworkEntries,
              onOpenEntry: openEntry
            }
          )));
        default:
          return null;
      }
    })()), currentView === "approvals" && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-3" }, /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "ghost",
        onClick: () => {
          setCurrentView("menu");
          setPlanTab("plan");
          closeEntry();
        }
      },
      "Back to menu"
    ), /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "ghost",
        onClick: () => {
          setCurrentView("plan");
          setPlanTab("plan");
        }
      },
      "Go to calendar"
    ), /* @__PURE__ */ React.createElement(Badge, { variant: "outline", className: "text-xs" }, outstandingCount, " waiting"), unreadMentionsCount > 0 && /* @__PURE__ */ React.createElement(Badge, { variant: "outline", className: "text-xs bg-ocean-500/10 text-ocean-700" }, unreadMentionsCount, " mentions")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      Button,
      {
        onClick: () => {
          setCurrentView("form");
          setPlanTab("plan");
          closeEntry();
          try {
            window.location.hash = "#create";
          } catch {
          }
        },
        className: "gap-2"
      },
      /* @__PURE__ */ React.createElement(PlusIcon, { className: "h-4 w-4 text-white" }),
      "Create content"
    ), /* @__PURE__ */ React.createElement(
      Button,
      {
        variant: "ghost",
        onClick: handleSignOut,
        className: "heading-font text-sm normal-case"
      },
      "Switch user"
    ))), /* @__PURE__ */ React.createElement(Card, { className: "shadow-xl" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-lg text-ocean-900" }, "Your Approvals"), /* @__PURE__ */ React.createElement("p", { className: "mt-2 text-sm text-graystone-500" }, "Items assigned to you that still need approval. Click an item to review, comment, or approve.")), /* @__PURE__ */ React.createElement(CardContent, null, outstandingApprovals.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-sm text-graystone-500" }, "Everything looks good. Nothing needs your approval right now.") : /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, outstandingApprovals.map((entry) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: entry.id,
        className: "rounded-xl border border-graystone-200 bg-white px-4 py-4 shadow-sm transition hover:border-aqua-400"
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-start justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2" }, /* @__PURE__ */ React.createElement(Badge, { variant: "outline" }, entry.assetType), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold text-graystone-800" }, new Date(entry.date).toLocaleDateString(void 0, {
        month: "short",
        day: "numeric",
        weekday: "short"
      })), /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-aqua-100 px-2 py-1 text-xs font-medium text-ocean-700" }, entry.statusDetail)), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 text-xs text-graystone-500" }, /* @__PURE__ */ React.createElement("span", null, "Requested by ", entry.author || "Unknown"), entry.approvers?.length ? /* @__PURE__ */ React.createElement("span", null, "Approvers: ", entry.approvers.join(", ")) : null), entry.caption && /* @__PURE__ */ React.createElement("p", { className: "line-clamp-3 text-sm text-graystone-700" }, entry.caption), (entry.campaign || entry.contentPillar || entry.testingFrameworkName) && /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-1 text-[11px] text-graystone-500" }, entry.campaign ? /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-aqua-100 px-2 py-0.5 text-ocean-700" }, entry.campaign) : null, entry.contentPillar ? /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-graystone-100 px-2 py-0.5 text-graystone-700" }, entry.contentPillar) : null, entry.testingFrameworkName ? /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-ocean-500/10 px-2 py-0.5 text-ocean-700" }, "Test: ", entry.testingFrameworkName) : null), entry.checklist && /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 text-xs text-graystone-500" }, Object.entries(entry.checklist).map(([key, value]) => {
        const itemDef = CHECKLIST_ITEMS.find((item) => item.key === key);
        if (!itemDef) return null;
        return /* @__PURE__ */ React.createElement(
          "span",
          {
            key,
            className: cx(
              "inline-flex items-center gap-1 rounded-full px-2 py-1",
              value ? "bg-emerald-100 text-emerald-700" : "bg-graystone-100 text-graystone-500"
            )
          },
          value ? /* @__PURE__ */ React.createElement(CheckCircleIcon, { className: "h-3 w-3 text-emerald-600" }) : /* @__PURE__ */ React.createElement(LoaderIcon, { className: "h-3 w-3 text-graystone-400 animate-none" }),
          itemDef.label
        );
      }))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-end gap-2" }, /* @__PURE__ */ React.createElement(
        Button,
        {
          size: "sm",
          variant: "outline",
          onClick: () => {
            toggleApprove(entry.id);
          },
          className: "gap-2"
        },
        /* @__PURE__ */ React.createElement(CheckCircleIcon, { className: "h-4 w-4 text-emerald-600" }),
        "Mark approved"
      ), /* @__PURE__ */ React.createElement(
        Button,
        {
          size: "sm",
          variant: "ghost",
          onClick: () => openEntry(entry.id),
          className: "gap-2"
        },
        "Open detail"
      )))
    )))))), viewingSnapshot ? /* @__PURE__ */ React.createElement(
      EntryModal,
      {
        entry: viewingSnapshot,
        currentUser,
        onClose: closeEntry,
        onApprove: toggleApprove,
        onDelete: softDelete,
        onSave: upsert,
        onUpdate: upsert,
        onNotifyMentions: handleMentionNotifications,
        testingFrameworks
      }
    ) : null, /* @__PURE__ */ React.createElement(
      ApprovalsModal,
      {
        open: approvalsModalOpen,
        onClose: () => setApprovalsModalOpen(false),
        approvals: outstandingApprovals,
        onOpenEntry: (id) => {
          setApprovalsModalOpen(false);
          openEntry(id);
        },
        onApprove: (id) => toggleApprove(id)
      }
    ), /* @__PURE__ */ React.createElement(
      GuidelinesModal,
      {
        open: guidelinesOpen,
        guidelines,
        onClose: () => setGuidelinesOpen(false),
        onSave: handleGuidelinesSave
      }
    ), /* @__PURE__ */ React.createElement(
      PerformanceImportModal,
      {
        open: performanceImportOpen,
        onClose: () => setPerformanceImportOpen(false),
        onImport: importPerformanceDataset
      }
    ));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(ContentDashboard, null));
})();
//# sourceMappingURL=content-dashboard.bundle.js.map
