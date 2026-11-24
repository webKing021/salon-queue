import { salonClock } from './queueRules.js';

export class ApiError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

// ---- staff PIN, remembered on this device for the day ----
export function getPin() {
  try {
    const saved = JSON.parse(localStorage.getItem('sq_pin') || 'null');
    if (saved && saved.day === salonClock().day) return saved.pin;
  } catch {
    /* ignore */
  }
  return null;
}
export function savePin(pin) {
  localStorage.setItem('sq_pin', JSON.stringify({ pin, day: salonClock().day }));
}
export function clearPin() {
  localStorage.removeItem('sq_pin');
}

// ---- the customer's own spot id on this phone ----
export function getMySpot() {
  return localStorage.getItem('sq_spot');
}
export function saveMySpot(id) {
  localStorage.setItem('sq_spot', id);
}
export function forgetMySpot() {
  localStorage.removeItem('sq_spot');
}

async function request(method, { query = '', body, pin } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const p = pin ?? getPin();
  if (p) headers['x-staff-pin'] = p;
  let res;
  try {
    res = await fetch(`/api/queue${query}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('network');
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    throw new ApiError('server');
  }
  if (!res.ok) throw new ApiError(data?.error || 'server');
  return data;
}

export function fetchState(spotId) {
  return request('GET', { query: spotId ? `?spot=${encodeURIComponent(spotId)}` : '' });
}

export function act(action, payload = {}, pin) {
  return request('POST', { body: { action, ...payload }, pin });
}
