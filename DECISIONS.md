# Content Hub — Decisions Log

## Architecture

**React 19 + esbuild + Tailwind + Supabase**

- SPA with esbuild bundler (no Vite — simpler build)
- Supabase for auth, database, and RLS
- Supabase project: jzalaltexmotkusvqoew ("Workstream Tool" on Supabase dashboard)
- Note: Supabase project name doesn't match tool name (historical naming)

**Renamed from pm-dashboard / Momentum Hub (2026-02-28)**

- GitHub repo: ddpopmatters/content-hub
- Name reflects actual purpose: content management dashboard for Fran and Madeleine

## Pending Decisions

**Unity Hub integration approach**

- Currently standalone app with own Supabase backend
- When Unity Hub unification happens: embed as module or migrate to shared platform?
- Auth would need to consolidate (currently Supabase auth, Unity Hub uses Cloudflare Access)

**Supabase vs D1**

- Same question as PM Productivity Tool — does the data layer consolidate under Unity Hub?
- Two Supabase projects currently serving two tools is redundant long-term
