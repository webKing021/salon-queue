import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang, useNames } from '../i18n/index.jsx';
import { useQueue, useTick } from '../lib/useQueue.js';
import { act } from '../lib/api.js';
import {
  LONG_WAIT_MIN,
  NO_SHOW_AFTER_MIN,
  STATUS,
  barberState,
  callNextCheck,
  currentOf,
  minutesLeft,
  newcomerEta,
  spotEta,
  waitingList,
} from '../lib/queueRules.js';
import StaffShell, { lockStaff } from '../components/StaffShell.jsx';
import JoinForm from '../components/JoinForm.jsx';
import { Avatar, Confirm, Dot, Icon, Loading, Modal, OfflineBar, STATE_TEXT, clockText, minsSince, useToast } from '../components/ui.jsx';

export default function Reception() {
  return (
    <StaffShell active="reception">
      <Dashboard />
    </StaffShell>
  );
}

function Dashboard() {
  const { t } = useLang();
  const names = useNames();
  const { state, offline, refresh, serverNow } = useQueue();
  const [toastNode, toast] = useToast();
  const [walkIn, setWalkIn] = useState(false);
  const [confirm, setConfirm] = useState(null);
  useTick(15000);

  if (!state) return <Loading />;
  if (!state.staff) {
    lockStaff();
    return null;
  }

  const now = serverNow();
  const { barbers, spots, settings } = state;
  const onDuty = barbers.filter((b) => b.onDuty);
  const waiting = waitingList(spots);
  const barberName = (id) => names.barber(barbers.find((b) => b.id === id));
  const newWait = newcomerEta(null, spots, barbers, now).wait;

  async function run(action, payload) {
    try {
      await act(action, payload);
    } catch (err) {
      toast(t(`err_${err.code}`));
    }
    refresh();
  }

  function onWalkIn(res) {
    if (res.existing) toast(t('alreadyInQueue', { token: `S-${res.existing.token}` }));
    else {
      toast(`S-${res.spot.token} ✓`);
      setWalkIn(false);
    }
    refresh();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 md:px-6">
      <OfflineBar offline={offline} />

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <h1 className="text-[22px] font-bold">{t('reception')}</h1>
        <span className="num text-[26px] text-ink-3">{clockText(now)}</span>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sunk px-3 py-1.5 text-[13px] font-bold">{t('waitingN', { n: waiting.length })}</span>
          <span className="rounded-full bg-sunk px-3 py-1.5 text-[13px] font-semibold text-ink-3">{t('newWalkInWait', { n: newWait })}</span>
          <Link
            to="/admin"
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
              settings.onlineOpen ? 'bg-green-soft text-green' : 'bg-amber-soft text-amber'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${settings.onlineOpen ? 'bg-green' : 'bg-amber'}`} />
            {settings.onlineOpen ? t('onlineOpenPill') : t('onlineClosedPill')}
          </Link>
        </div>
        <button className="btn-primary min-h-12 w-full px-5 sm:ml-auto sm:w-auto" onClick={() => setWalkIn(true)}>
          <Icon.Plus /> {t('addWalkIn')}
        </button>
      </div>

      {/* Barbers: one panel each, 3 in a row on tablet */}
      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {onDuty.map((b) => (
          <BarberCard key={b.id} barber={b} spots={spots} now={now} t={t} names={names} run={run} onNoShow={(spot) => setConfirm({ kind: 'noShow', spot })} />
        ))}
      </section>

      {/* Waiting list */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[17px] font-bold">{t('waitingList')}</h2>
          {waiting.some((s) => minsSince(s.createdAt, now) > LONG_WAIT_MIN) && (
            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-amber">
              <span className="h-2 w-2 rounded-sm bg-amber/60" /> &gt; {LONG_WAIT_MIN} {t('ringMin')}
            </span>
          )}
        </div>
        {waiting.length === 0 ? (
          <div className="panel grid min-h-40 place-items-center px-6 text-center display text-2xl text-ink-3">{t('nobodyWaiting')}</div>
        ) : (
          <div className="panel overflow-hidden">
            <div className="hidden grid-cols-[76px_1.4fr_1.6fr_1fr_90px_90px_100px] gap-3 border-b border-line px-4 py-2.5 text-[12px] font-bold text-ink-3 lg:grid">
              <span>{t('colToken')}</span>
              <span>{t('colName')}</span>
              <span>{t('colServices')}</span>
              <span>{t('colBarber')}</span>
              <span>{t('colWaiting')}</span>
              <span>{t('colEst')}</span>
              <span />
            </div>
            <ol className="divide-y divide-line">
              {waiting.map((s) => {
                const waited = minsSince(s.createdAt, now);
                const long = waited > LONG_WAIT_MIN;
                const eta = spotEta(s, spots, barbers, now);
                return (
                  <li
                    key={s.id}
                    className={`grid grid-cols-[64px_1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 lg:grid-cols-[76px_1.4fr_1.6fr_1fr_90px_90px_100px] ${
                      long ? 'bg-amber-soft' : ''
                    }`}
                  >
                    <span className="num row-span-3 text-[32px] text-navy lg:row-span-1">S-{s.token}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-bold">{s.name}</span>
                      {s.walkIn && <span className="mt-0.5 inline-block rounded bg-sunk px-1.5 py-0.5 text-[11px] font-bold text-ink-3">{t('walkInTag')}</span>}
                    </span>
                    <span className="col-start-2 truncate text-[13px] text-ink-3 lg:col-start-auto lg:text-[14px] lg:text-ink">
                      {s.services.map((x) => names.service(x)).join(', ')}
                    </span>
                    <span className="col-start-2 text-[13px] lg:col-start-auto lg:text-[14px]">
                      {s.prefBarber ? <span className="font-semibold">{barberName(s.prefBarber)}</span> : <span className="text-ink-3">{t('anyBarber')}</span>}
                      <span className="text-ink-3 lg:hidden">, {t('joinedAgo', { n: waited })}, {t('estShort', { n: eta.wait })}</span>
                    </span>
                    <span className={`hidden text-[14px] font-semibold lg:block ${long ? 'text-amber' : 'text-ink-3'}`}>{t('min', { n: waited })}</span>
                    <span className="hidden text-[14px] text-ink-3 lg:block">{t('estShort', { n: eta.wait })}</span>
                    <span className="col-start-3 row-span-3 row-start-1 justify-self-end lg:col-start-auto lg:row-span-1 lg:row-start-auto">
                      <button className="btn-danger min-h-11 px-3 text-sm" onClick={() => setConfirm({ kind: 'cancel', spot: s })}>
                        {t('cancel')}
                      </button>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </section>

      <Modal open={walkIn} onClose={() => setWalkIn(false)} title={t('walkInTitle')} wide>
        <JoinForm state={state} serverNow={serverNow} walkIn variant="modal" onResult={onWalkIn} toast={toast} />
      </Modal>

      <Confirm
        open={Boolean(confirm)}
        text={
          confirm &&
          (confirm.kind === 'cancel'
            ? t('confirmCancel', { token: `S-${confirm.spot.token}` })
            : t('confirmNoShow', { token: `S-${confirm.spot.token}` }))
        }
        no={t('no')}
        yes={t('yes')}
        onNo={() => setConfirm(null)}
        onYes={() => {
          const c = confirm;
          setConfirm(null);
          run(c.kind === 'cancel' ? 'cancel' : 'noShow', { id: c.spot.id });
        }}
      />
      {toastNode}
    </main>
  );
}

function BarberCard({ barber, spots, now, t, names, run, onNoShow }) {
  const st = barberState(barber, spots);
  const cur = currentOf(barber.id, spots);
  const check = callNextCheck(barber, spots);
  const calledMins = cur?.calledAt ? minsSince(cur.calledAt, now) : 0;

  return (
    <article className={`panel flex flex-col p-4 ${cur ? 'border-navy/30' : ''}`}>
      <header className="mb-3 flex items-center gap-3">
        <Avatar barber={barber} size={42} ring={cur?.status === STATUS.CALLED} />
        <div className="min-w-0 flex-1">
          <Link to={`/barber/${barber.id}`} className="text-[17px] font-bold hover:text-navy">{names.barber(barber)}</Link>
          <p className={`flex items-center gap-1.5 text-[13px] font-semibold ${STATE_TEXT[st]}`}>
            <Dot state={st} /> {t(`st_${st}`)}
          </p>
        </div>
      </header>

      <div className="min-h-[92px] flex-1 rounded-xl bg-sunk px-3.5 py-3">
        {cur && cur.status === STATUS.IN_CHAIR && (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate">
                <span className="num mr-2 text-[24px] text-navy">S-{cur.token}</span>
                <span className="text-[15px] font-semibold">{cur.name}</span>
              </p>
            </div>
            <p className="mt-0.5 truncate text-[13px] text-ink-3">{cur.services.map((x) => names.service(x)).join(', ')}</p>
            <TimeLeft spot={cur} now={now} t={t} />
          </>
        )}
        {cur && cur.status === STATUS.CALLED && (
          <>
            <p className="text-[15px] font-bold text-navy">{t('calledAgo', { token: `S-${cur.token}`, n: calledMins })}</p>
            <p className="truncate text-[13px] text-ink-3">{cur.name}, {cur.services.map((x) => names.service(x)).join(', ')}</p>
            {calledMins < NO_SHOW_AFTER_MIN && (
              <p className="mt-2 text-[12px] text-ink-3">{t('noShowIn', { n: NO_SHOW_AFTER_MIN - calledMins })}</p>
            )}
          </>
        )}
        {!cur && (
          <p className="text-[14px] text-ink-3">
            {st === 'break' ? (
              t('onBreakBanner')
            ) : check.ok ? (
              <>
                <span className="block text-[12px] font-bold text-ink-3">{t('nextForYou')}</span>
                <span className="num mr-2 text-[24px] text-ink">S-{check.spot.token}</span>
                <span className="font-semibold text-ink">{check.spot.name.split(' ')[0]}</span>
              </>
            ) : (
              t('noOneForYou')
            )}
          </p>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {!cur && (
          <button className="btn-primary col-span-2 min-h-12" disabled={!check.ok} onClick={() => run('callNext', { barberId: barber.id })}>
            {t('callNext')}
          </button>
        )}
        {cur?.status === STATUS.CALLED && (
          <>
            <button className="btn-primary min-h-12" onClick={() => run('start', { id: cur.id })}>{t('start')}</button>
            <button className="btn-danger min-h-12" disabled={calledMins < NO_SHOW_AFTER_MIN} onClick={() => onNoShow(cur)}>
              {t('noShow')}
            </button>
          </>
        )}
        {cur?.status === STATUS.IN_CHAIR && (
          <button className="btn-green col-span-2 min-h-12" onClick={() => run('done', { id: cur.id })}>{t('done')}</button>
        )}
      </div>
    </article>
  );
}

function TimeLeft({ spot, now, t }) {
  const left = minutesLeft(spot, now);
  const frac = Math.min(1, (now - spot.startedAt) / (spot.totalMin * 60000));
  return (
    <div className="mt-2.5">
      <div className="h-2 overflow-hidden rounded-full bg-white ring-1 ring-line-strong">
        <div className={`h-full rounded-full transition-[width] duration-1000 ${left === 0 ? 'bg-amber' : 'bg-navy'}`} style={{ width: `${frac * 100}%` }} />
      </div>
      <p className={`mt-1.5 text-right text-[12px] font-bold ${left === 0 ? 'text-amber' : 'text-ink-3'}`}>
        {left === 0 ? t('overTime') : t('timeLeft', { n: left })}
      </p>
    </div>
  );
}
