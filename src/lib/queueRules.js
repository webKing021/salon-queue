// Queue rules — the ONE place for statuses, who's next, position and waiting time.
// Used by the API (server/actions.js) and by every screen. See docs/03-flows-rules.md.
// Pure functions only: no fetch, no DOM, no database.

export const STATUS = {
  WAITING: 'waiting',
  CALLED: 'called',
  IN_CHAIR: 'in_chair',
  DONE: 'done',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
};

// Allowed moves. Statuses never go backwards.
const MOVES = {
  waiting: ['called', 'cancelled'],
  called: ['in_chair', 'no_show'],
  in_chair: ['done'],
};

export const MAX_SERVICES = 3;
export const NO_SHOW_AFTER_MIN = 10;
export const LONG_WAIT_MIN = 60;
export const ONLINE_CLOSES_BEFORE_MIN = 30;

export function canMove(from, to) {
  return (MOVES[from] || []).includes(to);
}

/** Waiting and Called spots are "in the queue"; everything else is finished. */
export function isActive(spot) {
  return spot.status === STATUS.WAITING || spot.status === STATUS.CALLED;
}

export function byJoinOrder(a, b) {
  return a.createdAt - b.createdAt || a.token - b.token;
}

export function waitingList(spots) {
  return spots.filter((s) => s.status === STATUS.WAITING).sort(byJoinOrder);
}

/** prefBarber null means "Any barber". */
export function canServe(spot, barberId) {
  return !spot.prefBarber || spot.prefBarber === barberId;
}

/** The spot a barber is busy with (Called or In chair), or null. */
export function currentOf(barberId, spots) {
  return (
    spots.find(
      (s) => s.barber === barberId && (s.status === STATUS.CALLED || s.status === STATUS.IN_CHAIR),
    ) || null
  );
}

/** First waiting customer who chose this barber or "Any". */
export function nextFor(barberId, spots) {
  return waitingList(spots).find((s) => canServe(s, barberId)) || null;
}

/** free | busy | break | off */
export function barberState(barber, spots) {
  if (!barber.onDuty) return 'off';
  if (currentOf(barber.id, spots)) return 'busy';
  if (barber.onBreak) return 'break';
  return 'free';
}

/** Can "Call next" run for this barber right now? Returns { ok, reason, spot }. */
export function callNextCheck(barber, spots) {
  if (!barber || !barber.onDuty) return { ok: false, reason: 'offDuty' };
  if (barber.onBreak) return { ok: false, reason: 'onBreak' };
  if (currentOf(barber.id, spots)) return { ok: false, reason: 'busy' };
  const spot = nextFor(barber.id, spots);
  if (!spot) return { ok: false, reason: 'noOne' };
  return { ok: true, spot };
}

export function minutesLeft(spot, now) {
  if (spot.status === STATUS.IN_CHAIR && spot.startedAt != null) {
    const used = (now - spot.startedAt) / 60000;
    return Math.max(0, Math.ceil(spot.totalMin - used));
  }
  if (spot.status === STATUS.CALLED || spot.status === STATUS.WAITING) return spot.totalMin;
  return 0;
}

export function roundUp5(min) {
  return min <= 0 ? 0 : Math.ceil(min / 5) * 5;
}

/** Waiting customers ahead of `spot` who compete for the same barber(s). Tokens are unique per day. */
export function aheadOf(spot, spots) {
  const list = waitingList(spots);
  const idx = list.findIndex((s) => s.token === spot.token);
  const before = idx === -1 ? list : list.slice(0, idx);
  return eligibleAhead(spot.prefBarber, before);
}

function eligibleAhead(prefBarber, list) {
  if (!prefBarber) return list; // "Any": everyone ahead counts
  return list.filter((s) => !s.prefBarber || s.prefBarber === prefBarber);
}

export function position(spot, spots) {
  return aheadOf(spot, spots).length + 1;
}

/**
 * Estimated wait in minutes (rounded up to 5) for someone with `prefBarber`
 * who has `ahead` customers in front of them.
 * - Chosen barber X: minutes of people ahead who chose X
 *                    + X's fair share of "Any" people ahead (their minutes ÷ barbers available)
 *                    + minutes left on X's current customer
 * - Any barber: goes to whichever barber is free first, so the smallest of the
 *               available barbers' waits above.
 */
export function estimateWait(prefBarber, ahead, spots, barbers, now) {
  const onDuty = barbers.filter((b) => b.onDuty);
  const working = onDuty.filter((b) => !b.onBreak);
  const pool = working.length ? working : onDuty;
  const available = pool.length || 1;
  const sumMin = (list) => list.reduce((sum, s) => sum + s.totalMin, 0);
  const anyShare = sumMin(ahead.filter((s) => !s.prefBarber)) / available;
  const forBarber = (id) => {
    const cur = currentOf(id, spots);
    const mine = sumMin(ahead.filter((s) => s.prefBarber === id));
    return mine + anyShare + (cur ? minutesLeft(cur, now) : 0);
  };
  if (prefBarber) return roundUp5(forBarber(prefBarber));
  if (!pool.length) return roundUp5(sumMin(ahead));
  return roundUp5(Math.min(...pool.map((b) => forBarber(b.id))));
}

/** Position + wait for an existing waiting spot. */
export function spotEta(spot, spots, barbers, now) {
  const ahead = aheadOf(spot, spots);
  let wait = estimateWait(spot.prefBarber, ahead, spots, barbers, now);
  // Never show 0 min while people are ahead.
  if (wait === 0 && ahead.length > 0) wait = 5;
  return { position: ahead.length + 1, wait, ahead: ahead.length };
}

/** Preview for someone about to join (Join screen summary). */
export function newcomerEta(prefBarber, spots, barbers, now) {
  const ahead = eligibleAhead(prefBarber, waitingList(spots));
  let wait = estimateWait(prefBarber, ahead, spots, barbers, now);
  if (wait === 0 && ahead.length > 0) wait = 5;
  return { position: ahead.length + 1, wait, ahead: ahead.length };
}

/** Overall "N people waiting · about M min" for Home. */
export function queueSummary(spots, barbers, now) {
  const waiting = waitingList(spots);
  return { waiting: waiting.length, wait: newcomerEta(null, spots, barbers, now).wait };
}

export function totals(services) {
  return services.reduce(
    (acc, s) => ({ minutes: acc.minutes + s.minutes, price: acc.price + s.price }),
    { minutes: 0, price: 0 },
  );
}

// ---------- validation ----------
export const PHONE_RE = /^[6-9]\d{9}$/;
export const NAME_RE = /^[\p{L}\p{M} .'-]{2,30}$/u;

export function validName(name) {
  const n = (name || '').trim();
  return NAME_RE.test(n) && /\p{L}/u.test(n);
}

export function validPhone(phone) {
  return PHONE_RE.test(phone || '');
}

// ---------- opening hours (salon time = India, Asia/Kolkata) ----------
export function salonClock(now = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(now));
  const get = (t) => parts.find((p) => p.type === t).value;
  return {
    day: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

export function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * isOpen: salon open right now (between open and close time)
 * onlineOpen: customers may join from their phone (queue switch on, and
 *             not within 30 min of closing)
 */
export function hoursState(settings, now = Date.now()) {
  const { minutes } = salonClock(now);
  const open = toMinutes(settings.openTime);
  const close = toMinutes(settings.closeTime);
  const isOpen = minutes >= open && minutes < close;
  const beforeLastCall = minutes < close - ONLINE_CLOSES_BEFORE_MIN;
  let reason = null;
  if (!settings.queueOpen) reason = 'switchedOff';
  else if (!isOpen) reason = 'salonClosed';
  else if (!beforeLastCall) reason = 'closingSoon';
  return { isOpen, onlineOpen: reason === null, reason };
}

// ---------- today's stats (Owner Settings) ----------
export function dayStats(spots) {
  const served = spots.filter((s) => s.status === STATUS.DONE);
  const called = spots.filter((s) => s.calledAt);
  const avgWait = called.length
    ? Math.round(called.reduce((sum, s) => sum + (s.calledAt - s.createdAt), 0) / called.length / 60000)
    : 0;
  return {
    served: served.length,
    avgWait,
    noShows: spots.filter((s) => s.status === STATUS.NO_SHOW).length,
    cancelled: spots.filter((s) => s.status === STATUS.CANCELLED).length,
  };
}

export function tokenLabel(token) {
  return `S-${token}`;
}
