# PM Dashboard Simplification Plan

## Executive Summary

The PM Dashboard has grown to **10 menu items** with significant feature overlap and ~1,400 lines of dead code. This plan reduces complexity by:

1. **Combining related views** (10 → 6 menu items)
2. **Removing unused features** (~1,400 lines)
3. **Consolidating duplicate data models** (LinkedIn → Entry)
4. **Simplifying navigation** (tabs instead of separate menus)

---

## Current State

| Menu Item  | Lines | Status     | Issue                        |
| ---------- | ----- | ---------- | ---------------------------- |
| Dashboard  | ~500  | Keep       | None                         |
| Analytics  | 443   | Keep       | None                         |
| Engagement | 892   | Keep       | Large but justified          |
| Calendar   | 1,752 | Simplify   | Too many sub-views           |
| Kanban     | 373   | **Merge**  | Duplicate of Calendar        |
| Approvals  | 218   | **Merge**  | Should be in Calendar        |
| Ideas      | 528   | Keep       | Valuable for planning        |
| LinkedIn   | 615   | **Remove** | Duplicate of Entry           |
| Testing    | 554   | **Remove** | Low value, rarely used       |
| Admin      | 442   | Keep       | Essential for access control |

**Unused code to remove:**

- Activity feature (empty)
- Reporting module (400 lines, never integrated)
- Global Search (335 lines, never integrated)
- Influencer Directory (673 lines, never integrated)

---

## Proposed Simplification

### New Navigation Structure (6 items)

```
Dashboard     → At-a-glance overview (keep as-is)
Content       → Calendar + Kanban + Approvals (combined)
Ideas         → Ideas backlog (keep as-is)
Analytics     → Performance metrics (keep as-is)
Engagement    → Community tracking (keep as-is)
Admin         → User management (keep, admin-only)
```

### Changes Explained

#### 1. Merge Calendar + Kanban + Approvals → "Content"

**Current:** 3 separate menu items for the same data
**Proposed:** Single "Content" view with tabs

```
Content
├── Calendar (month/week toggle)
├── Board (kanban view)
└── Approvals (pending items)
```

**Why:** All three views operate on the same Entry data. Users shouldn't need to navigate between menus to see their content in different ways.

**Effort:** Medium (move kanban/approvals into CalendarView as tabs)

#### 2. Remove LinkedIn Drafts

**Current:** Separate data model (LinkedInSubmission) parallel to Entry
**Proposed:** Use Entry with `platform: ['LinkedIn']` filter

**Why:**

- LinkedIn submissions ARE content entries
- Duplicates caption, approval, status fields
- Creates confusion about where to put LinkedIn content

**Migration:**

1. Add migration to convert LinkedInSubmission → Entry
2. Add "LinkedIn only" filter preset to Calendar
3. Remove LinkedInView (615 lines)

**Effort:** Medium (data migration + filter preset)

#### 3. Remove Testing Lab

**Current:** A/B test framework tracker (554 lines)
**Proposed:** Remove entirely OR reduce to simple notes field on Entry

**Why:**

- Specialized feature for small use case
- Can be tracked externally or as entry notes
- Adds complexity for minimal value

**Alternative:** If testing is valuable, add `testingNotes` field to Entry instead of separate feature

**Effort:** Low (delete feature, optional field migration)

#### 4. Remove Unused Features

| Feature              | Lines | Action                                             |
| -------------------- | ----- | -------------------------------------------------- |
| Activity             | 0     | Delete empty directory                             |
| Reporting            | 747   | Delete (MonthlyReportGenerator + PageMetricsPanel) |
| Global Search        | 335   | Delete                                             |
| Influencer Directory | 823   | Delete                                             |

**Total:** ~1,905 lines removed

**Effort:** Low (just delete files)

---

## Implementation Phases

### Phase 1: Remove Dead Code (Low effort, high impact)

**Tasks:**

1. Delete `src/features/activity/` directory
2. Delete `src/features/reporting/MonthlyReportGenerator.tsx`
3. Delete `src/features/reporting/PageMetricsPanel.tsx`
4. Delete `src/features/search/GlobalSearch.tsx`
5. Delete `src/features/influencers/InfluencerDirectory.tsx`
6. Delete `src/features/influencers/CollaboratorPicker.tsx`
7. Remove any imports/references to deleted files
8. Update barrel exports

**Result:** ~1,905 fewer lines to maintain

---

### Phase 2: Consolidate Content Views (Medium effort)

**Tasks:**

1. Rename "Calendar" menu item to "Content"
2. Add tab navigation within Content view:
   - Calendar tab (existing MonthGrid/WeekGrid)
   - Board tab (move KanbanBoard here)
   - Approvals tab (move ApprovalsView here)
3. Remove Kanban from sidebar
4. Remove Approvals from sidebar
5. Update navigation state management
6. Preserve approval badge count on Content menu item

**Result:** 3 menu items → 1 menu item with tabs

---

### Phase 3: Remove LinkedIn Feature (Medium effort)

**Tasks:**

1. Create data migration: LinkedInSubmission → Entry
   - Map `postCopy` → `captions.LinkedIn`
   - Map `status` → Entry status
   - Map `targetDate` → `date`
   - Set `platforms: ['LinkedIn']`
2. Add "LinkedIn" saved filter preset
3. Remove LinkedIn from sidebar
4. Delete `src/features/linkedin/LinkedInView.tsx`
5. Update any references

**Result:** 615 fewer lines, simpler data model

---

### Phase 4: Remove Testing Lab (Low effort)

**Tasks:**

1. Decide: Remove entirely OR convert to Entry field
2. If removing:
   - Delete `src/features/testing/TestingView.tsx`
   - Remove from sidebar
   - Remove TestingFramework type
3. If converting:
   - Add `testingNotes?: string` to Entry
   - Migrate existing TestingFramework data to linked entries
   - Delete TestingView

**Result:** 554 fewer lines

---

## Before/After Comparison

### Menu Items

| Before (10) | After (6)               |
| ----------- | ----------------------- |
| Dashboard   | Dashboard               |
| Analytics   | Analytics               |
| Engagement  | Engagement              |
| Calendar    | **Content** (with tabs) |
| Kanban      | _(merged into Content)_ |
| Approvals   | _(merged into Content)_ |
| Ideas       | Ideas                   |
| LinkedIn    | _(removed)_             |
| Testing     | _(removed)_             |
| Admin       | Admin                   |

### Lines of Code

| Category  | Before | After | Saved            |
| --------- | ------ | ----- | ---------------- |
| Dead code | 1,905  | 0     | 1,905            |
| LinkedIn  | 615    | 0     | 615              |
| Testing   | 554    | 0     | 554              |
| **Total** |        |       | **~3,074 lines** |

### Data Models

| Before             | After                 |
| ------------------ | --------------------- |
| Entry              | Entry                 |
| LinkedInSubmission | _(merged into Entry)_ |
| TestingFramework   | _(removed or field)_  |
| Idea               | Idea                  |
| EngagementActivity | EngagementActivity    |

---

## Risk Assessment

| Change          | Risk                | Mitigation                      |
| --------------- | ------------------- | ------------------------------- |
| Remove LinkedIn | Data loss           | Migration script, backup before |
| Remove Testing  | Feature loss        | Confirm with users first        |
| Merge views     | Broken navigation   | Thorough testing                |
| Delete unused   | Hidden dependencies | Search codebase first           |

---

## Recommendation

**Start with Phase 1** (dead code removal) - zero risk, immediate cleanup.

Then get user feedback on:

1. Is Testing Lab actually used?
2. Is LinkedIn separate workflow necessary?
3. Would combined Content view be preferred?

This allows data-driven decisions on Phases 2-4.

---

## Summary

| Metric         | Before  | After  | Improvement  |
| -------------- | ------- | ------ | ------------ |
| Menu items     | 10      | 6      | 40% fewer    |
| Lines of code  | ~11,000 | ~8,000 | ~3,000 fewer |
| Data models    | 5       | 3      | 40% fewer    |
| Cognitive load | High    | Medium | Significant  |
