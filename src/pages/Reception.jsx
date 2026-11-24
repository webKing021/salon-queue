import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang, useNames } from '../i18n/index.jsx';
import { useQueue, useTick } from '../lib/useQueue.js';
import { act, clearPin } from '../lib/api.js';
import {
  LONG_WAIT_MIN,
  NO_SHOW_AFTER_MIN,
  STATUS,
  barberState,
  callNextCheck,
  currentOf,
  minutesLeft,
  waitingList,
} from '../lib/queueRules.js';
import StaffGate from '../components/StaffGate.jsx';
import JoinForm from '../components/JoinForm.jsx';
import { Avatar, Confirm, Dot, Icon, LangToggle, Loading, Modal, OfflineBar, Wordmark, clockText, minsSince, useToast } from '../components/ui.jsx';

export default function Reception() {
  return (
    <StaffGate>
      <Dashboard />
    </StaffGate>
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
    clearPin();
    window.location.reload();
    return null;
  }

  const now = serverNow();
  const { barbers, spots } = state;
  const onDuty = barbers.filter((b) => b.onDuty);
  const waiting = waitingList(spots);
  const barberName = (id) => names.barber(barbers.find((b) => b.id === id));

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
    <div className="flex min-h-dvh flex-col">
      <OfflineBar offline={offline} />
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line bg-coal-deep px-5 py-3 lg:px-8">
        <Wordmark />
        <span className="hidden h-6 w-px bg-line-strong sm:block" />
        <span className="text-[15px] font-semibold text-mute">{t('reception')}</span>
        <span className="token text-lg text-ivory">{clockText(now)}</span>
        <span className="rounded-full bg-white/5 px-3 py-1 text-[14px] font-semibold">{t('waitingN', { n: waiting.length })}</span>
        <div className="ml-auto flex items-center gap-3">
          <button className="btn-gold" onClick={() => setWalkIn(true)}>
            <Icon.Plus /> {t('addWalkIn')}
          </button>
          <LangToggle />
          <button className="btn-quiet px-2" title={t('logout')} aria-label={t('logout')} onClick={() => { clearPin(); window.location.reload(); }}>
            <Icon.Lock />
          </button>
        </div>
      </header>

      <div className="grid flex-1 gap-5 p-5 md:grid-cols-[2fr_3fr] lg:p-8">
        {/* Barbers */}
        <section>
          <h2 className="eyebrow mb-3">{t('barbersOnDuty')}</h2>
          <div className="space-y-3">
            {onDuty.map((b) => {
              const st = barberState(b, spots);
              const cur = currentOf(b.id, spots);
              const check = callNextCheck(b, spots);
              const next = check.ok ? check.spot : null;
              return (
                <article key={b.id} className={`card p-4 ${st === 'break' ? 'opacity-70' : ''}`}>
                  <div className="flex items-center gap-3">
                    <Avatar barber={b} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[17px] font-semibold">{names.barber(b)}</p>
                      <p className="flex items-center gap-1.5 text-[13px] text-mute">
                        <Dot state={st} /> {t(`st_${st}`)}
                      </p>
                    </div>
                    {!cur && (
                      <button className="btn-gold min-h-12 px-5" disabled={!check.ok} onClick={() => run('callNext', { barberId: b.id })}>
                        {t('callNext')}
                      </button>
                    )}
                  </div>

                  {cur && cur.status === STATUS.IN_CHAIR && <InChair spot={cur} now={now} t={t} names={names} />}

                  {cur && cur.status === STATUS.CALLED && (
                    <div className="mt-4 flex items-center gap-3 rounded-xl bg-gold/10 px-3.5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-gold-soft">
                          {t('calledAgo', { token: `S-${cur.token}`, n: minsSince(cur.calledAt, now) })}
                        </p>
                        <p className="truncate text-[13px] text-mute">{cur.name}</p>
                      </div>
                      {minsSince(cur.calledAt, now) >= NO_SHOW_AFTER_MIN ? (
                        <button className="btn-danger min-h-10 px-3 text-sm" onClick={() => setConfirm({ kind: 'noShow', spot: cur })}>
                          {t('noShow')}
                        </button>
                      ) : (
                        <span className="shrink-0 text-[12px] text-faint">
                          {t('noShowIn', { n: NO_SHOW_AFTER_MIN - minsSince(cur.calledAt, now) })}
                        </span>
                      )}
                    </div>
                  )}

                  {!cur && (
                    <p className="mt-3 text-[13px] text-mute">
                      {st === 'break'
                        ? t('onBreakBanner')
                        : next
                          ? `${t('nextForYou')}: S-${next.token} ${next.name.split(' ')[0]}`
                          : t('noOneForYou')}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* Waiting list */}
        <section className="min-w-0">
          <h2 className="eyebrow mb-3">{t('waitingList')}</h2>
          {waiting.length === 0 ? (
            <div className="card grid min-h-48 place-items-center px-6 text-center font-display text-2xl text-mute">{t('nobodyWaiting')}</div>
          ) : (
            <div className="card overflow-hidden">
              <div className="hidden grid-cols-[72px_1.3fr_1.5fr_1fr_80px_92px] gap-3 border-b border-line px-4 py-2.5 text-[12px] font-semibold text-faint lg:grid">
                <span>{t('colToken')}</span>
                <span>{t('colName')}</span>
                <span>{t('colServices')}</span>
                <span>{t('colBarber')}</span>
                <span>{t('colWaiting')}</span>
                <span />
              </div>
              <ol className="divide-y divide-line">
                {waiting.map((s) => {
                  const waited = minsSince(s.createdAt, now);
                  const long = waited > LONG_WAIT_MIN;
                  return (
                    <li
                      key={s.id}
                      className={`grid grid-cols-[64px_1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 lg:grid-cols-[72px_1.3fr_1.5fr_1fr_80px_92px] ${
                        long ? 'bg-amber/12' : ''
                      }`}
                    >
                      <span className="token row-span-2 text-2xl text-gold lg:row-span-1">S-{s.token}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-semibold">{s.name}</span>
                        {s.walkIn && <span className="mt-0.5 inline-block rounded bg-white/8 px-1.5 py-0.5 text-[11px] font-semibold text-mute">{t('walkInTag')}</span>}
                      </span>
                      <span className="col-start-2 truncate text-[13px] text-mute lg:col-start-auto lg:text-[14px] lg:text-ivory">
                        {s.services.map((x) => names.service(x)).join(', ')}
                      </span>
                      <span className="col-start-2 text-[13px] lg:col-start-auto lg:text-[14px]">
                        {s.prefBarber ? barberName(s.prefBarber) : <span className="text-mute">{t('anyBarber')}</span>}
                      </span>
                      <span className={`col-start-2 text-[13px] font-semibold lg:col-start-auto lg:text-[14px] ${long ? 'text-amber' : 'text-mute'}`}>
                        {t('min', { n: waited })}
                      </span>
                      <span className="col-start-3 row-span-2 row-start-1 justify-self-end lg:col-start-auto lg:row-span-1 lg:row-start-auto">
                        <button className="btn-danger min-h-10 px-3 text-sm" onClick={() => setConfirm({ kind: 'cancel', spot: s })}>
                          {t('cancel')}
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
          <p className="mt-4 text-[13px] text-faint">
            <Link className="underline underline-offset-4 hover:text-ivory" to="/display">TV</Link>
            {' · '}
            <Link className="underline underline-offset-4 hover:text-ivory" to="/admin">{t('admin')}</Link>
            {' · '}
            {onDuty.map((b, i) => (
              <span key={b.id}>
                {i > 0 && ' · '}
                <Link className="underline underline-offset-4 hover:text-ivory" to={`/barber/${b.id}`}>{names.barber(b)}</Link>
              </span>
            ))}
          </p>
        </section>
      </div>

      <Modal open={walkIn} onClose={() => setWalkIn(false)} title={t('walkInTitle')} wide>
        <JoinForm state={state} serverNow={serverNow} walkIn variant="modal" onResult={onWalkIn} toast={toast} />
      </Modal>

      <Confirm
        open={Boolean(confirm)}
        text={confirm && (confirm.kind === 'cancel' ? t('confirmCancel', { token: `S-${confirm.spot.token}` }) : t('confirmNoShow', { token: `S-${confirm.spot.token}` }))}
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
    </div>
  );
}

function InChair({ spot, now, t, names }) {
  const left = minutesLeft(spot, now);
  const frac = Math.min(1, (now - spot.startedAt) / (spot.totalMin * 60000));
  return (
    <div className="mt-4 rounded-xl bg-coal px-3.5 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-[15px]">
          <span className="token mr-2 text-lg text-gold">S-{spot.token}</span>
          <span className="font-semibold">{spot.name}</span>
        </p>
        <span className={`shrink-0 text-[13px] font-semibold ${left === 0 ? 'text-amber' : 'text-mute'}`}>
          {left === 0 ? t('overTime') : t('timeLeft', { n: left })}
        </span>
      </div>
      <p className="mt-0.5 truncate text-[13px] text-mute">{spot.services.map((x) => names.service(x)).join(', ')}</p>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div className={`h-full rounded-full ${left === 0 ? 'bg-amber' : 'bg-gold'}`} style={{ width: `${frac * 100}%` }} />
      </div>
    </div>
  );
}
