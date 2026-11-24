import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLang, useNames } from '../i18n/index.jsx';
import { useQueue } from '../lib/useQueue.js';
import { act, forgetMySpot, getMySpot } from '../lib/api.js';
import { STATUS, spotEta } from '../lib/queueRules.js';
import { Avatar, Confirm, CustomerShell, Icon, LangToggle, Loading, OfflineBar, useToast } from '../components/ui.jsx';

export default function Status() {
  const { id } = useParams();
  const { t } = useLang();
  const names = useNames();
  const { state, offline, refresh, serverNow } = useQueue({ spotId: id });
  const [asking, setAsking] = useState(false);
  const [toastNode, toast] = useToast();
  const lastStatus = useRef(null);
  const maxWait = useRef(0);
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

  if (!state) {
    return (
      <CustomerShell back="/" title={t('yourTicket')}>
        <OfflineBar offline={offline} />
        <Loading />
      </CustomerShell>
    );
  }

  if (!mine) {
    if (getMySpot() === id) forgetMySpot();
    return (
      <CustomerShell back="/" title={t('yourTicket')}>
        <Message title={t('notFound')} sub={t('notFoundSub')}>
          <Link to="/" className="btn-gold">{t('backHome')}</Link>
        </Message>
      </CustomerShell>
    );
  }

  const barberOf = (bid) => state.barbers.find((b) => b.id === bid);
  const token = `S-${mine.token}`;

  if (mine.status === STATUS.CALLED) {
    const b = barberOf(mine.barber);
    return (
      <main className="fixed inset-0 z-40 flex flex-col bg-gold px-6 pt-4 pb-10 text-gold-ink">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label={t('home')} className="grid h-11 w-11 place-items-center rounded-full bg-gold-ink/10">
            <Icon.Home />
          </Link>
          <div className="rounded-full bg-coal">
            <LangToggle />
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="token text-[44px] opacity-80">{token}</p>
          <h1 className="animate-pulse-soft mt-3 font-display text-[54px] leading-[0.98] font-semibold tracking-tight">{t('yourTurn')}</h1>
          <div className="mt-8 flex items-center gap-3 rounded-full bg-gold-ink py-2 pr-6 pl-2 text-gold">
            <Avatar barber={b} size={44} />
            <span className="text-[22px] font-bold">{t('goTo', { name: names.barber(b) })}</span>
          </div>
        </div>
      </main>
    );
  }

  if (mine.status === STATUS.IN_CHAIR) {
    return (
      <CustomerShell back="/" title={t('yourTicket')}>
        <Message token={token} title={t('inChair', { name: names.barber(barberOf(mine.barber)) })} />
      </CustomerShell>
    );
  }

  if (mine.status === STATUS.DONE) {
    return (
      <CustomerShell back="/" title={t('yourTicket')}>
        <Message token={token} title={t('thanks')}>
          <Link to="/" className="btn-gold" onClick={forgetMySpot}>{t('backHome')}</Link>
        </Message>
      </CustomerShell>
    );
  }

  if (mine.status === STATUS.CANCELLED || mine.status === STATUS.NO_SHOW) {
    return (
      <CustomerShell back="/" title={t('yourTicket')}>
        <Message muted token={token} title={mine.status === STATUS.CANCELLED ? t('cancelledCard') : t('noShowCard')}>
          <Link to="/join" className="btn-gold" onClick={forgetMySpot}>{t('joinAgain')}</Link>
        </Message>
      </CustomerShell>
    );
  }

  // Waiting
  const eta = spotEta(mine, state.spots, state.barbers, serverNow());
  maxWait.current = Math.max(maxWait.current, eta.wait, 5);
  const pref = barberOf(mine.prefBarber);
  const first = eta.position === 1;

  async function cancel() {
    setAsking(false);
    try {
      await act('cancel', { id: mine.id });
      refresh();
    } catch (err) {
      toast(t(`err_${err.code}`));
    }
  }

  return (
    <CustomerShell back="/" title={t('yourTicket')}>
      <OfflineBar offline={offline} />

      {eta.position === 2 && (
        <div className="animate-rise mt-2 mb-4 flex items-center gap-3 rounded-2xl border border-gold bg-gold/12 px-4 py-3.5">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-70" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-gold" />
          </span>
          <div>
            <p className="text-[17px] font-bold text-gold-soft">{t('startComing')}</p>
            <p className="text-[13px] text-mute">{t('startComingSub')}</p>
          </div>
        </div>
      )}

      <article className="ticket mt-2 mb-5" style={{ '--notch': 'var(--color-coal)' }}>
        <div className="flex items-center gap-4 px-5 pt-5 pb-5">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold tracking-[0.16em] text-ink-soft uppercase [:lang(gu)_&]:tracking-normal">
              {t('salonShort')} · {t('ticketLabel')}
            </p>
            <p className="token mt-1 text-[96px] text-ink">{token}</p>
            <p className="mt-2 text-[18px] font-bold">{first ? t('youAreNext') : t('inLine', { n: eta.position })}</p>
            {!first && <p className="text-[13px] font-medium text-ink-soft">{t('aheadOfYou', { n: eta.ahead })}</p>}
          </div>
          <Ring value={eta.wait} max={maxWait.current} first={first} t={t} />
        </div>
        <div className="perf" />
        <dl className="space-y-2.5 px-5 pt-4 pb-5 text-[15px]">
          <Row label={t('nameOnTicket')} value={mine.name} />
          <Row label={t('services')} value={mine.services.map((s) => names.service(s)).join(', ')} />
          <Row label={t('barber')} value={pref ? names.barber(pref) : t('anyBarber')} />
          <Row label={t('payAtSalon')} value={`₹${mine.totalPrice}`} strong />
        </dl>
        {pref?.onBreak && (
          <p className="flex items-center justify-center gap-2 rounded-b-[22px] bg-amber/25 px-4 py-3 text-[14px] font-bold text-[#6b4506]">
            <Icon.Coffee /> {t('onBreakNote', { name: names.barber(pref) })}
          </p>
        )}
      </article>

      <p className="mb-5 flex items-center justify-center gap-2 text-[13px] text-faint">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint" />
        {t('updatesLive')}
      </p>
      <button className="btn-ghost mb-10 w-full" onClick={() => setAsking(true)}>{t('cancelSpot')}</button>

      <Confirm open={asking} text={t('cancelQ')} no={t('keepSpot')} yes={t('yesCancel')} onNo={() => setAsking(false)} onYes={cancel} />
      {toastNode}
    </CustomerShell>
  );
}

/** Circular countdown: "about 35 min". */
function Ring({ value, max, first, t }) {
  const r = 50;
  const c = 2 * Math.PI * r;
  const frac = first && value === 0 ? 1 : Math.min(1, value / max);
  return (
    <div className="relative h-[124px] w-[124px] shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-ink/10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          className="text-gold transition-[stroke-dashoffset] duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-ink">
        {first && value === 0 ? (
          <Icon.Scissors width={32} height={32} />
        ) : (
          <>
            <span className="text-[11px] font-semibold text-ink-soft">{t('ringAbout')}</span>
            <span className="token text-[40px]">{value}</span>
            <span className="text-[11px] font-semibold text-ink-soft">{t('ringMin')}</span>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="shrink-0 text-ink-soft">{label}</dt>
      <span className="min-w-3 flex-1 translate-y-[-4px] border-b-[1.5px] border-dotted border-ink/20" />
      <dd className={`max-w-[60%] text-right ${strong ? 'text-[19px] font-extrabold' : 'font-semibold'}`}>{value}</dd>
    </div>
  );
}

function Message({ title, sub, token, muted, children }) {
  return (
    <div className={`ticket mt-6 px-6 pt-8 pb-8 text-center ${muted ? 'opacity-90' : ''}`}>
      {token && <p className={`token mb-4 text-[72px] ${muted ? 'text-ink-soft line-through decoration-4' : 'text-ink'}`}>{token}</p>}
      <p className="font-display text-[26px] leading-snug">{title}</p>
      {sub && <p className="mt-3 text-ink-soft">{sub}</p>}
      {children && <div className="mt-8">{children}</div>}
    </div>
  );
}
