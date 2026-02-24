PM Dashboard

Overview
- `index.html` (alias of the previous `content-dashboard.html`) is a standalone dashboard powered by React and Tailwind CDN. It now loads the prebuilt bundle in `public/js/content-dashboard.bundle.js`.
- `src/content-dashboard.jsx` is the source for the dashboard bundle; run `npm run build:dashboard` to regenerate the compiled JS.
- `public/js/components/copyCheckSection.js` extracts the Copy Checker UI out of the HTML for easier maintenance. The page aliases it as `CopyCheckSection`.
- `public/js/copyCheckerClient.js` provides a tiny client and exposes `window.copyChecker.runCopyCheck` for the page.
- `api/copy-check.ts` is a serverless endpoint for copy checking (Vercel-compatible).
- `tools/test-copy-check.mjs` runs a quick local smoke test of the API.

API Setup
- Required: set `OPENAI_API_KEY` in your environment.
- Optional: `OPENAI_MODEL` (default `gpt-4o-mini`), `OPENAI_API_BASE` (default `https://api.openai.com/v1`).

Local Testing
- Serve the repo (any static server) and open `content-dashboard.html`.
- To test the API separately:
  - Run your serverless runtime with the `api/` route available (e.g., Vercel dev).
  - Execute: `node tools/test-copy-check.mjs` (uses `ENDPOINT=http://localhost:3000/api/copy-check` by default).

Notes
- The dashboard loads `public/js/copyCheckerClient.js` as a module and falls back to a direct fetch if unavailable.
- The copy checker enforces URL preservation, character limits, banned words, and required phrases.

Dev Tooling (optional)
- Added `package.json`, `.eslintrc.cjs`, `.eslintignore`, `.prettierrc.json`, and `tsconfig.json` to improve code quality.
- When ready to use them, install dev deps (requires network): `npm i` then run `npm run lint`, `npm run format`, `npm run typecheck`, or `npm run build:dashboard`.
