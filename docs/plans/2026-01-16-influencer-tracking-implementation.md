# Influencer Tracking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add influencer partnership pipeline management with content-linked performance tracking.

**Architecture:** New `influencers` feature module with list view and detail modal. Influencers stored in localStorage following existing patterns. Entry model extended with optional `influencerId` field for content attribution. Performance calculated by comparing linked entry analytics against baseline.

**Tech Stack:** React, TypeScript, existing UI component library (Card, Button, Modal, Badge, etc.)

---

## Task 1: Add Influencer Types

**Files:**

- Modify: `src/types/models.ts`
- Modify: `src/constants.ts`

**Step 1: Add types to models.ts**

Add at the end of `src/types/models.ts`:

```typescript
/**
 * Influencer pipeline status
 */
export type InfluencerStatus = 'Discovery' | 'Outreach' | 'Negotiating' | 'Active' | 'Completed';

/**
 * Influencer record - tracks partnership opportunities
 */
export interface Influencer {
  id: string;
  createdAt: string;
  createdBy: string;

  // Profile info
  name: string;
  handle: string;
  profileUrl: string;
  platform: string;
  followerCount: number;
  engagementRate?: number;

  // Contact & business
  contactEmail: string;
  niche: string;
  estimatedRate?: number;
  notes: string;

  // Pipeline
  status: InfluencerStatus;
}
```

**Step 2: Add influencerId to Entry interface**

In `src/types/models.ts`, find the Entry interface and add after `relatedEntryIds`:

```typescript
  // Influencer attribution
  influencerId?: string;
```

**Step 3: Add constants**

Add to `src/constants.ts`:

```typescript
export const INFLUENCER_STATUSES = [
  'Discovery',
  'Outreach',
  'Negotiating',
  'Active',
  'Completed',
] as const;
export type InfluencerStatusType = (typeof INFLUENCER_STATUSES)[number];

export const INFLUENCER_NICHES = [
  'Tech',
  'Lifestyle',
  'Fitness',
  'Fashion',
  'Food',
  'Travel',
  'Finance',
  'Education',
  'Entertainment',
  'Other',
] as const;
export type InfluencerNiche = (typeof INFLUENCER_NICHES)[number];

export const INFLUENCER_STATUS_COLORS: Record<InfluencerStatusType, string> = {
  Discovery: 'bg-graystone-100 text-graystone-700',
  Outreach: 'bg-blue-100 text-blue-700',
  Negotiating: 'bg-amber-100 text-amber-700',
  Active: 'bg-emerald-100 text-emerald-700',
  Completed: 'bg-purple-100 text-purple-700',
};
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 5: Commit**

```bash
git add src/types/models.ts src/constants.ts
git commit -m "feat(influencers): add Influencer type and constants"
```

---

## Task 2: Add Storage Functions

**Files:**

- Modify: `src/lib/utils.ts`
- Modify: `src/lib/storage.ts`

**Step 1: Add storage key**

In `src/lib/utils.ts`, find the `STORAGE_KEYS` object and add:

```typescript
  INFLUENCERS: 'pm-content-dashboard-influencers',
```

**Step 2: Add sanitizer function**

Create a simple sanitizer. Add to `src/lib/storage.ts` after the imports:

```typescript
import type { Entry, Idea, Influencer, InfluencerStatus } from '../types/models';

const INFLUENCERS_STORAGE_KEY = STORAGE_KEYS.INFLUENCERS;

const VALID_INFLUENCER_STATUSES: InfluencerStatus[] = [
  'Discovery',
  'Outreach',
  'Negotiating',
  'Active',
  'Completed',
];

/**
 * Sanitizes an influencer record from storage
 */
const sanitizeInfluencer = (raw: unknown): Influencer | null => {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string' || !obj.id) return null;
  if (typeof obj.name !== 'string' || !obj.name) return null;

  const status = VALID_INFLUENCER_STATUSES.includes(obj.status as InfluencerStatus)
    ? (obj.status as InfluencerStatus)
    : 'Discovery';

  return {
    id: obj.id,
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString(),
    createdBy: typeof obj.createdBy === 'string' ? obj.createdBy : '',
    name: obj.name,
    handle: typeof obj.handle === 'string' ? obj.handle : '',
    profileUrl: typeof obj.profileUrl === 'string' ? obj.profileUrl : '',
    platform: typeof obj.platform === 'string' ? obj.platform : '',
    followerCount: typeof obj.followerCount === 'number' ? obj.followerCount : 0,
    engagementRate: typeof obj.engagementRate === 'number' ? obj.engagementRate : undefined,
    contactEmail: typeof obj.contactEmail === 'string' ? obj.contactEmail : '',
    niche: typeof obj.niche === 'string' ? obj.niche : '',
    estimatedRate: typeof obj.estimatedRate === 'number' ? obj.estimatedRate : undefined,
    notes: typeof obj.notes === 'string' ? obj.notes : '',
    status,
  };
};
```

**Step 3: Add load/save functions**

Add to `src/lib/storage.ts` after the ideas functions:

```typescript
/**
 * Loads influencers from localStorage
 */
export const loadInfluencers = (): Influencer[] => {
  if (!storageAvailable) return [];
  try {
    const raw = window.localStorage.getItem(INFLUENCERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed.map((item) => sanitizeInfluencer(item)).filter(Boolean) as Influencer[]).sort(
          (a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''),
        )
      : [];
  } catch (error) {
    console.warn('Failed to load influencers', error);
    return [];
  }
};

/**
 * Saves influencers to localStorage
 */
export const saveInfluencers = (influencers: Influencer[]): void => {
  if (!storageAvailable) return;
  try {
    window.localStorage.setItem(INFLUENCERS_STORAGE_KEY, JSON.stringify(influencers));
  } catch (error) {
    console.warn('Failed to persist influencers', error);
  }
};
```

**Step 4: Update import in storage.ts**

Update the import at the top of `src/lib/storage.ts`:

```typescript
import type { Entry, Idea, Influencer, InfluencerStatus } from '../types/models';
```

**Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/lib/utils.ts src/lib/storage.ts
git commit -m "feat(influencers): add storage functions for influencers"
```

---

## Task 3: Create InfluencersView Component

**Files:**

- Create: `src/features/influencers/InfluencersView.tsx`
- Create: `src/features/influencers/index.ts`

**Step 1: Create the main view component**

Create `src/features/influencers/InfluencersView.tsx`:

```typescript
import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  Button,
  Badge,
  Label,
} from '../../components/ui';
import { PlusIcon } from '../../components/common';
import { cx } from '../../lib/utils';
import { selectBaseClasses } from '../../lib/styles';
import {
  ALL_PLATFORMS,
  INFLUENCER_STATUSES,
  INFLUENCER_STATUS_COLORS,
} from '../../constants';
import type { Influencer, Entry } from '../../types/models';

export interface InfluencersViewProps {
  influencers: Influencer[];
  entries: Entry[];
  currentUser: string;
  onAdd: (influencer: Omit<Influencer, 'id' | 'createdAt' | 'createdBy'>) => void;
  onUpdate: (influencer: Influencer) => void;
  onDelete: (id: string) => void;
  onOpenDetail: (id: string) => void;
}

export const InfluencersView: React.FC<InfluencersViewProps> = ({
  influencers,
  entries,
  currentUser,
  onAdd,
  onUpdate,
  onDelete,
  onOpenDetail,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPlatform, setFilterPlatform] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'followers' | 'status' | 'createdAt'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    let result = [...influencers];

    if (filterStatus !== 'All') {
      result = result.filter((i) => i.status === filterStatus);
    }
    if (filterPlatform !== 'All') {
      result = result.filter((i) => i.platform === filterPlatform);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'followers':
          cmp = (a.followerCount || 0) - (b.followerCount || 0);
          break;
        case 'status':
          cmp = INFLUENCER_STATUSES.indexOf(a.status as any) - INFLUENCER_STATUSES.indexOf(b.status as any);
          break;
        case 'createdAt':
        default:
          cmp = (a.createdAt || '').localeCompare(b.createdAt || '');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [influencers, filterStatus, filterPlatform, sortBy, sortDir]);

  const getLinkedEntryCount = (influencerId: string) =>
    entries.filter((e) => e.influencerId === influencerId).length;

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-ocean-900">Influencer Pipeline</CardTitle>
            <p className="text-sm text-graystone-500">
              Track partnership opportunities from discovery to collaboration.
            </p>
          </div>
          <Button onClick={() => onOpenDetail('new')}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Influencer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-graystone-500">Status</Label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={cx(selectBaseClasses, 'px-3 py-1.5 text-sm')}
            >
              <option value="All">All statuses</option>
              {INFLUENCER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-graystone-500">Platform</Label>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className={cx(selectBaseClasses, 'px-3 py-1.5 text-sm')}
            >
              <option value="All">All platforms</option>
              {ALL_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-graystone-200">
          <table className="w-full text-sm">
            <thead className="bg-graystone-50 text-left text-xs uppercase text-graystone-500">
              <tr>
                <th
                  className="cursor-pointer px-4 py-3 hover:bg-graystone-100"
                  onClick={() => handleSort('name')}
                >
                  Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Handle</th>
                <th
                  className="cursor-pointer px-4 py-3 hover:bg-graystone-100"
                  onClick={() => handleSort('followers')}
                >
                  Followers {sortBy === 'followers' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="cursor-pointer px-4 py-3 hover:bg-graystone-100"
                  onClick={() => handleSort('status')}
                >
                  Status {sortBy === 'status' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3">Niche</th>
                <th className="px-4 py-3">Linked Posts</th>
                <th className="px-4 py-3">Est. Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graystone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-graystone-500">
                    No influencers found. Add your first one to get started.
                  </td>
                </tr>
              ) : (
                filtered.map((influencer) => (
                  <tr
                    key={influencer.id}
                    className="cursor-pointer hover:bg-graystone-50"
                    onClick={() => onOpenDetail(influencer.id)}
                  >
                    <td className="px-4 py-3 font-medium text-ocean-900">{influencer.name}</td>
                    <td className="px-4 py-3">{influencer.platform}</td>
                    <td className="px-4 py-3 text-graystone-600">{influencer.handle}</td>
                    <td className="px-4 py-3">{formatFollowers(influencer.followerCount)}</td>
                    <td className="px-4 py-3">
                      <Badge className={INFLUENCER_STATUS_COLORS[influencer.status]}>
                        {influencer.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-graystone-600">{influencer.niche || '—'}</td>
                    <td className="px-4 py-3">{getLinkedEntryCount(influencer.id)}</td>
                    <td className="px-4 py-3">
                      {influencer.estimatedRate ? `$${influencer.estimatedRate}` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
```

**Step 2: Create barrel export**

Create `src/features/influencers/index.ts`:

```typescript
export { InfluencersView, type InfluencersViewProps } from './InfluencersView';
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/features/influencers/
git commit -m "feat(influencers): add InfluencersView table component"
```

---

## Task 4: Create InfluencerModal Component

**Files:**

- Create: `src/features/influencers/InfluencerModal.tsx`
- Modify: `src/features/influencers/index.ts`

**Step 1: Create the modal component**

Create `src/features/influencers/InfluencerModal.tsx`:

```typescript
import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  Button,
  Input,
  Label,
  Textarea,
  Badge,
} from '../../components/ui';
import { TrashIcon, PlatformIcon } from '../../components/common';
import { cx, uuid } from '../../lib/utils';
import { selectBaseClasses } from '../../lib/styles';
import {
  ALL_PLATFORMS,
  INFLUENCER_STATUSES,
  INFLUENCER_NICHES,
  INFLUENCER_STATUS_COLORS,
} from '../../constants';
import type { Influencer, Entry, InfluencerStatus } from '../../types/models';

export interface InfluencerModalProps {
  open: boolean;
  influencer: Influencer | null;
  entries: Entry[];
  currentUser: string;
  onClose: () => void;
  onSave: (influencer: Influencer) => void;
  onDelete: (id: string) => void;
  onLinkEntry: (influencerId: string, entryId: string) => void;
  onUnlinkEntry: (entryId: string) => void;
}

const emptyInfluencer = (): Omit<Influencer, 'id' | 'createdAt' | 'createdBy'> => ({
  name: '',
  handle: '',
  profileUrl: '',
  platform: 'Instagram',
  followerCount: 0,
  engagementRate: undefined,
  contactEmail: '',
  niche: '',
  estimatedRate: undefined,
  notes: '',
  status: 'Discovery',
});

export const InfluencerModal: React.FC<InfluencerModalProps> = ({
  open,
  influencer,
  entries,
  currentUser,
  onClose,
  onSave,
  onDelete,
  onLinkEntry,
  onUnlinkEntry,
}) => {
  const isNew = !influencer;
  const [draft, setDraft] = useState<Omit<Influencer, 'id' | 'createdAt' | 'createdBy'>>(
    emptyInfluencer(),
  );
  const [showLinkPicker, setShowLinkPicker] = useState(false);

  useEffect(() => {
    if (open) {
      if (influencer) {
        const { id, createdAt, createdBy, ...rest } = influencer;
        setDraft(rest);
      } else {
        setDraft(emptyInfluencer());
      }
      setShowLinkPicker(false);
    }
  }, [open, influencer]);

  const linkedEntries = useMemo(
    () => (influencer ? entries.filter((e) => e.influencerId === influencer.id) : []),
    [entries, influencer],
  );

  const availableEntries = useMemo(
    () => entries.filter((e) => !e.influencerId && !e.deletedAt),
    [entries],
  );

  const handleFieldChange = (field: keyof typeof draft, value: unknown) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!draft.name.trim()) return;

    const saved: Influencer = influencer
      ? { ...influencer, ...draft }
      : {
          id: uuid(),
          createdAt: new Date().toISOString(),
          createdBy: currentUser,
          ...draft,
        };
    onSave(saved);
    onClose();
  };

  const handleDelete = () => {
    if (influencer && window.confirm('Delete this influencer? This cannot be undone.')) {
      onDelete(influencer.id);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex h-full max-h-[85vh] flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-graystone-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="heading-font text-lg font-semibold text-ocean-900">
              {isNew ? 'Add Influencer' : draft.name || 'Edit Influencer'}
            </div>
            {!isNew && (
              <Badge className={INFLUENCER_STATUS_COLORS[draft.status as InfluencerStatus]}>
                {draft.status}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <Button variant="ghost" size="sm" onClick={handleDelete}>
                <TrashIcon className="h-4 w-4 text-red-500" />
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!draft.name.trim()}>
              {isNew ? 'Add' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left column - Basic info */}
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="Influencer name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Platform</Label>
                  <select
                    value={draft.platform}
                    onChange={(e) => handleFieldChange('platform', e.target.value)}
                    className={cx(selectBaseClasses, 'w-full px-3 py-2')}
                  >
                    {ALL_PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Handle</Label>
                  <Input
                    value={draft.handle}
                    onChange={(e) => handleFieldChange('handle', e.target.value)}
                    placeholder="@username"
                  />
                </div>
              </div>

              <div>
                <Label>Profile URL</Label>
                <Input
                  value={draft.profileUrl}
                  onChange={(e) => handleFieldChange('profileUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Followers</Label>
                  <Input
                    type="number"
                    value={draft.followerCount || ''}
                    onChange={(e) => handleFieldChange('followerCount', parseInt(e.target.value) || 0)}
                    placeholder="10000"
                  />
                </div>
                <div>
                  <Label>Engagement Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={draft.engagementRate ?? ''}
                    onChange={(e) =>
                      handleFieldChange(
                        'engagementRate',
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                    placeholder="3.5"
                  />
                </div>
              </div>
            </div>

            {/* Right column - Business info */}
            <div className="space-y-4">
              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={draft.contactEmail}
                  onChange={(e) => handleFieldChange('contactEmail', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Niche</Label>
                  <select
                    value={draft.niche}
                    onChange={(e) => handleFieldChange('niche', e.target.value)}
                    className={cx(selectBaseClasses, 'w-full px-3 py-2')}
                  >
                    <option value="">Select niche</option>
                    {INFLUENCER_NICHES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Est. Rate ($)</Label>
                  <Input
                    type="number"
                    value={draft.estimatedRate ?? ''}
                    onChange={(e) =>
                      handleFieldChange(
                        'estimatedRate',
                        e.target.value ? parseInt(e.target.value) : undefined,
                      )
                    }
                    placeholder="500"
                  />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <select
                  value={draft.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  className={cx(selectBaseClasses, 'w-full px-3 py-2')}
                >
                  {INFLUENCER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={draft.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  rows={3}
                  placeholder="Additional notes about this influencer..."
                />
              </div>
            </div>
          </div>

          {/* Linked Entries Section (only for existing influencers) */}
          {!isNew && influencer && (
            <div className="mt-6 border-t border-graystone-200 pt-6">
              <div className="mb-3 flex items-center justify-between">
                <Label className="text-base">Linked Content ({linkedEntries.length})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLinkPicker(!showLinkPicker)}
                >
                  {showLinkPicker ? 'Cancel' : 'Link Entry'}
                </Button>
              </div>

              {showLinkPicker && (
                <div className="mb-4 rounded-xl border border-aqua-200 bg-aqua-50 p-3">
                  <Label className="mb-2 block text-sm">Select entry to link:</Label>
                  <select
                    className={cx(selectBaseClasses, 'w-full px-3 py-2')}
                    onChange={(e) => {
                      if (e.target.value) {
                        onLinkEntry(influencer.id, e.target.value);
                        setShowLinkPicker(false);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">Choose an entry...</option>
                    {availableEntries.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.date} - {entry.caption?.slice(0, 50) || 'No caption'}...
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {linkedEntries.length > 0 ? (
                <div className="space-y-2">
                  {linkedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl border border-graystone-200 bg-white p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {entry.platforms.map((p) => (
                            <PlatformIcon key={p} platform={p} className="h-4 w-4" />
                          ))}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{entry.date}</div>
                          <div className="text-xs text-graystone-500">
                            {entry.caption?.slice(0, 60) || 'No caption'}...
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUnlinkEntry(entry.id)}
                      >
                        Unlink
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-graystone-500">
                  No content linked yet. Link entries to track influencer performance.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
```

**Step 2: Update barrel export**

Update `src/features/influencers/index.ts`:

```typescript
export { InfluencersView, type InfluencersViewProps } from './InfluencersView';
export { InfluencerModal, type InfluencerModalProps } from './InfluencerModal';
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/features/influencers/
git commit -m "feat(influencers): add InfluencerModal for detail/edit view"
```

---

## Task 5: Create InfluencerPicker Component

**Files:**

- Create: `src/features/influencers/InfluencerPicker.tsx`
- Modify: `src/features/influencers/index.ts`

**Step 1: Create the picker component**

Create `src/features/influencers/InfluencerPicker.tsx`:

```typescript
import React from 'react';
import { Label } from '../../components/ui';
import { cx } from '../../lib/utils';
import { selectBaseClasses } from '../../lib/styles';
import type { Influencer } from '../../types/models';

export interface InfluencerPickerProps {
  influencers: Influencer[];
  value: string | undefined;
  onChange: (influencerId: string | undefined) => void;
  showOnlyActive?: boolean;
  label?: string;
  className?: string;
}

export const InfluencerPicker: React.FC<InfluencerPickerProps> = ({
  influencers,
  value,
  onChange,
  showOnlyActive = true,
  label = 'Influencer',
  className,
}) => {
  const filteredInfluencers = showOnlyActive
    ? influencers.filter((i) => i.status === 'Active')
    : influencers;

  return (
    <div className={className}>
      {label && <Label className="mb-1">{label}</Label>}
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={cx(selectBaseClasses, 'w-full px-3 py-2')}
      >
        <option value="">No influencer</option>
        {filteredInfluencers.map((influencer) => (
          <option key={influencer.id} value={influencer.id}>
            {influencer.name} ({influencer.platform})
          </option>
        ))}
      </select>
    </div>
  );
};
```

**Step 2: Update barrel export**

Update `src/features/influencers/index.ts`:

```typescript
export { InfluencersView, type InfluencersViewProps } from './InfluencersView';
export { InfluencerModal, type InfluencerModalProps } from './InfluencerModal';
export { InfluencerPicker, type InfluencerPickerProps } from './InfluencerPicker';
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/features/influencers/
git commit -m "feat(influencers): add InfluencerPicker dropdown component"
```

---

## Task 6: Add Sidebar Navigation

**Files:**

- Modify: `src/components/layout/Sidebar.tsx`

**Step 1: Add icon to iconMap**

In `src/components/layout/Sidebar.tsx`, find the `iconMap` object and add a new icon for influencers:

```typescript
  megaphone: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        d="M11 5.882V19.24a1.76 1.76 0 0 1-3.417.592l-2.147-6.15M18 13a3 3 0 1 0 0-6M5.436 13.683A4.001 4.001 0 0 1 7 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 0 1-1.564-.317"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
```

**Step 2: Add canUseInfluencers prop**

Update the `SidebarProps` interface:

```typescript
export interface SidebarProps {
  // ... existing props
  canUseInfluencers: boolean;
}
```

**Step 3: Add navigation item**

Find the navigation items array/JSX in the component. Add the influencers item after the ideas item (or in an appropriate location):

```typescript
{canUseInfluencers && (
  <button
    onClick={() => onNavigate('influencers')}
    className={cx(
      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
      currentView === 'influencers'
        ? 'bg-ocean-600 text-white'
        : 'text-graystone-600 hover:bg-graystone-100',
    )}
  >
    {iconMap.megaphone}
    Influencers
  </button>
)}
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat(influencers): add Influencers navigation to sidebar"
```

---

## Task 7: Wire Up in app.jsx

**Files:**

- Modify: `src/app.jsx`

**Step 1: Add imports**

Add to the imports section:

```javascript
import { InfluencersView, InfluencerModal, InfluencerPicker } from './features/influencers';
import { loadInfluencers, saveInfluencers } from './lib/storage';
```

**Step 2: Add state**

In the `ContentDashboard` component, add state for influencers:

```javascript
const [influencers, setInfluencers] = useState(() => loadInfluencers());
const [influencerModalOpen, setInfluencerModalOpen] = useState(false);
const [editingInfluencerId, setEditingInfluencerId] = useState(null);
```

**Step 3: Add effect to persist influencers**

Add an effect to save influencers when they change:

```javascript
useEffect(() => {
  saveInfluencers(influencers);
}, [influencers]);
```

**Step 4: Add handler functions**

Add handlers for influencer operations:

```javascript
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
  setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, influencerId: undefined } : e)));
}, []);
```

**Step 5: Add feature flag**

Add to the features check (near other canUse\* variables):

```javascript
const canUseInfluencers = currentUserFeatures.includes('influencers') || currentUserIsAdmin;
```

**Step 6: Update Sidebar props**

Find where Sidebar is rendered and add the new prop:

```jsx
<Sidebar
  // ... existing props
  canUseInfluencers={canUseInfluencers}
/>
```

**Step 7: Add view rendering**

In the view rendering section (where currentView is checked), add:

```jsx
{
  currentView === 'influencers' && canUseInfluencers && (
    <InfluencersView
      influencers={influencers}
      entries={entries}
      currentUser={currentUser}
      onAdd={handleAddInfluencer}
      onUpdate={handleUpdateInfluencer}
      onDelete={handleDeleteInfluencer}
      onOpenDetail={handleOpenInfluencerDetail}
    />
  );
}
```

**Step 8: Add modal rendering**

Add the modal near other modals:

```jsx
<InfluencerModal
  open={influencerModalOpen}
  influencer={
    editingInfluencerId ? influencers.find((i) => i.id === editingInfluencerId) || null : null
  }
  entries={entries}
  currentUser={currentUser}
  onClose={() => {
    setInfluencerModalOpen(false);
    setEditingInfluencerId(null);
  }}
  onSave={handleUpdateInfluencer}
  onDelete={handleDeleteInfluencer}
  onLinkEntry={handleLinkEntryToInfluencer}
  onUnlinkEntry={handleUnlinkEntryFromInfluencer}
/>
```

**Step 9: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 10: Commit**

```bash
git add src/app.jsx
git commit -m "feat(influencers): wire up influencer state and views in app"
```

---

## Task 8: Add Influencer Field to Entry Form

**Files:**

- Modify: `src/features/entry/EntryForm.jsx`

**Step 1: Add influencers prop**

Update the component's props to accept influencers:

```javascript
export function EntryForm({
  // ... existing props
  influencers = [],
  onInfluencerChange,
}) {
```

**Step 2: Add InfluencerPicker import**

Add at the top:

```javascript
import { InfluencerPicker } from '../influencers';
```

**Step 3: Add picker to form**

Find an appropriate location in the form (near campaign/content pillar) and add:

```jsx
{
  influencers.length > 0 && (
    <InfluencerPicker
      influencers={influencers}
      value={draft.influencerId}
      onChange={(id) => {
        setDraft((prev) => ({ ...prev, influencerId: id }));
        onInfluencerChange?.(id);
      }}
      showOnlyActive={true}
      label="Influencer collaboration"
    />
  );
}
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/features/entry/EntryForm.jsx
git commit -m "feat(influencers): add influencer picker to entry form"
```

---

## Task 9: Add Feature Option

**Files:**

- Modify: `src/constants.ts`

**Step 1: Add influencers feature**

Find the `FEATURE_OPTIONS` array and add:

```typescript
  { key: 'influencers', label: 'Influencer tracking' },
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/constants.ts
git commit -m "feat(influencers): add influencers feature option"
```

---

## Task 10: Manual Testing Checklist

**No code changes - manual verification**

Test the following:

1. **Navigation**
   - [ ] Influencers item appears in sidebar (for admin users)
   - [ ] Clicking navigates to influencers view

2. **Influencer CRUD**
   - [ ] Add new influencer via "Add Influencer" button
   - [ ] All fields save correctly
   - [ ] Edit existing influencer
   - [ ] Delete influencer (with confirmation)

3. **List View**
   - [ ] Table displays all influencers
   - [ ] Filter by status works
   - [ ] Filter by platform works
   - [ ] Sorting by name, followers, status works
   - [ ] Click row opens detail modal

4. **Entry Linking**
   - [ ] Link entry to influencer from modal
   - [ ] Unlink entry from influencer
   - [ ] Linked entries count shows in table
   - [ ] Influencer picker appears in entry form
   - [ ] Only "Active" influencers show in entry form picker

5. **Data Persistence**
   - [ ] Influencers persist after page refresh
   - [ ] Entry-influencer links persist after refresh

**Step 1: Run through checklist**

Test each item above in the browser.

**Step 2: Fix any issues found**

If issues are found, fix them and commit with appropriate message.

**Step 3: Final commit (if no issues)**

```bash
git add -A
git commit -m "feat(influencers): complete influencer tracking feature"
```

---

## Summary

This plan creates an influencer tracking feature with:

- **Data model**: Influencer type with pipeline status, Entry extended with influencerId
- **Storage**: localStorage with load/save functions
- **UI**: Table view, detail modal, entry form picker
- **Navigation**: Sidebar item with feature flag

Future enhancements (not in this plan):

- Performance comparison vs. baseline
- Aggregate metrics in influencer modal
- Influencer badge on calendar entries
