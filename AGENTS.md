# AGENTS.md — Salon Queue Management

Queue app for a salon: customers join from their phone, see their wait time
and get called; reception and barbers manage the queue; a TV shows who's next.

## Read first
- docs/01-brief.md -> features + what NOT to build
- docs/02-screens.md -> every screen's layout and behaviour
- docs/03-flows-rules.md -> flows, queue rules, test checklist

## Stack
- Frontend: React + Vite + Tailwind CSS + React Router.
- Backend: ONE Vercel serverless function, `api/queue.js` (GET = state, POST = actions).
  Logic in `server/actions.js`; in dev the same handler is mounted by `vite.config.js`.
- Database: **SQLite** (no paid service). `server/db.js` uses Node's built-in
  `node:sqlite` with a file (`data/salon.db` locally, `/tmp/salon.db` on Vercel).
  Optional: set `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` to use Turso (hosted SQLite,
  free tier) so data survives Vercel restarts. No other database.
- Token numbers (S-1, S-2…) come from one atomic `UPDATE … RETURNING` statement, so two
  people joining at once never get the same token. A partial unique index enforces
  one active spot per phone.
- Sync: every screen polls `/api/queue` every 2 s (must update within 5 s).
  No WebSockets, no Firebase, no other external services.
- Run locally with `npm run dev` (Vite + API together). Rule tests: `npm run test:rules`.
- Hosting: Vercel only. `vercel.json` rewrites every non-`/api` route to `index.html`.
- Live link must be the first line after the title in README.md.

## How to work
- One screen or one feature per task. Don't touch other screens.
- Show your plan and the files you'll create for big steps; wait for my OK.
- Theme (v3): porcelain #F3F4F1 page, white surfaces, pole navy #1E2A5A (structure, main buttons),
  pole red #C8322B only for "now / your turn". Font: Anek Latin + Anek Gujarati. Mobile-first.
  No all-caps labels, no middle-dot strings, no arrows on buttons, sentence case.
- All labels via the EN/GU language file (`src/i18n`); no hard-coded text.
- Queue rules (who's next, position, waiting time, status changes) live in ONE
  file (`src/lib/queueRules.js`) and are reused everywhere.
- Never add features from the 'Don't build' list.
- Tap targets at least 44px on phone screens.
- After each task: list changed files and how to test the change.
