# Content Hub — Status

**Last updated:** 2026-03-01

## Current State

Live internal tool. React 19 + esbuild + Tailwind + Supabase. 81 tests, CI pipeline. 0 vulnerabilities.

## What's Working

- Content calendar (planning and scheduling posts)
- Kanban board (content workflow stages)
- Content creation form (new entries)
- Approval workflows
- Ideas pipeline
- LinkedIn submission tracking
- Influencer tracking
- Dashboard with activity feed
- Supabase auth + RLS

## Adoption

Used occasionally by Fran and Madeleine. Not embedded in daily workflows yet. **Simplification is the key to driving adoption** — the tool is too complex, not missing features.

## What's Not Working / Known Issues

- Too complex for daily use — simplification is the priority over new features
- New content form needs UX review (backlog item)
- Dashboard is navigation-focused rather than at-a-glance (design exists for improvement)

## Recent Changes

- 2026-02-28: Renamed from "Momentum Hub" / "pm-dashboard" to "Content Hub". GitHub repo renamed to content-hub.
- 2026-02-28: Redundant prototype files removed (kanban-tool-demo.html, kanban-tool-teams.html, PM Productivity Tool.html, .wrangler/)
- Influencer tracking built and working (Jan 2026)
