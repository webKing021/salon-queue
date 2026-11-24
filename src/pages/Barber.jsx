import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useLang, useNames } from '../i18n/index.jsx';
import { useQueue, useTick } from '../lib/useQueue.js';
import { act } from '../lib/api.js';
import { STATUS, barberState, callNextCheck, currentOf, nextFor } from '../lib/queueRules.js';
import StaffShell from '../components/StaffShell.jsx';
import { Avatar, Dot, Icon, Loading, OfflineBar, STATE_TEXT, mmss, useToast } from '../components/ui.jsx';

export default function Barber() {
  return (
    <StaffShell active="barber" width="max-w-xl">
      <BarberScreen />
    </StaffShell>
  );
}

function BarberScreen() {
  const { name } = useParams();
  const { t } = useLang();
  const names = useNames();
  const { state, offline, refresh, serverNow } = useQueue();
  const [toastNode, toast] = useToast();
  useTick(1000);

  const key = (name || '').toLowerCase();
  const barber = state?.barbers.find((b) => b.id === key || b.name.toLowerCase() === key);

  // This phone remembers its barber, so /barber opens straight to them next time.
  useEffect(() => {
    if (barber) localStorage.setItem('sq_barber', barber.id);
  }, [barber]);

  if (!state) return <Loading />;

  if (!name) {
    const remembered = localStorage.getItem('sq_barber');
    if (remembered && state.barbers.some((b) => b.id === remembered)) return <Navigate to={`/barber/${remembered}`} replace />;
  }

  const switcher = (
    <nav className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" aria-label={t('allBarbers')}>
      {state.barbers.map((b) => {
        const on = barber?.id === b.id;
        const st = barberState(b, state.spots);
        return (
          <Link
            key={b.id}
            to={`/barber/${b.id}`}
            aria-current={on ? 'page' : undefined}
            className={`flex min-h-12 shrink-0 items-center gap-2 rounded-full border py-1 pr-4 pl-1 text-[15px] font-bold transition-colors ${
              on ? 'border-navy bg-navy text-white' : 'border-line-strong text-ink hover:border-navy/50'
            }`}
          >
            <Avatar barber={b} size={36} />
            {names.barber(b)}
            {!on && <Dot state={st} />}
          </Link>
        );
      })}
    </nav>
  );

  if (!barber) {
    return (
      <main className="mx-auto max-w-xl px-4 py-6">
        <h1 className="mb-1 text-[22px] font-bold">{t('allBarbers')}</h1>
        {name && <p className="mb-3 text-ink-3">{t('barberNotFound')}</p>}
        <div className="mt-4">{switcher}</div>
      </main>
    );
  }

  const now = serverNow();
  const spots = state.spots;
  const st = barberState(barber, spots);
  const cur = currentOf(barber.id, spots);
  const check = callNextCheck(barber, spots);
  const upcoming = nextFor(barber.id, spots);
  const served = spots.filter((s) => s.barber === barber.id && s.status === STATUS.DONE).length;

  async function run(action, payload) {
    try {
      await act(action, payload);
    } catch (err) {
      toast(t(`err_${err.code}`));
    }
    refresh();
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-5">
      <OfflineBar offline={offline} />
      {switcher}

      <section className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="display text-[32px] leading-tight font-medium">{names.barber(barber)}</h1>
          <p className={`flex items-center gap-1.5 text-[14px] font-semibold ${STATE_TEXT[st]}`}>
            <Dot state={st} /> {t(`st_${st}`)}<span className="text-ink-3">, {t('servedToday', { n: served })}</span>
          </p>
        </div>
      </section>

      <div role="group" className="mb-5 grid grid-cols-2 rounded-2xl border border-line-strong p-1">
        {[
          [false, t('available')],
          [true, t('onBreak')],
        ].map(([val, label]) => (
          <button
            key={label}
            type="button"
            aria-pressed={barber.onBreak === val}
            onClick={() => barber.onBreak !== val && run('setBreak', { barberId: barber.id, value: val })}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-[15px] font-bold transition-colors ${
              barber.onBreak === val ? (val ? 'bg-ink text-ink' : 'bg-green text-white') : 'text-ink-3'
            }`}
          >
            {val && <Icon.Coffee />}
            {label}
          </button>
        ))}
      </div>

      {!barber.onDuty && <p className="mb-4 rounded-xl bg-sunk px-4 py-3 text-center text-ink-3">{t('err_offDuty')}</p>}

      <section className={`mb-4 rounded-2xl p-5 ${cur ? (cur.status === STATUS.CALLED ? 'bg-red text-white' : 'bg-navy text-white') : 'panel'}`}>
        <p className={`mb-2 text-[15px] font-medium ${cur ? 'text-white/70' : 'text-ink-3'}`}>{t('current')}</p>
        {cur ? (
          <>
            <div className="flex items-end justify-between gap-3">
              <p className="num text-[88px]">S-{cur.token}</p>
              {cur.status === STATUS.IN_CHAIR ? (
                <p className="num text-[44px]">{mmss(now - cur.startedAt)}</p>
              ) : (
                <p className="mb-2 rounded-full bg-white px-3 py-1 text-[14px] font-semibold text-red">{t('waitingToArrive')}</p>
              )}
            </div>
            <p className="mt-2 text-[20px] font-bold">{cur.name}</p>
            <p className="mt-0.5 text-[15px] text-white/75">
              {cur.services.map((s) => names.service(s)).join(', ')}, {t('min', { n: cur.totalMin })}
            </p>
          </>
        ) : (
          <p className="py-3 text-[18px] text-ink-3">{barber.onBreak ? t('onBreakBanner') : t('noOneWaitingForYou')}</p>
        )}
      </section>

      {cur?.status === STATUS.CALLED && (
        <button className="btn-primary mb-4 min-h-16 w-full rounded-2xl text-[20px]" onClick={() => run('start', { id: cur.id })}>
          {t('start')}
        </button>
      )}
      {cur?.status === STATUS.IN_CHAIR && (
        <button className="btn-green mb-4 min-h-16 w-full rounded-2xl text-[20px]" onClick={() => run('done', { id: cur.id })}>
          <Icon.Check width={22} height={22} /> {t('done')}
        </button>
      )}
      {!cur && (
        <button className="btn-primary mb-4 min-h-16 w-full rounded-2xl text-[20px]" disabled={!check.ok} onClick={() => run('callNext', { barberId: barber.id })}>
          {t('callNext')}
        </button>
      )}

      <section className="rounded-2xl border border-dashed border-line-strong px-5 py-4">
        <p className="text-[14px] font-medium text-ink-3 mb-1.5">{t('nextForYou')}</p>
        {upcoming ? (
          <p className="text-[17px]">
            <span className="num mr-2 text-[26px] text-navy">S-{upcoming.token}</span>
            <span className="font-bold">{upcoming.name.split(' ')[0]}</span>
            <span className="text-ink-3"> ({upcoming.services.map((s) => names.service(s)).join(', ')})</span>
          </p>
        ) : (
          <p className="text-ink-3">{t('noOneWaitingForYou')}</p>
        )}
      </section>
      {toastNode}
    </main>
  );
}
