import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n/index.jsx';

// ---------------------------------------------------------------- icons
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
const svg = (paths, size = 20) =>
  function IconCmp(p) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...base} {...p}>
        {paths}
      </svg>
    );
  };
export const Icon = {
  Scissors: svg(
    <>
      <circle cx="6.5" cy="17" r="3" />
      <circle cx="17.5" cy="17" r="3" />
      <path d="M8.6 14.8 18 4M15.4 14.8 6 4" />
    </>,
  ),
  Back: svg(<path d="M15 5l-7 7 7 7" />, 22),
  Arrow: svg(<path d="M5 12h14M13 6l6 6-6 6" />, 18),
  Check: svg(<path d="M5 12.5l4.5 4.5L19 7.5" strokeWidth="2.6" />, 16),
  Plus: svg(<path d="M12 5v14M5 12h14" strokeWidth="2.2" />, 18),
  Clock: svg(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>,
    16,
  ),
  Lock: svg(
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>,
    18,
  ),
  Users: svg(
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
    </>,
  ),
  Tv: svg(
    <>
      <rect x="2.5" y="4.5" width="19" height="13" rx="2" />
      <path d="M8 21h8M12 17.5V21" />
    </>,
  ),
  Settings: svg(
    <>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>,
  ),
  Ticket: svg(
    <>
      <path d="M3 8.5V6a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 6v2.5a3.5 3.5 0 0 0 0 7V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18v-2.5a3.5 3.5 0 0 0 0-7z" />
      <path d="M14.5 4.5v15" strokeDasharray="2 2.5" />
    </>,
  ),
  Home: svg(<path d="M4 11 12 4l8 7v8.5a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />),
  Sound: svg(
    <>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>,
  ),
  Wifi: svg(
    <>
      <path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.6M19 13a10 10 0 0 0-2.3-1.7M2 9.5a15 15 0 0 1 4-2.6M22 9.5A15 15 0 0 0 11 5.1" />
    </>,
    16,
  ),
  Coffee: svg(
    <>
      <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8 3.5v2.5M12 3.5v2.5" />
    </>,
    16,
  ),
};

// ---------------------------------------------------------------- time helpers
export function fmtTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`;
}
export function clockText(ms) {
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' })
    .format(ms)
    .toUpperCase();
}
export function mmss(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
export const minsSince = (from, now) => Math.max(0, Math.floor((now - from) / 60000));

// ---------------------------------------------------------------- language toggle (44px targets)
export function LangToggle({ className = '', dark = false }) {
  const { lang, setLang, t } = useLang();
  return (
    <div
      role="group"
      aria-label={t('langLabel')}
      className={`flex shrink-0 rounded-full p-1 text-[14px] font-semibold ${dark ? 'bg-white/10' : 'bg-sunk'} ${className}`}
    >
      {[
        ['en', 'EN'],
        ['gu', 'ગુ'],
      ].map(([code, label]) => (
        <button
          key={code}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLang(code);
          }}
          aria-pressed={lang === code}
          className={`min-h-10 min-w-11 rounded-full px-2.5 transition-colors ${
            lang === code
              ? dark
                ? 'bg-white text-navy shadow-sm'
                : 'bg-surface text-navy shadow-[0_1px_2px_rgb(22_26_38/0.15)]'
              : dark
                ? 'text-white/70 hover:text-white'
                : 'text-ink-3 hover:text-ink'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- the barber pole
/**
 * A barber pole. It spins only when `spinning` is true (salon open / customer waiting),
 * like a real one outside a shop. `fill` (0..1) shows only part of the stripes, for progress.
 */
export function Pole({ height = 120, width = 18, spinning = false, fill = 1, className = '' }) {
  const cap = Math.max(5, Math.round(width * 0.42));
  return (
    <span className={`inline-flex shrink-0 flex-col items-center ${className}`} style={{ height }} aria-hidden="true">
      <span className="block rounded-t-full bg-navy" style={{ width: width + 6, height: cap }} />
      <span className="relative block flex-1 overflow-hidden bg-surface ring-1 ring-navy/25" style={{ width }}>
        <span
          className={`pole-stripes absolute inset-x-0 bottom-0 block ${spinning ? 'animate-pole' : ''}`}
          style={{ height: `${Math.max(0, Math.min(1, fill)) * 100}%` }}
        />
        <span className="absolute inset-y-0 left-[18%] block w-[22%] bg-white/45" />
      </span>
      <span className="block rounded-b-full bg-navy" style={{ width: width + 6, height: cap }} />
    </span>
  );
}

// ---------------------------------------------------------------- brand
export function Wordmark({ to = '/', sub, open = true }) {
  const { t } = useLang();
  return (
    <Link to={to} className="flex min-w-0 items-center gap-2.5 text-ink">
      <Pole height={34} width={9} spinning={open} />
      <span className="min-w-0 leading-none">
        <span className="display block truncate text-[19px]">{t('salonShort')}</span>
        {sub && <span className="mt-1 block truncate text-[13px] font-medium text-ink-3">{sub}</span>}
      </span>
    </Link>
  );
}

/** Wrapper for every customer (phone) screen. */
export function CustomerShell({ back, title, right, open = true, width = "max-w-[520px]", children }) {
  const { t } = useLang();
  return (
    <main className={`mx-auto flex min-h-dvh w-full flex-col px-5 md:px-8 ${width}`}>
      <header className="sticky top-0 z-20 -mx-5 flex min-h-16 md:-mx-8 md:px-8 items-center justify-between gap-3 border-b border-line/70 bg-page/90 px-5 py-2.5 backdrop-blur-md">
        {back ? (
          <div className="flex min-w-0 items-center gap-1">
            <Link to={back} aria-label={t('back')} className="-ml-2.5 grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-sunk hover:text-ink">
              <Icon.Back />
            </Link>
            <h1 className="truncate text-[18px] font-semibold">{title}</h1>
          </div>
        ) : (
          <Wordmark open={open} />
        )}
        <div className="flex items-center gap-2">
          {right}
          <LangToggle />
        </div>
      </header>
      {children}
    </main>
  );
}

// ---------------------------------------------------------------- barbers
const AVATAR_TONES = {
  ravi: ['#b0674a', '#7d3f2a'],
  amit: ['#2f7d77', '#1c514d'],
  imran: ['#6d5a9c', '#47396d'],
};
export function Avatar({ barber, size = 44, ring = false }) {
  const [a, b] = AVATAR_TONES[barber?.id] || ['#6b7590', '#454e68'];
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${ring ? 'ring-[3px] ring-red ring-offset-2 ring-offset-surface' : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.42, background: `linear-gradient(150deg, ${a}, ${b})` }}
      aria-hidden="true"
    >
      {barber ? barber.name[0] : '?'}
    </span>
  );
}

export const DOT = { free: 'bg-green', busy: 'bg-navy', break: 'bg-amber', off: 'bg-ink-3/50' };
export const STATE_TEXT = { free: 'text-green', busy: 'text-navy', break: 'text-amber', off: 'text-ink-3' };
export function Dot({ state, className = '' }) {
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${DOT[state]} ${className}`} aria-hidden="true" />;
}

// ---------------------------------------------------------------- overlays
export function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-deep/45 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`animate-rise max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-2xl sm:rounded-3xl ${
          wide ? 'sm:max-w-xl' : 'sm:max-w-sm'
        }`}
      >
        {title && (
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="display text-[24px]">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 grid h-11 w-11 place-items-center rounded-full text-ink-3 hover:bg-sunk hover:text-ink">
              <Icon.Plus className="rotate-45" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Confirm({ open, text, yes, no, onYes, onNo, danger = true }) {
  return (
    <Modal open={open} onClose={onNo}>
      <p className="mb-6 text-[18px] leading-relaxed">{text}</p>
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-outline" onClick={onNo} autoFocus>
          {no}
        </button>
        <button className={danger ? 'btn-red' : 'btn-primary'} onClick={onYes}>
          {yes}
        </button>
      </div>
    </Modal>
  );
}

export function useToast() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 2600);
    return () => clearTimeout(id);
  }, [msg]);
  const show = useCallback((text) => setMsg({ text, key: Date.now() }), []);
  const node = msg ? (
    <div
      key={msg.key}
      role="status"
      className="animate-rise fixed inset-x-0 bottom-28 z-[60] mx-auto w-fit max-w-[90vw] rounded-full bg-navy px-5 py-3 text-center text-[15px] font-semibold text-white shadow-xl shadow-navy/30"
    >
      {msg.text}
    </div>
  ) : null;
  return [node, show];
}

export function OfflineBar({ offline }) {
  const { t } = useLang();
  if (!offline) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-amber px-4 py-2 text-sm font-semibold text-white">
      <Icon.Wifi /> {t('offline')}
    </div>
  );
}

export function Loading() {
  const { t } = useLang();
  return (
    <div className="grid min-h-[60dvh] place-items-center text-ink-3">
      <div className="flex items-center gap-3">
        <Pole height={36} width={10} spinning />
        {t('loading')}
      </div>
    </div>
  );
}

/** Switch (44px tall hit area). */
export function Toggle({ on, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="grid h-11 w-16 shrink-0 place-items-center disabled:opacity-40"
    >
      <span className={`relative block h-8 w-14 rounded-full transition-colors ${on ? 'bg-navy' : 'bg-line-strong'}`}>
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'left-7' : 'left-1'}`} />
      </span>
    </button>
  );
}

/** Section heading. `n` only for real sequences (the Join steps). */
export function SectionTitle({ children, aside, n }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="flex items-baseline gap-2 text-[19px] font-semibold">
        {n && <span className="num text-[24px] text-red">{n}</span>}
        {children}
      </h2>
      {aside && <span className="text-[14px] text-ink-3">{aside}</span>}
    </div>
  );
}
