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
export function LangToggle({ className = '', compact = false }) {
  const { lang, setLang, t } = useLang();
  return (
    <div
      role="group"
      aria-label={t('langLabel')}
      className={`flex shrink-0 rounded-full border border-line-strong p-0.5 text-[13px] font-bold ${className}`}
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
          className={`${compact ? 'min-h-9 min-w-10' : 'min-h-10 min-w-11'} rounded-full px-2.5 transition-colors ${
            lang === code ? 'bg-gold text-gold-ink' : 'text-mute hover:text-ivory'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- brand
export function Logo({ size = 36 }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-gold text-gold-ink"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Icon.Scissors width={size * 0.52} height={size * 0.52} strokeWidth={2} />
    </span>
  );
}

export function Wordmark({ to = '/', sub }) {
  const { t } = useLang();
  return (
    <Link to={to} className="flex min-w-0 items-center gap-2.5 text-ivory">
      <Logo />
      <span className="min-w-0 leading-none">
        <span className="block truncate font-display text-[19px] font-medium tracking-tight">{t('salonShort')}</span>
        {sub && <span className="mt-1 block truncate text-[12px] font-semibold text-mute">{sub}</span>}
      </span>
    </Link>
  );
}

/** Wrapper for every customer (phone) screen. */
export function CustomerShell({ back, title, right, children }) {
  const { t } = useLang();
  return (
    <>
      <div className="pole" />
      <main className="mx-auto flex min-h-[calc(100dvh-4px)] max-w-[480px] flex-col px-5">
        <header className="sticky top-0 z-20 -mx-5 flex items-center justify-between gap-3 bg-coal/92 px-5 py-3 backdrop-blur">
          {back ? (
            <div className="flex min-w-0 items-center gap-1">
              <Link to={back} aria-label={t('back')} className="-ml-2.5 grid h-11 w-11 shrink-0 place-items-center rounded-full text-mute hover:bg-white/5 hover:text-ivory">
                <Icon.Back />
              </Link>
              <h1 className="truncate text-[17px] font-bold">{title}</h1>
            </div>
          ) : (
            <Wordmark />
          )}
          <div className="flex items-center gap-2">
            {right}
            <LangToggle />
          </div>
        </header>
        {children}
      </main>
    </>
  );
}

// ---------------------------------------------------------------- barbers
const AVATAR_TONES = {
  ravi: ['#9a6644', '#6a4129'],
  amit: ['#447a78', '#2a4d4c'],
  imran: ['#7a5580', '#4b3452'],
};
export function Avatar({ barber, size = 44, ring = false }) {
  const [a, b] = AVATAR_TONES[barber?.id] || ['#5d6880', '#394259'];
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-display text-ivory ${
        ring ? 'ring-2 ring-gold ring-offset-2 ring-offset-coal' : ''
      }`}
      style={{ width: size, height: size, fontSize: size * 0.44, background: `linear-gradient(140deg, ${a}, ${b})` }}
      aria-hidden="true"
    >
      {barber ? barber.name[0] : '★'}
    </span>
  );
}

export const DOT = { free: 'bg-mint', busy: 'bg-gold', break: 'bg-faint', off: 'bg-faint/40' };
export const STATE_TEXT = { free: 'text-mint', busy: 'text-gold-soft', break: 'text-mute', off: 'text-faint' };
export function Dot({ state, className = '' }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${DOT[state]} ${className}`} aria-hidden="true" />;
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`animate-rise max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-line bg-coal p-6 sm:rounded-3xl ${
          wide ? 'sm:max-w-xl' : 'sm:max-w-sm'
        }`}
      >
        {title && (
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-display text-[22px] font-medium">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 grid h-11 w-11 place-items-center rounded-full text-mute hover:bg-white/5 hover:text-ivory">
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
      <p className="mb-6 text-[17px] leading-relaxed">{text}</p>
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-ghost" onClick={onNo} autoFocus>
          {no}
        </button>
        <button className={danger ? 'btn bg-rose text-[#2a0d0d] hover:brightness-110' : 'btn-gold'} onClick={onYes}>
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
      className="animate-rise fixed inset-x-0 bottom-28 z-[60] mx-auto w-fit max-w-[90vw] rounded-full bg-paper px-5 py-3 text-center text-[15px] font-semibold text-ink shadow-2xl shadow-black/50"
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
    <div className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-amber px-4 py-2 text-sm font-semibold text-[#2b1a03]">
      <Icon.Wifi /> {t('offline')}
    </div>
  );
}

export function Loading() {
  const { t } = useLang();
  return (
    <div className="grid min-h-[60dvh] place-items-center text-mute">
      <div className="flex items-center gap-3">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        {t('loading')}
      </div>
    </div>
  );
}

/** Switch styled as a pill (44px tall hit area). */
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
      <span className={`relative block h-8 w-14 rounded-full transition-colors ${on ? 'bg-gold' : 'border border-line-strong bg-coal-deep'}`}>
        <span className={`absolute top-1 h-6 w-6 rounded-full transition-all ${on ? 'left-7 bg-gold-ink' : 'left-1 bg-mute'}`} />
      </span>
    </button>
  );
}

/** Section heading used inside pages. */
export function SectionTitle({ children, aside, n }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="flex items-baseline gap-2.5 text-[17px] font-bold">
        {n && <span className="token text-[22px] text-gold">{n}</span>}
        {children}
      </h2>
      {aside && <span className="text-[13px] text-mute">{aside}</span>}
    </div>
  );
}
