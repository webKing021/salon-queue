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
