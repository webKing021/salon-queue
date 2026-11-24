import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchState } from './api.js';

const POLL_MS = 2000;

/**
 * Polls the queue every 2 s (spec: every screen updates within 5 s).
 * `serverNow()` returns the current time on the server clock, so timers agree across devices.
 */
export function useQueue({ spotId = null } = {}) {
  const [state, setState] = useState(null);
  const [offline, setOffline] = useState(false);
  const offset = useRef(0);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const sent = Date.now();
      const data = await fetchState(spotId);
      if (!alive.current) return;
      offset.current = data.now - (sent + Date.now()) / 2;
      setState(data);
      setOffline(false);
    } catch {
      if (alive.current) setOffline(true);
    }
  }, [spotId]);

  useEffect(() => {
    alive.current = true;
    refresh();
    const id = setInterval(refresh, POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive.current = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const serverNow = useCallback(() => Date.now() + offset.current, []);
  return { state, offline, refresh, serverNow };
}

/** Re-render every `ms` (for clocks and timers). */
export function useTick(ms = 1000) {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}
