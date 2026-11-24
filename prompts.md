# Prompts log

Every prompt used to build this project, in order (including ones that didn't work).

## Phase 1 — Planning & docs

### 1. Plan (Claude Code)
> i have this assignment. i know its cannt be complete right now so just think and analayz everything properly and then and make proper step by step plan for making as per the instrucations which is inside the guide pdf.

Result: step-by-step plan (saved as ../PLAN.md). Decided on Firebase Firestore + Vercel.

### 2. Draft docs (Claude Code)
> go ahead

Result: first drafts of AGENTS.md, docs/01-brief.md, docs/02-screens.md, docs/03-flows-rules.md. Reviewed and edited by me.

### 3. Repo + README (Claude Code)
> you have github cli you can create the repo there.
> why didnt you added readme inside the repo?

Result: public repo created, docs pushed as first commit, README with live-link placeholder added.

### 4. Storage choice (Claude Code)
> can we use sqlite or anything where i dont have to connect to any extenal database storage
> go with option A, sqlite but i dont want to create render account
> go with option 3, vercel only

Result: learned SQLite needs an always-on server (Vercel can't keep files), and every free server host
needs an account. Chose Vercel only: serverless functions in `/api` + Neon Postgres from Vercel's
Storage tab, screens poll every 2–3 s. Updated AGENTS.md and README before writing any code.

## Phase 2 — Build
<!-- Add each build prompt here: step number, prompt text, what happened, what you changed. -->

### 5. Build the whole app from the docs (Claude Code)
> start building this assignment project. also at the home screen make sure you add my name "Krutarth Raychura" and my student id: "202612078". READ EVERYTHING PROPERLY ... make sure you complete everything and then after only commit to github ... the site shouldnt look like AI SLOP ... i dont want to use any paid database ... if possible then use sqlite since it is just normal assignment submission project

Result: the agent read AGENTS.md + all docs and built the 8 build-plan steps in one session
(I asked for one commit at the end instead of one per step):
- Storage changed from Neon Postgres to **SQLite** (Node's built-in `node:sqlite`, no paid service).
  On Vercel the file lives in `/tmp`; Turso (free hosted SQLite) can be switched on with 2 env vars.
  AGENTS.md and README updated first.
- One API function `api/queue.js`; all queue rules in `src/lib/queueRules.js`, shared by API and screens.
- 7 screens + staff PIN pad, EN/GU language files, my name and ID in the Home footer.
- Docs updated to match: waiting-list rows have only [Cancel] (rules say only a Called customer can be a
  No-show), opening hours editable in Admin, "Add 8 sample customers" demo button, `/barber` picker.

What the agent got wrong and how it was caught (notes for my reflection):
- **Waiting time showed 0 min for a customer in the chair** in a unit test: the code treated a start
  time of `0` as "not started" (`if (spot.startedAt)`). Caught by the rule test for "chosen barber includes
  minutes left on their current customer"; fixed with `startedAt != null`.
- **Build failed**: it used Tailwind v3 style `@apply` on its own classes; Tailwind v4 needs `@utility`.
- **Join page scrolled sideways on phones**: the barber picker sat inside a `<fieldset>`, which doesn't
  shrink by default. Seen in a 390 px screenshot; fixed with `min-w-0`.
- **Gujarati text broke apart on the TV**: letter-spacing meant for English capitals split Gujarati
  letters ("હ મ ણાં"). Seen in the Gujarati screenshot; letter-spacing turned off for Gujarati.

Verification: `npm run test:rules` (11 unit tests) + an API script for the test checklist (28 checks)
+ a manual no-show → re-add check + screenshots of every screen in phone/tablet/TV sizes, EN and GU.
