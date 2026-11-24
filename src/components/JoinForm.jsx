import { useRef, useState } from 'react';
import { useLang, useNames } from '../i18n/index.jsx';
import { act } from '../lib/api.js';
import { MAX_SERVICES, newcomerEta, totals, validName, validPhone } from '../lib/queueRules.js';
import { Avatar, Icon, SectionTitle } from './ui.jsx';

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

  const now = serverNow();
  const active = state.services.filter((s) => s.active);
  const selected = picked.map((id) => active.find((s) => s.id === id)).filter(Boolean);
  const onDuty = state.barbers.filter((b) => b.onDuty);
  const prefOk = pref && onDuty.some((b) => b.id === pref) ? pref : null;
  const sum = totals(selected);
  const etaFor = (id) => newcomerEta(id, state.spots, state.barbers, now);
  const eta = etaFor(prefOk);

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
      const res = await act('join', { name, phone, serviceIds: selected.map((s) => s.id), prefBarber: prefOk, walkIn });
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

  const waitText = (e) => (e.ahead === 0 && e.wait === 0 ? t('waitNone') : t('waitFor', { n: e.wait }));

  const summary = (
    <div className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        {selected.length ? (
          <>
            <p className="text-[15px] font-bold">{t('summary', { min: sum.minutes, price: sum.price })}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-semibold text-navy">
              <Icon.Clock width={14} height={14} />
              {eta.ahead === 0 && eta.wait === 0 ? t('expectedNext') : t('expectedWait', { n: eta.wait })}
            </p>
          </>
        ) : (
          <p className="text-[14px] text-ink-3">{t('pickAService')}</p>
        )}
      </div>
      <button type="submit" className="btn-primary min-h-12 shrink-0 px-6 text-[16px]" disabled={!selected.length || busy}>
        {busy ? t('joining') : walkIn ? t('addToQueue') : t('confirm')}
      </button>
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className={variant === 'page' ? 'pb-36' : ''}>
      <section>
        <SectionTitle n={walkIn ? null : '1'}>{walkIn ? t('customerDetails') : t('stepDetails')}</SectionTitle>
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="jf-name">{walkIn ? t('customerName') : t('yourName')}</label>
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
            {touched.name && nameBad && <p className="mt-1.5 text-[13px] font-semibold text-red">{t('nameErr')}</p>}
          </div>
          <div>
            <label className="label" htmlFor="jf-phone">{walkIn ? t('phoneOptional') : t('phone')}</label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-semibold text-ink-3">+91</span>
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
            {touched.phone && phoneBad && <p className="mt-1.5 text-[13px] font-semibold text-red">{t('phoneErr')}</p>}
          </div>
        </div>
      </section>

      <fieldset className="mt-9 min-w-0">
        <legend className="w-full">
          <SectionTitle n={walkIn ? null : '2'} aside={`${selected.length} / ${MAX_SERVICES}`}>
            {t('pickServices')}
          </SectionTitle>
        </legend>
        {active.length === 0 ? (
          <p className="panel px-4 py-5 text-center text-ink-3">{t('noServices')}</p>
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
                  className={`relative flex min-h-[84px] flex-col justify-between rounded-2xl border p-3.5 text-left transition-colors ${
                    on ? 'border-navy bg-navy text-white' : 'border-line bg-surface hover:border-navy/50'
                  }`}
                >
                  <span className="pr-6 text-[15px] leading-tight font-bold">{names.service(s)}</span>
                  <span className="mt-2 flex items-baseline justify-between text-[13px]">
                    <span className={on ? 'font-semibold opacity-75' : 'text-ink-3'}>{t('min', { n: s.minutes })}</span>
                    <span className="font-bold">₹{s.price}</span>
                  </span>
                  <span
                    className={`absolute top-3 right-3 grid h-5 w-5 place-items-center rounded-full border ${
                      on ? 'border-white bg-white text-navy' : 'border-line-strong'
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

      <fieldset className="mt-9 min-w-0">
        <legend className="w-full">
          <SectionTitle n={walkIn ? null : '3'}>{t('pickBarber')}</SectionTitle>
        </legend>
        <div className="space-y-2" role="radiogroup">
          <BarberOption on={!prefOk} onClick={() => setPref(null)} title={t('anyBarberLong')} wait={waitText(etaFor(null))}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-dashed border-navy/50 text-navy">
              <Icon.Scissors width={18} height={18} />
            </span>
          </BarberOption>
          {onDuty.map((b) => (
            <BarberOption
              key={b.id}
              on={prefOk === b.id}
              onClick={() => setPref(b.id)}
              title={names.barber(b)}
              note={b.onBreak ? t('st_break') : null}
              wait={waitText(etaFor(b.id))}
            >
              <Avatar barber={b} size={40} />
            </BarberOption>
          ))}
        </div>
      </fieldset>

      {variant === 'page' ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 shadow-[0_-8px_24px_-12px_rgb(22_26_38/0.25)] backdrop-blur">
          <div className="mx-auto max-w-[480px] px-5 pt-3.5 pb-[max(14px,env(safe-area-inset-bottom))]">{summary}</div>
        </div>
      ) : (
        <div className="mt-6 border-t border-line pt-4">{summary}</div>
      )}
    </form>
  );
}

function BarberOption({ on, onClick, title, note, wait, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-colors ${
        on ? 'border-navy bg-navy-soft ring-1 ring-navy' : 'border-line bg-surface hover:border-navy/50'
      }`}
    >
      {children}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold">{title}</span>
        {note && <span className="flex items-center gap-1 text-[12px] font-semibold text-amber"><Icon.Coffee width={13} height={13} /> {note}</span>}
      </span>
      <span className="text-[14px] font-semibold text-ink-3">{wait}</span>
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-navy bg-navy text-white' : 'border-line-strong'}`}>
        {on && <Icon.Check width={13} height={13} />}
      </span>
    </button>
  );
}
