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
  DEFAULT_APPROVERS,
  PLATFORM_DEFAULT_LIMITS,
  DEFAULT_GUIDELINES,
  USERS,
  WORKFLOW_STAGES,
  CHECKLIST_ITEMS,
  PLATFORM_IMAGES,
  PLATFORM_TIPS,
  PLATFORM_PREVIEW_META,
  STORAGE_KEY,
  USER_STORAGE_KEY,
  MAX_UPLOAD_BYTES,
  storageAvailable,
  PERFORMANCE_HEADER_KEYS,
  PERFORMANCE_IGNORED_METRIC_KEYS,
} from "./constants.js";
import {
  cx,
  daysInMonth,
  monthStartISO,
  monthEndISO,
  uuid,
  isOlderThanDays,
  isoFromParts,
  ensureArray,
  createEmptyChecklist,
  ensureChecklist,
  ensureComments,
  ensureAnalytics,
  normalizePlatform,
  parseCSV,
  normalizeHeaderKey,
  normalizeDateValue,
  mergePerformanceData,
  extractMentions,
  ensurePlatformCaptions,
  ensurePeopleArray,
  ensureLinksArray,
  ensureAttachments,
  normalizeGuidelines,
  resolveMentionCandidate,
  monthKeyFromDate,
  sanitizeIdea,
  notificationKey,
  sanitizeEntry,
  sanitizeLinkedInSubmission,
  sanitizeTestingFramework,
  entrySignature,
  computeStatusDetail,
  getPlatformCaption,
  isImageMedia,
} from "./utils.js";
import {
  loadGuidelines,
  saveGuidelines,
  loadNotifications,
  saveNotifications,
  appendAudit,
  loadIdeas,
  saveIdeas,
  loadLinkedInSubmissions,
  saveLinkedInSubmissions,
  loadTestingFrameworks,
  saveTestingFrameworks,
  loadEntries,
  saveEntries,
} from "./storage.js";
import {
  iconBase,
  SvgIcon,
  CalendarIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  LoaderIcon,
  TrashIcon,
  RotateCcwIcon,
  PlusIcon,
  PlatformIcon,
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  Badge,
  CopyCheckSection,
  NotificationBell,
  Button,
  selectBaseClasses,
  fileInputClasses,
  Input,
  Textarea,
  Label,
  Separator,
  Toggle,
  MULTI_OPTION_BASE,
  checklistCheckboxClass,
  MultiSelect,
  PlatformFilter,
  ApproverMulti,
  Modal,
  FieldRow,
} from "./components/ui.jsx";

const { useState, useMemo, useEffect } = React;

      function EntryForm({
        monthCursor,
        onSubmit,
        existingEntries = [],
        testingFrameworks = [],
        onPreviewAssetType,
        guidelines = DEFAULT_GUIDELINES,
        currentUser = "",
      }) {
        const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
        const [approvers, setApprovers] = useState([]);
        const [author, setAuthor] = useState("");
        const [platforms, setPlatforms] = useState([]);
        const [allPlatforms, setAllPlatforms] = useState(false);
        const [caption, setCaption] = useState("");
        const [url, setUrl] = useState("");
        const [assetType, setAssetType] = useState("Design");
        const [script, setScript] = useState("");
        const [designCopy, setDesignCopy] = useState("");
        const [slidesCount, setSlidesCount] = useState(3);
        const [carouselSlides, setCarouselSlides] = useState(["", "", ""]);
        const [firstComment, setFirstComment] = useState("");
        const [previewUrl, setPreviewUrl] = useState("");
        const [previewUploadError, setPreviewUploadError] = useState("");
        const [overrideConflict, setOverrideConflict] = useState(false);
        const [platformCaptions, setPlatformCaptions] = useState({});
        const [activeCaptionTab, setActiveCaptionTab] = useState("Main");
        const [activePreviewPlatform, setActivePreviewPlatform] = useState("Main");
        const [workflowStatus, setWorkflowStatus] = useState(KANBAN_STATUSES[0]);
        const [campaign, setCampaign] = useState("");
        const [contentPillar, setContentPillar] = useState("");
        const [testingFrameworkId, setTestingFrameworkId] = useState("");

        const dayOptions = useMemo(() => {
          const total = daysInMonth(monthCursor.getFullYear(), monthCursor.getMonth());
          return Array.from({ length: total }, (_, index) =>
            new Date(monthCursor.getFullYear(), monthCursor.getMonth(), index + 1).toISOString().slice(0, 10)
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
          () =>
            (existingEntries || []).filter(
              (entry) => !entry.deletedAt && entry.date === date
            ),
          [existingEntries, date]
        );
        const hasConflict = conflicts.length > 0;

        useEffect(() => {
          setOverrideConflict(false);
        }, [date]);

        useEffect(() => {
          setActiveCaptionTab((prevTab) => (prevTab === "Main" || platforms.includes(prevTab) ? prevTab : "Main"));
          setPlatformCaptions((prev) => {
            const updated = { ...prev };
            Object.keys(updated).forEach((key) => {
              if (!platforms.includes(key)) delete updated[key];
            });
            return updated;
          });
          setActivePreviewPlatform((prev) => (prev === "Main" || platforms.includes(prev) ? prev : platforms[0] || "Main"));
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
            author: author || undefined,
            platforms: ensureArray(allPlatforms ? [...ALL_PLATFORMS] : platforms),
            caption,
            url: url || undefined,
            previewUrl: previewUrl || undefined,
            assetType,
            script: assetType === "Video" ? script : undefined,
            designCopy: assetType === "Design" ? designCopy : undefined,
            carouselSlides: assetType === "Carousel" ? carouselSlides : undefined,
            firstComment,
            platformCaptions: cleanedCaptions,
            workflowStatus,
            campaign: campaign || undefined,
            contentPillar: contentPillar || undefined,
            testingFrameworkId: testingFrameworkId || undefined,
            testingFrameworkName: selectedFramework ? selectedFramework.name : undefined,
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
        const currentCaptionValue = activeCaptionTab === "Main"
          ? caption
          : platformCaptions[activeCaptionTab] ?? caption;
        const previewPlatforms = platforms.length ? platforms : ["Main"];
        const effectivePreviewPlatform = previewPlatforms.includes(activePreviewPlatform)
          ? activePreviewPlatform
          : previewPlatforms[0] || "Main";
        const previewCaption = getPlatformCaption(caption, platformCaptions, effectivePreviewPlatform);
        const previewIsImage = isImageMedia(previewUrl);
        const previewIsVideo = previewUrl && /\.(mp4|webm|ogg)$/i.test(previewUrl);

        const handleCaptionChange = (value) => {
          if (activeCaptionTab === "Main") {
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
              ? prev.includes(platform) ? prev : [...prev, platform]
              : prev.filter((p) => p !== platform);
            setPlatformCaptions((prevCaptions) => {
              const updated = { ...prevCaptions };
              Object.keys(updated).forEach((key) => {
                if (!next.includes(key)) delete updated[key];
              });
              return updated;
            });
            setActiveCaptionTab((prevTab) =>
              prevTab === "Main" || next.includes(prevTab) ? prevTab : "Main"
            );
            setActivePreviewPlatform((prev) =>
              prev === "Main" || next.includes(prev) ? prev : next[0] || "Main"
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
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Date</Label>
                <select
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className={cx(selectBaseClasses, "w-full")}
                >
                  {dayOptions.map((iso) => (
                    <option key={iso} value={iso}>
                      {new Date(iso).toLocaleDateString(undefined, {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Workflow status</Label>
                <select
                  value={workflowStatus}
                  onChange={(event) => setWorkflowStatus(event.target.value)}
                  className={cx(selectBaseClasses, "w-full")}
                >
                  {KANBAN_STATUSES.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Testing framework</Label>
                <select
                  value={testingFrameworkId}
                  onChange={(event) => setTestingFrameworkId(event.target.value)}
                  className={cx(selectBaseClasses, "w-full")}
                >
                  <option value="">No testing framework</option>
                  {testingFrameworks.map((framework) => (
                    <option key={framework.id} value={framework.id}>
                      {framework.name}
                    </option>
                  ))}
                </select>
                {testingFrameworks.length === 0 ? (
                  <p className="text-xs text-graystone-500">Create frameworks in the Testing Lab to link experiments.</p>
                ) : (
                  <p className="text-xs text-graystone-500">Attach this brief to a testing plan for reporting.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Campaign</Label>
                <select
                  value={campaign}
                  onChange={(event) => setCampaign(event.target.value)}
                  className={cx(selectBaseClasses, "w-full")}
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
                  className={cx(selectBaseClasses, "w-full")}
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
                <ApproverMulti value={approvers} onChange={setApprovers} />
              </div>

              <div className="space-y-2">
                <Label>Platforms</Label>
                <div className="flex items-center gap-3">
                  <Toggle id="all-platforms" checked={allPlatforms} onChange={setAllPlatforms} ariaLabel="Select all platforms" />
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
                    Heads up: {conflicts.length} post{conflicts.length === 1 ? "" : "s"} already scheduled on this date.
                  </div>
                  <p className="mt-1 text-xs text-amber-700">You can continue, but consider spacing things out.</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={handleSubmitAnyway}>
                      Submit anyway
                    </Button>
                    <div className="flex items-center gap-2 text-xs text-amber-700">
                      <span>Try a different date:</span>
                  <select
                    value={date}
                    onChange={(event) => {
                      setOverrideConflict(false);
                      setDate(event.target.value);
                    }}
                    className={cx(selectBaseClasses, "px-3 py-1 text-xs")}
                  >
                        {dayOptions.map((iso) => (
                          <option key={iso} value={iso}>
                            {new Date(iso).toLocaleDateString(undefined, {
                              weekday: "short",
                              day: "2-digit",
                              month: "short",
                            })}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <select
                  id="author"
                  value={author}
                  onChange={(event) => setAuthor(event.target.value)}
                  className={cx(selectBaseClasses, "w-full")}
                >
                  <option value="">Select author</option>
                  <option value="Dan">Dan</option>
                  <option value="Fran">Fran</option>
                </select>
              </div>

              <div className="space-y-3">
                <Label>Captions</Label>
                <div className="flex flex-wrap gap-2">
                  {captionTabs.map((tab) => (
                    <Button
                      key={tab}
                      type="button"
                      size="sm"
                      variant={activeCaptionTab === tab ? "solid" : "outline"}
                      onClick={() => setActiveCaptionTab(tab)}
                    >
                      {tab === "Main" ? "Main caption" : tab}
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
                  {activeCaptionTab === "Main"
                    ? "Changes here apply to every platform unless you customise a specific tab."
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
                    if (activeGuidelines?.teamsWebhookUrl) {
                      try {
                        fetch(activeGuidelines.teamsWebhookUrl, {
                          method: 'POST',
                          headers: { 'content-type': 'application/json' },
                          body: JSON.stringify({ text: `Copy check applied (${platform}) by ${currentUser}` }),
                        });
                      } catch {}
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
                    }}
                    className={cx(fileInputClasses, "text-xs")}
                  />
                  {previewUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setPreviewUrl("")}>
                      Clear preview
                    </Button>
                  )}
                </div>
                {previewUploadError && (
                  <p className="text-xs text-red-600">{previewUploadError}</p>
                )}
                <p className="text-xs text-graystone-500">Supports inline image previews in the modal.</p>
              </div>

              <div className="space-y-2">
                <Label>Asset type</Label>
                <select
                  value={assetType}
                  onChange={(event) => setAssetType(event.target.value)}
                  className={cx(selectBaseClasses, "w-full")}
                >
                  <option value="Video">Video</option>
                  <option value="Design">Design</option>
                  <option value="Carousel">Carousel</option>
                </select>
              </div>

              {assetType === "Video" && (
                <div className="space-y-2">
                  <Label htmlFor="script">Script</Label>
                  <Textarea id="script" value={script} onChange={(event) => setScript(event.target.value)} rows={4} />
                </div>
              )}

              {assetType === "Design" && (
                <div className="space-y-2">
                  <Label htmlFor="designCopy">Design copy</Label>
                  <Textarea id="designCopy" value={designCopy} onChange={(event) => setDesignCopy(event.target.value)} rows={4} />
                </div>
              )}

              {assetType === "Carousel" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Number of slides</Label>
                <select
                  value={String(slidesCount)}
                  onChange={(event) => setSlidesCount(Number(event.target.value))}
                  className={cx(selectBaseClasses, "w-full")}
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
                              prev.map((slide, slideIndex) => (slideIndex === idx ? event.target.value : slide))
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
                  <p className="text-xs text-graystone-600">Use these prompts to tailor captions per channel.</p>
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

  function KanbanBoard({ statuses, entries, onOpen, onUpdateStatus }) {
    return (
      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-4">
          {statuses.map((status) => {
            const cards = entries.filter(
              (entry) => (entry.workflowStatus || statuses[0]) === status
            );
            return (
              <div key={status} className="w-72 shrink-0">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-ocean-700">{status}</div>
                  <Badge variant="secondary">{cards.length}</Badge>
                </div>
                <div className="space-y-3">
                  {cards.length === 0 ? (
                    <div className="rounded-xl border border-aqua-200 bg-aqua-50 px-3 py-4 text-xs text-graystone-500">
                      Nothing here yet.
                    </div>
                  ) : (
                    cards.map((entry) => (
                      <div
                        key={entry.id}
                        className="space-y-2 rounded-2xl border border-graystone-200 bg-white p-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline">{entry.assetType}</Badge>
                          {entry.analytics && Object.keys(entry.analytics).length ? (
                            <span className="rounded-full bg-ocean-500/10 px-2 py-0.5 text-[11px] font-semibold text-ocean-700">
                              Performance
                            </span>
                          ) : null}
                          <select
                            value={entry.workflowStatus || statuses[0]}
                            onChange={(event) => onUpdateStatus(entry.id, event.target.value)}
                            className={cx(selectBaseClasses, "w-32 px-3 py-1 text-xs")}
                          >
                            {statuses.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-graystone-800 line-clamp-2">
                            {entry.caption || entry.title || "Untitled"}
                          </div>
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
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-graystone-500">
                          <span>{new Date(entry.date).toLocaleDateString()}</span>
                          {entry.platforms && entry.platforms.length > 0 && (
                            <span>{entry.platforms.join(", ")}</span>
                          )}
                        </div>
                        {entry.firstComment && (
                          <div className="rounded-xl bg-aqua-50 px-2 py-1 text-[11px] text-ocean-700 line-clamp-2">
                            {entry.firstComment}
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpen(entry.id)}
                            className="text-xs"
                          >
                            Open
                          </Button>
                          <span className="text-[11px] uppercase tracking-wide text-graystone-400">
                            {entry.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function IdeaAttachment({ attachment }) {
    const isImage = typeof attachment.dataUrl === "string" && attachment.dataUrl.startsWith("data:image");
    return (
      <div className="flex items-center gap-3 rounded-xl border border-graystone-200 bg-white px-3 py-2 text-sm">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-graystone-200 bg-graystone-100">
          {isImage ? (
            <img src={attachment.dataUrl} alt={attachment.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-graystone-500">{attachment.type || "File"}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="font-medium text-graystone-700">{attachment.name}</div>
          {attachment.size ? (
            <div className="text-xs text-graystone-500">{Math.round(attachment.size / 1024)} KB</div>
          ) : null}
        </div>
        <a
          href={attachment.dataUrl}
          download={attachment.name || "attachment"}
          className="text-xs font-semibold text-ocean-600 hover:underline"
        >
          Download
        </a>
      </div>
    );
  }

  function IdeaForm({ onSubmit, currentUser }) {
    const [type, setType] = useState(IDEA_TYPES[0]);
    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState("");
    const [inspiration, setInspiration] = useState("");
    const [targetDate, setTargetDate] = useState("");
    const [targetMonth, setTargetMonth] = useState("");
    const [links, setLinks] = useState([""]);
    const [attachments, setAttachments] = useState([]);
    const [uploadError, setUploadError] = useState("");

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
              size: file.size,
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
      event.target.value = "";
    };

    const updateLink = (index, value) => {
      setLinks((prev) => prev.map((link, idx) => (idx === index ? value : link)));
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
      const monthValue = targetMonth
        ? targetMonth
        : targetDate
        ? targetDate.slice(0, 7)
        : "";

      const payload = {
        type,
        title: title.trim(),
        notes: notes.trim(),
        inspiration: inspiration.trim(),
        links: links.filter((link) => link && link.trim()),
        attachments,
        createdBy: currentUser || "Unknown",
        targetDate: targetDate || undefined,
        targetMonth: monthValue || undefined,
      };
      onSubmit(payload);
      reset();
    };

    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-ocean-900">Log a New Idea</CardTitle>
          <p className="text-sm text-graystone-500">Capture inspiration before it disappears.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Idea type</Label>
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className={cx(selectBaseClasses, "w-full")}
                >
                  {IDEA_TYPES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Logged by</Label>
                <Input value={currentUser || "Unknown"} readOnly className="bg-graystone-100" />
              </div>
              <div className="space-y-2">
                <Label>Target month</Label>
                <input
                  type="month"
                  value={targetMonth}
                  onChange={(event) => setTargetMonth(event.target.value)}
                  className={cx(selectBaseClasses, "w-full")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target date (optional)</Label>
              <Input
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
              />
              <p className="text-xs text-graystone-500">Set a specific day if you already know when you want this idea to land.</p>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Working title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="What is the angle or concept?"
              />
            </div>

            <div className="space-y-2">
              <Label>Resources / inspiration</Label>
              <Textarea
                value={inspiration}
                onChange={(event) => setInspiration(event.target.value)}
                rows={3}
                placeholder="Reference podcasts, creators, campaigns, or prompts"
              />
            </div>

            <div className="space-y-3">
              <Label>Links</Label>
              <div className="space-y-2">
                {links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={link}
                      onChange={(event) => updateLink(index, event.target.value)}
                      placeholder="https://..."
                    />
                    {links.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeLinkField(index)}>
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addLinkField}>
                Add another link
              </Button>
            </div>

            <div className="space-y-3">
              <Label>Attachments</Label>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className={cx(fileInputClasses, "text-xs")}
              />
              {uploadError && (
                <p className="text-xs text-red-600">{uploadError}</p>
              )}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-3">
                      <IdeaAttachment attachment={attachment} />
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(attachment.id)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" className="gap-2">
                <PlusIcon className="h-4 w-4 text-white" />
                Log idea
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

  function LinkedInSubmissionForm({ onSubmit, currentUser }) {
    const [submissionType, setSubmissionType] = useState(LINKEDIN_TYPES[0]);
    const initialOwner = DEFAULT_APPROVERS.includes(currentUser) ? currentUser : DEFAULT_APPROVERS[0];
    const [owner, setOwner] = useState(initialOwner);
    const [submitter, setSubmitter] = useState(
      DEFAULT_APPROVERS.includes(currentUser) ? currentUser : DEFAULT_APPROVERS[0]
    );
    const [postCopy, setPostCopy] = useState("");
    const [comments, setComments] = useState("");
    const [status, setStatus] = useState(LINKEDIN_STATUSES[0]);
    const [targetDate, setTargetDate] = useState("");
    const [links, setLinks] = useState([""]);
    const [attachments, setAttachments] = useState([]);
    const [uploadError, setUploadError] = useState("");
    const [title, setTitle] = useState("LinkedIn draft");

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
              size: file.size,
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
      event.target.value = "";
    };

    const updateLink = (index, value) => {
      setLinks((prev) => prev.map((link, idx) => (idx === index ? value : link)));
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
        title,
      };
      onSubmit(payload);
      reset();
    };

    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-ocean-900">LinkedIn submission</CardTitle>
          <p className="text-sm text-graystone-600">Share draft copy for personal accounts and route approvals.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Submission type</Label>
                <select
                  value={submissionType}
                  onChange={(event) => setSubmissionType(event.target.value)}
                  className={cx(selectBaseClasses, "w-full")}
                >
                  {LINKEDIN_TYPES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className={cx(selectBaseClasses, "w-full")}
                >
                  {LINKEDIN_STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Account owner</Label>
                <select
                  value={owner}
                  onChange={(event) => setOwner(event.target.value)}
                  className={cx(selectBaseClasses, "w-full")}
                >
                  {DEFAULT_APPROVERS.map((person) => (
                    <option key={person} value={person}>
                      {person}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Submitted by</Label>
                <select
                  value={submitter}
                  onChange={(event) => setSubmitter(event.target.value)}
                  className={cx(selectBaseClasses, "w-full")}
                >
                  {DEFAULT_APPROVERS.map((person) => (
                    <option key={person} value={person}>
                      {person}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Copy</Label>
              <Textarea
                value={postCopy}
                onChange={(event) => {
                  const value = event.target.value;
                  setPostCopy(value);
                  const derived = value.trim().split(/\n+/)[0].slice(0, 80);
                  if (derived) setTitle(derived);
                }}
                rows={6}
                placeholder="Your LinkedIn copy goes here"
              />
            </div>

            <div className="space-y-2">
              <Label>Comments</Label>
              <Textarea
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                rows={3}
                placeholder="Key points, hashtags, tagging instructions"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Target publish date</Label>
                <Input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Links to include</Label>
              <div className="space-y-2">
                {links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={link}
                      onChange={(event) => updateLink(index, event.target.value)}
                      placeholder="https://..."
                    />
                    {links.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeLinkField(index)}>
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addLinkField}>
                Add another link
              </Button>
            </div>

            <div className="space-y-3">
              <Label>Images / videos to include</Label>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className={cx(fileInputClasses, "text-xs")}
              />
              {uploadError && (
                <p className="text-xs text-red-600">{uploadError}</p>
              )}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-3">
                      <IdeaAttachment attachment={attachment} />
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(attachment.id)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" className="gap-2">
                <PlusIcon className="h-4 w-4" />
                Submit for review
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

  function LinkedInSubmissionList({ submissions, onStatusChange }) {
    const [filter, setFilter] = useState("All");

    const filtered = useMemo(() => {
      if (filter === "All") return submissions;
      return submissions.filter((item) => item.status === filter);
    }, [submissions, filter]);

    return (
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl text-ocean-900">LinkedIn queue</CardTitle>
              <p className="text-sm text-graystone-600">Review, approve, and share drafted LinkedIn posts.</p>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-graystone-500">Filter</Label>
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className={cx(selectBaseClasses, "px-4 py-2 text-sm")}
              >
                <option value="All">All statuses</option>
                {LINKEDIN_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-graystone-600">No submissions yet. Share a draft using the form.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((submission) => (
                <div key={submission.id} className="space-y-2 rounded-2xl border border-graystone-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{submission.submissionType}</Badge>
                      <span className="rounded-full bg-aqua-100 px-2 py-0.5 text-xs text-ocean-700">
                        {submission.owner || "Unknown owner"}
                      </span>
                      <span className="text-[11px] text-graystone-500">Submitted by {submission.submitter || "Unknown"}</span>
                    </div>
                  <select
                    value={submission.status}
                    onChange={(event) => onStatusChange(submission.id, event.target.value)}
                    className={cx(selectBaseClasses, "w-32 px-3 py-1 text-xs")}
                  >
                      {LINKEDIN_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-lg font-semibold text-ocean-900">{submission.title}</div>
                  <div className="whitespace-pre-wrap text-sm text-graystone-700">{submission.postCopy}</div>
                  {submission.comments && (
                    <div className="rounded-xl bg-aqua-50 px-3 py-2 text-xs text-ocean-700">
                      <span className="font-semibold">Comments:</span> {submission.comments}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-graystone-500">
                    {submission.targetDate ? (
                      <span>
                        Target date {new Date(submission.targetDate).toLocaleDateString()}
                      </span>
                    ) : null}
                    <span>Created {new Date(submission.createdAt).toLocaleString()}</span>
                  </div>
                  {submission.links && submission.links.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-semibold uppercase tracking-wide text-graystone-500">Links</div>
                      <ul className="space-y-1 text-sm text-ocean-600">
                        {submission.links.map((link, idx) => (
                          <li key={idx}>
                            <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {submission.attachments && submission.attachments.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-graystone-500">Attachments</div>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {submission.attachments.map((attachment) => (
                          <IdeaAttachment key={attachment.id} attachment={attachment} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function TestingFrameworkForm({ onSubmit }) {
    const [name, setName] = useState("");
    const [hypothesis, setHypothesis] = useState("");
    const [audience, setAudience] = useState("");
    const [metric, setMetric] = useState("");
    const [duration, setDuration] = useState("");
    const [notes, setNotes] = useState("");
    const [status, setStatus] = useState(TESTING_STATUSES[0]);

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
        status,
      });
      reset();
    };

    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-ocean-900">Testing Lab</CardTitle>
          <p className="text-sm text-graystone-600">Document hypotheses and guardrails for content experiments.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Framework name</Label>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Experiment title" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className={cx(selectBaseClasses, "w-full")}
                >
                  {TESTING_STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hypothesis</Label>
              <Textarea
                value={hypothesis}
                onChange={(event) => setHypothesis(event.target.value)}
                rows={3}
                placeholder="If we… then we expect…"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Audience / segment</Label>
                <Input value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="Target audience" />
              </div>
              <div className="space-y-2">
                <Label>Primary metric</Label>
                <Input value={metric} onChange={(event) => setMetric(event.target.value)} placeholder="Example: CTR, saves" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Test duration / cadence</Label>
              <Input value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="e.g. 2 weeks / 4 posts" />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Guardrails, next steps" />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" className="gap-2">
                <PlusIcon className="h-4 w-4" />
                Save framework
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

  function TestingFrameworkList({ frameworks, onDelete, onSelect, selectedId, entryCounts = {} }) {
    if (!frameworks.length) {
      return (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-ocean-900">Experiment backlog</CardTitle>
            <p className="text-sm text-graystone-600">Log experiments and link them to content briefs.</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-graystone-600">No frameworks yet. Create one to define your testing plan.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-ocean-900">Experiment backlog</CardTitle>
          <p className="text-sm text-graystone-600">Reference these when planning or reporting on tests.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {frameworks.map((framework) => (
              <div
                key={framework.id}
                role={onSelect ? "button" : undefined}
                tabIndex={onSelect ? 0 : undefined}
                onClick={() => onSelect && onSelect(framework.id)}
                onKeyDown={(event) => {
                  if (!onSelect) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(framework.id);
                  }
                }}
                className={cx(
                  "space-y-2 rounded-2xl border p-4 text-left shadow-sm transition",
                  selectedId === framework.id
                    ? "border-ocean-500 bg-aqua-50 ring-2 ring-ocean-500/20"
                    : "border-graystone-200 bg-white hover:border-aqua-300 hover:bg-aqua-50/50"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <div className="text-lg font-semibold text-ocean-900">{framework.name}</div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-graystone-500">
                      <span>{framework.status}</span>
                      <span>Created {new Date(framework.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedId === framework.id ? (
                      <span className="rounded-full bg-ocean-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                        Viewing hub
                      </span>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        const confirmed = window.confirm("Remove this framework?");
                        if (confirmed) onDelete(framework.id);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs text-graystone-600 md:grid-cols-3">
                  <span>
                    <span className="font-semibold text-graystone-700">Audience:</span>{" "}
                    {framework.audience || "—"}
                  </span>
                  <span>
                    <span className="font-semibold text-graystone-700">Metric:</span>{" "}
                    {framework.metric || "—"}
                  </span>
                  <span>
                    <span className="font-semibold text-graystone-700">Duration:</span>{" "}
                    {framework.duration || "—"}
                  </span>
                </div>
                {framework.hypothesis && (
                  <div className="rounded-xl bg-aqua-50 px-3 py-2 text-xs text-ocean-700">
                    <span className="font-semibold text-graystone-700">Hypothesis:</span>{" "}
                    {framework.hypothesis}
                  </div>
                )}
                {framework.notes && (
                  <div className="rounded-xl bg-graystone-100 px-3 py-2 text-xs text-graystone-700">
                    {framework.notes}
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px] text-graystone-500">
                  <span>
                    {entryCounts[framework.id]
                      ? `${entryCounts[framework.id]} linked ${
                          entryCounts[framework.id] === 1 ? "entry" : "entries"
                        }`
                      : "No linked content yet"}
                  </span>
                  {onSelect ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-ocean-600">
                      View hub →
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  function TestingFrameworkHub({ framework, entries = [], onOpenEntry }) {
    if (!framework) {
      return (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-ocean-900">Experiment hub</CardTitle>
            <p className="text-sm text-graystone-600">
              Select an experiment on the left to see linked content and progress.
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-graystone-600">
              Need a place to start? Create a framework and attach it to a brief from the Create Content form.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl text-ocean-900">{framework.name}</CardTitle>
              <p className="mt-1 text-sm text-graystone-600">
                {framework.hypothesis
                  ? framework.hypothesis
                  : "Linked briefs inherit this testing framework for reporting."}
              </p>
            </div>
            <span className="rounded-full bg-ocean-500/10 px-3 py-1 text-xs font-semibold text-ocean-700">
              {framework.status}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-graystone-500 md:grid-cols-3">
            <span>
              <span className="font-semibold text-graystone-700">Audience:</span>{" "}
              {framework.audience || "—"}
            </span>
            <span>
              <span className="font-semibold text-graystone-700">Metric:</span>{" "}
              {framework.metric || "—"}
            </span>
            <span>
              <span className="font-semibold text-graystone-700">Duration:</span>{" "}
              {framework.duration || "—"}
            </span>
          </div>
          <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-graystone-400">
            {entries.length} linked {entries.length === 1 ? "item" : "items"}
          </div>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-aqua-200 bg-aqua-50/40 px-4 py-6 text-center text-sm text-graystone-600">
              No content linked to this experiment yet. Attach a brief via Create Content to populate the hub.
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="space-y-2 rounded-2xl border border-graystone-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{entry.assetType}</Badge>
                        <span className="text-sm font-semibold text-graystone-800">
                          {new Date(entry.date).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="rounded-full bg-aqua-100 px-2 py-0.5 text-xs font-medium text-ocean-700">
                          {entry.statusDetail}
                        </span>
                        <span
                          className={cx(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            entry.status === "Approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          )}
                        >
                          {entry.status}
                        </span>
                      </div>
                      {entry.caption && (
                        <p className="text-sm text-graystone-700 line-clamp-3">{entry.caption}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1 text-xs text-graystone-500">
                        {entry.platforms.map((platform) => (
                          <span
                            key={platform}
                            className="inline-flex items-center gap-1 rounded-full bg-graystone-100 px-2 py-1"
                          >
                            <PlatformIcon platform={platform} />
                            {platform}
                          </span>
                        ))}
                      </div>
                      {(entry.campaign || entry.contentPillar) && (
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
                        </div>
                      )}
                    </div>
                    {onOpenEntry ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenEntry(entry.id)}
                        className="text-xs"
                      >
                        Open item
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function PerformanceImportModal({ open, onClose, onImport }) {
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState("");
    const [importing, setImporting] = useState(false);
    const [fileName, setFileName] = useState("");

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
      const toneClass =
        tone === "error"
          ? "border-rose-200 bg-rose-50"
          : tone === "warn"
          ? "border-amber-200 bg-amber-50"
          : "border-aqua-200 bg-aqua-50";
      return (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClass}`}>
          <div className="font-semibold text-graystone-700">{label}</div>
          <ul className="mt-2 space-y-1 text-xs text-graystone-600">
            {items.slice(0, 6).map((item, index) => (
              <li key={index}>
                Row {item.rowNumber}: {item.reason}
              </li>
            ))}
            {items.length > 6 ? (
              <li className="font-medium">…and {items.length - 6} more.</li>
            ) : null}
          </ul>
        </div>
      );
    };

    const matchedCount = summary?.matched || 0;
    const totalRows = summary?.totalRows || 0;
    const updatedEntryCount = summary?.updatedEntryCount || 0;

    return (
      <Modal open={open} onClose={onClose}>
        <div className="bg-white">
          <div className="border-b border-aqua-200 bg-ocean-500 px-6 py-4 text-white">
            <div className="text-lg font-semibold">Import performance</div>
            <p className="text-xs text-aqua-100">
              Upload a CSV export from your social platforms to attach results to calendar items.
            </p>
          </div>
          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-6">
            <div className="space-y-2 text-sm text-graystone-600">
              <div className="font-semibold text-graystone-700">How it works</div>
              <ul className="list-disc space-y-1 pl-5 text-xs">
                <li>
                  Include either an <code>entry_id</code> column or both <code>date</code> and{" "}
                  <code>platform</code> columns.
                </li>
                <li>
                  Metric columns (e.g. <code>impressions</code>, <code>clicks</code>, <code>engagement_rate</code>)
                  will be stored exactly as they appear.
                </li>
                <li>
                  Use one of the recognised platform names (Instagram, Facebook, LinkedIn, TikTok, YouTube, Threads,
                  Pinterest, X/Twitter).
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-dashed border-aqua-300 bg-aqua-50/50 px-4 py-5">
              <label className="flex cursor-pointer flex-col items-center gap-2 text-sm font-semibold text-ocean-700">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={importing}
                />
                <span className="heading-font inline-flex items-center gap-2 rounded-full border border-black bg-black px-5 py-2 text-sm font-semibold text-white shadow-[0_0_30px_rgba(15,157,222,0.35)] transition hover:bg-white hover:text-black">
                  {importing ? "Importing…" : "Choose CSV file"}
                </span>
                {fileName ? <span className="text-xs text-graystone-600">{fileName}</span> : null}
                <span className="text-xs font-normal text-graystone-500">
                  Columns detected: entry_id · date · platform · impressions · engagements · clicks …
                </span>
              </label>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {summary ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-aqua-200 bg-aqua-50 px-4 py-3">
                  <div className="text-sm font-semibold text-ocean-700">
                    Imported {matchedCount}/{totalRows} rows into {updatedEntryCount}{" "}
                    {updatedEntryCount === 1 ? "entry" : "entries"}.
                  </div>
                  {summary.updatedEntries && summary.updatedEntries.length ? (
                    <div className="mt-1 text-xs text-graystone-600">
                      Updated IDs: {summary.updatedEntries.join(", ")}
                    </div>
                  ) : null}
                </div>
                {renderIssues("Rows skipped", summary.missing, "warn")}
                {renderIssues("Rows needing attention", summary.ambiguous, "warn")}
                {renderIssues("Errors", summary.errors, "error")}
              </div>
            ) : null}
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-graystone-200 bg-graystone-50 px-6 py-4">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
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
                                month: "short",
                                day: "numeric",
                                weekday: "short",
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
                            <span>Requested by {entry.author || "Unknown"}</span>
                            {entry.approvers?.length ? (
                              <span>Approvers: {entry.approvers.join(", ")}</span>
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
                                    "inline-flex items-center gap-1 rounded-full px-2 py-1",
                                    value
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-graystone-100 text-graystone-500"
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
                          <Button
                            variant={entry.status === "Approved" ? "outline" : "solid"}
                            size="sm"
                            onClick={() => onApprove?.(entry.id)}
                            className="heading-font text-xs normal-case"
                          >
                            {entry.status === "Approved" ? "Mark pending" : "Approve"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl border border-dashed border-graystone-200 bg-white/80 px-6 py-16 text-center">
                <p className="heading-font text-lg font-semibold text-ocean-700">You&apos;re all caught up</p>
                <p className="mt-2 max-w-sm text-sm text-graystone-500">
                  Anything assigned to you will pop up here for a quick review. Check back once teammates submit
                  something new.
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    );
  }

  function GuidelinesModal({ open, guidelines, onClose, onSave }) {
    const buildDraft = (source) => ({
      bannedWordsText: (source?.bannedWords || []).join(", "),
      requiredPhrasesText: (source?.requiredPhrases || []).join(", "),
      languageGuide: source?.languageGuide || "",
      hashtagTips: source?.hashtagTips || "",
      charLimits: { ...(source?.charLimits || {}) },
      teamsWebhookUrl: source?.teamsWebhookUrl || "",
    });
    const [draft, setDraft] = React.useState(buildDraft(guidelines));

    React.useEffect(() => {
      setDraft(buildDraft(guidelines));
    }, [guidelines]);

    if (!open) return null;

    const splitList = (value) =>
      String(value || "")
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);

    const handleSave = () => {
      onSave?.({
        bannedWords: splitList(draft.bannedWordsText),
        requiredPhrases: splitList(draft.requiredPhrasesText),
        languageGuide: draft.languageGuide,
        hashtagTips: draft.hashtagTips,
        charLimits: { ...draft.charLimits },
        teamsWebhookUrl: String(draft.teamsWebhookUrl || ""),
      });
    };

    return (
      <Modal open={open} onClose={onClose}>
        <div className="bg-white">
          <div className="flex items-center justify-between border-b border-graystone-200 px-6 py-4">
            <div>
              <div className="heading-font text-lg text-black">Content standards</div>
              <p className="text-xs text-graystone-500">
                Store language guidance, banned words, and platform best practices in one place.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
          <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6 text-sm text-graystone-700">
            <div className="space-y-2">
              <Label>Banned words (comma or line separated)</Label>
              <textarea
                className="w-full rounded-2xl border border-graystone-200 px-3 py-2 text-sm shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-aqua-200"
                rows={3}
                value={draft.bannedWordsText}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, bannedWordsText: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Required phrases (comma or line separated)</Label>
              <textarea
                className="w-full rounded-2xl border border-graystone-200 px-3 py-2 text-sm shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-aqua-200"
                rows={3}
                value={draft.requiredPhrasesText}
                onChange={(event) => setDraft((prev) => ({ ...prev, requiredPhrasesText: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Language guide</Label>
              <textarea
                className="w-full rounded-2xl border border-graystone-200 px-3 py-2 text-sm shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-aqua-200"
                rows={4}
                value={draft.languageGuide}
                onChange={(event) => setDraft((prev) => ({ ...prev, languageGuide: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Hashtag recommendations</Label>
              <textarea
                className="w-full rounded-2xl border border-graystone-200 px-3 py-2 text-sm shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-aqua-200"
                rows={3}
                value={draft.hashtagTips}
                onChange={(event) => setDraft((prev) => ({ ...prev, hashtagTips: event.target.value }))}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Character limit best practices</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      charLimits: { ...DEFAULT_GUIDELINES.charLimits },
                    })
                  }
                >
                  Reset defaults
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs lg:grid-cols-3">
                {ALL_PLATFORMS.map((platform) => (
                  <label key={platform} className="flex flex-col gap-1 rounded-2xl border border-graystone-200 bg-white px-3 py-2 shadow-sm">
                    <span className="font-semibold text-graystone-600">{platform}</span>
                    <input
                      type="number"
                      min={1}
                      className="dropdown-font w-full rounded-full border border-black px-3 py-1 text-xs"
                      value={draft.charLimits?.[platform] ?? PLATFORM_DEFAULT_LIMITS[platform] ?? ""}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          charLimits: {
                            ...prev.charLimits,
                            [platform]: Number(event.target.value),
                          },
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Microsoft Teams webhook URL (optional)</Label>
              <input
                type="url"
                placeholder="https://outlook.office.com/webhook/..."
                className="dropdown-font w-full rounded-full border border-black px-4 py-2 text-sm"
                value={draft.teamsWebhookUrl}
                onChange={(e) => setDraft((prev) => ({ ...prev, teamsWebhookUrl: e.target.value }))}
              />
              <p className="text-xs text-graystone-500">If set, approvals/AI applies can post a brief activity summary to Teams.</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-graystone-200 bg-graystone-50 px-6 py-4">
            <p className="text-xs text-graystone-500">
              Changes are saved locally and can be referenced by your team anytime.
            </p>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save guidelines
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }


  function IdeasBoard({ ideas, onDelete }) {
    const [filter, setFilter] = useState("All");

    const filteredIdeas = useMemo(() => {
      if (filter === "All") return ideas;
      return ideas.filter((idea) => idea.type === filter);
    }, [ideas, filter]);

    return (
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl text-ocean-900">Ideas Library</CardTitle>
              <p className="text-sm text-graystone-500">A living backlog of topics, themes, and series ideas.</p>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-graystone-500">Filter</Label>
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className={cx(selectBaseClasses, "px-4 py-2 text-sm")}
              >
                <option value="All">All ideas</option>
                {IDEA_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredIdeas.length === 0 ? (
            <p className="text-sm text-graystone-500">No ideas logged yet. Capture your next spark on the left.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredIdeas.map((idea) => (
                <div key={idea.id} className="rounded-2xl border border-graystone-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{idea.type}</Badge>
                        <span className="rounded-full bg-aqua-50 px-2 py-1 text-xs text-ocean-600">
                          Logged {new Date(idea.createdAt).toLocaleString()}
                        </span>
                        {idea.createdBy ? (
                          <span className="text-xs text-graystone-500">by {idea.createdBy}</span>
                        ) : null}
                      </div>
                      <div className="text-lg font-semibold text-ocean-900">{idea.title}</div>
                      {idea.notes && <p className="text-sm text-graystone-700 whitespace-pre-wrap">{idea.notes}</p>}
                      {idea.inspiration && (
                        <div className="rounded-xl bg-aqua-50 p-3 text-xs text-ocean-700">
                          <span className="font-semibold">Inspiration:</span> {idea.inspiration}
                        </div>
                      )}
                      {idea.links && idea.links.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-semibold uppercase tracking-wide text-graystone-500">Links</div>
                          <ul className="space-y-1 text-sm text-ocean-600">
                            {idea.links.map((link, index) => (
                              <li key={index}>
                                <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                  {link}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {idea.attachments && idea.attachments.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold uppercase tracking-wide text-graystone-500">Attachments</div>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            {idea.attachments.map((attachment) => (
                              <IdeaAttachment key={attachment.id} attachment={attachment} />
                            ))}
                          </div>
                        </div>
                      )}
                      {(idea.targetMonth || idea.targetDate) && (
                        <div className="text-xs text-graystone-500">
                          {idea.targetMonth ? `Planned for ${idea.targetMonth}` : null}
                          {idea.targetDate ? ` • Aim for ${new Date(idea.targetDate).toLocaleDateString()}` : null}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const confirmDelete = window.confirm("Remove this idea from the log?");
                        if (confirmDelete) onDelete(idea.id);
                      }}
                    >
                      <TrashIcon className="h-4 w-4 text-graystone-500" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

      function MonthGrid({ days, month, year, entries, onApprove, onDelete, onOpen }) {
        const byDate = useMemo(() => {
          const map = new Map();
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

        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {days.map((day) => {
              const iso = new Date(year, month, day).toISOString().slice(0, 10);
              const dayEntries = byDate.get(iso) || [];
              const label = new Date(year, month, day).toLocaleDateString(undefined, {
                weekday: "short",
                day: "2-digit",
              });
              return (
                <Card key={iso} className="flex h-64 flex-col bg-white">
                  <CardHeader className="border-b border-graystone-200 py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-ocean-900">{label}</CardTitle>
                      <Badge variant={dayEntries.length ? "default" : "secondary"}>
                        {dayEntries.length} {dayEntries.length === 1 ? "item" : "items"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3 overflow-y-auto">
                    {dayEntries.length === 0 && (
                      <p className="text-sm text-graystone-500">No items planned.</p>
                    )}
                    {dayEntries.map((entry) => {
                      const checklist = ensureChecklist(entry.checklist);
                      const completed = Object.values(checklist).filter(Boolean).length;
                      const total = CHECKLIST_ITEMS.length;
                      const hasPreviewImage = isImageMedia(entry.previewUrl);
                      const hasPerformance = entry.analytics && Object.keys(entry.analytics).length > 0;
                      return (
                        <div
                          key={entry.id}
                          className="cursor-pointer rounded-xl border border-graystone-200 bg-white p-3 transition hover:border-aqua-400 hover:bg-aqua-50"
                          onClick={() => onOpen(entry.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-2">
                              {hasPreviewImage && (
                                <div className="overflow-hidden rounded-lg border border-graystone-200">
                                  <img
                                    src={entry.previewUrl}
                                    alt={`${entry.assetType} preview`}
                                    className="h-24 w-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">{entry.assetType}</Badge>
                                <span className="inline-flex items-center rounded-full bg-aqua-100 px-2 py-1 text-xs font-medium text-ocean-700">
                                  {entry.statusDetail || WORKFLOW_STAGES[0]}
                                </span>
                                {hasPerformance ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-ocean-500/10 px-2 py-0.5 text-xs font-medium text-ocean-700">
                                    Performance
                                  </span>
                                ) : null}
                                <div className="flex flex-wrap gap-1">
                                  {entry.platforms.map((platform) => (
                                    <span
                                      key={platform}
                                      className="inline-flex items-center gap-1 rounded-full bg-graystone-100 px-2 py-1 text-xs text-graystone-600"
                                    >
                                      <PlatformIcon platform={platform} />
                                      {platform}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {entry.caption && (
                                <p className="line-clamp-3 text-sm text-graystone-700">{entry.caption}</p>
                              )}
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
                              <div className="text-xs text-graystone-500">
                                Checklist {completed}/{total}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={cx(
                                  "rounded-full px-2 py-1 text-xs font-semibold",
                                  entry.status === "Approved" && "bg-emerald-100 text-emerald-700",
                                  entry.status === "Pending" && "bg-amber-100 text-amber-700"
                                )}
                              >
                                {entry.status}
                              </span>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onApprove(entry.id);
                                  }}
                                  title="Toggle approval"
                                >
                                  {entry.status === "Approved" ? (
                                    <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                                  ) : (
                                    <LoaderIcon className="h-5 w-5 text-amber-600" />
                                  )}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    const confirmDelete = window.confirm(
                                      "Move this item to the trash? You can restore it within 30 days."
                                    );
                                    if (confirmDelete) onDelete(entry.id);
                                  }}
                                  title="Move to trash"
                                >
                                  <TrashIcon className="h-5 w-5 text-graystone-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
      }

      function AssetMixPie({ counts, total }) {
        const palette = {
          Video: "#2563eb",
          Design: "#1d4ed8",
          Carousel: "#60a5fa",
        };
        const entries = ["Video", "Design", "Carousel"]
          .map((type) => ({ type, value: counts[type] || 0 }))
          .filter((item) => item.value > 0);
        if (!entries.length || !total) return null;
        let cumulative = 0;
        const segments = entries.map(({ type, value }) => {
          const start = (cumulative / total) * 100;
          cumulative += value;
          const end = (cumulative / total) * 100;
          const color = palette[type] || "#2563eb";
          return `${color} ${start}% ${end}%`;
        });
        const gradient = `conic-gradient(${segments.join(", ")})`;

        cumulative = 0;
        return (
          <div className="flex items-center gap-4">
            <div
              className="h-16 w-16 rounded-full border border-aqua-200"
              style={{ background: gradient }}
            />
            <div className="space-y-1 text-xs text-graystone-600">
              {entries.map(({ type, value }) => {
                const color = palette[type] || "#2563eb";
                const percentage = Math.round((value / total) * 100);
                return (
                  <div key={type} className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-medium text-graystone-700">{type}</span>
                    <span>
                      {value} ({percentage}% )
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

      function MiniCalendar({ monthCursor, entries, onOpenEntry }) {
        const year = monthCursor.getFullYear();
        const month = monthCursor.getMonth();
        const totalDays = daysInMonth(year, month);
        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalCells = Math.ceil((firstDayIndex + totalDays) / 7) * 7;

        const entriesByDate = useMemo(() => {
          const map = new Map();
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
              entries: dayEntries,
            });
          }
          return items;
        }, [entriesByDate, firstDayIndex, month, totalCells, totalDays, year]);

        return (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-base text-ocean-900">Month at a glance</CardTitle>
              <p className="text-xs text-graystone-500">
                Tap a turquoise dot to open that post.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase text-graystone-400">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2 text-xs">
                {cells.map((cell) => {
                  if (!cell.inMonth) {
                    return <div key={cell.key} className="min-h-[56px] rounded-xl border border-transparent bg-transparent" />;
                  }
                  const hasEntries = cell.entries.length > 0;
                  return (
                    <div
                      key={cell.key}
                      className={cx(
                        "min-h-[64px] rounded-xl border px-2 py-2",
                        hasEntries
                          ? "border-[#00F5FF]/60 bg-[#E8FBFF]"
                          : "border-graystone-200 bg-white"
                      )}
                    >
                      <div className="text-[11px] font-semibold text-graystone-700">{cell.label}</div>
                      {hasEntries ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {cell.entries.map((entry) => (
                            <button
                              key={entry.id}
                              type="button"
                              onClick={() => onOpenEntry(entry.id)}
                              className="h-3 w-3 rounded-full bg-[#00F5FF] text-transparent transition hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]"
                              title={`${entry.assetType} • ${entry.platforms?.join(", ") || ""}`}
                              aria-label={`Open ${entry.assetType} scheduled on ${new Date(entry.date).toLocaleDateString()}`}
                            >
                              •
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 text-[10px] text-graystone-300">—</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      }

      function AssetRatioCard({ summary, monthLabel, pendingAssetType, goals, onGoalsChange }) {
        const baseCounts = summary?.counts || {};
        const total = summary?.total || 0;
        const counts = useMemo(() => {
          if (pendingAssetType) {
            return {
              ...baseCounts,
              [pendingAssetType]: (baseCounts[pendingAssetType] || 0) + 1,
            };
          }
          return baseCounts;
        }, [baseCounts, pendingAssetType]);
        const adjustedTotal = total + (pendingAssetType ? 1 : 0);
        const types = ["Video", "Design", "Carousel"];

        const goalTotal = Object.values(goals || {}).reduce((acc, value) => acc + Number(value || 0), 0) || 100;
        const normalizedGoals = types.reduce((acc, type) => {
          const raw = Number(goals?.[type] || 0);
          acc[type] = goalTotal ? Math.round((raw / goalTotal) * 100) : 0;
          return acc;
        }, {});

        const handleGoalChange = (type, value) => {
          const next = Math.max(0, Math.min(100, Number(value) || 0));
          onGoalsChange?.({
            ...goals,
            [type]: next,
          });
        };

        return (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-base text-ocean-900">Asset ratio</CardTitle>
              <p className="text-xs text-graystone-500">{monthLabel}</p>
            </CardHeader>
            <CardContent>
              {adjustedTotal === 0 ? (
                <p className="text-sm text-graystone-500">No assets scheduled for this month yet.</p>
              ) : (
                <>
                  <div className="mb-4 flex justify-center">
                    <AssetMixPie counts={counts} total={adjustedTotal} />
                  </div>
                  <div className="space-y-2 text-xs">
                    {types.map((type) => {
                      const value = counts[type] || 0;
                      const percent = value === 0 ? 0 : Math.round((value / adjustedTotal) * 100);
                      const goalPercent = normalizedGoals[type] || 0;
                      return (
                        <div key={type} className="flex items-center justify-between gap-3">
                          <div>
                            <span className="font-medium text-graystone-700">{type}</span>
                            <span className="ml-1 text-graystone-400">| goal {goalPercent}%</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-graystone-600">
                              {percent}% ({value})
                            </div>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={goals?.[type] ?? 0}
                              onChange={(event) => handleGoalChange(type, event.target.value)}
                              className="dropdown-font w-16 rounded-full border border-black px-3 py-1 text-xs"
                              aria-label={`Goal percentage for ${type}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {pendingAssetType ? (
                <p className="mt-4 text-[11px] text-graystone-500">
                  Includes current draft tagged as <span className="font-semibold">{pendingAssetType}</span>.
                </p>
              ) : null}
            </CardContent>
          </Card>
        );
      }

      function SocialPreview({ platform, caption, mediaUrl, isImage, isVideo }) {
        const meta = PLATFORM_PREVIEW_META[platform] || PLATFORM_PREVIEW_META.Instagram;
        const accent = meta.accent || "#2563eb";
        const avatarStyle = {
          backgroundColor: `${accent}1f`,
        };
        const platformLabel = platform === "Main" ? "All platforms" : platform;
        const prettyCaption = caption && caption.trim().length ? caption : "Your caption will appear here.";

        const renderMedia = () => {
          if (!mediaUrl) return null;
          if (isVideo) return <video src={mediaUrl} controls className="w-full" />;
          if (isImage) return <img src={mediaUrl} alt={platform} className="w-full object-cover" />;
          return null;
        };

        const renderInteractions = () => (
          <div className="flex items-center gap-6 px-4 py-2 text-xs text-graystone-500">
            <span style={{ color: accent }}>👍 128</span>
            <span>💬 12</span>
            <span>↗️ Share</span>
          </div>
        );

        const renderBody = () => {
          switch (platform) {
            case "LinkedIn":
              return (
                <div className="space-y-2">
                  <div className="px-4 text-sm text-graystone-800 whitespace-pre-wrap">{prettyCaption}</div>
                  {mediaUrl ? renderMedia() : <div className="px-4 pb-3 text-xs text-graystone-500">Add an asset to complete the preview.</div>}
                  {renderInteractions()}
                </div>
              );
            case "X/Twitter":
              return (
                <div className="space-y-2 px-4 py-3 text-sm text-graystone-800">
                  <div className="whitespace-pre-wrap">{prettyCaption}</div>
                  {mediaUrl ? renderMedia() : null}
                  <div className="flex items-center gap-6 pt-1 text-xs text-graystone-500">
                    <span>💬 21</span>
                    <span>🔁 34</span>
                    <span>❤️ 210</span>
                    <span>↗️</span>
                  </div>
                </div>
              );
            case "Instagram":
              return (
                <div className="space-y-0">
                  {mediaUrl ? renderMedia() : <div className="px-4 pb-3 text-xs text-graystone-500">Add an image or reel to complete the preview.</div>}
                  <div className="px-4 py-3 text-sm text-graystone-800 whitespace-pre-wrap">{prettyCaption}</div>
                  <div className="flex items-center gap-4 px-4 pb-3 text-xs text-graystone-500">
                    <span>❤ 4,532</span>
                    <span>💬 98</span>
                    <span>✉️ Share</span>
                  </div>
                </div>
              );
            default:
              return (
                <div className="space-y-2">
                  {mediaUrl ? renderMedia() : <div className="px-4 pb-3 text-xs text-graystone-500">Add an asset to complete the preview.</div>}
                  <div className="px-4 py-3 text-sm text-graystone-800 whitespace-pre-wrap">{prettyCaption}</div>
                </div>
              );
          }
        };

        return (
          <div className="max-w-sm overflow-hidden rounded-2xl border border-graystone-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-9 w-9 rounded-full" style={avatarStyle} />
              <div className="flex-1">
                <div className="text-sm font-semibold text-ocean-900">{meta.name}</div>
                <div className="text-xs text-graystone-500">{meta.handle}</div>
              </div>
              <span className="text-xs font-semibold text-graystone-400">{platformLabel}</span>
            </div>
            {renderBody()}
          </div>
        );
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
        testingFrameworks = [],
      }) {
        const sanitizedEntry = useMemo(() => sanitizeEntry(entry), [entry]);
        const [draft, setDraft] = useState(sanitizedEntry);
        const [allPlatforms, setAllPlatforms] = useState(
          sanitizedEntry ? sanitizedEntry.platforms.length === ALL_PLATFORMS.length : false
        );
        const [commentDraft, setCommentDraft] = useState("");
        const [previewUploadError, setPreviewUploadError] = useState("");
        const [activeCaptionTab, setActiveCaptionTab] = useState("Main");
        const [activePreviewPlatform, setActivePreviewPlatform] = useState("Main");
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
          setActiveCaptionTab((prevTab) =>
            prevTab === "Main" || draftPlatforms.includes(prevTab) ? prevTab : "Main"
          );
          setActivePreviewPlatform((prevPlatform) =>
            draftPlatforms.includes(prevPlatform) ? prevPlatform : draftPlatforms[0] || "Main"
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
            previewUrl: raw.previewUrl || "",
            platformCaptions: ensurePlatformCaptions(raw.platformCaptions),
            platforms: ensureArray(Array.isArray(raw.platforms) ? raw.platforms : []),
            analytics: ensureAnalytics(raw.analytics),
            analyticsUpdatedAt:
              typeof raw.analyticsUpdatedAt === "string"
                ? raw.analyticsUpdatedAt
                : draft && typeof draft.analyticsUpdatedAt === "string"
                ? draft.analyticsUpdatedAt
                : "",
            workflowStatus: KANBAN_STATUSES.includes(raw.workflowStatus)
              ? raw.workflowStatus
              : KANBAN_STATUSES.includes(draft.workflowStatus)
              ? draft.workflowStatus
              : KANBAN_STATUSES[0],
          };
          const frameworkId = normalized.testingFrameworkId ? String(normalized.testingFrameworkId) : "";
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
          if (next.status === "Approved") {
            next = normalizeEntry({ ...next, status: "Pending", approvedAt: undefined });
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
            if (nextType !== "Video") next.script = undefined;
            if (nextType !== "Design") next.designCopy = undefined;
            if (nextType !== "Carousel") {
              next.carouselSlides = undefined;
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
                ...(draft.approvers || []),
                draft.author,
              ]
                .filter(Boolean)
                .map((name) => String(name).trim())
                .filter(Boolean)
            )
          );

          const rawMentions = extractMentions(body);
          let finalBody = body;
          const resolvedHandles = new Set();
          const mentionNames = new Set();

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
            createdAt: new Date().toISOString(),
            mentions: Array.from(resolvedHandles),
          };
          const next = normalizeEntry({
            ...draft,
            comments: [...(draft.comments || []), comment],
          });
          setDraft(next);
          setCommentDraft("");
          if (onUpdate) onUpdate(next);
          if (onNotifyMentions && mentionNames.size) {
            onNotifyMentions({
              entry: next,
              comment,
              mentionNames: Array.from(mentionNames),
            });
          }
        };

        const highlightMentions = (text) => {
          if (!text) return [text];
          return text.split(/(@[\w\s.&'-]+)/g).map((part, index) => {
            if (!part) return null;
            if (part.startsWith("@")) {
              return (
                <span key={index} className="font-semibold text-ocean-600">
                  {part}
                </span>
              );
            }
            return <span key={index}>{part}</span>;
          });
        };

        const previewUrl = draft.previewUrl ? draft.previewUrl.trim() : "";
        const previewIsImage = isImageMedia(previewUrl);
        const previewIsVideo = previewUrl && /\.(mp4|webm|ogg)$/i.test(previewUrl);
        const previewPlatforms = draftPlatforms.length ? draftPlatforms : ["Main"];
        const effectivePreviewPlatform = previewPlatforms.includes(activePreviewPlatform)
          ? activePreviewPlatform
          : previewPlatforms[0] || "Main";
        const previewCaption = getPlatformCaption(draft.caption, draft.platformCaptions, effectivePreviewPlatform);
        const currentFramework = draft?.testingFrameworkId ? frameworkMap.get(draft.testingFrameworkId) : null;
        const analyticsByPlatform = ensureAnalytics(draft.analytics);
        const analyticsPlatforms = Object.keys(analyticsByPlatform);
        const formatMetricValue = (value) => {
          if (typeof value === "number") return value.toLocaleString();
          if (value === null || value === undefined) return "—";
          return String(value);
        };

        const checklistCompleted = Object.values(ensureChecklist(draft.checklist)).filter(Boolean).length;
        const checklistTotal = CHECKLIST_ITEMS.length;

        return (
          <Modal open={modalReady} onClose={onClose}>
            <div className="bg-white">
              <div className="flex items-center justify-between border-b border-aqua-200 bg-ocean-500 px-6 py-4 text-white">
                <div>
                  <div className="text-lg font-semibold">Edit content</div>
                  <div className="text-xs text-aqua-100">
                    Created {new Date(draft.createdAt).toLocaleString()}
                  </div>
                </div>
                <span
                  className={cx(
                    "rounded-full px-3 py-1 text-xs font-semibold text-ocean-900",
                    draft.status === "Approved" ? "bg-aqua-100" : "bg-amber-100"
                  )}
                >
                  {draft.status}
                </span>
              </div>

              <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6">
                <FieldRow label="Date">
                  <Input type="date" value={draft.date} onChange={(event) => update("date", event.target.value)} />
                </FieldRow>

                <FieldRow label="Workflow status">
                  <select
                    value={draft.workflowStatus || KANBAN_STATUSES[0]}
                    onChange={(event) => update("workflowStatus", event.target.value)}
                    className={cx(selectBaseClasses, "w-full")}
                  >
                    {KANBAN_STATUSES.map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {statusOption}
                      </option>
                    ))}
                  </select>
                </FieldRow>

                <FieldRow label="Approvers">
                  <ApproverMulti value={draft.approvers || []} onChange={(value) => update("approvers", value)} />
                </FieldRow>

                <FieldRow label="Campaign">
                  <select
                    value={draft.campaign || ""}
                    onChange={(event) => update("campaign", event.target.value || "")}
                    className={cx(selectBaseClasses, "w-full")}
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
                    value={draft.contentPillar || ""}
                    onChange={(event) => update("contentPillar", event.target.value || "")}
                    className={cx(selectBaseClasses, "w-full")}
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
                      value={draft.testingFrameworkId || ""}
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
                      className={cx(selectBaseClasses, "w-full")}
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
                        {currentFramework.status ? ` (${currentFramework.status})` : ""}.
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
                            update("platforms", [...ALL_PLATFORMS]);
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
                                  nextPlatforms = draftPlatforms.filter((item) => item !== platform);
                                }
                                update("platforms", nextPlatforms);
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
                  <select
                    value={draft.author || ""}
                    onChange={(event) => update("author", event.target.value || undefined)}
                    className={cx(selectBaseClasses, "w-full")}
                  >
                    <option value="">Select author</option>
                    <option value="Dan">Dan</option>
                    <option value="Fran">Fran</option>
                  </select>
                </FieldRow>

                <FieldRow label="Caption">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {["Main", ...draftPlatforms].map((tab) => (
                        <Button
                          key={tab}
                          type="button"
                          size="sm"
                          variant={activeCaptionTab === tab ? "solid" : "outline"}
                          onClick={() => setActiveCaptionTab(tab)}
                        >
                          {tab === "Main" ? "Main" : tab}
                        </Button>
                      ))}
                    </div>
                    <Textarea
                      value={activeCaptionTab === "Main" ? draft.caption : draft.platformCaptions?.[activeCaptionTab] ?? draft.caption}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (activeCaptionTab === "Main") {
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
                      {activeCaptionTab === "Main"
                        ? "Updates here flow to every platform unless a custom version is set."
                        : `${activeCaptionTab} caption overrides the main copy for that platform.`}
                    </p>
                  </div>
                </FieldRow>

                <FieldRow label="URL">
                  <Input
                    type="url"
                    value={draft.url || ""}
                    onChange={(event) => update("url", event.target.value || undefined)}
                  />
                </FieldRow>

                <FieldRow label="Preview">
                  <div className="space-y-4">
                    <Input
                      type="url"
                      value={draft.previewUrl || ""}
                      onChange={(event) => update("previewUrl", event.target.value)}
                      placeholder="https://cdn.example.com/assets/post.png"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className={cx(fileInputClasses, "text-xs")}
                      />
                      {draft.previewUrl && (
                        <Button variant="ghost" size="sm" onClick={handleClearPreview}>
                          Clear preview
                        </Button>
                      )}
                    </div>
                    {previewUploadError && (
                      <p className="text-xs text-red-600">{previewUploadError}</p>
                    )}
                    <div className="space-y-2">
                      {previewPlatforms.length > 1 && (
                        <div className="flex flex-wrap gap-2">
                          {previewPlatforms.map((platform) => (
                            <Button
                              key={platform}
                              type="button"
                              size="sm"
                              variant={activePreviewPlatform === platform ? "solid" : "outline"}
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
                      <p className="text-xs text-graystone-500">Preview simulates the selected platform using the current caption and asset.</p>
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
                              <p className="mt-2 text-xs text-graystone-500">No metrics captured yet.</p>
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
                    className={cx(selectBaseClasses, "w-full")}
                  >
                    <option value="Video">Video</option>
                    <option value="Design">Design</option>
                    <option value="Carousel">Carousel</option>
                  </select>
                </FieldRow>

                {draft.assetType === "Video" && (
                  <FieldRow label="Script">
                    <Textarea
                      value={draft.script || ""}
                      onChange={(event) => update("script", event.target.value)}
                      rows={4}
                    />
                  </FieldRow>
                )}

                {draft.assetType === "Design" && (
                  <FieldRow label="Design copy">
                    <Textarea
                      value={draft.designCopy || ""}
                      onChange={(event) => update("designCopy", event.target.value)}
                      rows={4}
                    />
                  </FieldRow>
                )}

                {draft.assetType === "Carousel" && (
                  <div className="space-y-4">
                    <FieldRow label="Slides">
                      <select
                        value={String(draft.carouselSlides?.length || 0)}
                        onChange={(event) => handleCarouselSlides(Number(event.target.value))}
                        className={cx(selectBaseClasses, "w-full")}
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
                                  slideIndex === idx ? value : slide
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
                    value={draft.firstComment || ""}
                    onChange={(event) => update("firstComment", event.target.value)}
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

                <div className="space-y-3">
                  <div className="text-sm font-medium text-graystone-800">Comments</div>
                  {draft.comments && draft.comments.length > 0 ? (
                    <div className="space-y-3">
                      {draft.comments
                        .slice()
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map((comment) => (
                          <div key={comment.id} className="rounded-xl border border-aqua-200 bg-aqua-50 p-3 text-sm text-graystone-800">
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
                      onChange={(event) => setCommentDraft(event.target.value)}
                      rows={3}
                      placeholder="Share feedback or mention someone with @"
                    />
                    <div className="flex items-center justify-end">
                      <Button type="submit" disabled={!commentDraft.trim()}>
                        Add comment
                      </Button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-aqua-200 bg-aqua-50 px-6 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => onApprove(draft.id)}
                    className="gap-2"
                  >
                    {draft.status === "Approved" ? "Mark as pending" : "Mark as approved"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                  >
                    <TrashIcon className="h-4 w-4 text-white" />
                    Move to trash
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    Save changes
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        );
      }

      function ContentDashboard() {
        const [entries, setEntries] = useState([]);
        const [monthCursor, setMonthCursor] = useState(() => new Date());
        const [viewingId, setViewingId] = useState(null);
        const [viewingSnapshot, setViewingSnapshot] = useState(null);
        const [notifications, setNotifications] = useState(() => loadNotifications());
        const [ideas, setIdeas] = useState(() => loadIdeas());
        const [linkedinSubmissions, setLinkedinSubmissions] = useState(() => loadLinkedInSubmissions());
        const [testingFrameworks, setTestingFrameworks] = useState(() => loadTestingFrameworks());
        const [selectedFrameworkId, setSelectedFrameworkId] = useState("");
        const [currentUser, setCurrentUser] = useState(() =>
          storageAvailable ? window.localStorage.getItem(USER_STORAGE_KEY) : null
        );
        const [userSelection, setUserSelection] = useState(() =>
          storageAvailable ? window.localStorage.getItem(USER_STORAGE_KEY) || "" : ""
        );
        const [currentView, setCurrentView] = useState(() => {
          if (storageAvailable) {
            return window.localStorage.getItem(USER_STORAGE_KEY) ? "menu" : "login";
          }
          return "login";
        });
        const [planTab, setPlanTab] = useState("plan");
        const [filterType, setFilterType] = useState("All");
        const [filterStatus, setFilterStatus] = useState("All");
        const [filterPlatforms, setFilterPlatforms] = useState([]);
        const [performanceImportOpen, setPerformanceImportOpen] = useState(false);
        const [approvalsModalOpen, setApprovalsModalOpen] = useState(false);
        const [menuMotionActive, setMenuMotionActive] = useState(false);
        const [pendingAssetType, setPendingAssetType] = useState(null);
        const [assetGoals, setAssetGoals] = useState(() => ({
          Video: 40,
          Design: 40,
          Carousel: 20,
        }));
        const [guidelines, setGuidelines] = useState(() => loadGuidelines());
        const [guidelinesOpen, setGuidelinesOpen] = useState(false);

        useEffect(() => {
          setEntries(loadEntries());
          setIdeas(loadIdeas());
          setLinkedinSubmissions(loadLinkedInSubmissions());
          setTestingFrameworks(loadTestingFrameworks());
        }, []);

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
                  item.entryId && item.user && item.type && item.message && !existing.has(item.key)
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
                : item
            )
          );
        };

        const buildApprovalNotifications = (entry, names) => {
          const approvers = names ? names : ensurePeopleArray(entry.approvers);
          if (!approvers.length) return [];
          const descriptor = entry.caption && entry.caption.trim().length
            ? entry.caption.trim()
            : `${entry.assetType} on ${new Date(entry.date).toLocaleDateString()}`;
          const timestamp = new Date().toISOString();
          return approvers.map((user) => ({
            entryId: entry.id,
            user,
            type: "approval-assigned",
            message: `${descriptor} is awaiting your approval.`,
            createdAt: timestamp,
            meta: { source: "approval" },
            key: notificationKey("approval-assigned", entry.id, user),
          }));
        };

        const buildMentionNotifications = (entry, comment, mentionNames) => {
          if (!mentionNames || !mentionNames.length) return [];
          const descriptor = entry.caption && entry.caption.trim().length
            ? entry.caption.trim()
            : `${entry.assetType} on ${new Date(entry.date).toLocaleDateString()}`;
          const author = comment.author || "A teammate";
          const timestamp = comment.createdAt || new Date().toISOString();
          return mentionNames
            .filter((user) => user && user.trim() && user.trim() !== (comment.author || "").trim())
            .map((user) => ({
              entryId: entry.id,
              user,
              type: "mention",
              message: `${author} mentioned you on "${descriptor}".`,
              createdAt: timestamp,
              meta: { commentId: comment.id },
              key: notificationKey("mention", entry.id, user, { commentId: comment.id }),
            }));
        };

        const handleMentionNotifications = ({ entry, comment, mentionNames }) => {
          if (!entry || !comment) return;
          const payload = buildMentionNotifications(entry, comment, mentionNames);
          if (payload.length) addNotifications(payload);
        };

        const addIdea = (idea) => {
          const timestamp = new Date().toISOString();
          const sanitized = sanitizeIdea({
            ...idea,
            createdBy: idea.createdBy || currentUser || "Unknown",
            createdAt: timestamp,
          });
          setIdeas((prev) => [sanitized, ...prev]);
        };

        const deleteIdea = (id) => {
          setIdeas((prev) => prev.filter((idea) => idea.id !== id));
        };

        const addLinkedInSubmission = (payload) => {
          const timestamp = new Date().toISOString();
          const sanitized = sanitizeLinkedInSubmission({
            ...payload,
            createdAt: timestamp,
            submitter: payload.submitter || currentUser || "Unknown",
          });
          setLinkedinSubmissions((prev) => [sanitized, ...prev]);
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
                : item
            )
          );
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
        };

        const deleteTestingFramework = (id) => {
          setTestingFrameworks((prev) => prev.filter((item) => item.id !== id));
          if (!id) return;
          if (selectedFrameworkId === id) {
            setSelectedFrameworkId("");
          }
          setEntries((prev) =>
            prev.map((entry) => {
              if (entry.testingFrameworkId !== id) return entry;
              const sanitized = sanitizeEntry({
                ...entry,
                testingFrameworkId: "",
                testingFrameworkName: "",
              });
              return {
                ...sanitized,
                statusDetail: computeStatusDetail(sanitized),
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
            errors: [],
          };
          setEntries((prev) => {
            const { nextEntries, summary: computed } = mergePerformanceData(prev, dataset);
            summary = computed;
            return nextEntries;
          });
          return summary;
        };

        const monthLabel = monthCursor.toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        });

        const days = useMemo(
          () =>
            Array.from(
              { length: daysInMonth(monthCursor.getFullYear(), monthCursor.getMonth()) },
              (_, index) => index + 1
            ),
          [monthCursor]
        );

        const startISO = monthStartISO(monthCursor);
        const endISO = monthEndISO(monthCursor);

        const monthEntries = useMemo(() => {
          return entries
            .filter((entry) => !entry.deletedAt && entry.date >= startISO && entry.date <= endISO)
            .filter((entry) => (filterType === "All" ? true : entry.assetType === filterType))
            .filter((entry) => (filterStatus === "All" ? true : entry.status === filterStatus))
            .filter((entry) => (filterPlatforms.length === 0 ? true : filterPlatforms.some((platform) => entry.platforms.includes(platform))))
            .sort((a, b) => a.date.localeCompare(b.date));
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
          const groups = new Map();
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
          return items
            .slice()
            .sort((a, b) => (a.targetDate || "").localeCompare(b.targetDate || ""));
        }, [ideasByMonth, monthCursor]);

        const kanbanEntries = useMemo(
          () => entries.filter((entry) => !entry.deletedAt),
          [entries]
        );
        const entriesByFramework = useMemo(() => {
          const map = new Map();
          entries.forEach((entry) => {
            if (entry.deletedAt) return;
            const key = entry.testingFrameworkId ? String(entry.testingFrameworkId) : "";
            if (!key) return;
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(entry);
          });
          const result = {};
          map.forEach((list, key) => {
            result[key] = list
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date));
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
              .sort((a, b) => (b.deletedAt || "").localeCompare(a.deletedAt || "")),
          [entries]
        );

        const outstandingApprovals = useMemo(() => {
          if (!currentUser) return [];
          return entries
            .filter(
              (entry) =>
                !entry.deletedAt &&
                entry.status === "Pending" &&
                Array.isArray(entry.approvers) &&
                entry.approvers.includes(currentUser)
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
            .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        }, [notifications, currentUser]);

        const featureTiles = [
          {
            id: "create",
            title: "Create Content",
            description:
              "Capture briefs, assign approvers, and log the assets your team needs to produce next.",
            cta: "Open form",
            onClick: () => {
              setCurrentView("form");
              setPlanTab("plan");
              closeEntry();
            },
          },
          {
            id: "calendar",
            title: "Calendar",
            description:
              "Review what is booked each day, approve content, and tidy up anything sitting in trash.",
            cta: "View calendar",
            onClick: () => {
              setCurrentView("plan");
              setPlanTab("plan");
              closeEntry();
            },
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
            },
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
            },
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
            },
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
            },
          },
          {
            id: "ideas",
            title: "Ideas Log",
            description: "Capture topics, themes, and series concepts—complete with notes, links, and assets.",
            cta: "View ideas",
            onClick: () => {
              setCurrentView("plan");
              setPlanTab("ideas");
              closeEntry();
            },
          },
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
          const timestamp = new Date().toISOString();
          let createdEntry = null;
          setEntries((prev) => {
            const rawEntry = {
              id: uuid(),
              status: "Pending",
              createdAt: timestamp,
              updatedAt: timestamp,
              checklist: data.checklist,
              comments: data.comments || [],
              workflowStatus: data.workflowStatus && KANBAN_STATUSES.includes(data.workflowStatus)
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
            addNotifications(buildApprovalNotifications(createdEntry));
          }
        };

        const upsert = (updated) => {
          const timestamp = new Date().toISOString();
          let approvalNotifications = [];
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
                      (name) => name && !previousApprovers.includes(name)
                    );
                    if (newApprovers.length) {
                      approvalNotifications = approvalNotifications.concat(
                        buildApprovalNotifications(sanitized, newApprovers)
                      );
                    }
                    return {
                      ...sanitized,
                      statusDetail: computeStatusDetail(sanitized),
                    };
                  })()
                : entry
            )
          );
          if (approvalNotifications.length) {
            addNotifications(approvalNotifications);
          }
        };

        const toggleApprove = (id) => {
          const timestamp = new Date().toISOString();
          setEntries((prev) =>
            prev.map((entry) => {
              if (entry.id !== id) return entry;
              const toggled = entry.status === "Approved" ? "Pending" : "Approved";
              const updatedEntry = sanitizeEntry({
                ...entry,
                status: toggled,
                approvedAt: toggled === "Approved" ? timestamp : undefined,
                updatedAt: timestamp,
              });
              const workflowStatus = toggled === "Approved"
                ? "Approved"
                : KANBAN_STATUSES.includes(updatedEntry.workflowStatus)
                ? updatedEntry.workflowStatus
                : KANBAN_STATUSES.includes(entry.workflowStatus)
                ? entry.workflowStatus
                : KANBAN_STATUSES[0];
              const normalized = {
                ...updatedEntry,
                workflowStatus,
              };
              return {
                ...normalized,
                statusDetail: computeStatusDetail(normalized),
              };
            })
          );
        };

        const updateWorkflowStatus = (id, nextStatus) => {
          if (!KANBAN_STATUSES.includes(nextStatus)) return;
          const timestamp = new Date().toISOString();
          setEntries((prev) =>
            prev.map((entry) => {
              if (entry.id !== id) return entry;
              const sanitized = sanitizeEntry({
                ...entry,
                workflowStatus: nextStatus,
                updatedAt: timestamp,
              });
              return {
                ...sanitized,
                statusDetail: computeStatusDetail(sanitized),
              };
            })
          );
        };

        const softDelete = (id) => {
          const timestamp = new Date().toISOString();
          setEntries((prev) =>
            prev.map((entry) =>
              entry.id === id ? { ...entry, deletedAt: timestamp, updatedAt: timestamp } : entry
            )
          );
          if (viewingId === id) closeEntry();
        };

        const restore = (id) => {
          const timestamp = new Date().toISOString();
          setEntries((prev) =>
            prev.map((entry) =>
              entry.id === id ? { ...entry, deletedAt: undefined, updatedAt: timestamp } : entry
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
          return (
            <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-16 text-ocean-900">
              <div className="rounded-3xl border border-aqua-200 bg-white p-8 shadow-2xl">
                <h1 className="heading-font text-3xl font-semibold text-ocean-600">Content Dashboard</h1>
                <p className="mt-2 text-sm text-graystone-600">
                  Pick yourself from the roster to jump into planning, approvals, and production tracking.
                </p>
                <form className="mt-6 space-y-4" onSubmit={submitLogin}>
                  <div className="space-y-2">
                    <Label className="text-sm text-graystone-600" htmlFor="login-user">
                      Who&apos;s working?
                    </Label>
                    <select
                      id="login-user"
                      value={userSelection}
                      onChange={(event) => setUserSelection(event.target.value)}
                      className={cx(selectBaseClasses, "w-full px-4 py-3 text-sm")}
                    >
                      <option value="">Select your name</option>
                      {USERS.map((user) => (
                        <option key={user} value={user}>
                          {user}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="submit"
                    disabled={!userSelection}
                    className="w-full"
                  >
                    Enter dashboard
                  </Button>
                </form>
              </div>
              <p className="mt-6 text-center text-xs text-graystone-500">
                Tip: approvals are filtered automatically so you only see what needs your sign-off.
              </p>
            </div>
          );
        }

        return (
          <div className="mx-auto max-w-7xl px-4 py-8">
            {currentView === "menu" && (
              <>
                <div className="mb-6 flex flex-col gap-4 text-ocean-900 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="heading-font inline-flex items-center gap-2 text-sm font-semibold text-black">
                      <span className="inline-block h-3 w-3 rounded-full bg-[#00F5FF]" aria-hidden="true" />
                      Signed in as
                    </div>
                    <span className="heading-font inline-flex items-center rounded-full bg-aqua-100 px-4 py-2 text-sm font-semibold text-ocean-700">
                      {currentUser}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => outstandingCount > 0 && setApprovalsModalOpen(true)}
                      disabled={outstandingCount === 0}
                      className="heading-font inline-flex items-center gap-2 rounded-full border border-[#0F9DDE]/30 bg-aqua-100/80 px-4 py-2 text-sm font-semibold text-ocean-700 transition hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(15,157,222,0.35)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0F9DDE]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#CFEBF8] disabled:translate-y-0 disabled:shadow-none disabled:opacity-60"
                    >
                      <span className="inline-block h-3 w-3 rounded-full bg-[#00F5FF]" aria-hidden="true" />
                      {outstandingCount} awaiting approval
                    </button>
                    {unreadMentionsCount > 0 ? (
                      <span className="heading-font inline-flex items-center gap-2 rounded-full bg-aqua-100 px-4 py-2 text-sm font-semibold text-ocean-700">
                        <span className="inline-block h-3 w-3 rounded-full bg-[#00F5FF]" aria-hidden="true" />
                        {unreadMentionsCount} new mentions
                      </span>
                    ) : null}
                    <Button
                      onClick={handleSignOut}
                      className="heading-font text-sm normal-case"
                    >
                      Switch user
                    </Button>
                    <Button
                      variant="outline"
                      className="heading-font text-sm normal-case"
                      onClick={() => setGuidelinesOpen(true)}
                    >
                      Guidelines
                    </Button>
                    <NotificationBell
                      notifications={userNotifications}
                      unreadCount={unreadNotifications.length}
                      onOpenItem={(note) => {
                        openEntry(note.entryId);
                        markNotificationsAsReadForEntry(note.entryId, currentUser);
                      }}
                    />
                  </div>
                </div>

                <header className="mb-10">
                  <div className="border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]">
                    <h1 className="heading-font flex items-center gap-2 text-3xl font-semibold text-black md:text-4xl">
                      <span className="inline-block h-3 w-3 rounded-full bg-[#00F5FF]" aria-hidden="true" />
                      Content Dashboard
                    </h1>
                    <p className="mt-3 max-w-2xl text-base text-graystone-600">
                      Plan, approve, and ship social content in one place. Track production status, stay on top of
                      approvals, and keep a clean trail of who owns what.
                    </p>
                  </div>
                </header>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                  <div
                    className="flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]"
                  >
                    <div className="heading-font flex items-center gap-3 text-2xl font-semibold text-black">
                      <span
                        className={cx(
                          "inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out",
                          menuMotionActive ? "translate-x-0 opacity-100 rotate-180" : "translate-x-6 opacity-0"
                        )}
                        style={{ transitionDelay: "80ms" }}
                        aria-hidden="true"
                      />
                      <span
                        className={cx(
                          "transform transition-all duration-700 ease-out",
                          menuMotionActive ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                        )}
                        style={{ transitionDelay: "160ms" }}
                      >
                        Create Content
                      </span>
                    </div>
                    <p className="text-sm text-graystone-600">
                      Capture briefs, assign approvers, and log the assets your team needs to produce next.
                    </p>
                    <Button
                      onClick={() => {
                        setCurrentView("form");
                        setPlanTab("plan");
                        closeEntry();
                        try { window.location.hash = '#create'; } catch {}
                      }}
                      className="mt-auto"
                    >
                      Open form
                    </Button>
                  </div>
                  <div
                    className="flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]"
                  >
                    <div className="heading-font flex items-center gap-3 text-2xl font-semibold text-black">
                      <span
                        className={cx(
                          "inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out",
                          menuMotionActive ? "translate-x-0 opacity-100 rotate-180" : "translate-x-6 opacity-0"
                        )}
                        style={{ transitionDelay: "120ms" }}
                        aria-hidden="true"
                      />
                      <span
                        className={cx(
                          "transform transition-all duration-700 ease-out",
                          menuMotionActive ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                        )}
                        style={{ transitionDelay: "200ms" }}
                      >
                        Calendar
                      </span>
                    </div>
                    <p className="text-sm text-graystone-600">
                      Review what is booked each day, approve content, and tidy up anything sitting in trash.
                    </p>
                    <Button
                      onClick={() => {
                        setCurrentView("plan");
                        setPlanTab("plan");
                        closeEntry();
                      }}
                      className="mt-auto"
                    >
                      View calendar
                    </Button>
                  </div>
                  <div
                    className="flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]"
                  >
                    <div className="heading-font flex items-center gap-3 text-2xl font-semibold text-black">
                      <span
                        className={cx(
                          "inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out",
                          menuMotionActive ? "translate-x-0 opacity-100 rotate-180" : "translate-x-6 opacity-0"
                        )}
                        style={{ transitionDelay: "160ms" }}
                        aria-hidden="true"
                      />
                      <span
                        className={cx(
                          "transform transition-all duration-700 ease-out",
                          menuMotionActive ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                        )}
                        style={{ transitionDelay: "240ms" }}
                      >
                        Production Kanban
                      </span>
                    </div>
                    <p className="text-sm text-graystone-600">
                      Move work from draft to scheduled with status-based swimlanes.
                    </p>
                    <Button
                      onClick={() => {
                        setCurrentView("plan");
                        setPlanTab("kanban");
                        closeEntry();
                      }}
                      className="mt-auto"
                    >
                      View board
                    </Button>
                  </div>
                  <div
                    className="flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]"
                  >
                    <div className="heading-font flex items-center gap-3 text-2xl font-semibold text-black">
                      <span
                        className={cx(
                          "inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out",
                          menuMotionActive ? "translate-x-0 opacity-100 rotate-180" : "translate-x-6 opacity-0"
                        )}
                        style={{ transitionDelay: "200ms" }}
                        aria-hidden="true"
                      />
                      <span
                        className={cx(
                          "transform transition-all duration-700 ease-out",
                          menuMotionActive ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                        )}
                        style={{ transitionDelay: "280ms" }}
                      >
                        LinkedIn drafts
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-graystone-600">
                      Submit LinkedIn copy for review or queue posts for teammates to share.
                    </p>
                    <Button
                      onClick={() => {
                        setCurrentView("plan");
                        setPlanTab("linkedin");
                        closeEntry();
                      }}
                      className="mt-auto"
                    >
                      View drafts
                    </Button>
                  </div>
                  <div
                    className="flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]"
                  >
                    <div className="heading-font flex items-center gap-3 text-2xl font-semibold text-black">
                      <span
                        className={cx(
                          "inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out",
                          menuMotionActive ? "translate-x-0 opacity-100 rotate-180" : "translate-x-6 opacity-0"
                        )}
                        style={{ transitionDelay: "240ms" }}
                        aria-hidden="true"
                      />
                      <span
                        className={cx(
                          "transform transition-all duration-700 ease-out",
                          menuMotionActive ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                        )}
                        style={{ transitionDelay: "320ms" }}
                      >
                        Testing Lab
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-graystone-600">
                      Document hypotheses, success metrics, and frameworks you can link to briefs.
                    </p>
                    <Button
                      onClick={() => {
                        setCurrentView("plan");
                        setPlanTab("testing");
                        closeEntry();
                      }}
                      className="mt-auto"
                    >
                      Explore tests
                    </Button>
                  </div>
                  <div
                    className="flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]"
                  >
                    <div className="heading-font flex items-center gap-3 text-2xl font-semibold text-black">
                      <span
                        className={cx(
                          "inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out",
                          menuMotionActive ? "translate-x-0 opacity-100 rotate-180" : "translate-x-6 opacity-0"
                        )}
                        style={{ transitionDelay: "280ms" }}
                        aria-hidden="true"
                      />
                      <span
                        className={cx(
                          "transform transition-all duration-700 ease-out",
                          menuMotionActive ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                        )}
                        style={{ transitionDelay: "360ms" }}
                      >
                        Your Approvals
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-graystone-600">
                      Track what still needs your sign-off and clear the queue in one pass.
                    </p>
                    <Button
                      onClick={() => {
                        setCurrentView("approvals");
                        setPlanTab("plan");
                        closeEntry();
                      }}
                      className="mt-auto"
                    >
                      View queue
                    </Button>
                  </div>
                  <div
                    className="flex min-h-full flex-col items-start gap-4 border border-[#0F9DDE]/40 bg-white p-8 text-left text-ocean-900 shadow-[0_0_35px_rgba(15,157,222,0.3)]"
                  >
                    <div className="heading-font flex items-center gap-3 text-2xl font-semibold text-black">
                      <span
                        className={cx(
                          "inline-block h-3 w-3 transform rounded-full bg-[#00F5FF] transition-all duration-700 ease-out",
                          menuMotionActive ? "translate-x-0 opacity-100 rotate-180" : "translate-x-6 opacity-0"
                        )}
                        style={{ transitionDelay: "320ms" }}
                        aria-hidden="true"
                      />
                      <span
                        className={cx(
                          "transform transition-all duration-700 ease-out",
                          menuMotionActive ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                        )}
                        style={{ transitionDelay: "400ms" }}
                      >
                        Ideas Log
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-graystone-600">
                      Capture topics, themes, and series concepts—complete with notes, links, and assets.
                    </p>
                    <Button
                      onClick={() => {
                        setCurrentView("plan");
                        setPlanTab("ideas");
                        closeEntry();
                      }}
                      className="mt-auto"
                    >
                      View ideas
                    </Button>
                  </div>
                </div>
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
                              "w-full rounded-xl border px-4 py-3 text-left text-sm transition",
                              note.read
                                ? "border-graystone-200 bg-white hover:border-aqua-300 hover:bg-aqua-50/50"
                                : "border-aqua-300 bg-aqua-50 hover:border-aqua-400"
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
              </>
            )}

            {currentView === "form" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setCurrentView("menu");
                        setPlanTab("plan");
                        closeEntry();
                      }}
                      className="self-start"
                    >
                      Back to menu
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
                        setCurrentView("plan");
                        setPlanTab("plan");
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

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-aqua-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))
                      }
                    >
                      Prev
                    </Button>
                    <div className="inline-flex items-center gap-2 rounded-full border border-black px-4 py-2 text-sm font-semibold text-graystone-800">
                      <CalendarIcon className="h-4 w-4 text-ocean-600" />
                      {monthLabel}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))
                      }
                    >
                      Next
                    </Button>
                  </div>
                  <p className="text-xs text-graystone-600">Choose the month to populate the day picker below.</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(260px,1fr)]">
                  <div className="w-full">
                    <EntryForm
                      key={startISO}
                      monthCursor={monthCursor}
                      onSubmit={addEntry}
                      existingEntries={entries.filter((entry) => !entry.deletedAt)}
                      testingFrameworks={testingFrameworks}
                      onPreviewAssetType={setPendingAssetType}
                      guidelines={guidelines}
                      currentUser={currentUser}
                    />
                  </div>
                  <div className="flex w-full flex-col gap-6">
                    <MiniCalendar monthCursor={monthCursor} entries={monthEntries} onOpenEntry={openEntry} />
                  </div>
                </div>
              </div>
            )}

            {currentView === "plan" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setCurrentView("menu");
                        setPlanTab("plan");
                        closeEntry();
                      }}
                    >
                      Back to menu
                    </Button>
                    <div className="flex items-center gap-2 rounded-3xl border border-aqua-200 bg-aqua-50 p-1 text-ocean-600">
                      <Button
                        variant="ghost"
                        onClick={() => setPlanTab("plan")}
                        className={cx(
                          "rounded-2xl px-4 py-2 text-sm transition",
                          planTab === "plan"
                            ? "bg-ocean-500 text-white hover:bg-ocean-600"
                            : "text-ocean-600 hover:bg-aqua-100"
                        )}
                      >
                        Calendar
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setPlanTab("trash")}
                        className={cx(
                          "rounded-2xl px-4 py-2 text-sm transition",
                          planTab === "trash"
                            ? "bg-ocean-500 text-white hover:bg-ocean-600"
                            : "text-ocean-600 hover:bg-aqua-100"
                        )}
                      >
                        Trash
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setPlanTab("kanban")}
                        className={cx(
                          "rounded-2xl px-4 py-2 text-sm transition",
                          planTab === "kanban"
                            ? "bg-ocean-500 text-white hover:bg-ocean-600"
                            : "text-ocean-600 hover:bg-aqua-100"
                        )}
                      >
                        Kanban
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setPlanTab("ideas")}
                        className={cx(
                          "rounded-2xl px-4 py-2 text-sm transition",
                          planTab === "ideas"
                            ? "bg-ocean-500 text-white hover:bg-ocean-600"
                            : "text-ocean-600 hover:bg-aqua-100"
                        )}
                      >
                        Ideas
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setPlanTab("linkedin")}
                        className={cx(
                          "rounded-2xl px-4 py-2 text-sm transition",
                          planTab === "linkedin"
                            ? "bg-ocean-500 text-white hover:bg-ocean-600"
                            : "text-ocean-600 hover:bg-aqua-100"
                        )}
                      >
                        LinkedIn
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setPlanTab("testing")}
                        className={cx(
                          "rounded-2xl px-4 py-2 text-sm transition",
                          planTab === "testing"
                            ? "bg-ocean-500 text-white hover:bg-ocean-600"
                            : "text-ocean-600 hover:bg-aqua-100"
                        )}
                      >
                        Testing Lab
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        setCurrentView("form");
                        setPlanTab("plan");
                        closeEntry();
                        try { window.location.hash = '#create'; } catch {}
                      }}
                      className="gap-2"
                    >
                      <PlusIcon className="h-4 w-4 text-white" />
                      Create content
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setGuidelinesOpen(true)}
                    >
                      Guidelines
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="heading-font text-sm normal-case"
                    >
                      Switch user
                    </Button>
                  </div>
                </div>

                {(() => {
                  switch (planTab) {
                    case "plan":
                      return (
                        <Card className="shadow-xl">
                          <CardHeader>
                            <div className="flex flex-col gap-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <CardTitle className="text-xl text-ocean-900">Calendar</CardTitle>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setMonthCursor(
                                        new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1)
                                      )
                                    }
                                  >
                                    Prev
                                  </Button>
                                  <div className="inline-flex items-center gap-2 rounded-md border border-graystone-200 bg-white px-3 py-1 text-sm font-medium text-graystone-700 shadow-sm">
                                    <CalendarIcon className="h-4 w-4 text-graystone-500" />
                                    {monthLabel}
                                  </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setMonthCursor(
                                  new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1)
                                )
                              }
                            >
                              Next
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPerformanceImportOpen(true)}
                            >
                              Import performance
                            </Button>
                          </div>
                        </div>

                              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <div>
                                  <Label className="text-xs text-graystone-600">Asset type</Label>
                                  <select
                                    value={filterType}
                                    onChange={(event) => setFilterType(event.target.value)}
                                    className={cx(selectBaseClasses, "mt-1 w-full")}
                                  >
                                    <option value="All">All</option>
                                    <option value="Video">Video</option>
                                    <option value="Design">Design</option>
                                    <option value="Carousel">Carousel</option>
                                  </select>
                                </div>
                                <div>
                                  <Label className="text-xs text-graystone-600">Status</Label>
                                  <select
                                    value={filterStatus}
                                    onChange={(event) => setFilterStatus(event.target.value)}
                                    className={cx(selectBaseClasses, "mt-1 w-full")}
                                  >
                                    <option value="All">All</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                  </select>
                                </div>
                                <div>
                                  <Label className="text-xs text-graystone-600">Platforms</Label>
                                  <div className="mt-1">
                                    <PlatformFilter value={filterPlatforms} onChange={setFilterPlatforms} />
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1">
                                <div className="rounded-2xl border border-aqua-200 bg-aqua-50 px-3 py-3">
                                  <div className="text-xs font-semibold uppercase tracking-wide text-ocean-600">
                                    Ideas for this month
                                  </div>
                                  {currentMonthIdeas.length === 0 ? (
                                    <p className="mt-2 text-xs text-graystone-500">No ideas tagged for this month yet.</p>
                                  ) : (
                                    <div className="mt-2 space-y-2">
                                      {currentMonthIdeas.map((idea) => (
                                        <div
                                          key={idea.id}
                                          className="rounded-xl border border-aqua-200 bg-white px-3 py-2 text-xs text-graystone-700"
                                        >
                                          <div className="flex items-center justify-between gap-3">
                                            <span className="font-semibold text-ocean-700">{idea.title}</span>
                                            {idea.targetDate ? (
                                              <span className="text-graystone-500">
                                                {new Date(idea.targetDate).toLocaleDateString()}
                                              </span>
                                            ) : null}
                                          </div>
                                          {idea.notes && (
                                            <div className="mt-1 line-clamp-2 text-graystone-600">{idea.notes}</div>
                                          )}
                                          <div className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-graystone-400">
                                            {idea.type}
                                            {idea.links && idea.links.length > 0 && (
                                              <a
                                                href={idea.links[0]}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-ocean-600 hover:underline"
                                              >
                                                View link
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(240px,0.8fr)]">
                              <div>
                                <MonthGrid
                                  days={days}
                                  month={monthCursor.getMonth()}
                                  year={monthCursor.getFullYear()}
                                  entries={monthEntries}
                                  onApprove={toggleApprove}
                                  onDelete={softDelete}
                                  onOpen={openEntry}
                                />
                              </div>
                              <AssetRatioCard
                                summary={assetTypeSummary}
                                monthLabel={monthLabel}
                                pendingAssetType={null}
                                goals={assetGoals}
                                onGoalsChange={setAssetGoals}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    case "trash":
                      return (
                        <Card className="shadow-xl">
                          <CardHeader>
                            <CardTitle className="text-lg text-ocean-900">Trash (30-day retention)</CardTitle>
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
                                          Deleted {entry.deletedAt ? new Date(entry.deletedAt).toLocaleString() : ""}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" onClick={() => restore(entry.id)}>
                                          <RotateCcwIcon className="h-4 w-4 text-graystone-600" />
                                          Restore
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => hardDelete(entry.id)}>
                                          <TrashIcon className="h-4 w-4 text-white" />
                                          Delete forever
                                        </Button>
                                      </div>
                                    </div>
                                    {entry.caption && (
                                      <p className="mt-2 line-clamp-2 text-sm text-graystone-600">{entry.caption}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    case "kanban":
                      return (
                        <KanbanBoard
                          statuses={KANBAN_STATUSES}
                          entries={kanbanEntries}
                          onOpen={openEntry}
                          onUpdateStatus={updateWorkflowStatus}
                        />
                      );
                    case "ideas":
                      return (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                          <IdeaForm onSubmit={addIdea} currentUser={currentUser} />
                          <IdeasBoard ideas={ideas} onDelete={deleteIdea} />
                        </div>
                      );
                    case "linkedin":
                      return (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                          <LinkedInSubmissionForm onSubmit={addLinkedInSubmission} currentUser={currentUser} />
                          <LinkedInSubmissionList
                            submissions={linkedinSubmissions}
                            onStatusChange={updateLinkedInStatus}
                          />
                        </div>
                      );
                    case "testing":
                      return (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr,1fr] xl:grid-cols-[1.5fr,1fr]">
                          <TestingFrameworkForm onSubmit={addTestingFrameworkEntry} />
                          <div className="space-y-6">
                            <TestingFrameworkList
                              frameworks={testingFrameworks}
                              onDelete={deleteTestingFramework}
                              onSelect={setSelectedFrameworkId}
                              selectedId={selectedFrameworkId}
                              entryCounts={frameworkEntryCounts}
                            />
                            <TestingFrameworkHub
                              framework={selectedFramework}
                              entries={selectedFrameworkEntries}
                              onOpenEntry={openEntry}
                            />
                          </div>
                        </div>
                      );
                    default:
                      return null;
                  }
                })()}
              </div>
            )}

            {currentView === "approvals" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setCurrentView("menu");
                        setPlanTab("plan");
                        closeEntry();
                      }}
                    >
                      Back to menu
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setCurrentView("plan");
                        setPlanTab("plan");
                      }}
                    >
                      Go to calendar
                    </Button>
                    <Badge variant="outline" className="text-xs">
                      {outstandingCount} waiting
                    </Badge>
                    {unreadMentionsCount > 0 && (
                      <Badge variant="outline" className="text-xs bg-ocean-500/10 text-ocean-700">
                        {unreadMentionsCount} mentions
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        setCurrentView("form");
                        setPlanTab("plan");
                        closeEntry();
                        try { window.location.hash = '#create'; } catch {}
                      }}
                      className="gap-2"
                    >
                      <PlusIcon className="h-4 w-4 text-white" />
                      Create content
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="heading-font text-sm normal-case"
                    >
                      Switch user
                    </Button>
                  </div>
                </div>

                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg text-ocean-900">Your Approvals</CardTitle>
                    <p className="mt-2 text-sm text-graystone-500">
                      Items assigned to you that still need approval. Click an item to review, comment, or approve.
                    </p>
                  </CardHeader>
                  <CardContent>
                    {outstandingApprovals.length === 0 ? (
                      <p className="text-sm text-graystone-500">
                        Everything looks good. Nothing needs your approval right now.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {outstandingApprovals.map((entry) => (
                          <div
                            key={entry.id}
                            className="rounded-xl border border-graystone-200 bg-white px-4 py-4 shadow-sm transition hover:border-aqua-400"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline">{entry.assetType}</Badge>
                                  <span className="text-sm font-semibold text-graystone-800">
                                    {new Date(entry.date).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      weekday: "short",
                                    })}
                                  </span>
                                  <span className="rounded-full bg-aqua-100 px-2 py-1 text-xs font-medium text-ocean-700">
                                    {entry.statusDetail}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-graystone-500">
                                  <span>Requested by {entry.author || "Unknown"}</span>
                                  {entry.approvers?.length ? (
                                    <span>Approvers: {entry.approvers.join(", ")}</span>
                                  ) : null}
                                </div>
                                {entry.caption && (
                                  <p className="line-clamp-3 text-sm text-graystone-700">{entry.caption}</p>
                                )}
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
                                {entry.checklist && (
                                  <div className="flex flex-wrap gap-2 text-xs text-graystone-500">
                                    {Object.entries(entry.checklist).map(([key, value]) => {
                                      const itemDef = CHECKLIST_ITEMS.find((item) => item.key === key);
                                      if (!itemDef) return null;
                                      return (
                                        <span
                                          key={key}
                                          className={cx(
                                            "inline-flex items-center gap-1 rounded-full px-2 py-1",
                                            value
                                              ? "bg-emerald-100 text-emerald-700"
                                              : "bg-graystone-100 text-graystone-500"
                                          )}
                                        >
                                          {value ? (
                                            <CheckCircleIcon className="h-3 w-3 text-emerald-600" />
                                          ) : (
                                            <LoaderIcon className="h-3 w-3 text-graystone-400 animate-none" />
                                          )}
                                          {itemDef.label}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    toggleApprove(entry.id);
                                  }}
                                  className="gap-2"
                                >
                                  <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                                  Mark approved
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEntry(entry.id)}
                                  className="gap-2"
                                >
                                  Open detail
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            {viewingSnapshot ? (
              <EntryModal
                entry={viewingSnapshot}
                currentUser={currentUser}
                onClose={closeEntry}
                onApprove={toggleApprove}
                onDelete={softDelete}
                onSave={upsert}
                onUpdate={upsert}
                onNotifyMentions={handleMentionNotifications}
                testingFrameworks={testingFrameworks}
              />
            ) : null}
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
        );
      }

      ReactDOM.createRoot(document.getElementById("root")).render(<ContentDashboard />);