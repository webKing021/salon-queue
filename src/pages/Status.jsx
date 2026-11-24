import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLang, useNames } from '../i18n/index.jsx';
import { useQueue } from '../lib/useQueue.js';
import { act, forgetMySpot, getMySpot } from '../lib/api.js';
import { STATUS, spotEta } from '../lib/queueRules.js';
import { Avatar, Confirm, CustomerShell, Icon, LangToggle, Loading, OfflineBar, Pole, useToast } from '../components/ui.jsx';

export default function Status() {
  const { id } = useParams();
  const { t } = useLang();
  const names = useNames();
  const { state, offline, refresh, serverNow } = useQueue({ spotId: id });
  const [asking, setAsking] = useState(false);
  const [toastNode, toast] = useToast();
  const lastStatus = useRef(null);
  const startWait = useRef(0);
  const mine = state?.mine;

  // Vibrate when the customer is called.
  useEffect(() => {
    if (!mine) return;
    if (mine.status === STATUS.CALLED && lastStatus.current !== STATUS.CALLED) {
      try {
        navigator.vibrate?.([400, 150, 400, 150, 600]);
      } catch {
        /* not supported */
      }
    }
    lastStatus.current = mine.status;
  }, [mine]);

  const shell = (children) => (
    <CustomerShell back="/" title={t('yourTicket')}>
      <OfflineBar offline={offline} />
      {children}
    </CustomerShell>
  );

  if (!state) return shell(<Loading />);

  if (!mine) {
    if (getMySpot() === id) forgetMySpot();
    return shell(
      <Message title={t('notFound')} sub={t('notFoundSub')}>
        <Link to="/" className="btn-primary">{t('backHome')}</Link>
      </Message>,
    );
  }

  const barberOf = (bid) => state.barbers.find((b) => b.id === bid);
  const token = `S-${mine.token}`;

  if (mine.status === STATUS.CALLED) {
    const b = barberOf(mine.barber);
    return (
      <main className="fixed inset-0 z-40 flex flex-col bg-red px-6 pt-4 pb-10 text-white">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label={t('home')} className="grid h-11 w-11 place-items-center rounded-full bg-white/15 hover:bg-white/25">
            <Icon.Home />
          </Link>
          <LangToggle dark />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="num text-[56px] text-white/85">{token}</p>
          <h1 className="display animate-beat mt-4 text-[56px] leading-[0.95] sm:text-[72px]">{t('yourTurn')}</h1>
          <div className="mt-10 flex items-center gap-3 rounded-full bg-white py-2 pr-6 pl-2 text-navy shadow-xl shadow-black/20">
            <Avatar barber={b} size={48} />
            <span className="text-[22px] font-semibold">{t('goTo', { name: names.barber(b) })}</span>
          </div>
        </div>
      </main>
    );
  }

  if (mine.status === STATUS.IN_CHAIR) {
    return shell(<Message token={token} title={t('inChair', { name: names.barber(barberOf(mine.barber)) })} />);
  }

  if (mine.status === STATUS.DONE) {
    return shell(
      <Message token={token} title={t('thanks')}>
        <Link to="/" className="btn-primary" onClick={forgetMySpot}>{t('backHome')}</Link>
      </Message>,
    );
  }

  if (mine.status === STATUS.CANCELLED || mine.status === STATUS.NO_SHOW) {
    return shell(
      <Message muted token={token} title={mine.status === STATUS.CANCELLED ? t('cancelledCard') : t('noShowCard')}>
        <Link to="/join" className="btn-primary" onClick={forgetMySpot}>{t('joinAgain')}</Link>
      </Message>,
    );
  }

  // Waiting
  const eta = spotEta(mine, state.spots, state.barbers, serverNow());
  if (!startWait.current) startWait.current = Math.max(eta.wait, 5);
  startWait.current = Math.max(startWait.current, eta.wait);
  const first = eta.position === 1;
  // The pole fills up as the customer's turn gets closer.
  const progress = first ? 1 : Math.max(0.2, 1 - eta.wait / startWait.current);
  const pref = barberOf(mine.prefBarber);

  async function cancel() {
    setAsking(false);
    try {
      await act('cancel', { id: mine.id });
      refresh();
    } catch (err) {
      toast(t(`err_${err.code}`));
    }
  }

  return shell(
    <>
      {eta.position === 2 && (
        <div role="status" className="animate-rise mt-4 rounded-2xl bg-navy px-5 py-4 text-white">
          <p className="text-[19px] font-semibold">{t('startComing')}</p>
          <p className="text-[15px] text-white/75">{t('startComingSub')}</p>
        </div>
      )}

      <section className="flex gap-6 pt-7 pb-8" aria-label={t('progressLabel')}>
        <Pole height={236} width={26} spinning fill={progress} />
        <div className="flex min-w-0 flex-col justify-between py-1">
          <div>
            <p className="text-[16px] text-ink-3">{t('yourToken')}</p>
            <p className="num text-[104px] text-navy">{token}</p>
          </div>
          <div>
            <p className="text-[22px] leading-tight font-semibold">{first ? t('youAreNext') : t('inLine', { n: eta.position })}</p>
            {!first && <p className="text-[16px] text-ink-3">{t('aheadOfYou', { n: eta.ahead })}</p>}
          </div>
          {!(first && eta.wait === 0) && (
            <p className="text-[18px] text-ink-2">
              {t('ringAbout')} <span className="num text-[44px] text-ink">{eta.wait}</span> {t('ringMin')}
            </p>
          )}
        </div>
      </section>

      {pref?.onBreak && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-amber-soft px-4 py-3 text-[16px] font-semibold text-amber">
          <Icon.Coffee /> {t('onBreakNote', { name: names.barber(pref) })}
        </p>
      )}

      <dl className="panel mb-5 divide-y divide-line px-5 text-[16px]">
        <Row label={t('nameOnTicket')} value={mine.name} />
        <Row label={t('services')} value={mine.services.map((s) => names.service(s)).join(', ')} />
        <Row label={t('barber')} value={pref ? names.barber(pref) : t('anyBarber')} />
        <Row label={t('payAtSalon')} value={`₹${mine.totalPrice}`} strong />
      </dl>

      <p className="mb-5 flex items-center justify-center gap-2 text-[14px] text-ink-3">
        <span className="h-2 w-2 animate-pulse rounded-full bg-green" />
        {t('updatesLive')}
      </p>
      <button className="btn-danger mb-10 w-full" onClick={() => setAsking(true)}>{t('cancelSpot')}</button>

      <Confirm open={asking} text={t('cancelQ')} no={t('keepSpot')} yes={t('yesCancel')} onNo={() => setAsking(false)} onYes={cancel} />
      {toastNode}
    </>,
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3.5">
      <dt className="shrink-0 text-ink-3">{label}</dt>
      <dd className={`text-right ${strong ? 'text-[20px] font-bold' : 'font-medium'}`}>{value}</dd>
    </div>
  );
}

function Message({ title, sub, token, muted, children }) {
  return (
    <div className="panel mt-8 px-6 py-12 text-center">
      {token && <p className={`num mb-5 text-[80px] ${muted ? 'text-ink-3 line-through decoration-[6px]' : 'text-navy'}`}>{token}</p>}
      <p className="display text-[28px] leading-tight">{title}</p>
      {sub && <p className="mt-3 text-ink-3">{sub}</p>}
      {children && <div className="mt-8">{children}</div>}
    </div>
  );
}
