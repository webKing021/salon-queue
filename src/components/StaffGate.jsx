import { useEffect, useState } from 'react';
import { act, getPin, savePin } from '../lib/api.js';
import { useLang } from '../i18n/index.jsx';
import { Link } from 'react-router-dom';
import { Icon, LangToggle, Wordmark } from './ui.jsx';

/** PIN pad shown before staff screens. A correct PIN is remembered on this device for the day. */
export default function StaffGate({ children }) {
  const { t } = useLang();
  const [ok, setOk] = useState(() => Boolean(getPin()));
  const [digits, setDigits] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (digits.length !== 4) return;
    let cancelled = false;
    setChecking(true);
    act('checkPin', {}, digits)
      .then(() => {
        if (cancelled) return;
        savePin(digits);
        setOk(true);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setDigits('');
      })
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
  }, [digits]);

  useEffect(() => {
    if (ok) return;
    const onKey = (e) => {
      if (/^\d$/.test(e.key)) press(e.key);
      if (e.key === 'Backspace') setDigits((d) => d.slice(0, -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (ok) return children;

  function press(k) {
    setError(false);
    setDigits((d) => (d.length < 4 ? d + k : d));
  }

  return (
    <>
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col px-6 py-4">
      <div className="flex items-center justify-between">
        <Wordmark />
        <LangToggle />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center py-10">
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-navy text-white">
          <Icon.Lock width={20} height={20} />
        </span>
        <p className="text-[14px] font-medium text-ink-3 mb-2">{t('staffOnly')}</p>
        <h1 className="display mb-8 text-center text-[24px]">{t('enterPin')}</h1>
        <div className={`mb-3 flex gap-4 ${error ? 'animate-shake' : ''}`} aria-live="polite">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-4 w-4 rounded-full border-2 transition-colors ${
                i < digits.length ? 'border-navy bg-navy' : error ? 'border-red' : 'border-line-strong'
              }`}
            />
          ))}
        </div>
        <p className={`mb-8 h-5 text-sm font-semibold text-red ${error ? '' : 'invisible'}`}>{t('wrongPin')}</p>
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
            <PadKey key={k} onClick={() => press(k)} disabled={checking}>
              {k}
            </PadKey>
          ))}
          <button type="button" className="btn-quiet h-[72px] w-[72px] text-sm" onClick={() => setDigits('')}>
            {t('clear')}
          </button>
          <PadKey onClick={() => press('0')} disabled={checking}>
            0
          </PadKey>
          <button
            type="button"
            aria-label={t('back')}
            className="btn-quiet h-[72px] w-[72px]"
            onClick={() => setDigits((d) => d.slice(0, -1))}
          >
            <Icon.Back />
          </button>
        </div>
        <Link to="/" className="mt-10 flex min-h-11 items-center gap-2 text-[14px] font-semibold text-ink-3 hover:text-ink">
          <Icon.Back width={18} height={18} /> {t('backToCustomer')}
        </Link>
        <p className="mt-2 text-[12px] text-ink-3">{t('pinHint')}</p>
      </div>
    </div>
    </>
  );
}

function PadKey({ children, ...rest }) {
  return (
    <button
      type="button"
      className="num h-[76px] w-[76px] rounded-full bg-surface text-[36px] text-ink shadow-[0_1px_0_var(--color-line-strong),0_2px_6px_-2px_rgb(22_26_38/0.15)] transition-colors hover:bg-navy-soft active:bg-navy active:text-white"
      {...rest}
    >
      {children}
    </button>
  );
}
