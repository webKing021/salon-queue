# Salon Queue — Flows & Rules

## Flow 1: remote customer
1. Opens Home → taps Join → enters name + phone → picks Haircut + "Any barber" → Confirm.
2. Gets token S-14 and lands on My Status: "6th in line · about 50 min".
3. Watches My Status from home. When 2nd in line, sees the banner "Start coming to the salon".
4. Amit becomes free. Receptionist (or Amit) taps Call next for Amit → S-14 becomes **Called**, assigned to Amit.
5. Customer's phone shows full-screen "It's your turn! Go to Amit" and vibrates. TV flashes S-14 with a chime.
6. Amit taps Start → **In chair**. After the haircut Amit taps Done → **Done**, S-14 leaves the queue.

## Flow 2: walk-in
1. Customer arrives without joining online.
2. Receptionist taps + Add walk-in → name, phone (optional), services, barber → Add.
3. Walk-in gets the next token and joins at the END of the same queue (first come, first served).

## Flow 3: no-show and coming back
1. S-14 is Called but doesn't arrive.
2. After 10 minutes the receptionist can tap No-show → S-14 becomes **No-show**, the barber is free again.
3. If the customer arrives later, the receptionist adds them as a walk-in → they get a NEW token at the END.

## Flow 4: cancel
Customer taps Cancel my spot (or receptionist taps Cancel) → spot becomes **Cancelled**, everyone behind moves up.

## Rules

### Statuses
- `Waiting → Called → In chair → Done`
- `Waiting → Cancelled`
- `Called → No-show`
- `Called → Waiting` is NOT allowed. Statuses never go backwards.
- Only Waiting and Called spots count as "in the queue". Done, Cancelled and No-show are finished.

### Tokens
- Tokens are S-1, S-2, S-3 … for the day. A number is never reused on the same day.
- Reset day (owner) starts again from S-1.
- Two people joining at the same second must still get different tokens.

### Choosing who's next (Call next for barber X)
1. Barber X must be on duty, Available (not on break) and have no customer Called or In chair.
2. From the Waiting list, in order of joining time, pick the FIRST customer whose preferred barber is X or "Any".
3. A customer who chose Ravi is NEVER given to Amit or Imran, even if they wait longer.
4. If no one matches, Call next is disabled and shows "No one waiting for you".
5. A barber has only one customer Called/In chair at a time.

### Position in line
- Position = 1 + number of Waiting customers who joined earlier AND could be served by the same barber(s).
  - "Any" customer: count everyone Waiting ahead.
  - Customer who chose Ravi: count everyone ahead who chose Ravi or "Any".

### Waiting time
- **"Any barber" customer:** (total service minutes of everyone Waiting ahead + minutes left on all current In chair customers) ÷ number of barbers available. Round up to the nearest 5 min.
- **Customer who chose a barber:** minutes of people ahead who chose that barber or "Any" + minutes left on that barber's current customer. Round up to 5 min.
- Barber on break → their minutes still count, show the note "Ravi is on break".
- If the result is 0 and the customer is 1st → show "You're next!", never "0 min" while people are ahead.
- Waiting time must go down as customers finish.

### One spot per phone
- A phone number can have only ONE spot in Waiting or Called status.
- Joining again with the same number shows the existing spot instead of creating a new one.
- The spot id is also saved on the customer's phone so Home can show "View my spot".

### Opening hours
- Salon open 10:00 AM – 9:00 PM by default (owner can change the hours in Owner Settings). Times are India time (IST).
- Online joining closes 30 min before closing (8:30 PM) or when the owner switches the queue to Closed.
- Walk-ins added by reception are still allowed while the online queue is closed.

### Barber on break
- On break → Call next for them is disabled, customers who chose them see "Ravi is on break".
- "Any" customers are served by the other barbers.

### Sync
- Every screen (phone, tablet, TV) updates by itself within 5 seconds of any change. No refresh needed.

### Staff screens
- `/reception`, `/barber/:name`, `/admin` need the 4-digit staff PIN (test PIN 1234).
- The PIN is checked by the server for every staff action, not only by the screen.

### Privacy
- The public queue (Home, TV, My Status) shows first names and tokens only — never phone numbers.

## Test checklist
- [ ] 1. Join with 2 services → correct total time and price shown in the summary
- [ ] 2. Phone with 9 digits → error shown, can't confirm
- [ ] 3. Try to pick a 4th service → blocked with a message
- [ ] 4. Same phone joins twice → shown the existing spot, no duplicate
- [ ] 5. Call next for Amit skips a customer who chose Ravi
- [ ] 6. Call next → customer's phone shows "It's your turn" within 5 s
- [ ] 7. Start / Done on Barber View updates Reception and TV within 5 s
- [ ] 8. No-show, then re-add → new token at the END of the queue
- [ ] 9. Cancel my spot → people behind move up, waiting time drops
- [ ] 10. Close online queue → Join button disabled with a message; walk-ins still work
- [ ] 11. Barber on break → Call next disabled for them, their customers see "on break"
- [ ] 12. Turn off a service in Admin → it disappears from Join
- [ ] 13. Language toggle switches all labels to Gujarati on every screen
- [ ] 14. Waiting time goes down as customers finish
- [ ] 15. Phone, tablet and TV windows all stay in sync
- [ ] 16. Wrong staff PIN → access denied; 1234 → opens
- [ ] 17. Refreshing any page on the live link works (no 404)
