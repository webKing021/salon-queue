import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n/index.jsx';

// ---------------------------------------------------------------- icons
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
export const Icon = {
  Scissors: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...base} {...p}>
      <circle cx="6.5" cy="17" r="3" />
      <circle cx="17.5" cy="17" r="3" />
      <path d="M8.6 14.8 18 4M15.4 14.8 6 4" />
    </svg>
  ),
  Back: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" {...base} {...p}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base} strokeWidth={2.6} {...p}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  Plus: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...base} strokeWidth={2.2} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  ),
  Lock: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  ),
  Sound: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...base} {...p}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </svg>
  ),
  Wifi: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}>
      <path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.6M19 13a10 10 0 0 0-2.3-1.7M2 9.5a15 15 0 0 1 4-2.6M22 9.5A15 15 0 0 0 11 5.1" />
      <circle cx="12" cy="20" r="0.6" fill="currentColor" />
    </svg>
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
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' }).format(ms);
}
export function mmss(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
export const minsSince = (from, now) => Math.max(0, Math.floor((now - from) / 60000));

// ---------------------------------------------------------------- language toggle
export function LangToggle({ className = '' }) {
  const { lang, setLang, t } = useLang();
  return (
    <div role="group" aria-label={t('langLabel')} className={`flex rounded-full border border-line-strong p-0.5 text-[13px] font-semibold ${className}`}>
      {[
        ['en', 'EN'],
        ['gu', 'ગુ'],
      ].map(([code, label]) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`min-h-9 min-w-11 rounded-full px-3 transition-colors ${
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
export function Wordmark({ to = '/', small = false }) {
  const { t } = useLang();
  return (
    <Link to={to} className="flex items-center gap-2.5 text-ivory">
      <span className="grid h-9 w-9 place-items-center rounded-full border border-gold/50 text-gold">
        <Icon.Scissors width={18} height={18} />
      </span>
      <span className={`font-display ${small ? 'text-lg' : 'text-xl'} font-medium leading-none tracking-tight`}>
        {t('salonShort')}
      </span>
    </Link>
  );
}

/** Top bar used by the phone screens. */
export function PhoneBar({ back, title }) {
  const { t } = useLang();
  return (
    <header className="sticky top-0 z-20 -mx-5 mb-4 flex items-center justify-between gap-3 bg-coal/90 px-5 py-3 backdrop-blur">
      {back ? (
        <div className="flex min-w-0 items-center gap-1">
          <Link to={back} aria-label={t('back')} className="-ml-2 grid h-11 w-11 place-items-center rounded-full text-mute hover:text-ivory">
            <Icon.Back />
          </Link>
          <h1 className="truncate text-lg font-semibold">{title}</h1>
        </div>
      ) : (
        <Wordmark />
      )}
      <LangToggle />
    </header>
  );
}

// ---------------------------------------------------------------- barbers
const AVATAR_TONES = {
  ravi: 'from-[#8a5a3c] to-[#5b3a27]',
  amit: 'from-[#3f6b6a] to-[#274645]',
  imran: 'from-[#6a4a6e] to-[#43304a]',
};
export function Avatar({ barber, size = 44, ring = false }) {
  const tone = AVATAR_TONES[barber?.id] || 'from-[#55607a] to-[#363e52]';
  const initial = barber ? barber.name[0] : '★';
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br ${tone} font-display text-ivory ${
        ring ? 'ring-2 ring-gold ring-offset-2 ring-offset-coal-deep' : ''
      }`}
      style={{ width: size, height: size, fontSize: size * 0.44 }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

export const DOT = { free: 'bg-mint', busy: 'bg-gold', break: 'bg-faint', off: 'bg-faint/40' };
export function Dot({ state, className = '' }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${DOT[state]} ${className}`} aria-hidden="true" />;
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`animate-rise max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-line bg-coal-deep p-6 sm:rounded-3xl ${
          wide ? 'sm:max-w-xl' : 'sm:max-w-sm'
        }`}
      >
        {title && <h2 className="mb-4 font-display text-xl font-medium">{title}</h2>}
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
      className="animate-rise fixed inset-x-0 bottom-28 z-[60] mx-auto w-fit max-w-[90vw] rounded-full border border-line-strong bg-coal-up px-5 py-3 text-center text-[15px] font-medium shadow-2xl shadow-black/40"
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

/** Switch styled as a pill. */
export function Toggle({ on, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-40 ${on ? 'bg-gold' : 'bg-coal-up border border-line-strong'}`}
    >
      <span className={`absolute top-1 h-6 w-6 rounded-full transition-all ${on ? 'left-7 bg-gold-ink' : 'left-1 bg-mute'}`} />
    </button>
  );
}
