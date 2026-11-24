# Prompts log

Every prompt I used to build this project, in order, including the ones that didn't work out.
Agent: **Claude Code** (it reads `AGENTS.md` through `CLAUDE.md`, the same way Antigravity and Codex do).
I cleaned up spelling and made a few prompts clearer, but the meaning and the order are unchanged.
Under each prompt: what happened, and what I changed afterwards.

---

## Phase 1 — Planning and documents (18 Nov)

### 1. Make a plan before any code
> I have this assignment (`Salon_Queue_Management_Vibe_Coding_Guide.pdf`). It can't be finished in one go,
> so don't write code yet. Read the guide carefully, analyse everything, and make a step-by-step plan that
> follows the instructions in the guide.

**Result:** a plan with deliverables, a day-by-day timeline and the 8 build steps (saved as `../PLAN.md`).
The first storage idea was Firebase Firestore + Vercel.

### 2. Write the four documents
> Go ahead and draft the documents from the guide: `docs/01-brief.md`, `docs/02-screens.md`,
> `docs/03-flows-rules.md` and `AGENTS.md`. Use Royal Cuts Salon with barbers Ravi, Amit and Imran,
> real Indian prices in ₹, and labels in English and Gujarati.

**Result:** first drafts of all four. I reviewed them and edited the wording, the services table and the test
checklist (17 items, more than the 8 the guide asks for).

### 3. Repo and README
> You have the GitHub CLI, so create the repo there and push the docs as the first commit.

> Why didn't you add a README inside the repo?

**What didn't work:** the first push had no README, and the guide needs the live link at the very top of it.
**Result:** public repo `salon-queue`, first commit = docs only (as the guide's checklist says), then a README
with a live-link placeholder.

### 4. Choosing storage
> Can we use SQLite, or anything where I don't have to connect to an external database?

> Go with option A, SQLite, but I don't want to create a Render account.

> Go with option 3, Vercel only.

**Result:** learned that SQLite needs a server that keeps its files, and Vercel functions don't. For now I chose
Vercel serverless functions + Neon Postgres from Vercel's Storage tab, with every screen polling every 2–3 s.
Updated `AGENTS.md` and the README **before** writing any code.

---

## Phase 2 — Build (24 Nov)

### 5. Build the whole app from the docs
> Read `AGENTS.md`, every file in `docs/` and the guide PDF again, then build the project, following build
> steps 1–8. Requirements:
> - Put my name **Krutarth Raychura** and student ID **202612078** on the Home screen.
> - I don't want a paid database. This is only an assignment, so use **SQLite** if possible.
> - It must not look like generic AI-made design: use the charcoal + gold theme properly.
> - Finish everything and test it against the checklist in `docs/03-flows-rules.md` first; commit to GitHub
>   only at the end.

**Result:**
- Storage changed to **SQLite** using Node's built-in `node:sqlite` (no paid service). `AGENTS.md` was updated first.
- One API function `api/queue.js`. All queue rules live in one file, `src/lib/queueRules.js`, used by both the API and the screens.
- All 7 screens, the staff PIN pad, EN/GU language files, and my name + ID in the Home footer.
- Docs updated to match: waiting-list rows only have [Cancel], because the rules say only a Called customer can
  become a No-show; opening hours can be edited in Admin; added an "Add 8 sample customers" demo button.
- Checked with 11 unit tests + a 28-check API script + screenshots of every screen in EN and GU.

**What the agent got wrong, and how it was caught:**
- A customer in the chair showed **0 min left**: the code treated a start time of `0` as "not started".
  A unit test caught it.
- The build failed: it used Tailwind v3 `@apply` on its own classes, and Tailwind v4 needs `@utility`.
- The Join page **scrolled sideways on phones**: a `<fieldset>` doesn't shrink by default. I saw it in a 390 px screenshot.
- **Gujarati letters split apart on the TV**: letter-spacing meant for English capitals broke Gujarati characters.
- **Live link: phone, tablet and TV could each see a different queue.** On Vercel the SQLite file sits in `/tmp`,
  and every Vercel instance has its own copy. Found by sending 20 requests at once: some returned 8 customers,
  others returned 1. The fix needs hosted SQLite (Turso, free), which I had to connect myself.

### 6. Connect Turso and check the live site
> I added Turso from the Vercel Storage tab. Check if the live site works now.

**Result:** 20 parallel requests now all see the same queue, and the full 28-check script passes on the live link.

### 7. Redesign + navigation + check for anything missed
> I don't like the current UI. Use your best design skills and redesign it, keeping the charcoal + gold theme
> from `AGENTS.md`. The navigation is also hard: I have to search the screen to find where things are.
> Make it easy for every user (customer, receptionist, barber, owner): think it through properly first.
> Then read the guide again, and if anything is missing, implement it. Also write `prompts.md` for me from our
> previous chats, cleaning up my prompts.

**Result:**
- **Navigation:** the customer area and staff area are now clearly separate. Home has a visible **Staff** button
  that leads to a new `/staff` hub. Every staff screen shares the same tab bar (Reception · Barbers · TV display ·
  Settings): top tabs on a tablet, bottom tabs on a phone. Barber View has one-tap name buttons and remembers
  which barber uses the phone. The TV shows an "Exit TV mode" button when touched.
- **Design:** tokens became an ivory paper ticket with a perforated edge; numbers use a tall signage font.
  Home is now a hub: your ticket, "Now serving" per barber, Join button with the expected wait, how it works,
  and a price list.
- **From the guide, re-read:** 44 px tap targets everywhere (the language toggle was 36 px); reception barber cards
  in a 3-column row with a time-left bar (the guide's "UI tweak" prompt); Start/Done on reception cards.
- `docs/02-screens.md` was updated first with a new "Look & navigation" section, then the code.

**What the agent got wrong, and how it was caught:**
- Its first stripe at the top of the page looked like yellow **hazard tape**, not a barber pole. I saw it in the
  screenshot and replaced it with a thin gold line.
- **Wrong waiting times.** The new Join screen shows each barber's expected wait, and it showed
  "Ravi ~205 min" while "Any barber" showed ~105 min. The code was following my own rule in `03-flows-rules.md`,
  which counted every "Any" customer as if Ravi alone would serve them. After that fix, "Any barber (fastest)"
  showed 105 min while Imran showed 75 min, so it wasn't the fastest. I rewrote both rules in the doc first:
  a chosen barber counts only a fair share of the "Any" customers, and "Any" takes the fastest barber's time.
  Then the code, plus 2 new unit tests (13 total).

---

## Prompts I'll use if something breaks (from the guide)
- **Bug:** "On `<screen>`, I did `<action>`, and `<what happened>`. Expected: `<what should happen>`. Explain the cause first, then fix it."
- **Verify:** "Go through the test checklist in `docs/03-flows-rules.md`. For each item say pass/fail and how you checked it."
