// Storage: SQLite.
// - Default: a SQLite file using Node's built-in `node:sqlite` (no extra service, no account).
//   Local: ./data/salon.db   ·   Vercel: /tmp/salon.db (temporary, see README)
// - Optional: set TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN) to use Turso, which is
//   hosted SQLite on a free tier, so the queue survives server restarts.
// Both expose the same tiny async API: all(), get(), run().

import fs from 'node:fs';
import path from 'node:path';

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS settings (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     queue_open INTEGER NOT NULL DEFAULT 1,
     open_time TEXT NOT NULL DEFAULT '10:00',
     close_time TEXT NOT NULL DEFAULT '21:00',
     token_day TEXT NOT NULL DEFAULT '',
     token_no INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE TABLE IF NOT EXISTS barbers (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     name_gu TEXT NOT NULL,
     on_duty INTEGER NOT NULL DEFAULT 1,
     on_break INTEGER NOT NULL DEFAULT 0,
     sort INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE TABLE IF NOT EXISTS services (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name_en TEXT NOT NULL,
     name_gu TEXT NOT NULL,
     minutes INTEGER NOT NULL,
     price INTEGER NOT NULL,
     active INTEGER NOT NULL DEFAULT 1,
     sort INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE TABLE IF NOT EXISTS spots (
     id TEXT PRIMARY KEY,
     day TEXT NOT NULL,
     token INTEGER NOT NULL,
     name TEXT NOT NULL,
     phone TEXT NOT NULL DEFAULT '',
     services TEXT NOT NULL,
     total_min INTEGER NOT NULL,
     total_price INTEGER NOT NULL,
     pref_barber TEXT,
     barber TEXT,
     status TEXT NOT NULL DEFAULT 'waiting',
     walk_in INTEGER NOT NULL DEFAULT 0,
     created_at INTEGER NOT NULL,
     called_at INTEGER,
     started_at INTEGER,
     finished_at INTEGER
   )`,
  `CREATE INDEX IF NOT EXISTS spots_day ON spots(day)`,
  // One active spot per phone number, enforced by the database itself.
  `CREATE UNIQUE INDEX IF NOT EXISTS one_active_spot_per_phone
     ON spots(phone) WHERE status IN ('waiting','called') AND phone <> ''`,
];

const BARBERS = [
  ['ravi', 'Ravi', 'રવિ', 1],
  ['amit', 'Amit', 'અમિત', 2],
  ['imran', 'Imran', 'ઇમરાન', 3],
];

const SERVICES = [
  ['Haircut', 'હેરકટ', 30, 150],
  ['Beard trim', 'દાઢી ટ્રીમ', 15, 80],
  ['Shave', 'શેવિંગ', 20, 100],
  ['Hair spa', 'હેર સ્પા', 45, 400],
  ['Hair colour', 'હેર કલર', 60, 600],
  ['Head massage', 'હેડ મસાજ', 20, 150],
  ['Kids haircut', 'બાળકોનો હેરકટ', 20, 100],
];

const clean = (args) => args.map((a) => (a === undefined ? null : typeof a === 'boolean' ? Number(a) : a));

const TURSO_URL = process.env.TURSO_DATABASE_URL || process.env.TURSO_URL || process.env.LIBSQL_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;

async function makeTurso() {
  // Remote Turso uses the pure-JS web client. A "file:" URL uses the Node client
  // (only for testing this code path locally).
  const { createClient } = TURSO_URL.startsWith('file:') ? await import('@libsql/client') : await import('@libsql/client/web');
  const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
  const toObjects = (rs) => rs.rows.map((r) => Object.fromEntries(rs.columns.map((c, i) => [c, r[i]])));
  return {
    kind: 'turso',
    async all(sql, args = []) {
      return toObjects(await client.execute({ sql, args: clean(args) }));
    },
    async get(sql, args = []) {
      return (await this.all(sql, args))[0] || null;
    },
    async run(sql, args = []) {
      const rs = await client.execute({ sql, args: clean(args) });
      return { changes: rs.rowsAffected };
    },
  };
}

async function makeFile() {
  const { DatabaseSync } = await import('node:sqlite');
  const file = process.env.SQLITE_FILE || (process.env.VERCEL ? '/tmp/salon.db' : path.resolve('data/salon.db'));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 3000;');
  const plain = (row) => (row ? { ...row } : null);
  return {
    kind: 'sqlite-file',
    async all(sql, args = []) {
      return db.prepare(sql).all(...clean(args)).map(plain);
    },
    async get(sql, args = []) {
      return plain(db.prepare(sql).get(...clean(args)));
    },
    async run(sql, args = []) {
      const r = db.prepare(sql).run(...clean(args));
      return { changes: Number(r.changes) };
    },
  };
}

async function setup(db) {
  for (const sql of SCHEMA) await db.run(sql);
  await db.run(`INSERT OR IGNORE INTO settings (id) VALUES (1)`);
  const { n } = await db.get(`SELECT COUNT(*) AS n FROM barbers`);
  if (Number(n) === 0) {
    for (const [id, name, gu, sort] of BARBERS) {
      await db.run(`INSERT INTO barbers (id, name, name_gu, sort) VALUES (?, ?, ?, ?)`, [id, name, gu, sort]);
    }
  }
  const s = await db.get(`SELECT COUNT(*) AS n FROM services`);
  if (Number(s.n) === 0) {
    let sort = 1;
    for (const [en, gu, min, price] of SERVICES) {
      await db.run(`INSERT INTO services (name_en, name_gu, minutes, price, sort) VALUES (?, ?, ?, ?, ?)`, [
        en, gu, min, price, sort++,
      ]);
    }
  }
  return db;
}

let ready = null;
export function getDb() {
  if (!ready) {
    ready = (TURSO_URL ? makeTurso() : makeFile()).then(setup).catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}
