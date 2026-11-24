# Salon Queue Management System

**Live demo:** https://salon-queue-krutarth078.vercel.app

**Hosted on:** Vercel (frontend + one serverless API function) · SQLite (Turso free tier)

**Staff PIN (Reception / Barber / Admin):** `1234`

> **Staff screens:** tap **Staff** in the top bar of the Home screen (or open `/staff`) and enter PIN 1234.
> Testing outside salon hours (10 AM – 9 PM IST)? Online joining is closed then, as the rules say:
> change the hours in **Settings**, or add a walk-in from **Reception**.
> Settings also has **Add 8 sample customers** to fill the queue for a quick demo.

## Student

| | |
|---|---|
| **Name** | Krutarth Raychura |
| **Student ID** | 202612078 |
| **Assignment** | Lab 11: Salon Queue Management System (vibe coding lab) |
| **Course** | IT603 Introduction to Programming, MSc IT, Semester 1 |
| **Submitted** | 24 November 2026 |

## About
A queue app for **Royal Cuts Salon**. Customers join the queue from their phone, see their
position and estimated wait, and get a full-screen "It's your turn!" alert. The receptionist
runs the queue on a tablet, barbers use their phone to Start / Done, and a TV in the waiting
area shows who is with which barber and who is next. Every screen works in English and Gujarati.

Built as a vibe coding project for IT603 – Intro to Programming (MSc IT, Sem 1).

## Screens
| Screen | URL | Used by |
|---|---|---|
| Home (customer hub) | `/` | Customers |
| Join Queue | `/join` | Customers |
| My Status | `/status/:id` | Customers |
| Reception Dashboard | `/reception` | Receptionist (tablet) — PIN |
| Barber View | `/barber/:name` (e.g. `/barber/ravi`) | Barbers (phone) — PIN |
| Waiting Area TV | `/display` | Waiting area TV |
| Owner Settings | `/admin` | Owner — PIN |
| Staff hub | `/staff` | Any staff member: pick the screen for this device — PIN |

**Navigation:** customers only ever use Home → Join → My ticket (back arrow top-left).
Staff enter once through **Staff** on Home. After that, every staff screen has the same tabs:
**Reception · Barbers · TV display · Settings** (top on a tablet, bottom on a phone).

## Try the main flow (2 minutes)
1. Phone (or mobile view): open `/`, tap **Join Queue**, pick Haircut + Beard trim, **Confirm** → you get a token.
2. Second window: Home → **Staff** → PIN 1234 → **Reception** → your token appears in the waiting list.
3. Third window: Staff → **TV display** → click once to enable sound.
4. Reception: **Call next** on a barber card → the phone shows "It's your turn!", the TV flashes and chimes.
5. Staff → **Barbers** → tap the barber that was called → **Start**, then **Done** → every window updates within ~2 s.

## Project docs
- [AGENTS.md](AGENTS.md) — instructions for the AI coding agent
- [docs/01-brief.md](docs/01-brief.md) — problem, users, must-have and don't-build lists
- [docs/02-screens.md](docs/02-screens.md) — every screen's layout and behaviour
- [docs/03-flows-rules.md](docs/03-flows-rules.md) — flows, queue rules, test checklist
- [prompts.md](prompts.md) — every prompt used, in order
- [reflection.md](reflection.md) — one thing the agent got wrong and how I fixed it

## Tech stack
- React 19 + Vite + Tailwind CSS 4 + React Router
- Fonts: Fraunces (headings), Big Shoulders Display (token numbers), Manrope (text), Hind Vadodara (Gujarati)
- One API endpoint `api/queue.js` (Vercel serverless function), logic in `server/actions.js`
- **SQLite** via Node's built-in `node:sqlite` — no paid database, no extra account
- All queue rules (who's next, position, waiting time, statuses) in one file: `src/lib/queueRules.js`
- Sync: every screen polls the API every 2 seconds
- Labels: `src/i18n/en.js` and `src/i18n/gu.js`

### About storage on Vercel
Vercel functions can't keep a file forever. Without extra setup the SQLite file lives in
`/tmp`, which is fine for light use, but each Vercel instance has its own copy: the queue can
reset after the site sits idle, and under bursts of traffic two devices can see different queues.
The live link runs the same SQLite schema on **Turso** (hosted SQLite, free tier), connected
from Vercel → Storage, which sets `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. The app picks it up
automatically, with no code changes. Both paths pass the same 28-check test script.

## Run locally
Needs Node.js 22.13 or newer (for the built-in `node:sqlite`).

```bash
npm install
npm run dev          # app + API on http://localhost:5173  (database: data/salon.db)
npm run test:rules   # unit tests for the queue rules
npm run build        # production build
```

Optional environment variables: `STAFF_PIN` (default `1234`), `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`.

## Test checklist results
From [docs/03-flows-rules.md](docs/03-flows-rules.md). Checked with an automated API script
(28 checks, run locally and on the live link), 13 unit tests for the queue rules, and by clicking through each screen in
phone, tablet and TV sizes in both languages.

| # | Check | Result |
|---|---|---|
| 1 | Join with 2 services → correct total time and price | ✅ 45 min · ₹230 |
| 2 | Phone with 9 digits → error, can't confirm | ✅ |
| 3 | 4th service → blocked with a message | ✅ |
| 4 | Same phone joins twice → shown existing spot | ✅ (also when sent at the same instant) |
| 5 | Call next for Amit skips a customer who chose Ravi | ✅ |
| 6 | Call next → phone shows "It's your turn" within 5 s | ✅ ~2 s |
| 7 | Start / Done updates Reception and TV within 5 s | ✅ |
| 8 | No-show, then re-add → new token at the END | ✅ (No-show allowed 10 min after calling) |
| 9 | Cancel my spot → people behind move up | ✅ |
| 10 | Close online queue → Join disabled; walk-ins still work | ✅ |
| 11 | Barber on break → Call next disabled, customers see "on break" | ✅ |
| 12 | Turn off a service → disappears from Join | ✅ |
| 13 | Language toggle switches every screen to Gujarati | ✅ |
| 14 | Waiting time goes down as customers finish | ✅ |
| 15 | Phone, tablet and TV stay in sync | ✅ |
| 16 | Wrong PIN → denied; 1234 → opens | ✅ (checked by the server too) |
| 17 | Refreshing any page on the live link works | ✅ `vercel.json` rewrites |

## Author
Krutarth Raychura · 202612078
