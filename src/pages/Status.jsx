import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLang, useNames } from '../i18n/index.jsx';
import { useQueue } from '../lib/useQueue.js';
import { act, forgetMySpot, getMySpot } from '../lib/api.js';
import { STATUS, spotEta } from '../lib/queueRules.js';
import { Confirm, Loading, OfflineBar, PhoneBar, useToast, LangToggle } from '../components/ui.jsx';

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
      navigator.vibrate?.([400, 150, 400, 150, 600]);
    }
    lastStatus.current = mine.status;
  }, [mine]);

  if (!state) {
    return (
      <Shell>
        <OfflineBar offline={offline} />
        <Loading />
      </Shell>
    );
  }

  if (!mine) {
    if (getMySpot() === id) forgetMySpot();
    return (
      <Shell>
        <PhoneBar back="/" title="" />
        <Message title={t('notFound')} sub={t('notFoundSub')}>
          <Link to="/" className="btn-gold">{t('backHome')}</Link>
        </Message>
      </Shell>
    );
  }

  const barberOf = (bid) => state.barbers.find((b) => b.id === bid);
  const token = `S-${mine.token}`;

  if (mine.status === STATUS.CALLED) {
    return (
      <main className="fixed inset-0 z-40 flex flex-col bg-gold px-6 pt-5 pb-10 text-gold-ink">
        <div className="flex justify-end">
          <div className="rounded-full bg-coal/90"><LangToggle /></div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="token mb-4 text-3xl opacity-70">{token}</p>
          <h1 className="animate-pulse-soft font-display text-[56px] leading-[0.95] font-semibold tracking-tight">{t('yourTurn')}</h1>
          <p className="mt-6 text-2xl font-semibold">{t('goTo', { name: names.barber(barberOf(mine.barber)) })}</p>
        </div>
      </main>
    );
  }

  if (mine.status === STATUS.IN_CHAIR) {
    return (
      <Shell>
        <PhoneBar back="/" title="" />
        <Message title={t('inChair', { name: names.barber(barberOf(mine.barber)) })} token={token} />
      </Shell>
    );
  }

  if (mine.status === STATUS.DONE) {
    return (
      <Shell>
        <PhoneBar back="/" title="" />
        <Message title={t('thanks')} token={token}>
          <Link to="/" className="btn-gold" onClick={forgetMySpot}>{t('backHome')}</Link>
        </Message>
      </Shell>
    );
  }

  if (mine.status === STATUS.CANCELLED || mine.status === STATUS.NO_SHOW) {
    return (
      <Shell>
        <PhoneBar back="/" title="" />
        <Message
          muted
          token={token}
          title={mine.status === STATUS.CANCELLED ? t('cancelledCard') : t('noShowCard')}
        >
          <Link to="/join" className="btn-gold" onClick={forgetMySpot}>{t('joinAgain')}</Link>
        </Message>
      </Shell>
    );
  }

  // Waiting
  const eta = spotEta(mine, state.spots, state.barbers, serverNow());
  maxWait.current = Math.max(maxWait.current, eta.wait, 5);
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

  return (
    <Shell>
      <OfflineBar offline={offline} />
      <PhoneBar back="/" title="" />

      {eta.position === 2 && (
        <div className="animate-rise mb-5 rounded-2xl bg-gold px-5 py-4 text-gold-ink">
          <p className="text-lg font-bold">{t('startComing')}</p>
          <p className="text-[14px] opacity-80">{t('startComingSub')}</p>
        </div>
      )}

      <section className="text-center">
        <p className="eyebrow">{t('yourToken')}</p>
        <p className="token mt-1 text-[88px] leading-none text-gold">{token}</p>
        <p className="mt-3 text-xl font-semibold">
          {eta.position === 1 ? t('youAreNext') : t('inLine', { n: eta.position })}
        </p>
      </section>

      <Ring value={eta.wait} max={maxWait.current} first={eta.position === 1} t={t} />

      {pref?.onBreak && (
        <p className="mb-4 rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-center text-[15px] font-semibold text-amber">
          {t('onBreakNote', { name: names.barber(pref) })}
        </p>
      )}

      <section className="card mb-6 divide-y divide-line">
        <p className="eyebrow px-5 pt-4 pb-3">{t('details')}</p>
        <Row label={t('services')} value={mine.services.map((s) => names.service(s)).join(', ')} />
        <Row label={t('barber')} value={pref ? names.barber(pref) : t('anyBarber')} />
        <Row label={t('payAtSalon')} value={`₹${mine.totalPrice}`} strong />
      </section>

      <button className="btn-ghost mb-3 w-full" onClick={() => setAsking(true)}>{t('cancelSpot')}</button>
      <p className="pb-10 text-center text-[13px] text-faint">{t('updatesLive')}</p>

      <Confirm
        open={asking}
        text={t('cancelQ')}
        no={t('keepSpot')}
        yes={t('yesCancel')}
        onNo={() => setAsking(false)}
        onYes={cancel}
      />
      {toastNode}
    </Shell>
  );
}

function Ring({ value, max, first, t }) {
  const r = 84;
  const c = 2 * Math.PI * r;
  const frac = first && value === 0 ? 1 : Math.min(1, value / max);
  return (
    <div className="relative mx-auto my-8 h-[200px] w-[200px]">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-line-strong" />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          className="text-gold transition-[stroke-dashoffset] duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {first && value === 0 ? (
          <p className="px-6 text-center font-display text-2xl leading-tight">{t('youAreNext')}</p>
        ) : (
          <>
            <p className="text-[13px] text-mute">{t('ringAbout')}</p>
            <p className="token text-6xl leading-none">{value}</p>
            <p className="text-[13px] text-mute">{t('ringMin')}</p>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-5 py-3.5">
      <span className="shrink-0 text-[14px] text-mute">{label}</span>
      <span className={`text-right ${strong ? 'text-lg font-bold text-gold-soft' : 'text-[15px] font-medium'}`}>{value}</span>
    </div>
  );
}

function Message({ title, sub, token, muted, children }) {
  return (
    <div className={`card mt-10 px-6 py-12 text-center ${muted ? 'opacity-90' : ''}`}>
      {token && <p className={`token mb-4 text-5xl ${muted ? 'text-mute line-through decoration-2' : 'text-gold'}`}>{token}</p>}
      <p className="font-display text-[26px] leading-snug">{title}</p>
      {sub && <p className="mt-3 text-mute">{sub}</p>}
      {children && <div className="mt-8">{children}</div>}
    </div>
  );
}

function Shell({ children }) {
  return <main className="mx-auto min-h-dvh max-w-[480px] px-5">{children}</main>;
}
