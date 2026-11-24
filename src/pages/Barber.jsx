import { Link, useParams } from 'react-router-dom';
import { useLang, useNames } from '../i18n/index.jsx';
import { useQueue, useTick } from '../lib/useQueue.js';
import { act } from '../lib/api.js';
import { STATUS, barberState, callNextCheck, currentOf, nextFor } from '../lib/queueRules.js';
import StaffGate from '../components/StaffGate.jsx';
import { Avatar, Dot, Loading, OfflineBar, PhoneBar, mmss, useToast } from '../components/ui.jsx';

export default function Barber() {
  return (
    <StaffGate>
      <BarberScreen />
    </StaffGate>
  );
}

function BarberScreen() {
  const { name } = useParams();
  const { t } = useLang();
  const names = useNames();
  const { state, offline, refresh, serverNow } = useQueue();
  const [toastNode, toast] = useToast();
  useTick(1000);

  if (!state) return <Loading />;

  const key = (name || '').toLowerCase();
  const barber = state.barbers.find((b) => b.id === key || b.name.toLowerCase() === key);

  // /barber (no name) or unknown name → pick from the list
  if (!barber) {
    return (
      <main className="mx-auto min-h-dvh max-w-[480px] px-5">
        <PhoneBar back="/" title={t('barber')} />
        {name && <p className="mb-4 text-mute">{t('barberNotFound')}</p>}
        <p className="eyebrow mb-3">{t('allBarbers')}</p>
        <div className="space-y-2.5">
          {state.barbers.map((b) => (
            <Link key={b.id} to={`/barber/${b.id}`} className="card flex min-h-16 items-center gap-3 px-4 py-3 hover:border-gold/50">
              <Avatar barber={b} size={40} />
              <span className="flex-1 text-[17px] font-semibold">{names.barber(b)}</span>
              <span className="flex items-center gap-1.5 text-[13px] text-mute">
                <Dot state={barberState(b, state.spots)} /> {t(`st_${barberState(b, state.spots)}`)}
              </span>
            </Link>
          ))}
        </div>
      </main>
    );
  }

  const now = serverNow();
  const spots = state.spots;
  const cur = currentOf(barber.id, spots);
  const check = callNextCheck(barber, spots);
  const upcoming = cur ? nextFor(barber.id, spots) : check.ok ? check.spot : nextFor(barber.id, spots);
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
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-5">
      <OfflineBar offline={offline} />
      <PhoneBar back="/barber" title="" />

      <section className="mb-6 flex items-center gap-4">
        <Avatar barber={barber} size={56} ring={Boolean(cur)} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-medium leading-tight">{names.barber(barber)}</h1>
          <p className="text-[14px] text-mute">{t('servedToday', { n: served })}</p>
        </div>
      </section>

      <div role="group" className="mb-6 grid grid-cols-2 rounded-2xl border border-line-strong p-1">
        {[
          [false, t('available')],
          [true, t('onBreak')],
        ].map(([val, label]) => (
          <button
            key={label}
            type="button"
            aria-pressed={barber.onBreak === val}
            onClick={() => barber.onBreak !== val && run('setBreak', { barberId: barber.id, value: val })}
            className={`min-h-12 rounded-xl text-[15px] font-semibold transition-colors ${
              barber.onBreak === val ? (val ? 'bg-coal-up text-ivory' : 'bg-mint text-[#0d2418]') : 'text-mute'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!barber.onDuty && <p className="mb-4 rounded-xl bg-white/5 px-4 py-3 text-center text-mute">{t('err_offDuty')}</p>}

      <section className="card mb-4 p-5">
        <p className="eyebrow mb-3">{t('current')}</p>
        {cur ? (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <p className="token text-5xl text-gold">S-{cur.token}</p>
              {cur.status === STATUS.IN_CHAIR ? (
                <p className="token text-3xl tabular-nums">{mmss(now - cur.startedAt)}</p>
              ) : (
                <p className="text-[13px] font-semibold text-gold-soft">{t('waitingToArrive')}</p>
              )}
            </div>
            <p className="mt-2 text-xl font-semibold">{cur.name}</p>
            <p className="mt-1 text-[15px] text-mute">
              {cur.services.map((s) => names.service(s)).join(' · ')} · {t('min', { n: cur.totalMin })}
            </p>
          </>
        ) : (
          <p className="py-2 text-lg text-mute">{barber.onBreak ? t('onBreakBanner') : t('noOneWaitingForYou')}</p>
        )}
      </section>

      {cur?.status === STATUS.CALLED && (
        <button className="btn-gold mb-4 min-h-16 w-full text-xl" onClick={() => run('start', { id: cur.id })}>
          {t('start')}
        </button>
      )}
      {cur?.status === STATUS.IN_CHAIR && (
        <button className="btn-mint mb-4 min-h-16 w-full text-xl" onClick={() => run('done', { id: cur.id })}>
          {t('done')}
        </button>
      )}
      {!cur && (
        <button className="btn-gold mb-4 min-h-16 w-full text-xl" disabled={!check.ok} onClick={() => run('callNext', { barberId: barber.id })}>
          {t('callNext')}
        </button>
      )}

      <section className="mt-2 rounded-2xl border border-dashed border-line-strong px-5 py-4">
        <p className="eyebrow mb-1.5">{t('nextForYou')}</p>
        {upcoming ? (
          <p className="text-[17px]">
            <span className="token mr-2 text-gold">S-{upcoming.token}</span>
            <span className="font-semibold">{upcoming.name.split(' ')[0]}</span>
            <span className="text-mute"> ({upcoming.services.map((s) => names.service(s)).join(', ')})</span>
          </p>
        ) : (
          <p className="text-mute">{t('noOneWaitingForYou')}</p>
        )}
      </section>
      {toastNode}
    </main>
  );
}
