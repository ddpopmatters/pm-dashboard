import { useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  Badge,
  Button,
  Input,
  Label,
  Toggle,
} from '../../components/ui';
import { PlatformIcon, CalendarIcon, ChevronDownIcon } from '../../components/common';
import { cx, daysInMonth, monthStartISO, monthEndISO, isoFromParts } from '../../lib/utils';
import { selectBaseClasses } from '../../lib/styles';
import { ALL_PLATFORMS, KANBAN_STATUSES } from '../../constants';
import MonthGrid from './MonthGrid';

const MULTI_OPTION_BASE =
  'dropdown-font flex cursor-pointer items-center gap-3 px-4 py-2 text-sm font-normal text-black transition hover:bg-black hover:text-white';

const checklistCheckboxClass =
  'h-4 w-4 rounded border-black bg-white text-[#00F5FF] focus:ring-0 focus:ring-offset-0';

function MultiSelect({ placeholder, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const toggle = (val) => {
    const exists = value.includes(val);
    onChange(exists ? value.filter((x) => x !== val) : [...value, val]);
  };
  return (
    <div className="relative">
      <Button
        variant="outline"
        className="dropdown-font w-full justify-between px-4 py-2"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="dropdown-font text-sm">
          {value.length ? `${value.length} selected` : placeholder}
        </span>
        <ChevronDownIcon className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute left-0 top-12 z-30 w-full rounded-3xl border border-black bg-white text-black shadow-[0_0_25px_rgba(15,157,222,0.3)]">
          <div className="max-h-52 overflow-y-auto py-2">
            {options.map((option) => (
              <label key={option.value} className={MULTI_OPTION_BASE}>
                <input
                  type="checkbox"
                  className={checklistCheckboxClass}
                  checked={value.includes(option.value)}
                  onChange={() => toggle(option.value)}
                />
                {option.icon ? <span className="transition-colors">{option.icon}</span> : null}
                <span className="text-sm font-normal">{option.label}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-black/10 px-3 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
              className="heading-font text-sm"
            >
              Clear
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlatformFilter({ value, onChange }) {
  return (
    <MultiSelect
      placeholder="All platforms"
      value={value}
      onChange={onChange}
      options={ALL_PLATFORMS.map((platform) => ({
        value: platform,
        label: platform,
        icon: <PlatformIcon platform={platform} />,
      }))}
    />
  );
}

function AssetMixPie({ counts, total }) {
  const palette = {
    Video: '#2563eb',
    Design: '#1d4ed8',
    Carousel: '#60a5fa',
  };
  const entries = ['Video', 'Design', 'Carousel']
    .map((type) => ({ type, value: counts[type] || 0 }))
    .filter((item) => item.value > 0);
  if (!entries.length || !total) return null;
  let cumulative = 0;
  const segments = entries.map(({ type, value }) => {
    const start = (cumulative / total) * 100;
    cumulative += value;
    const end = (cumulative / total) * 100;
    const color = palette[type] || '#2563eb';
    return `${color} ${start}% ${end}%`;
  });
  const gradient = `conic-gradient(${segments.join(', ')})`;

  return (
    <div className="flex items-center gap-4">
      <div
        className="h-16 w-16 rounded-full border border-aqua-200"
        style={{ background: gradient }}
      />
      <div className="space-y-1 text-xs text-graystone-600">
        {entries.map(({ type, value }) => {
          const color = palette[type] || '#2563eb';
          const percentage = Math.round((value / total) * 100);
          return (
            <div key={type} className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium text-graystone-700">{type}</span>
              <span>
                {value} ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AssetRatioCard({ summary, monthLabel, goals, onGoalsChange }) {
  const baseCounts = summary?.counts || {};
  const total = summary?.total || 0;
  const counts = baseCounts;
  const adjustedTotal = total;
  const types = ['Video', 'Design', 'Carousel'];

  const goalTotal =
    Object.values(goals || {}).reduce((acc, value) => acc + Number(value || 0), 0) || 100;
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
      </CardContent>
    </Card>
  );
}

export function CalendarView({
  entries,
  ideas,
  onApprove,
  onDelete,
  onOpenEntry,
  onImportPerformance,
  assetGoals,
  onGoalsChange,
}) {
  // Month navigation state
  const [monthCursor, setMonthCursor] = useState(() => new Date());

  // Filter state
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterWorkflow, setFilterWorkflow] = useState('All');
  const [filterPlatforms, setFilterPlatforms] = useState([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterOverdue, setFilterOverdue] = useState(false);

  // Computed values
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

  const resetFilters = useCallback(() => {
    setFilterType('All');
    setFilterStatus('All');
    setFilterWorkflow('All');
    setFilterPlatforms([]);
    setFilterQuery('');
    setFilterOverdue(false);
  }, []);

  const goToPrevMonth = () => {
    setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1));
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-xl text-ocean-900">Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPrevMonth}>
                Prev
              </Button>
              <div className="inline-flex items-center gap-2 rounded-md border border-graystone-200 bg-white px-3 py-1 text-sm font-medium text-graystone-700 shadow-sm">
                <CalendarIcon className="h-4 w-4 text-graystone-500" />
                {monthLabel}
              </div>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                Next
              </Button>
              <Button variant="outline" size="sm" onClick={onImportPerformance}>
                Import performance
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <Label className="text-xs text-graystone-600">Asset type</Label>
              <select
                value={filterType}
                onChange={(event) => setFilterType(event.target.value)}
                className={cx(selectBaseClasses, 'mt-1 w-full')}
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
                className={cx(selectBaseClasses, 'mt-1 w-full')}
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-graystone-600">Workflow</Label>
              <select
                value={filterWorkflow}
                onChange={(event) => setFilterWorkflow(event.target.value)}
                className={cx(selectBaseClasses, 'mt-1 w-full')}
              >
                <option value="All">All</option>
                {KANBAN_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-graystone-600">Platforms</Label>
              <div className="mt-1">
                <PlatformFilter value={filterPlatforms} onChange={setFilterPlatforms} />
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div>
              <Label className="text-xs text-graystone-600" htmlFor="plan-search">
                Search
              </Label>
              <Input
                id="plan-search"
                value={filterQuery}
                onChange={(event) => setFilterQuery(event.target.value)}
                placeholder="Search captions, campaigns, authors..."
                className="mt-1 w-full rounded-2xl border border-graystone-200 px-3 py-2 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-aqua-200"
              />
            </div>
            <div className="flex items-end justify-between gap-3 rounded-2xl border border-graystone-200 bg-white px-4 py-3 text-xs text-graystone-600">
              <div>
                <div className="font-semibold text-graystone-700">Overdue approvals</div>
                <div>Show items past deadline.</div>
              </div>
              <Toggle
                id="overdue-approvals"
                checked={filterOverdue}
                onChange={setFilterOverdue}
                ariaLabel="Show overdue approvals only"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-graystone-200 bg-white px-4 py-3 text-xs text-graystone-600">
            <div>
              <div className="font-semibold text-graystone-700">
                Showing {monthEntries.length} of {monthEntryTotal} entries
              </div>
              <div>
                {activeFilterCount
                  ? `${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} active`
                  : 'No filters applied.'}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              disabled={!activeFilterCount}
            >
              Reset filters
            </Button>
          </div>

          <div className="grid grid-cols-1">
            <div className="rounded-2xl border border-aqua-200 bg-aqua-50 px-3 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-ocean-600">
                Ideas for this month
              </div>
              {currentMonthIdeas.length === 0 ? (
                <p className="mt-2 text-xs text-graystone-500">
                  No ideas tagged for this month yet.
                </p>
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
              onApprove={onApprove}
              onDelete={onDelete}
              onOpen={onOpenEntry}
            />
          </div>
          <AssetRatioCard
            summary={assetTypeSummary}
            monthLabel={monthLabel}
            goals={assetGoals}
            onGoalsChange={onGoalsChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default CalendarView;
