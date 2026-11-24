import { useRef, useState } from 'react';
import { useLang, useNames } from '../i18n/index.jsx';
import { act } from '../lib/api.js';
import { MAX_SERVICES, newcomerEta, totals, validName, validPhone } from '../lib/queueRules.js';
import { Avatar, Icon } from './ui.jsx';

/**
 * The join form, shared by the customer Join screen and the reception "Add walk-in" pop-up.
 * variant="page": summary bar sticks to the bottom of the phone screen.
 * variant="modal": summary sits at the end of the form.
 */
export default function JoinForm({ state, serverNow, walkIn = false, variant = 'page', onResult, toast }) {
  const { t } = useLang();
  const names = useNames();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [picked, setPicked] = useState([]);
  const [pref, setPref] = useState(null);
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const nameRef = useRef(null);
  const phoneRef = useRef(null);

  const active = state.services.filter((s) => s.active);
  const selected = picked.map((id) => active.find((s) => s.id === id)).filter(Boolean);
  const onDuty = state.barbers.filter((b) => b.onDuty);
  const prefOk = pref && onDuty.some((b) => b.id === pref) ? pref : null;
  const sum = totals(selected);
  const eta = newcomerEta(prefOk, state.spots, state.barbers, serverNow());

  const nameBad = !validName(name);
  const phoneBad = walkIn ? phone !== '' && !validPhone(phone) : !validPhone(phone);

  function toggle(id) {
    if (picked.includes(id)) return setPicked(picked.filter((x) => x !== id));
    if (selected.length >= MAX_SERVICES) return toast(t('maxServices'));
    setPicked([...picked.filter((x) => active.some((s) => s.id === x)), id]);
  }

  async function submit(e) {
    e?.preventDefault();
    setTouched({ name: true, phone: true });
    if (nameBad) return nameRef.current?.focus();
    if (phoneBad) return phoneRef.current?.focus();
    if (!selected.length) return toast(t('pickAService'));
    setBusy(true);
    try {
      const res = await act('join', {
        name,
        phone,
        serviceIds: selected.map((s) => s.id),
        prefBarber: prefOk,
        walkIn,
      });
      if (res.spot && walkIn) {
        setName('');
        setPhone('');
        setPicked([]);
        setPref(null);
        setTouched({});
      }
      onResult(res);
    } catch (err) {
      toast(t(`err_${err.code}`));
    } finally {
      setBusy(false);
    }
  }

  const summary = (
    <div className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        {selected.length ? (
          <>
            <p className="text-[15px] font-semibold">{t('summary', { min: sum.minutes, price: sum.price })}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-gold-soft">
              <Icon.Clock width={14} height={14} />
              {eta.ahead === 0 && eta.wait === 0 ? t('expectedNext') : t('expectedWait', { n: eta.wait })}
            </p>
          </>
        ) : (
          <p className="text-[14px] text-mute">{t('pickAService')}</p>
        )}
      </div>
      <button type="submit" className="btn-gold min-h-12 shrink-0 px-6" disabled={!selected.length || busy}>
        {busy ? t('joining') : walkIn ? t('addToQueue') : t('confirm')}
      </button>
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className={variant === 'page' ? 'pb-36' : ''}>
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="jf-name">{t('yourName')}</label>
          <input
            id="jf-name"
            ref={nameRef}
            className="field"
            autoComplete="name"
            maxLength={30}
            placeholder={t('namePh')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((x) => ({ ...x, name: true }))}
            aria-invalid={touched.name && nameBad}
          />
          {touched.name && nameBad && <p className="mt-1.5 text-[13px] font-medium text-rose">{t('nameErr')}</p>}
        </div>
        <div>
          <label className="label" htmlFor="jf-phone">{walkIn ? t('phoneOptional') : t('phone')}</label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-mute">+91</span>
            <input
              id="jf-phone"
              ref={phoneRef}
              className="field pl-14 tracking-wider"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              placeholder={t('phonePh')}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              onBlur={() => setTouched((x) => ({ ...x, phone: true }))}
              aria-invalid={touched.phone && phoneBad}
            />
          </div>
          {touched.phone && phoneBad && <p className="mt-1.5 text-[13px] font-medium text-rose">{t('phoneErr')}</p>}
        </div>
      </div>

      <fieldset className="mt-8 min-w-0">
        <legend className="mb-3 flex w-full items-baseline justify-between">
          <span className="text-base font-semibold">{t('pickServices')}</span>
          <span className="text-[13px] text-mute">
            {selected.length}/{MAX_SERVICES} · {t('pickServicesHint')}
          </span>
        </legend>
        {active.length === 0 ? (
          <p className="card px-4 py-5 text-center text-mute">{t('noServices')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {active.map((s) => {
              const on = picked.includes(s.id);
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  aria-pressed={on}
                  className={`relative flex min-h-[88px] flex-col justify-between rounded-2xl border p-3.5 text-left transition-colors ${
                    on ? 'border-gold bg-gold/[0.07]' : 'border-line bg-coal-deep hover:border-line-strong'
                  }`}
                >
                  <span className="pr-6 text-[15px] leading-tight font-semibold">{names.service(s)}</span>
                  <span className="mt-2 flex items-baseline justify-between text-[13px]">
                    <span className="text-mute">{t('min', { n: s.minutes })}</span>
                    <span className="font-semibold text-ivory">₹{s.price}</span>
                  </span>
                  <span
                    className={`absolute top-3 right-3 grid h-5 w-5 place-items-center rounded-full border transition-colors ${
                      on ? 'border-gold bg-gold text-gold-ink' : 'border-line-strong'
                    }`}
                  >
                    {on && <Icon.Check width={12} height={12} />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </fieldset>

      <fieldset className="mt-8 min-w-0">
        <legend className="mb-3 text-base font-semibold">{t('pickBarber')}</legend>
        <div className="-mx-5 flex snap-x gap-2.5 overflow-x-auto px-5 pb-2 [scrollbar-width:none]">
          <BarberCard on={!prefOk} onClick={() => setPref(null)} title={t('anyBarber')} sub={t('fastest')}>
            <span className="grid h-12 w-12 place-items-center rounded-full border border-dashed border-gold/60 text-gold">
              <Icon.Scissors />
            </span>
          </BarberCard>
          {onDuty.map((b) => (
            <BarberCard
              key={b.id}
              on={prefOk === b.id}
              onClick={() => setPref(b.id)}
              title={names.barber(b)}
              sub={b.onBreak ? t('st_break') : null}
              warn={b.onBreak}
            >
              <Avatar barber={b} size={48} />
            </BarberCard>
          ))}
        </div>
      </fieldset>

      {variant === 'page' ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-coal-deep/95 backdrop-blur">
          <div className="mx-auto max-w-[480px] px-5 pt-3.5 pb-[max(14px,env(safe-area-inset-bottom))]">{summary}</div>
        </div>
      ) : (
        <div className="mt-6 border-t border-line pt-4">{summary}</div>
      )}
    </form>
  );
}

function BarberCard({ on, onClick, title, sub, warn, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex w-[104px] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border px-2 py-4 transition-colors ${
        on ? 'border-gold bg-gold/[0.07]' : 'border-line bg-coal-deep hover:border-line-strong'
      }`}
    >
      {children}
      <span className="text-center text-[14px] leading-tight font-semibold">{title}</span>
      {sub && <span className={`text-[12px] leading-tight ${warn ? 'text-amber' : 'text-mute'}`}>{sub}</span>}
    </button>
  );
}
