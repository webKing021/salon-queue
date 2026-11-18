# AGENTS.md — Salon Queue Management

Queue app for a salon: customers join from their phone, see their wait time
and get called; reception and barbers manage the queue; a TV shows who's next.

## Read first
- docs/01-brief.md -> features + what NOT to build
- docs/02-screens.md -> every screen's layout and behaviour
- docs/03-flows-rules.md -> flows, queue rules, test checklist

## Stack
- Frontend: React + Vite + Tailwind CSS + React Router.
- Backend: Vercel serverless functions in the `/api` folder of this same repo (Node).
- Database: Neon Postgres, added from the Vercel dashboard (Storage tab). Use
  `@neondatabase/serverless` with SQL queries. Connection string comes from the
  `DATABASE_URL` environment variable (`.env.local` locally, never committed).
- Token numbers (S-1, S-2…) must be given out inside one SQL transaction / atomic
  update, so two people joining at once never get the same token.
- Sync: every screen polls the API every 2–3 seconds (must update within 5 s).
  No WebSockets, no Firebase, no other external services.
- Run locally with `vercel dev` (runs Vite + `/api` together).
- Hosting: Vercel only. `vercel.json` rewrites every non-`/api` route to `index.html`.
- Live link must be the first line after the title in README.md.

## How to work
- One screen or one feature per task. Don't touch other screens.
- Show your plan and the files you'll create for big steps; wait for my OK.
- Theme: charcoal (#1F2937) + gold (#D4A017); rounded cards; mobile-first.
- All labels via the EN/GU language file (`src/i18n`); no hard-coded text.
- Queue rules (who's next, position, waiting time, status changes) live in ONE
  file (`src/lib/queueRules.js`) and are reused everywhere.
- Never add features from the 'Don't build' list.
- Tap targets at least 44px on phone screens.
- After each task: list changed files and how to test the change.
