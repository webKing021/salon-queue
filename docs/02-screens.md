# Salon Queue — Screens & Features

Salon: **Royal Cuts Salon** · Open 10:00 AM – 9:00 PM
Barbers: Ravi, Amit, Imran
Theme: see "Look & navigation" below (v3: porcelain + barber-pole navy and red).
Every label comes from the EN/GU language file. A small `EN | ગુ` toggle sits in the top-right corner of every screen.

## Look & navigation (v2 — after the first build felt generic and hard to find your way around)
- **Visual style (v3):** light porcelain page `#F3F4F1`, white surfaces, pole navy `#1E2A5A` for structure
  and main buttons, pole red `#C8322B` only for "now" moments (It's your turn, Now calling, the called token).
  Green = barber free, amber = on break / waiting long. One font family, **Anek** (Latin + Gujarati):
  condensed extra-bold for token numbers, semi-expanded for the salon name, normal for text.
  The memorable element is a **barber pole** that spins next to the salon name only while the salon is open,
  and fills the waiting progress on the customer's ticket. TV uses a deep navy board with white tokens.
  Sentence case everywhere, no all-caps labels.
- **Two areas, never mixed:**
  - **Customer area** (`/`, `/join`, `/status/:id`): phone layout, back arrow top-left, language toggle top-right.
    Home is the hub; the customer never needs another menu.
  - **Staff area** (`/staff`, `/reception`, `/barber/:name`, `/display`, `/admin`): one PIN, then the
    **same tab bar on every staff screen**: Reception · Barbers · TV display · Settings.
    Tablet/desktop: tabs in the top bar. Phone: tab bar at the bottom (thumb reach).
    Top bar also has "Customer view" and a lock button.
- **One way in for staff:** a clear **[ Staff ]** button in the Home top bar → `/staff`.
- All tap targets at least 44px.

## Usability review (v3.1, walked through as a first-time customer and as staff)
- **Home:** the big number says "N people waiting" and the line under it says "A new customer waits about X min"
  (before, "about 25 min" next to a ticket saying 15 min looked like a contradiction).
  When the salon is closed and empty, the live board is hidden; only "Closed now, opens at…" shows
  (before, it said "Walk right in" with every barber "Free" while closed).
  A finished/cancelled ticket is forgotten on this phone, so Home no longer offers "See my status" for an old visit.
- **Join:** if this phone already has an active ticket, the page shows that ticket and an "Open my ticket" button
  instead of the form (before, the customer filled everything and was only told on Confirm).
- **My Status:** wait is shown as minutes **and** a clock time ("around 4:24 PM"). The pole fills by people ahead
  (3 ahead = 1/4, 1 ahead = 1/2, next = full), so it always moves when the queue moves.
  In chair: shows the services and "Pay ₹X at the counter when you're done".
- **Reception:** confirm pop-ups name the action ("Cancel spot" / "Mark no-show" vs "Keep") instead of Yes/No.
  The walk-in form says "Customer name", not "Your name". "New walk-in: no wait" instead of "~0 min".
- **TV:** stacks into one column on narrow screens; says the salon is closed (and the pole stops) outside hours.
- **404:** says "This page doesn't exist." with a Home button.

## Staff hub (`/staff`)
**Who:** any staff member picking up a device. PIN first.
- Title "Which screen is this device?"
- 4 big cards with device hints: Reception (tablet), Barbers (phone), TV display (TV), Settings (any device)
- Barbers card has one-tap buttons "Open as Ravi / Amit / Imran"

## Services (starting data)

| Service (EN) | Service (GU) | Minutes | Price |
|---|---|---|---|
| Haircut | હેરકટ | 30 | ₹150 |
| Beard trim | દાઢી ટ્રીમ | 15 | ₹80 |
| Shave | શેવિંગ | 20 | ₹100 |
| Hair spa | હેર સ્પા | 45 | ₹400 |
| Hair colour | હેર કલર | 60 | ₹600 |
| Head massage | હેડ મસાજ | 20 | ₹150 |
| Kids haircut | બાળકોનો હેરકટ | 20 | ₹100 |

---

## Screen 1: Home (`/`)
**Who:** customers. **Why:** see how busy the salon is and join the queue.
**Layout (phone, top to bottom):**
- Top bar: logo, **[ Staff ]** button, language toggle
- Salon name; "Open · Closes 9 PM" (green) or "Closed" (grey)
- **Your ticket** (only if this phone is in the queue): paper ticket with token, position and wait → opens My Status
- **Queue right now** card: "6 people waiting" + "about 50 min", then **Now serving**: one row per barber
  with their current token, or Free (green) / On break (grey)
- Big navy button **[ Join the queue ]** with "Expected wait about 50 min" under it → `/join`
- **How it works**: 3 short numbered lines
- **Price list**: every active service with minutes and price (menu style)
- Small link "Already in the queue? See my status" → opens saved status (if this phone has one)
- Footer: links to the staff screens (Reception · Barber · TV · Owner settings) and the
  project credit: **Krutarth Raychura · 202612078** (IT603 lab project)

**States:**
- Online queue closed → Join button disabled, message "Online queue is closed. Please visit the salon."
- No one waiting → live card says "No one waiting — walk right in!"
- This phone already has an active spot → button changes to **[ View my spot ]**

**Tablet / desktop:** same content, centred, max width 480px.

---

## Screen 2: Join Queue (`/join`)
**Who:** customers. **Why:** take a spot in the queue.
**Layout (phone, top to bottom):**
- Back arrow + title "Join the queue"
- **Name** (required, 2–30 letters)
- **Phone** (required, exactly 10 digits, starts with 6–9)
- **Service cards** (multi-select, max 3): each card shows name, minutes, price; selected card turns navy with a tick
- Sections are numbered **1 Your details · 2 Services · 3 Barber** so the order is obvious
- **Barber picker** (list): "Any barber (fastest)" first, then one row per barber on duty with photo and **their own expected wait** ("~25 min"), so the customer can compare. A barber on break shows "On break" but can still be chosen.
- **Live summary bar** (sticky at bottom): "Total 45 min · ₹230 · Expected wait ~35 min" — updates on every tap
- **[ Confirm ]** navy button inside the summary bar → creates the spot and goes to `/status/:id`

**Validation / errors:**
- Phone not 10 digits → red text under the field "Enter a valid 10-digit mobile number"
- No service selected → Confirm disabled
- Tapping a 4th service → small toast "You can pick up to 3 services"
- Phone already has an active spot → pop-up "You are already in the queue as S-14" with button **[ See my spot ]**
- Online queue closed (or less than 30 min to closing) → whole form replaced by the closed message

---

## Screen 3: My Status (`/status/:id`)
**Who:** customer who joined. **Why:** know their turn without sitting in the salon.
**Layout (phone, top to bottom):** the whole spot is shown as a paper ticket.
- Token **S-14** very large
- Position: "4th in line" (or "You're next!" when 1st)
- Barber-pole progress next to the token: the pole fills up as the turn gets closer, with "about 35 min"; updates by itself, no refresh (v3: replaces the circular ring, the pole is the app's one signature element)
- Details card: services, chosen barber, total price to pay at the salon
- If chosen barber is on break → amber note "Ravi is on break"
- **[ Cancel my spot ]** (outline button) → confirmation pop-up "Are you sure? You will lose your place." [Keep my spot] [Yes, cancel]

**Special states:**
- **2nd in line:** navy banner at top "Start coming to the salon"
- **Called:** full-screen pole-red page, white text: "It's your turn! Go to Ravi", gentle pulse animation, phone vibrates
- **In chair:** "You are with Ravi — enjoy!"
- **Done:** "Thank you! See you again" + button back to Home
- **Cancelled / No-show:** grey card with the reason + button **[ Join again ]**
- **Wrong id:** "We couldn't find this spot" + button to Home

---

## Screen 4: Reception Dashboard (`/reception`) — tablet, landscape
**Who:** receptionist / owner. **Why:** run the whole queue from one place. Protected by staff PIN.
**Layout:**
- **Top bar:** staff tabs (see Look & navigation)
- **Toolbar:** "Reception", current time, "Waiting: 8", "New walk-in waits ~20 min", online queue Open/Closed pill (→ Settings), **[ + Add walk-in ]**
- **Barber cards in a 3-column row** (one per barber on duty):
  - Name + photo + status (Free / Busy / On break)
  - Current customer: token, name, services
  - "Time left" progress bar (based on service minutes)
  - **[ Call next ]** — only enabled when the barber is free and has someone eligible to call
  - If a customer is Called but not started: "Called S-14 · 3 min ago" + **[ Start ]** + **[ No-show ]** (enabled after 10 min)
  - In chair: **[ Done ]** (so reception can run a barber who has no phone)
- **Waiting list** below, full width, in order (adds an "Est. wait" column):
  - Columns: token · name · services · preferred barber · waiting time · action **[Cancel]**
  - (No-show is on the barber card, because only a **Called** customer can become a No-show — see rules)
  - Rows waiting more than 60 min have an amber background
  - Walk-ins have a small "Walk-in" tag
- **Add walk-in form** (pop-up): name, phone (optional for walk-ins), services, barber → **[Add to queue]** puts them at the end

**States:**
- Empty list → "No one waiting — walk right in!"
- Every action asks for confirmation only for Cancel and No-show.

---

## Screen 5: Barber View (`/barber/:name`) — phone
- Row of barber name buttons at the top (Ravi · Amit · Imran) to switch in one tap
- The phone remembers its barber, so `/barber` opens straight to them next time
**Who:** each barber. **Why:** see who is in their chair and what's next. Protected by staff PIN.
**Layout (top to bottom):**
- Barber name + toggle **On break / Available**
- **Current customer card:** token, name, services, timer since Start (mm:ss)
- Big buttons (full width, at least 56px tall):
  - Customer is Called → **[ Start ]** (navy)
  - Customer is In chair → **[ Done ]** (green)
  - No customer → **[ Call next ]**
- "Next for you: S-15 Kunal (Haircut)"
- "Served today: 7"

**States:** no one waiting for this barber → "No one waiting for you right now."

---

## Screen 6: Waiting Area TV (`/display`) — 16:9 TV, landscape
**Who:** customers sitting in the salon. **Why:** see who is being served and who is next. No PIN.
**Layout:**
- Header: salon name + clock
- **Left (60%)** — one row per barber on duty: photo, name, "Now: S-12" (or "Free" / "On break")
- **Right (40%)** — "Up next": next 5 tokens with name (first name only) and estimated time "~10 min"
- Footer: "Join from your phone: scan the QR" + QR code of the home page link
- Text readable from 5 metres (token numbers at least 64px)

**Exit:** moving the mouse or tapping shows an "Exit TV mode" button for 4 seconds (→ `/staff`).

**Behaviour:** when a token is called it flashes red for 5 seconds and a short chime plays. (Browser needs one click on the screen to allow sound — show "Tap to enable sound" once.)

---

## Screen 7: Owner Settings (`/admin`)
**Who:** owner. **Why:** set up the day. Protected by staff PIN.
**Layout (tablet/desktop, cards):**
- **Queue switch:** Open / Closed for online joining (walk-ins still allowed)
- **Opening hours:** open time + close time (default 10:00 – 21:00); online joining stops 30 min before closing
- **Barbers on duty today:** one toggle per barber
- **Services list:** name EN, name GU, minutes, price, on/off toggle, [Edit]; **[ + Add service ]**
- **Today's stats cards:** customers served · average wait (min) · no-shows · cancelled
- **[ Reset day ]** — clears today's queue and restarts tokens at S-1 (confirmation pop-up)
- **[ Add 8 sample customers ]** — demo helper so Reception and TV can be tested quickly

**States:** turning a service off hides it from Join immediately; it stays on spots that already have it.

---

## Staff PIN screen
Shown before `/reception`, `/barber/:name` and `/admin`. 4-digit PIN pad, large round keys.
Wrong PIN → shake + "Wrong PIN". Correct PIN is remembered on that device for the day.
Test PIN: **1234** (demo only — written in README).
