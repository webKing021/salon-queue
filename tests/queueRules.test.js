// Run: npm run test:rules
import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../src/lib/queueRules.js';

const barbers = [
  { id: 'ravi', name: 'Ravi', onDuty: true, onBreak: false },
  { id: 'amit', name: 'Amit', onDuty: true, onBreak: false },
  { id: 'imran', name: 'Imran', onDuty: true, onBreak: false },
];
let n = 0;
const spot = (o) => ({ id: `x${++n}`, token: n, status: 'waiting', prefBarber: null, barber: null, totalMin: 30, createdAt: n * 1000, ...o });

test('statuses never go backwards', () => {
  assert.ok(R.canMove('waiting', 'called'));
  assert.ok(R.canMove('waiting', 'cancelled'));
  assert.ok(R.canMove('called', 'no_show'));
  assert.ok(!R.canMove('called', 'waiting'));
  assert.ok(!R.canMove('done', 'waiting'));
  assert.ok(!R.canMove('waiting', 'no_show'));
});

test('Call next for Amit skips a customer who chose Ravi', () => {
  n = 0;
  const spots = [spot({ prefBarber: 'ravi' }), spot({ prefBarber: null }), spot({ prefBarber: 'amit' })];
  const c = R.callNextCheck(barbers[1], spots);
  assert.equal(c.ok, true);
  assert.equal(c.spot.token, 2);
  assert.equal(R.callNextCheck(barbers[0], spots).spot.token, 1);
});

test('a Ravi customer is never given to another barber', () => {
  n = 0;
  const spots = [spot({ prefBarber: 'ravi' })];
  assert.equal(R.callNextCheck(barbers[1], spots).reason, 'noOne');
  assert.equal(R.callNextCheck(barbers[2], spots).reason, 'noOne');
});

test('barber busy or on break cannot call next', () => {
  n = 0;
  const spots = [spot({ status: 'in_chair', barber: 'ravi', startedAt: 0 }), spot()];
  assert.equal(R.callNextCheck(barbers[0], spots).reason, 'busy');
  assert.equal(R.callNextCheck({ ...barbers[1], onBreak: true }, spots).reason, 'onBreak');
  assert.equal(R.callNextCheck({ ...barbers[1], onDuty: false }, spots).reason, 'offDuty');
});

test('position counts only competing customers', () => {
  n = 0;
  const a = spot({ prefBarber: 'amit' });
  const b = spot({ prefBarber: null });
  const c = spot({ prefBarber: 'ravi' });
  const spots = [a, b, c];
  assert.equal(R.position(c, spots), 2); // only the Any customer is ahead for Ravi
  const d = spot({ prefBarber: null });
  assert.equal(R.position(d, [...spots, d]), 4); // Any: everyone ahead
});

test('waiting time: Any = minutes ahead ÷ barbers available, rounded up to 5', () => {
  n = 0;
  const spots = [spot({ totalMin: 30 }), spot({ totalMin: 45 }), spot({ totalMin: 15 })];
  const me = spot({ totalMin: 30 });
  const all = [...spots, me];
  assert.equal(R.spotEta(me, all, barbers, 0).wait, 30); // 90 / 3
  const oneOnBreak = barbers.map((b) => (b.id === 'imran' ? { ...b, onBreak: true } : b));
  assert.equal(R.spotEta(me, all, oneOnBreak, 0).wait, 45); // 90 / 2
});

test('waiting time: chosen barber includes minutes left on their current customer', () => {
  n = 0;
  const now = 10 * 60000;
  const cur = spot({ status: 'in_chair', barber: 'ravi', startedAt: 0, totalMin: 30 }); // 20 left
  const me = spot({ prefBarber: 'ravi', totalMin: 30 });
  assert.equal(R.spotEta(me, [cur, me], barbers, now).wait, 20);
});

test('waiting time: chosen barber counts only a fair share of Any customers ahead', () => {
  n = 0;
  const anyA = spot({ totalMin: 30 });
  const anyB = spot({ totalMin: 30 });
  const ravi1 = spot({ prefBarber: 'ravi', totalMin: 15 });
  const me = spot({ prefBarber: 'ravi', totalMin: 30 });
  // 15 (Ravi) + 60 / 3 barbers (Any share) = 35 -> 35
  assert.equal(R.spotEta(me, [anyA, anyB, ravi1, me], barbers, 0).wait, 35);
});

test('Any barber is never slower than the fastest single barber', () => {
  n = 0;
  const spots = [
    spot({ prefBarber: 'ravi', totalMin: 45 }),
    spot({ prefBarber: 'ravi', totalMin: 45 }),
    spot({ prefBarber: 'amit', totalMin: 30 }),
    spot({ prefBarber: null, totalMin: 30 }),
    spot({ status: 'in_chair', barber: 'imran', startedAt: 0, totalMin: 20 }),
  ];
  const any = R.newcomerEta(null, spots, barbers, 0).wait;
  for (const b of barbers) assert.ok(any <= R.newcomerEta(b.id, spots, barbers, 0).wait, b.id);
});

test('never 0 min while people are ahead; 1st with 0 → You are next', () => {
  n = 0;
  const free = [{ id: 'ravi', onDuty: true, onBreak: false }];
  const first = spot({ totalMin: 0 });
  const me = spot();
  const r = R.spotEta(me, [first, me], free, 0);
  assert.equal(r.position, 2);
  assert.ok(r.wait > 0);
  assert.deepEqual(R.spotEta(first, [first, me], free, 0), { position: 1, wait: 0, ahead: 0 });
});

test('waiting time goes down as customers finish', () => {
  n = 0;
  const a = spot();
  const me = spot();
  const before = R.spotEta(me, [a, me], barbers, 0).wait;
  const after = R.spotEta(me, [{ ...a, status: 'done' }, me], barbers, 0).wait;
  assert.ok(after < before);
});

test('validation', () => {
  assert.ok(R.validPhone('9876543210'));
  assert.ok(!R.validPhone('987654321'));
  assert.ok(!R.validPhone('5876543210'));
  assert.ok(R.validName('Kunal Joshi'));
  assert.ok(R.validName('કુણાલ'));
  assert.ok(!R.validName('K'));
  assert.ok(!R.validName('1234'));
});

test('online joining closes 30 min before closing', () => {
  const ist = (h, m) => Date.UTC(2026, 10, 24, h, m) - 330 * 60000;
  const s = { queueOpen: true, openTime: '10:00', closeTime: '21:00' };
  assert.equal(R.hoursState(s, ist(12, 0)).onlineOpen, true);
  assert.equal(R.hoursState(s, ist(20, 35)).reason, 'closingSoon');
  assert.equal(R.hoursState(s, ist(21, 5)).reason, 'salonClosed');
  assert.equal(R.hoursState({ ...s, queueOpen: false }, ist(12, 0)).reason, 'switchedOff');
});
