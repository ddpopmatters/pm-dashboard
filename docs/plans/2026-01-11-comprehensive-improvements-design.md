# PM Dashboard Comprehensive Improvements Design

**Date:** 2026-01-11
**Status:** Approved - Implementation In Progress
**Author:** Dan Davis + Claude
**Reviewed by:** GPT Plan Reviewer, GPT Architect

## Overview

This document outlines a comprehensive set of improvements to make PM Dashboard ready for team rollout. The improvements address manual entry friction, performance visibility, engagement tracking, workflow simplification, and new capabilities including auto-publishing and influencer management.

### Context

- **Team size:** Small (2-5 people), informal processes
- **Content volume:** Light (1-5 posts/week), growing to moderate (5-15/week)
- **Platforms:** Multi-platform balanced (6 platforms supported)
- **Approval process:** Minimal/informal
- **Key metrics:** Engagement (likes, comments, shares) and reach/awareness
- **Pain points:** Manual data entry, lack of performance insights, no engagement tracking

---

## Feature Categories

| Category                   | Features   | Priority |
| -------------------------- | ---------- | -------- |
| Reduce Manual Entry        | 4 features | High     |
| Analytics Dashboard        | 5 features | High     |
| Engagement Tracking        | 5 features | High     |
| Workflow Simplification    | 5 features | Medium   |
| Content Repurposing        | 4 features | Medium   |
| Zapier Publishing          | 5 features | Medium   |
| Planning & Visibility      | 5 features | Medium   |
| Page Performance & Reports | 6 features | Medium   |
| Influencer Log             | 6 features | Medium   |
| Quality of Life            | 6 features | Low      |

---

## 1. Reduce Manual Entry

### 1.1 Duplicate Entry

**Purpose:** Clone any entry with one click to reduce repetitive data entry.

**Functionality:**

- "Clone" button on entry detail view and in list/calendar context menu
- Creates copy with all fields preserved except date
- User selects new date before saving
- Option to clone as draft regardless of original status

**Data model:** No changes - creates new entry record

**UI location:** Entry detail header, calendar entry context menu

---

### 1.2 Quick-Create from Ideas

**Purpose:** Convert ideas to entries without re-typing content.

**Functionality:**

- "Create Entry" button on idea cards in Ideas board
- Pre-fills entry form with:
  - Idea title → Caption (starting point)
  - Idea links → Entry links
  - Idea attachments → Entry attachments
  - Idea target date → Entry date (if set)
- Marks idea as "converted" with link to created entry

**Data model changes:**

```typescript
interface Idea {
  // existing fields...
  convertedToEntryId?: string;
  convertedAt?: string;
}
```

**UI location:** Ideas board card actions, Idea detail view

---

### 1.3 Draft Auto-Save

**Purpose:** Prevent losing work when navigating away or browser crashes.

**Functionality:**

- Auto-save form state to localStorage every 30 seconds while editing
- On form load, check for unsaved draft
- Prompt: "Resume unsaved draft from [timestamp]?" with Yes/Discard options
- Clear draft on successful save or explicit discard

**Storage key:** `pm_dashboard_draft_entry`

**UI location:** Entry form (invisible, with toast notification on auto-save)

---

### 1.4 Bulk Date Shift

**Purpose:** Reschedule multiple entries at once when plans change.

**Functionality:**

- Multi-select mode on calendar (checkboxes on entries)
- "Shift dates" action in toolbar
- Modal: "Move selected entries by [X] days" (positive or negative)
- Preview showing old → new dates before confirming
- Batch update all selected entries

**UI location:** Calendar toolbar, appears when entries selected

---

## 2. Analytics Dashboard

### 2.1 Dashboard View

**Purpose:** Central place to see performance metrics.

**Functionality:**

- New top-level navigation item: "Analytics"
- Time period selector: This week, This month, Last month, This quarter, Custom range
- Summary cards: Total posts, Avg engagement rate, Total reach, Total engagements

**Data source:** Entry analytics field (populated via CSV import or manual entry)

**UI location:** Main navigation, new view

---

### 2.2 Platform Comparison

**Purpose:** See which platforms perform best.

**Functionality:**

- Bar chart comparing key metrics across platforms
- Metrics: Engagement rate, Reach, Impressions
- For selected time period
- Click platform to filter dashboard to that platform only

**UI location:** Analytics dashboard, main chart area

---

### 2.3 Content Type Breakdown

**Purpose:** Understand what formats and themes resonate.

**Functionality:**

- Pie/donut charts showing:
  - Performance by asset type (Video, Design, Carousel, No asset)
  - Performance by campaign type
  - Performance by content pillar
- Toggle between count and performance view

**UI location:** Analytics dashboard, secondary charts

---

### 2.4 Top Performers Panel

**Purpose:** Surface best content for learning and repurposing.

**Functionality:**

- List of top 5 entries by engagement for selected period
- Shows: thumbnail/preview, caption snippet, platform, engagement count
- Click to open full entry detail
- "Post Again" quick action

**UI location:** Analytics dashboard, sidebar panel

---

### 2.5 Trend Indicators

**Purpose:** Quick insight into what's improving or declining.

**Functionality:**

- Each summary card shows trend vs previous period
- Green up arrow with percentage for improvements
- Red down arrow for declines
- Gray dash for insufficient data

**UI location:** Analytics dashboard summary cards

---

## 3. Engagement Tracking

### 3.1 Engagement Log

**Purpose:** Track proactive engagement with other accounts.

**Functionality:**

- New tab in main navigation: "Engagement"
- Quick-log form:
  - Platform (dropdown)
  - Account (text input with autocomplete from directory)
  - Action type (Comment, Share/Repost, Reply, Like, Follow, DM)
  - Note (optional, brief description)
  - Timestamp (auto-filled, editable)
- List view of recent engagement activities
- Filter by platform, action type, date range

**Data model:**

```typescript
interface EngagementActivity {
  id: string;
  platform: string;
  accountHandle: string;
  accountId?: string; // link to directory
  actionType: 'comment' | 'share' | 'reply' | 'like' | 'follow' | 'dm';
  note?: string;
  createdAt: string;
  createdBy: string;
}
```

**Database:** New `engagement_activities` table

---

### 3.2 Account Directory

**Purpose:** Maintain list of accounts you engage with regularly.

**Functionality:**

- Directory view within Engagement section
- Add account: handle, platform, display name, type/tag, notes
- Types: Ally, Media, Supporter, Prospect, Influencer, Partner, Other
- Edit and delete accounts
- Links to engagement activities for that account

**Data model:**

```typescript
interface EngagementAccount {
  id: string;
  handle: string;
  platform: string;
  displayName?: string;
  type: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Database:** New `engagement_accounts` table

---

### 3.3 Engagement Goals

**Purpose:** Set and track weekly engagement targets.

**Functionality:**

- Settings to define weekly targets per action type
- Example: "20 comments, 10 shares, 5 follows per week"
- Progress bar on Engagement dashboard showing current vs target
- Resets weekly (configurable: Monday or Sunday start)

**Data model:**

```typescript
interface EngagementGoals {
  weeklyComments: number;
  weeklyShares: number;
  weeklyReplies: number;
  weeklyFollows: number;
  weekStartDay: 'monday' | 'sunday';
}
```

**Storage:** Part of Guidelines or separate settings record

---

### 3.4 Activity Summary

**Purpose:** Overview of team engagement for the week/month.

**Functionality:**

- Summary cards: Total activities, by type breakdown
- Chart showing activity over time (daily for week view, weekly for month)
- Team breakdown if multiple users logging

**UI location:** Engagement section header/dashboard

---

### 3.5 Quick-Log from Mobile

**Purpose:** Log engagement on the go.

**Functionality:**

- Mobile-optimized engagement form
- Minimal fields for speed: platform, account, action, optional note
- Large touch targets
- Swipe actions for common operations

**UI location:** Mobile view of Engagement section

---

## 4. Workflow Simplification

### 4.1 Simple Approval Toggle

**Purpose:** Replace complex approval workflow with single action.

**Functionality:**

- Remove multi-stage approval statuses
- Single "Approved" boolean field on entries
- Shows approver name and timestamp when approved
- Optional - entries can publish without approval if not required

**Data model changes:**

```typescript
interface Entry {
  // Remove: statusDetail, workflowStatus with 7 states
  // Add:
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
}
```

**Migration:** Map existing "Approved" statusDetail entries to approved=true

---

### 4.2 Quick Approve from List

**Purpose:** Approve entries without opening full detail view.

**Functionality:**

- Approve button/icon directly on calendar entries and list items
- Single click marks as approved
- Visual change (checkmark, color) indicates approval state
- Undo option (toast with "Undo" action)

**UI location:** Calendar entry cards, Kanban cards, list view rows

---

### 4.3 Batch Approve

**Purpose:** Approve multiple entries at once.

**Functionality:**

- Multi-select mode (same as bulk date shift)
- "Approve selected" action in toolbar
- Confirmation modal showing count
- All selected entries marked approved

**UI location:** Calendar/list toolbar when entries selected

---

### 4.4 Streamlined Kanban

**Purpose:** Reduce cognitive overhead with fewer status columns.

**Functionality:**

- Reduce from 7 statuses to 4:
  - Draft
  - Ready for Review
  - Approved
  - Published
- Migration maps old statuses to new:
  - Draft → Draft
  - Approval required, Awaiting brand/SME approval, Awaiting visual → Ready for Review
  - Approved, Scheduled → Approved
  - Published → Published

**UI location:** Kanban view

---

### 4.5 Consolidate LinkedIn View

**Purpose:** One place for all content instead of separate workflows.

**Functionality:**

- Remove separate LinkedIn Submissions view
- LinkedIn content uses main entry form/calendar
- LinkedIn-specific fields available when LinkedIn platform selected
- Migrate existing LinkedIn submissions to entries

**Migration:**

- Convert linkedin_submissions records to entries
- Map fields: postCopy → caption, etc.
- Mark as platform: ['LinkedIn']

---

## 5. Content Repurposing

### 5.1 Post Again

**Purpose:** Reshare evergreen content easily.

**Functionality:**

- "Post Again" button on published entries
- Opens entry form pre-filled with all content
- User selects new date
- Creates new entry (original preserved)
- Optional: link new entry to original as "reshare"

**UI location:** Entry detail actions, Top Performers panel

---

### 5.2 Adapt for Platform

**Purpose:** Quickly create platform variants of content.

**Functionality:**

- "Adapt for [Platform]" action on entries
- Creates new entry with:
  - Same content, different platform selected
  - Caption adjusted to platform character limit (truncated with warning if over)
  - Suggested hashtag adjustments
- Links entries together as "variants"

**Data model:**

```typescript
interface Entry {
  // Add:
  variantOfId?: string; // original entry this was adapted from
  variantIds?: string[]; // entries adapted from this one
}
```

---

### 5.3 Evergreen Library

**Purpose:** Tag and filter content that can be reshared.

**Functionality:**

- "Evergreen" boolean flag on entries
- Filter option in calendar/list: "Show evergreen only"
- Evergreen tab or filter preset
- Visual indicator on evergreen entries

**Data model:**

```typescript
interface Entry {
  // Add:
  evergreen: boolean;
}
```

---

### 5.4 Related Posts Linking

**Purpose:** Connect entries that are part of same campaign or series.

**Functionality:**

- "Link related post" action on entry detail
- Search/select other entries to link
- Bidirectional linking (both entries show relationship)
- "Related posts" section in entry detail showing linked entries

**Data model:**

```typescript
interface Entry {
  // Add:
  relatedEntryIds?: string[];
}
```

---

## 6. Zapier Publishing Integration

### 6.1 Webhook Configuration

**Purpose:** Connect dashboard to Zapier for auto-publishing.

**Functionality:**

- Settings page section: "Publishing Integration"
- Input field for Zapier webhook URL
- Option for single webhook (Zapier routes by platform) or per-platform webhooks
- Test button to send sample payload and verify connection

**Storage:** Part of Guidelines or separate integration settings

---

### 6.2 Publish Trigger

**Purpose:** Automatically send content to Zapier when ready.

**Functionality:**

- Trigger conditions (configurable):
  - When entry status changes to "Approved" and scheduled time reached
  - Manual "Publish Now" button
- Webhook payload includes:
  ```json
  {
    "entryId": "uuid",
    "platforms": ["Instagram", "Facebook"],
    "caption": "Post caption...",
    "platformCaptions": { "Instagram": "IG specific..." },
    "mediaUrls": ["https://..."],
    "scheduledDate": "2026-01-15T10:00:00Z",
    "hashtags": "#example",
    "firstComment": "First comment text",
    "link": "https://..."
  }
  ```

**Backend:** Supabase Edge Function or client-side fetch to webhook URL

---

### 6.3 Manual Publish Button

**Purpose:** Push content immediately without waiting for schedule.

**Functionality:**

- "Publish Now" button on approved entries
- Confirmation modal: "Publish to [platforms] now?"
- Triggers webhook immediately
- Updates status to "Publishing..."

**UI location:** Entry detail actions (only on approved entries)

---

### 6.4 Publish Status Callback

**Purpose:** Know if publishing succeeded or failed.

**Functionality:**

- Zapier sends callback to dashboard webhook endpoint after attempting publish
- Payload: entryId, platform, success/failure, error message if failed, post URL if success
- Dashboard updates entry:
  - Success: status = "Published", store post URLs
  - Failure: status = "Publish Failed", store error for display

**Data model:**

```typescript
interface Entry {
  // Add:
  publishedUrls?: Record<string, string>; // platform -> post URL
  publishErrors?: Record<string, string>; // platform -> error message
  publishedAt?: string;
}
```

**Backend:** New webhook endpoint to receive callbacks

---

### 6.5 Publishing Status Display

**Purpose:** See publishing state at a glance.

**Functionality:**

- Status indicators: Scheduled, Publishing, Published, Failed
- For multi-platform posts, show per-platform status
- Click failed status to see error and retry
- Published entries show links to live posts

**UI location:** Entry detail, calendar cards, list view

---

## 7. Planning & Visibility

### 7.1 Week View

**Purpose:** Detailed short-term planning view.

**Functionality:**

- 7-day view showing each day as a column
- More detail visible per entry than month view
- Navigate: previous/next week, jump to date
- Same filtering as month view

**UI location:** Calendar view, toggle between Month/Week

---

### 7.2 Content Gaps Indicator

**Purpose:** Spot days with no scheduled content.

**Functionality:**

- Visual indicator on empty days (subtle highlight or icon)
- Configurable target: "Aim for X posts per day/week"
- Warning when below target for upcoming period
- Gap summary in planning sidebar

**Settings:** Target posts per day/week in Guidelines

---

### 7.3 Upcoming Deadlines Panel

**Purpose:** Quick visibility into what needs attention.

**Functionality:**

- Dashboard widget showing entries due in next 7 days
- Grouped by urgency: Overdue, Today, Tomorrow, This week
- Shows: date, platforms, approval status
- Click to open entry

**UI location:** Dashboard view sidebar or top panel

---

### 7.4 Platform Balance View

**Purpose:** Ensure content is distributed across platforms.

**Functionality:**

- Visual showing post count per platform for selected month
- Comparison to target/average
- Highlight platforms that are underserved
- Quick filter to see only entries for specific platform

**UI location:** Calendar sidebar or Analytics dashboard

---

### 7.5 Drag-and-Drop Rescheduling

**Purpose:** Quickly move entries to different dates.

**Functionality:**

- Drag entry card on calendar to new date
- Visual feedback during drag (ghost, drop zone highlight)
- Entry date updates on drop
- Works in both month and week views
- Undo option after drop

**UI location:** Calendar views (month and week)

---

## 8. Page-Level Performance & Reports

### 8.1 Page Metrics Tracking

**Purpose:** Track overall account/page performance, not just individual posts.

**Functionality:**

- New section: "Page Performance" (under Analytics or separate)
- Track per platform per month:
  - Followers/subscribers count
  - Net follower change
  - Page reach
  - Page impressions
  - Profile visits
  - Page engagement rate

**Data model:**

```typescript
interface PageMetrics {
  id: string;
  platform: string;
  month: string; // YYYY-MM
  followers: number;
  followersChange: number;
  reach: number;
  impressions: number;
  profileVisits?: number;
  engagementRate?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Database:** New `page_metrics` table

---

### 8.2 Page Metrics Entry

**Purpose:** Log monthly stats for each platform.

**Functionality:**

- Quick form to enter monthly metrics
- Fields per platform for selected month
- Option to import from CSV
- Edit previous months if needed

**UI location:** Page Performance section

---

### 8.3 Historical Trends

**Purpose:** See growth and performance over time.

**Functionality:**

- Line charts showing metrics over time (6-12 months)
- Follower growth trend per platform
- Reach/impressions trend
- Year-over-year comparison option

**UI location:** Page Performance dashboard

---

### 8.4 Monthly Report Generator

**Purpose:** Create shareable summary of monthly performance.

**Functionality:**

- "Generate Report" button with month selector
- Report includes:
  - Executive summary (key highlights)
  - Page metrics for each platform
  - Top performing posts (top 5)
  - Engagement summary
  - Platform comparison
  - Content type breakdown
  - Notable achievements/milestones
- Commentary field for manual notes/context

**UI location:** Reports section or Analytics

---

### 8.5 PDF Export

**Purpose:** Professional report for stakeholders.

**Functionality:**

- Export generated report as PDF
- Branded layout with Population Matters logo
- Clean, professional design suitable for external sharing
- Charts render as images in PDF
- Download or email options

**Technology:** Client-side PDF generation (e.g., jsPDF, react-pdf)

---

### 8.6 Report Scheduling (Optional)

**Purpose:** Automate monthly report generation.

**Functionality:**

- Setting to auto-generate report on 1st of each month
- Notification when report is ready
- Optional: email report to specified addresses
- Reports saved in dashboard for historical access

**UI location:** Settings

---

## 9. Influencer Log

### 9.1 Influencer Directory

**Purpose:** Database of influencers for potential partnerships.

**Functionality:**

- New section: "Influencers" in main navigation
- List view of all tracked influencers
- Add new influencer with profile details
- Search and filter by platform, status, niche

**Data model:**

```typescript
interface Influencer {
  id: string;
  name: string;
  handles: Record<string, string>; // platform -> handle
  primaryPlatform: string;
  followerCount?: number;
  niche?: string; // e.g., "climate", "lifestyle"
  email?: string;
  agentContact?: string;
  website?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Database:** New `influencers` table

---

### 9.2 Relationship Status Tracking

**Purpose:** Track where you are with each influencer.

**Functionality:**

- Status field: Watching, Contacted, In Discussion, Partnered, Declined, Past Partner
- Interaction log: dated notes of outreach and responses
- Next action field with optional reminder date
- Status history preserved

**Data model:**

```typescript
interface Influencer {
  // Add:
  status: 'watching' | 'contacted' | 'in_discussion' | 'partnered' | 'declined' | 'past_partner';
  nextAction?: string;
  nextActionDate?: string;
  interactions: InfluencerInteraction[];
}

interface InfluencerInteraction {
  id: string;
  date: string;
  type: 'outreach' | 'response' | 'meeting' | 'agreement' | 'note';
  summary: string;
  createdBy: string;
}
```

---

### 9.3 Fit Assessment

**Purpose:** Evaluate potential influencer partnerships.

**Functionality:**

- Assessment fields on influencer profile:
  - Audience alignment (1-5 rating + notes)
  - Content quality (1-5 rating + notes)
  - Brand safety (any concerns?)
  - Estimated rate/cost
- Overall fit score (calculated or manual)

**Data model:**

```typescript
interface Influencer {
  // Add:
  audienceAlignmentRating?: number;
  audienceAlignmentNotes?: string;
  contentQualityRating?: number;
  contentQualityNotes?: string;
  brandSafetyNotes?: string;
  estimatedRate?: string;
  overallFitScore?: number;
}
```

---

### 9.4 Campaign Linking

**Purpose:** Associate influencers with campaigns and content.

**Functionality:**

- Link influencer to entries they collaborated on
- "Collaborator" field on entry form (select from influencer directory)
- Influencer profile shows all linked entries
- Campaign summary shows influencer involvement

**Data model:**

```typescript
interface Entry {
  // Add:
  collaboratorIds?: string[]; // influencer IDs
}
```

---

### 9.5 Partnership Performance

**Purpose:** Track results of influencer collaborations.

**Functionality:**

- Performance section on influencer profile
- Aggregate metrics from linked entries
- Total reach, engagements from collaborative content
- "Would work with again" rating
- ROI notes

**Data model:**

```typescript
interface Influencer {
  // Add:
  workAgainRating?: number; // 1-5
  roiNotes?: string;
}
```

---

### 9.6 Discovery & Tags

**Purpose:** Organize and filter influencer list.

**Functionality:**

- Tags field (multiple): climate, lifestyle, UK-based, micro, macro, etc.
- Source field: how you found them
- Referred by field: who recommended them
- Filter directory by tags, status, platform

**Data model:**

```typescript
interface Influencer {
  // Add:
  tags?: string[];
  source?: string;
  referredBy?: string;
}
```

---

## 10. Quality of Life

### 10.1 Keyboard Shortcuts

**Purpose:** Power-user efficiency.

**Shortcuts:**

- `N` - New entry
- `E` - Edit selected/focused entry
- `A` - Approve selected entry
- `/` or `Cmd+K` - Focus search
- `Esc` - Close modal/panel
- `←` `→` - Navigate calendar (previous/next period)
- `1-6` - Switch main views (if applicable)

**UI:** Help modal showing all shortcuts (`?` to open)

---

### 10.2 Global Search

**Purpose:** Find anything quickly.

**Functionality:**

- Search bar in header (always accessible)
- Searches across: entries, ideas, influencers, engagement accounts
- Results grouped by type
- Recent searches remembered
- Keyboard shortcut to focus (`/` or `Cmd+K`)

**UI location:** Header, persistent

---

### 10.3 Advanced Filters

**Purpose:** Narrow down content views.

**Functionality:**

- Filter panel for calendar/list views
- Filter by: platform, status, campaign, content pillar, date range, author
- Save filter presets for quick access
- Clear all filters button

**UI location:** Calendar/list view toolbar

---

### 10.4 Mobile Responsiveness

**Purpose:** Use dashboard on any device.

**Functionality:**

- Responsive layout for tablet and phone
- Touch-friendly targets
- Simplified navigation on small screens
- Core functions accessible: view calendar, approve entries, log engagement
- Collapsible sidebar on mobile

**Approach:** Progressive enhancement, test on common device sizes

---

### 10.5 Dark Mode

**Purpose:** Comfortable viewing in low light.

**Functionality:**

- Toggle in settings or header
- Respects system preference by default
- Consistent dark theme across all views
- Persists preference in localStorage

**Implementation:** CSS custom properties for theme colors, class toggle on root

---

### 10.6 Export Capabilities

**Purpose:** Get data out of the dashboard.

**Functionality:**

- Export calendar to CSV (selected date range)
- Export analytics summary as CSV
- Export monthly report as PDF (see Section 8.5)
- Full data backup as JSON (all entries, ideas, settings)

**UI location:** Settings, and contextual export buttons in relevant views

---

### 10.7 Notification Preferences

**Purpose:** Control what alerts you.

**Functionality:**

- Settings to enable/disable notifications by type:
  - Approval requests
  - Mentions
  - Publish success/failure
  - Report ready
- Email digest option: immediate, daily summary, or off
- Quiet hours setting (no notifications between X and Y)

**UI location:** Settings

---

## Database Schema Changes Summary

### New Tables

```sql
-- Engagement tracking
CREATE TABLE engagement_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  account_handle TEXT NOT NULL,
  account_id UUID REFERENCES engagement_accounts(id),
  action_type TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE engagement_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT NOT NULL,
  platform TEXT NOT NULL,
  display_name TEXT,
  type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Page-level metrics
CREATE TABLE page_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  month TEXT NOT NULL, -- YYYY-MM
  followers INTEGER,
  followers_change INTEGER,
  reach INTEGER,
  impressions INTEGER,
  profile_visits INTEGER,
  engagement_rate DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, month)
);

-- Influencer management
CREATE TABLE influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  handles JSONB, -- {platform: handle}
  primary_platform TEXT,
  follower_count INTEGER,
  niche TEXT,
  email TEXT,
  agent_contact TEXT,
  website TEXT,
  notes TEXT,
  status TEXT DEFAULT 'watching',
  next_action TEXT,
  next_action_date DATE,
  audience_alignment_rating INTEGER,
  audience_alignment_notes TEXT,
  content_quality_rating INTEGER,
  content_quality_notes TEXT,
  brand_safety_notes TEXT,
  estimated_rate TEXT,
  overall_fit_score INTEGER,
  work_again_rating INTEGER,
  roi_notes TEXT,
  tags TEXT[],
  source TEXT,
  referred_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE influencer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID REFERENCES influencers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  summary TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Entries Table Modifications

```sql
ALTER TABLE entries ADD COLUMN approved BOOLEAN DEFAULT FALSE;
ALTER TABLE entries ADD COLUMN approved_by UUID REFERENCES users(id);
ALTER TABLE entries ADD COLUMN approved_at TIMESTAMPTZ;
ALTER TABLE entries ADD COLUMN evergreen BOOLEAN DEFAULT FALSE;
ALTER TABLE entries ADD COLUMN variant_of_id UUID REFERENCES entries(id);
ALTER TABLE entries ADD COLUMN related_entry_ids UUID[];
ALTER TABLE entries ADD COLUMN collaborator_ids UUID[];
ALTER TABLE entries ADD COLUMN published_urls JSONB;
ALTER TABLE entries ADD COLUMN publish_errors JSONB;
ALTER TABLE entries ADD COLUMN published_at TIMESTAMPTZ;
```

### Ideas Table Modifications

```sql
ALTER TABLE ideas ADD COLUMN converted_to_entry_id UUID REFERENCES entries(id);
ALTER TABLE ideas ADD COLUMN converted_at TIMESTAMPTZ;
```

---

## Implementation Phases

### Phase 1: Foundation (Highest Impact)

1. Duplicate Entry
2. Quick-Create from Ideas
3. Draft Auto-Save
4. Simple Approval Toggle + Quick Approve
5. Streamlined Kanban (4 statuses)

### Phase 2: Analytics & Engagement

1. Analytics Dashboard structure
2. Platform Comparison chart
3. Top Performers panel
4. Engagement Log + Account Directory
5. Engagement Goals

### Phase 3: Publishing & Repurposing

1. Zapier webhook configuration
2. Publish trigger + Manual publish
3. Publish status callback
4. Post Again action
5. Evergreen Library

### Phase 4: Planning & Visibility

1. Week View
2. Drag-and-Drop rescheduling
3. Content Gaps indicator
4. Upcoming Deadlines panel
5. Bulk Date Shift

### Phase 5: Reporting & Influencers

1. Page Metrics tracking
2. Monthly Report generator
3. PDF Export
4. Influencer Directory
5. Relationship Status tracking
6. Campaign Linking

### Phase 6: Polish

1. Global Search
2. Advanced Filters
3. Keyboard Shortcuts
4. Dark Mode
5. Mobile Responsiveness improvements
6. Notification Preferences
7. Consolidate LinkedIn View
8. Remaining features

---

## Success Criteria

Before rollout, the dashboard should:

1. **Reduce entry creation time by 50%** - Templates, duplication, and quick-create measured against baseline
2. **Provide performance visibility** - Team can answer "what's working?" without leaving dashboard
3. **Track all engagement activity** - No more scattered notes or forgotten interactions
4. **Enable one-click publishing** - Content flows to platforms via Zapier without manual copy-paste
5. **Generate stakeholder reports** - Monthly PDF reports ready to share
6. **Work on mobile** - Core functions accessible from phone

---

## Technical Addendum

_Added following GPT Plan Reviewer and Architect consultation on 2026-01-11_

### A1. Serverless Architecture for Callbacks & Scheduling

GitHub Pages serves static files only. All server-side logic runs on **Supabase Edge Functions**.

#### Zapier Callback Flow

```
Entry Approved → Client triggers Zapier webhook
                         ↓
              Zapier posts to platforms
                         ↓
              Zapier calls Supabase Edge Function
                         ↓
              Edge Function updates entry in database
                         ↓
              Client sees updated status on next fetch/realtime subscription
```

**Edge Function: `/functions/v1/publish-callback`**

```typescript
// supabase/functions/publish-callback/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  // Verify request (shared secret in header)
  const authHeader = req.headers.get('x-webhook-secret');
  if (authHeader !== Deno.env.get('WEBHOOK_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { entryId, platform, success, postUrl, error } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Get current entry
  const { data: entry } = await supabase
    .from('entries')
    .select('publish_status')
    .eq('id', entryId)
    .single();

  // Update per-platform status
  const publishStatus = entry?.publish_status || {};
  publishStatus[platform] = {
    status: success ? 'published' : 'failed',
    url: postUrl || null,
    error: error || null,
    timestamp: new Date().toISOString(),
  };

  // Check if all platforms are done
  const allDone = Object.values(publishStatus).every(
    (s: any) => s.status === 'published' || s.status === 'failed',
  );

  await supabase
    .from('entries')
    .update({
      publish_status: publishStatus,
      published_at: allDone ? new Date().toISOString() : null,
    })
    .eq('id', entryId);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**Security:**

- Shared secret in `x-webhook-secret` header
- Zapier configured with secret in webhook URL or headers
- Edge Function validates before processing

#### Report Scheduling

Reports are generated **on-demand** (user clicks "Generate Report"), not auto-scheduled. This avoids serverless cron complexity for a small team.

Optional future enhancement: Supabase pg_cron can trigger Edge Functions on a schedule if auto-generation is needed.

---

### A2. Multi-Platform Publishing Status Schema

When an entry targets multiple platforms, track each platform's publish status independently.

**Schema Change:**

```sql
-- Replace simple published_urls/publish_errors with structured status
ALTER TABLE entries ADD COLUMN publish_status JSONB DEFAULT '{}';

-- Example value:
-- {
--   "Instagram": {"status": "published", "url": "https://...", "error": null, "timestamp": "..."},
--   "Facebook": {"status": "failed", "url": null, "error": "Rate limited", "timestamp": "..."},
--   "LinkedIn": {"status": "pending", "url": null, "error": null, "timestamp": null}
-- }
```

**TypeScript Interface:**

```typescript
interface PlatformPublishStatus {
  status: 'pending' | 'publishing' | 'published' | 'failed';
  url: string | null;
  error: string | null;
  timestamp: string | null;
}

interface Entry {
  // ... existing fields
  publishStatus: Record<string, PlatformPublishStatus>;
}
```

**State Transitions:**

```
Entry Created → publishStatus: {} (empty)
                    ↓
User clicks "Publish" → publishStatus: { "Instagram": { status: "publishing" }, ... }
                    ↓
Zapier callback (success) → publishStatus: { "Instagram": { status: "published", url: "..." } }
Zapier callback (failure) → publishStatus: { "Instagram": { status: "failed", error: "..." } }
```

**UI Display:**

- Show per-platform status badges on entry cards
- Aggregate status: "Published" (all done), "Partial" (some failed), "Publishing" (in progress)
- Click to expand and see per-platform details

---

### A3. Analytics CSV Import Format

**Required Columns:**

| Column        | Type       | Required    | Description                               |
| ------------- | ---------- | ----------- | ----------------------------------------- |
| `entry_id`    | UUID       | Recommended | Direct match to entry                     |
| `date`        | YYYY-MM-DD | Yes         | Post date (fallback matching)             |
| `platform`    | string     | Yes         | Platform name (Instagram, Facebook, etc.) |
| `impressions` | number     | No          | Total impressions                         |
| `reach`       | number     | No          | Unique accounts reached                   |
| `engagements` | number     | No          | Total engagements                         |
| `likes`       | number     | No          | Like/reaction count                       |
| `comments`    | number     | No          | Comment count                             |
| `shares`      | number     | No          | Share/repost count                        |
| `saves`       | number     | No          | Save/bookmark count                       |
| `clicks`      | number     | No          | Link clicks                               |
| `video_views` | number     | No          | Video view count                          |

**Matching Logic:**

1. If `entry_id` provided → direct match
2. Else match by `date` + `platform`
3. If multiple entries match → flag as ambiguous, show in import summary

**Handling Missing Data:**

- Missing numeric columns → store as `null`, display as "-" in UI
- Unknown columns → ignore (logged in import summary)
- Duplicate rows → last value wins, logged as warning

**Storage:**

```sql
-- Store in Entry.analytics JSONB field
-- Example:
-- {
--   "Instagram": { "impressions": 1500, "reach": 1200, "engagements": 89, ... },
--   "Facebook": { "impressions": 800, "reach": 600, "engagements": 45, ... }
-- }
```

---

### A4. Per-Phase Acceptance Criteria

#### Phase 1: Foundation

| Feature                 | Acceptance Criteria                                                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Duplicate Entry         | Click "Clone" on entry → new entry form opens with all fields pre-filled except date → save creates new entry with new ID                                   |
| Quick-Create from Ideas | Click "Create Entry" on idea card → entry form opens with title as caption, links/attachments carried over → save creates entry AND marks idea as converted |
| Draft Auto-Save         | Start editing entry → wait 30s → close browser → reopen → "Resume draft?" prompt appears → click Yes → form restored                                        |
| Simple Approval Toggle  | Click approve button on entry → `approved` becomes true, `approvedBy` and `approvedAt` populated → UI shows approved state                                  |
| Streamlined Kanban      | Kanban shows 4 columns (Draft, Ready for Review, Approved, Published) → drag entry between columns → status updates correctly                               |

#### Phase 2: Analytics & Engagement

| Feature             | Acceptance Criteria                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Analytics Dashboard | Navigate to Analytics → see summary cards (total posts, avg engagement, reach) → change time period → numbers update           |
| Platform Comparison | Analytics shows bar chart → each platform has bar → click platform → dashboard filters to that platform                        |
| Engagement Log      | Navigate to Engagement → fill quick-log form → submit → activity appears in list → filter by platform → list filters correctly |
| Engagement Goals    | Set weekly goal in settings → log activities → progress bar updates → new week starts → progress resets                        |

#### Phase 3: Publishing & Repurposing

| Feature           | Acceptance Criteria                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| Zapier Webhook    | Configure webhook URL in settings → click "Test" → Zapier receives test payload                           |
| Manual Publish    | Click "Publish Now" on approved entry → Zapier webhook fires → entry shows "Publishing" status            |
| Publish Callback  | Zapier calls callback URL → entry status updates to "Published" with post URL within 60s                  |
| Post Again        | Click "Post Again" on published entry → form opens pre-filled → save creates new entry linked to original |
| Evergreen Library | Toggle "Evergreen" on entry → filter "Evergreen only" → only evergreen entries shown                      |

#### Phase 4: Planning & Visibility

| Feature            | Acceptance Criteria                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| Week View          | Toggle to Week view → see 7 days as columns → navigate previous/next week → entries display correctly |
| Drag-and-Drop      | Drag entry to different date on calendar → drop → entry date updates → calendar reflects change       |
| Content Gaps       | Set target "1 post per day" → view calendar → empty days show gap indicator                           |
| Upcoming Deadlines | Dashboard shows "Due soon" panel → entries due in 7 days appear → grouped by urgency                  |

#### Phase 5: Reporting & Influencers

| Feature              | Acceptance Criteria                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| Page Metrics         | Enter monthly metrics for platform → save → view historical chart → data appears correctly        |
| Monthly Report       | Click "Generate Report" → select month → report preview shows with all sections populated         |
| PDF Export           | Click "Export PDF" on report → PDF downloads → opens correctly with charts and branding           |
| Influencer Directory | Add influencer with details → appears in list → filter by tag → influencer shown/hidden correctly |
| Campaign Linking     | Select influencer as collaborator on entry → save → influencer profile shows linked entry         |

#### Phase 6: Polish

| Feature            | Acceptance Criteria                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| Global Search      | Press `/` → search modal opens → type query → results from entries, ideas, influencers appear grouped |
| Keyboard Shortcuts | Press `?` → shortcuts help modal opens → press `N` → new entry form opens                             |
| Dark Mode          | Toggle dark mode → all UI elements switch to dark theme → preference persists on reload               |
| Mobile             | View on phone → sidebar collapses → core actions accessible → touch targets adequate size             |

---

### A5. Access Control Model

For a 2-5 person team with informal processes, minimal role-based access:

**Roles:**

| Role       | Capabilities                                                   |
| ---------- | -------------------------------------------------------------- |
| **Admin**  | All features + user management + settings                      |
| **Editor** | All content features (entries, ideas, engagement, influencers) |
| **Viewer** | Read-only access (future, not implemented in Phase 1-6)        |

**Current Implementation:**

- `user_profiles.is_admin` - boolean flag for admin access
- `user_profiles.is_approver` - boolean flag for approval capability
- `user_profiles.features` - array of enabled feature keys

**Supabase RLS Policies:**

- All authenticated users can read entries, ideas, engagement data
- All authenticated users can create/edit their own content
- Admins can modify all content and manage users

**Rationale:** Small team, high trust environment. Complex permissions add friction without benefit. Revisit if team grows beyond 10 people.

---

## Resolved Questions

1. **Zapier plan limits** - 750 tasks/month available. At 5-15 posts/week across 6 platforms, worst case ~360 tasks/month for publishing. Sufficient headroom.
2. **Historical data** - Start fresh with manual import option for historical metrics via CSV.
3. **Report branding** - No specific requirements yet, will iterate. Use Population Matters logo and ocean/aqua color scheme.

## Open Questions

1. **Platform API access** - Which platforms does your Zapier plan support for posting?
2. **User accounts** - Will all 2-5 team members have individual logins?

---

## Next Steps

1. Review and approve this design document
2. Prioritize phases based on rollout timeline
3. Create detailed implementation plan for Phase 1
4. Set up git worktree for isolated development
5. Begin implementation
