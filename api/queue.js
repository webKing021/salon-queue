// Single API endpoint (Vercel serverless function; also mounted by vite.config.js in dev).
//   GET  /api/queue[?spot=<id>]      -> full queue state (screens poll this every 2 s)
//   POST /api/queue { action, ... }   -> change something, see server/actions.js
// Staff actions need the header  x-staff-pin: <PIN>  (env STAFF_PIN, default 1234).
import { getDb } from '../server/db.js';
import { getState, runAction, QueueError } from '../server/actions.js';

const STAFF_PIN = process.env.STAFF_PIN || '1234';

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 50_000) throw new QueueError('tooLarge');
  }
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  try {
    const db = await getDb();
    const staff = req.headers['x-staff-pin'] === STAFF_PIN;
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET') {
      return send(res, 200, await getState(db, { staff, spotId: url.searchParams.get('spot') }));
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      return send(res, 200, await runAction(db, body, staff));
    }
    res.setHeader('Allow', 'GET, POST');
    return send(res, 405, { error: 'methodNotAllowed' });
  } catch (err) {
    if (err instanceof QueueError) return send(res, err.code === 'wrongPin' ? 401 : 400, { error: err.code, ...err.extra });
    if (err instanceof SyntaxError) return send(res, 400, { error: 'badJson' });
    console.error(err);
    return send(res, 500, { error: 'server' });
  }
}
