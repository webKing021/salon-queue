# Salon Queue — Screens & Features

Salon: **Royal Cuts Salon** · Open 10:00 AM – 9:00 PM
Barbers: Ravi, Amit, Imran
Theme: charcoal `#1F2937` background, gold `#D4A017` accent, rounded cards, white text.
Every label comes from the EN/GU language file. A small `EN | ગુ` toggle sits in the top-right corner of every screen.

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
- Salon name + scissors logo; badge "Open · Closes 9 PM" (green) or "Closed" (grey)
- Live card: "6 people waiting · about 50 min"
- Barber chips with status: Ravi (busy) · Amit (free) · Imran (on break)
  - busy = gold dot, free = green dot, on break = grey dot
- Big gold button **[ Join Queue ]** → `/join`
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
- **Service cards** (multi-select, max 3): each card shows name, minutes, price; selected card has a gold border + tick
- **Barber picker** (horizontal cards): "Any barber (fastest)" first, then a photo card per barber on duty. A barber on break shows "On break" tag but can still be chosen.
- **Live summary bar** (sticky at bottom): "Total 45 min · ₹230 · Expected wait ~35 min" — updates on every tap
- **[ Confirm ]** gold button inside the summary bar → creates the spot and goes to `/status/:id`

**Validation / errors:**
- Phone not 10 digits → red text under the field "Enter a valid 10-digit mobile number"
- No service selected → Confirm disabled
- Tapping a 4th service → small toast "You can pick up to 3 services"
- Phone already has an active spot → pop-up "You are already in the queue as S-14" with button **[ See my spot ]**
- Online queue closed (or less than 30 min to closing) → whole form replaced by the closed message

---

## Screen 3: My Status (`/status/:id`)
**Who:** customer who joined. **Why:** know their turn without sitting in the salon.
**Layout (phone, top to bottom):**
- Token **S-14** very large in gold
- Position: "4th in line" (or "You're next!" when 1st)
- Circular countdown ring: "about 35 min"; updates by itself, no refresh
- Details card: services, chosen barber, total price to pay at the salon
- If chosen barber is on break → amber note "Ravi is on break"
- **[ Cancel my spot ]** (outline button) → confirmation pop-up "Are you sure? You will lose your place." [Keep my spot] [Yes, cancel]

**Special states:**
- **2nd in line:** gold banner at top "Start coming to the salon"
- **Called:** full-screen gold page, dark text: "It's your turn! Go to Ravi", gentle pulse animation, phone vibrates
- **In chair:** "You are with Ravi — enjoy!"
- **Done:** "Thank you! See you again" + button back to Home
- **Cancelled / No-show:** grey card with the reason + button **[ Join again ]**
- **Wrong id:** "We couldn't find this spot" + button to Home

---

## Screen 4: Reception Dashboard (`/reception`) — tablet, landscape
**Who:** receptionist / owner. **Why:** run the whole queue from one place. Protected by staff PIN.
**Layout:**
- **Top bar:** salon name, current time, "Waiting: 8", **[ + Add walk-in ]** gold button, language toggle
- **Left column (40%) — barber cards**, one per barber on duty:
  - Name + photo + status (Free / Busy / On break)
  - Current customer: token, name, services
  - "Time left" progress bar (based on service minutes)
  - **[ Call next ]** — only enabled when the barber is free and has someone eligible to call
  - If a customer is Called but not started: "Called S-14 · 3 min ago" + **[ No-show ]** (enabled after 10 min)
- **Right column (60%) — waiting list** in order:
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
`/barber` without a name shows the list of barbers to pick from.
**Who:** each barber. **Why:** see who is in their chair and what's next. Protected by staff PIN.
**Layout (top to bottom):**
- Barber name + toggle **On break / Available**
- **Current customer card:** token, name, services, timer since Start (mm:ss)
- Big buttons (full width, at least 56px tall):
  - Customer is Called → **[ Start ]** (gold)
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

**Behaviour:** when a token is called it flashes gold for 5 seconds and a short chime plays. (Browser needs one click on the screen to allow sound — show "Tap to enable sound" once.)

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
Shown before `/reception`, `/barber/:name` and `/admin`. 4-digit PIN pad, gold keys.
Wrong PIN → shake + "Wrong PIN". Correct PIN is remembered on that device for the day.
Test PIN: **1234** (demo only — written in README).
