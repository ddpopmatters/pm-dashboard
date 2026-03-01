# Content Hub

## Brief

Content management and planning dashboard for PM's social media and comms workflow. Calendar, kanban board, approvals queue, ideas log, LinkedIn submissions, A/B testing, copy optimiser.

## Goals

- Central place for all content planning and approval
- Reduce email back-and-forth on content sign-off
- Give Dan visibility across all content in pipeline
- Enable Fran and Madeleine to self-serve on scheduling

## Audience

- Dan (Digital & Marketing Manager) — oversight, approvals, strategy
- Fran (Content Specialist) — daily content creation and scheduling
- Madeleine (Campaigns & Media Officer) — campaign content
- Potentially wider A&I team for visibility

## Status

Live but lightly adopted. Used occasionally by Fran and Madeleine — needs simplification to drive daily use.

## Scope

**In:** Content calendar, kanban workflow, approval queue, ideas board, LinkedIn submissions, A/B testing frameworks, copy optimiser (OpenAI), activity logging, notifications.

**Out:** Fundraising content (separate team), website CMS, social media publishing (manual post from here).

**Priority:** Simplification — strip complexity to drive adoption before adding features.

**Planned additions (after simplification):**

- Priority tiering system
- Exportable calendar
- New content form UX review

## Technical Decisions

- **Stack:** React 19 + esbuild + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + RLS + Realtime)
- **Hosting:** TBC
- **Legacy:** Cloudflare D1 backend still in codebase but deprecated
- **CI:** GitHub Actions (claude-review.yml — currently blocked by Anthropic OAuth bug)
- **Repo:** github.com/ddpopmatters/content-hub
- **Tests:** 81 tests, Vitest

## Open Questions

- Should the exportable calendar integrate with Google Calendar or just produce .ics files?
- Is the copy optimiser (OpenAI) actively used? Worth keeping/improving?
- Should fundraising team have read access for visibility?

## Dependencies

- Supabase project: "Workstream Tool" (jzalaltexmotkusvqoew)
- OpenAI API key for copy optimiser (optional)
