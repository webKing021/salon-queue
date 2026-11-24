// All reads and writes of the queue. Every rule check comes from src/lib/queueRules.js.
import crypto from 'node:crypto';
import {
  STATUS,
  MAX_SERVICES,
  NO_SHOW_AFTER_MIN,
  callNextCheck,
  currentOf,
  hoursState,
  salonClock,
  validName,
  validPhone,
  toMinutes,
} from '../src/lib/queueRules.js';

export class QueueError extends Error {
  constructor(code, extra = {}) {
    super(code);
    this.code = code;
    this.extra = extra;
  }
}
const fail = (code, extra) => {
  throw new QueueError(code, extra);
};

const bool = (v) => Number(v) === 1;
const num = (v) => (v === null || v === undefined ? null : Number(v));

function mapSettings(r) {
  return { queueOpen: bool(r.queue_open), openTime: r.open_time, closeTime: r.close_time };
}
function mapBarber(r) {
  return { id: r.id, name: r.name, nameGu: r.name_gu, onDuty: bool(r.on_duty), onBreak: bool(r.on_break) };
}
function mapService(r) {
  return {
    id: Number(r.id),
    nameEn: r.name_en,
    nameGu: r.name_gu,
    minutes: Number(r.minutes),
    price: Number(r.price),
    active: bool(r.active),
  };
}
function mapSpot(r) {
  return {
    id: r.id,
    token: Number(r.token),
    name: r.name,
    phone: r.phone,
    services: JSON.parse(r.services),
    totalMin: Number(r.total_min),
    totalPrice: Number(r.total_price),
    prefBarber: r.pref_barber || null,
    barber: r.barber || null,
    status: r.status,
    walkIn: bool(r.walk_in),
    createdAt: num(r.created_at),
    calledAt: num(r.called_at),
    startedAt: num(r.started_at),
    finishedAt: num(r.finished_at),
  };
}

/** Customers can see the queue, but not other people's phone numbers, surnames or spot ids. */
function publicSpot(s) {
  const { id, phone, ...rest } = s;
  return { ...rest, id: `t${s.token}`, name: s.name.split(' ')[0] };
}

async function loadAll(db, day) {
  const [settings, barbers, services, spots] = await Promise.all([
    db.get(`SELECT * FROM settings WHERE id = 1`),
    db.all(`SELECT * FROM barbers ORDER BY sort`),
    db.all(`SELECT * FROM services ORDER BY sort, id`),
    db.all(`SELECT * FROM spots WHERE day = ? ORDER BY created_at, token`, [day]),
  ]);
  return {
    settings: mapSettings(settings),
    barbers: barbers.map(mapBarber),
    services: services.map(mapService),
    spots: spots.map(mapSpot),
  };
}

/** Spots left over from an earlier day are closed so they never block a phone number. */
async function closeOldDays(db, day) {
  await db.run(`UPDATE spots SET status = 'cancelled' WHERE day <> ? AND status IN ('waiting','called')`, [day]);
  await db.run(`UPDATE spots SET status = 'done' WHERE day <> ? AND status = 'in_chair'`, [day]);
}

export async function getState(db, { staff = false, spotId = null } = {}) {
  const now = Date.now();
  const { day } = salonClock(now);
  await closeOldDays(db, day);
  const data = await loadAll(db, day);
  const hours = hoursState(data.settings, now);
  let mine = null;
  if (spotId) {
    const row = await db.get(`SELECT * FROM spots WHERE id = ?`, [spotId]);
    if (row && row.day === day) mine = mapSpot(row);
  }
  return {
    now,
    day,
    staff,
    settings: { ...data.settings, ...hours },
    barbers: data.barbers,
    services: data.services,
    spots: staff ? data.spots : data.spots.map(publicSpot),
    mine,
  };
}

// ---------------------------------------------------------------- actions

function newId() {
  return crypto.randomBytes(6).toString('base64url');
}

async function nextToken(db, day) {
  // One atomic statement: two people joining at the same moment never share a token.
  const row = await db.get(
    `UPDATE settings
        SET token_no = CASE WHEN token_day = ? THEN token_no + 1 ELSE 1 END,
            token_day = ?
      WHERE id = 1
  RETURNING token_no`,
    [day, day],
  );
  return Number(row.token_no);
}

async function findActiveByPhone(db, phone) {
  const row = await db.get(`SELECT id, token FROM spots WHERE phone = ? AND status IN ('waiting','called')`, [phone]);
  return row ? { id: row.id, token: Number(row.token) } : null;
}

async function join(db, body, staff) {
  const now = Date.now();
  const { day } = salonClock(now);
  const walkIn = Boolean(body.walkIn);
  if (walkIn && !staff) fail('pinRequired');

  const name = String(body.name || '').trim().replace(/\s+/g, ' ');
  const phone = String(body.phone || '').trim();
  if (!validName(name)) fail('badName');
  if (!(walkIn && phone === '') && !validPhone(phone)) fail('badPhone');

  const ids = [...new Set((body.serviceIds || []).map(Number))];
  if (ids.length === 0) fail('noService');
  if (ids.length > MAX_SERVICES) fail('tooManyServices');

  const { settings, barbers, services } = await loadAll(db, day);
  if (!walkIn) {
    const hours = hoursState(settings, now);
    if (!hours.onlineOpen) fail('onlineClosed', { reason: hours.reason });
  }
  const chosen = ids.map((id) => services.find((s) => s.id === id && s.active));
  if (chosen.some((s) => !s)) fail('serviceUnavailable');

  const prefBarber = body.prefBarber || null;
  if (prefBarber && !barbers.some((b) => b.id === prefBarber && b.onDuty)) fail('barberUnavailable');

  if (phone) {
    const existing = await findActiveByPhone(db, phone);
    if (existing) return { existing };
  }

  const token = await nextToken(db, day);
  const id = newId();
  const snapshot = chosen.map((s) => ({ id: s.id, nameEn: s.nameEn, nameGu: s.nameGu, minutes: s.minutes, price: s.price }));
  try {
    await db.run(
      `INSERT INTO spots (id, day, token, name, phone, services, total_min, total_price, pref_barber, walk_in, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, day, token, name, phone, JSON.stringify(snapshot),
        snapshot.reduce((a, s) => a + s.minutes, 0),
        snapshot.reduce((a, s) => a + s.price, 0),
        prefBarber, walkIn ? 1 : 0, now,
      ],
    );
  } catch (err) {
    // Same phone joined twice at the same instant: the unique index stops the duplicate.
    const existing = phone && (await findActiveByPhone(db, phone));
    if (existing) return { existing };
    throw err;
  }
  return { spot: { id, token } };
}

async function cancel(db, body, staff) {
  const row = await db.get(`SELECT * FROM spots WHERE id = ?`, [body.id]);
  if (!row) fail('notFound');
  const r = await db.run(
    `UPDATE spots SET status = 'cancelled', finished_at = ? WHERE id = ? AND status = 'waiting'`,
    [Date.now(), body.id],
  );
  if (!r.changes) fail('cannotCancel');
  return { ok: true, staff };
}

async function callNext(db, body) {
  const now = Date.now();
  const { day } = salonClock(now);
  const { barbers, spots } = await loadAll(db, day);
  const barber = barbers.find((b) => b.id === body.barberId);
  const check = callNextCheck(barber, spots);
  if (!check.ok) fail(check.reason);
  // Conditional update: only succeeds if the customer is still waiting and the barber is still free.
  const r = await db.run(
    `UPDATE spots SET status = 'called', barber = ?, called_at = ?
      WHERE id = ? AND status = 'waiting'
        AND NOT EXISTS (SELECT 1 FROM spots WHERE day = ? AND barber = ? AND status IN ('called','in_chair'))`,
    [barber.id, now, check.spot.id, day, barber.id],
  );
  if (!r.changes) fail('tryAgain');
  return { called: { token: check.spot.token, barberId: barber.id } };
}

async function move(db, id, from, to, column) {
  const r = await db.run(`UPDATE spots SET status = ?, ${column} = ? WHERE id = ? AND status = ?`, [to, Date.now(), id, from]);
  if (!r.changes) fail('wrongStatus');
  return { ok: true };
}

async function noShow(db, body) {
  const row = await db.get(`SELECT * FROM spots WHERE id = ?`, [body.id]);
  if (!row || row.status !== STATUS.CALLED) fail('wrongStatus');
  const waited = (Date.now() - Number(row.called_at)) / 60000;
  if (waited < NO_SHOW_AFTER_MIN) fail('noShowTooEarly');
  return move(db, body.id, STATUS.CALLED, STATUS.NO_SHOW, 'finished_at');
}

async function setBarber(db, body, field) {
  const value = body.value ? 1 : 0;
  if (field === 'on_duty' && !value) {
    const { day } = salonClock();
    const { spots } = await loadAll(db, day);
    if (currentOf(body.barberId, spots)) fail('barberBusy');
  }
  const r = await db.run(`UPDATE barbers SET ${field} = ? WHERE id = ?`, [value, body.barberId]);
  if (!r.changes) fail('notFound');
  return { ok: true };
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
async function setHours(db, body) {
  if (!TIME_RE.test(body.openTime) || !TIME_RE.test(body.closeTime)) fail('badTime');
  if (toMinutes(body.closeTime) <= toMinutes(body.openTime) + 30) fail('badTime');
  await db.run(`UPDATE settings SET open_time = ?, close_time = ? WHERE id = 1`, [body.openTime, body.closeTime]);
  return { ok: true };
}

async function saveService(db, body) {
  const nameEn = String(body.nameEn || '').trim();
  const nameGu = String(body.nameGu || '').trim();
  const minutes = Math.round(Number(body.minutes));
  const price = Math.round(Number(body.price));
  if (!nameEn || !nameGu || nameEn.length > 40 || nameGu.length > 40) fail('badService');
  if (!(minutes >= 5 && minutes <= 240) || !(price >= 0 && price <= 20000)) fail('badService');
  if (body.id) {
    await db.run(`UPDATE services SET name_en = ?, name_gu = ?, minutes = ?, price = ? WHERE id = ?`, [
      nameEn, nameGu, minutes, price, body.id,
    ]);
  } else {
    const { m } = await db.get(`SELECT COALESCE(MAX(sort), 0) AS m FROM services`);
    await db.run(`INSERT INTO services (name_en, name_gu, minutes, price, sort) VALUES (?, ?, ?, ?, ?)`, [
      nameEn, nameGu, minutes, price, Number(m) + 1,
    ]);
  }
  return { ok: true };
}

async function resetDay(db) {
  const { day } = salonClock();
  await db.run(`DELETE FROM spots WHERE day = ?`, [day]);
  await db.run(`UPDATE settings SET token_no = 0, token_day = ? WHERE id = 1`, [day]);
  return { ok: true };
}

const DEMO = [
  ['Meet Patel', '9825011001', [1], null],
  ['Jay Shah', '9825011002', [1, 2], 'ravi'],
  ['Rohan Desai', '9825011003', [7], null],
  ['Dhruv Mehta', '9825011004', [4], 'amit'],
  ['Kunal Joshi', '9825011005', [1], null],
  ['Nirav Trivedi', '9825011006', [3, 6], 'ravi'],
  ['Parth Vyas', '9825011007', [2], null],
  ['Yash Solanki', '9825011008', [1, 2], 'imran'],
];

/** Adds 8 sample customers as walk-ins, spread over the last ~40 minutes, so reception/TV can be tried quickly. */
async function addDemo(db) {
  const { day } = salonClock();
  const { services, barbers } = await loadAll(db, day);
  let added = 0;
  const now = Date.now();
  for (let i = 0; i < DEMO.length; i++) {
    const [name, phone, serviceIds, pref] = DEMO[i];
    const ok = serviceIds.map((id) => services.find((s) => s.id === id && s.active)).filter(Boolean);
    if (!ok.length || (await findActiveByPhone(db, phone))) continue;
    const prefBarber = pref && barbers.some((b) => b.id === pref && b.onDuty) ? pref : null;
    const token = await nextToken(db, day);
    await db.run(
      `INSERT INTO spots (id, day, token, name, phone, services, total_min, total_price, pref_barber, walk_in, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId(), day, token, name, phone,
        JSON.stringify(ok.map((s) => ({ id: s.id, nameEn: s.nameEn, nameGu: s.nameGu, minutes: s.minutes, price: s.price }))),
        ok.reduce((a, s) => a + s.minutes, 0), ok.reduce((a, s) => a + s.price, 0),
        prefBarber, i % 3 === 2 ? 1 : 0, now - (DEMO.length - i) * 5 * 60000 + i,
      ],
    );
    added++;
  }
  return { added };
}

const STAFF_ACTIONS = {
  checkPin: async () => ({ ok: true }),
  callNext: (db, b) => callNext(db, b),
  start: (db, b) => move(db, b.id, STATUS.CALLED, STATUS.IN_CHAIR, 'started_at'),
  done: (db, b) => move(db, b.id, STATUS.IN_CHAIR, STATUS.DONE, 'finished_at'),
  noShow: (db, b) => noShow(db, b),
  setBreak: (db, b) => setBarber(db, b, 'on_break'),
  setDuty: (db, b) => setBarber(db, b, 'on_duty'),
  setQueueOpen: async (db, b) => {
    await db.run(`UPDATE settings SET queue_open = ? WHERE id = 1`, [b.value ? 1 : 0]);
    return { ok: true };
  },
  setHours: (db, b) => setHours(db, b),
  saveService: (db, b) => saveService(db, b),
  toggleService: async (db, b) => {
    await db.run(`UPDATE services SET active = ? WHERE id = ?`, [b.value ? 1 : 0, b.id]);
    return { ok: true };
  },
  resetDay: (db) => resetDay(db),
  addDemo: (db) => addDemo(db),
};

const PUBLIC_ACTIONS = {
  join: (db, b, staff) => join(db, b, staff),
  cancel: (db, b, staff) => cancel(db, b, staff),
};

export async function runAction(db, body, staff) {
  const action = body && body.action;
  if (PUBLIC_ACTIONS[action]) return PUBLIC_ACTIONS[action](db, body, staff);
  if (STAFF_ACTIONS[action]) {
    if (!staff) fail('wrongPin');
    return STAFF_ACTIONS[action](db, body, staff);
  }
  fail('unknownAction');
}
