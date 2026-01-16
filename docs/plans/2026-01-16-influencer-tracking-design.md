# Influencer Opportunity Tracking - Design Document

## Overview

Add influencer partnership pipeline management with content-linked performance tracking. Track opportunities from discovery through active collaboration, and measure influencer content performance against organic baseline.

## Data Model

### Influencer Record

```typescript
interface Influencer {
  id: string;
  createdAt: string;
  createdBy: string;

  // Profile info
  name: string;
  handle: string; // @username
  profileUrl: string;
  platform: string; // Instagram, TikTok, YouTube, etc.
  followerCount: number;
  engagementRate?: number; // Percentage

  // Contact & business
  contactEmail: string;
  niche: string; // Tech, Lifestyle, Fitness, etc.
  estimatedRate?: number; // Cost per collaboration
  notes: string;

  // Pipeline
  status: InfluencerStatus;
}

type InfluencerStatus = 'Discovery' | 'Outreach' | 'Negotiating' | 'Active' | 'Completed';
```

### Entry Linkage

Add optional field to existing Entry model:

```typescript
interface Entry {
  // ... existing fields
  influencerId?: string; // Links entry to influencer
}
```

## UI Components

### InfluencersView (Main Table)

- Sortable table with columns: Name, Platform, Handle, Followers, Status, Niche, Est. Rate
- Filter by status and platform
- Click row to open detail modal
- "Add Influencer" button in header
- Status displayed as colored badges

### InfluencerModal (Detail View)

- Header: name, handle, platform icon, status badge
- Editable fields for all influencer properties
- "Linked Entries" section showing associated content
- Button to link existing entries (opens entry picker)
- Performance summary card when entries are linked

### Entry Form Integration

- New optional "Influencer" dropdown in EntryForm
- Shows only influencers with status "Active"
- Placed near campaign/content pillar fields
- Bidirectional: can also link entries from influencer modal

### Navigation

- New "Influencers" item in sidebar

## Performance Tracking

### Baseline Calculation

- Baseline = average performance of entries without influencer link
- Calculated over past 90 days
- Per-metric: reach, impressions, engagement, clicks

### Influencer Performance Display

Shown in influencer detail modal when entries are linked:

- Total linked entries count
- Average reach (with % vs. baseline)
- Average engagement (with % vs. baseline)
- Visual indicators (green = above baseline, red = below)

### Entry-Level Indicators

- Entries linked to influencer show badge in calendar/kanban views
- Entry modal displays linked influencer name

## File Structure

### New Files

```
src/features/influencers/
  index.ts                 # Barrel exports
  InfluencersView.tsx      # Main table view
  InfluencerModal.tsx      # Detail/edit modal
  InfluencerForm.tsx       # Add/edit form fields
  InfluencerPicker.tsx     # Dropdown for entry form
  EntryLinker.tsx          # Modal to link entries to influencer
  PerformanceSummary.tsx   # Stats card component
```

### Modified Files

- `src/types/models.ts` - Add Influencer type, add influencerId to Entry
- `src/features/entry/EntryForm.jsx` - Add influencer dropdown
- `src/features/entry/EntryModal.jsx` - Show linked influencer
- `src/components/layout/Sidebar.tsx` - Add navigation item
- `src/constants.ts` - Add INFLUENCER_STATUSES, INFLUENCER_NICHES
- `src/lib/storage.ts` - Add loadInfluencers, saveInfluencers
- `src/app.jsx` - Wire up state and route to InfluencersView

## Data Storage

- localStorage pattern matching entries/ideas
- Keys: `pm-influencers`
- Backend API integration follows existing useApi patterns

## Pipeline Stages

| Status      | Description                     | Color  |
| ----------- | ------------------------------- | ------ |
| Discovery   | Identified as potential partner | Gray   |
| Outreach    | Initial contact made            | Blue   |
| Negotiating | Discussing terms                | Amber  |
| Active      | Currently collaborating         | Green  |
| Completed   | Partnership ended               | Purple |

## Future Considerations (Out of Scope)

- Contract/agreement document storage
- Payment tracking
- Multi-platform profiles per influencer
- Automated performance reports
- Influencer discovery/search integration
