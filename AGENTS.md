# AGENTS.md — Salon Queue Management

Queue app for a salon: customers join from their phone, see their wait time
and get called; reception and barbers manage the queue; a TV shows who's next.

## Read first
- docs/01-brief.md -> features + what NOT to build
- docs/02-screens.md -> every screen's layout and behaviour
- docs/03-flows-rules.md -> flows, queue rules, test checklist

## Stack
- React + Vite + Tailwind CSS + React Router. Run with `npm run dev`.
- Storage + live sync: Firebase Firestore (real-time listeners), so phone, tablet
  and TV stay in sync without a backend server. Use a transaction for token numbers.
- Firebase config comes from `VITE_FIREBASE_*` environment variables (`.env.local`, never committed).
- Hosting: Vercel. Add `vercel.json` rewrites so every route serves `index.html`.
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
