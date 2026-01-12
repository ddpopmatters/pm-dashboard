# Dashboard At-A-Glance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the dashboard from a navigation menu into a useful at-a-glance view with actionable insights.

**Architecture:** Extract dashboard widgets into modular components under `src/features/dashboard/widgets/`. Each widget is self-contained with its own data computation. The main dashboard composes these widgets in a responsive grid layout. We'll reuse existing components (UpcomingDeadlines) and utility functions (calculateMetrics from AnalyticsView).

**Tech Stack:** React 19, TypeScript, Tailwind CSS, existing UI components from `src/components/ui`

---

## Widget Overview

| Widget                  | Shows                                              | Data Source                                |
| ----------------------- | -------------------------------------------------- | ------------------------------------------ |
| **Content Pipeline**    | Entries by status (Draft/Pending/Scheduled/Posted) | `entries` state                            |
| **This Week Stats**     | Posts published, engagement, reach                 | `entries` with analytics                   |
| **Approval Queue**      | Pending items with urgency indicators              | `entries` filtered                         |
| **Upcoming Deadlines**  | Next 7 days deadline items                         | Existing `UpcomingDeadlines`               |
| **Asset Mix Progress**  | Asset type distribution vs goals                   | `entries` + `assetGoals`                   |
| **Engagement Progress** | Weekly goal progress                               | `engagementActivities` + `engagementGoals` |
| **Quick Actions**       | Create, Approve, View Calendar shortcuts           | Navigation                                 |

---

### Task 1: Create Dashboard Directory Structure

**Files:**

- Create: `src/features/dashboard/index.ts`
- Create: `src/features/dashboard/widgets/index.ts`

**Step 1: Create barrel files**

```bash
mkdir -p src/features/dashboard/widgets
```

**Step 2: Create dashboard index**

Create `src/features/dashboard/index.ts`:

```typescript
export * from './widgets';
export { DashboardView } from './DashboardView';
```

**Step 3: Create widgets barrel**

Create `src/features/dashboard/widgets/index.ts`:

```typescript
export { ContentPipelineWidget } from './ContentPipelineWidget';
export { WeeklyStatsWidget } from './WeeklyStatsWidget';
export { ApprovalQueueWidget } from './ApprovalQueueWidget';
export { AssetMixWidget } from './AssetMixWidget';
export { EngagementProgressWidget } from './EngagementProgressWidget';
export { QuickActionsWidget } from './QuickActionsWidget';
```

**Step 4: Commit**

```bash
git add src/features/dashboard/
git commit -m "feat(dashboard): scaffold dashboard widget structure"
```

---

### Task 2: Content Pipeline Widget

Shows entry counts by workflow status with progress visualization.

**Files:**

- Create: `src/features/dashboard/widgets/ContentPipelineWidget.tsx`

**Step 1: Create ContentPipelineWidget**

Create `src/features/dashboard/widgets/ContentPipelineWidget.tsx`:

```typescript
import React, { useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../../../components/ui';
import type { Entry } from '../../../types/models';

interface ContentPipelineWidgetProps {
  entries: Entry[];
  onNavigate?: (view: string, filter?: string) => void;
}

const PIPELINE_STAGES = [
  { status: 'Draft', label: 'Draft', color: 'bg-graystone-400' },
  { status: 'Pending', label: 'Pending Approval', color: 'bg-amber-400' },
  { status: 'Scheduled', label: 'Scheduled', color: 'bg-ocean-400' },
  { status: 'Approved', label: 'Approved/Posted', color: 'bg-green-400' },
] as const;

export function ContentPipelineWidget({
  entries,
  onNavigate,
}: ContentPipelineWidgetProps): React.ReactElement {
  const counts = useMemo(() => {
    const activeEntries = entries.filter((e) => !e.deletedAt);
    return PIPELINE_STAGES.map((stage) => ({
      ...stage,
      count: activeEntries.filter((e) => e.status === stage.status).length,
    }));
  }, [entries]);

  const total = counts.reduce((sum, c) => sum + c.count, 0);

  return (
    <Card className="shadow-md">
      <CardHeader className="border-b border-graystone-200 py-3">
        <CardTitle className="text-base text-ocean-900">Content Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="py-4">
        {/* Progress bar */}
        <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-graystone-100">
          {counts.map((stage) => {
            const width = total > 0 ? (stage.count / total) * 100 : 0;
            if (width === 0) return null;
            return (
              <div
                key={stage.status}
                className={`${stage.color} transition-all duration-300`}
                style={{ width: `${width}%` }}
                title={`${stage.label}: ${stage.count}`}
              />
            );
          })}
        </div>

        {/* Stage counts */}
        <div className="grid grid-cols-2 gap-3">
          {counts.map((stage) => (
            <button
              key={stage.status}
              type="button"
              onClick={() => onNavigate?.('plan', stage.status)}
              className="flex items-center gap-2 rounded-lg border border-graystone-200 px-3 py-2 text-left transition hover:border-ocean-300 hover:bg-ocean-50"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
              <span className="flex-1 text-xs text-graystone-600">{stage.label}</span>
              <span className="text-sm font-semibold text-ocean-900">{stage.count}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -30`
Expected: No TypeScript errors related to ContentPipelineWidget

**Step 3: Commit**

```bash
git add src/features/dashboard/widgets/ContentPipelineWidget.tsx
git commit -m "feat(dashboard): add ContentPipelineWidget showing entry status distribution"
```

---

### Task 3: Weekly Stats Widget

Shows this week's performance metrics.

**Files:**

- Create: `src/features/dashboard/widgets/WeeklyStatsWidget.tsx`

**Step 1: Create WeeklyStatsWidget**

Create `src/features/dashboard/widgets/WeeklyStatsWidget.tsx`:

```typescript
import React, { useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../../../components/ui';
import type { Entry } from '../../../types/models';

interface WeeklyStatsWidgetProps {
  entries: Entry[];
}

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export function WeeklyStatsWidget({ entries }: WeeklyStatsWidgetProps): React.ReactElement {
  const stats = useMemo(() => {
    const weekStart = getWeekStart();
    const thisWeekEntries = entries.filter((e) => {
      if (e.deletedAt) return false;
      const entryDate = new Date(e.date);
      return entryDate >= weekStart && (e.status === 'Approved' || e.status === 'Posted');
    });

    let totalEngagements = 0;
    let totalReach = 0;
    let postsWithAnalytics = 0;

    thisWeekEntries.forEach((entry) => {
      if (!entry.analytics) return;
      entry.platforms?.forEach((platform) => {
        const stats = entry.analytics?.[platform];
        if (stats && typeof stats === 'object') {
          const s = stats as Record<string, number>;
          const likes = s.likes || 0;
          const comments = s.comments || 0;
          const shares = s.shares || 0;
          const reach = s.reach || 0;

          if (likes || comments || shares || reach) {
            postsWithAnalytics++;
            totalEngagements += likes + comments + shares;
            totalReach += reach;
          }
        }
      });
    });

    const avgEngagement = postsWithAnalytics > 0 ? Math.round(totalEngagements / postsWithAnalytics) : 0;

    return {
      postsPublished: thisWeekEntries.length,
      totalEngagements,
      totalReach,
      avgEngagement,
    };
  }, [entries]);

  const metrics = [
    { label: 'Posts Published', value: stats.postsPublished, color: 'text-ocean-600' },
    { label: 'Total Engagements', value: formatNumber(stats.totalEngagements), color: 'text-green-600' },
    { label: 'Total Reach', value: formatNumber(stats.totalReach), color: 'text-purple-600' },
    { label: 'Avg Engagement', value: stats.avgEngagement, color: 'text-amber-600' },
  ];

  return (
    <Card className="shadow-md">
      <CardHeader className="border-b border-graystone-200 py-3">
        <CardTitle className="text-base text-ocean-900">This Week</CardTitle>
      </CardHeader>
      <CardContent className="py-4">
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="text-center">
              <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
              <div className="text-xs text-graystone-500">{metric.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -30`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/features/dashboard/widgets/WeeklyStatsWidget.tsx
git commit -m "feat(dashboard): add WeeklyStatsWidget showing this week metrics"
```

---

### Task 4: Approval Queue Widget

Shows pending approvals with clickable items.

**Files:**

- Create: `src/features/dashboard/widgets/ApprovalQueueWidget.tsx`

**Step 1: Create ApprovalQueueWidget**

Create `src/features/dashboard/widgets/ApprovalQueueWidget.tsx`:

```typescript
import React, { useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle, Badge, Button } from '../../../components/ui';
import { PlatformIcon } from '../../../components/common';
import type { Entry } from '../../../types/models';

interface ApprovalQueueWidgetProps {
  entries: Entry[];
  currentUser: string;
  onOpenEntry: (id: string) => void;
  onViewAll?: () => void;
}

export function ApprovalQueueWidget({
  entries,
  currentUser,
  onOpenEntry,
  onViewAll,
}: ApprovalQueueWidgetProps): React.ReactElement {
  const pendingApprovals = useMemo(() => {
    return entries
      .filter((e) => {
        if (e.deletedAt) return false;
        if (e.status !== 'Pending') return false;
        // Check if current user is an approver who hasn't approved
        const approverEntry = e.approvers?.find((a) => a.name === currentUser);
        return approverEntry && !approverEntry.approved;
      })
      .slice(0, 5); // Show max 5
  }, [entries, currentUser]);

  const totalPending = entries.filter(
    (e) =>
      !e.deletedAt &&
      e.status === 'Pending' &&
      e.approvers?.some((a) => a.name === currentUser && !a.approved)
  ).length;

  return (
    <Card className="shadow-md">
      <CardHeader className="border-b border-graystone-200 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-ocean-900">Your Approval Queue</CardTitle>
          {totalPending > 0 && (
            <Badge variant="warning">{totalPending} pending</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="py-3">
        {pendingApprovals.length === 0 ? (
          <p className="py-4 text-center text-sm text-graystone-500">
            No items awaiting your approval.
          </p>
        ) : (
          <div className="space-y-2">
            {pendingApprovals.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onOpenEntry(entry.id)}
                className="w-full rounded-lg border border-graystone-200 bg-white px-3 py-2 text-left transition hover:border-ocean-300 hover:bg-ocean-50"
              >
                <div className="flex items-center gap-2">
                  {entry.platforms?.slice(0, 2).map((platform) => (
                    <PlatformIcon key={platform} platform={platform} size="xs" />
                  ))}
                  <span className="flex-1 truncate text-xs text-graystone-700">
                    {entry.caption || entry.assetType || 'Untitled'}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {entry.assetType}
                  </Badge>
                </div>
              </button>
            ))}
            {totalPending > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={onViewAll}
              >
                View all {totalPending} items
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -30`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/features/dashboard/widgets/ApprovalQueueWidget.tsx
git commit -m "feat(dashboard): add ApprovalQueueWidget showing pending approvals"
```

---

### Task 5: Asset Mix Widget

Shows asset type distribution vs goals.

**Files:**

- Create: `src/features/dashboard/widgets/AssetMixWidget.tsx`

**Step 1: Create AssetMixWidget**

Create `src/features/dashboard/widgets/AssetMixWidget.tsx`:

```typescript
import React, { useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../../../components/ui';
import { cx } from '../../../lib/utils';
import type { Entry } from '../../../types/models';

interface AssetMixWidgetProps {
  entries: Entry[];
  assetGoals: Record<string, number>;
}

const ASSET_COLORS: Record<string, string> = {
  Video: 'bg-purple-400',
  Design: 'bg-ocean-400',
  Carousel: 'bg-amber-400',
  Photo: 'bg-green-400',
  Text: 'bg-graystone-400',
};

export function AssetMixWidget({
  entries,
  assetGoals,
}: AssetMixWidgetProps): React.ReactElement {
  const distribution = useMemo(() => {
    // Only count this month's non-deleted entries
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthEntries = entries.filter((e) => {
      if (e.deletedAt) return false;
      const entryDate = new Date(e.date);
      return entryDate >= monthStart;
    });

    const total = monthEntries.length;
    const counts: Record<string, number> = {};

    monthEntries.forEach((e) => {
      const type = e.assetType || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    });

    // Build results for goal-tracked asset types
    return Object.entries(assetGoals).map(([type, goalPercent]) => {
      const count = counts[type] || 0;
      const actualPercent = total > 0 ? Math.round((count / total) * 100) : 0;
      const diff = actualPercent - goalPercent;

      return {
        type,
        count,
        goalPercent,
        actualPercent,
        diff,
        color: ASSET_COLORS[type] || 'bg-graystone-400',
      };
    });
  }, [entries, assetGoals]);

  return (
    <Card className="shadow-md">
      <CardHeader className="border-b border-graystone-200 py-3">
        <CardTitle className="text-base text-ocean-900">Asset Mix (This Month)</CardTitle>
      </CardHeader>
      <CardContent className="py-4">
        <div className="space-y-3">
          {distribution.map((item) => (
            <div key={item.type}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-graystone-700">{item.type}</span>
                <span className="text-graystone-500">
                  {item.actualPercent}% / {item.goalPercent}% goal
                  <span
                    className={cx(
                      'ml-1 font-medium',
                      item.diff >= 0 ? 'text-green-600' : 'text-amber-600'
                    )}
                  >
                    ({item.diff >= 0 ? '+' : ''}{item.diff}%)
                  </span>
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-graystone-100">
                {/* Actual bar */}
                <div
                  className={`absolute left-0 top-0 h-full ${item.color} transition-all duration-300`}
                  style={{ width: `${Math.min(item.actualPercent, 100)}%` }}
                />
                {/* Goal marker */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-graystone-800"
                  style={{ left: `${item.goalPercent}%` }}
                  title={`Goal: ${item.goalPercent}%`}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[10px] text-graystone-400">
          Bar shows actual %, line shows goal
        </p>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -30`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/features/dashboard/widgets/AssetMixWidget.tsx
git commit -m "feat(dashboard): add AssetMixWidget showing asset distribution vs goals"
```

---

### Task 6: Engagement Progress Widget

Shows weekly engagement goal progress.

**Files:**

- Create: `src/features/dashboard/widgets/EngagementProgressWidget.tsx`

**Step 1: Create EngagementProgressWidget**

Create `src/features/dashboard/widgets/EngagementProgressWidget.tsx`:

```typescript
import React, { useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle, Badge } from '../../../components/ui';
import { cx } from '../../../lib/utils';
import type { EngagementActivity, EngagementGoals } from '../../../types/models';

interface EngagementProgressWidgetProps {
  activities: EngagementActivity[];
  goals: EngagementGoals;
  onNavigate?: () => void;
}

const ACTION_CONFIG = [
  { key: 'comment', label: 'Comments', goalKey: 'weeklyComments' as const },
  { key: 'share', label: 'Shares', goalKey: 'weeklyShares' as const },
  { key: 'like', label: 'Likes', goalKey: 'weeklyLikes' as const },
  { key: 'reply', label: 'Replies', goalKey: 'weeklyReplies' as const },
] as const;

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function EngagementProgressWidget({
  activities,
  goals,
  onNavigate,
}: EngagementProgressWidgetProps): React.ReactElement {
  const progress = useMemo(() => {
    const weekStart = getWeekStart();
    const thisWeekActivities = activities.filter((a) => {
      const actDate = new Date(a.createdAt);
      return actDate >= weekStart;
    });

    return ACTION_CONFIG.map(({ key, label, goalKey }) => {
      const count = thisWeekActivities.filter((a) => a.actionType === key).length;
      const goal = goals[goalKey] || 0;
      const percent = goal > 0 ? Math.min(Math.round((count / goal) * 100), 100) : 0;

      return { key, label, count, goal, percent };
    });
  }, [activities, goals]);

  const overallProgress = useMemo(() => {
    const totalCount = progress.reduce((sum, p) => sum + p.count, 0);
    const totalGoal = progress.reduce((sum, p) => sum + p.goal, 0);
    return totalGoal > 0 ? Math.round((totalCount / totalGoal) * 100) : 0;
  }, [progress]);

  return (
    <Card className="shadow-md">
      <CardHeader className="border-b border-graystone-200 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-ocean-900">Engagement Goals</CardTitle>
          <Badge variant={overallProgress >= 100 ? 'success' : 'outline'}>
            {overallProgress}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="py-4">
        <div className="space-y-3">
          {progress.map((item) => (
            <div key={item.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-graystone-600">{item.label}</span>
                <span className="font-medium text-graystone-700">
                  {item.count}/{item.goal}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-graystone-100">
                <div
                  className={cx(
                    'h-full transition-all duration-300',
                    item.percent >= 100 ? 'bg-green-400' : 'bg-ocean-400'
                  )}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            className="mt-3 w-full text-center text-xs text-ocean-600 hover:text-ocean-800"
          >
            View engagement tracker &rarr;
          </button>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -30`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/features/dashboard/widgets/EngagementProgressWidget.tsx
git commit -m "feat(dashboard): add EngagementProgressWidget showing weekly goals"
```

---

### Task 7: Quick Actions Widget

Shows primary action shortcuts.

**Files:**

- Create: `src/features/dashboard/widgets/QuickActionsWidget.tsx`

**Step 1: Create QuickActionsWidget**

Create `src/features/dashboard/widgets/QuickActionsWidget.tsx`:

```typescript
import React from 'react';
import { Card, CardContent, Button } from '../../../components/ui';
import { PlusIcon, CalendarIcon, CheckIcon, BookIcon } from '../../../components/common';

interface QuickActionsWidgetProps {
  onCreateContent: () => void;
  onViewCalendar: () => void;
  onViewApprovals: () => void;
  onOpenGuidelines: () => void;
  pendingCount?: number;
}

export function QuickActionsWidget({
  onCreateContent,
  onViewCalendar,
  onViewApprovals,
  onOpenGuidelines,
  pendingCount = 0,
}: QuickActionsWidgetProps): React.ReactElement {
  return (
    <Card className="shadow-md">
      <CardContent className="py-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="default"
            className="flex items-center justify-center gap-2"
            onClick={onCreateContent}
          >
            <PlusIcon className="h-4 w-4" />
            Create
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2"
            onClick={onViewCalendar}
          >
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </Button>
          <Button
            variant="outline"
            className="relative flex items-center justify-center gap-2"
            onClick={onViewApprovals}
          >
            <CheckIcon className="h-4 w-4" />
            Approvals
            {pendingCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2"
            onClick={onOpenGuidelines}
          >
            <BookIcon className="h-4 w-4" />
            Guidelines
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Export missing icons if needed**

Check `src/components/common/index.ts` for PlusIcon, CalendarIcon, CheckIcon, BookIcon.
If missing, add simple SVG icons or use existing icons. Can also import from a library.

For simplicity, use inline SVG or Lucide icons if available. If icons don't exist, the component can use text-only buttons initially.

**Step 3: Verify build**

Run: `npm run build 2>&1 | head -30`
Expected: No TypeScript errors (may need to adjust icon imports)

**Step 4: Commit**

```bash
git add src/features/dashboard/widgets/QuickActionsWidget.tsx
git commit -m "feat(dashboard): add QuickActionsWidget with primary action buttons"
```

---

### Task 8: Create Main DashboardView Component

Composes all widgets into a responsive layout.

**Files:**

- Create: `src/features/dashboard/DashboardView.tsx`

**Step 1: Create DashboardView**

Create `src/features/dashboard/DashboardView.tsx`:

```typescript
import React from 'react';
import { ContentPipelineWidget } from './widgets/ContentPipelineWidget';
import { WeeklyStatsWidget } from './widgets/WeeklyStatsWidget';
import { ApprovalQueueWidget } from './widgets/ApprovalQueueWidget';
import { AssetMixWidget } from './widgets/AssetMixWidget';
import { EngagementProgressWidget } from './widgets/EngagementProgressWidget';
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { UpcomingDeadlines } from '../calendar/UpcomingDeadlines';
import type { Entry, EngagementActivity, EngagementGoals } from '../../types/models';

export interface DashboardViewProps {
  entries: Entry[];
  currentUser: string;
  assetGoals: Record<string, number>;
  engagementActivities: EngagementActivity[];
  engagementGoals: EngagementGoals;
  pendingApprovalCount: number;
  onOpenEntry: (id: string) => void;
  onNavigate: (view: string, tab?: string) => void;
  onOpenGuidelines: () => void;
  onOpenApprovals: () => void;
}

export function DashboardView({
  entries,
  currentUser,
  assetGoals,
  engagementActivities,
  engagementGoals,
  pendingApprovalCount,
  onOpenEntry,
  onNavigate,
  onOpenGuidelines,
  onOpenApprovals,
}: DashboardViewProps): React.ReactElement {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Dashboard Header */}
      <div className="gradient-header mb-6 rounded-2xl p-6 text-white shadow-xl">
        <h1 className="heading-font text-2xl font-bold">Dashboard</h1>
        <p className="text-ocean-100 text-sm">Your content at a glance</p>
      </div>

      {/* Quick Actions - Full width on mobile */}
      <div className="mb-6">
        <QuickActionsWidget
          onCreateContent={() => onNavigate('form')}
          onViewCalendar={() => onNavigate('plan', 'plan')}
          onViewApprovals={onOpenApprovals}
          onOpenGuidelines={onOpenGuidelines}
          pendingCount={pendingApprovalCount}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6">
          <WeeklyStatsWidget entries={entries} />
          <ContentPipelineWidget
            entries={entries}
            onNavigate={onNavigate}
          />
        </div>

        {/* Middle Column */}
        <div className="space-y-6">
          <ApprovalQueueWidget
            entries={entries}
            currentUser={currentUser}
            onOpenEntry={onOpenEntry}
            onViewAll={onOpenApprovals}
          />
          <UpcomingDeadlines
            entries={entries}
            onOpenEntry={onOpenEntry}
            daysAhead={7}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6 lg:col-span-2 xl:col-span-1">
          <AssetMixWidget entries={entries} assetGoals={assetGoals} />
          <EngagementProgressWidget
            activities={engagementActivities}
            goals={engagementGoals}
            onNavigate={() => onNavigate('engagement')}
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
```

**Step 2: Update widgets barrel export**

Ensure `src/features/dashboard/widgets/index.ts` exports all widgets:

```typescript
export { ContentPipelineWidget } from './ContentPipelineWidget';
export { WeeklyStatsWidget } from './WeeklyStatsWidget';
export { ApprovalQueueWidget } from './ApprovalQueueWidget';
export { AssetMixWidget } from './AssetMixWidget';
export { EngagementProgressWidget } from './EngagementProgressWidget';
export { QuickActionsWidget } from './QuickActionsWidget';
```

**Step 3: Verify build**

Run: `npm run build 2>&1 | head -30`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/features/dashboard/
git commit -m "feat(dashboard): add DashboardView composing all widgets"
```

---

### Task 9: Integrate DashboardView into App

Replace the menu-style dashboard in app.jsx with the new DashboardView.

**Files:**

- Modify: `src/app.jsx:6036-6300` (approximate)

**Step 1: Import DashboardView at top of app.jsx**

Add near other feature imports:

```javascript
import { DashboardView } from './features/dashboard';
```

**Step 2: Replace dashboard rendering section**

Find the section starting with:

```jsx
{(currentView === 'menu' || currentView === 'dashboard') && (
```

Replace the entire dashboard/menu block (approximately lines 6036-6300) with:

```jsx
{
  (currentView === 'menu' || currentView === 'dashboard') && (
    <DashboardView
      entries={entries}
      currentUser={currentUser}
      assetGoals={assetGoals}
      engagementActivities={engagementActivities}
      engagementGoals={engagementGoals}
      pendingApprovalCount={outstandingCount}
      onOpenEntry={(id) => {
        const entry = entries.find((e) => e.id === id);
        if (entry) {
          setSelectedEntry(entry);
          setDrawerOpen(true);
        }
      }}
      onNavigate={(view, tab) => {
        setCurrentView(view);
        if (tab) setPlanTab(tab);
        closeEntry();
      }}
      onOpenGuidelines={() => setGuidelinesOpen(true)}
      onOpenApprovals={() => setApprovalsModalOpen(true)}
    />
  );
}
```

**Step 3: Verify the app runs**

Run: `npm run dev`
Navigate to dashboard view and verify widgets render.

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/app.jsx
git commit -m "feat(dashboard): integrate DashboardView replacing menu-style layout"
```

---

### Task 10: Fix Icon Imports and Polish

Address any missing icon imports or styling issues.

**Files:**

- Modify: `src/features/dashboard/widgets/QuickActionsWidget.tsx`
- Possibly modify: `src/components/common/index.ts`

**Step 1: Check what icons are available**

Run: `grep -r "export.*Icon" src/components/common/`

**Step 2: Update QuickActionsWidget to use available icons**

If icons don't exist, either:

1. Use existing icons from the codebase
2. Use inline SVG
3. Use text-only buttons

Example fallback using inline SVG:

```typescript
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
```

**Step 3: Run app and verify**

Run: `npm run dev`
Check all widgets render correctly with no console errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "fix(dashboard): resolve icon imports and polish styling"
```

---

### Task 11: Final Testing and Cleanup

**Step 1: Run full build**

```bash
npm run build
```

Expected: No errors

**Step 2: Run linter**

```bash
npm run lint
```

Fix any linting issues.

**Step 3: Manual testing checklist**

- [ ] Dashboard loads without errors
- [ ] Weekly stats show correct this-week data
- [ ] Content pipeline shows correct status counts
- [ ] Clicking pipeline items navigates to filtered view
- [ ] Approval queue shows items for current user
- [ ] Clicking approval items opens entry drawer
- [ ] Deadlines widget shows upcoming items
- [ ] Asset mix shows month's distribution
- [ ] Engagement progress shows weekly goal progress
- [ ] Quick actions all navigate correctly

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(dashboard): complete at-a-glance dashboard implementation"
```

---

## Summary

| Task | Component                | Est. Steps |
| ---- | ------------------------ | ---------- |
| 1    | Directory structure      | 4          |
| 2    | ContentPipelineWidget    | 3          |
| 3    | WeeklyStatsWidget        | 3          |
| 4    | ApprovalQueueWidget      | 3          |
| 5    | AssetMixWidget           | 3          |
| 6    | EngagementProgressWidget | 3          |
| 7    | QuickActionsWidget       | 4          |
| 8    | DashboardView            | 4          |
| 9    | App integration          | 5          |
| 10   | Icon fixes               | 4          |
| 11   | Testing & cleanup        | 4          |

**Total: ~40 steps**
